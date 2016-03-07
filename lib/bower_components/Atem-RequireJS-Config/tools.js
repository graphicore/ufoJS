define([], function(){
    "use strict";

    function copyItems(from, to) {
        var keys = Object.keys(from)
          , i, l, k
          ;
        for(i=0,l=keys.length;i<l;i++) {
            k = keys[i];
            to[k] = from[k];
        }
    }


    /**
     * This is no deep cloning, but it clones so deep that the "bowerPrefix"
     * string manipulation doesn't change the "defaults"  object, and that
     * a efault "excludeShallow" array is not extended by its counterpart
     * in setup.
     */
    function copySetup(from, to, skip) {
        var k;
        for(k in from) {
            if( skip && k in skip )
                continue;

            if(from[k] instanceof Array && to[k] instanceof Array)
                // append to "to"
                Array.prototype.push.apply(to[k], from[k]);
            else if(typeof from[k] === 'object' && typeof to[k] === 'object')
                copyItems(from[k], to[k]);
            else if(from[k] instanceof Array)
                to[k] = from[k].slice();
            else if(typeof from[k] === 'object') {
                to[k] = {};
                copyItems(from[k], to[k]);
            }
            else
                to[k] = from[k];
        }
    }

    function configure(defaults, setup, require) {
        var result = {}, k;
        copySetup(defaults, result);
        copySetup(setup, result, {'bowerPrefix': 1});

        if('bowerPrefix' in setup && 'paths' in result)
            for(k in result.paths)
                result.paths[k] = result.paths[k]
                                    .replace(/%bower%/g, setup.bowerPrefix);
        require.config(result);
    }
    return {
        configure: configure
      , copyItems: copyItems
      , copySetup: copySetup
    };
});
