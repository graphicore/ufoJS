define([
    'ufojs/errors'
  , 'Atem-IO/errors'
  , 'obtain'
  , 'ufoJS/plistLib/main'
  , 'path'
  , './_UFOBase'
  , './constants'
  , './validators'
  , './converters'
  , './filenames'
  , './glifLib/GlyphSet'
], function(
    errors
  , ioErrors
  , obtain
  , plistLib
  , path
  , Parent
  , constants
  , validators
  , converters
  , filenames
  , GlyphSet
) {
    "use strict";
    var UFOLibError = errors.UFOLib
      , IONoEntryError = ioErrors.IONoEntry
      , IOError = ioErrors.IO
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
      , LAYERCONTENTS_FILENAME = constants.LAYERCONTENTS_FILENAME
      , groupsValidator = validators.groupsValidator
      , fontLibValidator = validators.fontLibValidator
      , pngValidator = validators.pngValidator
      , fontInfoAttributesVersion3 = converters.fontInfoAttributesVersion3
      , convertFontInfoDataVersion3ToVersion2 = converters.convertFontInfoDataVersion3ToVersion2
      , convertFontInfoDataVersion2ToVersion1 = converters.convertFontInfoDataVersion2ToVersion1
      , validateInfoVersion3Data = converters.validateInfoVersion3Data
      , validateInfoVersion2Data = converters.validateInfoVersion2Data
      , userNameToFileName = filenames.userNameToFileName
      ;

    /**
     * Write the various components of the .ufo.
     */
    function UFOWriter(io, path, formatVersion /*default: 3*/, fileCreator /*default: 'org.ufojs.lib'*/){
        Parent.call(this, io, path);
        var _formatVersion = formatVersion || 3;

        if(!(_formatVersion in supportedUFOFormatVersions))
            throw new UFOLibError('Unsupported UFO format ('+_formatVersion+').');
        // establish some basic stuff
        this._formatVersion = _formatVersion;
        this._fileCreator = fileCreator || 'org.ufojs.lib';
        this._downConversionKerningData = null;
        this.layerContents = {};
    }
    var _p = UFOWriter.prototype = Object.create(Parent.prototype);
    _p.constructor = UFOWriter;

    /**
     * TODO: I dislike doing a write immediately on initialisation (_writeMetaInfo)!
     * It's really an unwanted side effect in my opinion.
     * Well, let's see how the rest turns out.
     */
    UFOWriter.factory = obtain.factory(
        {
            instance: ['io', 'path', 'formatVersion', 'fileCreator',
                function(i, p, fv, fc) { return new UFOWriter(i, p, fv, fc); }]
          , init: ['instance', function(instance) {
                instance._initLayerContents(false);
                instance._writeMetaInfo(false);
            }]
        }
      , {
            initLayerContents: ['instance', function(instance) {
                // returns a promise
                return instance._initLayerContents(true);
            }]
          , init: ['instance', 'initLayerContents', function(instance) {
                // returns a promise
                return instance._writeMetaInfo(true);
            }]
        }
      , ['io', 'path', 'formatVersion', 'fileCreator']
      , function(obtain) {
            obtain('init');
            return obtain('instance');
        }
    );

    // this is a shared helper for _p._initLayerContents
    function _initLayerContents(async, previousFormatVersion) {
        // jshint validthis:true
        if(previousFormatVersion !== null && previousFormatVersion  >= 3)
            // LayerContents plist should exist
            return this._readLayerContents(async);

        // if there is DEFAULT_GLYPHS_DIRNAME, make a default layerContents
        // dictionary
        var path = [this._path, DEFAULT_GLYPHS_DIRNAME].join('/')
          , check = this._io.pathExists(async, path)
          ;

        function onPathChecked(exists) {
            // jshint validthis:true
            if(exists)
                this.layerContents = {DEFAULT_LAYER_NAME : DEFAULT_GLYPHS_DIRNAME};
        }

        if(async)
            return check.then(onPathChecked.bind(this));
        return onPathChecked.call(this, check);
    }

    /**
     * Used only internally in UFOWriter.factory
     */
    _p._initLayerContents = obtain.factory(
        {
            // _getPlist already catches the original IONoEntryError and
            // returns the "default" argument if metaInfo.plist is not present.
            // That's OK, we can just pass a marker as default value.
            // Which in this case is an instance of IONoEntryError, could be
            // any uniquely identifiable object (even a {}) though
            noEntryMarker: [function(){return new IONoEntryError();}]
          , metaInfo: [false, new obtain.Argument(METAINFO_FILENAME)
                                        , 'noEntryMarker', _p._getPlist]
          , previousFormatVersion: ['metaInfo', 'noEntryMarker',
            function(metaInfo, noEntryMarker) {
                if(metaInfo === noEntryMarker)
                    return null;
                // path exists
                var previousFormatVersion = parseInt(metaInfo['formatVersion'], 10);
                if(previousFormatVersion !== previousFormatVersion)// NaN
                    throw new UFOLibError('The existing metainfo.plist is not '
                                + ' properly formatted. Couldn\'t interpret '
                                + 'formatVersion as an integer: '
                                + metaInfo['formatVersion']);

                if(!(previousFormatVersion in supportedUFOFormatVersions))
                    throw new UFOLibError('Unsupported UFO format (' + previousFormatVersion
                                        + ') in existing metainfo.plist.');
                return previousFormatVersion;
            }]
          , initLayerContents:[false, 'previousVersion', _initLayerContents]
        }
      , {
            metaInfo: [true, new obtain.Argument(METAINFO_FILENAME)
                                        , 'noEntryMarker', _p._getPlist]
          , initLayerContents:[true, 'previousVersion', _initLayerContents]
        }
      , []
      , function(obtain){ obtain('initLayerContents'); }
    );

    _p._writeMetaInfo = function(async) {
        var metaInfo = {
            creator: this._fileCreator,
            formatVersion: this._formatVersion
        };
        return this._writePlist(async, METAINFO_FILENAME, metaInfo);
    };

    /**
     * The path the UFO is being written to.
     */
    Object.defineProperty(_p, 'path', {get: function(){return this._path;}});

    /**
     * The format version of the UFO. This is set into metainfo.plist during __init__.
     */
    Object.defineProperty(_p, 'formatVersion', {get: function(){return this._formatVersion;}});

    /**
     * The file creator of the UFO. This is set into metainfo.plist during __init__.
     */
    Object.defineProperty(_p, 'fileCreator', {get: function(){return this._fileCreator;}});

    _p._makeDirectory = function(async, subDirectory) {
        var path = subDirectory
            ? [this._path, subDirectory].join('/')
            : this._path
          , promise = this._io.ensureDir(async, path)
          ;

        if(async)
            return promise.then(function(){ return path; });
        return path;

    };

    /**
     *  Write a property list. The errors that
     *  could be raised during the writing of
     *  a plist are unpredictable and/or too
     *  large to list, so, a blind try: except:
     *  is done. If an exception occurs, a
     *  UFOLibError will be raised.
     */
    _p._writePlist = obtain.factory(
        {
            ensureDir: [false, _p._makeDirectory]
          , path: ['fileName', function(fileName){
                return [this._path, fileName].join('/'); }]
          , plist: ['data', 'fileName', function(data, fileName) {
                try {
                    return plistLib.createPlistString(data);
                }
                catch(e) {
                    throw new UFOLibError('The data for the file "' + fileName
                                + '" could not be written: ' + e, e.stack);
                }
            }]
          , write: ['path', 'plist', function(path, plist) {
                this._io.writeFile(false, path, plist);}]
        }
      , {
            ensureDir: [true, _p._makeDirectory]
          , write: ['path', 'plist', function(path, plist) {
                this._io.writeFile(false, path, plist);}]
        }
      , ['fileName', 'data']
      , function(obtain){obtain('write');}
    );

    _p._deleteFile = obtain.factory(
        {
            path: ['fileName', function(fileName){
                return [this._path, fileName].join('/');
            }]
          , unlink:['path', function(path){
                try {
                    this._io.unlink(false, path);
                }
                catch(e) {
                    if(!(e instanceof IONoEntryError))
                        throw e;
                    // pass
                }
            }]
        }
      , {
            unlink:['path', function(path){
                function onError(e){
                    if(!(e instanceof IONoEntryError))
                        throw e;
                    // pass
                }
                return this._io.unlink(true, path)
                           .then(null, onError);
            }]
        }
      , ['fileName']
      , function(obtain){ obtain('unlink'); }
    );

    _p._removeEmptyDirectories = obtain(
        {
            basePath: [function() {
                return path.normalize(this._path);
            }]
          , absDir: ['directory', function(directory) {
                return path.normalize(directory);
            }]
          , removeDirs: ['basePath', 'absDir', function(basePath, absDir) {
                var directory = absDir;
                do {
                    try {
                        this._io.rmDir(false, directory);
                    }
                    catch(e) {
                        if(e instanceof IONoEntryError)
                            // just move on to the name above
                            // AFAIK, this case is silenced by the IO API
                            // anyways.
                            continue;
                        // raises IOError if dir can't be deleted
                        // which is the case for not empty dirs but also other
                        // occasions. Unfortunately the other occasions are suppressed
                        // here, too. A better error to silence would be IONotEmptyError
                        // but that is not used by the REST adapter (due to the
                        // lack of an appropriate HTTP status code. We could come
                        // up with a non-standard code for this.)
                        if(!(e instanceof IOError))
                            throw e;
                        // we are done
                        break;
                    }
                    directory = path.dirname(directory);
                // do this until we are at basePath
                } while(directory && directory !== basePath);
            }]
        }
      , {
            removeDirs: ['basePath', 'absDir', '_callback', '_errback',
            function(basePath, absDir, callback, errback) {
                var directory = absDir, next;
                function onError(e) {
                    if(e instanceof IONoEntryError)
                        next();
                    // see the sync version for a comment about why
                    // IOError is sub-optimal
                    else if(!(e instanceof IOError))
                        errback(e);
                    else
                        // we are done
                        callback();
                }
                next = (function () {
                    if(directory && directory !== basePath){
                        // another round
                        this._io.rmDir(true, directory).then(next, onError);
                        directory = path.dirname(directory);
                    }
                    else
                        // we are done
                        callback();
                }).bind(this);
                next();
            }]

        }
      , ['directory']
      , function(obtain, directory) {
            var absDir = obtain('absDir')
              , basePath = obtain('basePath')
              ;
            if(basePath === absDir)
                throw new UFOLibError('Can\'t delete UFO path');
            if(absDir.indexOf(basePath) !== 0)
                // directory must be contained in basePath
                throw new UFOLibError('The directory must be contained '
                                +'within the UFO path: "'+directory+'".');
            obtain('removeDirs');
        }
    );

    _p._getPathType = function(async, p) {
        var parent = path.dirname(p)
         , baseFile = path.basename(p)
         , lookup = Object.create(null)
         ;
        lookup[baseFile] = 'file';
        lookup[baseFile + '/'] = 'directory';

        function onData(items) {
            var i,l, found;
            for(i=0,l=items.length;i<l;i++)
                if((found = lookup[items[i]]))
                    return found;
            // not found
            return null;
        }
        function onError(e) {
            if(e instanceof IONoEntryError)
                // not found
                return null;
            throw e;
        }
        if(async)
            return this._io.readDir(async, parent)
                            .then(onData, onError);

        // synchronous
        try {
            return onData(this._io.readDir(async, parent));
        }
        catch(e) {
            return onError(e);
        }
    };

    _p._removeAndCleanup = obtain.factory(
        {
            basePath: [function(){ return path.normalize(this._path); }]
          , absPath: ['path', 'basePath', function(p, basePath) {
                var absPath = path.normalize(p);
                if(basePath === absPath)
                    throw new UFOLibError('Can\'t delete UFO path');
                if(absPath.indexOf(basePath) !== 0)
                    throw new UFOLibError('The path "' + p + '" must be '
                                    + 'contained within the UFO path.');
                return absPath;
            }]
          , parent: ['path', path.dirname]
          , type: [false, 'path', _p._getPathType]
          , rmDir: ['absPath', function(path) {
                        return this._io.rmDirRecursive(false, path);}]
          , unlink: ['absPath', function(path) {
                        return this._io.unlink(false, path);}]
          , cleanup:[false, 'parent', _p._removeEmptyDirectories]

        }
      , {
            type: [true, 'path', _p._getPathType]
          , rmDir: ['absPath', function(path) {
                        return this._io.rmDirRecursive(true, path);}]
          , unlink: ['absPath', function(path) {
                        return this._io.unlink(true, path);}]
          , cleanup:[true, 'parent', _p._removeEmptyDirectories]
        }
      , ['path']
      , function(obtain) {
            // run the absPath check before getting the type
            obtain('absPath');
            var type = obtain('type');
            if(type === 'directory')
                obtain('rmDir');
            else if(type === 'file')
                obtain('unlink');
            obtain('cleanup');
        }
    );

    /**
     * Set the UFO modification time to the current time.
     * This is never called automatically. It is up to the
     * caller to call this when finished working on the UFO.
     *
     * WARNING: This will only do something if the io adapter has
     * a `setMtime` method, otherwise an NotImplementedError is thrown.
     * Currently `setMtime` is nowhere implemented.
     */
    _p.setModificationTime = function(async) {
        return this._io.setMtime(async, this._path);
    };

    // groups.plist

    /**
     * Set maps defining the renaming that should be done
     * when writing groups and kerning in UFO 1 and UFO 2.
     * This will effectively undo the conversion done when
     * UFOReader reads this data. The dictionary should have
     * this form:
     *
     *     {
     *         "side1" : {"group name to use when writing" : "group name in data"},
     *         "side2" : {"group name to use when writing" : "group name in data"}
     *     }
     *
     * This is the same form returned by UFOReader's
     * getKerningGroupConversionRenameMaps method.
     */
    _p.setKerningGroupConversionRenameMaps = function(maps) {
        if(this._formatVersion >= 3)
            throw new UFOLibError('Not supported in UFO '+this._formatVersion+'.');
        // flip the dictionaries
        var remap = {}, side, writeName, dataName;
        for(side in {side1:true, side2:true})
            for(writeName in maps[side]) {
                dataName = maps[side][writeName];
                remap[dataName] = writeName;
            }
        this._downConversionKerningData = {groupRenameMap: remap};
    };

    /**
     * Write groups.plist. This method requires a
     * dict of glyph groups as an argument.
     */
    _p.writeGroups = function(async, groups) {
        // validate the data structure
        var result = groupsValidator(groups)
          , remap, remappedGroups, name, contents
          , groupsNew, hasGroups
          ;
        if(!result[0])
            throw new UFOLibError(result[1]);
        // down convert
        if(this._formatVersion < 3 && this._downConversionKerningData !== null) {
            remap = this._downConversionKerningData['groupRenameMap'] || {};
            remappedGroups = {};
            // there are some edge cases here that are ignored:
            // 1. if a group is being renamed to a name that
            //    already exists, the existing group is always
            //    overwritten. (this is why there are two loops
            //    below.) there doesn't seem to be a logical
            //    solution to groups mismatching and overwriting
            //    with the specifiecd group seems like a better
            //    solution than throwing an error.
            // 2. if side 1 and side 2 groups are being renamed
            //    to the same group name there is no check to
            //    ensure that the contents are identical. that
            //    is left up to the caller.
            for(name in groups) {
                contents = groups[name];
                if(name in remap)
                    name = remap[name];
                remappedGroups[name] = contents;
            }
            groups = remappedGroups;
        }
        // pack and write
        groupsNew = {};
        for(name in groups) {
            hasGroups = true;
            contents = groups[name];
            groupsNew[name] = contents.slice();
        }
        if(hasGroups)
            return this._writePlist(async, GROUPS_FILENAME, groupsNew);
        else
            return this._deleteFile(async, GROUPS_FILENAME);
    };

    // fontinfo.plist

    /**
     * Write info.plist. This method requires an object
     * that supports getting attributes that follow the
     * fontinfo.plist version 2 specification. Attributes
     * will be taken from the given object and written
     * into the file.
     */
    _p.writeInfo = function(async, info) {
        // gather version 3 data
        var infoData = {}
          , attr, value
          ;
        for(attr in fontInfoAttributesVersion3) {
            if(attr in info) {
                value = info[attr];
                if(value === undefined || value === null)
                    continue;
                infoData[attr] = value;
            }
        }
        // down convert data if necessary and validate
        switch(this._formatVersion){
            case 3:
                infoData = validateInfoVersion3Data(infoData);
                break;
            case 2:
                infoData = convertFontInfoDataVersion3ToVersion2(infoData);
                infoData = validateInfoVersion2Data(infoData);
                break;
            case 1:
                infoData = convertFontInfoDataVersion3ToVersion2(infoData);
                infoData = validateInfoVersion2Data(infoData);
                infoData = convertFontInfoDataVersion2ToVersion1(infoData);
                break;
        }
        // write file
        return this._writePlist(async, FONTINFO_FILENAME, infoData);
    };

    // kerning.plist

    /**
     * Write kerning.plist. This method requires a
     * dict of kerning pairs as an argument.
     *
     * This performs basic structural validation of the kerning,
     * but it does not check for compliance with the spec in
     * regards to conflicting pairs. The assumption is that the
     * kerning data being passed is standards compliant.
     */

     FIXME;//!: for propper error reporting, if these adhoc obtain API methods
     //throw any synchronous errors it's bad and they should be in a real
     //obtain getter!


    _p.writeKerning = function(async, kerning) {
        // validate the data structure
        var side1, seconds, side2, value, remap, remappedKerning;
        for(side1 in kerning) {
            seconds = kerning[side1];
            for(side2 in seconds)
                value = seconds[side2];
            if(typeof value !== 'number')
                throw new UFOLibError('The kerning is not properly formatted.');
        }
        // down convert
        if( this._formatVersion < 3 && this._downConversionKerningData !== null)
            remap = this._downConversionKerningData['groupRenameMap'];
            remappedKerning = {};
            for(side1 in kerning) {
                seconds = kerning[side1];
                for(side2 in seconds) {
                    value = seconds[side2];
                side1 = remap[side1] || side1;
                side2 = remap[side2] || side2;

                if(!remappedKerning[side1])
                    remappedKerning[side1] = {};
                remappedKerning[side1][side2] = value;
            }
            kerning = remappedKerning;
        }
        for(side1 in kerning)
            // has kerning, this is just a check we don't iterate further
            return this._writePlist(async, KERNING_FILENAME, kerning);
        return this._deleteFile(async, KERNING_FILENAME);
    };

    // lib.plist

    /**
     * Write lib.plist. This method requires a
     * lib dict as an argument.
     */
    _p.writeLib = function(async, libDict) {
        var result = fontLibValidator(libDict)
          , k
          ;
        if(!result[0])
            throw new UFOLibError(result[1]);
        for(k in libDict)
            // has contents, note, returns immediately
            return this._writePlist(async, LIB_FILENAME, libDict);
        // empty
        return this._deleteFile(async, LIB_FILENAME);
    };

    // features.fea

    /**
     * Write features.fea. This method requires a
     * features string as an argument.
     */
    _p.writeFeatures = obtain.factory(
        {
            path: [function(){ return [this._path, FEATURES_FILENAME].join('/'); }]
          , dir: [false, _p._makeDirectory]
          , check: ['features', function(features) {
                if(this._formatVersion === 1)
                    throw new UFOLibError('features.fea is not allowed '
                                                            + 'in UFO 1.');
                if(typeof features !== 'string')
                    throw new UFOLibError('The features must be string, '
                                    + 'but are: ' + (typeof features) + '.');
                return true;
            }]
          , write: ['path', 'features', function(path, features) {
                return this._io.writeFile(false, path, features);
            }]
        }
      , {
            dir: [true, _p._makeDirectory]
          , write: ['path', 'features', 'check', function(path, features) {
                return this._io.writeFile(true, path, features);
            }]
        }
      , ['features']
      , function(obtain) { obtain('write'); }
    );

    // glyph sets & layers

    _p._readLayerContents = function(async) {
        var data = this._readRawLayerContents(async);
        function onData(raw) {
            //jshint validthis:true
            var contents = {}, i, l;
            for(i=0,l=raw.length;i<l;i++)
                // contents[layerName] = directoryName;
                contents[raw[i][0]] = raw[i][1];
            this.layerContents = contents;
        }
        if(async)
            return data.then(onData.bind(this));
        return onData.call(this, data);
    };

    /**
     * Write the layercontents.plist file. This method  *must* be called
     * after all glyph sets have been written.
     */
    _p.writeLayerContents = function(async, layerOrder/*default: null*/) {
        if(this._formatVersion < 3)
            return;
        var newOrder, layerName, i,l
          , layerNames = Object.keys(this.layerContents)
          , layerContents
          ;
        if(layerOrder) {
            newOrder = [];
            for(i=0,l=layerOrder.length;i<l;i++) {
                layerName = layerOrder[i];
                if(layerName === null) // RLY? was `if layerName is None`
                    layerName = DEFAULT_LAYER_NAME;
                newOrder.append(layerName);
            }
            layerOrder = newOrder;
        }
        else
            layerOrder = layerNames;

        if(layerOrder === layerNames){}//pass
        else if(layerOrder.length !==  layerNames.length)
            throw new UFOLibError('layerOrder does not match the glyph '
                                        +'sets that have been created.');

        layerContents = [];
        for(i=0,l=layerOrder.length;i<l;i++) {
            layerName = layerOrder[i];
            if(!(layerName in this.layerContents))
                throw new UFOLibError('layerOrder does not match the glyph '
                                        +'sets that have been created.');
            layerContents.push([layerName, this.layerContents[layerName]]);
        }

        return this._writePlist(async, LAYERCONTENTS_FILENAME, layerContents);
    };

    _p._findDirectoryForLayerName = function(layerName) {
        var existingLayerName
          , directoryName
          ;

        for(existingLayerName in this.layerContents) {
            directoryName = this.layerContents[existingLayerName];
            if(!layerName && directoryName === DEFAULT_GLYPHS_DIRNAME)
                return directoryName;
            else if(existingLayerName === layerName)
                return directoryName;
        }
        throw new UFOLibError('Could not locate a glyph set directory '
                            + 'for the layer named ' + layerName + '.');
    };

    /**
     * Return the GlyphSet object associated with the
     * appropriate glyph directory in the .ufo.
     * If layerName is None, the default glyph set
     * will be used. The defaultLayer flag indictes
     * that the layer should be saved into the default
     * glyphs directory.
     */
    _p.getGlyphSet = function(async, layerName/*default null*/
                        , defaultLayer /*default:true*/
                        , glyphNameToFileNameFunc/*default:null*/) {
        var dfltLayer = defaultLayer === undefined ? true : !!defaultLayer
          , existingLayerName
          ;
        // only default can be written in < 3
        if(this._formatVersion < 3 && (!dfltLayer || layerName))
            throw new UFOLibError('Only the default layer can be writen '
                                + 'in UFO ' + this._formatVersion + '.');

        // locate a layer name when None has been given
        if(!layerName && dfltLayer) {
            for(existingLayerName in this.layerContents) {
                if(this.layerContents[existingLayerName] === DEFAULT_GLYPHS_DIRNAME) {
                    layerName = existingLayerName;
                    break;
                }
            }
            if(!layerName)
                layerName = DEFAULT_LAYER_NAME;
        }
        else if(!layerName && !dfltLayer)
            throw new UFOLibError('A layer name must be provided for '
                                                +'non-default layers.');
        // move along to format specific writing
        return this._getGlyphSet(async, layerName, dfltLayer, glyphNameToFileNameFunc);
    };

    _p._getGlyphSet = obtain.factory(
        {
            directoryName: ['layerName', 'defaultLayer',
            function(layerName, dl){
                var existingLayerName, directory, k, existing
                  , defaultLayer = dl === undefined ? true : !!dl
                  ;
                if(this._formatVersion < 3)
                    return DEFAULT_GLYPHS_DIRNAME;

                // if the default flag is on, make sure that the default in the file
                // matches the default being written. also make sure that this layer
                // name is not already linked to a non-default layer.
                if(defaultLayer) {
                    for(existingLayerName in this.layerContents) {
                        directory = this.layerContents[existingLayerName];
                        if(directory === DEFAULT_GLYPHS_DIRNAME)
                            if(existingLayerName !== layerName)
                                throw new UFOLibError('Another layer is already '
                                                + 'mapped to the default directory.');
                        else if(existingLayerName === layerName)
                            throw new UFOLibError('The layer name is already mapped '
                                                + 'to a non-default layer.');
                    }
                }
                // get an existing directory name
                if(layerName in this.layerContents)
                    directory = this.layerContents[layerName];
                // get a  new directory name
                else {
                    if(defaultLayer)
                        directory = DEFAULT_GLYPHS_DIRNAME;
                    else {
                        // not caching this could be slightly expensive,
                        // but caching it will be cumbersome
                        existing = Object.create(null);
                        for(k in this.layerContents)
                            existing[this.layerContents[k].toLowerCase()] = true;
                        directory = userNameToFileName(path.basename(layerName)
                                                        , existing, 'glyphs.');
                    }
                }
                return directory;
            }]
          , io: [function(){ return this._io; }]
          , path: ['layerName', 'directoryName', function(layerName, directory) {
                var path = _p._makeDirectory(false, directory);
                // store the mapping
                if(this._formatVersion >= 3)
                    this.layerContents[layerName] = directory;
                return path;
            }]
          , GlyphSet: [false, 'io', 'path', 'glyphNameToFileNameFunc', 3, GlyphSet.factory]
        }
      , {
            path: ['layerName', 'directoryName', function(layerName, directory) {
                return this._makeDirectory(true, directory)
                           .then(function(path) {
                                // jshint validthis:true
                                // store the mapping
                                if(this._formatVersion >= 3)
                                    this.layerContents[layerName] = directory;
                                return path;
                            }.bind(this));

            }]
          , GlyphSet: [true, 'io', 'path', 'glyphNameToFileNameFunc', 3, GlyphSet.factory]
        }
      , [ 'layerName' /* default null */
        , 'defaultLayer'/* default true */
        , 'glyphNameToFileNameFunc' /* default null */]
      , function(obtain) { return obtain('GlyphSet'); }
    );

    /**
     * Rename a glyph set.
     *
     * Note: if a GlyphSet object has already been retrieved for
     * layerName, it is up to the caller to inform that object that
     * the directory it represents has changed.
     */
    _p.renameGlyphSet = function(async, layerName, newLayerName
                                    , defaultLayer /* default: false */) {
        var k, oldDirectory, newDirectory, existing;
        if(this._formatVersion < 3)
            throw new UFOLibError('Renaming a glyph set is not supported '
                                + 'in UFO ' + this._formatVersion + '.');
        // the new and old names can be the same
        // as long as the default is being switched
        if(layerName === newLayerName) {
            // if the default is off and the layer is already
            // not the default, skip
            if(this.layerContents[layerName] !== DEFAULT_GLYPHS_DIRNAME
                                                        && !defaultLayer)
                return;
            // if the default is on and the layer is already
            // the default, skip
            if(this.layerContents[layerName] === DEFAULT_GLYPHS_DIRNAME
                                                         && defaultLayer)
                return;
        }
        else {
            // make sure the new layer name doesn't already exist
            if(!newLayerName)
                newLayerName = DEFAULT_LAYER_NAME;
            if(newLayerName in this.layerContents)
                throw new UFOLibError('A layer named "' + newLayerName
                                    + '" already exists.');

            // make sure the default layer doesn't already exist
            if(defaultLayer)
                for(k in this.layerContents)
                    if(DEFAULT_GLYPHS_DIRNAME === this.layerContents[k])
                        throw new UFOLibError('A default layer already exists.');
        }
        // get the paths
        oldDirectory = this._findDirectoryForLayerName(layerName);
        if(defaultLayer)
            newDirectory = DEFAULT_GLYPHS_DIRNAME;
        else {
            existing = Object.create(null);
            for(k in this.layerContents)
                existing[this.layerContents[k].toLowerCase()] = true;
            newDirectory = userNameToFileName(path.basename(newLayerName)
                                            , existing, 'glyphs.');
        }
        // update the internal mapping
        delete this.layerContents[layerName];
        this.layerContents[newLayerName] = newDirectory;
        // do the file system copy
        oldDirectory =[this._path, oldDirectory];
        newDirectory =[this._path, newDirectory];
        return this._io.rename(async, oldDirectory, newDirectory);
    };

    /**
     * Remove the glyph set matching layerName.
     */
    _p.deleteGlyphSet = function (async, layerName) {
        if(this._formatVersion < 3)
            throw new UFOLibError('Deleting a glyph set is not allowed '
                                + 'in UFO ' + this._formatVersion + '.');
        var foundDirectory = this._findDirectoryForLayerName(layerName)
          , done = (function () {
                //jshint validthis:true
                delete this.layerContents[layerName];
            }).bind(this)
          , promise = this._removeAndCleanup(async, foundDirectory)
          ;
        if(async)
            return promise.then(done);
        done();
    };

    /**
     * Write data to fileName in the images directory.
     * The data must be a valid PNG.
     */
    _p.writeImage = obtain.factory(
        {
            path: ['fileName', function(fileName){
                var basePath = path.normalize(
                                [this._path, IMAGES_DIRNAME].join('/'))
                  , absPath = path.normalize(
                        [this._path, IMAGES_DIRNAME, fileName].join('/'))
                  ;
                if(basePath === absPath)
                    throw new UFOLibError('Image can\'t be directly at the "'
                                +  IMAGES_DIRNAME +'" path: "'+fileName+'"');
                if(absPath.indexOf(basePath) !== 0)
                    throw new UFOLibError('Image must be contained within the "'
                                +  IMAGES_DIRNAME +'" path: "'+fileName+'"');
                return absPath;
            }]
          , parentDir: ['path', path.dirname]
          , validData: ['data', function(data){
                var result = pngValidator(false, undefined, {data:data});
                if(!result[0])
                    throw new UFOLibError(result[1]);
                return true;
            }]
          , ensureDirs: [true, 'parentDir', _p._ensureDirs]
          , write: ['path', 'data', 'ensureDirs', function(path, data) {
                return this._io.writeFile(true, path, data);
            }]
        }
      , {
            ensureDirs: [true, 'parentDir', _p._ensureDirs]
          , write: ['path', 'data', 'ensureDirs', function(path, data) {
                return this._io.writeFile(true, path, data);
            }]
        }
      , ['fileName', 'data']
      , function(obtain){
            if(this._formatVersion < 3)
            throw new UFOLibError('Images are not supported in UFO '
                                            + this._formatVersion + '.');
            obtain('validData');
            return obtain('write');
        }
    );

    _p._removePath = function(async, dir, relPath) {
        if(this._formatVersion < 3)
            throw new UFOLibError('The "'+ dir +'" directory is not supported '
                                    +'in UFO ' + this._formatVersion + '.');
        var absDir = path.normalize([this._path, dir].join('/'))
          , absPath = path.normalize([absDir, relPath].join('/'))
          ;
        if(absPath.indexOf(absDir) !== 0)
            throw new UFOLibError('Path must be contained in ' +'the "'
                                + dir +'" but: "' + relPath + '" is not.');
        return this._removeAndCleanup(async, absPath);
    };

    /**
     * Remove the file named fileName from the images directory.
     * Remove IMAGES_DIRNAME if it is empty after the operation.
     */
    _p.removeImage = function(async, fileName) {
        return this._removePath(async, IMAGES_DIRNAME, fileName);
    };

    /**
     * Remove the file (or directory) at path. The path
     * must be relative to the UFO. This is only allowed
     * for files in the data directory.
     * Remove DATA_DIRNAME if it is empty after the operation.
     */
    _p.removeDataPath = function(async, path) {
        return this._removePath(async, DATA_DIRNAME, path);
    };


});
