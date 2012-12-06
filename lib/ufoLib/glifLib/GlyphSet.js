/**
 * Copyright (c) 2012, Lasse Fister lasse@graphicore.de, http://graphicore.de
 * 
 * You should have received a copy of the MIT License along with this program.
 * If not, see http://www.opensource.org/licenses/mit-license.php
 * 
 * This is a port of glifLib.Glyph defined in robofab/branches/ufo3k/Lib/ufoLib/gliflib.py
 * 
 * Modifications where done in order to use DOM Methods with the glifs.
 * Because there is no native Sax-Parser in the Browser. Thus we really
 * parse the glifs completely, not just partly on some operations as the
 * Python implementation does.
 * 
 * added a method:
 *     getGLIFDocumnet
 * 
 * TODO: the file writing methods raise NotImplementedError since I have
 * no concept for that in the browser context now. It will most probably
 * become a HTTP PUT request.
 * In this file a lot of synchronous IO is done. An additional asynchronous
 * Implementation would be very appreciated.
 * 
 */ 
 
 
 /**
  * GlyphSet manages a set of .glif files inside one directory.
  * 
  * GlyphSet's constructor takes a path to an existing directory as it's
  * first argument. Reading glyph data can either be done through the
  * readGlyph() method, or by using GlyphSet's dictionary interface, where
  * the keys are glyph names and the values are (very) simple glyph objects.
  * 
  * To write a glyph to the glyph set, you use the writeGlyph() method.
  * The simple glyph objects returned through the dict interface do not
  * support writing, they are just a convenient way to get at the glyph data.
  */
