var task = require ('dataflo.ws/task/base'),
    opxi2 = require( 'opxi2node'),
    util = require( 'util' );

var job = module.exports = function( config ) {
    this.init( config );
};

job.defaultConfig = {
    $priority: 'normal', // 10, 0, -5, -10, -15
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
        var prio = (-1 *Number(self.$priority)) || job.defaultConfig.$priority;
        self.data.parent_flow_id = self.flow_id;
        var my_job = opxi2.taskq.create( self.name, self.data || {} );
        if( self.delay && !isNaN( self.delay ) ) {
            my_job = my_job.delay( Number(self.delay) * 1000 );
        }
//        self.emit( 'info', 'Creating job ' + self.name + ' {retries=' + retries + '}' );
        opxi2.log( 'Creating job ' + self.name + ' {retries=' + retries + '}' );
        my_job.priority( prio ).attempts( retries );
        if( self.blocking ) {
            opxi2.taskq.on( 'job complete', function( id ) {
                if( id == my_job.id ) {
                    opxi2.kue.Job.get( id, function( err, job ){
                        if (err) return self.failed( err );
                        job.data && (job.data.job_id = job.id);
                        if( job.data.error ) {
                            if( !self.break_on_fail /*self.ignore_on_fail*/ ) {
                                opxi2.log( 'Job task '+job.type+'(%d) completed but with fail data ', job.id );
//                                TODO This stops flow from going on when job fails...!
//                                TODO related to kue's bug of bad callbacks on attampts>1
//                                return self.failed( job.data );
                                return self.completed( job.data );
                            } else if( self.break_on_fail ) {
                                opxi2.log( 'Job task '+job.type+'(%d) failed with data ', job.id );
                                return self.failed( job.data );
                            }
                        } else {
                            opxi2.log( 'Job task '+job.type+'(%d) completed with data %j', job.id );
                            return self.completed( job.data );
                        }
                    });
                }
            });
            if( retries == 1 ) {
                my_job.on( 'failed', function() {
                    opxi2.log( "job_task failed ??? ", self.name, my_job.id );
                    my_job.get( 'data', function(error, result) {
                        if (error) {
                            error.job_id = my_job.id;
                            opxi2.log( 'Job task '+my_job.type+' failed but has no data: ', error );
                            return self.failed( error );
                        }
                        result && (result.job_id = my_job.id);
                        if( !self.break_on_fail ) {
                            opxi2.log( 'Job task '+my_job.type+' completed (ignoring failed) with data ', result );
                            return self.completed( result );
                        } else {
                            opxi2.log( 'Job task '+my_job.type+' failed with data ', result );
                            return self.failed( result );
                        }
                    });

                })/*.on( 'complete', function() {
                    my_job.get( 'data', function(error, result) {
                        if (error) {
                            error.job_id = my_job.id;
                            opxi2.log( 'Job task '+my_job.type+' completed but has no data: ', error );
                            return self.failed( error );
                        }
                        result && (result.job_id = my_job.id);
                        opxi2.log( 'Job task '+my_job.type+' completed with data %j', result );
                        return self.completed( result );
                    });

                })*//*.on( 'progress', function( progress ){
                })*/;
            }

            self.model = { stop: function(){} };
            if( !self.timeout || self.timeout<2 ) {
                self.timeout = 60*60*4;
            }
            self.activityCheck( 'job run' );
            my_job.save( function( err ){
                if( err || !my_job.id ) {
                    console.log( "Error Saving Job ", err );
                    return this.failed( err );
                }
                return self.registerCancel( my_job.id );
            });
        } else {
            my_job.save( function( err ){
                if( err || !my_job.id ) {
                    console.log( "Error Saving Job ", err );
                    return this.failed( err );
                }
                self.registerCancel( my_job.id );
                return self.completed( my_job.id );
            });
        }
    },

    registerCancel: function( jobId ) {
        if( jobId ) {
            this.on( 'cancel', function () {
                opxi2.log( "Task %s(%s) of flow %s create job %s", this.name, jobId, this.flowId, 'cancel-'+this.name );
                opxi2.taskq.create( 'cancel-' + this.name, { title: 'Flow '+this.flowId+' canceled job ' + jobId, job_id: jobId } ).save();
            }.bind( this ) );
        } else {
            opxi2.log( "Cannot register on task's cancel, saved job has no id ", this.flowId );
        }
    },

    progress: function() {
        if( this.inc ) {
            var delta = Number(this.level) / (Number(this.of) || 100);
            this.job_id && opxi2.kue.Job.get( this.job_id, function( err, job ) {
                if( err ) return this.completed( err );
                job && job.progress( delta + Number(job._progress), 100 );
                this.completed( true );
            }.bind( this ));
        } else {
            this.job && this.job.progress( Number(this.level), Number(this.of) || 100 );
            this.completed( true );
        }
    },

    log: function() {
        var self = this;
        var args = self.args && self.args.map && self.args.map( function( arg ){
            if( arg && !arg.split ) {
                try {
                    return JSON.stringify( arg );
                } catch(e){
                }
            }
            return arg;
        });
        self.job.log( self.format , args || self.args );
        self.completed( true );
    },

    getProperty: function (obj, path) {
        var val = obj;
        var hasProp = path.split('.').every(function (prop) {
                val = val[prop];
                return null != val;
        });
        return hasProp ? val : undefined;
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
        if( self.data ) {
            self.job.set( 'data' , JSON.stringify( self.data ), self.done );
        } else {
            self.done && self.done();
        }
        self.completed( true );
    }

});
