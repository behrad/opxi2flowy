var opxi2 = require( 'opxi2node' );

var d = {
    title: "Test ATM Failure",
   "ATM_ID": "00540054",
   "LOG_DATE_TIME": time_str(new Date()),
//       "ERROR_SEVERITY_DESC": "Fatal",
//       "SUPPLIES_STATUS_DESC": "",
   "AMODE": 5,
   "ATM_MODE": 5,
//       "DEVICE": "Cash Handler",
   "NOTES_REJECTED": 0,
   "NOTES_REMAINING": 0,
   "NOTES_DISPENSED": 0,
   "NOTES_JAMMED": 0,
   "NOTES_DENOMINATION": 0,
   "NOTES_DEPOSITED": 0
};
function bad( d ) {
    var my_job = opxi2.taskq.create( 'atm_device_event', d );
    my_job.attempts(1)/*.save()*/.on( 'complete', function() {
        my_job.get('data', function( err, data ){
            if( err ) return console.log( err );
            return console.log( "Completed: " + JSON.stringify( data ) );
        });
    });
    return my_job;
}

function good() {
    var d = {
        title: "Test ATM Failure Good",
       "ATM_ID": "00540054",
       "LOG_DATE_TIME": time_str(new Date()),
//       "ERROR_SEVERITY_DESC": "Good",
//       "SUPPLIES_STATUS_DESC": "",
       "AMODE": 1,
       "ATM_MODE": 1,
//       "DEVICE": "Cash Handler",
       "NOTES_REJECTED": 0,
       "NOTES_REMAINING": 0,
       "NOTES_DISPENSED": 0,
       "NOTES_JAMMED": 0,
       "NOTES_DENOMINATION": 0,
       "NOTES_DEPOSITED": 0

    };
    var my_job = opxi2.taskq.create( 'atm_device_event', d );
    my_job.attempts(1)/*.save()*/.on( 'complete', function() {
        my_job.get( 'data', function( err, data ){
            if( err ) return console.log( err );
            return console.log( "Completed: " + JSON.stringify( data ) );
        });
    });
    return my_job;
}

if( process.argv[2] == 'good' ) {
    good().save();
} else if( process.argv[2] == 'race' ) {
    var b = bad(d);
    var g = good();
    b.save();
    g.save();
} else {
//    for( var i=0; i<2000; i++ ) {
        bad( d ).save();
//    }
}

function time_str( date ) {
    var month = date.getMonth()+1;
    return [
        date.getFullYear(),
        ((0 < month && month > 9) ? month : "0" + month),
        ((0 < date.getDate() && date.getDate() > 9) ? date.getDate() : "0" + date.getDate()),
        ((0 < date.getHours() && date.getHours() > 9) ? date.getHours() : "0" + date.getHours()),
        ((0 < date.getMinutes() && date.getMinutes() > 9) ? date.getMinutes() : "0" + date.getMinutes()),
        ((0 < date.getSeconds() && date.getSeconds() > 9) ? date.getSeconds() : "0" + date.getSeconds())
    ].join( '' );
}