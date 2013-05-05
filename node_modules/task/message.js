var task = require ('dataflo.ws/task/base'),
    opxi2 = require( 'opxi2node'),
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
        this.completed( new Message(  this.media, this.data ) );
    },

    test: function() {
//        console.log( "$$$$$$$$$$$$ %j", this.data );
        this.completed( { k1: "value" } );
    },

    /**
     * Publishes a message in redis
     * @channel the channel to publish to
     * @message String message to be published
     *
     * return publish command response
     */
    filter: function() {
        var brokerConnection = opxi2.brokerClient();
        var resp = brokerConnection.publish( this.channel, this.message );
        brokerConnection.end();
        this.completed( resp );
    }

});



