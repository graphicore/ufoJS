/**
 * Copyright (c) 2011, Lasse Fister lasse@graphicore.de, http://graphicore.de
 *
 * You should have received a copy of the MIT License along with this program.
 * If not, see http://www.opensource.org/licenses/mit-license.php
 *
 * This is a translation of PointToSegmentPen defined in robofab/pens/adapterPens.py
 * The svn revision of the source file in trunk/Lib/ was 67 from 2008-03-11 10:18:32 +0100
 *
 * I even copied the docstrings and comments! (These may still refer to the Python code)
 */

define(
    [
        'Atem-Errors/errors',
        './BasePointToSegmentPen'
    ],
    function(
        errors,
        Parent
) {
    "use strict";
    var assert = errors.assert;
    /*constructor*/
    /**
     * Adapter class that converts the PointPen protocol to the
     * (Segment)Pen protocol.
     */
    function PointToSegmentPen(
        segmentPen,
        outputImpliedClosingLine /* default: false*/
    ) {
        Parent.call(this);
        this.pen = segmentPen;
        this.outputImpliedClosingLine = (outputImpliedClosingLine || false);
    }

    /*inheritance*/
    var _p = PointToSegmentPen.prototype = Object.create(Parent.prototype);
    _p.constructor = PointToSegmentPen;

    /*definition*/
        _p._flushContour = function(segments)
        {
            assert(segments.length >= 1, 'Less than one segment');
            var pen = this.pen
              , closed, segment, segmentType, points, point
              , movePt, smooth, name, kwargs, i, n, l
              , outputImpliedClosingLine, nSegments, pt
              ;
            if( segments[0][0] == "move" ) {
                // It's an open path.
                closed = false;
                points = segments[0][1];
                assert(points.length === 1, 'Points length is not 1');
                movePt = points[0][0];
                smooth = points[0][1];
                name = points[0][2];
                kwargs = points[0][3];
                segments.splice(0, 1);
            } else {
                // It's a closed path, do a moveTo to the last
                // point of the last segment.
                closed = true;
                segment = segments[segments.length - 1];
                segmentType = segment[0];
                points = segment[1];
                point = points[points.length - 1];
                movePt = point[0];
                smooth = point[1];
                name = point[2];
                kwargs = point[3];
            }
            if(movePt === null) {
                // quad special case: a contour with no on-curve points
                // contains one "qcurve" segment that ends with a point
                // that's null. We must not output a moveTo() in that case.
                // pass
            } else {
                pen.moveTo(movePt);
            }
            outputImpliedClosingLine = this.outputImpliedClosingLine;
            nSegments = segments.length;
            for(i = 0; i < nSegments; i++) {
                segmentType = segments[i][0];
                points = [];
                for(n = 0, l=segments[i][1].length; n < l; n++)
                    points.push(segments[i][1][n][0]);
                if(segmentType == 'line') {
                    assert(points.length === 1, 'Points length is not 1');
                    pt = points[0];
                    if(i + 1 != nSegments
                    || outputImpliedClosingLine
                    || !closed)
                        pen.lineTo(pt);
                } else if(segmentType == 'curve') {
                    pen.curveTo.apply(pen, points);
                } else if(segmentType == 'qcurve') {
                    pen.qCurveTo.apply(pen, points);
                } else {
                    throw new errors.Type('illegal segmentType: '
                        + segmentType);
                }
            }
            if(closed)
                pen.closePath();
            else
                pen.endPath();
        };

        _p.addComponent = function(glyphName, transform)
        {
            this.pen.addComponent(glyphName, transform);
        };
    return PointToSegmentPen;
});
