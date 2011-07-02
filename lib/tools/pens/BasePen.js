define(
    ['graphicore', './AbstractPen'],
    function(graphicore, AbstractPen)
{
    var enhance = graphicore.enhance;
    /*constructor*/
    var BasePen = function(){};

    /*inheritance*/
    BasePen.prototype = new AbstractPen;

    /*definition*/
    enhance(BasePen, {

    });

    return BasePen;
});
