/**
 * StaticIO means this module needs no initialization
 * 
 * This module switches the I/O implementation according to the platform.
 * 
 * This module will disappear eventually, because we can use the requireJS
 * configuration to switch there.
 */
if(typeof require.nodeRequire !== 'function')
    define(['./staticBrowserREST'], function(io){ return io;});
else
    define(['./staticNodeJS'], function(io){ return io;});
