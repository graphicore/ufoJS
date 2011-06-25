define(
    ['graphicore/enhance', './AbstractPen'],
    function(enhance, AbstractPen)
{
    
    /*constructor*/
    var BasePen = function(){};

    /*inheritance*/
    BasePen.prototype = new AbstractPen;

    /*definition*/
    enhance(BasePen, {

    });

    return BasePen;
});
