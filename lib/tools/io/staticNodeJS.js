/**
 * This is a simple NodeJS implementation for io/_base.
 */
define([
    'ufojs/errors'
  , 'ufojs/obtainJS/lib/obtain'

], function(
    errors
  , obtain
) {
    "use strict";
    
    if(typeof require.nodeRequire !== 'function')
        return;
    
    var IOError = errors.IO
      , IONoEntry = errors.IONoEntry
       // this is node js
      , fs = require.nodeRequire('fs')
      ,  _0666 = parseInt('0666', 8)
      ;
    
    var _callbackAdapterFactory = function(callback) {
        return function(error, result) {
            if(error && error.code === 'ENOENT')
                error = new IONoEntry(error.message, error.stack);
            callback(error, result);
        }
    }
    
    var readFile = obtain.factory(
        {
            readFile:['path', function(path) {
                try {
                    return fs.readFileSync(path, 'utf-8');
                }
                catch(error) {
                    if(error.code === 'ENOENT')
                        throw new IONoEntry(error.message, error.stack);
                    throw error;
                }
            }]
        }
      , {
            readFile:['path', '_callback', function(path, callback) {
                callback = _callbackAdapterFactory(callback)
                fs.readFile(path, 'utf-8', callback);
            }]
        }
      , ['path']
      , function(obtain){ return obtain('readFile'); }
    );
    
    var writeFile = obtain.factory(
        {
            writeFile:['path', 'data', function(path, data) {
                try {
                    return fs.writeFileSync(path, data);
                }
                catch(error) {
                    if(error.code === 'ENOENT')
                        throw new IONoEntry(error.message, error.stack);
                    throw error;
                }
            }]
        }
      , {
            writeFile:['path', 'data', '_callback',
            function(path, data, callback) {
                callback = _callbackAdapterFactory(callback)
                fs.writeFile(path, data, callback)
            }]
        }
      , ['path', 'data']
      , function(obtain){ return obtain('writeFile'); }
    );
    
    var unlink = obtain.factory(
        {
            unlink:['filename', function(filename) {
                try {
                    return fs.unlinkSync(filename);
                }
                catch(error) {
                    if(error.code === 'ENOENT')
                        throw new IONoEntry(error.message, error.stack);
                    throw error;
                }
            }]
        }
      , {
            unlink:['filename', '_callback', function(filename, callback) {
                callback = _callbackAdapterFactory(callback);
                fs.unlink(filename, callback);
            }]
        }
      , ['filename']
      , function(obtain){ return obtain('unlink'); }
    );
    
    var readBytes = unlink = obtain.factory(
        {
            readBytes:['path', 'bytes', function(path, bytes) {
                var file
                 , buffer = new Buffer(bytes)
                 , read
                 ;
                try {
                    file = fs.openSync(path, 'r');
                }
                catch(error) {
                    if(error.code === 'ENOENT')
                        throw new IONoEntry(error.message, error.stack);
                    throw error;
                }
                
                fs.readSync(file, buffer, 0, bytes, 0);
                fs.closeSync(file);
                return buffer.toString('binary', 0, bytes);
            }]
        }
      , {
            readBytes:['path', 'bytes', '_callback',
            function(path, bytes, callback) {
                callback = _callbackAdapterFactory(callback)
                
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
            }]
        }
      , ['path', 'bytes']
      , function(obtain){ return obtain('readBytes'); }
    );
    
    var pathExists = obtain.factory(
        {
            pathExists:['path', function(path) {
                return fs.existsSync(path);
            }]
        }
      , {
            pathExists:['path', '_callback', '_errback',
            function(path, callback, errback) {
                return fs.exists(path, callback);
            }]
        }
      , ['path']
      , function(obtain){ return obtain('pathExists'); }
    );
    
    var getMtime = obtain.factory(
        {
            getMtime:['path', function(path) {
                try {
                    return fs.statSync(path).mtime;
                }
                catch(error) {
                    if(error.code === 'ENOENT')
                        throw new IONoEntry(error.message, error.stack);
                    throw error;
                }
            }]
        }
      , {
            getMtime:['path', '_callback', function(path, callback) {
                callback = _callbackAdapterFactory(callback);
                function distillMtimeCallback(error, statObject) {
                    var mtime = statObject
                                    ? statObject.mtime
                                    : undefined;
                    callback(error, mtime)
                }
                fs.stat(path, distillMtimeCallback);
            }]
        }
      , ['path']
      , function(obtain){ return obtain('getMtime'); }
    );
    
    return {
        readFile: readFile
      , writeFile: writeFile
      , unlink: unlink
      , readBytes: readBytes
      , pathExists: pathExists
      , getMtime: getMtime
    };
});
