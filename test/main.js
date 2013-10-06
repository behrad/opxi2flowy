/**
 * Created with PyCharm.
 * User: jrad
 * Date: 5/14/13
 * Time: 2:00 PM
 * To change this template use File | Settings | File Templates.
 */

var opxi2 = require( 'opxi2node' );
//opxi2.taskq.process( "test_job", 200, function (job, done) {
//    job.current_attempt = Number(job._attempts)+1 || 1;
//    console.log("Receive job %s(%s): %j", "test_job", job.id, job.current_attempt , new Date() );
//    job.last_attempt = (job.current_attempt === Number(job._max_attempts));
//
//
//    job.set( 'data' , JSON.stringify( { ok: true, message: "Job Done!" }), done );
//    done( { error: true, message: 'Worker '+job.type+' failed' } );
//
//
//    if( job.last_attempt ) {
//        job.set( 'data' , JSON.stringify( { ok: true, message: "Job Done!" }), done );
////        done();
////        done( { error: true, message: 'Worker '+job.type+' failed' } );
//    } else {
//        job.set( 'data' , JSON.stringify( { ok: true, message: "Job Done failed!" } ), function(){
//
//        });
////        done();
//    }
//});

//for( var i = 1; i <= 1000; i++ ) {
    /*var my_job = opxi2.taskq.create( "test_job", { title: "test_job",  test: 123 } )
      .priority( 15 ).attempts( 1 ).on( 'complete', function(){
        console.log( "Job %d completed! ", my_job.id, new Date() );
    }).save( function(){
        console.log( my_job.id );
        console.log( my_job._priority );
    });*/
//}


/*
opxi2.kue.Job.rangeByState( 'inactive', 0, -1, 'asc', function( err, jobs ) {
    if( err ){
        return console.error( err );
    }
    if( jobs && jobs.length == 0 ) {
        return console.log( "No Jobs in inactive state" );
    }
    jobs.forEach( function( job ) {
        if( Number( job.created_at ) < Date.now() ) {
            console.log( "%s: Re-queueing %s(%s) created @ ", new Date(), job.type, job.id, new Date(Number(job.created_at)) );
            job.inactive().update();
        }
    });
});*/

process.on( 'uncaughtException', function () {
    console.log('Got uncaughtException, exiting...');
    // do some cleanup here...
    process.exit(0);
});
process.on( 'SIGTERM', function () {
    console.log('Got SIGTERM, exiting...');
    // do some cleanup here...
    process.exit(0);
});

console.log('Started...');
setTimeout(function() {

//    throw new Error( "Bad Error" );
//  process.exit(0);
}, 2000);


//var q = new opxi2.kue();
//q.complete( function( err, ids ){
//    console.log( ids );
//});
var wait_list = [];
for( i=1; i<=2000; i++) {
    wait_list[ i ] = Number( i * 10 );
}
opxi2.singletonBrokerClient().sadd( "opxi2:crm_event_list:alarmtime", wait_list, function( err2, wait_list2 ){
    console.log( err2, wait_list2 );
});