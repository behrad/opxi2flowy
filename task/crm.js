var task = require ('dataflo.ws/task/base'),
    crm = require( 'opxi2node/crm'),
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

    is_authorized: function() {
        var self = this;
//        self.message;
//        self.user;
        crm.searchUser( self.user, true , function( err, contacts ) {
            if( err ) {
                console.log( "err: ", err );
                return self.failed( { error: err } );
            }
            if( contacts.length == 0 ) {
                console.log( "No contacts found!" );
                return self.completed( self.getFailedValue( "not_found", self.user ) );
            }
            // TODO check accounting...
            return self.completed( self.getSuccessValue( contacts[0] ) );
        });
    },

    isEmpty: function( val ){
        return val && val != null && val != undefined;
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

            return done( cells.filter( self.isEmpty ) );
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
            return done( cells );
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
            return done( cells );
        });
    },

    get_sorter: function( prop ){
        return function( c1, c2 ) {
            var self = this;
            if( self.getProperty(c1, prop ) == undefined ) return 1;
            if( self.getProperty(c2, prop ) == undefined ) return 0;
            return self.getProperty(c1, prop )>self.getProperty(c2, prop ) ? 1: 0;
        };
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
        return address != null && address != '';
    },

    event_matches: function() {
        var self = this;
        crm.event_matches( self.label, function( err, matched ) {
            if( err ) {
                console.log( "err: ", err );
                return self.failed( { error: err } );
            }
            return self.completed( matched );
        });
    },

    firstmatch: function() {
        var self = this;
        crm.searchUser( self.user, function( err, contacts ) {
            if( err ) {
                console.log( "err: ", err );
                return self.failed( { error: err } );
            }
            if( contacts.length == 0 ) {
                console.log( "No contacts found!" );
                return self.completed( self.getFailedValue( "not_found", self.user ) );
            }
            return self.completed( self.getSuccessValue( ontacts[0] ) );
        });
    },

    getSuccessValue: function( user ) {
        return {
            sender: user,
            success: {
                "accounting": {
                    "account": user && user.accountLoginName
                }
            },
            failed: false
        };
    },

    getFailedValue: function( msg, reason, user ) {
        return {
            sender: user,
            success: false,
            failed: {
                "accounting": {
                    "error": msg,
                    "reason": reason,
                    "account": user && user.accountLoginName
                }
            }
        };
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
