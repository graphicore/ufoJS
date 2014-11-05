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
        var err;
        if(request.status === 404)
            err = new IONoEntry(message);
        else
            err = new IOError(message);
        err.request = request;
        return err;
    }
    
    var _path2uri = function(path) {
        return path.split('/').map(encodeURIComponent).join('/')
    }

    // We signal a directory to the REST endpoint by adding a / suffix
    var _dirify = function (f) {
        return function (async, path, data) {
            return f(async, path + (path.slice(-1) !== '/' ? '/' : ''), data);
        }
    };

    // Perform a synchronous or asynchronous request
    // FIXME: once ES6 arrives, use separate resolve/reject handlers instead of resultFilter
    var _obtainRequestFactory = function (method, responseType, okStatus, resultFilter) {
        resultFilter = resultFilter || function (err, res) { return [err, res]; };
        okStatus = okStatus || {};
        okStatus[200] = true;
        return obtain.factory({
                async: [ function () { return false; } ]
              , startRequest:['async', 'path', function(async, path) {
                    var request = new XMLHttpRequest();
                    request.open(method, _path2uri(path), async);
                    if(responseType)
                        request.responseType = responseType;
                    return request;
                 }]
              , attachHandler: [ function () { return null; } ]
              , sendData: ['startRequest', 'data', 'attachHandler', function(request, data) {
                    request.send(data);
                    return request;
                }]
              , result: ['sendData', function(request) {
                    var error
                      , ret
                      ;
                    if(!(request.status in okStatus))
                        error = _errorFromRequest(request);
                    ret = resultFilter(error, request);
                    if(ret[0])
                        throw ret[0];
                    return ret[1];
                }]
            }
          , {
                async: [ function () { return true; } ]
              , attachHandler: ['startRequest', function(request) {      
                    request.onreadystatechange = function (aEvt) {
                        if (request.readyState != 4 /*DONE*/)
                            return;
                        if (!(request.status in okStatus))
                            error = _errorFromRequest(request);
                        callback.apply(undefined, resultFilter(error, request));
                    }
                    return request;
                }]
              , result: [ 'sendData', function () { return null; } ]
            }
          , ['path', 'data']
          , function(obtain){ return obtain('result'); }
        );
    };


    // The file methods

    _p.readFile = _obtainRequestFactory('GET', undefined, undefined, function(error, result) {
        if (!error)
            result = result.responseText;
        return [error, result];
    });
    
    _p.writeFile = _obtainRequestFactory('PUT', undefined, {200: true, 204: true});

    // We don't read the LOCATION headers of the response, as the expected
    // behavior of the server is to create or to append to the effective
    // request URI.
    _p.appendFile = _obtainRequestFactory('POST');

    _p.unlink = _obtainRequestFactory('DELETE', undefined, {200: true, 204: true});

    _p.readBytes = _obtainRequestFactory('GET', 'arraybuffer', undefined, function (error, result) {
        if (!error)
            result = String.fromCharCode.apply(null, new Uint8Array(result.response, 0, bytes));
        return [error, result];
    });

    _p.fileExists = _obtainRequestFactory('HEAD', undefined, undefined, function (error, result) {
        result = true;
        if (error instanceof IONoEntry) {
            result = false;
            error = undefined;
        }
        return [error, result];
    });
    _p.dirExists = _dirify(_p.fileExists);       
    _p.pathExists = _p.fileExists; // DEPRECATED: use dirExists or fileExists

    _p.getMtime = _obtainRequestFactory('HEAD', undefined, undefined, function (error, result) {
        if (!error)
            result = new Date(result.getResponseHeader('Last-Modified'));
        return [error, result];
    });

    _p.readDir = _dirify(_obtainRequestFactory('GET', undefined, undefined, function (error, result) {
        if (!error)
            result = result.responseText.split('\n');
        return [error, result];
    }));

    _p.mkDir = _dirify(_obtainRequestFactory('PUT', undefined, {200: true, 201: true, 204: true}, function (error, result) {
        if (result.status == 405)
            error = new IOEntryExists(_errorMessageFromRequest(result));
        return [error, result];
    }));

    _p.ensureDir = _dirify(_obtainRequestFactory('PUT', undefined, {200: true, 201: true, 204: true, 405: true}));

    _p.rmDir = _dirify(_p.unlink);


    return new Io(); // Single instance of static type
});
