var opxi2 = require( 'opxi2node' );


var my_job = opxi2.taskq.create( 'atm_device_event', {
    title: "Test atm_device_event",

    ATM_ID: 1364,
    LOG_DATE_TIME: "20130619162500",
    ERROR_SEVERITY_DESC: "",
    SUPPLIES_STATUS_DESC: "",
    ATM_MODE: null,
    DEVICE_NAME: "",
    NOTES_REJECTED: 0,
    NOTES_REMAINING: 0,
    NOTES_DISPENSED: 0,
    NOTES_JAMMED: 0,
    NOTES_DENOMINATION: 0,
    NOTES_DEPOSITED: 0

});
my_job.attempts(1).save().on( 'complete', function() {
    my_job.get('data', function( err, data ){
        if( err ) return console.log( err );
        return console.log( "Completed: " + JSON.stringify( data ) );
    });
});