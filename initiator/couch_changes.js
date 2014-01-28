/**
 * Created with PyCharm.
 * User: jrad
 * Date: 5/5/13
 * Time: 10:21 AM
 * To change this template use File | Settings | File Templates.
 */
var EventEmitter   = require('events').EventEmitter,
	util = require('util'),
    opxi2 = require( 'opxi2node'),
	Workflow = require('dataflo.ws/workflow');

var couchChanges = module.exports = function (config) {
	this.config = util.extend( {}, couchChanges.defaultConfig );
	if (config) {
		util.extend(this.config, config);
	}
	if( this.config ) {
		this.ready();
	}
};

couchChanges.defaultConfig = {
	verbose: true,
    filter: function( doc, req ){
        return true;
    }
};

util.inherits( couchChanges, EventEmitter );

couchChanges.prototype.ready = function () {
	var self = this;
	self.config.workflows.forEach( function ( cfg ) {
		self.listen( cfg );
	});
	this.emit( 'ready', this );
};

couchChanges.prototype.listen = function( workflowConfig ) {
    if( opxi2.db.follow === undefined ) {
        console.log( "Please install nano for CouchDB changes listener to work" );
        return;
    }
    var feed = opxi2.db.follow({
        filter: workflowConfig.filter || couchChanges.defaultConfig.filter,
        since: workflowConfig.since || "now",
        include_docs: workflowConfig.include_docs || true
    });

    feed.on('change', function (change) {
        var wf = new Workflow(
            util.extend (true, {}, workflowConfig ), {
                change: change
        });
        opxi2.log("Start flow %s for change %j", wf.id, change );
        wf.run();
    });
    opxi2.log( "Listening for changes: %j", opxi2.db );
    feed.follow();
};