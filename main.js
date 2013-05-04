var opxi2 = require( 'opxi2node' );

opxi2.taskq.process( 'flowyjob', opxi2.CONFIG.core.concurrency, function (job, done) {
    console.log("Receive flowyjob %j", job.data );
    setTimeout(
        function(){
            job.set( 'data' , JSON.stringify( { ok: true, message: 'This Job is done!' } ), done );
        },
        1000
    );
});