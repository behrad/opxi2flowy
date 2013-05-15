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

    /**
     * @from
     * @to
     * @unit days, years, ...
     * @diff 100, 2000
     */
    diff: function() {
        var a = moment( this.from || new Date() );
        var b = moment( this.to || new Date() );
        if( this.lt ) {
            this.completed( Math.abs( a.diff( b, this.unit ) ) < this.lt );
        } else if( this.gt ) {
            this.completed( Math.abs( a.diff( b, this.unit ) ) > this.gt );
        } else {
            this.completed( Math.abs( a.diff( b, this.unit ) ) );
        }
    },

    /**
     * @start
     * @end
     */
    isBefore: function() {
        this.completed( moment( this.start || new Date() ).isBefore( this.end || new Date() ) );
    },

    /**
     * @start
     * @end
     */
    isAfter: function() {
        this.completed( moment( this.start || new Date() ).isAfter( this.end || new Date() ) );
    },

    /**
     * @base The field
     * @month
     * @years
     * @weeks
     * @days
     * @hours
     * @minutes
     */
    add: function() {
        var years = Number(this.years) || 0;
        var months = Number(this.months) || 0;
        var weeks = Number(this.weeks) || 0;
        var days = Number(this.days) || 0;
        var hours = Number(this.hours) || 0;
        var minutes = Number(this.minutes) || 0;
        var base = this.base || new Date();
        this.completed( moment( base ).add({
            minutes: minutes,
            hours: hours,
            days: days,
            weeks: weeks,
            months: months,
            years: years
        }).format() /*.valueOf()*/ /*.toDate()*/ );
    },

    subtract: function() {
        var years = Number(this.years) || 0;
        var months = Number(this.months) || 0;
        var weeks = Number(this.weeks) || 0;
        var days = Number(this.days) || 0;
        var hours = Number(this.hours) || 0;
        var minutes = Number(this.minutes) || 0;
        var base = this.base || new Date();
        this.completed( moment( base ).subtract({
            minutes: minutes,
            hours: hours,
            days: days,
            weeks: weeks,
            months: months,
            years: years
        }).format());
    }

});