define(
    [
        'ufojs',
        'ufojs/errors',
        'ufojs/tools/io/main',
        'ufojs/xml/main',
        'ufojs/plistLib/main',
        './constants',
        './misc',
        './Glyph',
        './readGlyph',
        './writeGlyph',
        './rapidValueFetching'
        
    ],
    function(
        main,
        errors,
        io,
        xml,
        plistLib,
        constants,
        misc,
        Glyph,
        readGlyph,
        writeGlyph,
        rapidValueFetching
    )
{
    var enhance = main.enhance,
        NotImplementedError = errors.NotImplemented,
        GlifLibError = errors.GlifLib,
        KeyError = errors.Key,
        glyphNameToFileName = misc.glyphNameToFileName,
        layerInfoVersion3ValueData = misc.layerInfoVersion3ValueData,
        validateLayerInfoVersion3Data = misc.validateLayerInfoVersion3Data,
        readPlistSync = plistLib.readPlistSync;
        writePlistToString = plistLib.createPlistString,
        fetchUnicodes = rapidValueFetching.fetchUnicodes,
        fetchImageFileName = rapidValueFetching.fetchImageFileName,
        fetchComponentBases = rapidValueFetching.fetchComponentBases;
    
    // ---------
    // Glyph Set
    // ---------
    
    /**
     * 'dirName' should be a path to an existing directory.
     * The optional 'glyphNameToFileNameFunc' argument must be a callback
     * function that takes two arguments: a glyph name and the GlyphSet
     * instance. It should return a file name (including the .glif
     * extension). The glyphNameToFileName function is called whenever
     * a file name is created for a given glyph name.
     */
    function GlyphSet(
        dirName,
        glyphNameToFileNameFunc /* undefined */,
        ufoFormatVersion /* 3 */
    ) {
        this.dirName = dirName;
        if(ufoFormatVersion === undefined) ufoFormatVersion = 3;
        
        if(!(ufoFormatVersion in constants.supportedUFOFormatVersions))
            throw new GlifLibError("Unsupported UFO format version: "
                + ufoFormatVersion);
        
        if(glyphNameToFileNameFunc === undefined)
            glyphNameToFileNameFunc = glyphNameToFileName;
        this.glyphNameToFileName = glyphNameToFileNameFunc;
        this.rebuildContents();
        this._reverseContents = undefined;
        this._glifCache = {};
        
        //used not to be in the 
        this.glyphClass = Glyph;
    }
    
    enhance(GlyphSet, {
        /**
         * Rebuild the contents dict by loading contents.plist.
         */
        rebuildContents: function() {
            var contentsPath = [this.dirName, 'contents.plist'].join('/'),
                contents, name, fileName;
            if (!io.pathExistsSync(contentsPath))
                // missing, consider the glyphset empty.
                contents = {};
            else
                contents = this._readPlist(contentsPath);
            
            // validate the contents
            if( plistLib.getType(contents) !== 'dict' )
                throw new GlifLibError('contents.plist is not properly '
                    + 'formatted');
            for(name in contents) {
                fileName = contents[name];
                // name is always string
                if(typeof fileName !== 'string')
                    throw new GlifLibError('contents.plist is not '
                        + 'properly formatted');
                else if(
                    !io.pathExistsSync([this.dirName, fileName].join('/'))
                )
                    throw new GlifLibError('contents.plist references a '
                        + 'file that does not exist: ' + fileName);
            }
            this.contents = contents;
            this._reverseContents = undefined;
        },
        /**
         * Return a reversed dict of self.contents, mapping file names to
         * glyph names. This is primarily an aid for custom glyph name to file
         * name schemes that want to make sure they don't generate duplicate
         * file names. The file names are converted to lowercase so we can
         * reliably check for duplicates that only differ in case, which is
         * important for case-insensitive file systems.
         */
        getReverseContents: function() {
            if(this._reverseContents === undefined){
                var d = {}, k;
                for(k in this.contents)
                    d[this.contents[k].toLowerCase()] = k;
                this._reverseContents = d;
            }
            return this._reverseContents;
        },
        /**
         * Write the contents.plist file out to disk. Call this method when
         * you're done writing glyphs.
         */
        writeContents: function() {
            var contentsPath = [this.dirName, 'contents.plist'].join('/'),
                plist = writePlistToString(this.contents);
            throw new NotImplementedError('No write yet :(');
            // and the writemode thing is specific to to the python implementation:
            // # We need to force Unix line endings, even in OS9 MacPython in FL,
            // # so we do the writing to file ourselves.
            var f = open(contentsPath, WRITE_MODE);
            f.write(plist);
            f.close();
        },
        
        /**
         * layer info
         * read the layerinfo.plist and set its values to the info object
         * info object is the only argument of this method
         * 
         * This method uses synchronous IO
         */
        readLayerInfo: function(info) {
            var path = [this.dirName, constants.LAYERINFO_FILENAME].join('/'),
            infoDict, attr, value;
            if(!io.pathExistsSync(path))
                return;
            var infoDict = this._readPlist(path);
            if(typeof infoDict !== 'object')
                throw new GlifLibError('layerinfo.plist is not properly formatted.');
            infoDict = validateLayerInfoVersion3Data(infoDict);
            // populate the object
            for (attr in infoDict) {
                info[attr] = infoDict[attr];
                // I can't imagine the eqivalent exception in javaScript
                // and we do not have a setattribute function
                // value = infoDict[attr];
                // try:
                //     setattr(info, attr, value)
                // except AttributeError:
                //     raise GlifLibError("The supplied layer info object does not support setting a necessary attribute (%s)." % attr)
            }
        },
        /**
         * write the contents of the info argument to a string and return it
         */
        writeLayerInfoToString: function(info) {
            if(this.ufoFormatVersion < 3)
                throw new GlifLibError('layerinfo.plist is not allowed in UFO '
                    + this.ufoFormatVersion + '.');
            // gather data
            var infoData = {}, attr;
            for (attr in layerInfoVersion3ValueData){
                if(!(attr in info) || info[attr] === undefined)
                    continue;
                infoData[attr] = info[attr];
            }
            
            // validate
            infoData = validateLayerInfoVersion3Data(infoData);
            return writePlistToString(infoData);
        },
        /**
         * write the contents of the info argument to LAYERINFO_FILENAME
         * writing to files is not implemented yet
         */
        writeLayerInfo: function(info) {
            var plist = this.writeLayerInfoToString(info),
                path = [this.dirName, constants.LAYERINFO_FILENAME].join('/');
            throw new NotImplementedError('Writing to files is not supported yet.');
            // write file
            f = open(path, WRITE_MODE)
            f.write(plist)
            f.close()
        },
        
        // read caching
        
        /**
         * This uses synchronous IO
         * 
         * I'm not shure whether its a good idea to implement this with all
         * the calls to mtime, but its done
         * 
         * The python docstring reads:
         * Get the raw GLIF text for a given glyph name. This only works
         * for GLIF files that are already on disk.
         *
         * This method is useful in situations when the raw XML needs to be
         * read from a glyph set for a particular glyph before fully parsing
         * it into an object structure via the readGlyph method.
         *
         * Internally, this method will load a GLIF the first time it is
         * called and then cache it. The next time this method is called
         * the GLIF will be pulled from the cache if the file's modification
         * time has not changed since the GLIF was cached. For memory
         * efficiency, the cached GLIF will be purged by various other methods
         * such as readGlyph.
         */
        getGLIF: function(glyphName) {
            var needRead = false,
                fileName = this.contents[glyphName],
                path,
                mtime;
            if(fileName !== undefined)
                path = [this.dirName, fileName].join('/');
            if(!(glyphName in this._glifCache))
                needRead = true;
            else if(fileName !== undefined
                // freakshit in a browser context ...
                && (mtime = io.getMtimeSync(path)) != this._glifCache[glyphName][1])
                needRead = true;
            if(needRead) {
                if(!path || !io.pathExistsSync(path))
                    throw new KeyError(glyphName);
                text = io.readFileSync(path);// and get mtime ...
                if(mtime === undefined) mtime = io.getMtimeSync(path);
                this._glifCache[glyphName] = [text, mtime];
            }
            return this._glifCache[glyphName][0];
        },
        getGLIFDocument: function(glyphName) {
            if(!(glyphName in this._glifCache)
                || this._glifCache[glyphName][2] === undefined)
            {
                var text = this.getGLIF(glyphName);
                var parser = new xml.Parser();
                var glifDoc = parser.parseFromString(text, "text/xml");
                this._glifCache[glyphName][2] = glifDoc;
            
            }
            return this._glifCache[glyphName][2];
        },
        /**
         * Get the modification time (as reported by os.path.getmtime)
         * of the GLIF with glyphName.
         */
        getGLIFModificationTime: function(glyphName) {
            this.getGLIF(glyphName);
            return this._glifCache[glyphName][1];
        },
        _purgeCachedGLIF: function(glyphName) {
            if(glyphName in this._glifCache)
                delete(this._glifCache[glyphName]);
        },
        // reading/writing API
        
        /**
         * Read a .glif file for 'glyphName' from the glyph set. The
         * 'glyphObject' argument can be any kind of object (even None);
         * the readGlyph() method will attempt to set the following
         * attributes on it:
         *     "width"      the advance with of the glyph
         *     "height"     the advance height of the glyph
         *     "unicodes"   a list of unicode values for this glyph
         *     "note"       a string
         *     "lib"        a dictionary containing custom data
         *     "image"      a dictionary containing image data
         *     "guidelines" a list of guideline data dictionaries
         *
         * All attributes are optional, in two ways:
         *     1) An attribute *won't* be set if the .glif file doesn't
         *     contain data for it. 'glyphObject' will have to deal
         *     with default values itself.
         *     2) If setting the attribute fails with an AttributeError
         *     (for example if the 'glyphObject' attribute is read-
         *     only), readGlyph() will not propagate that exception,
         *     but ignore that attribute.
         *
         * To retrieve outline information, you need to pass an object
         * conforming to the PointPen protocol as the 'pointPen' argument.
         * This argument may be None if you don't need the outline data.
         *
         * readGlyph() will raise KeyError if the glyph is not present in
         * the glyph set.
         */
        readGlyph: function(glyphName, glyphObject/* undefined */,
            pointPen/* undefined */)
        {
            var text = this.getGLIF(glyphName), tree, formatVersions;
            this._purgeCachedGLIF(glyphName);
            tree = _glifTreeFromFile(StringIO(text))
            if(this.ufoFormatVersion < 3)
                formatVersions = [1];
            else
                formatVersions = [1, 2];
            _readGlyphFromTree(tree, glyphObject, pointPen, formatVersions);
        },
        /**
         * Write a .glif file for 'glyphName' to the glyph set. The
         * 'glyphObject' argument can be any kind of object (even None);
         * the writeGlyph() method will attempt to get the following
         * attributes from it:
         *     "width"      the advance with of the glyph
         *     "height"     the advance height of the glyph
         *     "unicodes"   a list of unicode values for this glyph
         *     "note"       a string
         *     "lib"        a dictionary containing custom data
         *     "image"      a dictionary containing image data
         *     "guidelines" a list of guideline data dictionaries
         *
         * All attributes are optional: if 'glyphObject' doesn't
         * have the attribute, it will simply be skipped.
         *
         * To write outline data to the .glif file, writeGlyph() needs
         * a function (any callable object actually) that will take one
         * argument: an object that conforms to the PointPen protocol.
         * The function will be called by writeGlyph(); it has to call the
         * proper PointPen methods to transfer the outline to the .glif file.
         *
         * The GLIF format version will be chosen based on the ufoFormatVersion
         * passed during the creation of this object. If a particular format
         * version is desired, it can be passed with the formatVersion argument.
         */
        writeGlyph: function(glyphName, glyphObject/*undefined*/,
            drawPointsFunc/*undefined*/, formatVersion/*undefined*/)
        {
            if(formatVersion === undefined)
                if(this.ufoFormatVersion >= 3)
                    formatVersion = 2;
                else
                    formatVersion = 1;
            else {
                if(!(formatVersion in constants.supportedGLIFFormatVersions))
                    throw new GlifLibError('Unsupported GLIF format version: '
                        + formatVersion);
                if(formatVersion == 2 && this.ufoFormatVersion < 3)
                    throw new GlifLibError('Unsupported GLIF format version ('
                        + formatVersion + ') for UFO format version '
                        + this.ufoFormatVersion + '.');
            }
            this._purgeCachedGLIF(glyphName);
            var data = writeGlyphToString(glyphName, glyphObject, drawPointsFunc,
                undefined, formatVersion);
            var fileName = this.contents[glyphName];
            if(fileName === undefined) {
                fileName = this.glyphNameToFileName(glyphName, this);
                this.contents[glyphName] = fileName;
                if(this._reverseContents !== undefiend)
                    this._reverseContents[fileName.toLowerCase()] = glyphName;
            }
            var path = [this.dirName, fileName].join('/');
            if(io.pathExistsSync(path)){
                var oldData = io.readFileSync(path);
                // this checks if the bytes are the same in the same order
                // but a check if the data means the same would be better
                // here.
                if (data == oldData)
                    return;
            }
            throw new NotImplementedError('No writing of files is implemented.');
            f = open(path, WRITE_MODE)
            f.write(data)
            f.close()
        },
        /**
         * raises NotImplementedError
         * would use synchronous IO 
         * 
         * Permanently delete the glyph from the glyph set on disk. Will
         * raise KeyError if the glyph is not present in the glyph set.
         */
        deleteGlyph function (glyphName) {
            this._purgeCachedGLIF(glyphName);
            var fileName = this.contents[glyphName],
            path = [this.dirName, fileName].join('/');
            throw new NotImplementedError('deleting files is not implemented');
            os.remove(path)
            if(this._reverseContents !== undefined)
                delete(this._reverseContents[this.contents[glyphName].toLowerCase()]);
            delete(this.contents[glyphName]);
        },
        
        // dict-like support …
        // there is no magic happening like in python, but we do something
        // in the same mind hen possible.
        
        /**
         * def keys(self):
         *  return self.contents.keys()
         * u.se:
         * 
         * for(var k in glyphSet.contents);
         * 
         * in python the keys method is used like the following most of the time
         * 
         * for k in glyphSet.keys:
         *      pass
         */
        
        /**
         * silly thing, don't think one would use it in js
         */
        has_key: function(glyphName) {
            return glyphName in this.contents;
        },
        
        //nope, won't do this, its magical
        //__contains__ = has_key
        
        getLength: function() {
            var length = 0;
            for(var k in this.contents)
                length += 1;
            return length;
        },
        get length: function() {
            return this.getLength();
        },
        /**
         * this is magic, too
         * but a getter here is not too bad
         * def __getitem__(self, glyphName)
         */
        get: function(glyphName) {
            if(!(glyphName in this.contents))
                throw new KeyError(glyphName);
            return new this.glyphClass(glyphName, this);
        },
        // quickly fetch unicode values
        /**
         * not shure if this makes sense in our scenario ... parsing files
         * partially etc.
         * 
         * Return a dictionary that maps glyph names to lists containing
         * the unicode value[s] for that glyph, if any. This parses the .glif
         * files partially, so it is a lot faster than parsing all files completely.
         * By default this checks all glyphs, but a subset can be passed with glyphNames.
         */
        getUnicodes: function(glyphNames/*undefined or a list */) {
            var unicodes = {}, glyphName, doc;
            if(glyphNames !== undefined)
                glyphNames = setLike(glyphNames);
            else
                glyphNames = this.contents;
            for(glyphName in glyphNames) {
                doc = this.getGLIFDocument(glyphName);
                unicodes[glyphName] = fetchUnicodes(doc);
            }
            return unicodes;
        },
        /**
         * Return a dictionary that maps glyph names to lists containing the
         * base glyph name of components in the glyph. This parses the .glif
         * files partially, so it is a lot faster than parsing all files completely.
         * By default this checks all glyphs, but a subset can be passed with glyphNames.
         */
        getComponentReferences: function (glyphNames/*undefined or a list*/) {
            var components = {}, glyphName, doc;
            if(glyphNames !== undefined)
                glyphNames = setLike(glyphNames);
            else
                glyphNames = this.contents;
            for(glyphName in glyphNames) {
                doc = this.getGLIFDocument(glyphName);
                components[glyphName] = fetchComponentBases(doc);
            }
            return components;
        },
        /**
         * Return a dictionary that maps glyph names to the file name of the image
         * referenced by the glyph. This parses the .glif files partially, so it is a
         * lot faster than parsing all files completely.
         * By default this checks all glyphs, but a subset can be passed with glyphNames.
         */
        getImageReferences: function(glyphNames/*undefined or a list*/){
            var images = {}
            if(glyphNames !== undefined)
                glyphNames = setLike(glyphNames);
            else
                glyphNames = this.contents;
            for(glyphName in glyphNames) {
                doc = this.getGLIFDocument(glyphName);
                images[glyphName] = fetchImageFileName(doc);
            }
            return images;
        },
        
        // internal methods
        
        /**
         * reads a plist from path synchronously
         */
        _readPlist: function(path) {
            try {
                data = readPlistSync(path);
                return data;
            } catch(e) {
                //FIXME: should we log the oiginal error for debugging?
                throw new GlifLibError('The file ' + path + ' could not be read.');
            }
        }
    });
    return GlyphSet;
});
