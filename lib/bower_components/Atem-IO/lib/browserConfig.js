requirejs.config({
    baseUrl: 'lib'
  , paths: {
        'Atem-IO': './'
      , 'obtain': 'bower_components/obtainJS/lib'
      , 'jszip': 'bower_components/jszip/dist/jszip'
      , 'EventEmitter': 'bower_components/event-emitter.js/dist/event-emitter'
      , 'socketio': '../socket.io/socket.io'
      , 'path': 'bower_components/path/path'
    }
  , shim: {
        socketio: {
            exports: 'io'
        }
    }
});
