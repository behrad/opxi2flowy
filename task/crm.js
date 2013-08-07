var task = require ('dataflo.ws/task/base'),
    crm = require( 'opxi2crm' ),
    util = require( 'util' );


var msg = module.exports = function( config ) {
    this.init( config );
};

util.inherits( msg, task );

util.extend( msg.prototype, {

    run: function () {
        return self.failed( { error: "Not Implemented" } );
    },

    search: function( clbk ) {
        var self = this;
        var filter = {};
        filter[self.query] = self.value;
        crm.search( filter, function( err, contacts ){
            if( err ) {
                return self.failed( { error: err } );
            }
            if( self.sort_by ) {
                contacts.sort( self.get_sorter( self.sort_by ) );
            }
            clbk && clbk( err, contacts, function(err, transformed){
                if( err ) {
                    return self.failed( { error: err } );
                }
                return self.completed( transformed );
            });
            if( !clbk ) {
                 return self.completed( contacts );
            }
        });
    },

    isEmpty: function( obj ){
        return (
            (obj === undefined)           ||
            (obj ===      null)           ||
            (obj.length != undefined && obj.length==0) ||
            (typeof obj == "object" && Object.keys(obj).length==0)
        );
    },

    is_authorized: function() {
        var self = this;
        crm.is_authorized( self.message, function( err, auth_resp ) {
            if( err ) {
                console.log( "err: ", err );
                return self.failed( { error: err } );
            }
            return self.completed( auth_resp );
        });
    },

    homes: function() {
        var self = this;
        self.search( function(err, contacts, done ){
            if( err ) {
                return done( err );
            }
            var cells = contacts.map( function( contact ) {
                return self.add_address( "tel_home", contact, "voice" );
            });
            return done( null, cells.filter( self.isValid.bind(self) ) );
        });
    },

    phones: function() {
        var self = this;
        self.search( function(err, contacts, done ){
            if( err ) {
                return done( err );
            }
            var cells = contacts.map( function( contact ) {
                return self.add_address( "tel_work", contact, "voice" );
            });
            return done( null, cells.filter( self.isValid.bind(self) ) );
        });
    },

    cells: function() {
        var self = this;
        self.search( function(err, contacts, done ){
            if( err ) {
                return done( err );
            }
            var cells = contacts.map( function( contact ) {
                return self.add_address( "tel_cell", contact, "sms" );
            });
            return done( null, cells.filter( self.isValid.bind(self) ) );
        });
    },

    get_sorter: function( prop ){
        return function( c1, c2 ) {
            var self = this;
            if( self.getProperty(c1, prop ) == undefined ) return 1;
            if( self.getProperty(c2, prop ) == undefined ) return 0;
            return self.getProperty(c1, prop )>self.getProperty(c2, prop ) ? 1: 0;
        }.bind( this );
    },

    add_address: function( addressField, contact, channel ) {
        if( this.isValid( contact[ addressField ], channel ) ) {
            return {
                id: contact[ 'id' ],
                address: contact[ addressField ],
                channel: channel || 'voice'
            };
        }
        return undefined;
    },

    isValid: function( address, channel ) {
        return !this.isEmpty( address );
    },

    event_matches: function() {
        var self = this;
        crm.event_matches( self.label, function( err, matched ) {
            if( err ) {
                console.log( "err: ", err );
                return self.failed( { error: err } );
            }
            self.completed( matched );
        });
    },

    wait_until: function() {
        var self = this;
        crm.wait_until( self.event, function( err, matched ) {
            if( err ) {
                console.log( "err: ", err );
                return self.failed( { error: err } );
            }
            self.completed( matched );
        });
    },

    getProperty: function (obj, path) {
        var val = obj;
        var hasProp = path.split('.').every(function (prop) {
                val = val[prop];
                return null != val;
        });
        return hasProp ? val : undefined;
    }

});
