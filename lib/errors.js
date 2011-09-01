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
     */
    var makeError = function(name, constructor, prototype, namespace)
    {
        if(prototype === undefined)
            var prototype = new Error;
        if(constructor === undefined){
            var constructor = function(message) {
                this.name = name;
                this.message = (message) ? message : "Default Message";
            };
        };
        constructor.prototype = prototype;
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
    makeError('Type', undefined , new errors.Error);
    
    /**
     * if expression is false errors.Assertion is thrown
     * pass a message to explain yourself 
     **/
    errors.assert = function(exp, message) {
        if (!exp) {
            throw new errors.Assertion(message);
        }
    }
    return errors;
});
