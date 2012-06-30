/**
 * Copyright (c) 2011, Lasse Fister lasse@graphicore.de, http://graphicore.de
 * 
 * You should have received a copy of the MIT License along with this program.
 * If not, see http://www.opensource.org/licenses/mit-license.php
 * 
 */
 
define(function() {
    //ufojs errors
    var errors = {}
    
    /**
     * safe three lines of coding for each error with this factory
     * 
     * and observe that extending Error is uncool
     */
    var makeError = function(name, constructor, prototype, namespace)
    {
        if(prototype === undefined)
            var prototype = new Error;
        if(constructor === undefined){
            var constructor = function(message) {
                if(message !== undefined) {
                    this.name = name;
                    this.message = (message) ? message : "Default Message";
                    var err = new Error;
                    if(!err.stack)
                        this.stack = '(no stack available)';
                    else
                        this.stack = err.stack;
                    this.stack = name + ' Error: ' + this.message + this.stack;
                }
            };
        };
        constructor.prototype = prototype;
        constructor.constructor = constructor;
        if(namespace === undefined)
            var namespace = errors
        namespace[name] = constructor;
    }
    errors.makeError = makeError;
    /**
     * here the definitions go
     */
    makeError('Error');
    makeError('NotImplemented', undefined , new errors.Error);
    makeError('Assertion', undefined , new errors.Error);
    makeError('Value', undefined , new errors.Error);
    makeError('Type', undefined , new TypeError);
    makeError('Dependency', undefined , new errors.Error);
    makeError('Parser', undefined , new errors.Error);
    makeError('IO', undefined , new errors.Error);
    makeError('NameTranslation', undefined , new errors.Error);
    makeError('GlifLib', undefined , new errors.Error);
    
    /**
     * if expression is false errors.Assertion is thrown
     * pass a message to explain yourself 
     **/
    errors.assert = function(exp, message) {
        if (!exp) {
            throw new errors.Assertion(message);
        }
    };
    errors.warn = function(message) {
        if(typeof console !== 'undefined' && console.log)
            console.log('WARNING: ' + message);
    };
    
    return errors;
});
