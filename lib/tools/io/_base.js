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
 * there is no good cross plattform solution for I/O. So we move slow and
 * see what we need to do.
 */
define([
    'ufojs/errors'
  , 'obtain/obtain'

], function(
    errors
  , obtain
) {
    "use strict";
    
    var NotImplementedError = errors.NotImplemented
      , Parent = Object
      ;

    function io() {
        /*jshint validthis:true */
        Parent.call(this);
    }

    var _p = io.prototype = Object.create(Parent.prototype);

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
    
    /**
     * raises IOError if dir doesn't exist
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
     * Implemented in terms of other io methods
     */
    _p.rmDirRecursive = obtain.factory(
        {
            rmDirRecursive:['dir', function(dir) {
                var objs = this.readDir(false, dir);
                for(var i = 0; i < objs.length; i++) {
                    var obj = dir + '/' + objs[i]; // path.join is node-specific
                    (this.stat(false, obj).isDirectory() ? this.rmDirRecursive : this.unlink)(false, obj);
                }
                this.rmDir(false, dir);
            }]
        }
      // For an async implementation, try starting here:
      // https://gist.github.com/yoavniran/adbbe12ddf7978e070c0
      , {/* no need for async here */}
      , ['dir']
      , function(obtain){ return obtain('rmDirRecursive'); }
    );

    return io;
});
