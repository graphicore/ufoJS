/**
 * Copyright (c) 2011, Lasse Fister lasse@graphicore.de, http://graphicore.de
 *
 * You should have received a copy of the MIT License along with this program.
 * If not, see http://www.opensource.org/licenses/mit-license.php
 *
 */

define(function() {
    "use strict";
    //ufojs errors
    var errors = {};

    /**
     * safe three lines of coding for each error with this factory
     *
     * and observe that extending Error is uncool
     */
    function makeError(name, Constructor, Parent, namespace) {
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

        if(namespace === undefined)
            namespace = errors;
        namespace[name] = Constructor;
    }
    errors.makeError = makeError;
    /**
     * here the definitions go
     */
    makeError('Error');
    makeError('NotImplemented', undefined , errors.Error);
    makeError('Assertion', undefined , errors.Error);
    makeError('Value', undefined , errors.Error);
    makeError('Type', undefined , TypeError);
    makeError('Dependency', undefined , errors.Error);
    makeError('Parser', undefined , errors.Error);
    makeError('IO', undefined , errors.Error);
    makeError('IONoEntry', undefined, errors.IO);
    makeError('IOEntryExists', undefined, errors.IO);
    // the following IO errors are optional for IO implementations
    makeError('IONotDir', undefined, errors.IO);
    makeError('IOIsDir', undefined, errors.IO);
    makeError('IONotEmpty', undefined, errors.IO);
    makeError('NameTranslation', undefined , errors.Error);
    makeError('GlifLib', undefined , errors.Error);
    makeError('Key', undefined , TypeError);

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
