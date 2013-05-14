var task = require('dataflo.ws/task/base'),
    moment = require('moment'),
    util = require('util');


var momentT = module.exports = function (config) {
    this.init(config);
};

util.inherits( momentT, task );

util.extend( momentT.prototype, {

    run: function () {
        var self = this;
        return self.completed( moment( self.date ) );
    },

    diff: function() {
        var a = moment( this.from || new Date() );
        var b = moment( this.to || new Date() );
        if( this.diff ) {
            this.completed( a.diff( b, this.unit ) < this.diff );
        } else {
            this.completed( a.diff( b, this.unit ) );
        }
    },

    isBefore: function() {
        this.completed( moment( this.start || new Date() ).isBefore( this.end || new Date() ) );
    },

    isAfter: function() {
        this.completed( moment( this.start || new Date() ).isAfter( this.end || new Date() ) );
    },

    add: function() {
        var years = this.years || 0;
        var months = this.months || 0;
        var weeks = this.weeks || 0;
        var days = this.days || 0;
        var hours = this.hours || 0;
        var minutes = this.minutes || 0;
        var base = this.base || new Date();
        moment( base ).add({
            minutes: minutes,
            hours: hours,
            days: days,
            weeks: weeks,
            months: months,
            years: years
        });
    },

    subtract: function() {
        var years = this.years || 0;
        var months = this.months || 0;
        var weeks = this.weeks || 0;
        var days = this.days || 0;
        var hours = this.hours || 0;
        var minutes = this.minutes || 0;
        var base = this.base || new Date();
        moment( base ).subtract({
            minutes: minutes,
            hours: hours,
            days: days,
            weeks: weeks,
            months: months,
            years: years
        });
    }

});
