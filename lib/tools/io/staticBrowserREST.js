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
    /*global XMLHttpRequest: true*/
    /*global ArrayBuffer: true*/
    /*global Uint8Array: true*/
    
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
    };

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
    };
    
    var _path2uri = function(path) {
        return path.split('/').map(encodeURIComponent).join('/');
    };

    // We signal a directory to the REST endpoint by adding a / suffix
    var _dirify = function (f) {
        function decorate (path){return path + (path.slice(-1) !== '/' ? '/' : '');}
        return function (async, path /*, data? ... */) {
            var args = Array.prototype.slice.call(arguments);
            // decorate path
            args[1] = decorate(args[1]);
            return f.apply(this, args);
        };
    };

    // Perform a synchronous or asynchronous request
    // FIXME: once ES6 arrives, use separate resolve/reject handlers
    // instead of resultFilter
    var _obtainRequestFactory = function (method, responseType, okStatus
                                    , resultFilter, resultFilterArgs) {
        var dataArg = (method in {'PUT': true, 'POST': true}) ? 'data': undefined
          , api = ['path']
          ;
        resultFilter = resultFilter || function (err, request) { return [err, !!err]; };
        okStatus = okStatus || {200: true};
        if(dataArg)
            api.push(dataArg);
        resultFilterArgs = resultFilterArgs || [];
        Array.prototype.push.apply(api, resultFilterArgs);

        // return the send request (with response available)
        // do it async if callback is present, otherwise return directly
        function doRequest(path, data, callback) {
            var request = new XMLHttpRequest();
            request.open(method, _path2uri(path), !!callback);
            if(callback) {
                // Firefox: Use of XMLHttpRequest's responseType attribute
                // is no longer supported in the synchronous mode in window
                // context
                request.responseType = responseType;
                request.onreadystatechange = function (aEvt) {
                    if (request.readyState != 4 /*DONE*/)
                        return;
                    callback(null, request);
                };
            }
            else {
                // because setting response type is not possible in sync mode
                // we have to add a workaround by hand:
                if(responseType === 'arraybuffer')
                    // so there is no conversion by the browser
                    request.overrideMimeType('text/plain; charset=x-user-defined');
            }
            request.send(data);
            if(!callback)
                return request;
        }

        function job(obtain/*, [api ...] */) {
            var request = obtain('request')
                , error
                , result
                , callFilterArgs
                ;
            if(!(request.status in okStatus))
                error = _errorFromRequest(request);
            callFilterArgs = [error, request];
            Array.prototype.push.apply(callFilterArgs,
                // extract the resultFilterArgs from this method's arguments
                Array.prototype.slice.call(arguments, -resultFilterArgs.length));
            result = resultFilter.apply(null, callFilterArgs);
            if(result[0])
                throw result[0];
            return result[1];
        }

        return obtain.factory(
            {request: ['path', dataArg, doRequest]}
          , {request: ['path', dataArg, '_callback', doRequest]}
          , api
          , job
        );
    };

    // The file methods
    _p.readFile = _obtainRequestFactory('GET', undefined, undefined, function(error, request) {
        var result = !error ? request.responseText : undefined;
        return [error, result];
    });

    _p.writeFile = _obtainRequestFactory('PUT', undefined, {200: true, 204: true});

    // We don't read the LOCATION headers of the response, as the expected
    // behavior of the server is to create or to append to the effective
    // request URI.
    _p.appendFile = _obtainRequestFactory('POST', undefined, undefined);

    _p.unlink = _obtainRequestFactory('DELETE', undefined, {200: true, 204: true});

    // takes as a seccond argument "bytes" which is the amount of bytes to read!
    _p.readBytes = _obtainRequestFactory('GET', 'arraybuffer', undefined, function (error, request, bytes) {
        var result, chunk, rawChunk;
        if(error){}// pass
        // synchronous requests can't set request.responseType = 'arraybuffer'
        else if(request.response instanceof ArrayBuffer)
            chunk = new Uint8Array(request.response, 0, bytes);
        else {
            rawChunk = request.response.slice(0, bytes),
            chunk = new Uint8Array(bytes);
            // throw away high-order bytes (F7)
            for(var i=0; i<rawChunk.length; i++)
                chunk[i] = rawChunk.charCodeAt(i);
        }
        if(!error)
            result = String.fromCharCode.apply(null, chunk);
        return [error, result];
    }, ['bytes']);

    _p.fileExists = _obtainRequestFactory('HEAD', undefined, undefined, function (error, request) {
        return [(error instanceof IONoEntry) ? null : error, !(error instanceof IONoEntry)];
    });
    _p.dirExists = _dirify(_p.fileExists);
    _p.pathExists = _p.fileExists; // DEPRECATED: use dirExists or fileExists

    _p.getMtime = _obtainRequestFactory('HEAD', undefined, undefined, function (error, request) {
        var result = !error ? new Date(request.getResponseHeader('Last-Modified')) : undefined;
        return [error, result];
    });

    _p.readDir = _dirify(_obtainRequestFactory('GET', undefined, undefined, function (error, request) {
        var result = !error ? request.responseText.split('\n').filter(function(line){return !!line;}) : undefined;
        return [error, result];
    }));

    _p.mkDir = _dirify(_obtainRequestFactory('PUT', undefined, {200: true, 201: true, 204: true}, function (error, result) {
        if (result.status == 405)
            error = new IOEntryExists(_errorMessageFromRequest(result));
        return [error, !!error];
    }));

    _p.ensureDir = _dirify(_obtainRequestFactory('PUT', undefined, {200: true, 201: true, 204: true, 405: true}));

    _p.rmDir = _dirify(_p.unlink);

    return new Io(); // Single instance of static type
});
