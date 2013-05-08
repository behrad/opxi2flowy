var task = require ('dataflo.ws/task/base'),
    opxi2 = require( 'opxi2node'),
    util = require( 'util' );

var job = module.exports = function( config ) {
    this.init( config );
};

job.defaultConfig = {
    $priority: 'normal',
    $retires: 1,
	verbose: true
};

util.inherits( job, task );

util.extend( job.prototype, {

    /**
     * Create a Kue Job
     * @name Job's name to create
     * @data Job's data in json
     * @$priority Job's priority in Kue
     * @$retires Job's retry attempts in Kue
     * @$delay Job's execution delay in seconds
     *
     * returns data field of the completed job
     */
    run: function () {
        var self = this;
        self.emit( 'warn', 'Creating kue job ' + self.name );
        if( !self.data.title ) {
            self.data.title = "Job " + self.name;
        }
        var my_job = opxi2.taskq.create( self.name, self.data );
        if( self.$delay && !isNaN( self.$delay ) ) {
            my_job = my_job.delay( self.$delay );
        }
        my_job.priority( self.$priority || job.defaultConfig.$priority )
            .attempts( self.$retires || job.defaultConfig.$retires )
            .save();
        my_job.on( 'complete', function() {
            my_job.get( 'data', function(error, result) {
                if (error) {
                    self.emit( 'error', 'No job complete data: ' + error );
                }
                self.completed( result );
            });
//            self.completed( result ); //TODO ???
        }).on( 'failed', function() {
            self.failed( 'Job ' + my_job.id + ' Error' );
        }).on('progress', function( progress ){
        });
        if( self.$delay && !isNaN( self.$delay ) ) {
            opxi2.taskq.promote();
        }
    }

    /**
     * Mark a Kue Job as done
     * @job the job object
     * @done Kue done callback
     *
     * (@see worker initiators)
     */
    /*done: function () {
        var self = this;
        self.job.set( 'data' , JSON.stringify( { ok: true, message: self.message + ' is done4!' } ), self.done );
        self.completed( { ok: true, message: self.message + ' is done4!' } );
    }*/

});