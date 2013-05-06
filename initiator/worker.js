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
    opxi2.taskq.process( workflowConfig.name, workflowConfig.concurrency, function (job, done) {
        console.log("Receive job %s %j", workflowConfig.name, job.data );
        var wf = new Workflow(
            util.extend (true, {}, workflowConfig ), {
                job: job
        });
    //	wf.data.job = job;
    //	wf.data.done = done;
        wf.on( 'completed', this.onCompleted(job,done).bind( this ) );
        wf.on( 'failed', this.onFailed(job,done).bind( this ) );
        wf.run();
    });
};

worker.prototype.onCompleted = function( job, done ) {
    console.log( "Completeeeeeeeeeeeeeeeed! ");
    return function( wf ) {
        var result = wf[this.$backdata];
        if ( !Workflow.isEmpty(result) ) {
            job.set( 'data' , JSON.stringify( result ), done );
        } else {
            done();
        }
    }.bind( this );
};

worker.prototype.onFailed = function( job, done ) {
    console.log( "Faiiiiiiiiiiiiiled! ");
    return function( wf ) {
        done( { error: 'failed', wf: wf } );
    }.bind( this );
};