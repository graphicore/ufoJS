define([], function(){
    "use strict";

    // this is configuration that is shared between all configuration
    // targets. I.e. Node.js and Browsers at the moment
    return {
        paths: {
            'Atem-CPS': '%bower%/Atem-CPS/lib'
          , 'Atem-CPS-whitelisting': '%bower%/Atem-CPS-whitelisting/lib'
          , 'Atem-Errors': '%bower%/Atem-Errors/lib'
          , 'Atem-IO': '%bower%/Atem-IO/lib'
          , 'Atem-Math-Tools': '%bower%/Atem-Math-Tools/lib'
          , 'Atem-Pen-Case': '%bower%/Atem-Pen-Case/lib'
          , 'Atem-Property-Language': '%bower%/Atem-Property-Language/lib'
          , 'obtain': '%bower%/obtainjs/lib'
          , 'complex': '%bower%/complex/lib'
          , 'gonzales': '%bower%/gonzales/amd'
          , 'bloomfilter': '%bower%/bloomfilter.js/bloomfilter'
          , 'ufojs': '%bower%/ufoJS/lib'

          , 'require/text': '%bower%/requirejs-text/text'
          , 'path': '%bower%/path/path'
          , 'yaml': '%bower%/js-yaml/dist/js-yaml.min'
          , 'jszip': '%bower%/jszip/dist/jszip'
          , 'EventEmitter': '%bower%/event-emitter.js/dist/event-emitter'
          , 'opentype': '%bower%/opentype.js/dist/opentype.min'

            // Atem applications must override their own path in their own setup
          , 'metapolator': '%bower%/metapolator/app/lib'
          , 'BEF': '%bower%/Bauhaus-Emblem-Font/app/lib'

        }
    };
});
