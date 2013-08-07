var task = require ('dataflo.ws/task/base'),
    opxi2 = require( 'opxi2node'),
    util = require( 'util' );

var job = module.exports = function( config ) {
    this.init( config );
};

job.defaultConfig = {
    $priority: 'normal',
    $retries: 1,
	verbose: true
};

util.inherits( job, task );

util.extend( job.prototype, {

    /**
     * Create a Kue Job
     * @name Job's name to create
     * @data Job's data in json
     * @$priority Job's priority in Kue
     * @$retries Job's retry attempts in Kue
     * @delay Job's execution delay in seconds
     *
     * returns data field of the completed job
     */
    run: function () {
        var self = this;
        if( self.data && !self.data.title ) {
            self.data.title = "Flow Job " + self.name;
        }
        if( self.title ) {
            self.data.title = self.title;
        }
        var retries = Number( self.$retries ) || job.defaultConfig.$retries;
        var my_job = opxi2.taskq.create( self.name, self.data || {} );
        if( self.delay && !isNaN( self.delay ) ) {
            my_job = my_job.delay( Number(self.delay) * 1000 );
        }
        self.emit( 'info', 'Creating job ' + self.name + ' {retries=' + retries + '}' );
        console.log( 'Creating job ' + self.name + ' {retries=' + retries + '}' );
        my_job.priority( self.$priority || job.defaultConfig.$priority )
            .attempts( retries )
            .save();
        if( self.blocking ) {
            setTimeout( function(){
                self.registerCancel( my_job.id );
            }, 200 );
            opxi2.taskq.on( 'job complete', function(id) {
                if( id == my_job.id ) {
                    opxi2.kue.Job.get( id, function( err, job ){
                        if (err) return self.failed( err );
                        job.data && (job.data.job_id = job.id);
                        if( job.data.error ) {
                            if( !self.break_on_fail /*self.ignore_on_fail*/ ) {
                                console.log( 'Job task '+job.type+' completed with error data ', job.data );
                                return self.completed( job.data );
                            } else if( self.break_on_fail ) {
                                console.log( 'Job task '+job.type+' failed with data ', job.data );
                                return self.failed( job.data );
                            }
                        } else {
                            console.log( 'Job task '+job.type+' completed with data %j', job.data );
                            return self.completed( job.data );
                        }
                    });
                }
            });
            /*my_job.on( 'complete', function() {
                my_job.get( 'data', function(error, result) {
                    if (error) {
                        error.job_id = my_job.id;
                        console.log( 'Job task '+my_job.type+' completed but has no data: ', error );
                        return self.failed( error );
                    }
                    result && (result.job_id = my_job.id);
                    console.log( 'Job task '+my_job.type+' completed with data %j', result );
                    return self.completed( result );
                });

            }).on( 'failed', function() {
                my_job.get( 'data', function(error, result) {
                    if (error) {
                        error.job_id = my_job.id;
                        console.log( 'Job task '+my_job.type+' failed but has no data: ', error );
                        return self.failed( error );
                    }
                    result && (result.job_id = my_job.id);
                    if( self.ignore_on_fail ) {
                        console.log( 'Job task '+my_job.type+' completed (ignoring failed) with data ', result );
                        return self.completed( result );
                    } else {
                        console.log( 'Job task '+my_job.type+' failed with data ', result );
                        return self.failed( result );
                    }
                });

            }).on( 'progress', function( progress ){
            });*/
        } else {
            setTimeout( function(){
//                self.registerCancel( my_job.id );
                self.completed( my_job.id );
            }, 200 );
        }
        if( self.delay && !isNaN( self.delay ) ) {
            opxi2.taskq.promote();
        }
    },

    registerCancel: function( jobId ) {
        var self = this;
        self.on( 'cancel', function () {
            console.log( "Canceling Job %s: ", self.name, jobId );
            //TODO what should we do about the job object itself !?
            opxi2.taskq.create( 'cancel-' + self.name, { job_id: jobId } ).priority( 'high' ).save();
        }.bind( self ) );
    },

    /**
     * Mark a Kue Job as done
     * @job the job object
     * @done Kue done callback
     * @message
     *
     * (@see worker initiators)
     */
    done: function () {
        var self = this;
        self.job.set( 'data' , JSON.stringify( self.data ), self.done );
        self.completed( self.data );
    }

});