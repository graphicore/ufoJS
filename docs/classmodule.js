//copypasta to get a new module started
define(
    ['graphicore/enhance', './AbstractThing'],
    function(enhance, AbstractThing)
{
    
    /*constructor*/
    var Thing = function(){};

    /*inheritance*/
    Thing.prototype = new AbstractThing;

    /*definition*/
    enhance(Thing, {

    });

    return Thing;
});
