define(
    ['graphicore/errors', 'graphicore/tools/pens/AbstractPointPen'],
    function(errors, AbstractPointPen)
{
    doh.register("graphicore.pens.AbstractPointPen", [
    function Test_AbstractPointPen_Errors() {
        pen = new AbstractPointPen;
        doh.assertError(
            errors.NotImplemented,
            pen, 'beginPath'
        );
        doh.assertError(
            errors.NotImplemented,
            pen, 'endPath'
        );
        doh.assertError(
            errors.NotImplemented,
            pen, 'addPoint'
        );
        
        doh.assertError(
            errors.NotImplemented,
            pen, 'addComponent'
        );
    }
    ]);
});
