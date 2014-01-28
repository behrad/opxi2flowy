var task = require ('dataflo.ws/task/base'),
    uuid = require('opxi2node/opxi2-uuid'),
    util = require( 'util' );


var uuidTask = module.exports = function( config ) {
    this.init( config );
};

util.inherits( uuidTask, task );

util.extend( uuidTask.prototype, {

    run: function () {
        var self = this;
        uuid.get_uuid( function( id ) {
            try {
                self.completed( id );
            } catch( e ) {
                console.error( e );
                self.failed( e );
            }
        }, self.service );
    },

    chance: function() {
        var weight = Number( this.weight ) || 0.5;
        var rand = Math.random();
        (rand <= weight) ? this.completed( rand <= weight ) : this.failed( rand ) ;
    },

    test_failed: function() {
        this.completed( 24 );
    }

});
