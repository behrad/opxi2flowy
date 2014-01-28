/**
 * Created with PyCharm.
 * User: jrad
 * Date: 5/27/13
 * Time: 11:37 AM
 * To change this template use File | Settings | File Templates.
 */
var opxi2 = require( 'opxi2node' );
var config = require( 'opxi2node/config' );


var my_job = opxi2.taskq.create( "outbound-msg", {
    title: "Test SMS Send",
    channel: "sms",
    to: "09395336383",
    from: "Behrad's Test Suite",
    media_url: "http://192.168.254.113:8000/rest/rsc/id/451"
});
my_job.attempts(3).save().on( 'complete', function() {
    my_job.get('data', function( err, data ){
        if( err ) return console.log( err );
        return console.log( "Sent: " + JSON.stringify( data ) );
    });
});

/*
var my_job = opxi2.taskq.create( "outbound-msg", {
    title: "Test Email Send",
    channel: "email",
    to: "behrad_zari@yahoo.com",
    from: "info@basamadco.com",
    media_url: "http://192.168.254.113:8000/rest/rsc/id/451"
});
my_job.attempts(1).save().on( 'complete', function() {
    my_job.get('data', function( err, data ){
        if( err ) return console.log( err );
        return console.log( "Sent: " + JSON.stringify( data ) );
    });
});
*/
