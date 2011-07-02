define(function() {
    //graphicore errors
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
