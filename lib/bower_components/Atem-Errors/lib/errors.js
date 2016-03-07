define(function() {
    "use strict";
    //metapolator errors
    var errors = Object.create(null);

    /**
     * save three lines of coding for each error with this factory
     *
     * and observe that extending Error is uncool
     */
    var makeError = function(namespace, name, Constructor, Parent)
    {
        if(Parent === undefined)
            Parent = Error;

        if(Constructor === undefined) {
            Constructor = function(message, stack) {
                if(message !== undefined) {
                    this.name = name + 'Error';
                    this.message = message || "(no error message)";
                }

                if(!stack && typeof Error.captureStackTrace === 'function')
                    Error.captureStackTrace(this, Constructor);
                else {
                    this.stack = stack || (new Error()).stack || '(no stack available)';
                }
            };
        }
        Constructor.prototype = Object.create(Parent.prototype);
        Constructor.prototype.constructor = Constructor;

        namespace[name] = Constructor;
    };
    errors.makeError = makeError;

    /**
     * Some generally useful errors
     */
    makeError(errors, 'Error');
    makeError(errors, 'Unhandled');
    makeError(errors, 'Type', undefined, TypeError);
    makeError(errors, 'Assertion', undefined, errors.Error);
    makeError(errors, 'Value', undefined, errors.Error);
    makeError(errors, 'Key', undefined, errors.Error);
    makeError(errors, 'NotImplemented', undefined, errors.Error);
    makeError(errors, 'Deprecated', undefined, errors.Error);
    makeError(errors, 'AbstractInterface', undefined, errors.Error);
    makeError(errors, 'Event', undefined, errors.Error);
    makeError(errors, 'Emitter', undefined, errors.Event);
    makeError(errors, 'Receiver', undefined, errors.Event);


    /**
     * if expression is false, throw an Assertion
     * pass a message to explain yourself
     **/
    errors.assert = function(exp, message) {
        if (!exp) {
            throw new errors.Assertion(message);
        }
    };
    errors.warn = function(message) {
        if(typeof console !== 'undefined' && console.warn)
            console.warn('WARNING: ' + message);
    };

    /**
     * ES6/Promises have the fundamental flaw, that, if there is no
     * Error handler attached, an unhandled error stays unnoticed and
     * just disappears.
     * Because handling all Errors always correctly is not possible at
     * any given time e.g. a program may still be under construction for
     * example, this is a default handler to mark a promise as unhandled.
     *
     * Using this error-handler at the very end of the promise chain
     * ensures that the unhandled Proxy exception is not just disappearing
     * unnoticed by the main program.
     */
    function unhandledPromise(originalError) {
        var error = new errors.Unhandled(originalError+'\n'+originalError.stack);
        error.originalError = originalError;
        // use setTimout to escape the catch all that es6/Promise applies
        // and that silences unhandled errors
        setTimeout(function unhandledError(){throw error;}, 0);
    }
    errors.unhandledPromise = unhandledPromise;

    Object.freeze(errors)
    return errors;
});
