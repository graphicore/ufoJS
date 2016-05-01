define([
    'doh'
  , 'ufojs/main'
  , 'ufojs/errors'
  , 'Atem-IO/errors'
  , 'ufojs/ufoLib/glifLib/misc'
  , 'ufojs/ufoLib/constants'
  , 'ufojs/ufoLib/glifLib/GlyphSet'
  , 'ufojs/plistLib/main'
  , 'Atem-IO/io/static'
  , 'Atem-IO/io/TestingIO'
  , 'Atem-Pen-Case/pens/testPens'
], function(
    doh
  , main
  , errors
  , ioErrors
  , misc
  , constants
  , GlyphSet
  , plistLib
  , staticIO
  , TestingIO
  , pens
) {
    "use strict";

    var compareObjects = plistLib._comparePlists
      , AbstractPointTestPen = pens.AbstractPointTestPen

      , testGlyphSet = 'testdata/TestFont1 (UFO3).ufo/glyphs'
      , contentsPlist = testGlyphSet + '/contents.plist'

      , glyphSetFaulty = 'testdata/testing-layers/faulty'
      , faultyPlist = glyphSetFaulty + '/contents.plist'

      , glyphSetNoLayerInfo = 'testdata/TestFont1 (UFO3).ufo/glyphs.arbitrary'
      , glyphSetABC = glyphSetNoLayerInfo

      , glyphSetEmpty = 'testdata/testing-layers/empty'
      , notFoundPlist = glyphSetEmpty + '/contents.plist'

      , glyphSetFileNameFail = 'testdata/testing-layers/file-name-fail'

      , glyphSetMissingGlyph = 'testdata/testing-layers/missing-glyph'

      , glyphSetFaultyLayerinfo = 'testdata/testing-layers/faulty-layerinfo'
      , glyphSetWrongFormatLayerinfo = 'testdata/testing-layers/wrong-format-layerinfo'
      , glyphSetBrokenColorLayerinfo = 'testdata/testing-layers/broken-color-layerinfo'

      , glyphSetWithComponents = 'testdata/testing-layers/with-components'

      , glyphSetWithImages = 'testdata/testing-layers/with-images'

      , contentsPlistContent = { A: 'A_.glif', B: 'B_.glif' }

      , layerinfoPlistContent = { color: '0.3,0.5,1,0', lib: { greeting: 'hello' } }

      // plist with array as root element
      , arrayPlist = 'testdata/array.plist'
      , arrayData = [ 'Jonny', 'Bello', { 'given-name': 'John', type: 'snail' } ]
      ;

    function _drawToPen(command) {
        var cmd = command[0]
          , args = command.slice(1)
          ;
        this[cmd].apply(this, args);
    }
    function _drawPoints(commands, pen) {
        commands.map(_drawToPen, pen)
    }

    /**
     * create a TestingIO
     */
    function _getTestingIO(dir, mtime) {
        var testingIO = new TestingIO()
          , contentsPlist = plistLib.createPlistString(contentsPlistContent)
          , k
          , glifname
          , mtime = mtime ||  new Date()
          ;
        testingIO.files[[dir, 'contents.plist'].join('/')] = [contentsPlist, mtime]

        for(k in contentsPlistContent) {
            glifname = [dir, contentsPlistContent[k]].join('/');
            testingIO.files[glifname] = ['fake', mtime];
        }
        return testingIO;
    }

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
              , array
              ;

            glyphset = new GlyphSet(staticIO, testGlyphSet);
            // this works with any plist
            doh.assertEqual(arrayData, glyphset._readPlist(false, arrayPlist));
            // and with contents.plist
            doh.assertEqual(contentsPlistContent,
                            glyphset._readPlist(false, contentsPlist));

            // ioErrors.IONoEntry, is expected on 404 or equivalent
            doh.assertError(
                ioErrors.IONoEntry,
                glyphset, '_readPlist',
                [false, notFoundPlist],
                "IONoEntry Error: ENOENT, no such file or directory "
                + "'non-existent.plist'"
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
            // ioErrors.IONoEntry, is expected on 404 or equivalent
            glyphset._readPlist(true, notFoundPlist)
            .then(
                function(result) {
                    throw new Error('This test-case is broken. An IONoEntry '
                        +'error was provoked, but a result appeared.')
                },
                function(error) {
                    doh.assertError(
                        ioErrors.IONoEntry,
                        {echo: function(error){ throw error; }}, 'echo',
                        [error],
                        "IONoEntry Error: ENOENT, no such file or directory "
                            + "'non-existent.plist'"
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
                    throw new Error('This test-case is broken. A GlifLib '
                        + 'error was provoked, but a result appeared.')
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
            glyphset = new GlyphSet(staticIO, glyphSetFaulty);
            doh.assertError(
                errors.GlifLib,
                glyphset, 'rebuildContents',
                [false],
                'GlifLib Error: The file "testdata/faulty.plist" could '
                + 'not be read. ...'
            );

            // async
            glyphset = new GlyphSet(staticIO, glyphSetFaulty);
            glyphset.rebuildContents(true)
            .then(
                function(result) {
                    throw new Error('This test-case is broken. A GlifLib '
                        + 'error was provoked, but a result appeared.')
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
            .then(undefined, errback);
            return deferred;
        }
      , function Test_GlyphSet_rebuildContents_notFoundPlist() {
            // missing contentsPlist: consider the glyphset to be empty.
            var glyphset
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;

            // sync
            glyphset = new GlyphSet(staticIO, glyphSetEmpty);

            glyphset.rebuildContents(false)
            doh.assertEqual({}, glyphset.contents);

            // async
            glyphset = new GlyphSet(staticIO, glyphSetEmpty)
            glyphset.rebuildContents(true)
            .then(
                function(result) {
                    doh.assertEqual({}, glyphset.contents);
                    deferred.callback(true);
                },
                function(error) {
                    throw new Error('rebuildContents should have returned '
                                            + 'an empty dict on IONoEntry');
                }
            )
            .then(undefined, errback);
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
                    throw new Error('This test-case is broken. A GlifLib '
                        + 'error was provoked, but a result appeared.')
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
                    throw new Error('This test-case is broken. A GlifLib '
                        + 'error was provoked, but a result appeared.')
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
                    throw new Error('This test-case is broken. A GlifLib '
                        + 'error was provoked, but a result appeared.')
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
      , function Test_GlyphSet_writeContents() {
            var testingIO
              , glyphset
              , newPlistContent
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;
            testingIO = _getTestingIO(testGlyphSet)

            glyphset = GlyphSet.factory(false, testingIO, testGlyphSet)
            glyphset.contents['X'] = 'X_.glif';

            glyphset.writeContents(false);

            newPlistContent = plistLib.readPlistFromString(
                                testingIO.readFile(false, contentsPlist));
            doh.assertTrue('X' in newPlistContent);
            doh.assertEqual(newPlistContent['X'], 'X_.glif');

            glyphset.contents['Y'] = 'Y_.glif';
            glyphset.writeContents(true)
            .then(function(){
                var newPlistContent = plistLib.readPlistFromString(
                                testingIO.readFile(false, contentsPlist));
                doh.assertTrue('Y' in newPlistContent);
                doh.assertEqual(newPlistContent['Y'], 'Y_.glif');
                deferred.callback(true);
            })
            .then(undefined, errback)
            return deferred;
        }
      , function Test_GlyphSet_readLayerInfo() {
            var glyphset
              , info = {}
              , result
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;

            glyphset = GlyphSet.factory(false, staticIO, testGlyphSet);
            result = glyphset.readLayerInfo(false, info)
            doh.assertTrue(result === info);
            doh.assertEqual(layerinfoPlistContent, info);

            info = {};
            glyphset.readLayerInfo(true, info)
            .then(function(result) {
                doh.assertTrue(result === info);
                doh.assertEqual(layerinfoPlistContent, info);
                deferred.callback(true)
            })
            .then(undefined, errback)
            return deferred;
        }
      , function Test_GlyphSet_readLayerInfo_missingFile() {
            var glyphset
              , info = {}
              , result
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;

            glyphset = GlyphSet.factory(false, staticIO, glyphSetNoLayerInfo);
            result = glyphset.readLayerInfo(false, info)
            doh.assertTrue(result === info);
            doh.assertEqual({}, info);

            info = {};
            glyphset.readLayerInfo(true, info)
            .then(function(result) {
                doh.assertTrue(result === info);
                doh.assertEqual({}, info);
                deferred.callback(true)
            })
            .then(undefined, errback)
            return deferred;
        }
      , function Test_GlyphSet_readLayerInfo_faulty() {
            var glyphset
              , info = {}
              , result
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;

            glyphset = GlyphSet.factory(false, staticIO, glyphSetFaultyLayerinfo);

            doh.assertError(
                errors.GlifLib,
                glyphset, 'readLayerInfo',
                [false, info],
                'The file "..." could not be read.'
            )
            doh.assertEqual({}, info);



            info = {};
            glyphset.readLayerInfo(true, info)
            .then(
                function(result) {
                    throw new Error('This test-case is broken. A GlifLib '
                        + 'error was provoked, but a result appeared.')
                },
                function(error) {
                    doh.assertError(
                        errors.GlifLib,
                        {echo: function(error){ throw error; }}, 'echo',
                        [error],
                        'The file "..." could not be read.'
                    )
                    doh.assertEqual({}, info);
                    deferred.callback(true);
                }
            )
            .then(undefined, errback)
            return deferred;
        }
      , function Test_GlyphSet_readLayerInfo_wrongFormat() {
            var glyphset
              , info = {}
              , result
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;

            glyphset = GlyphSet.factory(false, staticIO, glyphSetWrongFormatLayerinfo);

            doh.assertError(
                errors.GlifLib,
                glyphset, 'readLayerInfo',
                [false, info],
                'layerinfo.plist is not properly formatted.'
            )
            doh.assertEqual({}, info);

            info = {};
            glyphset.readLayerInfo(true, info)
            .then(
                function(result) {
                    throw new Error('This test-case is broken. A GlifLib '
                        + 'error was provoked, but a result appeared.')
                },
                function(error) {
                    doh.assertError(
                        errors.GlifLib,
                        {echo: function(error){ throw error; }}, 'echo',
                        [error],
                        'layerinfo.plist is not properly formatted.'
                    )
                    doh.assertEqual({}, info);
                    deferred.callback(true);
                }
            )
            .then(undefined, errback)
            return deferred;
        }
      , function Test_GlyphSet_readLayerInfo_brokenColor() {
          // this tests roughly the application of the validator
          // validateLayerInfoVersion3Data
            var glyphset
              , info = {}
              , result
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;

            glyphset = GlyphSet.factory(false, staticIO, glyphSetBrokenColorLayerinfo);

            doh.assertError(
                errors.GlifLib,
                glyphset, 'readLayerInfo',
                [false, info],
                'Invalid value for attribute color (string: 0.3,A B C,1,0)'
            )
            doh.assertEqual({}, info);



            info = {};
            glyphset.readLayerInfo(true, info)
            .then(
                function(result) {
                    throw new Error('This test-case is broken. A GlifLib '
                        + 'error was provoked, but a result appeared.')
                },
                function(error) {
                    doh.assertError(
                        errors.GlifLib,
                        {echo: function(error){ throw error; }}, 'echo',
                        [error],
                        'Invalid value for attribute color (string: 0.3,A B C,1,0)'
                    )
                    doh.assertEqual({}, info);
                    deferred.callback(true);
                }
            )
            .then(undefined, errback)
            return deferred;
        }
      , function Test_GlyphSet_writeLayerInfoToString() {
            var glyphset
              , info = {
                    color: '1,0,0,.2'
                  , lib: {
                        name: 'Horst'
                    }
                  , madeUpKey: 123 // will get filtered out
                }
              , filteredInfo = {
                    color: '1,0,0,.2'
                  , lib: {
                        name: 'Horst'
                    }
                }
              , brokenInfo = {
                    lib: 123
                }
              , resultString, result
              ;

            glyphset = GlyphSet.factory(false, staticIO, testGlyphSet);
            resultString = glyphset.writeLayerInfoToString(info);
            result = plistLib.readPlistFromString(resultString);
            doh.assertTrue(compareObjects(filteredInfo, result, true));
            doh.assertFalse('madeUpKey' in result);


            glyphset = GlyphSet.factory(false, staticIO, testGlyphSet, undefined, 2);
            doh.assertError(
                errors.GlifLib,
                glyphset, 'writeLayerInfoToString',
                [info],
                'layerinfo.plist is not allowed in UFO 2.'
            )

            // test that validateLayerInfoVersion3Data kicks in
            glyphset = GlyphSet.factory(false, staticIO, testGlyphSet);
            doh.assertError(
                errors.GlifLib,
                glyphset, 'writeLayerInfoToString',
                [brokenInfo],
                'Invalid value for attribute lib (number: 123)'
            )
        }
      , function Test_GlyphSet_writeLayerInfo() {
            var glyphset
              , testingIO = _getTestingIO(testGlyphSet)
              , info = {
                    color: '0,0,.7,1'
                  , lib: {
                        name: 'Horst'
                      , age: 42
                    }
                }
              , resultString, result
              , path = [testGlyphSet, constants.LAYERINFO_FILENAME].join('/')
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;
            glyphset = GlyphSet.factory(false, testingIO, testGlyphSet);

            doh.assertFalse(testingIO.pathExists(false, path));
            glyphset.writeLayerInfo(false, info);
            doh.assertTrue(testingIO.pathExists(false, path));

            resultString = testingIO.readFile(false, path)
            result = plistLib.readPlistFromString(resultString);
            doh.assertTrue(compareObjects(info, result, true));

            // async
            testingIO = _getTestingIO(testGlyphSet)
            glyphset = GlyphSet.factory(false, testingIO, testGlyphSet);
            doh.assertFalse(testingIO.pathExists(false, path));

            glyphset.writeLayerInfo(true, info)
            .then(function(){
                doh.assertTrue(testingIO.pathExists(false, path));
                resultString = testingIO.readFile(false, path)
                result = plistLib.readPlistFromString(resultString);
                doh.assertTrue(compareObjects(info, result, true));
                deferred.callback(true);
            }, undefined)
            .then(undefined, errback)

            // see, it's really async :-)
            doh.assertFalse(testingIO.pathExists(false, path));
            return deferred;
        }

        , function Test_GlyphSet_getGLIFcache() {
            var glyphset
              , testingIO = _getTestingIO('.', new Date(1999, 0,1))
              , cache
              , oldCache, newCache
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              , callback = function(){deferred.callback(true);}
              ;

            glyphset = GlyphSet.factory(false, testingIO, '.');
            cache = glyphset._getGLIFcache(false, 'A');
            // the same content in cache and testingIO
            doh.assertEqual(testingIO.files['./A_.glif'], cache)
            // this is to change the timestamp
            testingIO.writeFile(false, './A_.glif', cache[0]);
            // cache is outdated now
            doh.assertFalse(compareObjects(testingIO.files['./A_.glif'], cache))
            // this is to check, that we compare the value of the timestamp,
            // not the identity of the Date object
            testingIO.files['./A_.glif'][1] = new Date(cache[1]);
            // different identity
            doh.assertFalse(testingIO.files['./A_.glif'][1] === cache[1])
            // but both checks consider the values to be equal
            doh.assertEqual(testingIO.files['./A_.glif'], cache)
            doh.assertTrue(compareObjects(testingIO.files['./A_.glif'], cache, true))

            newCache = glyphset._getGLIFcache(false, 'A');
            // same identity, there was no reason to reload
            doh.assertTrue(newCache === cache)

            // cache is outdated now
            testingIO.writeFile(false, './A_.glif', 'other value');
            newCache = glyphset._getGLIFcache(false, 'A');
            // the cache object changed
            doh.assertFalse(newCache === cache);
            // the value of the cache object changed also
            doh.assertFalse(compareObjects(newCache, cache));
            // the cache has the same value as the testingIO file entry
            doh.assertEqual(testingIO.files['./A_.glif'], newCache);


            // async
            testingIO = _getTestingIO('.', new Date(1999, 0,1))
            glyphset = GlyphSet.factory(false, testingIO, '.');
            glyphset._getGLIFcache(true, 'A')
            .then(function(cache) {
                // save in closure namespace
                oldCache = cache;
                doh.assertEqual(testingIO.files['./A_.glif'], cache)

                // return a promise
                return glyphset._getGLIFcache(true, 'A');
            })
            .then(function(cache) {
                // save in closure namespace
                newCache = cache;
                // same identity, there was no reason to reload
                doh.assertTrue(oldCache, cache)

                // cache is outdated now
                testingIO.writeFile(false, './A_.glif', 'other value');
                return glyphset._getGLIFcache(true, 'A');
            })
            .then(function(cache) {
                // the cache object changed
                doh.assertFalse(newCache === cache);
                // the value of the cache object changed also
                doh.assertFalse(compareObjects(newCache, cache));
                // the cache has the same value as the testingIO file entry
                doh.assertEqual(testingIO.files['./A_.glif'], cache);
            })
            .then(callback, errback)
            return deferred;
        }
      , function Test_GlyphSet_getGLIFcache_KeyError_filename() {
            // keyerror because glyphName was not in contents.plist
            var testingIO = _getTestingIO('.', new Date(1999, 0,1))
              , glyphset = GlyphSet.factory(false, testingIO, '.')
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;

            doh.assertError(
                errors.Key,
                glyphset, '_getGLIFcache',
                [false, 'X'],
                'Key Error: X'
            )

            glyphset._getGLIFcache(true, 'X')
            .then(
                function(result) {
                    throw new Error('This test-case is broken. A Key '
                        + 'error was provoked, but a result appeared.')
                },
                function(error) {
                    doh.assertError(
                        errors.Key,
                        {echo: function(error){ throw error; }}, 'echo',
                        [error],
                        'Key Error: A'
                    )
                    deferred.callback(true);
                }
            )
            .then(undefined, errback)

        }
      , function Test_GlyphSet_getGLIFcache_KeyError_readfile() {
            // keyerror because glyphName was not in contents.plist
            // but deleted in the meantime
            var testingIO = _getTestingIO('.', new Date(1999, 0,1))
              , glyphset = GlyphSet.factory(false, testingIO, '.')
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;

            testingIO.unlink(false, './A_.glif');

            doh.assertError(
                errors.Key,
                glyphset, '_getGLIFcache',
                [false, 'A'],
                'Key Error: A'
            )

            glyphset._getGLIFcache(true, 'A')
            .then(
                function(result) {
                    throw new Error('This test-case is broken. A Key '
                        + 'error was provoked, but a result appeared.')
                },
                function(error) {
                    doh.assertError(
                        errors.Key,
                        {echo: function(error){ throw error; }}, 'echo',
                        [error],
                        'Key Error: A'
                    )
                    deferred.callback(true);
                }
            )
            .then(undefined, errback)

            return deferred;
        }
      , function Test_GlyphSet_getGLIFcache_KeyError_mtime() {
            // keyerror because glyphName was not in contents.plist
            // but deleted in the meantime
            var testingIO = _getTestingIO('.', new Date(1999, 0,1))
              , glyphset = GlyphSet.factory(false, testingIO, '.')
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;

            // first read, then delete, then fail with updating because
            // mtime can't find the file

            glyphset._getGLIFcache(false, 'A');
            testingIO.unlink(false, './A_.glif');
            doh.assertError(
                errors.Key,
                glyphset, '_getGLIFcache',
                [false, 'A'],
                'Key Error: A'
            )

            glyphset._getGLIFcache(true, 'A')
            .then(
                function(result) {
                    throw new Error('This test-case is broken. A Key '
                        + 'error was provoked, but a result appeared.')
                },
                function(error) {
                    doh.assertError(
                        errors.Key,
                        {echo: function(error){ throw error; }}, 'echo',
                        [error],
                        'Key Error: A'
                    )
                    deferred.callback(true);
                }
            )
            .then(undefined, errback)

            return deferred;
        }
      , function Test_GlyphSet_getGLIF() {
            var testingIO = _getTestingIO('.', new Date(1999, 0,1))
              , glyphset = GlyphSet.factory(false, testingIO, '.')
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              , expected = testingIO.readFile(false, './A_.glif')
              , glif
              ;
            glif = glyphset.getGLIF(false, 'A');
            doh.assertEqual(expected, glif);


            glyphset.getGLIF(true, 'A')
            .then(function(glif){
                doh.assertEqual(expected, glif);
                deferred.callback(true);
            })
            .then(undefined, errback);

            return deferred;
        }
      , function Test_GlyphSet_getGLIFDocument_ParserError() {
            var testingIO = _getTestingIO('.', new Date(1999, 0,1))
              , glyphset = GlyphSet.factory(false, testingIO, '.')
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              , glif
              ;

            doh.assertError(
                errors.Parser,
                glyphset, 'getGLIFDocument',
                [false, 'A'],
                "Parser Error: XML SAX2 Parser: Start tag expected, '<' not found"
            );


            glyphset.getGLIFDocument(true, 'A')
            .then(
                function(result) {
                    throw new Error('This test-case is broken. A Parser '
                        + 'error was provoked, but a result appeared.')
                },
                function(error) {
                    doh.assertError(
                        errors.Parser,
                        {echo: function(error){ throw error; }}, 'echo',
                        [error],
                        "Parser Error: XML SAX2 Parser: Start tag expected, '<' not found"
                    )
                    deferred.callback(true);
                }
            )
            .then(undefined, errback)
            return deferred;
        }
        , function Test_GlyphSet_getGLIFDocument() {
            var glyphset = GlyphSet.factory(false, staticIO, testGlyphSet)
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              , glifDoc
              ;

            glifDoc = glyphset.getGLIFDocument(false, 'A')
            doh.assertEqual('glyph', glifDoc.documentElement.tagName);

            glyphset = GlyphSet.factory(false, staticIO, testGlyphSet)
            glyphset.getGLIFDocument(true, 'A')
            .then(
                function(glifDoc) {
                    doh.assertEqual('glyph', glifDoc.documentElement.tagName);
                    deferred.callback(true);
                }
            )
            .then(undefined, errback)
            return deferred;
        }
      , function Test_GlyphSet__getGLIFDocuments() {
            var glyphset = GlyphSet.factory(false, staticIO, glyphSetABC)
              , docs
              , request = ['A', 'C']
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              , docIsGlyph = function(k) {
                    return this[k].documentElement.tagName === 'glyph';
                }
              ;
            docs = glyphset._getGLIFDocuments(false, request);
            doh.assertEqual(request, Object.keys(docs).sort());
            doh.assertTrue( Object.keys(docs).every(docIsGlyph, docs));

            // whithout a "request" all glyphs will be returned
            docs = glyphset._getGLIFDocuments(false);
            doh.assertEqual(['A', 'B', 'C'], Object.keys(docs).sort());

            glyphset._getGLIFDocuments(true, request)
            .then(function(docs){
                doh.assertEqual(request, Object.keys(docs).sort());
                doh.assertTrue( Object.keys(docs).every(docIsGlyph, docs));
                deferred.callback(true);
            })
            .then(undefined, errback);

            return deferred;
        }
      , function Test_GlyphSet__getGLIFDocuments_keyError() {
            var glyphset = GlyphSet.factory(false, staticIO, glyphSetABC)
              , docs
              , request = ['A', 'X', 'C']
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              , docIsGlyph = function(k) {
                    return this[k].documentElement.tagName === 'glyph';
                }
              ;

            glyphset._getGLIFDocuments(true, request)
            .then(
                function(result) {
                    throw new Error('This test-case is broken. A Key '
                        + 'error was provoked, but a result appeared.')
                },
                function(error) {
                    doh.assertError(
                        errors.Key,
                        {echo: function(error){ throw error; }}, 'echo',
                        [error],
                        'Key Error: X'
                    )
                    deferred.callback(true);
                }
            )
            .then(undefined, errback)

            return deferred;
        }
      , function Test_GlyphSet_getGLIFModificationTime() {
            var mTime = new Date(1999, 0,1)
              , testingIO = _getTestingIO('.', mTime)
              , glyphset = GlyphSet.factory(false, testingIO, '.')
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              , glifMTime
              ;

            glifMTime = glyphset.getGLIFModificationTime(false, 'A');
            doh.assertEqual(mTime, glifMTime);
            doh.assertNotEqual(mTime, new Date());

            doh.assertError(
                errors.Key,
                glyphset, 'getGLIFModificationTime',
                [false, 'X'],
                'Key Error: X'
            );

            glyphset.getGLIFModificationTime(true, 'A')
            .then(function(glifMTime) {
                doh.assertEqual(mTime, glifMTime);
                doh.assertNotEqual(mTime, new Date());
                // and provoke an error
                return glyphset.getGLIFModificationTime(true, 'X')
            })
            .then(
                function(result) {
                    throw new Error('This test-case is broken. A Key '
                        + 'error was provoked, but a result appeared.')
                },
                function(error) {
                    doh.assertError(
                        errors.Key,
                        {echo: function(error){ throw error; }}, 'echo',
                        [error],
                        'Key Error: X'
                    )
                    deferred.callback(true);
                }
            )
            .then(undefined, errback);

            return deferred;
        }
      , function Test_GlyphSet__purgeCachedGLIF() {
            var glyphset = GlyphSet.factory(false, staticIO, testGlyphSet);
            glyphset.getGLIFModificationTime(false, 'A');

            doh.assertTrue('A' in glyphset._glifCache);
            glyphset._purgeCachedGLIF('A');
            doh.assertFalse('A' in glyphset._glifCache);
        }
      , function Test_GlyphSet_readGlyph() {
            var glyphset = GlyphSet.factory(false, staticIO, testGlyphSet)
              , glyphObject = {}
              , pen = new AbstractPointTestPen()
              , result
              , expectedGlyph = {
                    name: 'A',
                    width: 740,
                    height: 0,
                    unicodes: [ 65 ]
                }
              , expectedPoints = [
                    [ 'beginPath' ],
                    [ 'addPoint', [ 20, 0 ], 'line', false, null ],
                    [ 'addPoint', [ 720, 0 ], 'line', false, null ],
                    [ 'addPoint', [ 720, 700 ], 'line', false, null ],
                    [ 'addPoint', [ 20, 700 ], 'line', false, null ],
                    [ 'endPath' ]
                ]
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;

            doh.assertNotEqual(expectedGlyph, glyphObject)
            result = glyphset.readGlyph(false, 'A', glyphObject, pen);
            doh.assertTrue(glyphObject === result);
            doh.assertEqual(expectedGlyph, glyphObject)
            doh.assertEqual(expectedPoints, pen.flush())
            doh.assertError(
                errors.Key,
                glyphset, 'readGlyph',
                [false, 'X'],
                'Key Error: X'
            );

            // async
            glyphObject = {}
            pen = new AbstractPointTestPen()
            glyphset.readGlyph(true, 'A', glyphObject, pen)
            .then(function(result) {
                doh.assertTrue(glyphObject === result);
                doh.assertEqual(expectedGlyph, glyphObject)
                doh.assertEqual(expectedPoints, pen.flush())
                // provoke an error
                return  glyphset.readGlyph(true, 'X')
            })
            .then(
                function(result) {
                    throw new Error('This test-case is broken. A Key '
                        + 'error was provoked, but a result appeared.')
                },
                function(error) {
                    doh.assertError(
                        errors.Key,
                        {echo: function(error){ throw error; }}, 'echo',
                        [error],
                        'Key Error: X'
                    )
                    deferred.callback(true);
                }
            )
            .then(undefined, errback);

            return deferred;
        }
      , function Test_GlyphSet_writeGlyph() {
            var mTime = new Date(1999, 0,1)
              , testingIO = _getTestingIO('.', mTime)
              , glyphset = GlyphSet.factory(false, testingIO, '.')
              , glyphData = {
                    width: 740,
                    height: 0,
                    unicodes: [ 'X'.charCodeAt(0) ]
                }
              , commands = [
                    [ 'beginPath' ],
                    [ 'addPoint', [ 23, 0 ], 'line', false, null ],
                    [ 'addPoint', [ 17, 42 ], 'line', false, null ],
                    [ 'addPoint', [ 720, 700 ], 'line', false, null ],
                    [ 'addPoint', [ 20, 700 ], 'line', false, null ],
                    [ 'endPath' ]
                ]
              , drawPointsFunc = _drawPoints.bind(null, commands)
              , glyphDate = new Date(1998, 0, 1)
              , reverseContents
              , glyphNameToFilename
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;

            doh.assertFalse(glyphset.has_key('X'))
            doh.assertFalse(testingIO.pathExists(false, './X_.glif'))
            doh.assertFalse('x_.glif' in glyphset.getReverseContents())
            glyphset.writeGlyph(false, 'X', glyphData, drawPointsFunc)
            doh.assertEqual( 'X_.glif', glyphset.contents['X'])
            doh.assertTrue(testingIO.pathExists(false, './X_.glif'))
            doh.assertTrue(glyphset.has_key('X'))
            doh.assertTrue('x_.glif' in glyphset.getReverseContents())

            // setting the date to a value in the past
            testingIO.files['./X_.glif'][1] = glyphDate;
            // this shouldn't write, because the data didn't change
            glyphset.writeGlyph(false, 'X', glyphData, drawPointsFunc)
            // if the date is still the same there was no write
            doh.assertTrue(testingIO.files['./X_.glif'][1] === glyphDate);
            // changed the data
            glyphData.width += 1;
            glyphset.writeGlyph(false, 'X', glyphData, drawPointsFunc);
            doh.assertFalse(testingIO.files['./X_.glif'][1] === glyphDate);
            doh.assertEqual('X', glyphset.getGLIFDocument(false, 'X')
                                    .documentElement.getAttribute('name'));

            // test some aspects of the format version
            doh.assertEqual('2', glyphset.getGLIFDocument(false, 'X')
                                .documentElement.getAttribute('format'))

            // force format version 1
            glyphset.writeGlyph(false, 'X', glyphData, drawPointsFunc, 1);
            doh.assertEqual('1', glyphset.getGLIFDocument(false, 'X')
                                .documentElement.getAttribute('format'))


            doh.assertError(
                errors.GlifLib,
                glyphset, 'writeGlyph',
                [false, 'X', undefined, undefined, 100],
                'Unsupported GLIF format version: 100'
            )

            glyphset = GlyphSet.factory(false, testingIO, '.', undefined, 2);
            doh.assertError(
                errors.GlifLib,
                glyphset, 'writeGlyph',
                [false, 'X', undefined, undefined, 2],
                'Unsupported GLIF format version (2) for UFO format version 2.'
            )

            glyphset.writeGlyph(false, 'X', glyphData, drawPointsFunc);
            doh.assertEqual('1', glyphset.getGLIFDocument(false, 'X')
                                .documentElement.getAttribute('format'))

            // reverse the name. no checks are done
            glyphNameToFilename = function(glyphName, injected_glyphSet) {
                doh.assertTrue(injected_glyphSet === glyphset);

                var nameArr = glyphName.split('');
                nameArr.reverse();
                nameArr.push('.glif');
                return nameArr.join('');
            }

            glyphset = GlyphSet.factory(false, testingIO, '.', glyphNameToFilename)
            glyphset.writeGlyph(false, 'YX', glyphData, drawPointsFunc);
            doh.assertEqual('XY.glif', glyphset.contents['YX']);



            // async
            testingIO = _getTestingIO('.', mTime)
            glyphset = GlyphSet.factory(false, testingIO, '.')

            glyphset.writeGlyph(true, 'X', glyphData, drawPointsFunc)
            .then(function() {
                doh.assertEqual( 'X_.glif', glyphset.contents['X'])
                doh.assertTrue(testingIO.pathExists(false, './X_.glif'))
                doh.assertTrue(glyphset.has_key('X'))

                // setting the date to a value in the past
                testingIO.files['./X_.glif'][1] = glyphDate;
                // this shouldn't write, because the data didn't change
                return glyphset.writeGlyph(true, 'X', glyphData, drawPointsFunc)
            })
            .then(function() {
                // if the date is still the same there was no write
                doh.assertTrue(testingIO.files['./X_.glif'][1] === glyphDate);
                // changed the data
                glyphData.width += 1;
                return glyphset.writeGlyph(true, 'X', glyphData, drawPointsFunc);
            })
            .then(function() {
                doh.assertFalse(testingIO.files['./X_.glif'][1] === glyphDate);
                doh.assertEqual('X', glyphset.getGLIFDocument(false, 'X')
                                    .documentElement.getAttribute('name'));
                deferred.callback(true);
            })
            .then(undefined, errback);
            return deferred;
        }
      , function Test_GlyphSet_deleteGlyph() {
            var mTime = new Date(1999, 0,1)
              , testingIO = _getTestingIO('.', mTime)
              , glyphset = GlyphSet.factory(false, testingIO, '.')
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;


            doh.assertTrue('A' in glyphset.contents);
            glyphset.getGLIF(false, 'A');
            doh.assertTrue('A' in glyphset._glifCache);
            doh.assertTrue('./A_.glif' in testingIO.files);
            glyphset.getReverseContents();

            glyphset.deleteGlyph(false, 'A');
            doh.assertFalse('A' in glyphset.contents);
            doh.assertFalse('A' in glyphset._glifCache);
            doh.assertFalse('./A_.glif' in testingIO.files);

            // async
            testingIO = _getTestingIO('.', mTime);
            glyphset = GlyphSet.factory(false, testingIO, '.');
            glyphset.getReverseContents();

            glyphset.deleteGlyph(true, 'A')
            .then(function() {
                doh.assertFalse('A' in glyphset.contents);
                doh.assertFalse('A' in glyphset._glifCache);
                doh.assertFalse('./A_.glif' in testingIO.files);
                deferred.callback(true);
            })
            .then(undefined, errback);
            return deferred;
        }
      , function Test_GlyphSet_get() {
            var glyphset = GlyphSet.factory(false, staticIO, testGlyphSet)
              , pen = new AbstractPointTestPen()
              , expected1 = { }
              , expected2 = {
                    name: 'B'
                  , width: 740
                  , height: 0
                  , unicodes: [ 66 ]
                }
              , expectedOutline = [ [ 'beginPath' ],
                    [ 'addPoint', [ 20, 350 ], 'curve', true, null ],
                    [ 'addPoint', [ 20, 157 ], null, false, null ],
                    [ 'addPoint', [ 177, 0 ], null, false, null ],
                    [ 'addPoint', [ 370, 0 ], 'curve', true, null ],
                    [ 'addPoint', [ 563, 0 ], null, false, null ],
                    [ 'addPoint', [ 720, 157 ], null, false, null ],
                    [ 'addPoint', [ 720, 350 ], 'curve', true, null ],
                    [ 'addPoint', [ 720, 543 ], null, false, null ],
                    [ 'addPoint', [ 563, 700 ], null, false, null ],
                    [ 'addPoint', [ 370, 700 ], 'curve', true, null ],
                    [ 'addPoint', [ 177, 700 ], null, false, null ],
                    [ 'addPoint', [ 20, 543 ], null, false, null ],
                    [ 'endPath' ]
                ]
              , glyph
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;

            glyph = glyphset.get('B');
            doh.assertTrue(glyph instanceof GlyphSet.prototype.GlyphClass);
            doh.assertEqual(expected1, glyph);
            glyph.drawPoints(false, pen);
            doh.assertEqual(expected2, glyph);
            doh.assertEqual(expectedOutline, pen.flush());

            // async
            glyph = glyphset.get('B');
            doh.assertEqual(expected1, glyph);

            glyph.drawPoints(true, pen)
            .then(function(resultGlyph) {
                doh.assertTrue(glyph === resultGlyph);
                doh.assertEqual(expected2, resultGlyph);
                doh.assertEqual(expectedOutline, pen.flush());
                deferred.callback(true);
            })
            .then(undefined, errback);

            return deferred;
        }
      , function Test_GlyphSet__mapGLIFDocuments() {
            var glyphset = GlyphSet.factory(false, staticIO, testGlyphSet)
              , mapper = function(doc) {
                    return doc.documentElement.getAttribute('name');}
              , expected = { A: 'A', B: 'B' }
              , result
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;
              ;

            result = glyphset._mapGLIFDocuments(false, ['A', 'B'], mapper);
            doh.assertEqual(expected, result);

            // async
            glyphset._mapGLIFDocuments(true, ['A', 'B'], mapper)
            .then(function(result) {
                doh.assertEqual(expected, result);
                deferred.callback(true);
            })
            .then(undefined, errback);

            return deferred;
        }
      , function Test_GlyphSet_getUnicodes() {
            var glyphset = GlyphSet.factory(false, staticIO, testGlyphSet)
              , expected = { A: [ 65 ], B: [ 66 ] }
              , result
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;

            result = glyphset.getUnicodes(false, ['A', 'B']);
            doh.assertEqual(expected, result);

            // async
            glyphset.getUnicodes(true, ['A', 'B'])
            .then(function(result) {
                doh.assertEqual(expected, result);
                deferred.callback(true);
            })
            .then(undefined, errback);

            return deferred;
        }
      , function Test_GlyphSet_getComponentReferences() {
            var glyphset = GlyphSet.factory(false, staticIO, glyphSetWithComponents)
              , request = ['A', 'B', 'F_A_B']
              , expected = { A: [], B: [], F_A_B: [ 'A', 'B', 'F' ] }
              , result
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;

            result = glyphset.getComponentReferences(false, request);
            doh.assertEqual(expected, result);

            // async
            glyphset.getComponentReferences(true, request)
            .then(function(result) {
                doh.assertEqual(expected, result);
                deferred.callback(true);
            })
            .then(undefined, errback);

            return deferred;
        }
      , function Test_GlyphSet_getImageReferences() {
            var glyphset = GlyphSet.factory(false, staticIO, glyphSetWithImages)
              , request = glyphset.keys()
              , expected = { A: 'Sketch 1.png', B: 'Sketch 2.png'}
              , result
              , deferred = new doh.Deferred()
              , errback = deferred.errback.bind(deferred)
              ;

            result = glyphset.getImageReferences(false, request);
            doh.assertEqual(expected, result);

            // async
            glyphset.getImageReferences(true, request)
            .then(function(result) {
                doh.assertEqual(expected, result);
                deferred.callback(true);
            })
            .then(undefined, errback);

            return deferred;
        }
    ])
});
