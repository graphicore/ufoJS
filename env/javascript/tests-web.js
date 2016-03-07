require([
    '../../lib/bower_components/Atem-RequireJS-Config/nodeConfig'
], function(
    configure
) {
    "use strict";
    var setup = {
        baseUrl: '../'
      , bowerPrefix: './lib/bower_components'
      , paths: {
            'ufojs': './lib'
          , 'tests': './tests/'
          , 'doh': './env/javascript/doh'
        }
    }
    configure(setup, require);
    require(['doh/browserRunner'], function(doh) {
        var factories = doh;
        window.doh = doh = {};
        factories.runnerFactory(doh);
        factories.browserRunnerFactory(doh);

        //tell the loader about our new doh module
        define("doh", [], doh);

        //now load our tests and execute them when ready

        // the tests module loads all tests
        var module = 'tests/main';
        // using the location hash, we can test only a specific module
        // example: http://localhost:8080/env/tests.html#tests/tools/pens/TransformPen
        if(window.location.hash) {
            module = window.location.hash[0] === '#'
                ? window.location.hash.slice(1)
                : window.location.hash.slice(1);
        }

        require([module], function() {
            // dirty fix to make doh render some details
            // doh binds this to window.onLoad in browserRunner
            // (let's assume the window is loaded by now ...)
            dispatchEvent(new Event('load'));
            doh.run();
        });
    });
});
