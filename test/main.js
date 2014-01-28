/**
 * Created with PyCharm.
 * User: jrad
 * Date: 5/14/13
 * Time: 2:00 PM
 * To change this template use File | Settings | File Templates.
 */

//var opxi2 = require( 'opxi2node' );


/*var total = 120;
opxi2.taskq.process( "test-job", total, function (job, done, resume) {
    console.log( "Processing ", job.id, total );
    setTimeout( function(){
        if( job.id % 2 ) {
            done( *//*{error: true, message: "ye error koochik" }*//* );
        } else {
            done();
        }
    }, 10000 );
    if( !(job.id % 50) ) {

    }
});

setTimeout( function(){
    console.log( "Sutting down...", new Date() );
    opxi2.taskq.shutdown(function(err) {
        console.log( 'All jobs finished, Kue is shut down.', err||'', new Date() );
        process.exit(0);
    }, 5000 );
}, 1000 );
var n = 500;
while( n-- ) {
//    opxi2.taskq.create( "test-job", {data:{ title: "hello world"}}).attempts(2).save();
}*/
var Queue = require('kue')
    , Job = Queue.Job
    , queue = Queue.createQueue( {} );
//queue.create( 'test1', {data:{title:"behrad"}}).save();
Job.remove( 51, function(){ console.log( arguments )});