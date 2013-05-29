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
        console.log("Receive job(%s): %s=%j", job.id, workflowConfig.name, job.data );
        job.last_attempt = (Number(job._attempts) + 1) == Number(job._max_attempts);
        job.current_attempt = job._attempts;
        var wf = new Workflow(
            util.extend (true, {}, workflowConfig ), {
                job: job
        });
    //	wf.data.job = job;
    //	wf.data.done = done;
        wf.on( 'completed', self.onCompleted(job,done).bind( self ) );
        wf.on( 'failed', self.onFailed(job,done).bind( self ) );
        wf.run();
        self.workflow_job_map[ job.id ] = wf;
    });
    if( workflowConfig.cancelable ) {
        self.process_cancels( workflowConfig );
    }

};

worker.prototype.process_cancels = function( config ) {
    var self = this;
    opxi2.taskq.process( 'cancel-' + config.name, config.concurrency, function (job, done) {
        if( !job.data.job_id ) {
            return done( {error: true, message: "No job_id specified." } );
        }
        var wf = self.workflow_job_map[ job.data.job_id ];
        if( wf ) {
            console.log("Canceling workflow %s ", wf.id );
            wf.tasks.forEach( function( task ){
                task.cancel();
            });
            done();
        } else {
            done( {error: true, message: "No workflow available for " + job.data.job_id } );
        }
    });
};

worker.prototype.onCompleted = function( job, done ) {
    return function( wf ) {
        if( wf.$backdata ) {
            var result = this.getProperty( wf.data, wf.$backdata );
            console.log( "Worker completed with data %j=%j", wf.$backdata, result );
            var check = result, checkName = wf.$backdata;
            if( wf.$failcheck ) {
                check = this.getProperty( wf.data, wf.$failcheck );
                checkName = wf.$failcheck;
            }
            if ( !Workflow.isEmpty(check) ) {
                job.set( 'data' , JSON.stringify(result), done );
            } else {
                job.set( 'data' , JSON.stringify(result), function(){
                    done( { error: true, message: 'Job back data failed for '+checkName, flowId: wf.id } );
                });

            }
        } else {
            job.set( 'data' , JSON.stringify({job_id: job.id}), done );
        }

    }.bind( this );
};

worker.prototype.onFailed = function( job, done ) {
    return function( wf ) {
        console.log( "Failed workflow '%j'", wf );
        done( { error: true, message: 'flow failed', flowId: wf.id } );
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
