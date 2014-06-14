var task = require('dataflo.ws/task/base'),
    opxi2 = require('opxi2node'),
    cms = require('opxi2node').cms,
    util = require('util');


var cmsTask = module.exports = function( config ) {
    this.init( config );
//    this.on( 'error', function( e ){
//        console.log( "======================================= atm_event error ", e );
//    }.bind( this ));
};

util.inherits( cmsTask, task );

util.extend( cmsTask.prototype, {

    run: function () {
        var self = this;
        cms.apiCall({
            module: 'atm',
            method: 'event',
            params: { id: self.id }
        }, function( err, resp ){
            if( err || resp.error_code ) return self.failed( err || resp.error_dump );
            return self.completed( resp.event );
        });
    },

    before_notification_delay: function() {
        this.completed( Math.max(
            ((new Date(this.failure.failure_time).getTime() + (Number(this.failure.alarm.postpone)*1000))
                -Date.now())
                /1000,
            0
        ));
    },

    remaining_alarm_retries: function() {
        this.current_job_data.attempt = this.current_job_data.attempt || 0;
        this.current_job_data.tries = Number(this.failure.alarm.tries);
        this.completed( Math.max( Number(this.failure.alarm.tries) - ++this.current_job_data.attempt, 0 ) );
    },

    set_failure_messages: function() {
        var self = this;
        var event = this.event;
        if( !event.data.matched_msg_ids ) {
            return this.completed( true );
        }
        var ids = event.data.matched_msg_ids.filter( function(id){ return id && id!='';});
        opxi2.async.map( ids, function( id, next ){
//            ids.forEach( function( id ){
            cms.get( id, function( err, data ) {
                return next( err, data );
            });
//            });
        }, function( err, resources ) {
            event.failure_messages = resources;
            self.completed( !err );
        });
    },

    format_irar_time: function() {
        var date = this.date || new Date();
        var month = date.getMonth()+1;
        var date_format = [
            date.getFullYear(),
            ((0 < month && month > 9) ? month : "0" + month),
            ((0 < date.getDate() && date.getDate() > 9) ? date.getDate() : "0" + date.getDate()),
            ((0 < date.getHours() && date.getHours() > 9) ? date.getHours() : "0" + date.getHours()),
            ((0 < date.getMinutes() && date.getMinutes() > 9) ? date.getMinutes() : "0" + date.getMinutes()),
            ((0 < date.getSeconds() && date.getSeconds() > 9) ? date.getSeconds() : "0" + date.getSeconds())
        ].join( '' );
        this.completed( date_format );
    },

    /**
     * Event Data
     *
     * Should return an object with the following properties:
     * new: if it is a new event
     * alarm_postpone: number of seconds to postpone alarm for this event
     * alarm_tries: an array of integers for each retry
     * next_notify_delay: delay to do the next notification
     * last_notify_delay: delay to wait for last
     */
    process: function() {
        var self = this;
        self.event[ "job_id" ] = self.job_id;
        require( 'http' ).globalAgent.maxSockets = 9999;
//        require( 'http' ).globalAgent = false;
//        opxi2.log( "++++++++++++++++++++ Event(%s) ATM=%s ", self.job_id, self.event.TERMINAL || self.event.ATM_ID );
        cms.apiCall({
            module: 'atm',
            method: 'event',
            data: self.event
        }, function( err, resp ){
            if( err || resp.error_code ) return self.failed( err || resp.error_dump );
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
            if( err || resp.error_code ) return self.failed( err || resp.error_dump );
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
            if( err || resp.error_code ) return self.failed( err || resp.error_dump );
            return self.completed( resp );
        });
    },

    update: function() {
        var self = this;
//        console.log( "============================================================= Update ", self.eventId, self.status );
        cms.apiCall({
            module: 'atm',
            method: 'event',
            data: {
                method: "update",
                id: self.eventId,
                state: self.estate,
                data:{
                    notify_job_id     : self.notify_job_id,
                    pre_notify_job_id : self.pre_notify_job_id,
                    post_notify_job_id: self.post_notify_job_id
                },
                status: self.status
            }
        }, function( err, resp ){
//            console.log( "================================================================ SET TO ", self.eventId, self.status );
            if( err || resp.error_code ) return self.failed( err || resp.error_dump );
            return self.completed( resp );
        });
    },

    is_good: function() {
        var self = this;
        if( self.event ) {
            return self.completed( self.event.good );
        }
        cms.apiCall({
            module: 'atm',
            method: 'event',
            params: { id: self.eventId }
        }, function( err, resp ){
            if( err || resp.error_code ) return self.failed( err || resp.error_dump );
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
            if( err || resp.error_code ) return self.failed( err || resp.error_dump );
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
            if( err || resp.error_code ) return self.failed( err || resp.error_dump );
            return self.completed( resp );
        });
    },

    throwError: function() {
        var nullObj = null;
        return nullObj.a;
//        throw new Error( "This is a manualy generated error..." );
    },

    get: function () {
        var self = this;
        cms.get( this.id, function( err, data ){
            if( err || data.error_code ) return self.failed( err || data.error_dump );
            return self.completed( data );
        });
    }

});
