define(
    [
        'ufojs',
        'ufojs/errors',
        'ufojs/tools/misc/transform',
        'ufojs/tools/pens/AbstractPen',
        'ufojs/tools/pens/BasePen',
        'ufojs/tools/pens/testPens'
    ],
    function(ufojs, errors, transform, AbstractPen, BasePen, testPens)
{
    /*shortcuts*/
    var TestPen = testPens.BaseTestPen,
    /**
     * a little helper to round the results of the testpen. This is good
     * to overcome floating point rounding errors and still make meaningfull
     * tests
     */
        roundRecursive = ufojs.roundRecursive;
    
    doh.register("ufojs.pens.BasePen", [
    function Test_BasePen_inheritance() {
        var pen = new BasePen();
        doh.assertTrue(pen instanceof AbstractPen);
        
        var pen = new TestPen([]);
        doh.assertTrue(pen instanceof AbstractPen);
        doh.assertTrue(pen instanceof BasePen);
        
    },
    function Test_BasePen_Errors() {
        var pen = new BasePen();
        
        doh.assertError(
            errors.NotImplemented,
            pen, 'moveTo',
            [[1, 1]],
            '_moveTo is not implemented'
        );
        
        doh.assertError(
            errors.NotImplemented,
            pen, 'lineTo',
            [[1, 1]],
            '_lineTo is not implemented'
        );
        
        doh.assertError(
            errors.Assertion,
            pen, 'curveTo'
        );
        
        doh.assertError(
            errors.NotImplemented,
            pen, 'curveTo',
            [[1,1]],
            '_lineto is not implemented'
        );
        
        doh.assertError(
            TypeError,
            pen, 'curveTo',
            [[1, 1], [1, 1]],
            '_qCurveToOne is called and wants to access __curentPoint as a List'
        );
        
        doh.assertError(
            TypeError,
            pen, 'qCurveTo',
            [[1, 1], [1, 1]],
            '_qCurveToOne is called and wants to access __curentPoint as a List'
        );
        
        //faking this in
        pen.__currentPoint = [1, 1];
        
        doh.assertError(
            errors.NotImplemented,
            pen, 'curveTo',
            [[1, 1], [1, 1]],
            '_curveToOne is not implemented'
        );
        doh.assertError(
            errors.NotImplemented,
            pen, 'curveTo',
            [[1, 1], [1, 1], [1, 1]],
            '_curveToOne is not implemented'
        );
        
        doh.assertError(
            errors.NotImplemented,
            pen, 'curveTo',
            [[1, 1], [1, 1], [1, 1], [1, 1]],
            '_curveToOne is not implemented'
        );
        
        doh.assertError(
            errors.Assertion,
            pen, 'qCurveTo'
        );
        
        doh.assertError(
            errors.NotImplemented,
            pen, 'qCurveTo',
            [[1, 1]],
            '_lineTo is not implemented'
        );
        
        doh.assertError(
            errors.NotImplemented,
            pen, 'qCurveTo',
            [[1, 1], [1, 1]],
            '_curveToOne is not implemented'
        );
        
        doh.assertError(
            errors.NotImplemented,
            pen, 'qCurveTo',
            [[1, 1], null],
            '_moveTo is not implemented'
        );
        
        doh.assertError(
            TypeError,
            pen, 'addComponent'
            ['test'],
            'there is no glyphset'
        );
    },
    function Test_BasePen_closePath() {
        var pen = new TestPen();
        
        var expected = ['_closePath'];
        pen.closePath();
        doh.assertEqual(expected, pen.flush());
    },
    function Test_BasePen_endPath() {
        var pen = new TestPen([]);
        
        var expected = ['_endPath'];
        pen.endPath();
        doh.assertEqual(expected, pen.flush());
    },
    function Test_BasePen_lineTo() {
        var pen = new TestPen();
        
        var expected = [ ['_lineTo', [1, 2] ] ];
        pen.lineTo( [1, 2] );
        doh.assertEqual(expected, pen.flush());
    },
    function Test_BasePen_moveTo() {
        var pen = new TestPen();
        
        var expected = [ ['_moveTo', [1, 2] ] ];
        pen.moveTo( [1, 2] );
        doh.assertEqual(expected, pen.flush());
    },
    function Test_BasePen_curveTo() {
        var pen = new TestPen();
        
        var expected = [ ['_curveToOne', [1, 1], [1, 1], [1, 1] ] ];
        pen.curveTo( [1, 1], [1, 1], [1, 1] );
        doh.assertEqual(expected, pen.flush());
    
        var expected = [ ['_curveToOne', [1, 2], [3, 4], [5, 6] ] ];
        pen.curveTo( [1, 2], [3, 4], [5, 6] );
        doh.assertEqual(expected, pen.flush());
        
        var expected = [
            [
                '_curveToOne',
                [1, 2],
                [2, 3],
                [3, 4]
            ],
            [
                '_curveToOne',
                [4, 5],
                [5, 6],
                [7, 8]
            ]
        ];
        pen.curveTo( [1, 2], [3, 4], [5, 6], [7, 8] );
        doh.assertEqual(expected, pen.flush());
    
        var expected = [
            ['_lineTo', [0, 0] ],
            ['_curveToOne', [2, 2], [2, 2], [0, 0] ]
        ];
        pen.lineTo([0, 0]);
        pen.curveTo( [3, 3], [0, 0] );
        doh.assertEqual(expected, pen.flush());
    
        var expected = [
            ['_curveToOne', [2, 2], [5, 5], [9, 9] ]
        ];
        pen.curveTo( [3, 3], [9, 9] );
        doh.assertEqual(expected, pen.flush());
        
        var expected = [
            ['_lineTo', [123, 123] ]
        ];
        pen.curveTo( [123, 123] );
        doh.assertEqual(expected, pen.flush());
    },
    function Test_BasePen_qCurveTo() {
        var pen = new TestPen();
        
        var expected = [
            ['_moveTo', [1, 1] ],
            ['_curveToOne', [1, 1], [1, 1], [1, 1]]
        ];
        pen.qCurveTo( [1, 1], null );
        doh.assertEqual(expected, pen.flush());
        
        // >>> tp = fontTools.pens.basePen._TestPen([])
        // >>> tp.qCurveTo( [35, 35], [70, 70], None )
        // 52.5 52.5 moveto
        // 40.8333333333 40.8333333333 40.8333333333 40.8333333333 52.5 52.5 curveto
        // 64.1666666667 64.1666666667 64.1666666667 64.1666666667 52.5 52.5 curveto        
        var expected = [
            ['_moveTo', [52.5, 52.5] ],
            ['_curveToOne', [40.8333333,40.8333333], [40.8333333, 40.8333333], [52.5, 52.5]],
            ['_curveToOne', [64.1666667, 64.1666667], [64.1666667, 64.1666667], [52.5, 52.5]]
        ];
        
        pen.qCurveTo( [35, 35], [70, 70], null );
        var result = roundRecursive(pen.flush(), 10000000);
        doh.assertEqual(expected, result);
        
        var expected = [
            [ '_moveTo', [0, 0] ],
            ['_curveToOne', [23.3333333,23.3333333], [46.6666667, 46.6666667], [70, 70] ]
        ];
        pen.moveTo( [0, 0] );
        pen.qCurveTo( [35, 35], [70, 70] );
        var result = roundRecursive(pen.flush(), 10000000);
        doh.assertEqual(expected, result);    
        
        var expected = [
            ['_lineTo', [1, 1] ]
        ];
        pen.qCurveTo( [1, 1] );
        doh.assertEqual(expected, pen.flush());
    },
    function Test_BasePen_addComponent() {
        // There's currently no glyphset object and no glyph  object with
        // a draw method so here are some fakes for that stuff 
        var testGlyph = {
            draw: function(obtainSwitch, pen)
            {
                // the draw function has a obtainJS api, but we currently
                // support only the synchronous call.
                // this fixes that claim as a test.
                doh.assertFalse(obtainSwitch);
                doh.assertTrue(false === obtainSwitch);
                
                pen.moveTo([1, 1]);
                pen.lineTo([2, 2]);
                pen.curveTo([3, 3], [4, 4], [5, 5]);
                pen.closePath();
            }
        },
            pen = new TestPen({'testglyph': testGlyph});
        
        doh.assertError(
            TypeError,
            pen, 'addComponent',
            ['testglyph'],
            'transformation is undefined'
        );
        
        var expected = [
            ['_moveTo', [1, 1] ],
            ['_lineTo', [2, 2] ],
            ['_curveToOne', [3, 3], [4, 4], [5, 5] ],
            ['_closePath']
        ];
        pen.addComponent('testglyph', transform.Identity);
        doh.assertEqual(expected, pen.flush());
        
        var expected = [
            ['_moveTo', [-1, 1] ],
            ['_lineTo', [-2, 2] ],
            ['_curveToOne', [-3, 3], [-4, 4], [-5, 5] ],
            ['_closePath']
        ];
        pen.addComponent('testglyph', transform.Identity.rotate(Math.PI / 2));
        doh.assertEqual(expected, pen.flush());
        
        var expected = [];
        pen.addComponent('not_existing');
        doh.assertEqual(expected, pen.flush());
        
        var expected = [];
        pen.addComponent('not_existing', transform.Identity);
        doh.assertEqual(expected, pen.flush());
    }
    ]);
});
