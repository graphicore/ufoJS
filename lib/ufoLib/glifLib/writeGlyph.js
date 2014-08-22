/**
 * Copyright (c) 2012, Lasse Fister lasse@graphicore.de, http://graphicore.de
 *
 * You should have received a copy of the MIT License along with this program.
 * If not, see http://www.opensource.org/licenses/mit-license.php
 *
 * This is a port of various functions to write a generic glyph object
 * into a glif xml defined in robofab/branches/ufo3k/Lib/ufoLib/gliflib.py
 *
 * There have been modifications from the python sources because XML is
 * treated with the DOM in here.
 */
define(
    [
        'ufojs/main',
        'ufojs/errors',
        'ufojs/xml/main',
        'ufojs/plistLib/main',
        'ufojs/ufoLib/validators',
        './constants',
        './GLIFPointPen'
    ],
    function(
        main,
        errors,
        xml,
        plistLib,
        validators,
        constants,
        GLIFPointPen
) {
    "use strict";
    var GlifLibError = errors.GlifLib,
        isNumber = main.isNumber,
        isInt = main.isInt,
        imageValidator = validators.imageValidator,
        guidelinesValidator = validators.guidelinesValidator,
        anchorsValidator =  validators.anchorsValidator,
        glyphLibValidator = validators.glyphLibValidator,
        transformationInfo = constants.transformationInfo;

    /**
     * Return .glif data for a glyph as a UTF-8 encoded string.
     * The 'glyphObject' argument can be any kind of object (even None);
     * the writeGlyphToString() method will attempt to get the following
     * attributes from it:
     *     "width"      the advance width of the glyph
     *     "height"     the advance height of the glyph
     *     "unicodes"   a list of unicode values for this glyph
     *     "note"       a string
     *     "lib"        a dictionary containing custom data
     *     "image"      a dictionary containing image data
     *     "guidelines" a list of guideline data dictionaries
     *     "anchors"    a list of anchor data dictionaries
     *
     * All attributes are optional: if 'glyphObject' doesn't
     * have the attribute, it will simply be skipped.
     *
     * To write outline data to the .glif file, writeGlyphToString() needs
     * a function (any callable object actually) that will take one
     * argument: an object that conforms to the PointPen protocol.
     * The function will be called by writeGlyphToString(); it has to call the
     * proper PointPen methods to transfer the outline to the .glif file.
     *
     * The GLIF format version can be specified with the formatVersion argument.
     */
    function writeGlyphToString (
        glyphName
      , glyphObject /* default = undefined */
      , drawPointsFunc /* default = undefined */
        // the writer argument is not supported yet, here is no such concept
        /* writer default = undefined */
      , formatVersion /* default = 2 */
        /* undefined or a dict with optional keys:
         *    precision: number of decimal places to round numbers to
         */
      , options
    ) {
        var args = Array.prototype.slice.call(arguments)
          , doc = writeGlyphToDOM.apply(undefined, args)
          ;
        return xml.toString(doc);
    }

    function writeGlyphToDOM (
        glyphName
      , glyphObject /* default = undefined */
      , drawPointsFunc /* default = undefined */
        // the writer argument is not supported yet, here is no such concept
        /* writer default = undefined */
      , formatVersion /* default = 2 */
        /* undefined or a dict with optional keys:
         *    precision: number of decimal places to round numbers to
         */
      , options
    ) {
        var identifiers = {},
            doc,
            glyphElement,
            needOutline,
            outlineElement,
            pen;

        // we could also raise an exception on this one, but the docstring
        // says glyphObject is optional
        glyphObject = glyphObject || {}

        options = options || {}

        // start
        if(typeof glyphName !== 'string' && !(glyphName instanceof String))
            throw new GlifLibError('The glyph name is not properly formatted.')
        if(glyphName.length === 0)
            throw new GlifLibError('The glyph name is empty.');

        if(formatVersion === undefined)
            formatVersion = 2;

        doc = xml.createDocument(null, 'glyph', null);
        glyphElement = doc.documentElement;

        glyphElement.setAttribute('name', glyphName);
        glyphElement.setAttribute('format', formatVersion);

        // advance
        glyphElement.appendChild(_writeAdvance(glyphObject, doc, options))

        // unicodes
        if(glyphObject.unicodes !== undefined)
            glyphElement.appendChild(_writeUnicodes(glyphObject.unicodes, doc));

        // note
        if(glyphObject.note !== undefined)
            glyphElement.appendChild(_writeNote(glyphObject.note, doc));

        // image
        if(formatVersion >= 2 && glyphObject.image !== undefined)
            glyphElement.appendChild(_writeImage(glyphObject.image, doc,
                                     options));

        // guidelines
        if(formatVersion >= 2 && glyphObject.guidelines !== undefined)
            glyphElement.appendChild(
                _writeGuidelines(glyphObject.guidelines, doc, identifiers,
                                 options)
            );

        // anchors
        if(formatVersion >= 2  &&  glyphObject.anchors !== undefined)
            glyphElement.appendChild(
                _writeAnchors(glyphObject.anchors, doc, identifiers, options)
            );

        // outline
        needOutline = drawPointsFunc
            || formatVersion == 1 && glyphObject.anchors !== undefined;
        if(needOutline) {
            outlineElement = doc.createElement('outline');
            pen = new GLIFPointPen(outlineElement, identifiers, formatVersion, options);

            if(drawPointsFunc)
                drawPointsFunc(pen);
            if(formatVersion == 1 && glyphObject.anchors !== undefined)
                _writeAnchorsFormat1(pen, glyphObject.anchors);
            glyphElement.appendChild(outlineElement);
        }

        // lib
        if(glyphObject.lib !== undefined)
            glyphElement.appendChild(_writeLib(glyphObject.lib, doc));

        return doc;
    }

    /**
     *  a little helper
     */
    function _setAttributes(dict) {
        for(var k in dict)
            this.setAttribute(k, dict[k]);
    }

    /**
     * Round to 'precision' number decimal places.
     *
     * Since a precision of 0 makes totally sense: "no decimal places"
     * we use -1 to turn of rounding
     */
    function _round(precision, value) {
        if(precision === undefined || precision === -1)
            return value;
        return main.round(value, precision);
    }

    function _writeAdvance(glyphObject, document, options) {
        var keys = { width: undefined, height: undefined }
          , fragment = document.createDocumentFragment()
          , advanceElement = document.createElement('advance')
          , k, val
          ;
        for(k in keys) {
            val = glyphObject[k];
            if(val === undefined || val === 0)
                continue;
            if(!isNumber(val))
                throw new GlifLibError(k + ' attribute must be int or float');
            val = _round(options.precision, val)
            advanceElement.setAttribute(k, val)
        }
        if(advanceElement.attributes.length)
            fragment.appendChild(advanceElement);
        return fragment;
    }

    function _writeUnicodes(unicodes, document) {
        var seen = {}, // like a set
            i = 0,
            code,
            tag,
            hexCode,
            fragment = document.createDocumentFragment();
        // in my opinion unicodes should always be a list, an int would
        // be an error
        if (isInt(unicodes))
            unicodes = [unicodes];

        for(; i<unicodes.length; i++) {
            code = unicodes[i];
            if(!isInt(code))
                throw new GlifLibError('unicode values must be int');
            if(code in seen)
                continue;
            seen[code] = null;
            hexCode = code.toString(16).toUpperCase();
            if(hexCode.length < 4)
                hexCode = ['0', '0', '0', '0', hexCode]
                    .slice(hexCode.length)
                    .join('');
            tag = document.createElement('unicode');
            tag.setAttribute('hex', hexCode);
            fragment.appendChild(tag);
        }
        return fragment;
    }

    function _writeNote(note, document) {
        var noteElement;

        if(typeof note !== 'string')
            throw new GlifLibError('note attribute must be string');

        note = note.split('\n')// array
            .map(function(str){return str.trim();}) // array
            .join('\n'); // string

        noteElement = document.createElement('note');
        noteElement.appendChild(document.createTextNode(note));
        return noteElement;
    }

    function _writeImage(image, document, options) {
        var i=0,
            attr, defaultVal, imageElement, val;

        if(!imageValidator(image))
            throw new GlifLibError('image attribute must be a dict or '
                + 'dict-like object with the proper structure.');

        imageElement = document.createElement('image');
        imageElement.setAttribute('fileName', image.fileName);

        for(; i<transformationInfo.length; i++) {
            attr = transformationInfo[i][0];
            defaultVal = transformationInfo[i][1];
            val = image[attr];
            if(val === undefined) continue;
            val = _round(options.precision, val)
            if(val !== defaultVal)
                imageElement.setAttribute(attr, val);
        }

        if(image.color !== undefined)
            imageElement.setAttribute('color', image.color);

        return imageElement;
    }

    function _writeGuideline(data, document, options) {
        var guidelineElement = document.createElement('guideline')
          , roundAttributes = {'x': null, 'y': null, 'angle': null}
          , k
          , val
          ;
        // 'x', 'y', 'angle', 'name', 'color', 'identifier'
        for(k in data) {
            val = data[k];
            if(k in roundAttributes)
                val = _round(options.precision, val);
            guidelineElement.setAttribute(k, val);
        }
        return guidelineElement;
    }

    function _writeGuidelines(guidelines, document, identifiers, options) {
        var i=0
          , fragment
          ;
        if(!guidelinesValidator(guidelines, identifiers))
            throw new GlifLibError('guidelines attribute does not have '
                + 'the proper structure.');
        fragment = document.createDocumentFragment();
        for (; i<guidelines.length; i++)
            fragment.appendChild(
                    _writeGuideline(guidelines[i], document, options));
        return fragment;
    }

    function _writeAnchorsFormat1(pen, anchors) {
        var i = 0,
            anchor;
        if(!anchorsValidator(anchors))
            throw new GlifLibError('anchors attribute does not have the '
                + 'proper structure.');
        for(; i<anchors.length; i++) {
            anchor = anchors[i];
            pen.beginPath()
            pen.addPoint([anchor.x, anchor.y], "move", false, anchor.name);
            pen.endPath()
        }
    }

    function _writeAnchor(data, document, options) {
        var anchorElement = document.createElement('anchor')
          , roundAttributes = {'x': null, 'y': null}
          , k
          , val
          ;
        for(k in data) {
            val = data[k];
            if(k in roundAttributes)
                val = _round(options.preciosion, val);
            anchorElement.setAttribute(k, val);
        }
        return anchorElement;
    }

    function _writeAnchors(anchors, document, identifiers, options) {
        var i=0, fragment;
        if(!anchorsValidator(anchors, identifiers))
            throw new GlifLibError('anchors attribute does not have the '
                + 'proper structure.');

        fragment = document.createDocumentFragment();
        for (; i<anchors.length; i++)
            fragment.appendChild(_writeAnchor(anchors[i], document, options))
        return fragment;
    }

    function _writeLib(lib, document) {
        var validation, libElement;

        validation = glyphLibValidator(lib);
        if(!validation[0])
            throw new GlifLibError(validation[1]);
        libElement = document.createElement('lib');
        libElement.appendChild(
            plistLib.createPlistElement(document, lib)
        );
        return libElement;
    }

    return {
        toString: writeGlyphToString,
        toDOM: writeGlyphToDOM
    }
});

