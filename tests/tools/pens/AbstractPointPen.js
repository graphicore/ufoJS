define(
    ['doh', 'ufojs/errors', 'Atem-Pen-Case/pens/AbstractPointPen'],
    function(doh, errors, AbstractPointPen)
{
    doh.register("ufojs.pens.AbstractPointPen", [
    function Test_AbstractPointPen_Errors() {
        var pen = new AbstractPointPen;
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
