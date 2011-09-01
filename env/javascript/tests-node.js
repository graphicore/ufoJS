print = console.log;//doh expects a print method
require({
    baseUrl: 'javascript',
    packages:[
        {
            name: 'doh',
            lib: '',
            location: 'doh'
        },
        {
            name: 'ufojs',
            location: '../../lib',
            lib: ''
        },
        {
            name: 'tests',
            location: '../../tests',
            lib: ''
        }
    ]
},
['doh/runner'],
function(){
    var factories = doh;
    doh= {};
    factories.runnerFactory(doh);
    
    doh.debug = console.log;
    doh.error = console.log;
    
    // Override the doh._report method to make it quit with an
    // appropriate exit code in case of test failures.
    var oldReport = doh._report;
    doh._report = function(){
        oldReport.apply(doh, arguments);
        if(this._failureCount > 0 || this._errorCount > 0){
            process.exit(1);
        }
    }
    
    doh._testFinished = function(group, fixture, success){
        var elapsed = fixture.endTime-fixture.startTime;
        this.debug((success ? "PASSED" : "FAILED"), "test:", fixture.name, elapsed, 'ms');
    }
    //tell the loader about doh
    define('doh', [], doh);
    //now load our tests and execute them when ready
    require(['tests'], function(tests){doh.run();});
});
