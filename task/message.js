var task = require ('dataflo.ws/task/base'),
    Message = require( 'opxi2node/message'),
    util = require( 'util' );


var msg = module.exports = function( config ) {
    this.init( config );
};

util.inherits( msg, task );

util.extend( msg.prototype, {

    /**
     * Create a new message
     */
    run: function () {
        var msg = new Message( this.data );
        if( this.id ) {
            msg._id = this.id;
        }
        if( this.outbound ) {
            msg.as_outbound();
        }
        this.completed( msg );
    },

    as_logable: function() {
        this.completed( this.message.as_logable() );
    },

    attach_body: function() {
        var self = this;
        if( self.dont_attach ) {
            return self.completed( self.message );
        }
        this.message.attach_body( function( err, resp ){
            if( err ) return self.failed( err );
            return self.completed( resp );
        });
    },

    is_voice: function() {
        this.completed( this.message.is_voice() );
    },

    as_alarm_msg: function() {
        var msg = this.multi_dest_msg();
        msg.alarm_id = this.alarm_id;
        this.completed( msg );
    },

    multi_dest_msg: function() {
        return new Message({
            direction: "outbound",
            destinations: this.destinations,
            from: "ATM Failure System",
            media_url: this.media_url,
            answer_timeout: this.answer_timeout
        });
    },

    as_multi_dest: function() {
        var i = Number(this.index)-1 || 0;
        var msg = new Message( this.data );
        console.log( "Going to send to destination ", i, typeof i );
        msg.to = this.data.destinations[i].address;
        msg.channel = this.data.destinations[i].channel;
        msg.to_account_id = this.data.destinations[i].id;
        delete msg.destinations;
        this.completed( msg );
    },

    as_campaign: function() {
        var self = this;
        var msg = new Message( self.data ).as_campaign( self.id );
        self.completed( msg );
    },

    from_campaign: function() {
        var msg = new Message().from_campaign( this.dest, this.campaign, this.campaignId );
        this.completed( msg );
    },

    as_log: function() {
        this.completed( new Message().as_log( this.action, this.data, this.index ) );
    }

});