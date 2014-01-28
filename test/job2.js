/**
 * Created with PyCharm.
 * User: jrad
 * Date: 5/14/13
 * Time: 2:00 PM
 * To change this template use File | Settings | File Templates.
 */

var opxi2 = require( 'opxi2node' );
var i = 0;

opxi2.taskq.process( "test_job", 10, function (job, done) {
    job.current_attempt = Number(job._attempts)+1 || 1;
    console.log("Receive job %s(%s): %j", "test_job", job.id, job.current_attempt , new Date() );
    if( ++i < 3 ) {
        job.set( 'data' , JSON.stringify( { my: { prop: false }, message: "Job Done!" }), done );
    } else {
        job.set( 'data' , JSON.stringify( { my: { prop: true }, message: "Job Done!" }), done );
    }

//    job.last_attempt = (job.current_attempt === Number(job._max_attempts));

//    job.set( 'data' , JSON.stringify( { ok: true, message: "Job Done!" }), done );
//    done( { error: true, message: 'Worker '+job.type+' failed' } );
//    if( job.last_attempt ) {
//        job.set( 'data' , JSON.stringify( { ok: true, message: "Job Done!" }), done );
////        done();
////        done( { error: true, message: 'Worker '+job.type+' failed' } );
//    } else {
//        job.set( 'data' , JSON.stringify( { ok: true, message: "Job Done failed!" } ), function(){
//            done( { error: true, message: 'Worker '+job.type+' failed' } );
//        });
////        done();
//    }
});

//var my_job = opxi2.taskq.create( "test_job", { title: "test_job",  test: 123 } );
//my_job.priority( 1 ).attempts( 1 ).delay( 1000 ).save();
//opxi2.taskq.on( 'job complete', function(id) {
//    if( my_job.id == id ) {
//        console.log( "a job with id " + id + " is completed, my job id: " + my_job.id );
//        if( ++i < 11 ) {
//           opxi2.kue.Job.get( my_job.id, function( err, j ) {
//                j.delay( 1000 ).update();
//                j.log( "counter " + i );
//            });
//        }
//        opxi2.kue.Job.get( id, function( err, job ){
//            if (err) return;
//            job.current_attempt = Number(job._attempts)+1 || 1;
//            job.last_attempt = (job.current_attempt === Number(job._max_attempts));
//        });
//    }
//});
//
//my_job.on( 'complete', function() {
//    my_job.get( 'data', function(error, result) {
//        if (error) {
////            console.log( 'Job task '+my_job.type+' completed but has no data: ', error, new Date() );
////            return self.failed( error );
//        }
//        console.log( 'Job task '+my_job.type+' completed with data %j, %j', result, new Date() );
////        return self.completed( result );
//    });
//
//}).on( 'failed', function() {
//    /*my_job.get( 'data', function(error, result) {
//        if (error) {
////            error.job_id = my_job.id;
////            console.log( 'Job task '+my_job.type+' failed but has no data %j, %j ', error, new Date() );
////            return self.failed( error );
//        }
////        result && (result.job_id = my_job.id);
//        console.log( 'Job task '+my_job.type+' failed with data %j, %j ', result, new Date() );
//        if( this.ignore_on_fail ) {
////            console.log( 'Job task '+my_job.type+' completed (ignoring failed) with data %j, %j ', result, new Date() );
////            return self.completed( result );
//        } else {
////            console.log( 'Job task '+my_job.type+' failed with data %j, %j ', result, new Date() );
////            return self.failed( result );
//        }
//    });*/
//
//}).on( 'progress', function( progress ){
//});

opxi2.taskq.promote();