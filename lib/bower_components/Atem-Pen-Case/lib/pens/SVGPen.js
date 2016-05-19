/**
 * Copyright (c) 2011, Lasse Fister lasse@graphicore.de, http://graphicore.de
 *
 * You should have received a copy of the MIT License along with this program.
 * If not, see http://www.opensource.org/licenses/mit-license.php
 *
 * This pen draws path data to a SVG path element. It inherts from BasePen.
 *
 * Noteable documents:
 *    http://www.w3.org/TR/SVG/paths.html#InterfaceSVGPathSegList
 *    http://www.w3.org/TR/SVG/paths.html#InterfaceSVGPathElement
 */

define([
    './BasePen'
], function(
    Parent
) {
    "use strict";

    /*constructor*/
    function SVGPen(path, glyphSet) {
        Parent.call(this, glyphSet);
        this.path = path;
    }

    /*inheritance*/
    var _p = SVGPen.prototype = Object.create(Parent.prototype);
    _p.constructor = SVGPen;

    /*definition*/
        _p._addSegment = function(segment)
        {
            var d = this.path.getAttribute('d');
            this.path.setAttribute('d', (d ? d + ' ' : '') + segment);
        };

        _p._moveTo = function(pt)
        {
            this._addSegment(['M',pt[0],pt[1]].join(' '));
        };

        _p._lineTo = function(pt)
        {
            this._addSegment(['L',pt[0],pt[1]].join(' '));
        };

        _p._curveToOne = function(pt1, pt2, pt3)
        {
            this._addSegment(['C', pt1[0], pt1[1], pt2[0], pt2[1]
                                            , pt3[0], pt3[1],].join(' '));
        };

        _p._closePath = function()
        {
            this._addSegment('z');
        };
        /**
         * Delete all segments from path
         */
        _p.clear = function()
        {
            this.path.setAttribute('d', '');
        };

    return SVGPen;
});
