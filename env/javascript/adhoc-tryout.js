print = console.log;//doh expects a print method
require({
    baseUrl: 'javascript'
  , paths: {
        'obtain': '../../lib/obtainJS/lib'
      , 'ufojs': '../../lib'
      , 'tests': '../../tests'
    }
}
,
[
    'ufojs/xml/main',
    'ufojs/tools/io/static'
], function(
    xml,
    io
) {
    // https://developer.mozilla.org/en/Using_XPath
    var evaluateXPath = function(aNode, aExpr) {
        var xpe = aNode.ownerDocument || aNode;
        var nsResolver = xpe.createNSResolver(xpe.documentElement);
        var result = xpe.evaluate(
            aExpr,
            aNode,
            nsResolver,
            xml.XPathResult.ORDERED_NODE_ITERATOR_TYPE,
            null
        );
        var found = [];
        var res;
        while (res = result.iterateNext())
            found.push(res);
        return found;
    };
    
    var string = '<?xml version="1.0" encoding="UTF-8"?><glyph name="A" format="1"><advance width="487"/><unicode hex="0041"/><outline><contour><point x="243" y="681" type="move" name="top"/></contour><contour><point x="243" y="739" type="move" name="top"/></contour><contour><point x="243" y="-75" type="move" name="bottom"/></contour><contour><point x="243" y="739" type="move" name="top"/></contour><contour><point x="243" y="-75" type="move" name="bottom"/></contour><contour><point x="460" y="0" type="line"/><point x="318" y="664" type="line"/><point x="169" y="664" type="line"/><point x="27" y="0" type="line"/><point x="129" y="0" type="line"/><point x="150" y="94" type="line"/><point x="328" y="94" type="line"/><point x="348" y="0" type="line"/></contour><contour><point x="307" y="189" type="line"/><point x="172" y="189" type="line"/><point x="214" y="398" type="line"/><point x="239" y="541" type="line"/><point x="249" y="541" type="line"/><point x="264" y="399" type="line"/></contour></outline></glyph>';
    var parser = new xml.Parser();
    var glifDoc = parser.parseFromString(string, "text/xml");
    var result = evaluateXPath(glifDoc, '/glyph/outline[1]/contour|/glyph/outline[1]/component');
    console.log(result.length);
    console.log(io.getMtime(false, './adhoc.xhtml'));
    io.getMtime(true, './adhoc.xhtml')
    .then(function(date){
        console.log( date );   
    });
});
