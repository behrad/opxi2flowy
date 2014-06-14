//require('look').start();

/*require('nodetime').profile({
    accountKey: 'ee5c0aff53d6231517a4f04c16dd441dfd34bc7d',
    appName: 'Opxi2Flowy Basamad'
});*/


/*var heapdump = require('heapdump');
var nextMBThreshold = 0;
setInterval(function () {
  var memMB = process.memoryUsage().rss / 1048576;
  if (memMB > nextMBThreshold) {
      heapdump.writeSnapshot();
      nextMBThreshold += 100;
  }
}, 6000 * 2);*/





var cluster = require( 'cluster' );
var numCPUs = require('os').cpus().length;
var numWorkers = numCPUs;

//cluster.setupMaster({
//  exec : "worker.js",
//  args : ["--use", "https"],
//  silent : true
//});
var is_running = true;
var opxi2_workers = [];
var opxi2_workers_size = opxi2_workers.length;

if (cluster.isMaster) {
    cluster.on('exit', function(worker, code, signal) {
        for(var i=0; i < opxi2_workers.length;i++){
            var aworker = opxi2_workers[i];
            if( aworker.process.pid === worker.process.pid ) {
                opxi2_workers.splice(i,1);
            }
            opxi2_workers_size = opxi2_workers.length;
        }
        if( is_running ) {
            console.log('Worker [' + worker.process.pid + '] died ('+worker.process.exitCode+'), re-spawning...');
            createWorker();
        }
    });
    console.log( "Going to spawn %d workers by master pid %s", numWorkers, process.pid );
//    bootstrap_flow( "all" );
    bootstrap_flow( "core" );
//    TODO master worker bayad betoone active job haye moonde (az type haaaye marboot bekhodesho!????) inactive kone dobare pardazesh beshan)
    for (var i = 0; i < numWorkers; i++) {
        createWorker();
    }
    bind_term_recovery( process );
} else {
    console.log( "Spawning worker[%s] with pid %s", cluster.worker.id, cluster.worker.process.pid  );
    bootstrap_flow( "worker" /*,cluster.worker.id*/ );
    bind_term_recovery( cluster.worker.process );
}

function createWorker() {
    var worker = cluster.fork();
    worker.on('message', function(msg) {
        if( msg == "OPXI2_WORKER_DOWN" ) {
            console.log('Got message %s from %s in master...', msg, worker.process.pid, process.pid );
            quit_if_ready();
        }
    });
    opxi2_workers.push( worker );
    opxi2_workers_size = opxi2_workers.length;
}

function quit_if_ready(){
    if( !--opxi2_workers_size ) {
        console.log('Master %s ready to exit now!', process.pid );
        process.exit( 0 );
    }
}


function bind_term_recovery( process ) {
    process.on('message', function(msg) {
        if( msg == "OPXI2_WORKER_SHUTDOWN_REQ" ) {
            console.log('Got %s in worker, exiting...', msg, process.pid );
            require( 'opxi2node').gracefulShutdown( function(err){
                process.send( 'OPXI2_WORKER_DOWN' );
            });
        }
    });
    process.once( 'uncaughtException', function (err) {
        console.log('Uncaught Error in %s, exiting... ', process.pid, err, err.stack );
        shutdown_gracefully( process );
    });
    process.once( 'SIGTERM', function ( sig ) {
        console.log('Got SIGTERM in %s, exiting...', process.pid );
        shutdown_gracefully( process );
    });
}

function shutdown_gracefully( process ) {
    if( cluster.isMaster ) {
        is_running = false;
        opxi2_workers_size++;
        require( 'opxi2node').gracefulShutdown( function(err){
            quit_if_ready();
        });
        for(var i=0; i < opxi2_workers.length; i++){
//                opxi2_workers[i].kill( 'SIGTERM' );
            try{ opxi2_workers[i].send( 'OPXI2_WORKER_SHUTDOWN_REQ' ); } catch( e ){ console.error( e );opxi2_workers_size--;}
        }
    } else {
//            cluster.worker.kill( 'SIGTERM' );
        require('opxi2node').gracefulShutdown( function(err){
            process.exit( 0 );
        });
    }
}


function bootstrap_flow( daemon_name ) {
    var MODULE_NAME = 'dataflo.ws';
    var INITIATOR_PATH = 'initiator';
    var DEFAULT_REQUIRE = 'main';
    var path = require('path');
    var dataflows = require(MODULE_NAME);
    var common = require(path.join(MODULE_NAME, 'common'));
    var $global = common.$global;
    var project = $global.project = common.getProject();
    project.on('ready', function () {
        var conf = project.config;

        // load local modules
        var requires = conf.requires || [ DEFAULT_REQUIRE ];
        if (!Object.is('Array', requires)) {
            requires = [ requires ];
        }
        requires.forEach(function (modName) {
            var mod = project.require(modName);

            // exporting everything to mainModule,
            // be careful about name conflicts
            if (mod) {
                Object.keys(mod).forEach(function (key) {
                    $global.$mainModule.exports[key] = mod[key];
                });
            } else {
                console.warn('Module %s not found', modName);
            }
        });

        // now we can launch script;
        // script require postponed until project get prepared
        var scriptName = process.argv[2] || 'daemon';

        var scriptClass;
        try {
            scriptClass = require (path.join (MODULE_NAME, 'script', scriptName));
        } catch (e) {
            try {
                scriptClass = require (project.root.fileIO ('bin', scriptName).path);
            } catch (e) {
                // console.log (e);
            }
        }

        if (!scriptClass) {
            // TODO: list all available scripts with descriptions
            console.error('sorry, there is no such script "%s"', scriptName);
            process.exit();
        }

        var scriptMethod = 'launch';
        scriptClass.launchContext = function () {
            return {
                configKey: daemon_name
            };
        };
        if (typeof scriptClass.launchContext == 'function') {
            var launchContext = scriptClass.launchContext();
            if (launchContext.method) {
                scriptMethod = launchContext.method;
            }
        }

        if (typeof scriptClass[scriptMethod] == 'function') {
            scriptClass[scriptMethod](conf);
        } else {
            console.error(
                'missing method "%s" for script "%s"',
                scriptMethod, scriptName
            );
            process.exit();
        }
    });
}
