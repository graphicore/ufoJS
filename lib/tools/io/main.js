"use strict";
/**
 * This is a simple wrapper for asychronous I/O (just I actually) for
 * nodejs or the browser.
 * 
 * Its a stub to create the minimal needed filesystem functionality.
 * This might see heavy changes in the future
 */
define(['ufojs/errors'], function(errors) {
    var IOError = errors.IO;
    
    errors.warn('Make the mtime methods behave right, the async ones need better error handling');
    /**
     * readfile:
     * both implementations assume a callback with the arguments (error, data)
     * when error is not 'null' or 'undefined' there was an error
     * The from parameter is not changed at all
     */
    if (typeof process !== 'undefined') {
        // this is node js
        var fs = require.nodeRequire('fs');
        
        var _0666 = parseInt('0666', 8);
        
        var readFile = function (from, callback) {
            fs.readFile(from, 'utf-8', callback);
        }
        
        var readFileSync = function(from) {
            return fs.readFileSync(from, 'utf-8');
        };
        
        var readBytes= function(path, bytes, callback) {
            var onFile = function(err, fd) {
                if(err) {
                    callback(err);
                    return;
                }
                var buffer = new Buffer(bytes);
                fs.read(fd, buffer, 0, bytes, 0, onRead);
            },
            onRead = function(err, bytesRead, buffer) {
                if(err) {
                    callback(err);
                    return;
                }
                callback(undefined, buffer.toString('binary', 0, bytes));
            }
            fs.open(path, 'r', _0666, onFile);
        }
        
        var readBytesSync = function(path, bytes) {
            var file = fs.openSync(path, 'r'),
               buffer = new Buffer(bytes),
               read = fs.readSync(file, buffer, 0, bytes, 0);
            fs.closeSync(file);
            return buffer.toString('binary', 0, bytes);
        }
        
        var pathExists = function(p, callback) {
            return fs.exists(p, callback);
        }
        var pathExistsSync = function(p) {
            return fs.existsSync(p);
        }
        var getMtime = function(path, callback){
            fs.stat(path, function(status, result){callback(result.mtime)});
        };
        var getMtimeSync = function(path) {
            return fs.statSync(path).mtime;
        };
        
    } else {
        // assume this is in the browser
        var readFile = function(from, callback) {
            var request = new XMLHttpRequest();
            request.open('GET', from, true);
            request.onreadystatechange = function (aEvt) {
                if (request.readyState != 4) return;
                else if (request.status === 200)
                    callback(undefined, request.responseText);
                else
                    callback(new IOError(['Status', request.status,request.statusText].join(' ')), undefined);
            }
            request.send(null);
        };
        
        var readFileSync = function(from) {
            var request = new XMLHttpRequest();
            request.open('GET', from, false);
            request.send(null);
            if(request.status !== 200)
                throw new IOError(
                    ['Status', request.status,request.statusText].join(' '));
            
            return request.responseText;
        };
        
        var readBytes= function(path, bytes, callback) {
            var request = new XMLHttpRequest();
            request.open('GET', path, true);
            request.responseType = 'arraybuffer';
            request.onreadystatechange = function (aEvt) {
                if (request.readyState != 4 /*DONE*/) return;
                else if (request.status === 200) {
                    var  newChunk =  new Uint8Array(request.response, 0, bytes);
                    callback(undefined, String.fromCharCode.apply(null, newChunk));
                }
                else
                    callback(new IOError(['Status', request.status,request.statusText].join(' ')), undefined);
            }
            request.send(null);
        }
        
        var readBytesSync = function(path, bytes) {
            var request = new XMLHttpRequest();
            request.open('GET', path, false);
            // so there is no conversion by the browser
            request.overrideMimeType('text\/plain; charset=x-user-defined');
            request.send(null);
            if(request.status !== 200)
                throw new IOError(
                    ['Status', request.status,request.statusText].join(' '));
            var chunk = request.response.slice(0, bytes),
                newChunk = new Uint8Array(bytes);
            // throw away high-order bytes (F7)
            for(var i=0; i<chunk.length; i++)
                newChunk[i] = chunk.charCodeAt(i);
            return String.fromCharCode.apply(null, newChunk);
        }
        
        var pathExists = function(p, callback) {
            var request = new XMLHttpRequest();
            request.open('HEAD', p, true);
            request.onreadystatechange = function (aEvt) {
                if (request.readyState != 4) return;
                callback(request.status === 200);
            }
            request.send(null);
        }
        var pathExistsSync = function(p) {
            var request = new XMLHttpRequest();
            request.open('HEAD', p, false);
            request.send(null);
            return request.status === 200;
        }
        var getMtime = function(path, callback){var request = new XMLHttpRequest();
            request.open('HEAD', path, true);
            request.onreadystatechange = function (aEvt) {
                if (request.readyState != 4) return;
                
                if(request.status === 200)
                    callback(new Date(request.getResponseHeader('Last-Modified')));
                else
                    callback(new IOError(['Status', request.status,request.statusText].join(' ')), undefined);
            }
            request.send(null);
        };
        var getMtimeSync = function(path){
            var request = new XMLHttpRequest();
            request.open('HEAD', path, false);
            request.send(null);
            return new Date(request.getResponseHeader('Last-Modified'));
        };
        
    }
    
    return {
        readFile: readFile,
        readFileSync: readFileSync,
        readBytes: readBytes,
        readBytesSync: readBytesSync,
        pathExists: pathExists,
        pathExistsSync: pathExistsSync,
        getMtime: getMtime,
        getMtimeSync: getMtimeSync
    };
});
