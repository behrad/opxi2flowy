var EventEmitter   = require('events').EventEmitter,
	util = require('util'),
    opxi2 = require( 'opxi2node'),
	Workflow = require('dataflo.ws/workflow');


var redis_event = module.exports = function (config) {
	this.config = util.extend( {}, redis_event.defaultConfig );
	if (config) {
		util.extend(this.config, config);
	}
	if( this.config ) {
		this.ready();
	}
};

redis_event.defaultConfig = {
	verbose: true
};

util.inherits( redis_event, EventEmitter );

redis_event.prototype.ready = function () {
	var self = this;
//	var rootPath = common.getProject().root.path;
	self.config.workflows.forEach( function ( cfg ) {
		self.listen( cfg );
	});
	this.emit( 'ready', this );
};

/**
 * Subscribes to redis channels to start workflows based on
 * published messages.
 *
 * @param workflowConfig
 *  pattern: the pattern to subscribe for!
 *
 * Following variables are accessible in
 * the started workflow:
 * 1) pattern
 * 2) channel
 * 3) message
 *
 */
redis_event.prototype.listen = function( workflowConfig ) {
    var broker = opxi2.brokerClient();
    broker.on( "pmessage", function ( pattern, channel, message ) {
        var wf = new Workflow(
            util.extend (true, {}, workflowConfig ), {
                pattern: pattern,
                channel: channel,
                message: message
        });
    //	wf.data.channel = channel;
    //	wf.data.pattern = pattern;
    //	wf.data.message = message;
        wf.run();
    });
    broker.on("psubscribe", function (pattern, count) {
        console.log( "Waiting for new messages on %s ", pattern );
    });
    broker.on("punsubscribe", function (pattern, count) {
        console.log( "UnSubscribed to %s, %s", pattern, count );
    });
    broker.psubscribe( workflowConfig.pattern );
};
