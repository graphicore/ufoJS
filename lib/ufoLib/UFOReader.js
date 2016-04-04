define([
    'ufojs/errors'
  , 'Atem-IO/errors'
  , 'obtain/obtain'
  , './_UFOBase'
  , './constants'
  , './validators'
  , './converters'
  , 'Atem-IO/tools/readDirRecursive'
  , './glifLib/GlyphSet'
], function(
    errors
  , ioErrors
  , obtain
  , Parent
  , constants
  , validators
  , converters
  , readDirRecursive
  , GlyphSet
) {
    "use strict";

    /*global setTimeout:true*/

    var UFOLibError = errors.UFOLib
      , NotImplementedError = errors.NotImplemented
      , IONoEntryError = ioErrors.IONoEntry
      , supportedUFOFormatVersions = constants.supportedUFOFormatVersions
      , METAINFO_FILENAME = constants.METAINFO_FILENAME
      , GROUPS_FILENAME = constants.GROUPS_FILENAME
      , FONTINFO_FILENAME = constants.FONTINFO_FILENAME
      , KERNING_FILENAME = constants.KERNING_FILENAME
      , LIB_FILENAME = constants.LIB_FILENAME
      , FEATURES_FILENAME = constants.FEATURES_FILENAME
      , DEFAULT_LAYER_NAME = constants.DEFAULT_LAYER_NAME
      , DEFAULT_GLYPHS_DIRNAME = constants.DEFAULT_GLYPHS_DIRNAME
      , DATA_DIRNAME = constants.DATA_DIRNAME
      , IMAGES_DIRNAME = constants.IMAGES_DIRNAME
      , groupsValidator = validators.groupsValidator
      , fontLibValidator = validators.fontLibValidator
      , pngValidator = validators.pngValidator
      , fontInfoAttributesVersion1 = converters.fontInfoAttributesVersion1
      , fontInfoAttributesVersion2 = converters.fontInfoAttributesVersion2
      , fontInfoAttributesVersion3 = converters.fontInfoAttributesVersion3
      , convertUFO1OrUFO2KerningToUFO3Kerning = converters.convertUFO1OrUFO2KerningToUFO3Kerning
      , convertFontInfoDataVersion1ToVersion2 = converters.convertFontInfoDataVersion1ToVersion2
      , convertFontInfoDataVersion2ToVersion3 = converters.convertFontInfoDataVersion2ToVersion3
      , validateInfoVersion3Data = converters.validateInfoVersion3Data
      ;

    function groupsEqual(groupsA, groupsB) {
        // groups = {"A" : ["A", "A"], "A2" : ["A"]}
        var k, i, l
         , groupA, groupB
         ;
        for(k in groupsA) if(!(k in groupsB))
            return false;
        for(k in groupsB) {
            if(!(k in groupsA))
                return false;
            groupA = groupsA[k];
            groupB = groupsB[k];
            if(groupA.length !== groupB.length)
                return false;
            for(i=0,l=groupA.length;i<l;i++)
                if(groupA[i] !== groupB[i])
                    return false;
        }
        return true;
    }

    function kerningsEqual(kerningA, kerningB) {
        var k, kk, secondsA, secondsB;
        for(k in kerningA)
            if(!(k in kerningB))
                return false;
        for(k in kerningB) {
            if(!(k in kerningA))
                return false;
            secondsA = kerningA[k];
            secondsB = kerningB[k];
            for(kk in secondsA)
                if(!(kk in secondsB))
                    return false;
            for(kk in secondsB) {
                if(!(kk in secondsA))
                    return false;
                if(secondsA[kk] !== secondsB[kk])
                    return false;
            }
        }
        return true;
    }

    /**
     * Read the various components of the .ufo.
     *
     * Use UFOReader.factory to create an instance of this, otherwise
     * your UFOReader is not fully initialized.
     */
    function UFOReader(io, path) {
        Parent.call(this, io, path);
        this._upConvertedKerningData = null;
        this._formatVersion = null;
    }
    var _p = UFOReader.prototype = Object.create(Parent.prototype);
    _p.constructor = UFOReader;

    /**
     * Will fail if metainfo.plist does not exist.
     */
    UFOReader.factory = obtain.factory(
        {
            instance: ['io', 'path',
                function(i, p) { return new UFOReader(i, p); }]
          , init: ['instance', function(instance) {
                instance._readMetaInfo(false);
                return instance;
            }]
        }
      , {
            init: ['instance', function(instance) {
                // returns a promise
                return instance._readMetaInfo(true)
                               .then(function(){return instance;});
            }]
        }
      , ['io', 'path']
      , function(obtain) {
            return obtain('init');
        }
    );

    /**
     * The format version of the UFO. This is determined by reading
     * metainfo.plist during construction via UFOReader.factory.
     */
    Object.defineProperty(_p, 'formatVersion', {
        get: function() {
            if(this._formatVersion === null)
                throw new UFOLibError('No UFO version! Always create UFOReader'
                          + ' via UFOReader.factory, then all initially needed'
                          + ' io will be perfomed.');
            return this._formatVersion;
        }
    });

    _p._readGroups = function(async) {
        return this._getPlist(async, GROUPS_FILENAME, {});
    };

    function _validateOldSchoolGroups(groups) {
        var fail = [false, "groups.plist is not properly formatted."]
          , groupName, glyphList, i, l, glyphName
          ;
        if(typeof groups !== 'object')
            return fail;
        for(groupName in groups) {
            glyphList = groups[groupName];
            if(!(glyphList instanceof Array))
                return fail;
            for(i=0,l=glyphList.length;i<l;i++) {
                glyphName = glyphList[i];
                if(typeof glyphName !== 'string')
                    return fail;
            }
        }
        return [true, null];
    }

    // up conversion
    /**
     * Up convert kerning and groups in UFO 1 and 2.
     * The data will be held internally until each bit of data
     * has been retrieved. The conversion of both must be done
     * at once, so the raw data is cached and an error is raised
     * if one bit of data becomes obsolete before it is called.
     */
    _p._upConvertKerning = obtain.factory(
        {
            testKerning: ['kerning', function(testKerning) {
                if(!kerningsEqual(testKerning,
                                this._upConvertedKerningData.originalKerning))
                    throw new UFOLibError('The data in kerning.plist has been '
                        + 'modified since it was converted to UFO 3 format.');
            }]
          , testGroups: ['groups', function(testGroups) {
                if(!groupsEqual(testGroups,
                                this._upConvertedKerningData.originalGroups))
                    throw new UFOLibError('The data in groups.plist has been '
                        + 'modified since it was converted to UFO 3 format.');
            }]
          , test: ['testKerning', 'testGroups', function() {}]
          , kerning: [false, _p._readKerning]
          , groups:  [false, _p._readGroups]
          , convertedKerning: ['groups', 'kerning', function(groups, kerning) {
                var groupsValidation = _validateOldSchoolGroups(groups)
                  , upConverted = this._upConvertedKerningData = {
                        kerning: {}
                      , originalKerning: kerning
                      , groups:{}
                      , originalGroups:groups
                    }
                  , result
                  ;

                if(!groupsValidation[0])
                    throw new UFOLibError(groupsValidation[1]);

                // convert kerning and groups
                result = convertUFO1OrUFO2KerningToUFO3Kerning(kerning, groups);
                // kerning, groups, conversionMaps = result
                // store
                upConverted.kerning = result[0];
                upConverted.groups = result[1];
                upConverted.groupRenameMaps = result[2];
            }]
        }
      , {
            kerning: [true, _p._readKerning]
          , groups:  [true, _p._readGroups]

        }
      , []
      , function() {
            if(this._upConvertedKerningData)
                return obtain('test');
            return obtain('convertedKerning');
        }
    );

    // support methods

    /**
     *  Returns the bytes in the file at the given path.
     *  The path must be relative to the UFO path.
     *  Returns null if the file does not exist.
     */
    _p._readBytesFromPath = obtain.factory(
        {
            path: ['fileName', function(fileName) {
                return [this._path, fileName].join('/');
            }]
          , bytes: ['path', function(path) {
                try {
                    // FIXME: io.readBytes needs an overhaul for this
                    return this._io.readBytes(false, path);
                }
                catch(e) {
                    if(e instanceof IONoEntryError)
                        return null;
                    throw new UFOLibError('Can\'t read bytes from "'
                                            + path + '". ' + e, e.stack);
                }
            }]
        },
        {
            bytes: ['path', function(path) {
                function onError(e) {
                    if(e instanceof IONoEntryError)
                        return null;
                    throw new UFOLibError('Can\'t read bytes from "'
                                            + path + '". ' + e, e.stack);
                }
                // FIXME: io.readBytes needs an overhaul for this
                return this._io.readBytes(true, path)
                           .then(null, onError)
                           ;
            }]
        },
        [ 'fileName'],
        function(obtain) { return obtain('bytes');}
    );

    // metainfo.plist

    /**
     * Read metainfo.plist. Only used for internal operations (in UFOReader.factory).
     *
     * Will fail if metainfo.plist does not exist.
     */
    _p._readMetaInfo = function(async) {
        var data = this._getPlist(async, METAINFO_FILENAME);
        function onData(data) {
            //jshint validthis: true
            if(typeof data !== 'object')
                throw new UFOLibError('metainfo.plist is not properly formatted.');
            if(!(data.formatVersion in supportedUFOFormatVersions))
                throw new UFOLibError('Unsupported UFO format ('
                                    + data.formatVersion + ') in ' + this._path);
            this._formatVersion = data.formatVersion;
        }
        if(async)
            // data is a promise
            return data.then(onData.bind(this));
        return onData.call(this, data);
    };

    // groups.plist


    /**
     * Read groups.plist. Returns a dict.
     */
    _p.readGroups = obtain.factory(
        {
            upConvertKerning: [false, _p._upConvertKerning]
          , data: [false, _p._readGroups]
          , groups: ['data', function(data) {
                var result = groupsValidator(data);
                if(!result[0])
                    throw new UFOLibError(result[1]);
                return data;
            }]
        }
      , {
            upConvertKerning: [true, _p._upConvertKerning]
          , data: [true, _p._readGroups]
        }
      , []
      , function(obtain) {
            if(this.formatVersion < 3) {
                obtain('upConvertKerning');
                return this._upConvertedKerningData.groups;
            }
            return obtain('groups');
        }
    );


    /**
     * Get maps defining the renaming that was done during any
     * needed kerning group conversion. This method returns a
     * dictionary of this form:
     *     {
     *         "side1" : {"old group name" : "new group name"},
     *         "side2" : {"old group name" : "new group name"}
     *     }
     * When no conversion has been performed, the side1 and side2
     * dictionaries will be empty.
     */
    _p.getKerningGroupConversionRenameMaps = obtain.factory({
            groups: [false, _p.readGroups]
        }
      , {
            groups: [true, _p.readGroups]
        }
      , []
      , function(obtain) {
            if(this.formatVersion >= 3)
                return {side1:Object.create(null), side2:Object.create(null)};
            // use the public group reader to force the load and
            // conversion of the data if it hasn't happened yet.
            obtain('groups');
            return this._upConvertedKerningData.groupRenameMaps;
        }
    );

    // fontinfo.plist
    _p._readInfo = function(async) {
        var data = this._getPlist(async, FONTINFO_FILENAME, {});
        function onData(data) {
            if(typeof data !== 'object')
                throw new UFOLibError("fontinfo.plist is not properly formatted.");
            return data;
        }
        if(async)
            return data.then(onData);
        return onData(data);
    };
    /**
     * Read fontinfo.plist. It requires an object that allows
     * setting attributes with names that follow the fontinfo.plist
     * version 3 specification. This will write the attributes
     * defined in the file into the object.
     */
    _p.readInfo = function(async, infoArg) {
        var data = this._readInfo(async)
          , info = infoArg || Object.create(null)
          ;
        function onData(infoDict) {
            //jshint validthis: true
            var infoDataToSet = {}
            , attr, value, attributes, converters = [], i, l
            ;
            switch(this.formatVersion) {
                case 1:
                    // version 1
                    attributes = fontInfoAttributesVersion1;
                    converters.push(convertFontInfoDataVersion1ToVersion2
                                , convertFontInfoDataVersion2ToVersion3);
                    break;
                case 2:
                    // version 2
                    attributes = fontInfoAttributesVersion2;
                    converters.push(convertFontInfoDataVersion2ToVersion3);
                    break;
                case 3:
                    // version 3
                    attributes = fontInfoAttributesVersion3;
                    break;
                default:
                    // unsupported version
                    throw new NotImplementedError('readInfo formatVersion ' + this.formatVersion);
            }
            for(attr in attributes) {
                value = infoDict[attr];
                if(value !== undefined)
                    infoDataToSet[attr] = value;
                for(i=0,l=converters.length;i<l;i++)
                    infoDataToSet = converters[i](infoDataToSet);
            }
            // validate data
            infoDataToSet = validateInfoVersion3Data(infoDataToSet);
            // populate the object
            for(attr in infoDataToSet)
                info[attr] = infoDataToSet[attr];
            return info;
        }
        if(async)
            return data.then(onData.bind(this));
        return onData.call(this, data);
    };

    // kerning.plist

    _p._readKerning = function(async) {
        var data = this._getPlist(async, KERNING_FILENAME, {});
        function onData(data) {
            var invalidFormatMessage = 'kerning.plist is not properly formatted.'
              , first, secondDict, second, value
              ;
            if(typeof data !== 'object')
                throw new UFOLibError(invalidFormatMessage);
            for(first in data) {
                secondDict = data[first];
                if(typeof secondDict !== 'object')
                    throw new UFOLibError(invalidFormatMessage);
                for(second in secondDict) {
                    value = secondDict[second];
                    if(typeof value !== 'number')
                        throw new UFOLibError(invalidFormatMessage
                            + ' Value is not a number: typeof ' + typeof value);
                }
            }
            return data;
        }
        if(async)
            return data.then(async);
        return onData(data);
    };

    /**
     * Read kerning.plist. Returns a dict.
     * This performs structural validation of the kerning data,
     * but it does not check the validity of the kerning as
     * dictated in the UFO spec. To do that, pass the kerning
     * obtained from this method and the groups obtained from
     * readGroups to the kerningvalidator function in the
     * validators module.
     */
    _p.readKerning = obtain.factory(
        {
            upConvertKerning: [false, _p._upConvertKerning]
          , kerning: [false, _p._readKerning]
        }
      , {
            upConvertKerning: [true, _p._upConvertKerning]
          , kerning: [true, _p._readKerning]
        }
      , []
      , function(obtain) {
            var kerningNested;
            if(this.formatVersion < 3) {
                obtain('upConvertKerning');
                kerningNested = this._upConvertedKerningData.kerning;
            }
            else
                kerningNested = obtain('kerning');

            // NOTE: Python uses here a "flattening" approach where a tuple
            // of the strings (left, right) is the key of the kernig entry
            // while this is nice in python, it s actually not practical
            // in JavaScript, not even with the (yet still new) Map objects.
            // Because of python tuples can be reproduced as a key, no need
            // to have an instance of them (jsut like strings). With a similar
            // (same content) JavaScript array of [left, right], we still
            // can't get the value of the implied kerning pair.
            // flatten:
            // kerning = Object.create(null);
            // for(left in kerningNested)
            //     for(right in kerningNested[left])
            //         // FIXME:
            //         kerning[left, right] = kerningNested[left][right];
            return kerningNested;
        }
    );

    // lib.plist

    /**
     * Read lib.plist. Returns a dict.
     */
    _p.readLib = function (async) {
        var data = this._getPlist(async, LIB_FILENAME, {});
        function onData(data) {
            var result = fontLibValidator(data);
            if(!result[0])
                throw new UFOLibError(result[1]);
            return data;
        }
        if(async)
            return data.then(onData);
        return onData(data);
    };

    // features.fea

    /**
     * Read features.fea. Returns a string.
     */
    _p.readFeatures = obtain.factory(
        {
            path: [function(){
                return [this._path, FEATURES_FILENAME].join('/');
            }]
          , features: ['path', function(path) {
                try {
                    return this._io.readFile(false, path);
                }
                catch(e) {
                    if(e instanceof IONoEntryError)
                        return '';
                    throw e;
                }
            }]
        }
      , {
            features: ['path', function(path) {
                function onError(e){
                    if(e instanceof IONoEntryError)
                        return '';
                    throw e;
                }
                return this._io.readFile(true, path)
                           .then(null, onError)
                           ;
            }]
        }
      , []
      , function(obtain){ return obtain('features');}
    );

    // glyph sets & layers

    /**
     * Rebuild the layer contents list by checking what glyphsets
     * are available on disk.
     */
    _p._readLayerContents = obtain.factory(
        {
            layerContents: [false, _p._readRawLayerContents]
        }
      , {
            layerContents: [true, _p._readRawLayerContents]
        }
      , []
      , function(obtain) {
            if(this.formatVersion < 3)
                return [[DEFAULT_LAYER_NAME, DEFAULT_GLYPHS_DIRNAME]];
            return obtain('layerContents');
        }
    );

    /**
     * Get the ordered layer names from layercontents.plist.
     */
    _p.getLayerNames = function (async) {
        var data = this._readLayerContents(async);
        function onData(layerContents) {
            var i, l
              , result = []
              ;
            for(i=0,l=layerContents.length;i<l;i++)
                result.push(layerContents[i][0]);
            return result;
        }
        if(async)
            return data.then(onData);
        return onData(data);
    };

    /**
     * Get the default layer name from layercontents.plist.
     */
    _p.getDefaultLayerName = function (async) {
        var data = this._readLayerContents(async);
        function onData(layerContents) {
            var i, l;
            for(i=0,l=layerContents.length;i<l;i++)
                if(layerContents[i][1] === DEFAULT_GLYPHS_DIRNAME)
                    return layerContents[i][0];
            throw new UFOLibError('The default layer is not defined in layercontents.plist.');
        }
        if(async)
            return data.then(onData);
        return onData(data);
    };

    /**
     * Return the GlyphSet associated with the
     * glyphs directory mapped to layerName
     * in the UFO. If layerName is not provided,
     * the name retrieved with getDefaultLayerName
     * will be used.
     */
    _p.getGlyphSet = obtain.factory(
        {
            layerContents: [false, _p._readLayerContents]
          , layerDir: ['layerName', function(layerName) {
                if(layerName)
                    return layerName;
                return this.getDefaultLayerName(false);
            }]
          , directory: ['layerDir', 'layerContents', function(layerName, layerContents) {
                var layer, i,l
                  , storedLayerName, storedLayerDirectory
                  ;
                for(i=0,l=layerContents.length;i<l;i++) {
                    layer = layerContents[i];
                    storedLayerName = layer[0];
                    storedLayerDirectory = layer[1];
                        if(layerName === storedLayerName)
                                return storedLayerDirectory;
                }
                throw new UFOLibError('No glyphs directory is mapped to "'
                                                            + layerName + '".');
            }]
          , glyphsPath: ['directory', function(directory) {
                return [this._path, directory].join('/');
            }]
          , glyphSet: ['glyphsPath', 'glyphNameToFileNameFunc', 'options',
            function(glyphsPath, glyphNameToFileNameFunc, options) {
                return GlyphSet.factory(false, this._io, glyphsPath
                                , undefined, this.formatVersion, options);
            }]
        }
      , {
            layerContents: [true, _p._readLayerContents]
          , layerDir: ['layerName', '_callback', '_errback', function(layerName, callback, errback) {
                // It's a bit wacky to force this to be async even if
                // the value already exists
                if(layerName)
                    setTimeout(callback.bind(null, layerName));
                else
                    this.getDefaultLayerName(true).then(callback, errback);
            }]
          , glyphSet: ['glyphsPath', 'glyphNameToFileNameFunc', 'options',
            function(glyphsPath, glyphNameToFileNameFunc, options) {
                return GlyphSet.factory(true, this._io, glyphsPath
                                , undefined, this.formatVersion, options);
            }]
        }
      , ['layerName', 'glyphNameToFileNameFunc', 'options']
      , function(obtain){return obtain('glyphSet');}
    );

    /**
     * Return a dictionary that maps unicode values (ints) to
     * lists of glyph names.
     */
    _p.getCharacterMapping = obtain.factory(
        {
            glyphSet: [false, 'layerName', _p.getGlyphSet]
          , allUnicodes: ['glyphSet', function(glyphSet){
                return glyphSet.getUnicodes(false);
            }]
          , cmap: ['allUnicodes', function(allUnicodes) {
                var cmap = Object.create(null)
                  , glyphName, unicodes, i, l, code, glyphs
                  ;
                for(glyphName in allUnicodes) {
                    unicodes = allUnicodes[glyphName];
                    for(i=0,l=unicodes.length;i<l;i++) {
                        code = unicodes[i];
                        glyphs = cmap[code];
                        if(!glyphs)
                            cmap[code] = glyphs = [];
                        glyphs.push(glyphName);
                    }
                }
                return cmap;
            }]
        }
      , {
            glyphSet: [true, 'layerName', _p.getGlyphSet]
          , allUnicodes: ['glyphSet', function(glyphSet){
                return glyphSet.getUnicodes(true);
            }]

        }
      , ['layerName']
      , function(obtain){ return obtain('cmap');}
    );


    // /data

    /**
     * Returns a list of all files in the data directory.
     * The returned paths will be relative to the UFO.
     * This will not list directory names, only file names.
     * Thus, empty directories will be skipped.
     * The maxDepth argument sets the maximum number
     * of sub-directories that are allowed.
     */
    _p.getDataDirectoryListing = obtain.factory(
        {
            path: [function(){ return [this._path, DATA_DIRNAME].join('/'); }]
          , md:['maxDepth', function(maxDepth) {
                    return maxDepth === undefined ? 100 : maxDepth;}]
          , listing: ['path', 'md', function(path, maxDepth) {
                if(!this._io.pathExists(false, path))
                    return [];
                return readDirRecursive(false, this._io, path, maxDepth);
            }]
        }
      , {
            pathExists: ['path', function(path) {
                            return this._io.pathExists(true, path);}]
          , listing: ['path', 'md', 'pathExists', '_callback',
            function(path, maxDepth, pathExists, callback) {
                if(pathExists)
                    setTimeout(callback,0,[]);
                else
                    return readDirRecursive(true, this._io, path, maxDepth);

            }]
        }
      , ['maxDepth']
      , function(obtain){ return obtain('listing');}
    );

    /**
     * Returns a list of all image file names in
     * the images directory. Each of the images will
     * have been verified to have the PNG signature.
     */
    _p.getImageDirectoryListing = obtain.factory(
        {
            path: [function(){ return [this._path, IMAGES_DIRNAME].join('/');}]
          , listing: ['path', function(path) {
                try {
                    return this._io.readDir(false, path);
                }
                catch(e) {
                    if(e instanceof IONoEntryError)
                        return [];
                    throw e;
                }
            }]
          , files: ['listing', function(listing) {
                function isNotDirName(name) {
                    return name.slice(-1) !== '/';
                }
                return listing.map(isNotDirName);
            }]
          , pngs: ['files', function(files) {
                var pngs = [], result, i, l;
                for(i=0,l=files.length;i<l;i++) {
                    result = pngValidator(false, this._io, {path:files[i]});
                    if(result[0])
                        pngs.push(files[i]);
                }
                return pngs;
            }]
        }
      , {
            listing: ['path', function(path) {
                function onError(e) {
                    if(e instanceof IONoEntryError)
                        return [];
                    throw e;
                }
                return this._io.readDir(true, path).then(null, onError);
            }]
          , pngs: ['files', '_callback', '_errback',
            function(files, callback, errback) {
                var pngs = []
                  , jobs=0
                  , i, l
                  , done=false
                  ;
                function onError(e) {
                    if(done) return;
                    // just report once
                    done = true;
                    errback(e);
                }
                function onData(file, result) {
                    if(done) return;
                    if(result[0])
                        pngs.push(file);
                    jobs -= 1;
                    if(jobs > 0) return;
                    done = true;
                    // return
                    callback(pngs);
                }
                for(i=0,l=files.length;i<l;i++) {
                    pngValidator(true, this._io, {path:files[i]})
                                .then(onData.bind(null, files[i]), onError);
                    jobs += 1;
                }
            }]
        }
      , []
      , function(obtain) {
            if(this.formatVersion < 3)
                return [];
            return obtain('pngs');
        }
    );

    /**
     * Return image data for the file named fileName.
     */
    _p.readImage = function (async, fileName) {
        if(this.formatVersion < 3)
            throw new UFOLibError('Reading images is not allowed in UFO '
                                            + this.formatVersion + '.');
        var path = [this._path, IMAGES_DIRNAME, fileName].join('/')
          , data = this.readBytesFromPath(async, path)
          ;
        function onData(data) {
            if(data === null)
                throw new UFOLibError('No image file named "'+ fileName +'".');
            var result = pngValidator(false, undefined, {data:data});
            if(!result[0])
                throw new UFOLibError(result[1]);
            return data;
        }
        if(async)
            return data.then(onData);
        return onData(data);
    };

    return UFOReader;
});
