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


    // Utility functions to build the file methods
       
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
    var _dirify = function (f) {
        return function (async, path, data) {
            return f(async, function(path) { return uri + (uri.slice(-1) !== '/' ? '/' : ''); }, data);
        }
    };

    // Constructor for a synchronous method
    var _doRequest = function(method, path, responseType, data) {
        var request = new XMLHttpRequest();
        request.open(method, _path2uri(path), false);
        if(responseType)
            request.responseType = responseType;
        request.send(data);
        if(request.status < 200 || request.status > 209)
            throw _errorFromRequest(request);
        return request;
    };

    // Constructor for an asynchronous method
    var _promiseRequest = function(method, path, responseType, data) {
        return new Promise(function(resolve, reject) {
            var request = new XMLHttpRequest();
            request.open(method, _path2uri(path), true);
            if(responseType)
                request.responseType = responseType;
            request.onreadystatechange = function (aEvt) {
                if(request.readyState != 4 /*DONE*/)
                    return;
                if(request.status < 200 || request.status > 204)
                    reject(_errorFromRequest(request), request);
                resolve(request);
            };
            request.send(data);
        });
    };

    // Constructor for a combined sync/async method
    var _id = function (x) { return x; };
    var _requestify = function(method, resolveFilter, responseType, rejectFilter) {
        return function (async, path, data) {
            if (async)
                return _promiseRequest(method, path, responseType, data).then(resolveFilter, rejectFilter);
            try {
                return (resolveFilter || _id)(_doRequest(method, path, responseType, data));
            } catch (e) {
                e = (rejectFilter || _id)(e);
                if (e instanceof Error)
                    throw e;
                return e;
            }
        }
    };


    // The file methods
    //
    // These accept a subset of the ObtainJS API: the 'async' flag must be a
    // boolean, and when called with 'true' the return value is a Promise.

    _p.readFile = _requestify('GET', function (res) { return res.responseText; });

    _p.writeFile = _requestify('PUT');
    
     // We don't read the LOCATION headers of the response, as the expected
     // behavior of the server is to create or to append to the effective
     // request URI.
    _p.appendFile = _requestify('POST');

    _p.unlink = _requestify('DELETE');

    _p.readBytes = _requestify('GET', function (res) {
        var newChunk = new Uint8Array(res.response, 0, bytes);
        return String.fromCharCode.apply(null, newChunk);
     },
     'arraybuffer');

    _p.fileExists = _requestify('HEAD', undefined, undefined, function (err) {
        if (err instanceof IONoEntry)
            return false;
        else
            return err;
    });
    _p.dirExists = _dirify(_p.fileExists);       
    _p.pathExists = _p.fileExists; // DEPRECATED: use dirExists or fileExists

    _p.getMtime = _requestify('HEAD', function (res) { return new Date(res.getResponseHeader('Last-Modified')); });

    _p.readDir = _dirify(_requestify('GET', function (res) { return res.responseText.split('\n'); }));

    _p.mkDir = _dirify(_requestify('PUT', undefined, undefined, function (err, res) {
        if (res.status == 405)
            err = new IOEntryExists(_errorMessageFromStatus(res));
        return err;
    }));

    _p.ensureDir = _dirify(_p._writeFile);

    _p.rmDir = _dirify(_p.unlink);

      
    return new Io(); // Single instance of static type
});
