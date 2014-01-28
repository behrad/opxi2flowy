var EventEmitter   = require('events').EventEmitter,
	util = require('util'),
    opxi2 = require( 'opxi2node'),
	Workflow = require('dataflo.ws/workflow');

var worker = module.exports = function (config) {
	this.config = util.extend( {}, worker.defaultConfig );
	if (config) {
		util.extend(this.config, config);
	}
	if( this.config ) {
		this.ready();
	}
};

worker.defaultConfig = {
	verbose: true,
    concurrency: opxi2.CONFIG.core.concurrency
};

var HOUSE_KEEPING_INTERVAL = (24*60*60*1000);

util.inherits( worker, EventEmitter );

worker.prototype.ready = function () {
	var self = this;
    self.workflow_job_map = {};
    setInterval( self.flow_housekeeping.bind( self ), HOUSE_KEEPING_INTERVAL );
	self.config.workflows.forEach( function ( cfg ) {
		self.listen( cfg );
	});
	this.emit( 'ready', this );
};

/**
 * Creates Kue consumers to process jobs
 *
 * @param workflowConfig
 *  name: the job's name to process
 *  concurrency: the process concurrency of jobs
 *
 * Started workflow will have access to:
 *  job: the created job object
 */
worker.prototype.listen = function( workflowConfig ) {
    var self = this;
    opxi2.log("Started flow worker %s(%d)", workflowConfig.name, workflowConfig.concurrency );
    opxi2.taskq.process( workflowConfig.name, workflowConfig.concurrency, function (job, done) {
        job.current_attempt = Number(job._attempts)+1 || 1;
        job.first_attempt = (job.current_attempt==1);
        job.last_attempt = (job.current_attempt === Number(job._max_attempts));
        var wf = new Workflow( util.extend(true, {quiet: !opxi2.CONFIG.flows.verbose}, workflowConfig ), {
            name: workflowConfig.name,
            job: job
        });
        self.workflow_job_map[ job.id ] = wf;
        wf.on( 'completed', self.onCompleted(job,done).bind( self ) );
        wf.on( 'failed', self.onFailed(job,done).bind( self ) );
        opxi2.log("Start flow %s for job %s(%s)", wf.id, workflowConfig.name, job.id );
        wf.run();
    });

//    if( workflowConfig.cancelable ) {
    self.process_cancels( workflowConfig );
    self.subscribe_for_flow_cancels( workflowConfig );
//    }
};

worker.prototype.cancelFlow = function( jobId ) {
    var wf = this.workflow_job_map[ jobId /*job.data.job_id*/ ];
    if( wf ) {
        opxi2.log( "Canceling flow %s with id %s by %s ", wf.name, wf.id, jobId );
        wf.tasks.forEach( function( task ){
            task.cancel();
        });
        return true;
    }
    return false;
};

worker.prototype.subscribe_for_flow_cancels = function( config ) {
    var self = this;
    var broker = opxi2.brokerClient();
    broker.on( "message", function( channel, message ) {
        self.cancelFlow( message );
    });
    broker.on( "subscribe", function() {} );
    broker.on( "unsubscribe", function() {} );
    broker.subscribe( "opxi2.flowy.cancel." + config.name );
    return broker;
};

var broker = opxi2.brokerClient();

worker.prototype.process_cancels = function( config ) {
    opxi2.taskq.process( 'cancel-' + config.name, config.concurrency, function(job, done) {
        if( !job.data.job_id ) {
            return done( {error: true, message: "No job_id specified" } );
        }
        opxi2.log( "Got Cancel flowjob " + 'cancel-' + config.name + "("+job.id+") for (" + job.data.job_id + ")" );
        if( !this.cancelFlow( job.data.job_id ) ) {
            broker.publish( "opxi2.flowy.cancel."+config.name, job.data.job_id, function(err){ err && opxi2.log( err ); });
        }
        opxi2.kue.Job.get( job.data.job_id, function( err, to_be_canceled_job ){
            if( err ) {
                return job.set( 'data' , JSON.stringify({message: "No job to be canceled for id " + job.data.job_id, reason: err }), done );
            }
            // should we check to_be_canceled_job.toJSON().state == "delayed" !?
            to_be_canceled_job.log( "Canceled by " + job.id );
            if( to_be_canceled_job.toJSON().state != 'complete' && to_be_canceled_job.toJSON().state != 'failed' ) {
                opxi2.log("Canceled job %s(%s) (in state %s) by %s ", config.name, job.data.job_id, to_be_canceled_job.toJSON().state, job.id );
                to_be_canceled_job.complete();
            }
            done();
        });
    }.bind( this ));
};

