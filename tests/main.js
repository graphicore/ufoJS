dojo.provide('graphicore.tests.main');
/**
 * this is a little hackish. We use a doh test module to bootstrap
 * a test environment that suits us better, using the backdraft loader
 * and its configuration
 **/

// delete the define implementation of dojo to enable loading of the
// backdraft loader. require js will not load when a global var 'define'
// exists. There might be no 'define' declared by dojo when you use the
// built version of dojo or an old one. At least dojo-release-1.6.1-src
// defines 'define'
delete(define);

//setup the backdraft loader
var require = {
    baseUrl: '/javascript',
    packages:[
        {
            name: 'graphicore',
        },
        {
            name: 'tests',
            lib: '',
            location:'graphicore/tests'
        }
    ]
}

//use dojo internals to load the backdraft loader syncronous
dojo._loadUri('../../require.js');

//now use backdraft to load our tests and execute them when ready
require([
        'tests/errors',
        'tests/testmain',
        'tests/tools/pens/AbstractPen',
        'tests/tools/pens/main',
        'tests/tools/misc/transform',
        'tests/tools/pens/TransformPen',
        'tests/tools/pens/BasePen',
        'tests/tools/pens/AbstractPointPen',
        'tests/tools/pens/BasePointToSegmentPen',
        'tests/tools/pens/PointToSegmentPen'
    ], function(){doh.run();});
