define([
    'obtain/obtain'
  , 'path'
  , 'jszip'
  , './readDirRecursive'
  , 'Atem-IO/errors'
], function(
    obtain
  , path
  , JSZip
  , readDirRecursive
  , errors
) {
    "use strict";

    var NotImplementedError = errors.NotImplemented
      , assert = errors.assert
      ;

    function _unpack(async/*boolean!*/, zip, io, targetPath) {
        if(!async)
            throw new NotImplementedError('Synchronous ZIP reading is '
                            + 'no longer supported by the jszip library.');
        var files = zip.files
          , filename
          , file
          , filePath
          , separator
          , promises = []
          , dir
          , writeFile
          ;

        for (filename in files) {
            file = files[filename];
            separator = targetPath.slice(-1) === '/'  ? '' : '/';
            filePath = [targetPath, file.name].join(separator);
            if (file.dir)
                promises.push(io.ensureDirs(async, filePath));
            else {
                writeFile = io.writeFile.bind(io, async, filePath /*, data */);
                dir = path.dirname(filePath);
                if(async)
                    promises.push(io.ensureDirs(true, dir)
                        .then(file.async.bind(file, 'binarystring'))
                        .then(writeFile)
                );
                else {
                    // synchronous
                    io.ensureDirs(false, dir);
                    writeFile(file.sync('binarystring'));
                }
            }
        }
        if(!async)
            return;
        if(promises.length)
            return Promise.all(promises);
        // There was nothing to unpack
        return Promise.resolve();
    }

    var unpack = obtain.factory(
        {
            zip: [function () {
                throw new NotImplementedError('Synchronous ZIP unpack is '
                            + 'no longer supported by the jszip library.');
            }]
            // Putting this here in case jszip adds back sync unzipping.
          , unpacked: [false, 'zip', 'io', 'targetPath', _unpack]
        }
      , {
            zip: ['zipData', function (zipData) {
                return new JSZip().loadAsync(zipData);
            }]
          , unpacked: [true, 'zip', 'io', 'targetPath', _unpack]
        }
      , ['zipData', 'io', 'targetPath']
      , function (obtain) { return obtain('unpacked'); }
    );

    function _readFiles (async/*boolean!*/, io, files) {
        var i, l, data = [];
        for(i=0,l=files.length;i<l;i++)
            data.push(io.readFile(async, files[i]));
        if(!async)
            return data;
        if(data.length)
            return Promise.all(data);
        // empty data, proper async answer
        return Promise.resolve([]);
    }

    var pack = obtain.factory(
        {
            files: [false, 'io', 'sourcePath', readDirRecursive]
          , data: [false, 'io', 'files', _readFiles]
            // Maybe this changes again.
          , generate: [function () {
                 throw new NotImplementedError('Synchronous ZIP generation is '
                                + 'no longer supported by the jszip library.');
            }]
          , zip: ['files', 'data', function (files, data) {
                var zip = new JSZip()
                  , i, l
                  ;
                assert(files.length === data.length, 'files and data must '
                                                + 'have the same length');
                for(i=0,l=files.length;i<l;i++)
                    zip.file(files[i], data[i], {binary:true});
                return zip;
            }]
        }
      , {
            files: [true, 'io', 'sourcePath', readDirRecursive]
          , data: [true, 'io', 'files', _readFiles]
          , generate: ['zip', 'dataType', function (zip, dataType) {
                var options = {
                    type: dataType || 'base64'
                };
                return zip.generateAsync(options);
            }]
        }
      , ['io', 'sourcePath', 'dataType']
      , function (obtain) { return obtain('generate'); }
    );

    return {
        unpack: unpack,
        pack: pack,
        // deprecated:
        encode: pack
    };
});
