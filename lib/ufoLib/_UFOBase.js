define([
    'ufojs/errors'
  , 'Atem-IO/errors'
  , 'obtain/obtain'
  , 'ufojs/plistLib/main'
  , './constants'
  , './validators'
], function(
    errors
  , ioErrors
  , obtain
  , plistLib
  , constants
  , validators
) {
    "use strict";


    var UFOLibError = errors.UFOLib
      , IONoEntryError = ioErrors.IONoEntry
      , LAYERCONTENTS_FILENAME = constants.LAYERCONTENTS_FILENAME
      , layerContentsValidator = validators.layerContentsValidator
      ;

    /**
     * code sharing for UFOReader and UFOWriter
     */
    function _UFOBase(io, path) {
        //jshint validthis:true
        this._io = io;
        this._path = path;

    }
    var _p = _UFOBase.prototype;

    /**
     * Read a property list relative to the path argument of
     * UFOReader/UFOWriter. If the file is missing and default is None a
     * UFOLibError will be raised otherwise default is returned. The errors
     * that could be raised during the reading of a plist are unpredictable
     * and/or too large to list, so, a blind try: except: is done. If an
     * exception occurs, a UFOLibError will be raised.
     */
    _p._getPlist = obtain.factory(
        {
            path: ['fileName', function(fileName){
                    return [this._path, fileName].join('/');
                }]
          , data: ['path', 'default', function(path, defaultVal) {
                try {
                    return this._io.readFile(false, path);
                }
                catch(e) {
                    if(e instanceof IONoEntryError) {
                        if(defaultVal)
                            return false;
                        throw new UFOLibError('The file "' + path + '" is missing. '
                                                    + 'This file is required.');
                    }
                    throw new UFOLibError('The file "' + path + '" '
                                    + 'could not be read. ' + e, e.stack);
                }
            }]
          , plist: ['data', 'path', 'default', function(data, path, defaultVal) {
                if(data === false)
                    return defaultVal;
                try {
                    return plistLib.readPlistFromString(data);
                }
                catch(e) {
                    throw new UFOLibError('The file "' + path + '" '
                                    + 'could not be read. ' + e, e.stack);
                }

            }]
        }
      , {
            data: ['path', 'default', function(path, defaultVal) {
                function onError(e) {
                    if(e instanceof IONoEntryError) {
                        if(defaultVal)
                            return false;
                        throw new UFOLibError('The file "' + path + '" is missing. '
                                                    + 'This file is required.');
                    }
                    throw new UFOLibError('The file "' + path + '" '
                                    + 'could not be read. ' + e, e.stack);
                }
                return this._io.readFile(true, path)
                           .then(null, onError);
            }]
        }
      , ['fileName', 'default']
      , function(obtain) { return obtain('plist');}
    );

    _p._readRawLayerContents = obtain.factory(
        {
            contents: [false, new obtain.Argument(LAYERCONTENTS_FILENAME), _p._getPlist]
          , validation: ['contents', function(contents) {
                return layerContentsValidator(false, this._io, contents, this._path);
            }]
          , data: ['validation', 'contents', function(result, contents) {
                if(!result[0])
                    throw new UFOLibError(result[1]);
                return contents;
            }]
        }
      , {
            contents: [true, new obtain.Argument(LAYERCONTENTS_FILENAME), _p._getPlist]
          , validation: ['contents', function(contents) {
                return layerContentsValidator(true, this._io, contents, this._path);
            }]
        }
      , []
      , function(obtain) {
            return obtain('data');
        }
    );

    return _UFOBase;
});
