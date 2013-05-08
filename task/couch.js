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
        if( self.doc._id || self.id ) {
            var id = self.doc._id || self.id;
            delete self.doc._id;
            delete self.doc.id;
            delete self.doc._rev;
            opxi2.db.insert( self.doc, id, this.handleResponse.bind( self ) );
        } else {
            opxi2.db.insert( self.doc, this.handleResponse.bind( self ) );
        }

    },

    /**
     * @handler Update handler name: designDoc/updateFunction
     * @id Id of the document to be updated
     * @data the json data
     */
    update: function() {
        var self = this;
        var updateHandlerName = self.handler || 'log/msgLog';
        var tokens = updateHandlerName.split( '/' );
        opxi2.db.atomic( tokens[0], tokens[1], self.id, self.data, self.handleResponse.bind( this ) );
//        opxi2.db.updateLog( updateHandlerName, self.id, self.data, self.handleResponse.bind( this ) );
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

    handleResponse: function( err, resp ) {
        if (err) {
            this.failed( err );
        } else {
            this.completed( resp );
        }
    }

});


