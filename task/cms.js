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

//    TODO http://192.168.254.113:8000/api/atm/event
//{
//  "atm_id": "BBB Salam2",
//  "failure_time": "2013/5/18 11:24:13",
//  "data": { "d_id": "1324", "desc":"خرابی جدید" }
//}

//    this.apiCall( {
//                module: 'atm',
//                method: 'failure',
//                data: {}
//            }, finalClbk );

//  TODO  Branch of ATM: api/atm/branch?atm=bbb_salam2


    get: function () {
        var self = this;
        cms.get( this.id, function( err, data ){
            if( err ) return self.failed( err );
            return self.completed( data );
        });
    }

});
