/**
 * This is a simple wrapper for asychronous I/O (just I actually) for
 * nodejs or the browser. Its only used for testing of the code currently.
 */
define(['ufojs/errors'], function(errors){
    var IOError = errors.IO;
    /**
     * readfile:
     * both implementations assume a callback with the arguments (error, data)
     * when error is not 'null' or 'undefined' there was an error
     * The from parameter is not changed at all
     */
    if (typeof process !== 'undefined') {
        // this is node js
        var fs = require.nodeRequire('fs');
        var readFile = function (from, callback) {
            fs.readFile(from, 'utf-8', callback);
        }
    } else {
        // assume this is in the browser
        var readFile = function(from, callback) {
            var request = new XMLHttpRequest();
            request.open('GET', from, true);
            request.onreadystatechange = function (aEvt) {
                if (request.readyState != 4) return;
                if (request.status === 200)
                    callback(undefined, request.responseText);
                else
                    callback(new IOError(['Status', request.status,request.statusText].join(' ')), undefined);
            }
            request.send(null);
        }
    }
    
    return {readFile: readFile};
});
