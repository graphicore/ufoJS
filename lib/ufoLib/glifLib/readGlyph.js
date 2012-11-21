define(
    [
        'main',
        'errors',
        'ufojs/xml/main',
        'ufojs/plistLib/main',
        'ufojs/ufoLib/validators',
        './constants'
    ],
    function(
        main,
        errors,
        xml,
        plistLib,
        constants
    ) 
{
    
    var GlifLibError = errors.GlifLib,
        glyphLibValidator = validators.glyphLibValidator,
        guidelinesValidator = validators.guidelinesValidator,
        anchorsValidator =  validators.anchorsValidator,
        imageValidator = validators.imageValidator,
        transformationInfo = constants.transformationInfo;
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
     */
    function readGlyphFromString(
        aString,
        glyphObject /* undefined */,
        pointPen /* undefined */,
        // the formatVersions argument is not used! this was in the python code.
        formatVersions /* default = [1, 2]*/
    ) {
        
        var parser = new xml.Parser();
        var glifDoc = parser.parseFromString(aString, 'text/xml');
        readGlyphFromDOM(glifDoc, glyphObject, pointPen);
    }
    
    /**
     * defined as _readGlyphFromTree in the python code
     */
    function readGlyphFromDOM(
        glifDoc,
        glyphObject /* undefined */,
        pointPen /* undefined */,
        // the formatVersions argument is not used! this was in the python code.
        formatVersions /* default = [1, 2]*/
    ) {
        // quick format validation
        var root = glifDoc.documentElement,
            glifDoc.formatError = false,
            formatVersion;
        
        if( typeof root === 'undefined'
            || typeof root.nodeName !== 'string'
            || root.nodeName !== 'glyph')
            formatError = true;
        if formatError:
            throw new GlifLibError('GLIF data is not properly formatted.');
        // check the format version
        
        formatVersion = root.getAttribute('format');
        formatVersion = main.isIntString(formatVersion)
            ? parseInt(formatVersion, 10)
            : formatVersion;
        if(formatVersion === 1)
            _readGlyphFromTreeFormat1(glifDoc, glyphObject, pointPen);
        else if(formatVersion === 2)
            _readGlyphFromTreeFormat2(glifDoc, glyphObject, pointPen);
        else
            throw new GlifLibError('Unsupported GLIF format version: '
                + formatVersion + '.');
    }
    
    // this method is there becaue this code could try to set
    // values on a undefined object
    // it's propably a good idea to make it superfluous by not setting
    // values on undefined values
    function _relaxedSetattr(object, attr, value) {
        try {
            object[attr] = value;
        }
        catch(e) {
            if(!(e instanceof TypeError))
                throw e;
            /*else pass*/
        }
    }
    
    /**
     * This will yet allow more than the python version, because it uses
     * only Javascripts parseFloat, which is very forgiving
     * 
     * Python docstring:
     * Given a numeric string, return an integer or a float, whichever
     * the string indicates. _number("1") will return the integer 1,
     * _number("1.0") will return the float 1.0.
     * 
     * >>> _number("1")
     * 1
     * >>> _number("1.0")
     * 1.0
     * >>> _number("a")
     * Traceback (most recent call last):
     *     ...
     * GlifLibError: Could not convert a to an int or float.
     */
    function _number(string) {
        var number;
        if( !main.isFloatString(string)
        || isNaN( number = parseFloat(string) ) )
            throw new GlifLibError('Could not convert ' + string
                + ' to an int or float.');
        return number;
    }
    
    /**
     * return a real array out of the nodeList of a DOMNode
     */
    function _listOfChildren(node) {
        return [].slice.call(node.childNodes);
    }
    
    function _attributesDict(node) {
        var attributes = {};
        for(var i=0; i<node.attributes.length; i++)
            attributes[node.attributes.item(i).name] = node.attributes.item(i).value;
        return attributes;
    }
    
    function _readGlyphFromTreeFormat1(
        glifDoc,
        glyphObject/* undefined */,
        pointPen/* undefined */
    ) {
        var root = glifDoc.documentElement;
        // get the name
        _readName(glyphObject, root);
        // populate the sub elements
        var unicodes = {list: [], dict: {}},
            haveSeenAdvance = false,
            haveSeenOutline = false,
            haveSeenLib = false,
            haveSeenNote = false,
            children = _listOfChildren(root),
            i, node, element;
        
        for(i=0; i<children.length; i++) {
            node = children[i];
            element = node.nodeName;
            if(element === 'outline') {
                if(haveSeenOutline)
                    throw new GlifLibError('The outline element occurs '
                        + 'more than once.');
                if(node.attributes.length > 0)
                    throw new GlifLibError('The outline element contains '
                        + 'unknown attributes.');
                haveSeenOutline = true;
                if(pointPen !== undefined)
                    buildOutlineFormat1(glyphObject, pointPen,
                        _listOfChildren(node));
            }
            else if(glyphObject === undefined)
                continue;
            else if(element === 'advance') {
                if(haveSeenAdvance)
                    throw new GlifLibError('The advance element occurs '
                        + 'more than once.');
                haveSeenAdvance = true;
                _readAdvance(glyphObject, node);
            }
            else if(element === 'unicode') {
                var v = node.getAttribute('hex');
                v = parseInt(v, 16);
                if(isNaN(v))
                    throw new GlifLibError('Illegal value for hex '
                        + 'attribute of unicode element.');
                if(!(v in unicodes.dict)) {
                    unicodes.dict[v] = true;// could store indices here if there was a need?
                    unicodes.list.push(v);
                }
            }
            else if(element === 'note') {
                if(haveSeenNote)
                    throw new GlifLibError('The note element occurs more '
                        + 'than once.');
                haveSeenNote = true;
                _readNote(glyphObject, node);
            }
            else if(element === 'lib') {
                if(haveSeenLib)
                    throw new GlifLibError('The lib element occurs more '
                    + 'than once.');
                haveSeenLib = true;
                _readLib(glyphObject, node);
            }
            else throw new GlifLibError('Unknown element in GLIF: '
                    + element + '.');
        }
        if(glyphObject === undefined) return;
        // set the collected unicodes
        if(unicodes.list.length)
            glyphObject.unicodes = unicodes.list;
    }
    
    
    function _readGlyphFromTreeFormat2(
        glifDoc,
        glyphObject/* undefined */,
        pointPen/* undefined */
    ) {
        var root = glifDoc.documentElement;
        // get the name
        _readName(glyphObject, root);
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
            children = _listOfChildren(root),
            i, node, element, attrs, attr;
        for(i=0; i<children.length; i++) {
            node = children[i];
            element = node.nodeName;
            if(element === 'outline') {
                if(haveSeenOutline)
                    throw new GlifLibError('The outline element occurs '
                        + 'more than once.');
                if(node.attributes.length > 0)
                    throw new GlifLibError('The outline element contains '
                        + 'unknown attributes.');
                haveSeenOutline = true;
                if(pointPen !== undefined)
                    buildOutlineFormat2(glyphObject, pointPen,
                        _listOfChildren(node), identifiers);
            }
            else if(glyphObject === undefined)
                continue;
            else if(element === 'advance') {
                if(haveSeenAdvance)
                    throw new GlifLibError('The advance element occurs '
                        + 'more than once.');
                haveSeenAdvance = true;
                _readAdvance(glyphObject, node);
            }
            else if(element === 'unicode') {
                var v = node.getAttribute('hex');
                v = parseInt(v, 16);
                if(isNaN(v))
                    throw new GlifLibError('Illegal value for hex '
                        + 'attribute of unicode element.');
                if(!(v in unicodes.dict)) {
                    unicodes.dict[v] = true;// could store indices here if there was a need?
                    unicodes.list.push(v);
                }
            }
            else if(element === 'guideline') {
                if (node.childNodes.length > 0)
                    throw new GlifLibError('Unknown children in guideline element.');
                attrs = _attributesDict(node);
                for(attr in {x: null, y: null, angle: null})
                    if(attr in attrs)
                        attrs[attr] = _number(attrs[attr])
                guidelines.push(attrs);
            }
            else if(element === 'anchor') {
                if (node.childNodes.length > 0)
                    throw new GlifLibError('Unknown children in anchor element.')
                attrs = _attributesDict(node);
                for(attr in {x: null, y: null})
                for attr in ('x', 'y'):
                    if(attr in attrs)
                        attrs[attr] = _number(attrs[attr])
                anchors.append(attrs);
            }
            else if(element === 'image') {
                if(haveSeenImage)
                    throw new GlifLibError('The image element occurs '
                        + 'more than once.')
                if (node.childNodes.length > 0)
                    throw new GlifLibError('Unknown children in image element.')
                haveSeenImage = true;
                _readImage(glyphObject, child);
            }
            else if(element === 'note') {
                if(haveSeenNote)
                    throw new GlifLibError('The note element occurs more '
                        + 'than once.');
                haveSeenNote = true;
                _readNote(glyphObject, node);
            }
            else if(element === 'lib') {
                if(haveSeenLib)
                    throw new GlifLibError('The lib element occurs more '
                    + 'than once.');
                haveSeenLib = true;
                _readLib(glyphObject, node);
            }
            else throw new GlifLibError('Unknown element in GLIF: '
                    + element + '.');
        }
        // set the collected guidelines
        if(guidelines.length > 0) {
            if(!guidelinesValidator(guidelines, identifiers))
                throw new GlifLibError('The guidelines are improperly formatted.')
             if(typeof glyphObject !== 'undefined')
                glyphObject.guidelines = guidelines;
        }
        // set the collected anchors
        if(anchors.length > 1) {
            if(!anchorsValidator(anchors, identifiers))
                throw new GlifLibError('The anchors are improperly formatted.')
            if(typeof glyphObject !== 'undefined')
                glyphObject.anchors = anchors;
        }
        if(glyphObject === undefined) return;
        // set the collected unicodes
        if(unicodes.list.length)
            glyphObject.unicodes = unicodes.list;
    }
    
    function _readName(glyphObject, node) {
        var glyphName = node.getAttribute('name');
        
        if(typeof glyphName !== 'string' || glyphName === '')
            throw new GlifLibError('Empty glyph name in GLIF.');
        
        if(typeof glyphObject === 'undefined') return;
        glyphObject.name = glyphName;
    }
    
    function _readAdvance(glyphObject, node) {
        var values = ['width', 'height']
            .map(node.getAttribute, node)
            .map(_number);
        if(typeof glyphObject === 'undefined') return;
        glyphObject.width = values[0];
        glyphObject.height = values[1];
    }
    
    function _readNote(glyphObject, node) {
        if(typeof glyphObject === 'undefined') return;
        glyphObject.note = _listOfChildren(node) // array
            .map(function(item){return item.textContent;}) // array
            .join('\n') // string
            .split('\n')// array
            .map(function(str){return str.trim();}) // array
            .join('\n'); // string
    }
    
    function _readLib(glyphObject, node) {
        if(node.children.length !== 1)
            throw new GlifLibError('lib node may have only one child, '
                +'but has ' + node.children.length + '.');
        
        var plistElement = root.firstElementChild || root.children[0],
            lib, validation;
        
        if(plistElement.nodeName !== 'dict')
            throw new GlifLibError('The child node of lib must be "dict"'
                +'but is ' + plistElement.nodeName + '.');
        
        lib = plistLib.readPlistElement(plistElement);
        validation = glyphLibValidator(lib);
            
        if(!validation[0]):
            throw new GlifLibError(validation[1]);
        
        if(typeof glyphObject === 'undefined') return;
        glyphObject.lib = lib;
    }
    
    function _readImage(glyphObject, node) {
        var imageData = _attributesDict(node),
            i, attr, default, value;
        for(i=0; i<transformationInfo.length; i++) {
            attr = transformationInfo[i][0];
            default = transformationInfo[i][1];
            value = default;
            if(attr in imageData)
                value = imageData[attr];
            imageData[attr] = _number(value);
        }
        if(!imageValidator(imageData))
            throw new GlifLibError('The image element is not properly '
                + 'formatted.');
        if(typeof glyphObject === 'undefined') return;
        glyphObject.image = imageData;
    }
    
    // implement buildOutlineFormat1 and buildOutlineFormat2
    
    
    return {
        fromString: readGlyphFromString, 
        fromDOM: readGlyphFromDOM
    }
});
