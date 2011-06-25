define(function() {
    /**
     * graphicore enhance helps with class buildingS
     * FIXME: put description in here
     */
    var enhance =  function(constructor, blueprint)
    {
        for(var i in blueprint)
        {
            var getter = blueprint.__lookupGetter__(i),
                setter = blueprint.__lookupSetter__(i);
            if ( getter || setter ) {
                if ( getter )
                    constructor.prototype.__defineGetter__(i, getter);
                if ( setter )
                    constructor.prototype.__defineSetter__(i, setter);
            } else
                constructor.prototype[i] = blueprint[i];
        };
    };
    return enhance;
});
