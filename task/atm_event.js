var task = require('dataflo.ws/task/base'),
    cms = require('opxi2node/zotonic'),
    Message = require('opxi2node/message'),
    util = require('util');


var cmsTask = module.exports = function( config ) {
    this.init( config );
};

util.inherits( cmsTask, task );

util.extend( cmsTask.prototype, {

    run: function () {
        var self = this;
        cms.find( this.query, function( err, data ){
            if( err ) return self.failed( err );
            return self.completed( data );
        });
    },

    /**
     * Event Data
     *
     * Should return an object with the following properties:
     * new: if it is a new event
     * alarm_postpone: number of seconds to postbone alarm for this event
     * alarm_tries: an array of integers for each retry
     * next_notify_delay: delay to do the next notification
     * last_notify_delay: delay to wait for last
     */
    process: function() {
        var self = this;
        cms.apiCall({
            module: 'atm',
            method: 'event',
            data: self.event
        }, function( err, resp ){
            if( err ) return self.failed( err );
            return self.completed( resp );
        });
    },

    check: function() {
        var self = this;
        cms.apiCall({
            module: 'atm',
            method: 'event',
            params: { id: self.eventId }
        }, function( err, resp ){
            if( err ) return self.failed( err );
            return self.completed( resp );
        });
//        eventId
//        return true if is fixed! otherwise false
    },

    mark_failure: function() {
        var self = this;
        cms.apiCall({
            module: 'atm',
            method: 'event',
            data: self.event
        }, function( err, resp ){
            if( err ) return self.failed( err );
            return self.completed( resp );
        });
//        eventId
        // save this event id as failure
    },

    branchOf: function() {
        var self = this;
        cms.apiCall({
            module: 'atm',
            method: 'branch',
            params: { atm: self.atm_name }
        }, function( err, resp ){
            if( err ) return self.failed( err );
            return self.completed( resp );
        });
    },

    get: function () {
        var self = this;
        cms.get( this.id, function( err, data ){
            if( err ) return self.failed( err );
            return self.completed( data );
        });
    }

});
