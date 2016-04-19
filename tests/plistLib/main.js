define([
    'doh'
  , 'ufojs/main'
  , 'ufojs/errors'
  , 'Atem-IO/io/static'
  , 'ufojs/plistLib/main'
], function(
    doh
  , main
  , errors
  , staticIO
  , plistLib
) {
    var goodPlistPath = './testdata/good.plist'
      , goodPlistData = {
            age: 28.92,
            'birth-date': new Date(Date.UTC(1983, 0, 21, 22, 23, 23)),
            glibberish: new plistLib.types.Data('hjkljh678fghj7654refghjudertghu7654redcvghuj765t'),
            names: {
                'given-name': 'John',
                surname: 'Dow'
            },
            five: 5,
            pets: [
                'Jonny',
                'Bello',
                {
                    'given-name': 'John',
                    type: 'snail'
                }
            ],
            yes: true,
            no: false
        }
        ;


    doh.register("plistLib.main", [
    /**
     * This is to document what the _comparePlists method is supposed to do
     */
    function Test__compareObjects(){
        var a = {a: 'a', date: new Date(), b: [1,2,3,4], c: 0.1234, d:{e:'f', g:'h', i:{j:'k'}}},
            b = {a: 'a', date: new Date(a.date.getTime()), b: [1,2,3,4], c: 0.1234, d:{e:'f', g:'h', i:{j:'k'}}};
        //they are not the same object
        doh.assertFalse(a === b);
        //but look the same
        doh.assertTrue(plistLib._comparePlists(a, b));

        //the same object compares to true, too of course
        doh.assertTrue(plistLib._comparePlists(a, a));

        //now they don't look the same anymore
        b.l = undefined;
        doh.assertFalse(plistLib._comparePlists(a, b));

        //'synchronous recursion' this is allowed
        b.l = a;
        a.l = a;
        doh.assertTrue(plistLib._comparePlists(a, b));

        //'asynchronous recursion' this is very forbidden
        // => should it just return false?
        b.l = a;
        a.l = b;
        doh.assertError(
            errors.Value,
            plistLib, '_comparePlists',
            [a, b],
            'a type of recursion where we stop comparing'
        );
    },
    /**
     * To see whether we read everything, here is our expected result
     * compared against a parsed plist file
     */
    {
        name: "Test_readPlist",
        setUp: function(){
            //Setup to do before runTest.
        },
        runTest: function() {
            //we expect the parsed file to look like this
            var deferred = new doh.Deferred()
              , loadHandler = function(err, data) {
                if(err) {
                    deferred.errback(err);
                    return;
                }
                try {
                    //parse the string to an object
                    var p = plistLib.readPlistFromString(data);
                    //compare
                    doh.assertTrue(plistLib._comparePlists(p, goodPlistData, true));
                    deferred.callback(true);
                } catch(e) {
                    deferred.errback(e);
                }
            };
            staticIO.readFile({unified: loadHandler}, goodPlistPath);
            return deferred;
        },
        tearDown: function(){
            //cleanup to do after runTest.
        },
        timeout: 3000 // 3 second timeout is enough for anybody
    },
    /**
     * This checks whether we still have the same result after serialization.
     * That means: reading from XML => writing an XML string => reading
     * from the new XML again => compare
     */
    {
        name: "Test_readWriteReadPlist",
        setUp: function() {
            //Setup to do before runTest.
        },
        runTest: function(){
            var deferred = new doh.Deferred();
            var loadHandler = function(err, data) {
                if(err) {
                    deferred.errback(err);
                    return;
                }
                try {
                    //parse the string to an object
                    var p = plistLib.readPlistFromString(data),
                        // serialize the object again
                        s = plistLib.createPlistString(p),
                        // parse the serialization into an object again
                        p2 = plistLib.readPlistFromString(s);
                        // compare
                    doh.assertTrue(plistLib._comparePlists(p, p2, true));
                    deferred.callback(true);
                } catch(e) {
                    deferred.errback(e);
                }
            };
            staticIO.readFile({unified: loadHandler}, goodPlistPath);
            return deferred;
        },
        tearDown: function(){
            //cleanup to do after runTest.
        },
        timeout: 3000
    }
    ])
});
