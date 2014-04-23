define(['doh/runner', 'doh/_browserRunner'],
function(){
    var factories= doh;
    doh= {};
    factories.runnerFactory(doh);
    factories.browserRunnerFactory(doh);
    
    //tell the loader about our new doh module
    define("doh", [], doh);
    //now load our tests and execute them when ready
    
    
    // the tests module loads all tests
    var module = 'tests';
    // using the location hash, we can test only a specific module
    // example: http://localhost:8080/env/tests.html#tests/tools/pens/TransformPen
    if(window.location.hash) {
        module = window.location.hash[0] === '#'
            ? window.location.hash.slice(1)
            : window.location.hash.slice(1);
    }
    
    require([module], function(){doh.run();});
});
