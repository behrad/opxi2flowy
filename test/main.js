/**
 * Created with PyCharm.
 * User: jrad
 * Date: 5/14/13
 * Time: 2:00 PM
 * To change this template use File | Settings | File Templates.
 */

var opxi2 = require( 'opxi2node' );
var request = require( 'request' );
var fs = require( 'fs' );
//var moment = require( 'moment' );


//opxi2.db.attachment.insert("new2", "salam2.txt", "EY BABA", "text/plain",{rev: '2-3b083c4b98c15882870b3e52367be426' }, function(err, body){
//    if( err ) return console.log( err );
//    console.log( body );
//});

//console.log( request.get("http://192.168.254.113:5984/") );


//setTimeout( function() {
//    console.log( "Created Job: ", my_job.id );
//    var my_job3 = opxi2.taskq.create( 'cancel-pauseable', { title: "Test Alaki", job_id: my_job.id } ).attempts(1).save();
//}, 2000 );

var list = [{a:{n:2}},{b:{n:1}},{a:{n:3}}].map( function(a){});
list.sort( function( c1, c2 ) {
    if( !c1.a ) return 1;
    if( !c2.a ) return 0;
    return (c1.a && c1.a.n) > (c2.a && c2.a.n)? 0: 1;
});
console.log( list.filter(function( val ){
        return val && val != null && val != undefined;
    }));