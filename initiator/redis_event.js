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
    var self = this;
    this.do_subscribe( workflowConfig.pattern, {
        on_message: function ( pattern, channel, message ) {
            var wf = new Workflow(
                util.extend (true, {}, workflowConfig ), {
                    pattern: pattern,
                    channel: channel,
                    message: message
            });
            console.log("Start flow %s(%s) on event %s", workflowConfig.pattern, wf.id, channel );
            //	wf.data.channel = channel;
            //	wf.data.pattern = pattern;
            //	wf.data.message = message;
            wf.run();
            /*if( workflowConfig.cancelable ) {
                var cancel_subscription = self.do_subscribe( 'cancel.' + channel *//*+ '_' + message*//*, {
                    on_message: self.createCancelable( wf )
                });
                wf.on( 'failed', function( wf ){
                    cancel_subscription.punsubscribe();
                    cancel_subscription.end();
                    cancel_subscription.quit();
                });
                wf.on( 'completed', function( wf ){
                    cancel_subscription.punsubscribe();
                    cancel_subscription.end();
                    cancel_subscription.quit();
                });
            }*/
        },
        on_subscribe: function (pattern, count) {
            console.log( "Subscribed to %s: %s ", pattern, count );
        },
        on_unsubscribe: function (pattern, count) {
            console.log( "UnSubscribed to %s: %s", pattern, count );
        }
    });
};

redis_event.prototype.createCancelable = function( workflow, sub ) {
    return function( pattern, channel, message ) {
        workflow.tasks.forEach( function(task){
            task.cancel();
        });
    };
};

redis_event.prototype.do_subscribe = function( pattern, params ) {
//    console.log( "==================================== Create a redis client in redis_event ", pattern );
    var broker = opxi2.brokerClient();
    broker.on( "pmessage", params.on_message || this.noop );
    broker.on( "psubscribe", params.on_subscribe || this.noop );
    broker.on( "punsubscribe", params.on_unsubscribe || this.noop );
    broker.psubscribe( pattern );
    return broker;
};

redis_event.prototype.noop = function(){};
