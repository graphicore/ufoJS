/**
 * This describes the API that is expected of all I/O modules.
 *
 * It makes heavy use of obtainJS.
 *
 * You can and should use this module as prototype for your implementation
 * (if there is inheritance). We might use that as a base for unit-testing,
 * however ufoJS will use ducktyping and just expect your implementation
 * to work.
 *
 * All methods raise errors.NotImplemented
 *
 * This API is by no means fixed! It's still in exploring state, AFAIK
 * there is no good cross platform solution for I/O. So we move slowly and
 * see what we need to do.
 */
define([
    'Atem-IO/errors'
  , 'obtain/obtain'

], function(
    errors
  , obtain
) {
    "use strict";
    //jshint unused: false
    var NotImplementedError = errors.NotImplemented
      , IOError = errors.IO
      , Parent = Object
      ;

    function io() {
        /*jshint validthis:true */
        Parent.call(this);
    }

    var _p = io.prototype = Object.create(Parent.prototype);


    /**
     * when name ends with a slash it is a directory name
     */
    _p.isDirName = function (name) {
        return name.slice(-1) === '/';
    };

    /**
     * raises IONoEntry when path is not found.
     */
    _p.readFile = obtain.factory(
        {
            readFile:['path', function(path) {
                throw new NotImplementedError('readFile');
            }]
        }
      , {/* no need for async here */}
      , ['path']
      , function(obtain){ return obtain('readFile'); }
    );

    /**
     * raises IONoEntry when points to a non-existent directory
     */
    _p.writeFile = obtain.factory(
        {
            writeFile:['path', 'data', function(path, data) {
                throw new NotImplementedError('writeFile');
            }]
        }
      , {/* no need for async here */}
      , ['path', 'data']
      , function(obtain){ return obtain('writeFile'); }
    );

    /**
     * raises IONoEntry when points to a non-existent directory
     */
    _p.appendFile = obtain.factory(
        {
            appendFile:['path', 'data', function(path, data) {
                throw new NotImplementedError('appendFile');
            }]
        }
      , {/* no need for async here */}
      , ['path', 'data']
      , function(obtain){ return obtain('appendFile'); }
    );

    /**
     * raises IONoEntry when path is not found.
     */
    _p.unlink = obtain.factory(
        {
            unlink:['filename', function(filename) {
                throw new NotImplementedError('unlink');
            }]
        }
      , {/* no need for async here */}
      , ['filename']
      , function(obtain){ return obtain('unlink'); }
    );

    _p.readBytes = obtain.factory(
        {
            readBytes:['path', 'bytes', function(path, bytes) {
                throw new NotImplementedError('readBytes');
            }]
        }
      , {/* no need for async here */}
      , ['path', 'bytes']
      , function(obtain){ return obtain('readBytes'); }
    );

    /**
     * raises IONoEntry when path is not found.
     */
    _p.stat = obtain.factory(
        {
            stat:['path', function(path) {
                throw new NotImplementedError('stat');
            }]
        }
      , {/* no need for async here */}
      , ['path']
      , function(obtain){ return obtain('stat'); }
    );

    /**
     * Don't use this method to check whether something exists before doing
     * an operation on it, that only creates a race condition.
     */
    _p.pathExists = obtain.factory(
        {
            pathExists:['path', function(path) {
                throw new NotImplementedError('pathExists');
            }]
        }
      , {/* no need for async here */}
      , ['path']
      , function(obtain){ return obtain('pathExists'); }
    );

    /**
     * raises IONoEntry when path is not found.
     */
    _p.getMtime = obtain.factory(
        {
            getMtime:['path', function(path) {
                throw new NotImplementedError('getMtime');
            }]
        }
      , {/* no need for async here */}
      , ['path']
      , function(obtain){ return obtain('getMtime'); }
    );

    _p.setMtime = obtain.factory(
        {
            setMtime:['path', function(path) {
                throw new NotImplementedError('setMtime');
            }]
        }
      , {/* no need for async here */}
      , ['path']
      , function(obtain){ return obtain('setMtime'); }
    );

    /**
     * Returns a list of file-names and directory-names.
     * Directory-names must end with a slash, while file-names must not.
     *
     * Raises IOError if dir doesn't exist
     */
    _p.readDir = obtain.factory(
        {
            readDir:['path', function(path) {
                throw new NotImplementedError('readDir');
            }]
        }
      , {/* no need for async here */}
      , ['path']
      , function(obtain){ return obtain('readDir'); }
    );

    /**
     * raises IOError if dir can't be created, or already exists
     */
    _p.mkDir = obtain.factory(
        {
            mkDir:['path', function(path) {
                throw new NotImplementedError('mkDir');
            }]
        }
      , {/* no need for async here */}
      , ['path']
      , function(obtain){ return obtain('mkDir'); }
    );

    /**
     * raises IOError if dir can't be created.
     *
     * Note that you can't rely on the directory actually existing after a
     * successful call: it may have been removed by the time you try to use
     * it.
     */
    _p.ensureDir = obtain.factory(
        {
            ensureDir:['path', function(path) {
                throw new NotImplementedError('ensureDir');
            }]
        }
      , {/* no need for async here */}
      , ['path']
      , function(obtain){ return obtain('ensureDir'); }
    );

    /**
     * raises IOError if dir can't be deleted
     */
    _p.rmDir = obtain.factory(
        {
            rmDir:['path', function(path) {
                throw new NotImplementedError('rmDir');
            }]
        }
      , {/* no need for async here */}
      , ['path']
      , function(obtain){ return obtain('rmDir'); }
    );

    /**
     * Just like nodes fs.remame.
     *
     * Should somehow call http://man7.org/linux/man-pages/man2/rename.2.html
     * Especially to make this true:
     *    " [...] If newpath already exists, it will be atomically replaced [...]"
     *
     * returns undefined
     */
    _p.rename = obtain.factory(
        {
            rename:['oldPath', 'newPath', function(oldPath, newPath) {
                throw new NotImplementedError('rmDir');
            }]
        }
      , {/* no need for async here */}
      , ['oldPath', 'newPath']
      , function(obtain){ return obtain('rename'); }
    );

    /**
     * Implemented in terms of other io methods
     */
    _p.rmDirRecursive = obtain.factory(
        {
            rmDirRecursive:['dir', function(dir) {
                var objs = this.readDir(false, dir)
                  , name, path
                  ;
                for(var i = 0; i < objs.length; i++) {
                    name = objs[i];
                    path = [dir, name].join('/');
                    this[this.isDirName(name)
                                ? 'rmDirRecursive'
                                : 'unlink'](false, path);
                }
                this.rmDir(false, dir);
            }]
        }
      , {
            contents: ['dir', function(dir) {
                return this.readDir(true, dir);
            }]
          , rmDirRecursive: ['dir', 'contents', '_callback', '_errback',
            function(dir, contents, callback, errback) {
                var i, l, name, path
                  , jobs = 0
                  , errors = []
                  , onSuccess
                  ;

                function reportErrors() {
                    // Just use the first
                    var error = new IOError('rmDirRecursive '
                            +'failed with the following collected Errors:\n'
                            + errors.join('\n'), errors[0].stack);
                    errback(error);
                }

                function onError(e) {
                    jobs -= 1;
                    errors.push(e);
                    if(jobs !== 0)
                        return;
                    reportErrors();
                }

                onSuccess = (function () {
                    // jshint validthis: true
                    jobs -= 1;
                    if(jobs !== 0)
                        return;
                    if(!errors.length)
                        // finalize
                        this.rmDir(true, dir).then(callback, errback);
                    else
                        reportErrors();
                }).bind(this);

                for(i=0,l=contents.length;i<l;i++) {
                    name = contents[i];
                    path = [dir, name].join('/');
                    this[this.isDirName(name)
                            ? 'rmDirRecursive'
                            : 'unlink'](true, path)
                        .then(onSuccess, onError);
                    jobs += 1;
                }
            }]

        }
      , ['dir']
      , function(obtain){ return obtain('rmDirRecursive'); }
    );

    _p.copyRecursive = obtain.factory(
        {
            names: ['sourcePath', function(path) {
                return this.readDir(false, path);
            }]
          , copyDir: ['names', 'targetIO', 'targetPath', 'sourcePath',
            function(names, targetIO, targetPath, sourcePath) {
                var i
                  , name
                  , fullTargetPath
                  , fullSourcePath
                  , data
                  ;
                for(i=0;i<names.length;i++) {
                    name = names[i];
                    fullTargetPath = [targetPath, name].join('/');
                    fullSourcePath = [sourcePath, name].join('/');
                    // FIXME: alternatively readFile(); should fail with
                    // IOIsDir if we don't use trailing slashes for directory
                    // names in readDir
                    if(this.isDirName(name)) {
                        targetIO.mkDir(false, fullTargetPath);
                        this.copyRecursive(false, fullSourcePath.slice(0, -1)
                                           , targetIO, fullTargetPath.slice(0, -1));
                    }
                    else {
                        data = this.readFile(false, fullSourcePath);
                        targetIO.writeFile(false, fullTargetPath, data);
                    }
                }
                return true;
            }]
        }
      , {
            names: ['sourcePath', function(path) {
                return this.readDir(true, path);
            }]
          , copyDir: ['names', 'targetIO', 'targetPath', 'sourcePath' , '_callback',
            function(names, targetIO, targetPath, sourcePath , callback) {
                var i
                  , name
                  , loaded = 0
                  , fullTargetPath
                  , fullSourcePath
                  , failed = false
                  , promise
                  ;
                function finalize() {
                    if(failed) return;
                    loaded++;
                    if(loaded === names.length)
                        callback(null, true);
                }
                function fail(error) {
                    failed = true;
                    callback(error, null);
                }
                if(!names.length) {
                    /* global  setTimeout: true */
                    setTimeout(callback, 0, null, true);
                    return;
                }
                for(i=0;i<names.length;i++) {
                    name = names[i];
                    fullTargetPath = [targetPath, name].join('/');
                    fullSourcePath = [sourcePath, name].join('/');
                    if(this.isDirName(name))
                        promise = targetIO.mkDir(true, fullTargetPath)
                        .then(this.copyRecursive.bind(this, true
                            , fullSourcePath.slice(0, -1)
                            , targetIO, fullTargetPath.slice(0, -1)));
                    else
                        promise = this.readFile(true, fullSourcePath)
                        .then(targetIO.writeFile.bind(targetIO, true
                                , fullTargetPath /*data is inserted by the promise*/));
                    promise.then(finalize, fail);
                }
            }]
        }
      , ['sourcePath', 'targetIO', 'targetPath']
      , function(obtain){return obtain('copyDir');}
    );

    /**
     * much like GNU `mkdir --parents my/shiny/new/path`
     */
    _p.ensureDirs = obtain.factory(
        {
            dirs: ['path', function(path) {
                var parts = path.split('/')
                  , i, l
                  ;
                for(i=1,l=parts.length;i<=l;i++)
                    this.ensureDir(false, parts.slice(0, i).join('/'));
            }]
        }
      , {
            dirs: ['path', '_callback', '_errback',
            function(path, callback, errback) {
                var parts = path.split('/')
                  , i=1, l=parts.length
                  , next
                  ;
                next = (function () {
                    // jshint validthis:true
                    if(i<=l) {
                        this.ensureDir(true, parts.slice(0, i).join('/'))
                            .then(next, errback);
                        i++;
                    }
                    else
                        // finished
                        callback();
                }).bind(this);
                // run
                next();
            }]
        }
      , ['path']
      , function(obtain){obtain('dirs');}
    );

    return io;
});
