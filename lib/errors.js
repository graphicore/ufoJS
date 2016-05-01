/**
 * Copyright (c) 2011, Lasse Fister lasse@graphicore.de, http://graphicore.de
 *
 * You should have received a copy of the MIT License along with this program.
 * If not, see http://www.opensource.org/licenses/mit-license.php
 *
 */

define([
    'Atem-Errors/errors'
], function(
    atemErrors
) {
    "use strict";
    var errors = Object.create(atemErrors)
      , makeError = atemErrors.makeError.bind(null, errors)
      ;

    makeError('UFO', undefined , errors.Error);
    makeError('Dependency', undefined , errors.UFO);
    makeError('Parser', undefined , errors.UFO);
    makeError('NameTranslation', undefined , errors.UFO);
    makeError('UFOLib', undefined , errors.UFO);
    makeError('GlifLib', undefined , errors.UFO);

    return errors;
});
