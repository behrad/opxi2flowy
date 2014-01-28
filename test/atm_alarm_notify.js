var opxi2 = require( 'opxi2node' );

var d = {
    title: "Test ATM Failure",
//   "ATM_ID": "20152015",
   "ATM_ID": "00540054",
   "LOG_DATE_TIME": time_str(new Date()),
//       "SEVERITY": "Fatal",
//       "SUPPLIES": "",
   "AMODE": 5,
   "ATM_MODE": 5,
//       "DEVICE": "Cash Handler",
   "REJECTED": 0,
   "REMAINING": 0,
   "DISPENSED": 0,
   "JAMMED": 0,
   "DENOMINATION": 0,
   "DEPOSITED": 0
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

function good( d ) {
    d = d || {
        title: "Test ATM Failure Good",
       "ATM_ID": "00540054",
//       "ATM_ID": "20152015",
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




var fakeEvent = {
    "title": "Fake ATM Failure",
    "ATM_ID": "00280028",
    "LOG_DATE_TIME": time_str(new Date()),
    "AMODE": 5,
    "ATM_MODE": 5,
    "REJECTED": 0,
    "REMAINING": 0,
    "DISPENSED": 0,
    "JAMMED": 0,
    "DENOMINATION": 0,
    "DEPOSITED": 0
};

var C1R0 = {
    "title": "Test ATM Failure",
   "ATM_ID": "00540054",
   "LOG_DATE_TIME": time_str(new Date()),
   "AMODE": 0,"ATM_MODE": 5,"DEVICE": "Cassette Type 1",
   "REJECTED": 0,"REMAINING": 0,"DISPENSED": 0,"JAMMED": 0,"DENOMINATION": 0,"DEPOSITED": 0
};
var C1R1 = {
   "title": "Test ATM Failure",
   "ATM_ID": "00540054",
   "LOG_DATE_TIME": time_str(new Date()),
   "AMODE": 0,"ATM_MODE": 5,"DEVICE": "Cassette Type 1",
   "REJECTED": 0,"REMAINING": 100,"DISPENSED": 120,"JAMMED": 0,"DENOMINATION": 0,"DEPOSITED": 0
};
var C2R0 = {
    "title": "Test ATM Failure",
   "ATM_ID": "00540054",
   "LOG_DATE_TIME": time_str(new Date()),
   "AMODE": 0,"ATM_MODE": 5,"DEVICE": "Cassette Type 2",
   "REJECTED": 0,"REMAINING": 0,"DISPENSED": 0,"JAMMED": 0,"DENOMINATION": 0,"DEPOSITED": 0
};
var C2R1 = {
    "title": "Test ATM Failure",
   "ATM_ID": "00540054",
   "LOG_DATE_TIME": time_str(new Date()),
   "AMODE": 0,"ATM_MODE": 5,"DEVICE": "Cassette Type 2",
   "REJECTED": 0,"REMAINING": 100,"DISPENSED": 0,"JAMMED": 0,"DENOMINATION": 0,"DEPOSITED": 0
};
var C3R0 = {
    title: "Test ATM Failure",
   "ATM_ID": "00540054",
   "LOG_DATE_TIME": time_str(new Date()),
   "AMODE": 0,"ATM_MODE": 5,"DEVICE": "Cassette Type 3",
   "REJECTED": 0,"REMAINING": 0,"DISPENSED": 0,"JAMMED": 0,"DENOMINATION": 0,"DEPOSITED": 0
};
var C3R1 = {
    "title": "Test ATM Failure",
   "ATM_ID": "00540054",
   "LOG_DATE_TIME": time_str(new Date()),
   "AMODE": 0,"ATM_MODE": 5,"DEVICE": "Cassette Type 3",
   "REJECTED": 0,"REMAINING": 100,"DISPENSED": 0,"JAMMED": 0,"DENOMINATION": 0,"DEPOSITED": 0
};
var C4R0 = {
    "title": "Test ATM Failure",
   "ATM_ID": "00540054",
   "LOG_DATE_TIME": time_str(new Date()),
   "AMODE": 0,"ATM_MODE": 5,"DEVICE": "Cassette Type 4",
   "REJECTED": 0,"REMAINING": 0,"DISPENSED": 0,"JAMMED": 0,"DENOMINATION": 0,"DEPOSITED": 0
};
var C4R1 = {
    "title": "Test ATM Failure",
   "ATM_ID": "00540054",
   "LOG_DATE_TIME": time_str(new Date()),
   "AMODE": 0,"ATM_MODE": 5,"DEVICE": "Cassette Type 4",
   "REJECTED": 0,"REMAINING": 100,"DISPENSED": 0,"JAMMED": 0,"DENOMINATION": 0,"DEPOSITED": 0
};

var eventCollection = [ d, C1R0, C1R1, C2R0, C2R1, C3R0, C3R1, C4R0, C4R1, fakeEvent ];
var i = 0;

if( process.argv[2] == 'good' ) {
    good().save();
} else if( process.argv[2] == 'race' ) {
    var b = bad(d);
    var g = good();
    b.save();
    g.save();
} else {

    setTimeout( function(){
        var totalEvents = [];
        for( var i=0; i<1000; i++ ) {
            totalEvents[ i ] = i;
        }
        require('async').forEach(totalEvents, function(i, callback) {
            bad( eventCollection[i++%10] ).save( function(err){callback(err);});
        }, function(err) {
            console.log( "finished ", err );
        });
    }, 5000 );

//    bad( C1R1 ).save();
//    bad( C3R0 ).save();

//    bad( d ).save( function(){ setTimeout( function(){ good().save() }, 4000)});
//    good().save();

//    bad( C2R0 ).save();


//    setInterval( function() {
//        for( var i = 0; i < 100; i++ ) {
//            bad( fakeEvent ).save();
//        }
//    }, 1000 );
}