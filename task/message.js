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
        this.completed( msg );
    },

    attach_body: function() {
        this.message.attachBody( function(err){
            if( err ) {
                this.failed( { error: err } );
            } else {
                this.completed( this.message );
            }
        }.bind( this ));

    },

    as_campaign: function() {
        var self = this;
        var msg = new Message( this.data );
        msg.as_campaign( this.id );
        self.completed( msg );
    },

    from_campaign: function() {
        var self = this;
        var msg = new Message( this.dest, this.campaign );
        self.completed( msg );

        /*uuid.get_uuid( function( id ) {
            msgData.id = id;
            try {

            } catch( e ) {
                console.error( e );
                self.failed( {error: e } );
            }
        });*/
    },

    /**
     * Publishes a message in redis
     * @channel the channel to publish to
     * @message String message to be published
     *
     * return publish command response
     */
    filter: function() {
    }

});