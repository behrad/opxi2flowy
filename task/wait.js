var task = require('dataflo.ws/task/base');
util = require( 'util' );

var sleepTask = module.exports = function (config) {
    this.init (config);
};

util.inherits( sleepTask, task );

util.extend( sleepTask.prototype, {

    run: function () {
        var self = this;
        var timer = setTimeout( function () {
            self.completed( 1 );
        }, Number( self.secs ) * 1000 );
    }

});