var task = require ('dataflo.ws/task/base'),
    opxi2 = require( 'opxi2node'),
    util = require( 'util' );
    var redisConnection = opxi2.singletonBrokerClient();

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

    /**
     * Get all keys in a redis hash
     * @key redis hash name
     * @data json object to store under the key
     *
     * Returns an array of available page numbers for later page fetch!
     */
    pages: function() {
        redisConnection.llen( this.key, this.errorHandler( redisConnection, function( len ){
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
        var page = Number( this.page ) || 1;
        var pageSize = Number( this.pageSize ) || 100;
        var start = (page-1)*pageSize;
        var end = start + (pageSize-1);
        redisConnection.lrange( this.key, start, end, this.errorHandler( redisConnection ) );
    },

    /**
     * Get all keys in a redis hash
     * @key redis hash name
     * @property the field name to set
     * @value value to set under the name @property
     */
    setValue: function() {
        var value = JSON.stringify( this.value );
        if( this.value.indexOf && this.value.split ) {
            value = this.value;
        }
        redisConnection.hset( this.key, this.property, value, this.errorHandler( redisConnection ) );
    },

    /**
     * Set keys in a redis hash
     * @key redis hash name
     * @data json object to store under the key
     */
    setHash: function() {
        redisConnection.hmset( this.key, this.data, this.errorHandler( redisConnection ) );
    },

    set: function() {
        redisConnection.set( this.key, this.value, this.errorHandler( redisConnection ) );
    },

    /**
     * Get all keys in a redis hash
     * @key redis hash name
     */
    getHash: function() {
        redisConnection.hgetall( this.key, this.errorHandler( redisConnection ));
    },

    llen: function() {
        var self = this;
        redisConnection.llen( this.key, this.errorHandler( redisConnection, function( len ){
            self.completed( Number(len) );
        }) );
    },

    incr: function() {
        redisConnection.incr( this.key, this.errorHandler( redisConnection ));
    },

    sadd: function() {
        redisConnection.sadd( this.set, this.value, this.errorHandler( redisConnection ));
    },


    /**
     * Publishes a message in redis
     * @channel the channel to publish to
     * @message String message to be published
     *
     * return publish command response
     */
    publish: function() {
        redisConnection.publish( this.channel, this.message, this.errorHandler( redisConnection ) );
    },

    /**
     * Wait for the next message available on the pattern
     *
     * @pattern the pattern to subscribe to
     * @timeout in seconds
     *
     * The returned event will have to properties
     * @channel the channel the event is received on
     * @message the published event message
     */
    wait_first: function() {
        var self = this;
//        console.log( "==================================== Create a redis client in redis wait task " );
        var redis = opxi2.brokerClient();
        self.on( 'cancel', function () {
            redis.punsubscribe( self.pattern );
            redis.quit();
            redis.end();
            if( timer ) {
                clearTimeout( timer );
            }
        }.bind( self ) );
        redis.on( "pmessage", function ( pattern, channel, message ) {
            self.completed( {message: message, channel: channel} );
            redis.punsubscribe( self.pattern );
            redis.quit();
            redis.end();
            if( timer ) {
                clearTimeout( timer );
            }
        });
        redis.on( "psubscribe", function (pattern) {
            console.log( "Task wait for next message on %s ", pattern );
        });
        redis.on( "punsubscribe", function (pattern, count) {
            console.log( "Task unSubscribed to %s, remaining subs: %s", pattern, count );
        });
        redis.psubscribe( self.pattern );
        if( self.timeout ) {
            var timer = setTimeout( function(){
                self.completed( { timeout: true } );
                redis.punsubscribe( self.pattern );
                redis.quit();
                redis.end();
            }, Number( self.timeout*1000 ) );
        }
    },

    errorHandler: function( redis, clbk ) {
        return function( err, obj ) {
//            redis.quit();
//            redis.end();
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



