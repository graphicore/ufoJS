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
    
    /*global require: true*/
    /*global Buffer: true*/
    
    var IOError = errors.IO
      , IONoEntry = errors.IONoEntry
      , IOEntryExists = errors.IOEntryExists
       // this is node js
      , fs = require.nodeRequire('fs')
      ;

    function Io() {
        Parent.call(this);
    }

    var _p = Io.prototype = Object.create(Parent.prototype);

    var _errorMap = {
        'ENOENT': IONoEntry
      , 'EEXIST': IOEntryExists
    };
    var _errorFromIOError = function(error) {
        if(error) {
            var Ctor = _errorMap[error.code];
            if (Ctor)
                error = new Ctor(error.message, error.stack);
            else
                error = new IOError(error.code + ' ' + error.message, error.stack);
        }
        return error;
    };

    var _callbackAdapterFactory = function(callback) {
        return function(error, result) {
            error = _errorFromIOError(error);
            callback(error, result);
        };
    };

    _p.readFile = obtain.factory(
        {
            readFile:['path', function(path) {
                try {
                    return fs.readFileSync(path, 'utf-8');
                }
                catch(error) {
                    throw _errorFromIOError(error);
                }
            }]
        }
      , {
            readFile:['path', '_callback', function(path, callback) {
                callback = _callbackAdapterFactory(callback);
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
                    throw _errorFromIOError(error);
                }
            }]
        }
      , {
            writeFile:['path', 'data', '_callback',
            function(path, data, callback) {
                callback = _callbackAdapterFactory(callback);
                fs.writeFile(path, data, callback);
            }]
        }
      , ['path', 'data']
      , function(obtain){ return obtain('writeFile'); }
    );

    _p.appendFile = obtain.factory(
        {
            appendFile:['path', 'data', function(path, data) {
                try {
                    return fs.appendFileSync(path, data);
                }
                catch(error) {
                    throw _errorFromIOError(error);
                }
            }]
        }
      , {
            appendFile:['path', 'data', '_callback',
            function(path, data, callback) {
                callback = _callbackAdapterFactory(callback);
                fs.appendFile(path, data, callback);
            }]
        }
      , ['path', 'data']
      , function(obtain){ return obtain('appendFile'); }
    );

    _p.unlink = obtain.factory(
        {
            unlink:['filename', function(filename) {
                try {
                    return fs.unlinkSync(filename);
                }
                catch(error) {
                    throw _errorFromIOError(error);
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
                    throw _errorFromIOError(error);
                }

                fs.readSync(file, buffer, 0, bytes, 0);
                fs.closeSync(file);
                return buffer.toString('binary', 0, bytes);
            }]
        }
      , {
            readBytes:['path', 'bytes', '_callback',
            function(path, bytes, callback) {
                callback = _callbackAdapterFactory(callback);

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
                };
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
                    throw _errorFromIOError(error);
                }
            }]
        }
      , {
            stat:['path', '_callback', function(path, callback) {
                callback = _callbackAdapterFactory(callback);
                fs.stat(path, callback);
            }]
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
                    throw _errorFromIOError(error);
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
                    callback(error, mtime);
                }
                fs.stat(path, distillMtimeCallback);
            }]
        }
      , ['path']
      , function(obtain){ return obtain('getMtime'); }
    );

    _p.readDir = obtain.factory(
        {
            names:['path', fs.readdirSync.bind(fs)]
          , readDir: ['path', 'names',
            function(path, names) {
                var i=0;
                for(;i<names.length;i++)
                    if(fs.statSync(path+'/'+names[i]).isDirectory())
                        names[i] += '/';
                return names;
            }]
        }
      , {
            names:['path', '_callback', fs.readdir.bind(fs)]
          , readDir: ['path', 'names', '_callback',
            function(path, names) {
                var i = 0
                  , failed = false
                  , resolved = 0
                  , callback = function(names, i, err, stat) {
                        resolved++;
                        if(failed) return; // failed already
                        if(err) {
                            failed = true;
                            callback(err);
                            return;
                        }
                        if(stat.isDirectory())
                            names[i] += '/';
                        if(resolved === names.length)
                            callback(undefined, names);
                    }
                  ;
                for(;i<names.length;i++)
                    fs.stat(path+'/'+names[i], callback.bind(null, names, i));
          }]
        }
      , ['path']
      , function(obtain){ return obtain('readDir'); }
    );

    _p.mkDir = obtain.factory(
        {
            mkDir:['path', function(path) {
                try {
                    return fs.mkdirSync(path);
                }
                catch(error) {
                    throw _errorFromIOError(error);
                }
            }]
        }
      , {
            mkDir:['path', '_callback',
            function(path, callback) {
                fs.mkdir(path, _callbackAdapterFactory(callback));
            }]
        }
      , ['path']
      , function(obtain){ return obtain('mkDir'); }
    );

    _p.ensureDir = obtain.factory(
        {
            ensureDir:['path', function(path) {
                try {
                    return this.mkDir(false, path);
                }
                catch(error) {
                    if(!(error instanceof IOEntryExists))
                        throw error;
                    return 0;
                }
            }]
        }
      , {
            ensureDir:['path', '_callback',
            function(path, callback) {
                var callbackSkipIOEntryExists = function(err, result) {
                        if(err instanceof IOEntryExists)
                            err = undefined;
                        callback(err, result);
                    };
                this.mkDir({unified: callbackSkipIOEntryExists}, path);
            }]
        }
      , ['path']
      , function(obtain){ return obtain('ensureDir'); }
    );

    _p.rmDir = obtain.factory(
        {
            rmDir:['path', function(path) {
                try {
                    return fs.rmdirSync(path);
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
                var _callback = _callbackAdapterFactory(callback)
                  , callbackSkipENOENT = function(err) {
                        if(err && err.code === 'ENOENT')
                            err = undefined;
                        _callback(err);
                    };
                fs.rmdir(path, callbackSkipENOENT);
            }]
        }
      , ['path']
      , function(obtain){ return obtain('rmDir'); }
    );

    return new Io(); // Single instance of static type
});
