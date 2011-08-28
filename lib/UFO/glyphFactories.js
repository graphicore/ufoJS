/**
 * Copyright (c) 2011, Lasse Fister lasse@graphicore.de, http://graphicore.de
 * 
 * You should have received a copy of the MIT License along with this program.
 * If not, see http://www.opensource.org/licenses/mit-license.php
 * 
 * These methods currently return only the contour data from glif files.
 */

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
            return contours;
        }
    }
    return glyphFactories;
});
