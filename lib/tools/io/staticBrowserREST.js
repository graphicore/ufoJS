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

    var _errorFromRequest = function(request) {
        var message = _errorMessageFromRequest(request);
        if(request.status === 404)
            return new IONoEntry(message);
        //just don't use this if request.status == 200 or so is no error
        return new IOError(message);
    }
    
    function _path2uri(path) {
        return path.split('/').map(encodeURIComponent).join('/')
    }
    
    var _readPathSync = function(method, path) {
        var request = new XMLHttpRequest();
        request.open(method, _path2uri(path), false);
        request.send(null);
        return request;
    }

    var _readPath = function (method, path, callback) {
        var request = new XMLHttpRequest();
        request.open(method, _path2uri(path), true);
        request.onreadystatechange = function (aEvt) {
            if (request.readyState != 4) return;
            callback(request);
        }
        request.send(null);
    }

    _p.readFile = obtain.factory(
        {
            uri: ['path', _path2uri]
          , readFile:['uri', function(path) {
                var request = new XMLHttpRequest();
                request.open('GET', path, false);
                request.send(null);
                
                if(request.status !== 200)
                    throw _errorFromRequest(request);
                
                return request.responseText;
            }]
        }
      , {
            readFile:['uri', '_callback', function(path, callback) {
                var request = new XMLHttpRequest()
                  , result
                  , error
                  ;
                request.open('GET', path, true);
                
                request.onreadystatechange = function (aEvt) {
                    if (request.readyState != 4 /*DONE*/)
                        return;
                    
                    if (request.status !== 200)
                        error = _errorFromRequest(request);
                    else
                        result = request.responseText
                    callback(error, result)
                }
                request.send(null);
            }]
        }
      , ['path']
      , function(obtain){ return obtain('readFile'); }
    );
    
    _p.writeFile = obtain.factory(
        {
            uri: ['path', _path2uri]
          , writeFile:['uri', 'data', function(path, data) {
                var request = new XMLHttpRequest();
                request.open('PUT', path, false);
                request.send(data);
                if (request.status !== 200  && request.status !== 204)
                    throw _errorFromRequest(request);
                return;
            }]
        }
      , {
            writeFile:['uri', 'data', '_callback',
            function(path, data, callback) {
                var request = new XMLHttpRequest()
                    , result
                    , error
                    ;
                request.open('PUT', path, true);
                request.onreadystatechange = function (aEvt) {
                    if (request.readyState != 4 /*DONE*/)
                        return;
                    if (request.status !== 200  && request.status !== 204)
                        error = _errorFromRequest(request);
                    callback(error, result);
                }
                request.send(data);
            }]
        }
      , ['path', 'data']
      , function(obtain){ return obtain('writeFile'); }
    );
    
    /**
     * Append to a file, create the file if it doesn't exist.
     *
     * This uses POST as a verb;
     *
     * On success we expect 201 Created or 204 No Content, I guess 200 OK
     * could be considered as OK as well, but since we don't expect content
     * in the response body I omit it until someone comes up with better
     * reasoning.
     *
     * Also, we don't read the LOCATION headers of the response, as the 
     * expected behavior of the server is to create or to append to the 
     * effective request URI.
     *
     * https://github.com/graphicore/ufoJS/pull/32#issuecomment-60504008
     */
    _p.appendFile = obtain.factory(
        {
            uri: ['path', _path2uri]
          , appendFile:['uri', 'data', function(path, data) {
                var request = new XMLHttpRequest();
                request.open('POST', path, false);
                request.send(data);
                if (request.status !== 201  && request.status !== 204)
                    throw _errorFromRequest(request);
            }]
        }
      , {
            appendFile:['uri', 'data', '_callback',
            function(path, data, callback) {
                var request = new XMLHttpRequest()
                  , result
                  , error
                  ;
                request.open('POST', path, true);
                request.onreadystatechange = function (aEvt) {
                    if (request.readyState != 4 /*DONE*/)
                        return;
                    if (request.status !== 201  && request.status !== 204)
                        error = _errorFromRequest(request);
                    callback(error, result);
                }
                request.send(data);
            }]
        }
      , ['path', 'data']
      , function(obtain){ return obtain('appendFile'); }
    );

    _p.unlink = obtain.factory(
        {
            uri: ['filename', _path2uri]
          , unlink:['uri', function(filename) {
                var request = new XMLHttpRequest();
                request.open('DELETE', filename, false);
                request.send();
                if (request.status !== 200 && request.status !== 204)
                    throw _errorFromRequest(request);
                return;
            }]
        }
      , {
            unlink:['uri', '_callback', function(filename, callback) {
                var request = new XMLHttpRequest()
                    , result
                    , error
                    ;
                request.open('DELETE', filename, true);
                request.onreadystatechange = function (aEvt) {
                    if (request.readyState != 4 /*DONE*/)
                        return;
                    if (request.status !== 200 && request.status !== 204)
                        error = _errorFromRequest(request);
                    callback(error, result);
                }
                request.send();
            }]
        }
      , ['filename']
      , function(obtain){ return obtain('unlink'); }
    );
    
    _p.readBytes = obtain.factory(
        {
            uri: ['path', _path2uri]
          , readBytes:['uri', 'bytes', function(path, bytes) {
                var request = new XMLHttpRequest();
                request.open('GET', path, false);
                // so there is no conversion by the browser
                request.overrideMimeType('text/plain; charset=x-user-defined');
                request.send(null);
                
                if(request.status !== 200)
                    throw _errorFromRequest(request);
                var chunk = request.response.slice(0, bytes),
                    newChunk = new Uint8Array(bytes);
                // throw away high-order bytes (F7)
                for(var i=0; i<chunk.length; i++)
                    newChunk[i] = chunk.charCodeAt(i);
                return String.fromCharCode.apply(null, newChunk);
            }]
        }
      , {
            readBytes:['uri', 'bytes', '_callback',
            function(path, bytes, callback) {
                var request = new XMLHttpRequest()
                  , result
                  , error
                  ;
                request.open('GET', path, true);
                request.responseType = 'arraybuffer';
                request.onreadystatechange = function (aEvt) {
                    if (request.readyState != 4 /*DONE*/)
                        return;
                    
                    if (request.status !== 200)
                        error = _errorFromRequest(request);
                    else {
                        var  newChunk =  new Uint8Array(request.response, 0, bytes);
                        result = String.fromCharCode.apply(null, newChunk);
                    }
                    callback(error, result);
                }
                request.send(null);
            }]
        }
      , ['path', 'bytes']
      , function(obtain){ return obtain('readBytes'); }
    );

    // FIXME: the pathExists method should work for both files and
    // directories, but the REST server needs to know whether it's dealing
    // with a file or directory, so we add a trailing slash in the latter
    // case.
    // 
    // PROPOSED FIX: split pathExists into dirExists and fileExists.
    _p.pathExists = obtain.factory(
        {
            pathExists:['path', function(path) {
                return _readPathSync('HEAD', path).status === 200;
            }]
        }
      , {
            pathExists:['path', '_callback', function(path, callback) {
                _readPath('HEAD', path, function (result) {
                    callback(undefined, result.status === 200);
                });
            }]
        }
      , ['path']
      , function(obtain){ return obtain('pathExists'); }
    );
    
    _p.getMtime = obtain.factory(
        {
            uri: ['path', _path2uri]
          , getMtime:['uri', function(path) {
                var result = _readPathSync('HEAD', path);
                if(result.status !== 200)
                    throw _errorFromRequest(result);
                return new Date(result.getResponseHeader('Last-Modified'));
            }]
        }
      , {
            getMtime:['uri', '_callback', function(path, callback) {
                _readPath('HEAD', path, function (result) {
                    var error;
                    if (result.status !== 200)
                        error = _errorFromRequest(request);
                    else
                        result = new Date(result.getResponseHeader('Last-Modified'));
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
                return _readPathSync('GET', path).responseText.split('\n');
            }]
        }
      , {
            readDir:['path', '_callback', function(path, callback) {
                _readPath('GET', path, function (result) {
                    callback(undefined, result.responseText.split('\n'));
                });
            }]
        }
      , ['path']
      , function(obtain){ return obtain('readDir'); }
    );

    _p.mkDir = obtain.factory({
            uri: ['path', _path2uri]
          , dirName: ['uri', function(uri) {
                // the endpoint will only create a directory if URI ends with /
                return uri + (uri.slice(-1) !== '/' ? '/' : '');
            }]
          , mkDir:['dirName', function(path) {
                var request = new XMLHttpRequest();
                request.open('PUT', path, false);
                request.send();
                if(request.status === 405)
                    throw new IOEntryExists(message);
                else if (request.status !== 200 && request.status !== 201
                        && request.status !== 204)
                    throw _errorFromRequest(request);
            }]
        }
      , {
            mkDir:['dirName', '_callback', function(path, callback) {
                var request = new XMLHttpRequest()
                    , result
                    , error
                    ;
                request.open('PUT', path, true);
                request.onreadystatechange = function (aEvt) {
                    if (request.readyState != 4 /*DONE*/)
                        return;
                    
                    if (request.status === 405)
                        error = new IOEntryExists(_errorMessageFromStatus(request));
                    else if (request.status !== 200 && request.status !== 201
                            && request.status !== 204)
                        error = _errorFromRequest(request);
                    callback(error, result);
                }
                request.send();
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
            uri: ['path', _path2uri]
          , dirName: ['uri', function(uri) {
                // the endpoint will only remove a directory if uri ends width
                // a slash
                return uri + (uri.slice(-1) !== '/' ? '/' : '');
            }]
          , rmDir:['dirName', function(path) {
                var request = new XMLHttpRequest();
                request.open('DELETE', path, false);
                request.send();
                if (request.status !== 200 && request.status !== 204)
                    throw _errorFromRequest(request);
            }]
        }
      , {
            rmDir:['dirName', '_callback', function(path, callback) {
                var request = new XMLHttpRequest()
                    , result
                    , error
                    ;
                request.open('DELETE', path, true);
                request.onreadystatechange = function (aEvt) {
                    if (request.readyState != 4 /*DONE*/)
                        return;

                    if (request.status !== 200 && request.status !== 204)
                        error = _errorFromRequest(request);
                    callback(error, result);
                }
                request.send();
            }]
        }
      , ['path']
      , function(obtain){ return obtain('rmDir'); }
    );
    
    return new Io(); // Single instance of static type
});
