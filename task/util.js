var task = require('dataflo.ws/task/base'),
    util = require('util');


var taskModule = module.exports = function (config) {
    this.init(config);
};

util.inherits(taskModule, task);

util.extend(taskModule.prototype, {

    run: function () {
        var self = this;
        return self.failed({ error: "Not Implemented" });
    },

    clone: function () {
        var self = this;
        self.from = self.from || {};
        return self.completed( util.extend( self.from, self.to ) );
    },

    set: function () {
        var self = this;
        self.base = self.base || {};
        if( !Array.isArray( self.name ) ) {
            self.name = [self.name];
            self.value = [self.value];
        }
        self.name.forEach( function( name, i ){
            deepSet( self.base, name, self.value[i] );
        });
        return self.completed( self.base );
    }

});

function deepGet(frontObj, name) {
    var parts = name.split(".");
    var frontName = parts.shift();
    while (parts.length > 0) {
        if (frontObj[frontName] !== undefined) {
            frontObj = frontObj[frontName];
            frontName = parts.shift();
        } else {
            return undefined;
        }
    }
    return frontObj[ frontName ];
}

function deepSet(frontObj, name, value) {
    if (typeof value !== undefined) {
        var parts = name.split(".");
        var frontName = parts.shift();
        while (parts.length > 0) {
            frontObj[frontName] = frontObj[frontName] || {};
            frontObj = frontObj[frontName];
            frontName = parts.shift();
        }
        frontObj[ frontName ] = value;
    }
}