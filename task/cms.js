var task = require('dataflo.ws/task/base'),
    cms = require('opxi2node/zotonic'),
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

    get: function () {
        var self = this;
        cms.get( this.id, function( err, data ){
            if( err ) return self.failed( err );
            return self.completed( data );
        });
    }

});
