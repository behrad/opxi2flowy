var task = require ('dataflo.ws/task/base'),
    opxi2 = require( 'opxi2node'),
    util = require( 'util' );


var redis = module.exports = function( config ) {
    this.init( config );
};

util.inherits( redis, task );

util.extend( redis.prototype, {

    run: function () {
        this.failed( "Not Implemented!" );
    },

    test: function() {
        var self = this;
    },

    createClient: function() {
        var self = this;
        var redis = opxi2.brokerClient();
        redis.on( "error", function( err ) {
            console.log( "Error " + err );
            self.failed( err );
            redis.quit();
        });
        return redis;
    },

    /**
     * Get all keys in a redis hash
     * @key redis hash name
     * @data json object to store under the key
     *
     * Returns an array of available page numbers for later page fetch!
     */
    pages: function() {
        var redis = this.createClient();
        redis.llen( this.key, this.errorHandler( redis, function( len ){
            var pageSize = Number( this.pageSize ) || 100;
            var a = [];
            for( var i=1; i<=Math.ceil( len/pageSize ); i++ ) {
                a[i-1] = i;
            }
            this.completed( a );
        }) );
    },

    /**
     * Fetch a redis list with paging
     * @key list hash name
     * @page
     * @pageSize
     */
    paged: function() {
        var redis = this.createClient();
        var page = Number( this.page ) || 1;
        var pageSize = Number( this.pageSize ) || 100;
        var start = (page-1)*pageSize;
        var end = start + (pageSize-1);
        redis.lrange( this.key, start, end, this.errorHandler( redis ) );
    },

    /**
     * Get all keys in a redis hash
     * @key redis hash name
     * @property the field name to set
     * @value value to set under the name @property
     */
    setValue: function() {
        var redis = this.createClient();
        redis.hset( this.key, this.property, JSON.stringify( this.value ), this.errorHandler( redis ) );
    },

    /**
     * Get all keys in a redis hash
     * @key redis hash name
     * @data json object to store under the key
     */
    setHash: function() {
        var redis = this.createClient();
        redis.hmset( this.key, this.data, this.errorHandler( redis ) );
    },

    /**
     * Get all keys in a redis hash
     * @key redis hash name
     */
    getHash: function() {
        var redis = this.createClient();
        redis.hgetall( this.key, this.errorHandler( redis ));
    },

    incr: function() {
        var redis = this.createClient();
        redis.incr( this.key, this.errorHandler( redis ));
    },

    /**
     * Publishes a message in redis
     * @channel the channel to publish to
     * @message String message to be published
     *
     * return publish command response
     */
    publish: function() {
        var redis = this.createClient();
        redis.publish( this.channel, this.message, this.errorHandler( redis ) );
    },

    /**
     * Wait for the next message available on the pattern
     *
     * @pattern the pattern to subscribe to
     *
     * The returned event will have to properties
     * @channel the channel the event is received on
     * @message the published event message
     */
    wait_for: function() {
        var self = this;
        var redis = this.createClient();
        redis.on( "pmessage", function ( pattern, channel, message ) {
            self.completed( {message: message, channel: channel} );
            redis.punsubscribe( self.pattern );
            redis.quit();
            redis.end();
            if( timer ) {
                clearTimeout( timer );
            }
        });
        redis.on("psubscribe", function (pattern, count) {
            console.log( "Task wait for next message on %s ", pattern );
        });
        redis.on("punsubscribe", function (pattern, count) {
            console.log( "Task unSubscribed to %s, remaining subs: %s", pattern, count );
        });
        redis.psubscribe( self.pattern );
        if( self.timeout ) {
            var timer = setTimeout( function(){
                self.completed( { timeout: true } );
                redis.punsubscribe( self.pattern );
                redis.quit();
                redis.end();
            }, Number( self.timeout ) );
        }
    },

    errorHandler: function( redis, clbk ) {
        return function( err, obj ) {
            redis.quit();
            redis.end();
            if( err ) {
                return this.failed( err );
            }
            if( clbk ) {
                return clbk.bind( this )( obj );
            }
            return this.completed( obj );
        }.bind( this );
    }

});



