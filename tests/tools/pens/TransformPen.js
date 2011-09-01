define(
    [
        'ufojs/errors',
        'ufojs/tools/pens/testPens',
        'ufojs/tools/pens/AbstractPen',
        'ufojs/tools/pens/TransformPen',
        'ufojs/tools/misc/transform'
    ],
    function(errors, TestPens, AbstractPen, TransformPen, transform)
{
    /*shortcuts*/
    var TestPen = TestPens.AbstractTestPen,
        Transform = transform.Transform;
    
    doh.register("ufojs.pens.TransformPen", [
    function Test_TransformPen_inheritance() {
        
        var testPen = new TestPen(null),
            testTransformation = [0, 0, 1, 0, 0, 1],
            pen = new TransformPen(testPen, testTransformation);
        
        doh.assertTrue(pen instanceof AbstractPen);
        doh.assertTrue(testPen instanceof AbstractPen);
    },
    function Test_TransformPen(){
        /*
         * just to get started
         * all the transformation foo is tested with the tools.misc.transform
         * module tests, so this is just to proove that the Transform pen
         * behaves like it should
         * */
        var testPen = new TestPen(null),
            testTransformation = [2, 0, 0.5, 2, -10, 0],
            pen = new TransformPen(testPen, testTransformation),
            expecting, result;
        
        expecting = [ ['moveTo', [-10, 0]] ]
        pen.moveTo([0, 0]);
        doh.assertEqual(expecting, testPen.flush());
        
        expecting = [ ['lineTo', [40.0, 200]] ];
        pen.lineTo([0, 100]);
        doh.assertEqual(expecting, testPen.flush());
        
        expecting = [
            ['curveTo', [127.5, 150], [135.0, 100], [102.5, 50], [-10.0, 0]]
        ];
        pen.curveTo([50, 75], [60, 50], [50, 25], [0, 0]);
        doh.assertEqual(expecting, testPen.flush());
        
        
        pen.qCurveTo([50, 75], [60, 50], [50, 25], [0, 0]);
        expecting = [
            ['qCurveTo', [127.5, 150], [135.0, 100], [102.5, 50], [-10.0, 0]]
        ];
        //seems to fail in python => investigate
        doh.assertEqual(expecting, testPen.flush());
        
        pen.qCurveTo([50, 75], [60, 50], null);
        expecting = [
            ['qCurveTo', [127.5, 150], [135.0, 100], null],
        ];
        doh.assertEqual(expecting, testPen.flush());
        
        pen.closePath();
        expecting = [ ['closePath'] ];
        doh.assertEqual(expecting, testPen.flush());
        
        // its not possible to test the returned transformation matrix
        // within the assertEquals call, so we test that first.
        // we don't really transform ther matrix with the identity
        // transformation
        pen.addComponent('myComponent', transform.Identity);
        expecting = [
            ['addComponent', 'myComponent'],
        ];
        var result = testPen.flush();
        //result[2] is expected to be a misc.transform.Transform Object
        doh.assertTrue(result[0][2] instanceof Transform);
        //the Transform object has a cmp method to compare values against it
        doh.assertTrue(result[0][2].cmp(testTransformation));
        //now lets just see if the rest is good
        delete(result[0][2]);
        doh.assertEqual(expecting, result);
    }
    ]);
});
