define(
    ['graphicore/errors', 'graphicore/tools/pens/AbstractPen'],
    function(errors, AbstractPen)
{
    doh.register("graphicore.pens.AbstractPen", [
    function Test_Errors(){
        pen = new AbstractPen;
        doh.assertError(
            errors.NotImplemented,
            pen, 'moveTo'
        );
        doh.assertError(
            errors.NotImplemented,
            pen, 'lineTo'
        );
        doh.assertError(
            errors.NotImplemented,
            pen, 'curveTo'
        );
        
        //these methods just do nothing:
        //pen.closePath
        //pen.endPath
        
        doh.assertError(
            errors.NotImplemented,
            pen, 'addComponent'
        );
    }
    ]);
});
