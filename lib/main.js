define(['graphicore/errors'], function(errors) {
   var ValueError = errors.Value,
       TypeError = errors.Type;
   
    /**
     * graphicore enhance helps with class building
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
   
   
    /**
     * check wheather val is an integer
     */
    function isInt(val) {
        if( typeof val != 'number' ) return false;
        if(isNaN(val)) return false;
        return val === Math.round(val);
    }
   
   
   /**
    * this is used like the python range method
    * 
    * examples:
    * for(var i in range(10)){
    *     console.log(i)
    *     //0 1 2 3 4 5 6 7 8 9
    * }
    * for(var i in range(10)){
    *     console.log(i)
    *     //0 1 2 3 4 5 6 7 8 9
    * }
    * for(var i in range(5, 15, 3)) {
    *     console.log(i)
    *     //5 8 11 14
    * }
    **/
    var range = function (/*[start], stop, [step]*/)
    {
        //here comes alot of input validation
        //to mimic what python does
        var start = 0,
            step = 1,
            stop, condition;
        if (arguments.length < 1) {
            throw new TypeError(
                'range() expected at least 1 arguments, got 0 '
                + arguments.length
            );
        } else if (arguments.length > 3) {
            throw new TypeError(
                'range() expected at most 3 arguments, got '
                + arguments.length
            );
        } else if (arguments.length == 1) {
            stop = arguments[0];
        } else if(arguments.length >= 2 ) {
            start = arguments[0];
            stop = arguments[1];
            if(arguments.length == 3)
                step = arguments[2];
        }
        var vals = [ ['start', start], ['stop', stop], ['step', step] ];
        for (var i in vals) {
            var val = vals[i];
            if (!isInt(val[1])) {
                var type = typeof val[1];
                if(type === 'number') type = 'float';
                throw new TypeError(
                    'range() integer ' + val[0]
                    + ' argument expected, got ' + type);
            }
        }
        if(step === 0)
            throw new ValueError('range() step argument must not be zero');
            
        //now the important stuff
        if (step > 0)
            condition = function(i) { return i < stop };
        else
            condition = function(i) { return i > stop };
        
        var list = [];
        for (var i = start; condition(i); i += step) {
            //yield i;//oh future looking forward to hearing from you
            list[i] = i;
        }
        return list;
    }
    
    return {
        enhance: enhance,
        range: range,
    }
});
