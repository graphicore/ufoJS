/**
 * This describes the API that is expected of all I/O modules.
 * 
 * It makes heavy use of obtainJS.
 * 
 * You can and should use this module as prototype for your implementation
 * (if there is ingeritance). We might use that as a base for unit-testing,
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
  , 'ufojs/obtainJS/lib/obtain'

], function(
    errors
  , obtain
) {
    "use strict";
    
    var NotImplementedError = errors.NotImplemented
    
    /**
     * raises IONoEntry when path is not found.
     */
    var readFile = obtain.factory(
        {
            readFile:['path', function(path) {
                throw new NotImplementedError('readFile');
            }]
        }
      , {/* no need for async here */}
      , ['path']
      , function(obtain){ return obtain('readfile'); }
    );
    
    
    var writeFile = obtain.factory(
        {
            writeFile:['path', 'data', function(path, data) {
                throw new NotImplementedError('writeFile');
            }]
        }
      , {/* no need for async here */}
      , ['path', 'data']
      , function(obtain){ return obtain('writeFile'); }
    );
    
    var unlink = obtain.factory(
        {
            unlink:['filename', function(filename) {
                throw new NotImplementedError('unlink');
            }]
        }
      , {/* no need for async here */}
      , ['filename']
      , function(obtain){ return obtain('unlink'); }
    );
    
    var readBytes = unlink = obtain.factory(
        {
            readBytes:['path', 'bytes', function(path, bytes) {
                throw new NotImplementedError('readBytes');
            }]
        }
      , {/* no need for async here */}
      , ['path', 'bytes']
      , function(obtain){ return obtain('readBytes'); }
    );
    
    var pathExists = obtain.factory(
        {
            pathExists:['path', function(path) {
                throw new NotImplementedError('pathExists');
            }]
        }
      , {/* no need for async here */}
      , ['path']
      , function(obtain){ return obtain('pathExists'); }
    );
    
    var getMtime = obtain.factory(
        {
            getMtime:['path', function(path) {
                throw new NotImplementedError('getMtime');
            }]
        }
      , {/* no need for async here */}
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
