var opxi2 = require( 'opxi2node' );


var my_job = opxi2.taskq.create('atm_failure_notify', { title: "Test atm_failure_notify", atm_name: "bbb_salam2" });
my_job.attempts(2).save().on( 'complete', function() {
    my_job.get('data', function( err, data ){
        if( err ) return console.log( err );
        return console.log( "Completed: " + JSON.stringify( data ) );
    });
});