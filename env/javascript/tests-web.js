define(['doh/runner', 'doh/_browserRunner'],
function(){
    var factories= doh;
    doh= {};
    factories.runnerFactory(doh);
    factories.browserRunnerFactory(doh);
    
    //tell the loader about our new doh module
    define("doh", [], doh);
    //now load our tests and execute them when ready
    require(['tests'], function(){doh.run();});
});
