module.exports = {
    nodeRequire: require
  , baseUrl: __dirname + '/app/lib'
  , paths: {
      , 'Atem-IO': './'
      , 'obtain': 'obtainJS/lib'
      , 'jszip': 'bower_components/jszip/dist/jszip'
      , 'EventEmitter': 'bower_components/event-emitter.js/dist/event-emitter'
    }
  , shim: {
        angular: {
            exports: 'angular'
        }
    }
};
