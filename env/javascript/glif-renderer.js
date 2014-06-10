require({
    baseUrl: 'javascript'
  , paths: {
        'obtain': '../../lib/obtainJS/lib'
      , 'ufojs': '../../lib'
      , 'tests': '../../tests'
    }
});



require([
    'domReady'
  , 'ufojs/tools/io/staticBrowserREST'
  , 'ufojs/ufoLib/glifLib/GlyphSet'
  , 'ufojs/tools/pens/SVGPen'
],
function(
    // dojo is loaded first, but dojo is not returned by the dojo loading
    // script and no define is used there. Instead its defined globally
    domReady
  , staticIO
  , GlyphSet
  , SVGPen
) {
    var svgns = 'http://www.w3.org/2000/svg',
        ufoDirectory = './ufos',
        // Just copy your UFOs into ufoDirectory and set the fontname
        // in the browser with the location hash like this:
        // http://localhost:8080/env/glif-renderer.xhtml#DemoFont.ufo
        // Replace "DemoFont.ufo" with your fonts name. Then reload the page.
        defaultFont = 'DemoFont.ufo';
        
        
    
    function svgPenFactory(glyphset) {
        var svg = document.createElementNS(svgns, 'svg')
          , pathElement = document.createElementNS(svgns, 'path')
          , gElement = document.createElementNS(svgns, 'g')
          , svgPen = new SVGPen(pathElement, glyphset)
          ;
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '1000px');
        svg.setAttribute('style', 'background:#abcdef');
        
        gElement.setAttribute('transform', 'matrix(1, 0, 0, -1, 0, 800)');
        gElement.appendChild(pathElement);
        svg.appendChild(gElement);
        return svgPen;
    }
    
    function mountSVG(svg) {
        var oldSvg = document.getElementsByTagNameNS(svgns, 'svg');
        if(oldSvg.length)
            oldSvg[0].parentNode.replaceChild(svg, oldSvg[0]);
        else
            document.body.appendChild(svg);
    }
    
    function onChangeGlyph(glyphSet, event) {
        var pen = svgPenFactory(glyphSet)
          , glyph
          ;
        glyph = glyphSet.get(event.target.value)
        glyph.draw(true, pen)
            .then(mountSVG.bind(null, pen.path.ownerSVGElement));
    }
    
    function onLoadGlyphSet(glyphSet) {
        var select = document.createElement('select')
          , label = document.createElement('label')
          ;
        label.setAttribute('style', 'display: block; margin:1.5em 0; font-style: italic;')
        label.appendChild(document.createTextNode('Select a glyph: '));
        label.appendChild(select);
        
        // write the options to the select
        glyphSet.keys().sort().forEach(
            function(name) {
                var opt = document.createElement('option');
                opt.appendChild(document.createTextNode(name));
                opt.setAttribute('value', name);
                this.appendChild(opt);
            }, select);
        
        select.addEventListener('change', onChangeGlyph.bind(null, glyphSet), false);
        document.body.appendChild(label);
        
        if(!select.length)
            return;
        select.firstElementChild.selected = true;
        // load the first glyph
        var event = new Event('change');
        select.dispatchEvent(event);
    }
    
    domReady(function() {
        var fontDirectory = window.location.hash.slice(1) || defaultFont
          , glyphLayerPath = [ufoDirectory, fontDirectory, 'glyphs'].join('/')
          ;
        GlyphSet.factory(true, staticIO, glyphLayerPath)
        .then(onLoadGlyphSet);
    });
});