worker.prototype.onCompleted = function( job, done ) {
    return function( wf ) {
        if( wf.$backdata ) {
            var result = this.getProperty( wf.data, wf.$backdata );
            var check = result, checkName = wf.$backdata;
            if( wf.$failcheck ) {
                check = this.getProperty( wf.data, wf.$failcheck );
                checkName = wf.$failcheck;
            }
            if ( !Workflow.isEmpty(check) ) { // Workflows condition is satisfied
                opxi2.log( "Worker flow %s(%s) completed with id %s", wf.name, job.id, wf.id );
                result.flow_id = wf.id;
                job.set( 'data' , JSON.stringify(result), done );
            } else { // Workflows condition is not satisfied
                /*if( Number(job._max_attempts) == 1 ) {
                    opxi2.log( "Worker flow %s backdata failed %j=%j on one-try job", wf.name, checkName, check );
                    done( { error: true, message: 'Worker '+job.type+', backdata '+checkName+' failed' } );
                } else*/ if( job.last_attempt ) { // We are in job's last try! mark job Finished!
                    opxi2.log( "Worker flow %s backdata failed %j=%j, set last attempt data", wf.name, checkName, check );
                    var errMsg = { message: 'Flow '+job.type+'('+wf.id+') backdata \''+checkName+'\' failed' };
                    job.set( 'data' , JSON.stringify( util.extend( true, errMsg, result ) ), done );
                } else { // Job still has retries available, flow's condition is failed!
                    opxi2.log( "Worker flow %s backdata failed %j=%j, but is not its last attempt", wf.name, checkName, check );
                    if( Number(job.delay()) > 0 ) { // This was a delayed job worker, fix for delayed retry!
                        job.error( { error: true, message: 'Flow '+job.type+'('+wf.id+') backdata \''+checkName+'\' failed' } );
                        done(); // prevent the job from being failed, and then inactive by Kue!
                        job.attempt( function(error, remaining, attempts, max) {
                            if (error) return opxi2.log( error );
                            if( remaining > 0 ) {
                                // Mark job as delayed by hand!
                                job.delay( Number(job.delay()) ).update();
                            }
                        });
                    } else { // No-delay job worker: fail the job so another worker retries...
                        done( { error: true, message: 'Flow '+job.type+'('+wf.id+') backdata \''+checkName+'\' failed' } );
                    }
                }
            }
        } else { // Simple workflow without any condition finished!
            opxi2.log( "Worker %s(%s)'s flow completed", wf.name, job.id );
            job.get( 'data', function(error, result) {
                if( !error && result ) {
                    result.flow_id = wf.id;
                    job.set( 'data' , JSON.stringify(result), done );
                } else {
                    done( error );
                }
            });
        }
        delete this.workflow_job_map[ job.id ];
        this.workflow_job_map[ job.id ] = undefined;
    }.bind( this );
};

worker.prototype.onFailed = function( job, done ) {
    return function( wf ) {
        job.data.flow_id = wf.id;
        var err = wf.error; // The object or string you passed to task.failed()
        if( !err ) { // no error object :o! so this should be a canceled flow
            opxi2.log( "Worker %s(%s)'s flow %s canceled?", job.type, job.id, wf.id );
            err = { canceled: true, message: job.type + "'s flow "+wf.id+" canceled!?"};
        } else {
            opxi2.log( "Worker %s(%s)'s flow %s failed", job.type, job.id, wf.id );
            if( err && err.length && err.split ) { // passed error is string
                err = { error: true, message: wf.id + ' flow error: ' + wf.error };
            }/* else if( err && err.error == undefined ) { // passed error is object
                err = { error: true, message: job.type + '\'s flow error: ' + JSON.stringify( err ) };
            }*/
        }

        if( wf.fail_on_fail ) {
            done( err );
        } else {
            job.set( 'data' , JSON.stringify( util.extend( true, job.data, err ) ), done );
        }
        delete this.workflow_job_map[ job.id ];
        this.workflow_job_map[ job.id ] = undefined;
    }.bind( this );
};

worker.prototype.flow_housekeeping = function () {
    opxi2.log( "Start worker flow initiator housekeeping..." );
    var clean_to = new Date().getTime() - HOUSE_KEEPING_INTERVAL;
//    this.workflow_job_map.forEach( function( flow, i ) {
    for( var i in this.workflow_job_map ){
        var flow = this.workflow_job_map[ i ];
        if( flow && flow.created < clean_to ) {
            if( flow.stopped ) {
                delete this.workflow_job_map[ i ];
                this.workflow_job_map[ i ] = undefined;
            } else {
                opxi2.log( "Flow(%s) could not be housekeeped (is running?)", flow.id );
            }
        }
    }
//        opxi2.log( "Flow %d(%s to %s): ready:%s, idle:%s, haveCompletedTasks:%s", flow.id, flow.created, flow.stopped, flow.ready, flow.isIdle, flow.haveCompletedTasks );
//    }.bind( this ));
};

worker.prototype.getProperty = function (obj, path) {
        var val = obj;
        var hasProp = path.split('.').every(function (prop) {
                val = val[prop];
                return null != val;
        });
        return hasProp ? val : undefined;
};
