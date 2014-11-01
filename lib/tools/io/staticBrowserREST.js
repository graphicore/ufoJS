/**
 * This is a REST implementation of io/_base.
 */
define([
    'ufojs/errors'
  , 'obtain/obtain'
  , './_base'
], function(
    errors
  , obtain
  , Parent
) {
    "use strict";
    
    if(typeof require.nodeRequire === 'function')
        return null;
    
    var IOError = errors.IO
      , IONoEntry = errors.IONoEntry
      , IOEntryExists = errors.IOEntryExists
      ;

    function Io() {
        Parent.call(this);
    }

    var _p = Io.prototype = Object.create(Parent.prototype);

    var _errorMessageFromRequest = function(request) {
        return ['Status', request.status, request.statusText].join(' ');
    }

    // Don't use this method for non-error statuses!
    var _errorFromRequest = function(request) {
        var message = _errorMessageFromRequest(request);
        if(request.status === 404)
            return new IONoEntry(message);
        return new IOError(message);
    }
    
    function _path2uri(path) {
        return path.split('/').map(encodeURIComponent).join('/')
    }

    // We signal a directory to the REST endpoint by adding a / suffix
    function _uri2dir(uri) {
        return uri + (uri.slice(-1) !== '/' ? '/' : '');
    }

    var _doRequest = function(method, path, callback, responseType, data) {
        var request = new XMLHttpRequest();
        request.open(method, _path2uri(path), true);
        request.onreadystatechange = function (aEvt) {
            if(request.readyState != 4 /*DONE*/)
                return;
            if(request.status < 200 || request.status > 204)
                error = _errorFromRequest(request);
            callback(error, request);
        }
        request.send(null);
    };

    var _doRequestSync = function(method, path, responseType, data) {
        var request = new XMLHttpRequest();
        request.open(method, _path2uri(path), false);
        if(responseType)
            request.responseType = responseType;
        request.send(data);
        if(request.status < 200 || request.status > 209)
            throw _errorFromRequest(request);
        return request;
    };

    _p.readFile = obtain.factory(
        {
            readFile:['path', function(path) {
                var result = _doRequestSync('GET', path);
                return result.responseText;
            }]
        }
      , {
            readFile:['path', '_callback', function(path, callback) {
                _doRequest('GET', path, function(error, result) {
                    callback(error, result.responseText)
                });
            }]
        }
      , ['path']
      , function(obtain){ return obtain('readFile'); }
    );
    
    _p.writeFile = obtain.factory(
        {
            writeFile:['path', 'data', function(path, data) {
                _doRequestSync('PUT', path, undefined, data);
            }]
        }
      , {
            writeFile:['path', 'data', '_callback', function(path, data, callback) {
                _doRequest('PUT', path, callback, undefined, data);
            }]
        }
      , ['path', 'data']
      , function(obtain){ return obtain('writeFile'); }
    );
    
    /**
     * Append to a file, create the file if it doesn't exist.
     *
     * We don't read the LOCATION headers of the response, as the expected
     * behavior of the server is to create or to append to the effective
     * request URI.
     */
    _p.appendFile = obtain.factory(
        {
            appendFile:['path', 'data', function(path, data) {
                _doRequestSync('POST', path, undefined, data);
            }]
        }
      , {
            appendFile:['path', 'data', '_callback',
            function(path, data, callback) {
                _doRequest('POST', path, callback, undefined, data);
            }]
        }
      , ['path', 'data']
      , function(obtain){ return obtain('appendFile'); }
    );

    _p.unlink = obtain.factory(
        {
            unlink:['path', function(filename) {
                _doRequestSync('DELETE', filename);
            }]
        }
      , {
            unlink:['path', '_callback', function(filename, callback) {
                _doRequest('DELETE', filename, callback);
            }]
        }
      , ['filename']
      , function(obtain){ return obtain('unlink'); }
    );
    
    _p.readBytes = obtain.factory(
        {
            readBytes:['path', 'bytes', function(path, bytes) {
                var result = _doRequestSync('GET', path, 'arraybuffer');
                var newChunk = new Uint8Array(result.response, 0, bytes);
                return String.fromCharCode.apply(null, newChunk);
            }]
        }
      , {
            readBytes:['path', 'bytes', '_callback',
            function(path, bytes, callback) {
                _doRequest('GET', path, true, function(error, result) {
                    if(!error) {
                        var newChunk = new Uint8Array(request.response, 0, bytes);
                        result = String.fromCharCode.apply(null, newChunk);
                    }
                    callback(error, result);
                 },
                 'arraybytes');
            }]
        }
      , ['path', 'bytes']
      , function(obtain){ return obtain('readBytes'); }
    );

    // FIXME: the pathExists method should work for both files and
    // directories, but the REST server needs to know whether it's dealing
    // with a file or directory, so the caller must add a trailing slash in
    // the latter case.
    // 
    // PROPOSED FIX: split pathExists into dirExists and fileExists.
    _p.pathExists = obtain.factory(
        {
            pathExists:['path', function(path) {
                try {
                    _doRequestSync('HEAD', path);
                } catch (err) {
                    if (err instanceof IONoEntry)
                        return false;
                    throw err;
                }
                return true;
            }]
        }
      , {
            pathExists:['path', '_callback', function(path, callback) {
                _doRequest('HEAD', path, function (error, result) {
                    callback(error, result.status === 200);
                });
            }]
        }
      , ['path']
      , function(obtain){ return obtain('pathExists'); }
    );
    
    _p.getMtime = obtain.factory(
        {
            getMtime:['path', function(path) {
                return new Date(_doRequestSync('HEAD', path).getResponseHeader('Last-Modified'));
            }]
        }
      , {
            getMtime:['path', '_callback', function(path, callback) {
                _doRequest('HEAD', path, function(error, result) {
                    if (!error)
                        result = new Date(result.getResponseHeader('Last-Modified'))
                    callback(error, result);
                });
            }]
        }
      , ['path']
      , function(obtain){ return obtain('getMtime'); }
    );
    
    _p.readDir = obtain.factory(
        {
            readDir:['path', function(path) {
                return _doRequestSync('GET', path).responseText.split('\n');
            }]
        }
      , {
            readDir:['path', '_callback', function(path, callback) {
                _doRequest('GET', path, function (error, result) {
                    if (!error)
                        result = result.responseText.split('\n');
                    callback(error, result);
                });
            }]
        }
      , ['path']
      , function(obtain){ return obtain('readDir'); }
    );

    _p.mkDir = obtain.factory({
            dirName: ['path', _uri2dir]
          , mkDir:['dirName', function(dirName) {
                if(_doRequestSync('PUT', dirName).status === 405)
                    throw new IOEntryExists(dirName);
            }]
        }
      , {
            mkDir:['dirName', '_callback', function(dirName, callback) {
                _doRequest('PUT', dirName, function (error, result) {
                    if (request.status === 405)
                        error = new IOEntryExists(_errorMessageFromStatus(request));
                    callback(error, result);
                });
            }]
        }
      , ['path']
      , function(obtain){ return obtain('mkDir'); }
    );
    
    _p.ensureDir = obtain.factory({
            ensureDir:['path', function(path) {
                try {
                    return this.mkDir(false, path);
                } catch (err) {
                    if (err instanceof IOEntryExists)
                        return 0;
                    throw err;
                }
            }]
        }
      , {
            ensureDir:['path', '_callback', function(path, callback) {
                var callbackSkipIoEntryExists = function(err, result) {
                    if (err instanceof IOEntryExists)
                        err = undefined;
                    callback(err, result);
                };
                this.mkDir({callback: callbackSkipIoEntryExists}, path);
            }]
        }
      , ['path']
      , function(obtain){ return obtain('ensureDir'); }
    );

    _p.rmDir = obtain.factory({
            dirName: ['path', _uri2dir]
          , rmDir:['dirName', function(dirName) {
                this.unlink(false, dirName);
            }]
        }
      , {
            rmDir:['dirName', '_callback', function(dirName, callback) {
                this.unlink({callback: callback}, dirName);
            }]
        }
      , ['path']
      , function(obtain){ return obtain('rmDir'); }
    );
    
    return new Io(); // Single instance of static type
});
