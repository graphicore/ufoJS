define([
    'ufojs/main'
  , 'ufojs/errors'
  , 'ufojs/xml/main'
  , 'ufojs/ufoLib/glifLib/GLIFPointPen'
], function(
    main
  , errors
  , xml
  , GLIFPointPen
) {
    "use strict";
    
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
    
    /**
     * use like:
     * _map(commands, _drawToPen, pen)
     */
    function _map(arr, fn, scope) {
        arr.map(fn, scope)
    }
    
    doh.register("ufoLib.glifLib.GLIFPointPen", [
        function Test_GLIFPointPen_constructor() {
            var pen, element
             , doc = xml.createDocument()
             , identifiers = {}
             , k
             ;
            
            element = {};
            // element must be an xml.Node
            doh.assertError(
                errors.GlifLib
              , {make: function(element){new GLIFPointPen(element)}}
              , 'make'
              , [element]
              , 'element must be an xml.Node'
            );
            
            
            element = doc.createElement('outline')
            pen = new GLIFPointPen(element, identifiers, 1);
            doh.assertTrue(pen instanceof GLIFPointPen);
            
            // test getters
            doh.assertTrue(element === pen.element);
            doh.assertTrue(identifiers === pen.identifiers);
            doh.assertTrue(1 === pen.formatVersion);
            
            // these getters are not setters
            for(k in {'element':null, 'identifiers':null,
                                                'formatVersion':null}) {
                doh.assertError(
                    TypeError,
                    {set: (function(k){this[k] = this[k];}).bind(pen)}, 'set',
                    [k],
                    'Cannot set property $k'
                );
            }
        }
      , function Test_GLIFPointPen_penptotocol() {
            var doc = xml.createDocument()
              , element
              , pen
              , outlineCommands
              , i
              , identifiers
              ;
            
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
                [ 'beginPath', {identifier:'very-unique'}],
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
            
            // format 1, ignores identifiers
            element = doc.createElement('outline');
            pen = new GLIFPointPen(element, undefined, 1);
            
            outlineCommands.map(_drawToPen, pen)
            
            // only some spot-tests
            doh.assertEqual(3, element.children.length)
            doh.assertEqual('contour', element.children[0].tagName)
            doh.assertEqual('contour', element.children[1].tagName)
            doh.assertEqual('component', element.children[2].tagName)
            
            doh.assertEqual(16, element.children[0].children.length)
            doh.assertEqual('horst', element.children[0]
                                            .children[0]
                                            .getAttribute('name'))
            doh.assertEqual(16, element.children[0].children.length)
            doh.assertFalse(element.children[0]
                                   .children[1]
                                   .hasAttribute('identifier'))
            
            
            // format 2, identifiers must be unique, so this fails
            element = doc.createElement('outline');
            pen = new GLIFPointPen(element, undefined, 2);

            // doc.appendChild(element);
            // console.log(xml.toString(doc))
            doh.assertError(
                errors.GlifLib,
                {draw: _map}, 'draw',
                [outlineCommands, _drawToPen, pen],
                'identifiers must be unique'
            );
            
            outlineCommands[2][5].identifier = 'very-very-unique'
            element = doc.createElement('outline');
            identifiers = {}
            // format 2, identifiers must be unique
            pen = new GLIFPointPen(element, identifiers, 2);
            outlineCommands.map(_drawToPen, pen)
            
            doh.assertEqual('very-very-unique', element.children[0]
                                            .children[1]
                                            .getAttribute('identifier'))
            
            doh.assertEqual('very-unique', element.children[1]
                                                  .getAttribute('identifier'));
            
            doh.assertTrue('very-very-unique' in identifiers)
            doh.assertTrue('very-unique' in identifiers)
            
            // this way the not unique identifier must also be discovered
            element = doc.createElement('outline');
            identifiers = {}
            identifiers['very-unique'] = null;
            pen = new GLIFPointPen(element, identifiers, 2);
            doh.assertError(
                errors.GlifLib,
                {draw: _map}, 'draw',
                [outlineCommands, _drawToPen, pen],
                'identifiers must be unique'
            );
        }
      , function Test_GLIFPointPen_beginPath() {
            var doc = xml.createDocument()
              , element = doc.createElement('outline')
              , identifiers = {}
              , pen = new GLIFPointPen(element, identifiers, 2)
              ;
            pen.beginPath()
            doh.assertError(
                errors.Assertion,
                pen, 'beginPath',
                [],
                'currentPath is not null, call endPath'
            );
            
            pen.endPath();
            pen.beginPath({identifier: 'hello'});
            doh.assertTrue('hello' in identifiers)
            
            pen.endPath();
            doh.assertError(
                errors.GlifLib,
                pen, 'beginPath',
                [{identifier: 'hello'}],
                'identifier used more than once: hello'
            );
        }
      , function Test_GLIFPointPen_endPath() {
            var doc = xml.createDocument()
              , element = doc.createElement('outline')
              , identifiers = {}
              , pen = new GLIFPointPen(element, identifiers, 2)
              ;
            
            doh.assertError(
                errors.Assertion,
                pen, 'endPath',
                [],
                'currentPath is null, call beginPath'
            );
            
            pen.beginPath();
            pen.addPoint([0, 0], 'move');
            pen.addPoint([0, 4]);
            
            doh.assertError(
                errors.GlifLib,
                pen, 'endPath',
                [],
                'open contour has loose offcurve point'
            );
        }
      , function Test_GLIFPointPen_addPoint() {
            var doc = xml.createDocument()
              , element = doc.createElement('outline')
              , identifiers = {}
              , pen = new GLIFPointPen(element, identifiers, 2)
              ;
            
            doh.assertError(
                errors.Assertion,
                pen, 'addPoint',
                [],
                'currentPath is null, call beginPath'
            );
            
            pen.beginPath();
            doh.assertError(
                errors.GlifLib,
                pen, 'addPoint',
                [['Horst', 'Helga'], 'move'],
                'coordinates must be int or float'
            );
            
            doh.assertError(
                errors.GlifLib,
                pen, 'addPoint',
                [],
                'Missing point argument'
            );
            
            pen.addPoint([0, 4]);
            
            doh.assertError(
                errors.GlifLib,
                pen, 'addPoint',
                [[0, 0], 'move'],
                'move occurs after a point has '
                        +'already been added to the contour.'
            );
            
            doh.assertError(
                errors.GlifLib,
                pen, 'addPoint',
                [[0, 0], 'line'],
                'offcurve occurs before line point.'
            );
            
            pen.addPoint([0, 4]);
            pen.addPoint([0, 4]);
            
            doh.assertError(
                errors.GlifLib,
                pen, 'addPoint',
                [[0, 0], 'curve'],
                'too many offcurve points before curve poin.'
            );
            
            doh.assertError(
                errors.GlifLib,
                pen, 'addPoint',
                [[0, 4], undefined, true],
                'can\'t set smooth in an offcurve point.'
            );
            
            pen.addPoint([0, 4], 'offcurve', false, 'a name', {identifier: 'hansi'});
            doh.assertTrue('hansi' in identifiers);
            
            doh.assertError(
                errors.GlifLib,
                pen, 'addPoint',
                [[0, 4], 'offcurve', false, 'a name', {identifier: 'hansi'}],
                'identifier used more than once: hansi'
            );
        }
      , function Test_GLIFPointPen_addComponent() {
            var doc = xml.createDocument()
              , element = doc.createElement('outline')
              , identifiers = {}
              , pen = new GLIFPointPen(element, identifiers, 2)
              ;
            
            pen.addComponent('X', [1,2,3,4,5,6], {identifier: 'karl'});
            
            doh.assertEqual('component', element.lastChild.tagName);
            doh.assertTrue('karl' in identifiers)
            
            doh.assertError(
                errors.GlifLib,
                pen, 'addComponent',
                ['X', [1,2,3,4,5,'6']],
                'transformation values must be int or float'
            );
            
            //transformation must be at least an empty list
            doh.assertError(
                TypeError,
                pen, 'addComponent',
                ['Y', undefined],
                'Cannot read property \'length\' of undefined'
            )
            
            pen.addComponent('Y', [], {identifier: 'petra'});
            doh.assertError(
                errors.GlifLib,
                pen, 'addComponent',
                ['X', [], {identifier: 'petra'}],
                'identifier used more than once'
            );
        }
    ]);
});
