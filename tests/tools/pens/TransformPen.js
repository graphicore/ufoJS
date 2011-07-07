define(
    ['graphicore/errors', 'graphicore/tools/pens/TestPen', 'graphicore/tools/pens/TransformPen'],
    function(errors, TestPen, TransformPen)
{
    doh.register("graphicore.pens.TransformPen", [
    function Test_WithTestPen(){
        /*just to get started*/
        var testPen = new TestPen(null),
            pen = new TransformPen(testPen, [2, 0, 0.5, 2, -10, 0]),
            expecting, result;
        
        expecting = [['_moveTo', [-10, 0]]]
        pen.moveTo([0, 0]);
        doh.assertEqual(expecting, testPen.flush());
        
        expecting = [['_lineTo', [40.0, 200]]];
        pen.lineTo([0, 100]);
        doh.assertEqual(expecting, testPen.flush());
        
        expecting = [
            ['_curveToOne', [127.5, 150], [131.25, 125.0], [125.0, 100.0]],
            ['_curveToOne', [118.75, 75.0], [102.5, 50], [-10.0, 0]]
        ];
        pen.curveTo([50, 75], [60, 50], [50, 25], [0, 0]);
        doh.assertEqual(expecting, testPen.flush());
        
        //moar!
        //try pen.qCurveTo([50, 75], [60, 50], [50, 25], [0, 0]);
        //fails in python => investiagte
        
        
        expecting = [['_closePath']];
        pen.closePath();
        doh.assertEqual(expecting, testPen.flush());
    }
    ]);
});
