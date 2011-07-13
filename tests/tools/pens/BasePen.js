define(
    [
        'graphicore/errors',
        'graphicore/tools/pens/BasePen',
        'graphicore/tools/pens/testPens'
    ],
    function(errors, BasePen, testPens)
{
    /*shortcuts*/
    var TestPen = testPens.BaseTestPen;
    
    doh.register("graphicore.pens.BasePen", [
    function Test_BasePen_Errors(){
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
    }
    ]);
});
