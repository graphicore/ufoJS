define([
    'ufojs'
  , 'ufojs/errors'
  , 'ufojs/ufoLib/glifLib/misc'
  , 'ufojs/ufoLib/glifLib/GlyphSet'
  , 'ufojs/tools/io/main'
], function(
    main
  , errors
  , misc
  , GlyphSet
  , staticIO
) {
    "use strict";
    
    var testGlyphSet = 'testdata/TestFont1 (UFO3).ufo/glyphs'
      , contentsPlist = testGlyphSet + '/contents.plist'
        
      , glyphSetFaulty = 'testdata/contentplists/faulty'
      , faultyPlist = glyphSetFaulty + '/contents.plist'
      
      , glyphSetEmpty = 'testdata/contentplists/empty'
      , notFoundPlist = glyphSetEmpty + '/contents.plist'
      
      , glyphSetFileNameFail = 'testdata/contentplists/file-name-fail'
      
      , glyphSetMissingGlyph = 'testdata/contentplists/missing-glyph'
      
      
      
      , contentsPlistContent = { A: 'A_.glif', B: 'B_.glif' }
      // plist with array as root element
      , arrayPlist = 'testdata/array.plist'
      , arrayData = [ 'Jonny', 'Bello', { 'given-name': 'John', type: 'snail' } ]
      
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
                'GlyphSet I/O module missing'
            );
            
            // instead of new
            glyphset = Object.create(GlyphSet.prototype);
            // run the constructor
            doh.assertError(
                errors.GlifLib,
                GlyphSet, 'call',
                [glyphset, staticIO],
                'GlyphSet: dirName is missing'
            );
            
            // instead of new
            glyphset = Object.create(GlyphSet.prototype);
            // run the constructor
            doh.assertError(
                errors.GlifLib,
                GlyphSet, 'call',
                [glyphset, staticIO, testGlyphSet, undefined, -1],
                'Unsupported UFO format version: -1'
            );
            
            glyphset = new GlyphSet(staticIO, testGlyphSet, undefined, 3);
            doh.assertEqual(3, glyphset.ufoFormatVersion)
            doh.assertEqual(testGlyphSet, glyphset.dirName)
            // check that this uses the default method
            doh.assertEqual(misc.glyphNameToFileName,
                                            glyphset.glyphNameToFileName)
            // glyphset.contents is set by rebuildContents
            doh.assertEqual(undefined, glyphset.contents)
            doh.assertTrue('contents' in glyphset)
            
            glyphset = new GlyphSet(staticIO, testGlyphSet, injectedFunc);
            doh.assertEqual(injectedFunc, glyphset.glyphNameToFileName)
        }
      , function Test_GlyphSet_readPlist_sync() {
            var glyphset
              , array;
            
            glyphset = new GlyphSet(staticIO, testGlyphSet);
            
            // this works with any plist
            doh.assertEqual(arrayData, glyphset._readPlist(false, arrayPlist));
            // and with contents.plis
            doh.assertEqual(contentsPlistContent,
                            glyphset._readPlist(false, contentsPlist));
            // errors.IONoEntry, is expected on 404 or equivalent
            doh.assertError(
                errors.IONoEntry,
                glyphset, '_readPlist',
                [false, notFoundPlist],
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
            var glyphset = new GlyphSet(staticIO, testGlyphSet)
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
            var glyphset = new GlyphSet(staticIO, testGlyphSet)
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
            var glyphset = new GlyphSet(staticIO, testGlyphSet)
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;
            // errors.IONoEntry, is expected on 404 or equivalent
            glyphset._readPlist(true, notFoundPlist)
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
            var glyphset = new GlyphSet(staticIO, testGlyphSet)
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
        
      , function Test_GlyphSet_rebuildContents_faultyPlist() {
            var glyphset
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;
            // errors.GlifLib, is expected
            
            // sync
            // anything else must raise errors.GlifLib
            glyphset = new GlyphSet(staticIO, glyphSetFaulty)
            doh.assertError(
                errors.GlifLib,
                glyphset, 'rebuildContents',
                [false],
                'GlifLib Error: The file "testdata/faulty.plist" could '
                + 'not be read. ...'
            )
            
            // async
            glyphset = new GlyphSet(staticIO, glyphSetFaulty)
            glyphset.rebuildContents(true)
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
      , function Test_GlyphSet_rebuildContents_notFoundPlist() {
            // missing contentsPlist: consider the glyphset to be empty.
            var glyphset
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;
              
            // sync
            glyphset = new GlyphSet(staticIO, glyphSetEmpty)
            glyphset.rebuildContents(false)
            doh.assertEqual({}, glyphset.contents)
            
            // async
            glyphset = new GlyphSet(staticIO, glyphSetEmpty)
            glyphset.rebuildContents(true)
            .then(function() {
                doh.assertEqual({}, glyphset.contents)
                deferred.callback(true);
            })
            .then(undefined, errback)
            return deferred;
        }
      , function Test_GlyphSet_rebuildContents_fileNameFail() {
            // contents.plist is not properly formatted the value at "name"
            // is not string but:'+ typeof fileName);
            var glyphset
            , deferred = new doh.Deferred()
            , errback = deferred.errback.bind(deferred)
            ;
            
            // sync
            glyphset = new GlyphSet(staticIO, glyphSetFileNameFail);
            doh.assertError(
                errors.GlifLib,
                glyphset, 'rebuildContents',
                [false],
                'GlifLib Error: contents.plist is not properly formatted '
                + 'the value at "B" is not string but:number'
            )
            
            // async
            glyphset = new GlyphSet(staticIO, glyphSetFileNameFail)
            glyphset.rebuildContents(true)
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
                        'GlifLib: contents.plist is not properly '
                        + 'formatted the value at "B" is not string but:number'
                    )
                    deferred.callback(true);
                }
            )
            .then(undefined, errback)
            return deferred;
        }
      , function Test_GlyphSet_rebuildContents_missingGlyph() {
            // contents.plist references a file that does not exist: + filePaths[i]
            var glyphset
            , deferred = new doh.Deferred()
            , errback = deferred.errback.bind(deferred)
            ;
            // sync
            glyphset = new GlyphSet(staticIO, glyphSetMissingGlyph);
            doh.assertError(
                errors.GlifLib,
                glyphset, 'rebuildContents',
                [false],
                'GlifLib: contents.plist references a file that '
                + 'does not exist: '
                + 'testdata/contentplists/missing-glyph/C_.glif'
            )
            
            // async
            glyphset = new GlyphSet(staticIO, glyphSetMissingGlyph)
            glyphset.rebuildContents(true)
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
                        'GlifLib: contents.plist references a file '
                        + 'that does not exist: '
                        + 'testdata/contentplists/missing-glyph/C_.glif'
                    )
                    deferred.callback(true);
                }
            )
            .then(undefined, errback)
            return deferred;
        }
      , function Test_GlyphSet_factory() {
            var glyphset
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;
            
            // sync
            glyphset = GlyphSet.factory(false, staticIO, testGlyphSet);
            doh.assertTrue(glyphset instanceof GlyphSet);
            doh.assertEqual(contentsPlistContent, glyphset.contents);
            
            GlyphSet.factory(true, staticIO, testGlyphSet)
            .then(function(glyphset) {
                    doh.assertTrue(glyphset instanceof GlyphSet);
                    doh.assertEqual(contentsPlistContent, glyphset.contents);
                    deferred.callback(true);
            })
            .then(undefined, errback);
            
            return deferred;
        }
      , function Test_GlyphSet_factory_genericError() {
            // picking the Error caused by  lyphSetMissingGlyph 
            // just to proof that GlyphSet.factory handles it right.
            var deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;
            
            doh.assertError(
                errors.GlifLib,
                GlyphSet, 'factory',
                [false, staticIO, glyphSetMissingGlyph],
                'GlifLib: contents.plist references a file '
                + 'that does not exist: '
                + 'testdata/contentplists/missing-glyph/C_.glif'
            )
            
            // async
            GlyphSet.factory(true, staticIO, glyphSetMissingGlyph)
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
                        'GlifLib: contents.plist references a file '
                        + 'that does not exist: '
                        + 'testdata/contentplists/missing-glyph/C_.glif'
                    )
                    deferred.callback(true);
                }
            )
            .then(undefined, errback)
            return deferred;
        }
      , function Test_GlyphSet_getReverseContents() {
            var glyphset = GlyphSet.factory(false, staticIO, testGlyphSet)
              , reverseContents
              , k
              ;
            reverseContents = glyphset.getReverseContents();
            for(k in this.contents){
                doh.assertTrue(this.contents[k] in reverseContents);
                doh.assertEqual(k, reverseContents[this.contents[k]]);
            }
        }
    ])
});
