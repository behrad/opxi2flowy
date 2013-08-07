var task = require('dataflo.ws/task/base'),
    cms = require('opxi2node').cms,
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
        self.event[ "job_id" ] = self.job_id;
        cms.apiCall({
            module: 'atm',
            method: 'event',
            data: self.event
        }, function( err, resp ){
            if( err ) return self.failed( err );
            return self.completed( resp );
        });
    },

    markfailed: function() {
        var self = this;
        cms.apiCall({
            module: 'atm',
            method: 'event',
            data: {
                method: "markfailed",
                id: self.eventId
            }
        }, function( err, resp ){
            if( err ) return self.failed( err );
            return self.completed( resp );
        });
    },

    log_alarm: function() {
        var self = this;
        cms.apiCall({
            module: 'atm',
            method: 'event',
            data: {
                method: "log_alarm",
                alarm_time: self.alarm_time,
                target: self.target,
                channel: self.channel,
                log: self.log,
                msgId: self.msgId,
                id: self.eventId
            }
        }, function( err, resp ){
            if( err ) return self.failed( err );
            return self.completed( resp );
        });
    },

    update: function() {
        var self = this;
        cms.apiCall({
            module: 'atm',
            method: 'event',
            data: {
                method: "update",
                id: self.eventId,
                x_state: self.state,
                status: self.status
            }
        }, function( err, resp ){
            if( err ) return self.failed( err );
            return self.completed( resp );
        });
    },

    is_good: function() {
        var self = this;
        cms.apiCall({
            module: 'atm',
            method: 'event',
            params: { id: self.eventId }
        }, function( err, resp ){
            if( err ) return self.failed( err );
            return self.completed( resp.event.good );
        });
//        eventId
//        return true if is fixed! otherwise false
    },

    atm_branch: function() {
        var self = this;
        cms.apiCall({
            module: 'atm',
            method: 'branch',
            params: { atm: self.atm }
        }, function( err, resp ){
            if( err ) return self.failed( err );
            return self.completed( resp );
        });
    },

    event_branch: function() {
        var self = this;
        cms.apiCall({
            module: 'atm',
            method: 'branch',
            params: { id: self.eventId }
        }, function( err, resp ){
            if( err ) return self.failed( err );
            return self.completed( resp );
        });
    },

    event_atm: function() {
        var self = this;
        cms.apiCall({
            module: 'atm',
            method: 'atm',
            params: { id: self.eventId }
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
