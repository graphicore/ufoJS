define([
    './restfs'
  , './fsEventsServer'
  , 'SocketIO'
], function(
    restfs
  , fsEventsServer
  , socketIO
) {
    "use strict";
    function serveAndMonitor(app, server, location, baseDir) {
        var relativeLocation = location[0] === '/'
                ? location.slice(1)
                : location
          , socketServer = socketIO(server)
          , socketNamespace = socketServer.of('/fsEvents/' + relativeLocation)
          ;
        app.use(location, restfs(baseDir));
        return fsEventsServer.createEmitter(
                            socketNamespace, baseDir, relativeLocation + '/');
    }

    return serveAndMonitor;
});
