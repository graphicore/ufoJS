define([
    'Atem-Errors/errors'
], function(
    atemErrors
) {
    var errors = Object.create(atemErrors)
      , makeError = atemErrors.makeError.bind(null, errors)
      ;

    makeError('IO', undefined , errors.Error);
    makeError('IONoEntry', undefined, errors.IO);
    makeError('IOEntryExists', undefined, errors.IO);
    makeError('IONotDir', undefined, errors.IO);
    makeError('IOIsDir', undefined, errors.IO);
    makeError('IONotEmpty', undefined, errors.IO);

    return errors;
});
