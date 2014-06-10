define([
    'ufojs/main'
  , 'ufojs/errors'
  , 'ufojs/ufoLib/glifLib/readGlyph'
  , 'ufojs/tools/pens/testPens'
  , 'ufojs/xml/main'
  , 'ufojs/plistLib/main'
], function(
    main
  , errors
  , readGlyph
  , pens
  , xml
  , plistLib
) {
    "use strict";
    var compareObjects = plistLib._comparePlists
      , AbstractPointTestPen = pens.AbstractPointTestPen
      , glifString = '<?xml version="1.0" encoding="UTF-8"?>\n\
<glyph name="R" format="1">\n\
  <advance width="463"/>\n\
  <unicode hex="0052"/>\n\
  <unicode hex="005954"/>\n\
  <outline>\n\
    <contour>\n\
      <point x="208" y="681" type="move" name="top"/>\n\
    </contour>\n\
    <contour>\n\
      <point x="445" y="0" type="line" name="horst"/>\n\
      <point x="319" y="249" type="line"/>\n\
      <point x="380" y="286"/>\n\
      <point x="417" y="349"/>\n\
      <point x="417" y="436" type="curve" smooth="yes"/>\n\
      <point x="417" y="590"/>\n\
      <point x="315" y="664"/>\n\
      <point x="151" y="664" type="curve" smooth="yes"/>\n\
      <point x="47" y="664" type="line"/>\n\
      <point x="47" y="0" type="line"/>\n\
      <point x="151" y="0" type="line"/>\n\
      <point x="151" y="208" type="line"/>\n\
      <point x="180" y="208"/>\n\
      <point x="197" y="210"/>\n\
      <point x="221" y="214" type="curve"/>\n\
      <point x="331" y="0" type="line"/>\n\
    </contour>\n\
    <contour>\n\
      <point x="313" y="436" type="curve" smooth="yes"/>\n\
      <point x="313" y="345"/>\n\
      <point x="250" y="303"/>\n\
      <point x="151" y="303" type="curve"/>\n\
      <point x="151" y="569" type="line"/>\n\
      <point x="251" y="569"/>\n\
      <point x="313" y="535"/>\n\
    </contour>\n\
    <component base="B" xOffset="350" yxScale=".3" />\n\
  </outline>\n\
</glyph>'

        // format1 glif example from http://unifiedfontobject.org/versions/ufo2/glif.html
      , format1GlifSpec = '<?xml version="1.0" encoding="UTF-8"?>\n\
<glyph name="period" format="1">\n\
  <advance width="268"/>\n\
  <unicode hex="002E"/>\n\
  <outline>\n\
    <contour>\n\
      <point x="237" y="152"/>\n\
      <point x="193" y="187"/>\n\
      <point x="134" y="187" type="curve" smooth="yes"/>\n\
      <point x="74" y="187"/>\n\
      <point x="30" y="150"/>\n\
      <point x="30" y="88" type="curve" smooth="yes"/>\n\
      <point x="30" y="23"/>\n\
      <point x="74" y="-10"/>\n\
      <point x="134" y="-10" type="curve" smooth="yes"/>\n\
      <point x="193" y="-10"/>\n\
      <point x="237" y="25"/>\n\
      <point x="237" y="88" type="curve" smooth="yes"/>\n\
      <point x="331" y="0" type="line"/>\n\
    </contour>\n\
  </outline>\n\
  <lib>\n\
    <dict>\n\
      <key>\n\com.letterror.somestuff</key>\n\
      <string>\n\arbitrary custom data!</string>\n\
    </dict>\n\
  </lib>\n\
</glyph>'
        // format2 glif example http://unifiedfontobject.org/versions/ufo3/glif.html
      , format2GlifSpec = '<?xml version="1.0" encoding="UTF-8"?>\n\
<glyph name="period" format="2">\n\
  <advance width="268"/>\n\
  <unicode hex="002E"/>\n\
  <unicode hex="002F"/>\n\
  <image fileName="period sketch.png" xScale="0.5" yScale="0.5"/>\n\
  <guideline y="-12" name="overshoot" identifier="this is a guideline"/>\n\
  <guideline y="-15" x="30" angle="345" color="0,0,1,0" />\n\
  <anchor x="74" y="197" name="top" identifier="just an anchor"/>\n\
  <outline>\n\
    <contour>\n\
      <point x="237" y="152"/>\n\
      <point x="193" y="187"/>\n\
      <point x="134" y="187" type="curve" smooth="yes"/>\n\
      <point x="74" y="187"/>\n\
      <point x="30" y="150"/>\n\
      <point x="30" y="88" type="curve" smooth="yes"/>\n\
      <point x="30" y="23"/>\n\
      <point x="74" y="-10" identifier="just a point" />\n\
      <point x="134" y="-10" type="curve" smooth="yes"/>\n\
      <point x="193" y="-10"/>\n\
      <point x="237" y="25" />\n\
      <point x="237" y="88" type="curve" smooth="yes"/>\n\
    </contour>\n\
  </outline>\n\
  <lib>\n\
    <dict>\n\
      <key>com.letterror.somestuff</key>\n\
      <string>arbitrary custom data!</string>\n\
      <key>public.markColor</key>\n\
      <string>1,0,0,0.5</string>\n\
    </dict>\n\
  </lib>\n\
</glyph>'
;

    doh.register("ufoLib.glifLib.readGlyph", [
        function Test_readGlyphFromString() {
            var glyphObject, pen, prediction, result,i;
            
            // read the more complex glifString
            glyphObject = {};
            pen = new AbstractPointTestPen();
            
            readGlyph.fromString(glifString, glyphObject, pen);
            doh.assertEqual(glyphObject,{name: 'R',
                                         width: 463,
                                         height: 0,
                                         unicodes: [ 82, 22868 ],
                                         anchors: [
                                            { x: 208, y: 681, name: 'top' }
                                         ]
            })
            
            doh.assertError(
                errors.GlifLib,
                readGlyph, 'fromString',
                ['<glif />', {}],
                'GLIF data is not properly formatted.'
            );
            
            doh.assertError(
                errors.Parser,
                readGlyph, 'fromString',
                ['<glyph ', {}],
                'Not parseable.'
            );
            
            
            prediction = [
                [ 'beginPath' ],
                [ 'addPoint', [ 445, 0 ], 'line', false, 'horst' ],
                [ 'addPoint', [ 319, 249 ], 'line', false, undefined ],
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
                [ 'beginPath' ],
                [ 'addPoint', [ 313, 436 ], 'curve', true, undefined ],
                [ 'addPoint', [ 313, 345 ], null, false, undefined ],
                [ 'addPoint', [ 250, 303 ], null, false, undefined ],
                [ 'addPoint', [ 151, 303 ], 'curve', false, undefined ],
                [ 'addPoint', [ 151, 569 ], 'line', false, undefined ],
                [ 'addPoint', [ 251, 569 ], null, false, undefined ],
                [ 'addPoint', [ 313, 535 ], null, false, undefined ],
                [ 'endPath' ],
                [ 'addComponent', 'B', [ 1, 0, 0.3, 1, 350, 0 ] ]
            ];
            
            result = pen.flush();
            doh.assertEqual(prediction, result)
            // check that especially points are stricly equal
            // points must be numbers!
            for(i=0; i<result.length;i++) {
                if(result[i][0] === 'addPoint') {
                    doh.assertTrue(prediction[i][1][0] === result[i][1][0]);
                    doh.assertTrue(prediction[i][1][1] === result[i][1][1]);
                }
            }
            
            // read format1GlifSpec glif
            glyphObject = {};
            pen = new AbstractPointTestPen();
            readGlyph.fromString(format1GlifSpec, glyphObject, pen);
            doh.assertEqual(glyphObject, {
                    name: 'period',
                    width: 268,
                    height: 0,
                    lib: {
                        '\ncom.letterror.somestuff': '\narbitrary custom data!'
                    },
                    unicodes: [ 46 ]
                });
            doh.assertEqual(pen.flush(), [ [ 'beginPath' ],
                [ 'addPoint', [ 237, 152 ], null, false, undefined ],
                [ 'addPoint', [ 193, 187 ], null, false, undefined ],
                [ 'addPoint', [ 134, 187 ], 'curve', true, undefined ],
                [ 'addPoint', [ 74, 187 ], null, false, undefined ],
                [ 'addPoint', [ 30, 150 ], null, false, undefined ],
                [ 'addPoint', [ 30, 88 ], 'curve', true, undefined ],
                [ 'addPoint', [ 30, 23 ], null, false, undefined ],
                [ 'addPoint', [ 74, -10 ], null, false, undefined ],
                [ 'addPoint', [ 134, -10 ], 'curve', true, undefined ],
                [ 'addPoint', [ 193, -10 ], null, false, undefined ],
                [ 'addPoint', [ 237, 25 ], null, false, undefined ],
                [ 'addPoint', [ 237, 88 ], 'curve', true, undefined ],
                [ 'addPoint', [ 331, 0 ], 'line', false, undefined ],
                [ 'endPath' ]
            ]);

            // read format2GlifSpec glif
            glyphObject = {};
            pen = new AbstractPointTestPen();
            readGlyph.fromString(format2GlifSpec, glyphObject, pen);
            
            prediction = {
                name: 'period',
                width: 268,
                height: 0,
                image: {
                    fileName: 'period sketch.png',
                    xScale: 0.5,
                    yScale: 0.5,
                    xyScale: 0,
                    yxScale: 0,
                    xOffset: 0,
                    yOffset: 0
                },
                lib: {
                    'com.letterror.somestuff': 'arbitrary custom data!',
                    'public.markColor': '1,0,0,0.5' 
                },
                guidelines: [
                    { y: -12, name: 'overshoot', identifier: 'this is a guideline' },
                    { y: -15, x: 30, angle:345, color:'0,0,1,0' }
                ],
                anchors: [ { x: 74, y: 197, name: 'top', identifier: 'just an anchor' } ],
                unicodes: [ 46, 47 ]
            };
            
           
            doh.assertEqual(prediction, glyphObject);
            
            prediction = [
                [ 'beginPath', {identifier:undefined} ],
                
                [ 'addPoint', [ 237, 152 ], null, false, undefined, {identifier:undefined} ],
                [ 'addPoint', [ 193, 187 ], null, false, undefined, {identifier:undefined} ],
                [ 'addPoint',
                    [ 134, 187 ],
                    'curve',
                    true,
                    undefined,
                    {identifier:undefined} ],
                [ 'addPoint', [ 74, 187 ], null, false, undefined, {identifier:undefined} ],
                [ 'addPoint', [ 30, 150 ], null, false, undefined, {identifier:undefined} ],
                [ 'addPoint', [ 30, 88 ], 'curve', true, undefined, {identifier:undefined} ],
                [ 'addPoint', [ 30, 23 ], null, false, undefined, {identifier:undefined} ],
                [ 'addPoint',
                    [ 74, -10 ],
                    null,
                    false,
                    undefined,
                    {identifier:'just a point'} ],
                [ 'addPoint',
                    [ 134, -10 ],
                    'curve',
                    true,
                    undefined,
                    {identifier:undefined} ],
                [ 'addPoint', [ 193, -10 ], null, false, undefined, {identifier:undefined} ],
                [ 'addPoint', [ 237, 25 ], null, false, undefined, {identifier:undefined} ],
                [ 'addPoint', [ 237, 88 ], 'curve', true, undefined, {identifier:undefined} ],
                [ 'endPath' ]
            ];
            result = pen.flush()
            
            doh.assertTrue(compareObjects(result, prediction, true));
        },
        function Test_readGlyph_RootElement() {
            var doc
              , glyphObject
              , i
              , fails
              ;
            
            doc = xml.parseXMLString('<glyph name="minimal" format="2" />');
            glyphObject = {};
            readGlyph.fromDOM(doc, glyphObject);
            doh.assertEqual({ name: 'minimal' }, glyphObject);
            
            fails = [
                ['<generic />', 'No <glyph> root element']
              , ['<glyph name="" format="2" />', 'Name must be set']
              , ['<glyph format="2" />', 'Name must be set']
              , ['<glyph  name="hi" format="3" />', 'unknown format']
              , ['<glyph  name="hi" />', 'format must be set']
              , ['<glyph  name="hi" />', 'format must be set']
            ]
            for(i=0; i<fails.length; i++) {
                doh.assertError(
                    errors.GlifLib,
                    readGlyph, 'fromDOM',
                    [xml.parseXMLString(fails[i][0]), {}],
                    fails[i][1]
                );
            }
        }
      , function Test_conflicting_identifiers() {
            var glyphObject
              , pen
              , format2Glif = '<?xml version="1.0" encoding="UTF-8"?>\n\
<glyph name="period" format="2">\n\
  <guideline y="-12" name="overshoot" identifier="this is a guideline"/>\n\
  <guideline y="-15" x="30" angle="345" color="0,0,1,0" />\n\
  <anchor x="74" y="197" name="top" identifier="just an anchor"/>\n\
  <anchor x="74" y="197" name="top" identifier="just another anchor"/>\n\
  <outline>\n\
    <contour>\n\
      <point x="237" y="152" identifier="just a point"/>\n\
      <point x="193" y="187"/>\n\
      <point x="134" y="187" type="curve" smooth="yes"/>\n\
    </contour>\n\
  </outline>\n\
</glyph>'
              , doc = xml.parseXMLString(format2Glif)
              , guide1 = doc.firstChild.children[0]
              , guide2 = doc.firstChild.children[1]
              , anchor1 = doc.firstChild.children[2]
              , anchor2 = doc.firstChild.children[3]
              , contour = doc.firstChild.children[4].children[0]
              , point1  = contour.children[0]
              , point2  = contour.children[1]
              , goodData
              , goodOutline
              , resetter
              ;
            
            goodData = {
                    name: 'period',
                    guidelines: [
                        { y: -12, name: 'overshoot', identifier: 'this is a guideline' },
                        { y: -15, x: 30, angle: 345, color: '0,0,1,0' }
                    ],
                    anchors: [
                        { x: 74, y: 197, name: 'top', identifier: 'just an anchor' },
                        { x: 74, y: 197, name: 'top', identifier: 'just another anchor' }
                    ]
                };
            goodOutline = [
                [ 'beginPath', {identifier:undefined} ],
                [ 'addPoint',
                    [ 237, 152 ],
                    null,
                    false,
                    undefined,
                    {identifier:'just a point'} ],
                [ 'addPoint', [ 193, 187 ], null, false, undefined, {identifier: undefined} ],
                [ 'addPoint',
                    [ 134, 187 ],
                    'curve',
                    true,
                    undefined,
                    {identifier:undefined} ],
                [ 'endPath' ]
            ];
            
            glyphObject = {}
            pen = new AbstractPointTestPen();
            readGlyph.fromString(format2Glif, glyphObject, pen);
            doh.assertEqual(glyphObject, goodData);
            
            doh.assertTrue(compareObjects(pen.flush(), goodOutline, true));
            
            function setConflictID(nodes, value) {
                var _reset =  nodes.map(function(node) {
                    return [node, node.hasAttribute('identifier')
                            , node.getAttribute('identifier')]
                })
                
                nodes.forEach(function(node) {
                    node.setAttribute('identifier', value);
                })
                
                // resetter
                return function() {
                    _reset.forEach(function(item) {
                        if(!item[1])
                            item[0].removeAttribute('identifier')
                        else
                            item[0].setAttribute('identifier', item[2]);
                    })
                }
            }
            
            // causing conflicts with some combinations, then resetting
            // and trying another combo
            
            resetter = setConflictID([anchor1, point2], 'conflict')
            pen = new AbstractPointTestPen();
            glyphObject = {}
            doh.assertError(
                errors.GlifLib,
                readGlyph, 'fromDOM',
                [doc, glyphObject, pen],
                'conficting identifiers'
            );
            // check if everything is good again
            resetter();
            glyphObject = {}
            pen = new AbstractPointTestPen();
            readGlyph.fromDOM(doc, glyphObject, pen);
            doh.assertEqual(glyphObject, goodData);
            doh.assertTrue(compareObjects(pen.flush(), goodOutline, true));
            
            resetter = setConflictID([guide2, anchor2], 'conflict')
            pen = new AbstractPointTestPen();
            doh.assertError(
                errors.GlifLib,
                readGlyph, 'fromDOM',
                [doc, {}, pen],
                'conficting identifiers'
            );
            resetter();
            // check if everything is good again
            glyphObject = {}
            pen = new AbstractPointTestPen();
            readGlyph.fromDOM(doc, glyphObject, pen);
            doh.assertEqual(glyphObject, goodData);
            doh.assertTrue(compareObjects(pen.flush(), goodOutline, true));
            
            resetter = setConflictID([anchor1, anchor2], 'conflict')
            pen = new AbstractPointTestPen();
            doh.assertError(
                errors.GlifLib,
                readGlyph, 'fromDOM',
                [doc, {}, pen],
                'conficting identifiers'
            );
            resetter();
            // check if everything is good again
            glyphObject = {}
            pen = new AbstractPointTestPen();
            readGlyph.fromDOM(doc, glyphObject, pen);
            doh.assertEqual(glyphObject, goodData);
            doh.assertTrue(compareObjects(pen.flush(), goodOutline, true));
            
            resetter = setConflictID([anchor1, contour], 'conflict')
            pen = new AbstractPointTestPen();
            doh.assertError(
                errors.GlifLib,
                readGlyph, 'fromDOM',
                [doc, {}, pen],
                'conficting identifiers'
            );
            resetter();
            // check if everything is good again
            glyphObject = {}
            pen = new AbstractPointTestPen();
            readGlyph.fromDOM(doc, glyphObject, pen);
            doh.assertEqual(glyphObject, goodData);
            doh.assertTrue(compareObjects(pen.flush(), goodOutline, true));
            
            resetter = setConflictID([point2, contour], 'conflict')
            pen = new AbstractPointTestPen();
            doh.assertError(
                errors.GlifLib,
                readGlyph, 'fromDOM',
                [doc, {}, pen],
                'conficting identifiers'
            );
            resetter();
            // check if everything is good again
            glyphObject = {}
            pen = new AbstractPointTestPen();
            readGlyph.fromDOM(doc, glyphObject, pen);
            doh.assertEqual(glyphObject, goodData);
            doh.assertTrue(compareObjects(pen.flush(), goodOutline, true));
            
            resetter = setConflictID([point1, point2], 'conflict')
            pen = new AbstractPointTestPen();
            doh.assertError(
                errors.GlifLib,
                readGlyph, 'fromDOM',
                [doc, {}, pen],
                'conficting identifiers'
            );
            resetter();
            // check if everything is good again
            glyphObject = {}
            pen = new AbstractPointTestPen();
            readGlyph.fromDOM(doc, glyphObject, pen);
            doh.assertEqual(glyphObject, goodData);
            doh.assertTrue(compareObjects(pen.flush(), goodOutline, true));
            
            // but!
            errors.warn('Some conflicting identifiers are not found if using '
                +'no pen and thus no parsing and validating of the '
                + 'outline is done. Decide if this is good or bad. There '
                + 'is a source comment in ufoLib/glifLib/readGlyph, too.');
            resetter = setConflictID([point1, anchor2], 'conflict')
            glyphObject = {}
            readGlyph.fromDOM(doc, glyphObject);
            // using no pen reading passes:
            // see the seccond anchor has identifier: 'conflict'
            doh.assertEqual(glyphObject, { name: 'period',
                guidelines: [
                    { y: -12, name: 'overshoot', identifier: 'this is a guideline' },
                    { y: -15, x: 30, angle: 345, color: '0,0,1,0' }
                ],
                anchors: [
                    { x: 74, y: 197, name: 'top', identifier: 'just an anchor' },
                    { x: 74, y: 197, name: 'top', identifier: 'conflict' }
                ]
            });
            // using a pen I get an error:
            pen = new AbstractPointTestPen();
            doh.assertError(
                errors.GlifLib,
                readGlyph, 'fromDOM',
                [doc, {}, pen],
                'conficting identifiers'
            );
            resetter();
        }
    ])
});
