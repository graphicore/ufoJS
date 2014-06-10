define(
    ['ufojs/main', 'ufojs/errors', 'ufojs/tools/misc/transform'],
    function(main, errors, transform)
{
    var round = main.round,
        Transform = transform.Transform,
        Scale = transform.Scale,
        Offset = transform.Offset,
        Identity = transform.Identity;
    
    doh.register("ufojs.tools.misc.transform", [
    function Test_Transform_transformPoint() {
    /**
     * the values of the expectations are from the docstrings of the python
     * source and checked against the python console output.
     **/
        var t = new Transform([2, 0, 0, 3, 0, 0]);
        var expecting = [200, 300];
        doh.assertEqual(expecting, t.transformPoint([100, 100]));
        
        var t = Scale(2, 3);
        var expecting = [200, 300];
        doh.assertEqual(expecting, t.transformPoint([100, 100]));
        var expecting = [0, 0];
        doh.assertEqual(expecting, t.transformPoint([0, 0]));
        
        var t = Offset(2, 3);
        var expecting = [102, 103];
        doh.assertEqual(expecting, t.transformPoint([100, 100]));
        var expecting = [2, 3];
        doh.assertEqual(expecting, t.transformPoint([0, 0]));
        
        var t2 = t.scale(0.5);
        var expecting = [52.0, 53.0];
        doh.assertEqual(expecting, t2.transformPoint([100, 100]));
        
        var t3 = t2.rotate(Math.PI / 2);
        var expecting = [2.0, 3.0];
        doh.assertEqual(expecting, t3.transformPoint([0, 0]));
        var expecting = [-48.0, 53.0];
        doh.assertEqual(expecting, t3.transformPoint([100, 100]));
    },
    function Test_Transform_transformPoints() {
        /**
         * when this fails there might be some floating point rounding issue
         * lets see if someone complains
         * */
        var t = Identity.scale(0.5).translate(100, 200).skew(0.1, 0.2);
        var expecting = [
            [50.0, 100.0],
            [50.550167336042726, 100.60135501775433],
            [105.01673360427253, 160.13550177543362],
        ];
        doh.assertEqual(expecting, t.transformPoints([ [0, 0], [1, 1], [100, 100] ]));
        
        var t = Scale(2, 3)
        var expecting = [[0, 0], [0, 300], [200, 300], [200, 0]];
        doh.assertEqual(expecting, t.transformPoints([[0, 0], [0, 100], [100, 100], [100, 0]]));
    },
    function Test_Transform_translate() {
        var t = new Transform();
        doh.assertTrue(t === t);
        var t2 = t.translate(20, 30);
        var expecting = '<Transform [1 0 0 1 20 30]>';
        doh.assertEqual(expecting, t2.valueOf());
        //is another value and another object
        doh.assertFalse(t.cmp(t2));
        doh.assertFalse(t === t2);
        
        var t3 = t.translate();
        //is another object but the same value
        doh.assertTrue(t.cmp(t3));
        doh.assertFalse(t === t3);
    },
    function Test_Transform_scale() {
        var t = new Transform();
        var expecting = '<Transform [5 0 0 5 0 0]>';
        var t2 = t.scale(5);
        doh.assertEqual(expecting, t2.valueOf());
        doh.assertFalse(t === t2);
        
        var expecting = '<Transform [5 0 0 6 0 0]>';
        var t3 = t.scale(5, 6);
        doh.assertEqual(expecting, t3.valueOf());
        doh.assertFalse(t === t3);
    },
    function Test_Transform_rotate() {
        var t = new Transform();
        var expecting = '<Transform [0 1 -1 0 0 0]>';
        var t2 = t.rotate(Math.PI / 2);
        doh.assertEqual(expecting, t2.valueOf());
        doh.assertFalse(t === t2);
        
        var expecting = '<Transform [-1 0 0 -1 0 0]>';
        doh.assertEqual(expecting, t.rotate(Math.PI).valueOf());
        
        var expecting = '<Transform [1 0 0 1 0 0]>';
        doh.assertEqual(expecting, t.rotate(Math.PI * 2).valueOf());
        
        var t = t.scale(9, 5);
        var expecting = '<Transform [0 5 -9 0 0 0]>';
        doh.assertEqual(expecting, t.rotate(Math.PI / 2).valueOf());
    },
    function Test_Transform_skew() {
        var t = new Transform();
        var expecting = new Transform([1, 0, 1, 1, 0, 0]);
        //here I had a floating point rounding error
        var circa = t.skew(Math.PI / 4).slice().map(function(val){
            return round(val, 1000);
        });
        doh.assertTrue(expecting.cmp(circa));
    },
    function Test_Transform_transform() {
        var t = new Transform([2, 0, 0, 3, 1, 6]);
        var expecting = '<Transform [8 9 4 3 11 24]>';
        doh.assertEqual(expecting, t.transform([4, 3, 2, 1, 5, 6]).valueOf());
    },
    function Test_Transform_reverseTransform() {
        var t = new Transform([2, 0, 0, 3, 1, 6]);
        var expecting = '<Transform [8 6 6 3 21 15]>';
        doh.assertEqual(expecting, t.reverseTransform([4, 3, 2, 1, 5, 6]).valueOf());
        
        var t = new Transform([4, 3, 2, 1, 5, 6]);
        doh.assertEqual(expecting, t.transform([2, 0, 0, 3, 1, 6]).valueOf());
    },
    function Test_Transform_inverse() {
        var t = Identity.translate(2, 3).scale(4, 5);
        var expecting = [42, 103];
        doh.assertEqual(expecting, t.transformPoint([10, 20]));
        var expecting = [10.0, 20.0];
        var it = t.inverse();
        doh.assertEqual(expecting, it.transformPoint([42, 103]));
    },
    function Test_Transform_Identity() {
        doh.assertTrue(Identity instanceof Transform);
        doh.assertTrue(Identity.cmp(new Transform([1, 0, 0, 1, 0, 0])));
    },
    function Test_Transform_Offset() {
        var t = Offset(2, 3);
        var expecting = '<Transform [1 0 0 1 2 3]>';
        doh.assertEqual(expecting, t.valueOf());
        var t2 = Identity.translate(2, 3);
        doh.assertTrue(t2.cmp(t));
    },
    function Test_Transform_Scale() {
        var t = Scale(2, 3);
        var expecting = '<Transform [2 0 0 3 0 0]>';
        doh.assertEqual(expecting, t.valueOf());
        var t2 = Identity.scale(2, 3);
        doh.assertTrue(t2.cmp(t));
    },
    ]);
})
