define([
    'Atem-IO/errors'
  , 'obtain/obtain'
], function(
    errors
  , obtain
) {
    "use strict";

    var IOMaxRecursionError = errors.IOMaxRecursion;
    /**
     * when name ends with a slash it is a directory name
     */
    function _isDirName(name) {
        return name.slice(-1) === '/';
    }

    /**
     * Read an entire directory tree into a flat list of filenames.
     *
     * use this with caution:
     * It may run long and need a lot of memory for large/deep directories.
     * Also, the result may not be correct anymore when it's done.
     * This is why we don't use it as a standard io function.
     * A better approach for large trees may be an iterator based
     * implementation.
     */
    var _readDirRecursive = obtain.factory(
        {
            names: ['io', 'path', function(io, path) {
                return io.readDir(false, path);
            }]
          , readDir: ['io', 'names', 'path', 'depth', 'maxDepth',
            function(io, names, path, depth, maxDepth) {
                var i
                  , name
                  , fullPath
                  , children
                  , result = []
                  ;
                for(i=0;i<names.length;i++) {
                    name = names[i];
                    fullPath = [path, name].join(
                                    path.slice(-1) === '/' ? '' : '/');
                    if(_isDirName(name)) {
                        children = _readDirRecursive(false, io, fullPath
                                                    , depth+1, maxDepth);
                        Array.prototype.push.apply(result, children);
                    }
                    else
                        result.push(fullPath);
                }
                return result;
            }]
        }
      , {
            names: ['io', 'path', function(io, path) {
                return io.readDir(true, path);
            }]
          , readDir: ['io', 'names', 'path', 'depth', 'maxDepth', '_callback',
            function(io, names, path, depth, maxDepth, callback) {
                var i
                  , name
                  , loaded = 0
                  , loading = 0
                  , fullPath
                  , failed = false
                  , promise
                  , result = []
                  ;
                function finalize(children) {
                    if(failed) return;
                    Array.prototype.push.apply(result, children);
                    loaded++;
                    if(loaded === loading)
                        callback(null, result);
                }
                function fail(error) {
                    failed = true;
                    callback(error, null);
                }
                for(i=0;i<names.length;i++) {
                    name = names[i];
                    fullPath = [path, name].join(
                                        path.slice(-1) === '/' ? '' : '/');
                    if(_isDirName(name)) {
                        loading++;
                        promise = _readDirRecursive(true, io, fullPath
                                                    , depth+1, maxDepth)
                        .then(finalize, fail);
                    }
                    else
                        result.push(fullPath);
                }
                if(!loading)
                    setTimeout(callback, 0, null, result);
            }]
        }
      , ['io', 'path', 'depth', 'maxDepth']
      , function(obtain, path, depth, maxDepth) {
            if(depth > maxDepth)
                throw new IOMaxRecursionError('Maximum recusion depth ('
                                                + maxDepth + ') reached.');
            return obtain('readDir');
        }
    );

    function readDirRecursive(async, io, path, maxDepth /* default 100 */) {
        var md = maxDepth === undefined ? 100 : maxDepth;
        return _readDirRecursive(async, io, path, 0, md);
    }
    return readDirRecursive;
});
