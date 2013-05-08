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
        console.log("Receive job %s %j", workflowConfig.name, job.data );
        var wf = new Workflow(
            util.extend (true, {}, workflowConfig ), {
                job: job
        });
    //	wf.data.job = job;
    //	wf.data.done = done;
        wf.on( 'completed', self.onCompleted(job,done).bind( self ) );
        wf.on( 'failed', self.onFailed(job,done).bind( self ) );
        wf.run();
    });
};

worker.prototype.onCompleted = function( job, done ) {
    return function( wf ) {
        var result = wf[ wf.$backdata ];
        if ( !Workflow.isEmpty(result) ) {
            console.log( "Completed with data! '%j', '%j', %j", result, wf.$backdata, wf );
            job.set( 'data' , JSON.stringify(result), done );
        } else {
            done();
        }
    }.bind( this );
};

worker.prototype.onFailed = function( job, done ) {
    return function( wf ) {
        done( { error: 'failed', wf: wf } );
    }.bind( this );
};