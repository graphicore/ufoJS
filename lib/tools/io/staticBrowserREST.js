/**
 * This is a simple NodeJS implementation for io/_base.
 */
define([
    'ufojs/errors'
  , 'obtain/obtain'

], function(
    errors
  , obtain
) {
    "use strict";
    
    if(typeof require.nodeRequire === 'function')
        return;
    
    var IOError = errors.IO
      , IONoEntry = errors.IONoEntry
      ;

    var _errorFromRequest = function(request) {
        var message = ['Status', request.status, request.statusText].join(' ')
        if(request.status === 404)
            return new IONoEntry(message);
        //just don't use this if request.status == 200 or so is no error
        return new IOError(message);
    }
    
    function _path2uri(path) {
        return path.split('/').map(encodeURIComponent).join('/')
    }
    
    var readFile = obtain.factory(
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
    
    var writeFile = obtain.factory(
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
    
    var unlink = obtain.factory(
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
    
    var readBytes = obtain.factory(
        {
            uri: ['path', _path2uri]
          , readBytes:['uri', 'bytes', function(path, bytes) {
                var request = new XMLHttpRequest();
                request.open('GET', path, false);
                // so there is no conversion by the browser
                request.overrideMimeType('text\/plain; charset=x-user-defined');
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

    
    var pathExists = obtain.factory(
        {
            uri: ['path', _path2uri]
          , pathExists:['uri', function(path) {
                var request = new XMLHttpRequest();
                request.open('HEAD', path, false);
                request.send(null);
                return request.status === 200;
            }]
        }
      , {
            pathExists:['uri', '_callback', function(path, callback) {
                var request = new XMLHttpRequest();
                request.open('HEAD', path, true);
                request.onreadystatechange = function (aEvt) {
                    if (request.readyState != 4) return;
                    callback(undefined, request.status === 200);
                }
                request.send(null);
            }]
        }
      , ['path']
      , function(obtain){ return obtain('pathExists'); }
    );
    
    var getMtime = obtain.factory(
        {
            uri: ['path', _path2uri]
          , getMtime:['uri', function(path) {
                var request = new XMLHttpRequest();
                request.open('HEAD', path, false);
                request.send(null);
                if(request.status !== 200)
                    throw _errorFromRequest(request);
                return new Date(request.getResponseHeader('Last-Modified'));
            }]
        }
      , {
            getMtime:['uri', '_callback', function(path, callback) {
                var request = new XMLHttpRequest()
                  , result
                  , error
                  ;
                request.open('HEAD', path, true);
                request.onreadystatechange = function (aEvt) {
                    if (request.readyState != 4  /*DONE*/)
                        return;
                    
                    if (request.status !== 200)
                        error = _errorFromRequest(request);
                    else
                        result = new Date(request.getResponseHeader('Last-Modified'));
                    callback(error, result);
                }
                request.send(null);
            }]
        }
      , ['path']
      , function(obtain){ return obtain('getMtime'); }
    );
    
    var mkDir = obtain.factory({
            uri: ['path', _path2uri]
          , dirName: ['uri', function(uri) {
                // the endpoint will only create a directory if uri ends width
                // a slash
                return uri + (uri.slice(-1) !== '/' ? '/' : '');
            }]
          , mkDir:['dirName', function(path) {
                var request = new XMLHttpRequest();
                request.open('PUT', path, false);
                request.send();
                if (request.status !== 200 && request.status !== 201
                        && request.status !== 204)
                    throw _errorFromRequest(request);
                return;
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
                    
                    if (request.status !== 200 && request.status !== 201
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
    
    var rmDir = obtain.factory({
            uri: ['path', _path2uri]
          , dirName: ['uri', function(uri) {
                // the endpoint will only create a directory if uri ends width
                // a slash
                return uri + (uri.slice(-1) !== '/' ? '/' : '');
            }]
          , rmDir:['dirName', function(path) {
                var request = new XMLHttpRequest();
                request.open('DELETE', path, false);
                request.send();
                if (request.status !== 200 && request.status !== 204)
                    throw _errorFromRequest(request);
                return;
            }]
        }
      , {
            mkDir:['dirName', '_callback', function(path, callback) {
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
    
    return {
        readFile: readFile
      , writeFile: writeFile
      , unlink: unlink
      , readBytes: readBytes
      , pathExists: pathExists
      , getMtime: getMtime
      , mkDir: mkDir
      , rmDir: rmDir
    };
});
