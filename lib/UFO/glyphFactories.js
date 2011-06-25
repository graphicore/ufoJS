// man sollte hier das eigene glyph object mit dessen
// draw methode bauen
// wir ein basicGlyph aussieht kann ich ja vielleicht in RoboFab
// sehen, wichtig ist vor allem die Methoden struktur.
// das wird kein Port von Robofab, aber es wäre doof die guten
// Ideen dieser Leute zu missachten.

define(['./dom', './glyph'], function(dom, glyph) {
    /*definition*/
    var glyphFactories = {
        fromGlifString: function(glifString) {
            var parser = new DOMParser();
            var glifDoc = parser.parseFromString(glifString, "text/xml");
            return glyphFactories.fromGlifDocument(glifDoc)
        },
        fromGlifDocument: function(glifDoc) {
            var contoursExpr = '/glyph/outline[1]/contour';
            var contourElements = dom.evaluateXPath( glifDoc, contoursExpr );
            var outlinesExpr = './point';
            var contours = [];
            for(var i in contourElements) {
                var outlineElements = dom.evaluateXPath( contourElements[i], outlinesExpr );
                contours[i] = outlineElements.map(dom.getAtrributesAsDict)
            }
            console.dir(contours);
        }
    }
    
    return glyphFactories;
});
