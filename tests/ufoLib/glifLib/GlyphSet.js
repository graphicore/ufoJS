define([
    'ufojs'
  , 'ufojs/errors'
  , 'ufojs/ufoLib/glifLib/misc'
  , 'ufojs/ufoLib/glifLib/GlyphSet'
], function(
    main
  , errors
  , misc
  , GlyphSet
) {
    "use strict";
    
    var testGlyphSet = 'testdata/TestFont1 (UFO3).ufo/glyphs'
      , contentsPlist = 'testdata/TestFont1 (UFO3).ufo/glyphs/contents.plist'
      , contentsPlistContent = { A: 'A_.glif', B: 'B_.glif' }
      // plist with array as root element
      , arrayPlist = 'testdata/array.plist'
      , arrayData = [ 'Jonny', 'Bello', { 'given-name': 'John', type: 'snail' } ]
      , faultyPlist = 'testdata/faulty.plist'
      ;
    
    doh.register("ufoLib.glifLib.GlyphSet", [
        function Test_GlyphSet_constructor() {
            var glyphset
              , injectedFunc = function(){}
              ;
            
            // instead of new
            glyphset = Object.create(GlyphSet.prototype);
            // run the constructor
            doh.assertError(
                errors.GlifLib,
                GlyphSet, 'call',
                [glyphset],
                'GlyphSet: dirName is missing'
            );
            
            // instead of new
            glyphset = Object.create(GlyphSet.prototype);
            // run the constructor
            doh.assertError(
                errors.GlifLib,
                GlyphSet, 'call',
                [glyphset, testGlyphSet, undefined, -1],
                'Unsupported UFO format version: -1'
            );
            
            glyphset = new GlyphSet(testGlyphSet, undefined, 3);
            doh.assertEqual(3, glyphset.ufoFormatVersion)
            doh.assertEqual(testGlyphSet, glyphset.dirName)
            // check that this uses the default method
            doh.assertEqual(misc.glyphNameToFileName,
                                            glyphset.glyphNameToFileName)
            
            glyphset = new GlyphSet(testGlyphSet, injectedFunc);
            doh.assertEqual(injectedFunc, glyphset.glyphNameToFileName)
        }
      , function Test_GlyphSet_readPlist_sync() {
            var glyphset
              , array;
            
            glyphset = new GlyphSet(testGlyphSet);
            
            // this works with any plist
            doh.assertEqual(arrayData, glyphset._readPlist(false, arrayPlist));
            // and with contents.plis
            doh.assertEqual(contentsPlistContent,
                            glyphset._readPlist(false, contentsPlist));
            // errors.IONoEntry, is expected on 404 or equivalent
            doh.assertError(
                errors.IONoEntry,
                glyphset, '_readPlist',
                [false, 'non-existant.plist'],
                "IONoEntry Error: ENOENT, no such file or directory "
                + "'non-existant.plist'"
            )
            // anything else must raise errors.GlifLib
            doh.assertError(
                errors.GlifLib,
                glyphset, '_readPlist',
                [false, faultyPlist],
                'GlifLib Error: The file "testdata/faulty.plist" could '
                + 'not be read. ...'
            )
        }
      , function Test_GlyphSet_readPlist_async_loadAnyPlist() {
            var glyphset = new GlyphSet(testGlyphSet)
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;
            // this works with any plist
            glyphset._readPlist(true, arrayPlist)
            .then(function(array) {
                doh.assertEqual(arrayData, array);
                deferred.callback(true);
            })
            .then(undefined, errback)
            return deferred;
        }
      , function Test_GlyphSet_readPlist_async_loadContentsPlist() {
            var glyphset = new GlyphSet(testGlyphSet)
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;
            // this works with any plist
            glyphset._readPlist(true, contentsPlist)
            .then(function(contents) {
                doh.assertEqual(contentsPlistContent, contents);
                deferred.callback(true);
            })
            .then(undefined, errback)
            return deferred;
        }
      , function Test_GlyphSet_readPlist_async_IONoEntry() {
            var glyphset = new GlyphSet(testGlyphSet)
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;
            // errors.IONoEntry, is expected on 404 or equivalent
            glyphset._readPlist(true, 'non-existant.plist')
            .then(
                function(result) {
                    throw new Error('This test-case is broken. An IONoEntry '
                        +' error was provoked, but a result appeared.')
                },
                function(error) {
                    doh.assertError(
                        errors.IONoEntry,
                        {echo: function(error){ throw error; }}, 'echo',
                        [error],
                        "IONoEntry Error: ENOENT, no such file or directory "
                            + "'non-existant.plist'"
                    )
                    deferred.callback(true);
                }
            )
            .then(undefined, errback)
            return deferred;
        }
      , function Test_GlyphSet_readPlist_async_GLifLibError() {
            var glyphset = new GlyphSet(testGlyphSet)
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;
            // errors.GlifLib, is expected
            glyphset._readPlist(true, faultyPlist)
            .then(
                function(result) {
                    throw new Error('This test-case is broken. An GlifLib '
                        +' error was provoked, but a result appeared.')
                },
                function(error) {
                    doh.assertError(
                        errors.GlifLib,
                        {echo: function(error){ throw error; }}, 'echo',
                        [error],
                        'GlifLib Error: The file "testdata/faulty.plist" '
                        + 'could not be read. ...'
                    )
                    deferred.callback(true);
                }
            )
            .then(undefined, errback)
            return deferred;
        }
        
      , function Test_GlyphSet_rebuildContents_sync() {
            var glyphset
                ;
            glyphset = new GlyphSet(testGlyphSet);
            
            
        }
      , function Test_GlyphSet_factory() {
            
            
            
        }
    ])
});
