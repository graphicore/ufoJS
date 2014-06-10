define([
    'ufojs/main'
  , 'ufojs/errors'
  , 'ufojs/xml/main'
  , 'ufojs/plistLib/main'
  , 'ufojs/ufoLib/glifLib/writeGlyph'
], function(
    main
  , errors
  , xml
  , plistLib
  , writeGlyph
) {
    "use strict";
    
    var compareObjects = plistLib._comparePlists
    
    /**
     * Use with a commands array like AbstractPointTestPen produces like so:
     * commands.map(_drawToPen, pen)
     * All commands are drawn to the pen.
     */
    function _drawToPen(command) {
        var cmd = command[0]
          , args = command.slice(1)
          ;
        this[cmd].apply(this, args);
    }
    
    doh.register("ufoLib.glifLib.writeGlyph", [
        function Test_writeGlyphToString() {
            var glyphObject
              , glyphName = 'R'
              , xmlString
              , document
              ;
            
            glyphObject = {
                width: 463
              , height: 0
              , unicodes: [ 82, 22868 ]
            }
            
            xmlString = writeGlyph.toString(glyphName, glyphObject)
            // just test that it parses into a Dom document
            document = xml.parseXMLString(xmlString)
            
            // and some spot tests
            doh.assertTrue(document instanceof xml.Node);
            doh.assertEqual(document.nodeType, xml.Node.DOCUMENT_NODE);
            doh.assertEqual('glyph', document.documentElement.tagName);
        }
      ,  function Test_writeGlyphToDOM() {
            var glyphObject, glyphName, document;
            
            glyphObject = {
                width: 463
              , height: 0
              , unicodes: [ 82, 22868 ]
            }
            glyphName = 'R'
            document = writeGlyph.toDOM(glyphName, glyphObject)
            doh.assertTrue(document instanceof xml.Node);
            doh.assertEqual(document.nodeType, xml.Node.DOCUMENT_NODE);
            doh.assertEqual('glyph', document.documentElement.tagName);
            
            
            
            // glyphName may be an instance of String
            glyphName = new String('R')
            document = writeGlyph.toDOM(glyphName, glyphObject)
            doh.assertTrue(document instanceof xml.Node);
            doh.assertEqual(document.nodeType, xml.Node.DOCUMENT_NODE);
            doh.assertEqual('glyph', document.documentElement.tagName);
            
            
            // glyphName must be a string
            glyphName = ['R'];
            doh.assertError(
                errors.GlifLib,
                writeGlyph, 'toDOM',
                [glyphName, glyphObject],
                'glyphName must be a string'
            );
            
            
            // glyphName must not be empty
            glyphName = '';
            doh.assertError(
                errors.GlifLib,
                writeGlyph, 'toDOM',
                [glyphName, glyphObject],
                'glyphName must not be empty'
            );
            
            // minmal glyph
            glyphName = 'A';
            glyphObject = {};
            document = writeGlyph.toDOM(glyphName, undefined, undefined, 1)
            
            doh.assertEqual('A', document.documentElement.getAttribute('name'))
            doh.assertEqual(1, document.documentElement.getAttribute('format'))
            doh.assertEqual(0, document.documentElement.children.length)
        }
      , function Test_wrtiteGlyph_writeAdvance() {
            var glyphName = 'any'
              , glyphObject
              , document
              , advance
              ;
            
            // width and height
            glyphObject = {
                width: 463
              , height: 200
            }
            document = writeGlyph.toDOM(glyphName, glyphObject)
            doh.assertEqual(1, document.documentElement.children.length)
            advance = document.documentElement.children[0]
            doh.assertEqual('advance', advance.tagName)
            doh.assertEqual(2, advance.attributes.length)
            doh.assertTrue(advance.hasAttribute('width'))
            doh.assertTrue(advance.hasAttribute('height'))
            doh.assertEqual('463', advance.getAttribute('width'))
            doh.assertEqual('200', advance.getAttribute('height'))
            
            // only width
            glyphObject = {
                width: 463
            }
            document = writeGlyph.toDOM(glyphName, glyphObject)
            doh.assertEqual(1, document.documentElement.children.length)
            advance = document.documentElement.children[0]
            doh.assertEqual('advance', advance.tagName)
            doh.assertEqual(1, advance.attributes.length)
            doh.assertTrue(advance.hasAttribute('width'))
            doh.assertEqual('463', advance.getAttribute('width'))
            
            // only height
            glyphObject = {
                height: 555
            }
            document = writeGlyph.toDOM(glyphName, glyphObject)
            doh.assertEqual(1, document.documentElement.children.length)
            advance = document.documentElement.children[0]
            doh.assertEqual('advance', advance.tagName)
            doh.assertEqual(1, advance.attributes.length)
            doh.assertTrue(advance.hasAttribute('height'))
            doh.assertEqual('555', advance.getAttribute('height'))
        }
        
      , function Test_wrtiteGlyph_writeUnicodes() {
            var glyphName = 'any'
              , glyphObject
              , document
              , unicode
              , i
              , hexMembers
              ;
            glyphObject = {
                unicodes: 'ä'
            }
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject]
              , 'unicode values must be int'
            )
            
            glyphObject = {
                unicodes: '00E4'
            }
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject]
              , 'unicode values must be int'
            )
            
            glyphObject = {
                unicodes: 'ä'.charCodeAt(0)
            }
            document = writeGlyph.toDOM(glyphName, glyphObject)
            doh.assertEqual(1, document.documentElement.children.length)
            unicode = document.documentElement.children[0];
            doh.assertEqual('unicode', unicode.tagName)
            doh.assertEqual('00E4', unicode.getAttribute('hex'))
            // same as before, but with a list as input
            glyphObject = {
                unicodes: ['ä'.charCodeAt(0)]
            }
            document = writeGlyph.toDOM(glyphName, glyphObject)
            doh.assertEqual(1, document.documentElement.children.length)
            unicode = document.documentElement.children[0];
            doh.assertEqual('unicode', unicode.tagName)
            doh.assertEqual('00E4', unicode.getAttribute('hex'))
            
            // test if it skips doubles
            glyphObject = {
                unicodes: ['ä'.charCodeAt(0), 'ä'.charCodeAt(0)]
            }
            document = writeGlyph.toDOM(glyphName, glyphObject)
            doh.assertEqual(1, document.documentElement.children.length)
            unicode = document.documentElement.children[0];
            doh.assertEqual('unicode', unicode.tagName)
            doh.assertEqual('00E4', unicode.getAttribute('hex'))
            
            // multiple unicodes as inputs
            glyphObject = {
                unicodes: [
                        //'LATIN SMALL LETTER A WITH DIAERESIS' (U+00E4)
                          'ä'.charCodeAt(0)
                        // 'COMMERCIAL AT' (U+0040)
                        , '@'.charCodeAt(0)
                        // 'LATIN CAPITAL LETTER P' (U+0050)
                        , 'P'.charCodeAt(0)
                        // 'DEVANAGARI LETTER DDHA' (U+0922)
                        , 'ढ़'.charCodeAt(0)
                        ]
            }
            hexMembers = {
                '00E4': null, '0040':null, '0050':null, '0922':null}
            
            document = writeGlyph.toDOM(glyphName, glyphObject)
            doh.assertEqual(4, document.documentElement.children.length)
            
            // unicodes have an order!
            // http://unifiedfontobject.org/versions/ufo3/glif.html
            //   The first occurrence of this element defines the primary
            //   unicode value for this glyph.
            unicode = document.documentElement.children[0];
            doh.assertEqual('unicode', unicode.tagName);
            doh.assertEqual('00E4', unicode.getAttribute('hex'))
            
            doh.assertEqual(
                glyphObject.unicodes, 
                Array.prototype
                     .slice.call(document.getElementsByTagName('unicode'))
                     .map(function(item) {
                            return parseInt(item.getAttribute('hex'), 16)})
            );
            
            // see if everything is there
            for(i=0;i<document.documentElement.children.length;i++) {
                unicode = document.documentElement.children[i];
                doh.assertEqual('unicode', unicode.tagName);
                doh.assertTrue(unicode.getAttribute('hex') in hexMembers);
                // // ensure that the found values are only once in the glyph
                delete hexMembers[unicode.getAttribute('hex')]
            }
        }
      , function Test_wrtiteGlyph_writeNote() {
            var glyphName = 'any'
              , glyphObject
              , document
              , note
              ;
            glyphObject = {
                note: 'A personal note\nto myself.'
            }
            document = writeGlyph.toDOM(glyphName, glyphObject)
            doh.assertEqual(1, document.documentElement.children.length)
            note = document.documentElement.children[0];
            doh.assertEqual(glyphObject.note, note.textContent);
            
            // must be a string
            glyphObject = {
                note: ['A personal note\nto myself.']
            }
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject]
              , 'note attribute must be string'
            )
            
        }
      , function Test_wrtiteGlyph_writeImage() {
            var glyphName = 'any'
              , glyphObject
              , document
              , image
              , k
              ;
            // image is validated with imageValidator, which is tested
            // already, we do some spot tests, only
            
            // name is missing
            glyphObject = {
                image: {}
            }
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject]
              , 'image attribute must be a dict or '
                + 'dict-like object with the proper structure'
            )
            
            // fileName must be one or more characters
            glyphObject = {
                image: {
                    fileName: ''
                }
            }
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject]
              , 'image attribute must be a dict or '
                + 'dict-like object with the proper structure'
            )
            
            // minimal
            glyphObject = {
                image: {
                    fileName: './my/image/file.png'
                }
            }
            
            document = writeGlyph.toDOM(glyphName, glyphObject)
            doh.assertEqual(1, document.documentElement.children.length)
            image = document.documentElement.children[0];
            doh.assertEqual('image', image.tagName)
            doh.assertEqual(glyphObject.image.fileName,
                            image.getAttribute('fileName'))
            
            // no image in version format < 2
            glyphObject = {
                image: {
                    fileName: './my/image/file.png'
                }
            }
            
            document = writeGlyph.toDOM(glyphName, glyphObject, undefined, 1)
            doh.assertEqual(0, document.documentElement.children.length)
            
            // all data
            glyphObject = {
                image: {
                    fileName: './my/image/file.png'
                  , xScale: 0
                  , xyScale: 2
                  , yxScale: 3
                  , yScale: 4
                  , xOffset: 5
                  , yOffset: 6
                  , color: '.1,.2, .3,.4'
                }
            }
            document = writeGlyph.toDOM(glyphName, glyphObject)
            doh.assertEqual(1, document.documentElement.children.length)
            image = document.documentElement.children[0];
            for(var k in glyphObject.image) {
                doh.assertTrue(image.hasAttribute(k))
                doh.assertEqual(glyphObject.image[k].toString(),
                                image.getAttribute(k))
            }
            
            // transformation data that is the same as in the identity
            // transformation is left out:
            
            glyphObject = {
                image: {
                    fileName: './my/image/file.png'
                  , xScale: 1
                  , xyScale: 0
                  , yxScale: 0
                  , yScale: 4
                  , xOffset: 5
                  , yOffset: 6
                }
            }
            
            document = writeGlyph.toDOM(glyphName, glyphObject)
            doh.assertEqual(1, document.documentElement.children.length)
            image = document.documentElement.children[0];
            for(var k in glyphObject.image) {
                if(k in {xScale:null, xyScale:null, yxScale:null})
                    doh.assertFalse(image.hasAttribute(k))
                else{
                    doh.assertTrue(image.hasAttribute(k))
                    doh.assertEqual(glyphObject.image[k].toString(),
                                image.getAttribute(k))
                }
            }
        }
      , function Test_wrtiteGlyph_writeGuidelines() {
            var glyphName = 'any'
              , glyphObject
              , document
              , guidelines
              , i, k
              ;
            // guidelines are tested by the guidelines validator
            
            // guidelines must be an array
            glyphObject = {
                guidelines: {}
            }
            
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject]
              , 'guidelines attribute does not have '
                + 'the proper structure.'
            )
            
            
            glyphObject = {
                guidelines: [
                    {
                        x: 12
                      , identifier: 'peter'
                      , color: '.3,0.2,.8,0'
                    }
                  , {
                        y: 134
                      , name: 'another guide'
                    }
                  , {
                        x: 234
                      , y: 134
                      , angle: 234.3
                      , name: 'another guide'
                      , identifier: 'horst'
                    }
                ]
            }
            document = writeGlyph.toDOM(glyphName, glyphObject);
            guidelines = document.getElementsByTagName('guideline');
            doh.assertEqual(glyphObject.guidelines.length, guidelines.length)
            for(i=0; i<guidelines.length; i++) {
                for(k in glyphObject.guidelines[i])
                    doh.assertEqual(glyphObject.guidelines[i][k],
                                    guidelines[i].getAttribute(k))
            }
            
            
            // fail because identifier exists
            glyphObject.guidelines[2].identifier
                = glyphObject.guidelines[0].identifier;
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject]
              , 'guidelines attribute does not have '
                + 'the proper structure.'
            )
            
            // no guides because we export version 1
            document = writeGlyph.toDOM(glyphName, glyphObject, undefined, 1);
            guidelines = document.getElementsByTagName('guideline');
            doh.assertEqual(0, guidelines.length)
        }
      , function Test_wrtiteGlyph_writeAnchorsFormat1() {
            var glyphName = 'any'
              , glyphObject
              , document
              , anchors
              , i, k
              ;
            glyphObject = {
                anchors: [
                    {x: 12, y:12, name: 'holger'}
                  , {x: 12, y:12, name: 'oskar'}
                ]
            }
            document = writeGlyph.toDOM(glyphName, glyphObject, undefined, 1);
            doh.assertEqual(1, document.documentElement.children.length)
            doh.assertEqual('outline', document.documentElement
                                               .children[0].tagName)
            doh.assertEqual(glyphObject.anchors.length,
                            document.documentElement.children[0]
                                                    .children.length)
            anchors = document.documentElement.children[0].children;
            for(i=0;i<anchors;i++) {
                doh.assertEqual('contour',anchors.tagName);
                doh.assertEqual(1,anchors.children.length);
                doh.assertEqual('point',anchors.children[0].tagName);
                for(k in glyphObject.anchors[i])
                    doh.assertEqual(glyphObject.anchors[i][k].toString(),
                                    anchors.children[0].getAttribute(k));
            }
            // Note: this uses anchorsValidator, which will check some v3
            // attributes, too. So at this point this might fail because
            // we have doubled identifiers, BUT without using these identifiers
            // at the end! This may break one day, but a refactoting would
            // now take me further away from staying close to robofab.
            // The other validated thin is an eventual "color" attribute
            
            
            // anchors must be an array
            glyphObject = {
                anchors: true
            }
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject, undefined, 1]
              , 'anchors attribute does not have the '
                + 'proper structure.'
            )
            
            // x and y are meed
            glyphObject = {
                anchors: [
                    {}
                ]
            }
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject, undefined, 1]
              , 'anchors attribute does not have the '
                + 'proper structure.'
            )
            
            glyphObject = {
                anchors: [
                    {x: 13}
                ]
            }
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject, undefined, 1]
              , 'anchors attribute does not have the '
                + 'proper structure.'
            )
            
            // x and y need to be strings
            glyphObject = {
                anchors: [
                    {x: 13, y:'123'}
                ]
            }
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject, undefined, 1]
              , 'anchors attribute does not have the '
                + 'proper structure.'
            )
        }
      , function Test_wrtiteGlyph_writeAnchors() {
            var glyphName = 'any'
              , glyphObject
              , document
              , anchor
              , i, k
              ;
            glyphObject = {
                anchors: [
                    {x: 12, y:12, name: 'holger', color:'.3,0.4,0,0'}
                  , {x: 12, y:12, name: 'oskar', identifier:'id-1'}
                ]
            }
            document = writeGlyph.toDOM(glyphName, glyphObject, undefined, 2);
            doh.assertEqual(glyphObject.anchors.length,
                            document.documentElement.children.length)
            for(i=0; i<glyphObject.anchors.length;i++) {
                anchor = document.documentElement.children[i];
                doh.assertEqual('anchor', anchor.tagName)
                for(k in glyphObject.anchors[i]) {
                    doh.assertTrue(anchor.hasAttribute(k));
                    doh.assertEqual(glyphObject.anchors[i][k].toString(),
                        anchor.getAttribute(k));
                }
            }
            
            // fail invalid color
            glyphObject = {
                anchors: [
                    {x: 12, y:12, name: 'holger', color:'.3, Helloo 0,0'}
                  , {x: 12, y:12, name: 'oskar', identifier:'id-1'}
                ]
            }
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject, undefined, 2]
              , 'anchors attribute does not have the '
                + 'proper structure.'
            )
            
            // fail double identifiers
            glyphObject = {
                anchors: [
                    {x: 12, y:12, name: 'holger', identifier:'id-1'}
                  , {x: 12, y:12, name: 'oskar', identifier:'id-1'}
                ]
            }
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject, undefined, 2]
              , 'anchors attribute does not have the '
                + 'proper structure.'
            )
            
            // fail anchors must be array
            glyphObject = {
                anchors: {}
            }
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject, undefined, 2]
              , 'anchors attribute does not have the '
                + 'proper structure.'
            )
            
            // fail anchors items must be dict
            glyphObject = {
                anchors: [
                    'hello'
                ]
            }
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject, undefined, 2]
              , 'anchors attribute does not have the '
                + 'proper structure.'
            )
            
            // fail anchor must have coordinates for x and y
            glyphObject = {
                anchors: [
                    {x: 123}
                ]
            }
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject, undefined, 2]
              , 'anchors attribute does not have the '
                + 'proper structure.'
            )
            
            // coordinates must be number
            glyphObject = {
                anchors: [
                    {x: 123, y: true}
                ]
            }
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject, undefined, 2]
              , 'anchors attribute does not have the '
                + 'proper structure.'
            )
            
            // coordinates must be number
            glyphObject = {
                anchors: [
                    {x: 123, y: 123}
                ]
            }
            document = writeGlyph.toDOM(glyphName, glyphObject, undefined, 2);
            anchor = document.getElementsByTagName('anchor')[0]
            doh.assertTrue(anchor !== undefined)
            doh.assertTrue(anchor.hasAttribute('x'))
            doh.assertTrue(anchor.hasAttribute('y'))
            doh.assertEqual(2, anchor.attributes.length)
            doh.assertEqual(glyphObject.anchors[0].x.toString()
                                                , anchor.getAttribute('x'))
            doh.assertEqual(glyphObject.anchors[0].y.toString(),
                                                  anchor.getAttribute('y'))
        }
      , function Test_wrtiteGlyph_writeLib() {
            var glyphName = 'any'
              , glyphObject
              , document
              , lib
              , restored
              ;
            // _writeLib uses glyphLibValidator to validate the lib object
            // glyphLibValidator validates the key "public.markColor"
            // as color
            glyphObject = {
                lib: [
                    'an array should not work out'
                ]
            }
            
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject]
              , 'The lib data is not in the correct format'
            )
            
            // empty lib element
            glyphObject = {
                lib: {}
            }
            document = writeGlyph.toDOM(glyphName, glyphObject);
            doh.assertEqual(1, document.documentElement.children.length);
            lib = document.documentElement.children[0];
            doh.assertEqual('lib', lib.tagName)
            doh.assertEqual(1, lib.children.length)
            doh.assertEqual('dict', lib.children[0].tagName)
            restored = plistLib.readPlistElement(lib.children[0])
            doh.assertTrue(compareObjects(glyphObject.lib, restored))
            
            // full lib element
            glyphObject = {
                lib: {
                    arr: [1,2,.3,4,5,{ cc: 'inner dict'}]
                  , 'a very funkey!\'"...': 123
                  , 'a dict': { 'a-list': ['c','d'], 'a-string': 'hi'}
                  , num: 3
                  , 'public.markColor': '1,.4,0,0'
                }
            }
            document = writeGlyph.toDOM(glyphName, glyphObject);
            doh.assertEqual(1, document.documentElement.children.length);
            lib = document.documentElement.children[0];
            doh.assertEqual('lib', lib.tagName)
            doh.assertEqual(1, lib.children.length)
            doh.assertEqual('dict', lib.children[0].tagName)
            restored = plistLib.readPlistElement(lib.children[0])
            doh.assertTrue(compareObjects(glyphObject.lib, restored))
            
            // fail because of not validating public.markColor
            glyphObject = {
                lib: {
                  'public.markColor': '1,.4'
                }
            }
            doh.assertError(
                errors.GlifLib
              , writeGlyph, 'toDOM'
              , [glyphName, glyphObject]
              , 'public.markColor is not properly formatted.'
            )
            // works
            glyphObject = {
                lib: {
                  'public.markColor': '1,.4,0,0'
                }
            }
            
            document = writeGlyph.toDOM(glyphName, glyphObject);
            restored = plistLib.readPlistElement(
                    document.getElementsByTagName('lib')[0].children[0])
            doh.assertEqual(glyphObject.lib['public.markColor'],
                                        restored['public.markColor'])
        }
      , function Test_wrtiteGlyph_drawPointsFunc() {
            function drawPoints(commands, pen) {
                commands.map(_drawToPen, pen)
            }
            
            var glyphName = 'any'
              , glyphObject = {}
              , document
              , outlineCommands
              , outline
              ;
            
            // GLIFPointPen is tested separately, so its enough for us
            // to see that the outline is generated in the glyph
            
            // create an empty outline
            document = writeGlyph.toDOM(glyphName, glyphObject, function(){});
            doh.assertEqual(1, document.documentElement.children.length)
            doh.assertEqual(0, document.documentElement.children[0]
                                                       .children.length)
            doh.assertEqual('outline', document.documentElement.children[0]
                                                        .tagName)
            // create an outline
            outlineCommands = [
                [ 'beginPath' ],
                [ 'addPoint', [ 445, 0 ], 'line', false, 'horst' ],
                [ 'addPoint', [ 319, 249 ], 'line', false, undefined, 
                                            {identifier:'very-unique'}],
                [ 'addPoint', [ 380, 286 ], null, false, undefined ],
                [ 'addPoint', [ 417, 349 ], null, false, undefined ],
                [ 'addPoint', [ 417, 436 ], 'curve', true, undefined ],
                [ 'addPoint', [ 417, 590 ], null, false, undefined ],
                [ 'addPoint', [ 315, 664 ], null, false, undefined ],
                [ 'addPoint', [ 151, 664 ], 'curve', true, undefined ],
                [ 'addPoint', [ 47, 664 ], 'line', false, undefined ],
                [ 'addPoint', [ 47, 0 ], 'line', false, undefined ],
                [ 'addPoint', [ 151, 0 ], 'line', false, undefined ],
                [ 'addPoint', [ 151, 208 ], 'line', false, undefined ],
                [ 'addPoint', [ 180, 208 ], null, false, undefined ],
                [ 'addPoint', [ 197, 210 ], null, false, undefined ],
                [ 'addPoint', [ 221, 214 ], 'curve', false, undefined ],
                [ 'addPoint', [ 331, 0 ], 'line', false, undefined ],
                [ 'endPath' ],
                [ 'beginPath', {identifier:'another one'}],
                [ 'addPoint', [ 313, 436 ], 'curve', true, undefined ],
                [ 'addPoint', [ 313, 345 ], null, false, undefined ],
                [ 'addPoint', [ 250, 303 ], null, false, undefined ],
                [ 'addPoint', [ 151, 303 ], 'curve', false, undefined ],
                [ 'addPoint', [ 151, 569 ], 'line', false, undefined ],
                [ 'addPoint', [ 251, 569 ], null, false, undefined ],
                [ 'addPoint', [ 313, 535 ], null, false, undefined ],
                [ 'endPath' ],
                [ 'addComponent', 'B', [ 1, 0, 0.3, 1, 350, 0 ] ]
            ]
            document = writeGlyph.toDOM(glyphName, glyphObject,
                                drawPoints.bind(null, outlineCommands));
            
            doh.assertEqual(2, document.getElementsByTagName('contour').length)
            doh.assertEqual(23, document.getElementsByTagName('point').length)
            doh.assertEqual(1, document.getElementsByTagName('component').length)
        }
    ])
});
