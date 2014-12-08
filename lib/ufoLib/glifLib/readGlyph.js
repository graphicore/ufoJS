/**
 * Copyright (c) 2012, Lasse Fister lasse@graphicore.de, http://graphicore.de
 * 
 * You should have received a copy of the MIT License along with this program.
 * If not, see http://www.opensource.org/licenses/mit-license.php
 * 
 * This is a port of various functions to read a glif xml into a generic
 * glyph object defined in robofab/branches/ufo3k/Lib/ufoLib/gliflib.py
 *
 * There have been modifications from the python sources because XML is
 * treated with the DOM in here.
 */
define([
    'ufojs/main'
  , 'ufojs/errors'
  , 'ufojs/xml/main'
  , 'ufojs/plistLib/main'
  , 'ufojs/ufoLib/validators'
  , './constants'
], function(
    main
  , errors
  , xml
  , plistLib
  , validators
  , constants
) {
    "use strict";
    var GlifLibError = errors.GlifLib,
        glyphLibValidator = validators.glyphLibValidator,
        guidelinesValidator = validators.guidelinesValidator,
        anchorsValidator =  validators.anchorsValidator,
        imageValidator = validators.imageValidator,
        identifierValidator = validators.identifierValidator,
        transformationInfo = constants.transformationInfo;

    /**
     * You may pass a callback function as errorCallback. This
     * function will be called when an error is encountered during the
     * loading of a glyph. The errorCallback can return true and try
     * to let ReadGlyph do more parsing or false which will raise the
     * error immediately. Also, if "errorCallbackData.recoverable" is
     * false, errorCallback can report the error but not prevent it
     * from being thrown by returning true.
     */
    function ReadGlyph( errorCallback /* undefined or function*/ 
    ) {
        if(errorCallback) {
            this._errorCallback = errorCallback;
        }
        this._resetErrorCallbackData();
    }

    var _p = ReadGlyph.prototype;
    _p.constructor = ReadGlyph;

    _p._resetErrorCallbackData = function() {
        this._errorCallbackData = { glyphName: '' };
    }
    _p._executeErrorCallback = function(recoverable, msg) {
        var recover;
        this._errorCallbackData.message = msg;
        this._errorCallbackData.recoverable = recoverable;
        recover = this._errorCallback
            ? this._errorCallback( this._errorCallbackData )
            : false;
        if(!recover || !recoverable)
            throw new GlifLibError(msg);
    }


    /*
     * Read .glif data from a string into a glyph object.
     * 
     * The 'glyphObject' argument can be any kind of object (even None);
     * the readGlyphFromString() method will attempt to set the following
     * attributes on it:
     *   'width'      the advance with of the glyph
     *   'height'     the advance height of the glyph
     *   'unicodes'   a list of unicode values for this glyph
     *   'note'       a string
     *   'lib'        a dictionary containing custom data
     *   'image'      a dictionary containing image data
     *   'guidelines' a list of guideline data dictionaries
     *   'anchors'    a list of anchor data dictionaries
     * 
     * All attributes are optional, in two ways:
     *   1) An attribute *won't* be set if the .glif file doesn't
     *      contain data for it. 'glyphObject' will have to deal
     *      with default values itself.
     *   2) If setting the attribute fails with an AttributeError
     *      (for example if the 'glyphObject' attribute is read-
     *      only), readGlyphFromString() will not propagate that
     *      exception, but ignore that attribute.
     * 
     * To retrieve outline information, you need to pass an object
     * conforming to the PointPen protocol as the 'pointPen' argument.
     * This argument may be None if you don't need the outline data.
     * 
     * The formatVersions argument defined the GLIF format versions
     * that are allowed to be read.
     * 
     * _glifTreeFromFile from the python code should lead you here
     */
    _p.fromString = function(
        glyphDataString,
        glyphObject /* undefined */,
        pointPen /* undefined */,
        // the formatVersions argument is not used! this was in the python code.
        formatVersions /* default = [1, 2]*/
    ) {
        var glifDoc = xml.parseXMLString(glyphDataString);
        this.fromDOM(glifDoc, glyphObject, pointPen, formatVersions );
    }
    
    /**
     * defined as _readGlyphFromTree in the python code
     */
    _p.fromDOM = function(
        glifDoc,
        glyphObject /* undefined */,
        pointPen /* undefined */,
        // the formatVersions argument is not used! this was in the python code.
        formatVersions /* default = [1, 2]*/
    ) {
        try {
            // quick format validation
            var root = glifDoc.documentElement,
            formatError = false,
            formatVersion;
            if( typeof root === 'undefined'
                || typeof root.tagName !== 'string'
                || root.tagName !== 'glyph')
                formatError = true;
            if(formatError) {
                this._executeErrorCallback(false,'GLIF data is not properly formatted.');
            }

            // check the format version
            formatVersion = root.getAttribute('format');
            formatVersion = main.isIntString(formatVersion)
                ? parseInt(formatVersion, 10)
                : formatVersion;
            if(formatVersion === 1)
                this._readGlyphFromTreeFormat1(glifDoc, glyphObject, pointPen);
            else if(formatVersion === 2)
                this._readGlyphFromTreeFormat2(glifDoc, glyphObject, pointPen);
            else
                this._executeErrorCallback(false,'Unsupported GLIF format version: '
                                           + formatVersion + '.');
        }
        finally {
            this._resetErrorCallbackData();
        }
    }
    
    // this method is inherited from the python code
    // it's still there becaue this code could try to set
    // values on an undefined object
    // it's propably a good idea to make it superfluous by not setting
    // values on undefined
    _p._relaxedSetattr = function (object, attr, value) {
        try {
            object[attr] = value;
            return true;
        }
        catch(e) {
            if(!(e instanceof TypeError))
                throw e;
            /*else pass*/
        }
        return false;
    }
    
    _p._relaxedSetattrDict = function (object, dict) {
        for(var k in dict)
            this._relaxedSetattr(object, k, dict[k]);
    }
    
    _p._isDOMElement = function (node) {
        return (
            (node instanceof xml.Node)
            && node.nodeType === xml.Node.ELEMENT_NODE
        );
    }
    
    /**
     * This will yet allow more than the python version, because it uses
     * only Javascripts parseFloat, which is very forgiving
     * 
     * Python docstring:
     * Given a numeric string, return an integer or a float, whichever
     * the string indicates. _toNumber("1") will return the integer 1,
     * _toNumber("1.0") will return the float 1.0.
     * 
     * >>> _toNumber("1")
     * 1
     * >>> _toNumber("1.0")
     * 1.0
     * >>> _toNumber("a")
     * Traceback (most recent call last):
     *     ...
     * GlifLibError: Could not convert a to an int or float.
     */
    _p._toNumber = function (string) {
        var number;
        if(main.isNumber(string))
            return parseFloat(string);
        if(!main.isFloatString(string))
            throw new GlifLibError('Could not convert "' + string
                + '" to an int or float.');
        
        number = parseFloat(string)
        if(!isFinite(number))
            throw new GlifLibError('Could not convert "' + string
                + '" to an int or float.');
        return number;
    }
    
    /**
     * element.getAttribute but with an optional default Value
     * use this like:
     * _getAttribute.call(domElement, 'attrbuteName', 'fallbackValue');
     */
    _p._getAttribute = function (attribute, fallback /* default: null*/) {
        // this method allows undefined as a fallback value
        if(arguments.length < 2)
            fallback = null;
        if(this.hasAttribute(attribute))
            return this.getAttribute(attribute);
        return fallback;
    }
    
    /**
     * Make a list based interface for a function.
     * 
     * Takes a function as input and returns a function that takes an
     * array and applies (using Function.prototype.apply) the array items
     * as arguments to the input function.
     */
    _p._getArrayInterface = function (func) {
        return function(args) {
            return func.apply(this, args);
        }
    }
    
    /**
     * return a real array out of the children of a DOM Element
     */
    _p._listOfChildren = function (element) {
        return [].slice.call(element.children);
    }
    
    _p._attributesDict = function (node) {
        var attributes = {};
        for(var i=0; i<node.attributes.length; i++)
            attributes[node.attributes.item(i).name] = node.attributes.item(i).value;
        return attributes;
    }
    
    _p._checkAttributesWhitelist = function (
        element /* DOM Element*/,
        whitelist /* setLike */
    ) {
        var i=0, attrName;
        for(; i<element.attributes.length; i++) {
            attrName = element.attributes.item(i).name;
            if(!(attrName in whitelist))
                throw new GlifLibError('Unknown attribute (' + attrName
                    + ') in ' + element.tagName + ' element.');
        }
    }
    
    _p._readGlyphFromTreeFormat1 = function (
        glifDoc,
        glyphObject/* undefined */,
        pointPen/* undefined */
    ) {
        var root = glifDoc.documentElement;
        // get the name
        this._relaxedSetattr( glyphObject, 'name', this._readName(root));

        // bind the glyph name so that lower methods don't need it
        this._errorCallbackData.glyphName = glyphObject['name'];

        // populate the sub elements
        var unicodes = {list: [], dict: {}},
            haveSeenAdvance = false,
            haveSeenOutline = false,
            haveSeenLib = false,
            haveSeenNote = false,
            children = this._listOfChildren(root),
            i, node, element, v;
        
        for(i=0; i<children.length; i++) {
            node = children[i];
            element = node.tagName;
            if(element === 'outline') {
                if(haveSeenOutline)
                    throw new GlifLibError('The outline element occurs '
                        + 'more than once.');
                if(node.attributes.length)
                    throw new GlifLibError('The outline element contains '
                        + 'unknown attributes.');
                haveSeenOutline = true;
                if(pointPen !== undefined)
                    this._buildOutlineFormat1(glyphObject, pointPen,
                                        this._listOfChildren(node));
            }
            else if(element === 'advance') {
                if(haveSeenAdvance)
                    throw new GlifLibError('The advance element occurs '
                        + 'more than once.');
                haveSeenAdvance = true;
                this._relaxedSetattrDict(glyphObject, this._readAdvance(node));
            }
            else if(element === 'unicode') {
                v = node.getAttribute('hex');
                v = parseInt(v, 16);
                if(!isFinite(v))
                    throw new GlifLibError('Illegal value for hex '
                        + 'attribute of unicode element.');
                if(!(v in unicodes.dict)) {
                    // Could store indices of unicodes.list here if there
                    // was a need, anyone? This way unicodes.dict is still
                    // useable like a set in python
                    unicodes.dict[v] = true;
                    unicodes.list.push(v);
                }
            }
            else if(element === 'note') {
                if(haveSeenNote)
                    throw new GlifLibError('The note element occurs more '
                        + 'than once.');
                haveSeenNote = true;
                this._relaxedSetattr(glyphObject, 'note', this._readNote(node));
            }
            else if(element === 'lib') {
                if(haveSeenLib)
                    throw new GlifLibError('The lib element occurs more '
                    + 'than once.');
                haveSeenLib = true;
                this._relaxedSetattr(glyphObject, 'lib', this._readLib(node));
            }
            else throw new GlifLibError('Unknown element in GLIF: '
                    + element + '.');
        }
        // set the collected unicodes
        if(unicodes.list.length)
            this._relaxedSetattr(glyphObject, 'unicodes', unicodes.list);
    }
    
    
    _p._readGlyphFromTreeFormat2 = function (
        glifDoc,
        glyphObject/* undefined */,
        pointPen/* undefined */
    ) {
        var root = glifDoc.documentElement;
        // get the name
        this._relaxedSetattr(glyphObject, 'name', this._readName(root));
        this._errorCallbackData.glyphName = glyphObject['name'];

        // populate the sub elements
        var unicodes = {list: [], dict: {}},
            guidelines = [],
            anchors = [],
            haveSeenAdvance = false,
            haveSeenImage = false,
            haveSeenOutline = false,
            haveSeenLib = false,
            haveSeenNote = false,
            identifiers = {}, // set() in python
            children = this._listOfChildren(root),
            i, node, element, attrs, attr, v;
        for(i=0; i<children.length; i++) {
            node = children[i];
            element = node.tagName;
            if(element === 'outline') {
                if(haveSeenOutline)
                    throw new GlifLibError('The outline element occurs '
                        + 'more than once.');
                if(node.attributes.length)
                    throw new GlifLibError('The outline element contains '
                        + 'unknown attributes.');
                haveSeenOutline = true;
                if(pointPen !== undefined)
                    // FIXME: It's wrong to not check the outline here.
                    // Because the glyph could be invalid (duplicate
                    // identifiers for example). However: for some tasks
                    // it would be a performance hit I quess (when only
                    // reading a particular value, there is the rapid value
                    // fetching stuff in GlyphSet, maybe that API or a new
                    // one could be used in these cases). Another option
                    // would be a further optional Argument
                    // for this method.
                    // UFO 2 had no identifiers, and thus not this exact
                    // problem, however, the outline could be malformed in
                    // other ways, too.
                    // The glyph in the case of an invalid outline would
                    // be sometimes valid, when not reading the outline
                    // and sometimes invalid, when reading the outline.
                    // That is a bad thing.
                    // I'm leaving it for now, because the first aim is
                    // to be compatible to robofab.
                    this._buildOutlineFormat2( pointPen, this._listOfChildren(node),
                                              identifiers );
            }
            else if(element === 'advance') {
                if(haveSeenAdvance)
                    throw new GlifLibError('The advance element occurs '
                        + 'more than once.');
                haveSeenAdvance = true;
                this._relaxedSetattrDict(glyphObject, this._readAdvance(node));
            }
            else if(element === 'unicode') {
                v = node.getAttribute('hex');
                v = parseInt(v, 16);
                if(!isFinite(v))
                    throw new GlifLibError('Illegal value for hex '
                        + 'attribute of unicode element.');
                if(!(v in unicodes.dict)) {
                    // Could store indices of unicodes.list here if there
                    // was a need, anyone? This way unicodes.dict is still
                    // useable like a set in python
                    unicodes.dict[v] = true;
                    unicodes.list.push(v);
                }
            }
            else if(element === 'guideline') {
                if (node.childNodes.length)
                    throw new GlifLibError('Unknown children in guideline element.');
                attrs = this._attributesDict(node);
                for(attr in {x: null, y: null, angle: null})
                    if(attr in attrs)
                        attrs[attr] = this._toNumber(attrs[attr]);
                guidelines.push(attrs);
            }
            else if(element === 'anchor') {
                if (node.childNodes.length)
                    throw new GlifLibError('Unknown children in anchor element.')
                attrs = this._attributesDict(node);
                for(attr in {x: null, y: null})
                    if(attr in attrs)
                        attrs[attr] = this._toNumber(attrs[attr]);
                anchors.push(attrs);
            }
            else if(element === 'image') {
                if(haveSeenImage)
                    throw new GlifLibError('The image element occurs '
                        + 'more than once.')
                if (node.childNodes.length)
                    throw new GlifLibError('Unknown children in image '
                        + 'element.');
                haveSeenImage = true;
                this._relaxedSetattr(glyphObject, 'image',this._readImage(node));
            }
            else if(element === 'note') {
                if(haveSeenNote)
                    throw new GlifLibError('The note element occurs more '
                        + 'than once.');
                haveSeenNote = true;
                this._relaxedSetattr(glyphObject, 'note',this._readNote(node));
            }
            else if(element === 'lib') {
                if(haveSeenLib)
                    throw new GlifLibError('The lib element occurs more '
                    + 'than once.');
                haveSeenLib = true;
                this._relaxedSetattr(glyphObject, 'lib', this._readLib(node));
            }
            else throw new GlifLibError('Unknown element in GLIF: '
                    + element + '.');
        }
        // set the collected guidelines
        if(guidelines.length) {
            if(!guidelinesValidator(guidelines, identifiers))
                // FIXME: in case of duolicate identifieres be more clear
                throw new GlifLibError('The guidelines are improperly formatted.')
             this._relaxedSetattr(glyphObject, 'guidelines', guidelines);
        }
        // set the collected anchors
        if(anchors.length) {
            if(!anchorsValidator(anchors, identifiers))
                // FIXME: in case of duolicate identifieres be more clear
                throw new GlifLibError('The anchors are improperly formatted.')
            this._relaxedSetattr(glyphObject, 'anchors', anchors);
        }
        // set the collected unicodes
        if(unicodes.list.length)
            this._relaxedSetattr(glyphObject, 'unicodes', unicodes.list);
    }
    
    _p._readName = function (node) {
        var glyphName = node.getAttribute('name');
        
        if(typeof glyphName !== 'string' || glyphName === '')
            throw new GlifLibError('Empty glyph name in GLIF.');
        return glyphName;
    }
    
    _p._readAdvance = function (node) {
        var values = ['width', 'height']
            .map(node.getAttribute, node)
            .map(function(value){ return value === null ? 0 : value;})
            .map(this._toNumber);
        return {
            width: values[0],
            height: values[1]
        }
    }
    
    _p._readNote = function (node) {
        return this._listOfChildren(node) // array
            .map(function(item){return item.textContent;}) // array
            .join('\n') // string
            .split('\n')// array
            .map(function(str){return str.trim();}) // array
            .join('\n'); // string
    }
    
    _p._readLib = function (node) {
        if(node.children.length !== 1)
            throw new GlifLibError('lib node may have only one child, '
                +'but has ' + node.children.length + '.');
        
        var plistElement = node.firstElementChild || node.children[0],
            lib, validation;
        
        if(plistElement.tagName !== 'dict')
            throw new GlifLibError('The child node of lib must be "dict"'
                +'but is ' + plistElement.tagName + '.');
        
        lib = plistLib.readPlistElement(plistElement);
        validation = glyphLibValidator(lib);
            
        if(!validation[0])
            throw new GlifLibError(validation[1]);
        return lib;
    }
    
    _p._readImage = function (node) {
        var imageData = this._attributesDict(node),
            i=0, attr, value;
        // FIXME: it would be nice to have a single transformation value
        // at this point on the glyphObject instead of all those xScale,
        // xyScale, etc. values. Either as a list or as a new Transform()
        // from tools/misc/transform.
        // That of course would require some refactoring and might break
        // compatibillity to some existing python code, what would be ok
        // I guess???
        for(; i<transformationInfo.length; i++) {
            attr = transformationInfo[i][0];
            value = transformationInfo[i][1];
            if(attr in imageData)
                value = imageData[attr];
            imageData[attr] = this._toNumber(value);
        }
        // needs to happen after parsing, because the type of teh attributes
        // must be number
        if(!imageValidator(imageData))
            throw new GlifLibError('The image element is not properly '
                + 'formatted.');
        return imageData;
    }
    
    // ----------------
    // GLIF to PointPen
    // ----------------
    
    //all of these are defined as set in python
    var contourAttributesFormat2 = main.setLike(['identifier']),
        componentAttributesFormatBaseList = ['base', 'xScale', 'xyScale',
            'yxScale', 'yScale', 'xOffset', 'yOffset'],
        componentAttributesFormat1 = main.setLike(
            componentAttributesFormatBaseList),
        componentAttributesFormat2 = main.setLike(
            componentAttributesFormatBaseList.concat(['identifier'])),
        pointAttributesFormatBaseList = ['x', 'y', 'type', 'smooth',
            'name'],
        pointAttributesFormat1 = main.setLike(
            pointAttributesFormatBaseList),
        pointAttributesFormat2 = main.setLike(
            pointAttributesFormatBaseList.concat(["identifier"])),
        pointSmoothOptions = main.setLike(['no', 'yes']),
        pointTypeOptions = main.setLike(['move', 'line', 'offcurve',
            'curve', 'qcurve'])
        ;
    
    // format 1
    
    _p._buildOutlineFormat1 = function (glyphObject, pen, nodes ) {
        var i = 0,
            anchors = [],
            node, child, anchor;
        for(; i<nodes.length; i++) {
            node = nodes[i];
            if(!this._isDOMElement(node))
                throw new GlifLibError('The outline element is not '
                    + 'properly structured.');
            if(node.tagName == 'contour') {
                if(node.children.length == 1) {
                    // its an anchor
                    child = node.children[0];
                    if(child.tagName == "point") {
                        anchor = this._buildAnchorFormat1(child);
                        if(anchor)
                            anchors.push(anchor);
                    }
                    // FIXME: The Python source allows it when here is
                    // an unknown tag name. Beeing a little more strict
                    // at least our namespace should not be polluted with
                    // undocumented tags give it back to robofab? Its most
                    // probably too late for outline format version 1.
                    // else
                    //     new GlifLibError('Unknown element in contour '
                    //         + 'element: ' + child.tagName);
                }
                else
                    this._buildOutlineContourFormat1(pen, node)
            }
            else if(node.tagName == 'component')
                this._buildOutlineComponentFormat1(pen, node);
            else
                throw new GlifLibError('Unknown element in outline element '
                    +  node.tagName);
        }
        
        // set the collected anchors
        if(anchors.length) {
            if(!anchorsValidator(anchors))
                throw new GlifLibError('GLIF 1 anchors are not properly '
                    + 'formatted.');
            this._relaxedSetattr(glyphObject, 'anchors', anchors);
        }
    }
    
    _p._buildAnchorFormat1 = function (point /* a DOM Node */ ) {
        if( point.getAttribute('type') !== 'move')
            return;
        
        if (!point.hasAttribute('x'))
            throw new GlifLibError('Required x attribute is missing in '
                + 'point element.');
        if (!point.hasAttribute('y'))
            throw new GlifLibError('Required y attribute is missing in '
                + 'point element.');
        return {
            x: this._toNumber(point.getAttribute('x')),
            y: this._toNumber(point.getAttribute('y')),
            name: point.getAttribute('name')
        }
    }
    
    _p._buildOutlineContourFormat1 = function (pen, contour) {
        var children
        if (contour.attributes.length)
            throw new GlifLibError('Unknown attributes in contour element.')
        pen.beginPath();
        if (contour.children.length) {
            children = this._validateAndMassagePointStructures(
                this._listOfChildren(contour),
                pointAttributesFormat1,
                /* openContourOffCurveLeniency */ true )
            this._buildOutlinePointsFormat1(pen, children)
        }
        pen.endPath();
    }
    
    _p._buildOutlinePointsFormat1 = function (pen, points) {
        var i = 0,
            attrs;
        for (; i<points.length; i++) {
            attrs = points[i];
            pen.addPoint(
                [attrs.x, attrs.y],
                attrs.segmentType,
                attrs.smooth,
                attrs.name
            );
        }
    }
    
    _p._buildOutlineComponentFormat1 = function (pen, component) {
        var baseGlyphName,
            transformation;
        
        if (component.children.length)
            throw new GlifLibError('Unknown child elements of component '
                + 'element.');
        
        // throws GlifLibError
        this._checkAttributesWhitelist(component, componentAttributesFormat1);
        
        if(!component.hasAttribute('base'))
            throw new GlifLibError('The base attribute is not defined '
                + 'in the component.');
        baseGlyphName = component.getAttribute('base');
        
        transformation = transformationInfo
            // the contents of transformatiooInfo work well as arguments
            // of _getAttribute
            .map(this._getArrayInterface(this._getAttribute), component)
            .map(this._toNumber);
        pen.addComponent(baseGlyphName, transformation);
    }
    
    // format 2
    
    /**
     * little helper
     */
    _p._processIdentifier = function (identifier, identifiers) {
        if(identifier in identifiers)
            throw new GlifLibError('The identifier "' + identifier
                + '" is used more than once.');
        else if(!identifierValidator(identifier))
            throw new GlifLibError('The identifier "' + identifier
                + '" is not valid.');
        else
            identifiers[identifier] = true;
    }
    
    _p._buildOutlineFormat2 = function (pen, nodes, identifiers ) {
        var anchors = [], node, i=0;
        for (; i<nodes.length; i++) {
            node = nodes[i];
             if(!this._isDOMElement(node))
                throw new GlifLibError('The outline element is not '
                    + 'properly structured.');
            
            if(node.tagName === 'contour')
                this._buildOutlineContourFormat2(pen, node, identifiers )
            else if(node.tagName == 'component')
                this._buildOutlineComponentFormat2(pen, node, identifiers )
            else
                throw new GlifLibError('Unknown element in outline '
                    + 'element: ' + node.tagName);
        }
    }
    
    _p._buildOutlineContourFormat2 = function (pen, contour, identifiers) {
        var identifier, children;
        
        // throws GlifLibError
        this._checkAttributesWhitelist(contour, contourAttributesFormat2);
        if (contour.hasAttribute('identifier')) {
            identifier = contour.getAttribute('identifier');
            this._processIdentifier(identifier, identifiers);
        }
        pen.beginPath({identifier:identifier});
        
        if (contour.children.length) {
            children = this._validateAndMassagePointStructures(
                this._listOfChildren(contour),
                pointAttributesFormat2,
                false
            );
            this._buildOutlinePointsFormat2(pen, children, identifiers);
        }
        pen.endPath()
    }
    
    _p._buildOutlinePointsFormat2 = function (pen, points, identifiers) {
        var i = 0,
            attrs, identifier;
        for (; i<points.length; i++) {
            attrs = points[i];
            
            if(attrs.identifier !== undefined) {
                identifier = attrs.identifier;
                this._processIdentifier(identifier, identifiers);
            }
            pen.addPoint(
                    [attrs.x, attrs.y],
                    attrs.segmentType,
                    attrs.smooth,
                    attrs.name,
                    {identifier: attrs.identifier}
            );
        }
    }
    
    _p._buildOutlineComponentFormat2 = function (pen, component, identifiers ) {
        var baseGlyphName, transformation, identifier;
        
        if (component.children.length)
            throw new GlifLibError('Unknown child elements of component element.')
        
        // throws GlifLibError
        this._checkAttributesWhitelist(component, componentAttributesFormat2);
        
        if(!component.hasAttribute('base'))
            throw new GlifLibError('The base attribute is not defined '
                + 'in the component.');
        baseGlyphName = component.getAttribute('base');
        
        transformation = transformationInfo
            // the contents of transformatiooInfo work well as arguments
            // of _getAttribute
            .map(this._getArrayInterface(this._getAttribute), component)
            .map(this._toNumber);
        
        if (component.hasAttribute('identifier')) {
            identifier = component.getAttribute('identifier');
            this._processIdentifier(identifier, identifiers);
        }
        
        try {
            pen.addComponent(baseGlyphName, transformation, {identifier:identifier});
        // HELP: where is this error supposed to be risen. I can't find a pen that does so.
        }
        catch(e) {
            // FIXME: if there is a pen that is supposed to raise this error
            // in Javascript that has to happen explicitly.
            // TypeError would be still ok to expect
            if(!(e instanceof TypeError))
                throw e;
            pen.addComponent(baseGlyphName, transformation);
            errors.warn('DEPRECATED: The addComponent method needs an '
                + 'identifier kwarg. The component\'s identifier value '
                + 'has been discarded.');
        }
    }
    
    // all formats
    
    _p._validateAndMassagePointStructures = function (
        children /* a list of DOM Elements */,
        pointAttributes /* a setlike Objekt */,
        openContourOffCurveLeniency /* default: False */
    ) {
        // store some data for later validation
        var pointTypes = [],
            resultChildren = [],
            haveOnCurvePoint = false,
            haveOffCurvePoint = false,
            i, point, resultPoint, pointType, segment,
            segmentType, offCurves, k, smooth;
        
        if(!children.length)
            return resultChildren;
        
        // validate and massage the individual point elements
        for (i=0; i<children.length; i++) {
            point = children[i];
            
            // not <point>
            if(point.tagName != 'point')
                throw new GlifLibError('Unknown child element ('
                    + child.tagName + ') of contour element.');
            
            // unknown attributes, throws GlifLibError
            this._checkAttributesWhitelist(point, pointAttributes);
            
            resultPoint = this._attributesDict(point);
            resultChildren.push(resultPoint);
            // search for unknown children
            if(point.children.length)
                throw new GlifLibError('Unknown child elements in point '
                    + 'element.')
            
            // x and y are required
            for(k in {'x':undefined, 'y':undefined}) {
                if(resultPoint[k] === undefined)
                    throw new GlifLibError('Required ' + k +' attribute is '
                        + 'missing in point element.');
                resultPoint[k] = this._toNumber(resultPoint[k]);
            }
            
            // segment type
            pointType = resultPoint.type;
            if(pointType === 'offcurve' || pointType === undefined)
                pointType = null
            if(pointType !== null && !(pointType in pointTypeOptions))
                throw new GlifLibError('Unknown point type: '
                    + pointType);
            resultPoint.segmentType = pointType;
            if(pointType === null)
                haveOffCurvePoint = true;
            else
                haveOnCurvePoint = true;
            pointTypes.push(pointType);
            
            // move can only occur as the first point
            if(pointType === 'move' && i !== 0)
                throw new GlifLibError('A move point occurs after the '
                    + 'first point in the contour.')
            
            // smooth is optional
            smooth = resultPoint.smooth
            if(smooth !== undefined && !(smooth in pointSmoothOptions))
                throw new GlifLibError('Unknown point smooth value: '
                        + smooth);
            resultPoint.smooth = smooth === 'yes';
            
            // smooth can only be applied to curve and qcurve
            // FIXME: so what about "move" and "line"?
            if(resultPoint.smooth && pointType === null)
                throw new GlifLibError('smooth attribute set in an '
                    + 'offcurve point.');
            // name is optional
            if(!('name' in resultPoint))
                resultPoint.name = null;
        }
        
        if(openContourOffCurveLeniency) {
            errors.warn('test this openContourOffCurveLeniency')
            // remove offcurves that precede a move. this is technically
            // illegal, but we let it slide because there are fonts out
            // there in the wild like this.
            if(resultChildren[0].segmentType == 'move') {
                resultChildren.reverse()
                for(i=0; i<resultChildren.length; i++) {
                    if(resultChildren[i].segmentType !== null) {
                        resultChildren = resultChildren.slice(i);
                        break;
                    }
                    else if( resultChildren[i].segmentType === null) {
                        // remove the point
                        pointTypes.pop();
                    }
                }
                resultChildren.reverse();
            }
        }
        // validate the off-curves in the segments
        if(haveOffCurvePoint && haveOnCurvePoint) {
            while (pointTypes[pointTypes.length - 1] === null)
                pointTypes.unshift(pointTypes.pop());
            segment = [];
            for(i=0; i<pointTypes.length; i++) {
                pointType = pointTypes[i];
                segment.push(pointType);
                if(pointType === null)
                    continue;
                if(segment.length > 1) {
                    segmentType = segment[segment.length -1];
                    offCurves = segment.slice(0, -1);
                    // move and line can't be preceded by off-curves
                    if(segmentType === 'move')
                        // this will have been filtered out already
                        throw new GlifLibError('move can not have an '
                            + 'offcurve.');
                    else if(segmentType === 'line')
                        {
                            this._executeErrorCallback(true, 'line can not have an offcurve.');

                            // still here, try to recover.
                            resultChildren = [];
                            return resultChildren;
                        }
                    else if(segmentType === 'curve')
                        if (offCurves.length > 2) {
                            this._executeErrorCallback(true, 'Too many offcurves defined for curve.');

                            // still here, try to recover.
                            resultChildren = [];
                            return resultChildren;
                        }
                //    else if(segmentType === "qcurve")
                //        {/* pass */}
                //    else
                //        // unknown segement type. it'll be caught later.
                //        { /* pass */ }
                }
                // reset
                segment = [];
            }
        }
        return resultChildren;
    }
    
    return {
        fromString: _p.fromString.bind(new ReadGlyph()),
        fromDOM:    _p.fromDOM.bind(new ReadGlyph()),
        ReadGlyph:  ReadGlyph
    }
});
