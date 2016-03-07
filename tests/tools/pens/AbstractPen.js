define(
    ['doh', 'ufojs/errors', 'Atem-Pen-Case/pens/AbstractPen'],
    function(doh, errors, AbstractPen)
{
    doh.register("ufojs.pens.AbstractPen", [
    function Test_AbstractPen_Errors(){
        var pen = new AbstractPen;
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
