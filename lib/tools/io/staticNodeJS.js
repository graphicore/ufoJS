/**
 * This is a NodeJS implementation of io/_base.
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

    if(typeof require.nodeRequire !== 'function')
        return null;

    var IOError = errors.IO
      , IONoEntry = errors.IONoEntry
       // this is node js
      , fs = require.nodeRequire('fs')
      ;

    function Io() {
        Parent.call(this);
    }

    var _p = Io.prototype = Object.create(Parent.prototype);

    var _callbackAdapterFactory = function(callback) {
        return function(error, result) {
            if(error && error.code === 'ENOENT')
                error = new IONoEntry(error.message, error.stack);
            else if(error)
                error = new IOError(error.code + ' ' + error.message, error.stack);
            callback(error, result);
        }
    }

    _p.readFile = obtain.factory(
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

    _p.writeFile = obtain.factory(
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

    _p.unlink = obtain.factory(
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

    _p.readBytes = obtain.factory(
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
                fs.open(path, 'r', onFile);
            }]
        }
      , ['path', 'bytes']
      , function(obtain){ return obtain('readBytes'); }
    );

    _p.stat = obtain.factory(
        {
            stat:['path', function(path) {
                try {
                    return fs.statSync(path);
                }
                catch(error) {
                    if(error.code === 'ENOENT')
                        throw new IONoEntry(error.message, error.stack);
                    throw error;
                }
            }]
        }
      , {
            stat:['path', '_callback', fs.stat]
        }
      , ['path']
      , function(obtain){ return obtain('stat'); }
    );

    _p.pathExists = obtain.factory(
        {
            pathExists:['path', fs.existsSync]
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

    _p.getMtime = obtain.factory(
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

    /**
     * raises IOError if dir can't be deleted
     */
    _p.readDir = obtain.factory(
        {
            readDir:['path', fs.readdirSync]
        }
      , {
            readDir:['path', '_callback',
            function(path, callback) {
                fs.readdir(path, callback);
            }]
        }
      , ['path']
      , function(obtain){ return obtain('readDir'); }
    );

    /**
     * raises IOError if dir can't be created
     */
    _p.mkDir = obtain.factory(
        {
            mkDir:['path', function(path) {
                try {
                    return fs.mkdirSync(path)
                }
                catch(error) {
                    if(error.code !== 'EEXIST')
                        // skip if dir already existed
                        throw new IOError(error.code + ' ' + error.message, error.stack);
                }
            }]
        }
      , {
            mkDir:['path', '_callback',
            function(path, callback) {
                var callback = _callbackAdapterFactory(callback)
                  , callbackSkipEEXIST = function(err) {
                        if(err && error.code === 'EEXIST')
                            err = undefined;
                        callback(err)
                    };
                fs.mkdir(path, callbackSkipEEXIST)
            }]
        }
      , ['path']
      , function(obtain){ return obtain('mkDir'); }
    );

    /**
     * raises IOError if dir can't be deleted
     */
    _p.rmDir = obtain.factory(
        {
            rmDir:['path', function(path) {
                try {
                    return fs.rmdirSync(path)
                }
                catch(error) {
                    if(error.code !== 'ENOENT')
                        // skip if dir does not exist
                        throw new IOError(error.code + ' ' + error.message, error.stack);
                }
            }]
        }
      , {
            rmDir:['path', '_callback',
            function(path, callback) {
                var callback = _callbackAdapterFactory(callback)
                  , callbackSkipENOENT = function(err) {
                        if(err && error.code === 'ENOENT')
                            err = undefined;
                        callback(err)
                    };
                fs.rmdir(path, callbackSkipEEXIST)
            }]
        }
      , ['path']
      , function(obtain){ return obtain('rmDir'); }
    );

    return new Io(); // Single instance of static type
});
