define([
    'Atem-Errors/errors'
], function(
    errors
) {
    "use strict";

    var KeyError = errors.Key;

    /**
     * check whether val is an integer
     */
    function isInt (n) {
        // n === n NaN will return false
        // n|0 rounds
        return typeof n === 'number' && n === n && n === (n|0);
    }

    /**
     * check whether the string is formatted like a propper int
     */
    var _isIntStringTest = /^[+-]?[0-9]+$/;
    function isIntString(str){
        if( typeof str != 'string') return false;
        return _isIntStringTest.test(str);
    }

    function _validate(whitelist, target, key) {
        if(!whitelist)
            return [false, 'Key "' +  key + '" is not whitelisted because the '
                                                + 'whitelist is missing.'];
        if(typeof key !== 'string')
            return [false, 'name must be string but it is: '+ typeof key];

        if(!whitelist.hasOwnProperty(key))
            return [false ,'Name "'+ key +'" is not whitelisted '
                            + 'for item "'+ target +'" '
                            + Object.keys(whitelist).join(', ')];
        return [true, whitelist[key]];
    }

    function has(whitelist, target, name) {
        return _validate(whitelist, target, name)[0];
    }

    function get (whitelist, target, name) {
        var result = _validate(whitelist, target, name);
        if(!result[0])
            throw new KeyError(result[1]);

        return target[result[1]];
    }

    function hasMethod (name) {
        /* jshint validthis: true */
        return has(this._cps_whitelist, this, name);
    }

    function getMethod (name) {
        /* jshint validthis: true */
        return get(this._cps_whitelist, this, name);
    }

    function _validateArray(target, key) {
        var processedKey;
        if(key === 'length')
            return [true, key];

        if(isIntString(key))
            key = parseInt(key, 10);

        if(!isInt(key))
            return [false, 'Key must be "length" or an integer but it is: '
                                            + key + ' '+ typeof key];
        else if(key<0)
            processedKey = target.length + key;
        else
            processedKey = key;

        if(processedKey<0 || processedKey>=target.length)
             throw new KeyError('The index "'+ key +'" is not in the array. '
                                        + 'Length: ' + target.length);
        return [true, processedKey];
    }

    function arrayHas (target, key) {
        return _validateArray(target, key)[0];
    }

    function arrayGet (target, key) {
        var result = _validateArray(target, key);
        if(!result[0])
            throw new KeyError(result[1]);

        return target[result[1]];
    }


    return {
        has: has
      , get: get
      , hasMethod: hasMethod
      , getMethod: getMethod
      , arrayHas: arrayHas
      , arrayGet: arrayGet
    };
});
