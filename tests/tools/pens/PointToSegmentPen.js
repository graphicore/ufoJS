define(
    [
        'ufojs/errors',
        'ufojs/tools/pens/testPens',
        'ufojs/tools/pens/AbstractPen',
        'ufojs/tools/pens/AbstractPointPen',
        'ufojs/tools/pens/BasePointToSegmentPen',
        'ufojs/tools/pens/PointToSegmentPen'
    ],
    function(
        errors,
        TestPens,
        AbstractPen,
        AbstractPointPen,
        BasePointToSegmentPen,
        PointToSegmentPen
    )
{
    /*shortcuts*/
    var TestPen = TestPens.AbstractTestPen;
    
    doh.register("ufojs.pens.PointToSegmentPen", [
    function Test_PointToSegmentPen_inheritance() {
        var testPen = new TestPen(),
            pen = new PointToSegmentPen(testPen);
        
        doh.assertTrue(pen instanceof AbstractPointPen);
        doh.assertTrue(pen instanceof BasePointToSegmentPen);
        //just for the sake of it
        doh.assertTrue(testPen instanceof AbstractPen);
    },
    function Test_PointToSegmentPen_Errors() {
        var testPen = new TestPen(),
        pen = new PointToSegmentPen(testPen);
        
        pen.beginPath();
        pen.addPoint([1, 1], 'move');
        pen.addPoint([2, 2], 'fancy');
        doh.assertError(
            errors.Type,//Type: illegal segmentType: fancy
            pen, 'endPath',
            [],
            'It\'s illegal! [Maurice Moss]'
        );
        
        // this is not testable with the api the pen provides so we use
        // the 'private' method to ensure our warnings work and are
        // in place, the not-errors in the other tests are documenting
        // that the thing works as a whole
        doh.assertError(
            errors.Assertion,//'Less than one segment'
            pen, '_flushContour',
            [[]],//empty list
            'It\'s illegal! [Maurice Moss]'
        );
        
        var goodSegments = [
            [ 'move', [
                    [ [2, 2], false, null, {} ]
                ]
            ]
        ],
        badSegments = [
            [ 'move', [
                ]
            ]
        ];
        //nothing
        pen._flushContour(goodSegments);
        doh.assertError(
            errors.Assertion,//'Points length is not 1'
            pen, '_flushContour',
            [badSegments]
        );
        
        var badSegments = [
            [ 'move', [
                    [ [2, 2], false, null, {} ],
                    [ [3, 3], false, null, {} ],
                    [ [4, 4], true, null, {} ]
                ]
            ]
        ];
        doh.assertError(
            errors.Assertion,//'Points length is not 1'
            pen, '_flushContour',
            [badSegments]
        );
        
        var goodSegments = [
            [ 'move', [
                    [ [2, 2], false, null, {} ]
                ]
            ],
            [ 'line', [
                    [ [2, 2], false, null, {} ]
                ]
            ]
        ];
        badSegments = [
            [ 'move', [
                    [ [2, 2], false, null, {} ]
                ]
            ],
            [ 'line', [
                    [ [2, 2], false, null, {} ],
                    [ [2, 2], false, null, {} ]
                ]
            ]
        ];
        //nothing
        pen._flushContour(goodSegments);
        doh.assertError(
            errors.Assertion,//'Points length is not 1'
            pen, '_flushContour',
            [badSegments]
        );
        
        
        
        
    },
    function Test_PointToSegmentPen_flushContour() {
        // these are the same tests as in the ufojs.pens.BasePointToSegmentPen
        // Test_BasePointToSegmentPen_endPath test, except that we expect
        // another translation of the output
        var testPen = new TestPen(),
        pen = new PointToSegmentPen(testPen);
            
        //no addPoint so nothing happened
        var expecting = [];
        pen.beginPath();
        pen.endPath();
        
        // testing for a 'smart' thing endPath does, if there
        // is only one point it has to be a 'move', so it transforms
        // our 'curve' into a move
        var expecting = [
            ['moveTo', [1, 1] ],
            ['endPath']
        ];
        pen.beginPath();
        pen.addPoint([1, 1], 'fancy', true);
        pen.endPath();
        doh.assertEqual(expecting, testPen.flush());
        
        //an open countour
        var expecting = [
            ['moveTo', [1, 1] ],
            ['curveTo',  [2, 2], [3, 3], [4, 4] ],
            ['endPath']
        ];
        pen.beginPath();
        pen.addPoint([1, 1], 'move');
        pen.addPoint([2, 2]);
        pen.addPoint([3, 3]);
        pen.addPoint([4, 4], 'curve', true);
        pen.endPath();
        doh.assertEqual(expecting, testPen.flush());
        
        // the pen will rotate the point list so that it ends with the
        // first on curve point of the point list,
        // then the flushContour will prepend a moveTo to the last point
        // and because it did not start with a moveTo, it appends a
        // closPath making this a closed path
        var expecting = [
            ['moveTo', [7, 7]],
            ['curveTo', [1, 1], [2, 2], [3, 3] ],
            ['lineTo', [4, 4] ],
            ['curveTo', [5, 5], [6, 6], [7, 7] ],
            ['closePath']
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
        doh.assertEqual(expecting, testPen.flush());
        
        //the quadratic curves special case without on curve points
        var expecting = [
            ['qCurveTo', [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], null ],
            ['closePath']
        ];
        pen.beginPath();
        pen.addPoint([1, 1]);
        pen.addPoint([2, 2]);
        pen.addPoint([3, 3]);
        pen.addPoint([4, 4]);
        pen.addPoint([5, 5]);
        pen.endPath();
        doh.assertEqual(expecting, testPen.flush());
    },
    function Test_PointToSegmentPen_outputImpliedClosingLine() {
        var testPen = new TestPen(),
        pen = new PointToSegmentPen(testPen, true);
        //an open countour
        var expecting = [
            ['moveTo', [1, 1] ],
            ['curveTo',  [2, 2], [3, 3], [4, 4] ],
            ['lineTo', [5, 5] ],
            ['endPath']
        ];
        pen.beginPath();
        pen.addPoint([1, 1], 'move');
        pen.addPoint([2, 2]);
        pen.addPoint([3, 3]);
        pen.addPoint([4, 4], 'curve', true);
        pen.addPoint([5, 5], 'line');
        pen.endPath();
        doh.assertEqual(expecting, testPen.flush());
        
        //a closed countour
        var expecting = [
            ['moveTo', [4, 4] ],
            ['curveTo',  [1, 1], [2, 2], [3, 3] ],
            ['lineTo', [4, 4] ],
            ['closePath']
        ];
        pen.beginPath();
        pen.addPoint([4, 4], 'line');
        pen.addPoint([1, 1]);
        pen.addPoint([2, 2]);
        pen.addPoint([3, 3], 'curve', true);
        pen.endPath();
        doh.assertEqual(expecting, testPen.flush());
        //the same closed contour but without lineTo this time
        //note that in this case the moveTo still is at [4, 4]
        //so the information is preserved in a way
         var expecting = [
            ['moveTo', [4, 4] ],
            ['curveTo',  [1, 1], [2, 2], [3, 3] ],
            ['closePath']
        ];
        var testPen = new TestPen(),
        pen = new PointToSegmentPen(testPen, false);
        pen.beginPath();
        pen.addPoint([4, 4], 'line');
        pen.addPoint([1, 1]);
        pen.addPoint([2, 2]);
        pen.addPoint([3, 3], 'curve', true);
        pen.endPath();
        doh.assertEqual(expecting, testPen.flush());
    }
    ]);
});
