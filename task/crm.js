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
    }

});
