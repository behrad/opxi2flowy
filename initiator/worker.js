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

util.inherits( worker, EventEmitter );

worker.prototype.ready = function () {
	var self = this;
    self.workflow_job_map = [];
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
    opxi2.taskq.process( workflowConfig.name, workflowConfig.concurrency, function (job, done) {
        console.log("Receive job %s(%s): %j", workflowConfig.name, job.id, job.data );
        job.current_attempt = Number(job._attempts)+1 || 1;
        job.last_attempt = (job.current_attempt === Number(job._max_attempts));
        var wf = new Workflow( util.extend(true, {}, workflowConfig ), {
            name: workflowConfig.name,
            job: job
        });
        self.workflow_job_map[ job.id ] = wf;
        wf.on( 'completed', self.onCompleted(job,done).bind( self ) );
        wf.on( 'failed', self.onFailed(job,done).bind( self ) );
        wf.run();
    });

//    if( workflowConfig.cancelable ) {
        self.process_cancels( workflowConfig );
//    }
};

worker.prototype.process_cancels = function( config ) {
    var self = this;
    opxi2.taskq.process( 'cancel-' + config.name, config.concurrency, function(job, done) {
        if( !job.data.job_id ) {
            return done( {error: true, message: "No job_id specified." } );
        }
        var wf = self.workflow_job_map[ job.data.job_id ];
        if( wf ) {
            console.log("Canceling workflow %s with id %s ", config.name, wf.id );
            wf.tasks.forEach( function( task ){
                task.cancel();
            });
            done();
        } else {
            // TODO remove job_id if it is in delay mode!!!
            opxi2.kue.Job.get( job.data.job_id, function( err, to_be_canceled_job ){
                if( err ) {
                    return done( {error: true, message: "No workflow/job to be canceled for job id " + job.data.job_id } );
                }
                // should we check to_be_canceled_job.toJSON().state == "delayed" !?
                console.log("Canceling Job %s (in state %s) with id %s ", config.name, to_be_canceled_job.toJSON().state, job.data.job_id );
                to_be_canceled_job.error( "Canceled" );
                to_be_canceled_job.failed();
                done();
                /*job.remove( function() {
                    console.log("Deleted Job %s with id %s ", config.name, job.data.job_id );
                    done();
                });*/
            });
        }
    });
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
            if ( !Workflow.isEmpty(check) ) {
                console.log( "Worker flow %s completed with backdata %j=%j", wf.name, wf.$backdata, result );
//                result.flow = wf;
                job.set( 'data' , JSON.stringify(result), done );
            } else {
                if( job.last_attempt ) {
                    var errMsg = { error: true, message: 'Worker '+job.type+', backdata '+checkName+' failed' };
                    console.log( "Worker flow %s backdata failed %j=%j, set last attempt data=", wf.name, checkName, check, util.extend( true, errMsg, result ) );
                    job.set( 'data' , JSON.stringify( util.extend( true, errMsg, result ) ), done );
                } else {
                    console.log( "Worker flow %s backdata failed %j=%j, but is not its last attempt", wf.name, checkName, check );
                    done( { error: true, message: 'Worker '+job.type+', backdata '+checkName+' failed' } );
                }
            }
        } else {
            console.log( "Worker flow %s completed: %j", wf.name, {job_id: job.id} );
            job.set( 'data' , JSON.stringify({
//                flow: wf,
                job_id: job.id
            }), done );
        }
    }.bind( this );
};

worker.prototype.onFailed = function( job, done ) {
    return function( wf ) {
        console.log( "Worker flow %s failed: ", job.type );
        var err = wf.error;
        if( err && err.length && err.split ) {
            err = { error: true, message: job.type + ': ' + wf.error };
        } else if( err && err.error == undefined ) {
            err = { error: true, message: job.type + ': ' + JSON.stringify( err ) };
        } else if( !err ) {
            err = { error: true, message: job.type + " flow with id "+wf.id+" failed"};
        }
        job.set( 'data' , JSON.stringify( err ), done );
    }.bind( this );
};

worker.prototype.getProperty = function (obj, path) {
        var val = obj;
        var hasProp = path.split('.').every(function (prop) {
                val = val[prop];
                return null != val;
        });
        return hasProp ? val : undefined;
};
