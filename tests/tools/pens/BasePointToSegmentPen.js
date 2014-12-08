define(
    [
        'ufojs/errors',
        'ufojs/tools/pens/AbstractPointPen',
        'ufojs/tools/pens/BasePointToSegmentPen',
        'ufojs/tools/pens/testPens'
    ],
    function(
        errors,
        AbstractPointPen,
        BasePointToSegmentPen,
        testPens
    )
{
    /*shortcuts*/
    var TestPen = testPens.BasePointToSegmentTestPen;
    
    doh.register("ufojs.pens.BasePointToSegmentPen", [
    function Test_BasePointToSegmentPen_inheritance() {
        var pen = new BasePointToSegmentPen();
        doh.assertTrue(pen instanceof AbstractPointPen);
        
        var pen = new TestPen;
        doh.assertTrue(pen instanceof AbstractPointPen);
        doh.assertTrue(pen instanceof BasePointToSegmentPen);
    },
    function Test_BasePointToSegmentPen_Errors() {
        var pen = new BasePointToSegmentPen();
        
        doh.assertError(
            TypeError,//TypeError: Cannot call method 'push' of null
            pen, 'addPoint',
            [[1, 1]],
            'addPoint before beginPath'
        );
        
        doh.assertError(
            errors.Assertion,
            pen, 'endPath',
            [],
            'currentPath is null'
        );
        
        pen.beginPath();
        
        doh.assertError(
            errors.Assertion,
            pen, 'beginPath',
            [],
            'currentPath is not null'
        );
        //now we can call endPath
        pen.endPath();
        //after calling endPath we can call beginPath again
        pen.beginPath();
        
        var pen = new BasePointToSegmentPen();
        doh.assertError(
            errors.NotImplemented,
            pen, 'addComponent'
        );
        
        doh.assertError(
            errors.NotImplemented,
            pen, '_flushContour'
        );
    },
    function Test_BasePointToSegmentPen_addPoint() {
        var pen = new BasePointToSegmentPen();
        // just testing if all defaults come out as expected
        // and if all other args end in currentPath as they are
        var expecting = [
            [undefined, null, false, null, {}],
            [[1, 1], 'move', true, 'Hermann', {abc: 'def'}]
        ];
        pen.beginPath();
        pen.addPoint();
        pen.addPoint([1, 1], 'move', true, 'Hermann', {abc: 'def'});
        doh.assertEqual(expecting, pen.currentPath);
    },
    function Test_BasePointToSegmentPen_endPath() {
        var pen = new TestPen();
        
        //no addPoint so nothing happened
        var expecting = [];
        pen.beginPath();
        pen.endPath();
        doh.assertEqual( expecting, pen.flush() );
        
        // testing for a 'smart' thing endPath does, if there
        // is only one point it has to be a 'move', so it transforms
        // our 'curve' into a move
        var kwargs = undefined
          , expecting = [
            ['_flushContour', /* segments: */  [
                [ 'move', [ [ [1, 1], true, null, {} ] ] ] 
            ], kwargs]
        ];
        pen.beginPath(kwargs);
        pen.addPoint([1, 1], 'curve', true);
        pen.endPath();
        doh.assertEqual(expecting, pen.flush());
        
        //an open countour
        var expecting = [
            ['_flushContour', /* segments: */  [
                [ 'move', [ [ [1, 1], false, null, {} ] ] ],
                [ 'curve', [
                    [ [2, 2], false, null, {} ],
                    [ [3, 3], false, null, {} ],
                    [ [4, 4], true, null, {} ]
                ]],
            ], kwargs]
        ];
        pen.beginPath();
        pen.addPoint([1, 1], 'move');
        pen.addPoint([2, 2]);
        pen.addPoint([3, 3]);
        pen.addPoint([4, 4], 'curve', true);
        pen.endPath();
        doh.assertEqual(expecting, pen.flush());
        
        // the pen will rotate the point list so that it ends with the
        // first on curve point of the point list
        var expecting = [
            ['_flushContour', /* segments: */  [
                [ 'curve', [
                    [ [1, 1], false, null, {} ],
                    [ [2, 2], false, null, {} ],
                    [ [3, 3], false, null, {} ]
                ]],
                [ 'line', [
                    [ [4, 4], false, null, {} ]
                ]],
                [ 'curve', [
                    [ [5, 5], false, null, {} ],
                    [ [6, 6], false, null, {} ],
                    [ [7, 7], true, null, {} ]
                ]],
            ], kwargs]
        ];
        pen.beginPath();
        pen.addPoint([6, 6]);
        pen.addPoint([7, 7], 'curve', true);
        pen.addPoint([1, 1]);
        pen.addPoint([2, 2]);
        pen.addPoint([3, 3], 'curve', false);
        pen.addPoint([4, 4], 'line');
        pen.addPoint([5, 5]);
        pen.endPath();
        doh.assertEqual(expecting, pen.flush());
        
        //the quadratic curves special case without on curve points
        var expecting = [
            ['_flushContour', /* segments: */  [
                [ 'qcurve', [
                    [ [1, 1], false, null, {} ],
                    [ [2, 2], false, null, {} ],
                    [ [3, 3], false, null, {} ],
                    [ [4, 4], false, null, {} ],
                    [ [5, 5], false, null, {} ],
                    [ null, null, null, null ]
                ]],
            ], kwargs]
        ];
        pen.beginPath();
        pen.addPoint([1, 1]);
        pen.addPoint([2, 2]);
        pen.addPoint([3, 3]);
        pen.addPoint([4, 4]);
        pen.addPoint([5, 5]);
        pen.endPath();
        doh.assertEqual(expecting, pen.flush());
    }
    ]);
});
