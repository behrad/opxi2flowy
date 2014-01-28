var task = require ('dataflo.ws/task/base'),
    opxi2 = require( 'opxi2node'),
    util = require( 'util' );


var couch = module.exports = function( config ) {
    this.init( config );
};

util.inherits( couch, task );

util.extend( couch.prototype, {

    /**
     * @doc the json to save to couchdb
     * @id optional, to set the doc id manually
     *  if it contains _id, an update will be triggered
     *  otherwise a new document will be saved
     */
    run: function () {
        var self = this;
//	    self.emit( 'warn', 'CouchDB logger got ' + self.doc );
        var newDoc = {};
        newDoc.extend( self.doc );
        if( !newDoc.created_at ) {
            newDoc.created_at = new Date().getTime();
        }
        if( newDoc._id || self.id ) {
            var id = newDoc._id || self.id;
            delete newDoc._id;
            delete newDoc.id;
            delete newDoc._rev;
            opxi2.db.insert( newDoc, id, this.handleResponse.bind( self ) );
        } else {
            opxi2.db.insert( newDoc, this.handleResponse.bind( self ) );
        }

    },

    /**
     * @handler Update handler name: designDoc/updateFunction
     * @id Id of the document to be updated
     * @data the json data
     */
    update: function() {
        var self = this;
        opxi2.db.updateLog( self.handler, self.id, self.data, self.handleResponse.bind( this ) );
    },

    /**
     * @id id of the requested document
     */
    get: function() {
        var self = this;
        opxi2.db.get( self.id, function (err, doc) {
            if (err) {
                self.failed( err );
            } else {
                self.completed( doc );
            }
        });
    },

    attach_body: function( id, rev, attachment, clbk ) {
        opxi2.db.attachment.insert(id, attachment.name, attachment.data, attachment.content_type, {rev: rev}, function( err, body ) {
            if (err) {
//                console.log( err );
                return clbk && clbk(err);
            }
            clbk && clbk();
        });

    },

    handleResponse: function( err, resp ) {
        if (err) {
            this.failed( err );
        } else {
            this.completed( resp );
        }
    }

});



