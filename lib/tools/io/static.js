/**
 * StaticIO means this module needs no initialization
 * 
 * This module switches the I/O implementation according to the platform.
 * 
 * This module will disappear eventually, because we can use the requireJS
 * configuration to switch there.
 */
define([
    './staticBrowserREST'
  , './staticNodeJS'
], function(
    browser
  , node
) {
    "use strict";
    if(typeof require.nodeRequire !== 'function')
        return browser;
    else
        return node;
});
