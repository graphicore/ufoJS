define(
    ['ufojs/errors', 'ufojs/tools/pens/main'],
    function(errors, pens)
{
    doh.register("ufojs.pens.main", [
    function Test_decomposeSuperBezierSegment_Errors() {
        doh.assertError(
            TypeError,
            pens, 'decomposeSuperBezierSegment',
            [],
            'needs a list as points argument'
        );
        doh.assertError(
            errors.Assertion,
            pens, 'decomposeSuperBezierSegment',
            [[[1,1]]],
            'needs at least 3 elements'
        );
        doh.assertError(
            errors.Assertion,
            pens, 'decomposeSuperBezierSegment',
            [[[1,1], [1,1]]],
            'needs at least 3 elements'
        );
    },
    /**
     * the expectations here are checked against the python implementation
     * fonttools.pens.baspen.decomposeSuperBezierSegment
     */
    function Test_decomposeSuperBezierSegment() {
        //a 3 point super bezier equals a cubic bezier
        var points = [ [1, 2], [3, 4], [5, 6] ];
        var result = [ points ];
        doh.assertEqual(result, pens.decomposeSuperBezierSegment(points));
        
        var points = [ [1, 2], [3, 4], [5, 6], [7, 8] ];
        var expecting = [
            [
                [1, 2],
                [2, 3],
                [3, 4]
            ],
            [
                [4, 5],
                [5, 6],
                [7, 8]
            ]
        ];
        doh.assertEqual(expecting, pens.decomposeSuperBezierSegment(points));
        
        var points = [ [1, 2], [3, 4], [5, 6], [7, 8], [9, 10] ];
        var expecting = [
            [
                [1, 2],
                [2, 3],
                [2.833333333333333, 3.8333333333333335]
            ],
            [
                [3.6666666666666665, 4.666666666666667],
                [4.333333333333333, 5.333333333333333],
                [5.166666666666666, 6.166666666666666]
            ],
            [   
                [6, 7],
                [7, 8],
                [9, 10]
            ]
        ];
        doh.assertEqual(expecting, pens.decomposeSuperBezierSegment(points));
        
        var points = [ [1, 1], [2, 2], [3, 3], [4, 4], [5, 5] ];
        var expecting = [
            [
                [1, 1],
                [1.5, 1.5],
                [1.9166666666666667, 1.9166666666666667]
            ],
            [
                [2.3333333333333335, 2.3333333333333335],
                [2.6666666666666665, 2.6666666666666665],
                [3.083333333333333, 3.083333333333333]
            ],
            [
                [3.5, 3.5],
                [4, 4],
                [5, 5]
            ]
        ];
        doh.assertEqual(expecting, pens.decomposeSuperBezierSegment(points));
    },
    function Test_decomposeQuadraticSegment_Errors() {
        doh.assertError(
            TypeError,
            pens, 'decomposeQuadraticSegment',
            [],
            'needs a list as points argument'
        );
        doh.assertError(
            errors.Assertion,
            pens, 'decomposeQuadraticSegment',
            [ [ [1,1] ] ],
            'needs at least 2 elements'
        );
    },
    /**
     * the expectations here are checked against the python implementation
     * fonttools.pens.baspen.decomposeQuadraticSegment
     */
    function Test_decomposeQuadraticSegment() {
        var points = [ [1, 2], [3, 4] ];
        var expecting = [ points ];
        doh.assertEqual(expecting, pens.decomposeQuadraticSegment(points));
        
        var points = [ [1, 2], [3, 4], [5, 6] ];
        var expecting = [
            [
                [1, 2],
                [2, 3]
            ],
            [
                [3, 4],
                [5, 6]
            ]
        ];
        doh.assertEqual(expecting, pens.decomposeQuadraticSegment(points));
        
        var points = [ [1, 2], [3, 4], [5, 6], [7, 8] ];
        var expecting = [
            [
                [1, 2],
                [2, 3]
            ],
            [
                [3, 4],
                [4, 5]
            ],
            [
                [5, 6],
                [7, 8]
            ]
        ];
        doh.assertEqual(expecting, pens.decomposeQuadraticSegment(points));
        
        var points = [ [1, 2], [3, 4], [5, 6], [7, 8], [9, 10] ];
        var expecting = [
            [
                [1, 2],
                [2, 3]
            ],
            [   
                [3, 4],
                [4, 5]
            ],
            [
                [5, 6],
                [6, 7]
            ],
            [
                [7, 8],
                [9, 10]
            ]
        ];
        doh.assertEqual(expecting, pens.decomposeQuadraticSegment(points));
        
        var points = [ [1, 1], [2, 2], [3, 3], [4, 4], [5, 5] ];
        var expecting = [
            [
                [1, 1],
                [1.5, 1.5]
            ],
            [
                [2, 2],
                [2.5, 2.5]
            ],
            [
                [3, 3],
                [3.5, 3.5]
            ],
            [
                [4, 4],
                [5, 5]
            ]
        ];
        doh.assertEqual(expecting, pens.decomposeQuadraticSegment(points));
    }
    ]);
});
