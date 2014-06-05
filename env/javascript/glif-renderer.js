require({
    baseUrl: 'javascript',
    packages:[
        {
            name: 'ufojs',
            location: '../../lib',
            lib: ''
        },
        {
            name: 'dojo',
            location: 'dojo',
            lib: ''
        }
    ]
});

require([
    'dojo/dojo',
    'ufojs/UFO/glyphFactories',
    'ufojs/tools/pens/PointToSegmentPen',
    'ufojs/tools/pens/SVGPen',
    'ufojs/plistLib/main'
],
function(
    // dojo is loaded first, but dojo is not returned by the dojo loading
    // script and no define is used there. Instead its defined globally
    _pass_dojo,
    glyphFactories,
    PointToSegmentPen,
    SVGPen,
    plistLib
){
    var ufoDirectory = './ufos',
        // Just copy your UFOs into ufoDirectory and set the fontname
        // in the browser with the location hash like this:
        // http://localhost:8080/env/glif-renderer.xhtml#DemoFont.ufo
        // Replace "DemoFont.ufo" with your fonts name. Then reload the page.
        defaultFont = 'DemoFont.ufo',
        fontDirectory = window.location.hash.slice(1) || defaultFont,
        currentFontUrl = [ufoDirectory, fontDirectory].join('/'),
        glyphs = {},//filled by receiveGlyphsContentsPlist
        glyphset = {},//we cache the loaded glyphs here
        glyphsLoading = {};
    
    
    var receiveGlyphsContentsPlist = function(plist) {
        // with the right content type we wouldn't need to parse from string
        glyphs = plistLib.readPlistFromString(plist);//this is global
        var sorted = [], select, opt, label;
        for(var k in glyphs) sorted.push(k);
        sorted.sort();
        select = document.createElement('select');
        for(var i=0; k=sorted[i], i<sorted.length; i++){
            opt = document.createElement('option');
            opt.appendChild(document.createTextNode(k));
            opt.setAttribute('value', k);
            select.appendChild(opt);
        }
        
        select.firstElementChild.selected = true;
        
        var onChange = function(){
            var name = this.value;
            loadGlyph(this.value, function(){renderGlyph(name)});
        }
        select.addEventListener('change', onChange, false);
        
        label = document.createElement('label');
        label.setAttribute('style', 'display: block; margin:1.5em 0; font-style: italic;')
        label.appendChild(document.createTextNode('Select a glyph: '));
        label.appendChild(select);
        
        document.body.appendChild(label);
        
        //trigger once to initially load a glyph
        onChange.call(select);
    }
    
    /**
     * Yet there is no such thing like a glyph object, we just give all
     * objects returned by the 'glyhphFactories' this method as 'draw' to
     * enable us drawing with a segment-pen.
     */
    var _glyph_draw = function(pen) {
        // FIXME: the input filtering code(parseFloat etc.) must happen
        // somewhere else, input sanitization shouldn't be the task of a
        // method called draw
        var pointPen = new PointToSegmentPen(pen),//draw with a pointPen to pen
            outline = this.outline,
            type, value,
            path, point, pt, segmentType, smooth, name,
            component, transform;
        
        for(var i=0; i < outline.length ;i++) {
            type = outline[i][0];
            value = outline[i][1];
            if(type === 'contour') {
                pointPen.beginPath();
                path = value;
                for(var j=0; j < path.length; j++) {
                    point = path[j];
                    pt = [parseFloat(point.x), parseFloat(point.y)];
                    segmentType = point.type;
                    smooth = point.smooth;
                    name = point.name;
                    pointPen.addPoint(pt, segmentType, smooth, name);
                }
                pointPen.endPath();
            } else if(type === 'component') {
                component = value;
                transform = [
                    component.xScale,
                    component.xyScale,
                    component.yxScale,
                    component.yScale,
                    component.xOffset,
                    component.yOffset
                ].map(function(val){
                    val = parseFloat(val);
                    // null will make val the identity transformations value.
                    // That is the default value of a transormation matrix
                    // that does actually not transform.
                    return isNaN(val) ? null : val;
                });
                pen.addComponent(component.base, transform);
            }
        }
    }
    
    //set up an svg, the SVGPen an then draw the glyph on the pen
    var renderGlyph = function(name) {
        var glyph = glyphset[name],
            svgns = 'http://www.w3.org/2000/svg',
            svg = document.createElementNS(svgns, 'svg'),
            pathElement = document.createElementNS(svgns, 'path'),
            gElement = document.createElementNS(svgns, 'g'),
            svgPen = new SVGPen(pathElement, glyphset);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '1000px');
        svg.setAttribute('style', 'background:#abcdef');
        
        gElement.setAttribute('transform', 'matrix(1, 0, 0, -1, 0, 800)');
        gElement.appendChild(pathElement);
        svg.appendChild(gElement);
        glyph.draw(svgPen);
        
        var oldSvg = document.getElementsByTagNameNS(svgns, 'svg');
        if(oldSvg.length)
            oldSvg[0].parentNode.replaceChild(svg, oldSvg[0]);
        else
            document.body.appendChild(svg);
    }
    
    
    var loadFont = function() {
        // get more info in here?
        //dojo.xhrGet({
        //    // The URL to request
        //    url: currentFontUrl+'/fontinfo.plist',
        //    //handleAs: 'xml',//needs the correct content type header
        //    load: receiveFontinfoPlistFunction
        //});
        
        dojo.xhrGet({
            // The URL to request
            url: currentFontUrl+'/glyphs/contents.plist',
            //handleAs: 'xml',//needs the correct content type header
            load: receiveGlyphsContentsPlist
        });
    };
    
    var glyphIsNotLoaded = function(glyph){
        return !(glyph in glyphset);
    }
    
    //only called by loadGlyph
    var _load_dependencies = function(name, callback){
        // this method relies heavily on the closure that it is. the
        // callback onLoad will clean up the notLoaded list until it's
        // empty and then run callback once and set it to null; loadGlyph
        // will run onLoad in any case
        var outline = glyphset[name].outline,
            //get the names of the dependencies
            notLoaded = outline
                .filter(function(elem){return elem[0] === 'component'})
                .map(function(elem){return elem[1].base}),
            onLoad = function() {
                if(!callback) return;
                //run the callback when all dependencies are loaded
                notLoaded = notLoaded.filter(glyphIsNotLoaded);
                if(notLoaded.length > 0) return;
                callback();
                callback = null;
            };
        onLoad();//maybe everything is already there
        for(var i=0; i<notLoaded.length; i++)
            loadGlyph(notLoaded[i], null, onLoad);
    }
    
    
    var loadGlyph = function(name, callFinally, onLoad) {
        var glyphIsLoading, file, url;
        
        //is the glyph already loaded
        if(name in glyphset) {
            //async behavior might be expected
            setTimeout(function(){
                if(onLoad) onLoad();
                if(callFinally) callFinally();
            }, 0);
            return;
        }
        //is the glyph loading at the moment
        glyphIsLoading = (name in glyphsLoading);
        if(!glyphIsLoading)
            glyphsLoading[name] = [];
        if(onLoad)
            glyphsLoading[name].push(onLoad);
        if(glyphIsLoading)
            return;
        
        file = encodeURIComponent(glyphs[name]);
        url = [currentFontUrl, 'glyphs', file].join('/');
        dojo.xhrGet({
            // The URL to request
            url: url,
            //handleAs: 'xml',//needs the correct content type header
            error: function(err) {
                if(console && console.log)
                    console.log('Loading', name, 'failed with error', err);
                glyphset[name] = false;
                //inform the subscribers of the availabillity of the glyph
                for(var i=0; i<glyphsLoading[name].length; i++){glyphsLoading[name][i]();}
                delete glyphsLoading[name];
            },
            load: function(glifstring) {
                // with the right content type we wouldn't need to parse from string
                glyphset[name] = glyphFactories.fromGlifString(glifstring);
                glyphset[name].draw = _glyph_draw;//hack, until there is a real glyph object
                
                //inform the subscribers of the availabillity of the glyph
                for(var i=0; i<glyphsLoading[name].length; i++){glyphsLoading[name][i]();}
                delete glyphsLoading[name];
                //load all dependencies
                _load_dependencies(name, callFinally);
            }
        });
    }
    
    dojo.addOnLoad(function() { loadFont(); });
});
