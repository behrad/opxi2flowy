/**
 * Created with PyCharm.
 * User: jrad
 * Date: 5/14/13
 * Time: 2:00 PM
 * To change this template use File | Settings | File Templates.
 */

var opxi2 = require( 'opxi2node' );


opxi2.taskq.process( "kue_test_job", 200, function (job, done) {
    job.current_attempt = Number(job._attempts)+1 || 1;
    console.log("Receive job %s(%s): %j", "kue_test_job", job.id, job.current_attempt , new Date() );
    job.last_attempt = (job.current_attempt === Number(job._max_attempts));

//    job.set( 'data' , JSON.stringify( { ok: true, message: "Job Done!" }), done );
//    done( { error: true, message: 'Worker '+job.type+' failed' } );
    if( job.last_attempt ) {
        job.set( 'data' , JSON.stringify( { ok: true, message: "Job Done!" }), done );
//        done();
//        done( { error: true, message: 'Worker '+job.type+' failed' } );
    } else {
        job.set( 'data' , JSON.stringify( { ok: true, message: "Job Done failed!" } ), function(){
            done( { error: true, message: 'Worker '+job.type+' failed' } );
        });
//        done();
    }
});

var my_job = opxi2.taskq.create( "kue_test_job", { title: "kue_test_job",  test: 123 } );
my_job.priority( 1 ).attempts( 3 ).save();
opxi2.taskq.on( 'job complete', function(id) {
    console.log( "a job with id " + id + " is completed, my job id: " + my_job.id );
    opxi2.kue.Job.get( id, function( err, job ){
        if (err) return;
        job.current_attempt = Number(job._attempts)+1 || 1;
        job.last_attempt = (job.current_attempt === Number(job._max_attempts));
    });
});

my_job.on( 'complete', function() {
    my_job.get( 'data', function(error, result) {
        if (error) {
//            console.log( 'Job task '+my_job.type+' completed but has no data: ', error, new Date() );
//            return self.failed( error );
        }
        console.log( 'Job task '+my_job.type+' completed with data %j, %j', result, new Date() );
//        return self.completed( result );
    });

}).on( 'failed', function() {
    opxi2.kue.Job.get( my_job.id, function( err, job ){
        if (err) return;
        console.log( "+++++++++++++++++++++++++++++++++++++ ", job._error );
    });
    my_job.get( 'data', function(error, result) {
        if (error) {
//            error.job_id = my_job.id;
//            console.log( 'Job task '+my_job.type+' failed but has no data %j, %j ', error, new Date() );
//            return self.failed( error );
        }
//        result && (result.job_id = my_job.id);
        console.log( 'Job task '+my_job.type+' failed with data %j, %j ', result, new Date() );
        if( this.ignore_on_fail ) {
//            console.log( 'Job task '+my_job.type+' completed (ignoring failed) with data %j, %j ', result, new Date() );
//            return self.completed( result );
        } else {
//            console.log( 'Job task '+my_job.type+' failed with data %j, %j ', result, new Date() );
//            return self.failed( result );
        }
    });

}).on( 'progress', function( progress ){
});
