define([],
function() {
    "use strict";
    /**
     * javascript port based on the original python sources from:
     * https://github.com/behdad/fonttools/blob/b30e12ae00b30a701b6829951c254d7e44c34057/Lib/fontTools/misc/arrayTools.py
     *
     * The following methods are not ported, though:
     * - calcIntBounds(array)
     * - pointsInRect(array, rect)
     * - vectorLength(vector)
     * - asInt16(array)
     * - normRect(rect)
     * - scaleRect(rect, x, y)
     * - offsetRect(rect, dx, dy)
     * - insetRect(rect, dx, dy)
     * - sectRect(rect1, rect2)
     * - rectCenter(rect0)
     * - intRect(rect1)
     *
     */

    function calcBounds(points){
        /* Returns the recangular area that contains
         * all points in the list 'points'.
         */
        if(!points.length)
            return [0, 0, 0, 0];
        var xs = []
          , ys = []
          , i, l
          ;
        for(i=0, l=points.length; i<l; i++){
            xs.push(points[i][0]);
            ys.push(points[i][1]);
        }
        return [Math.min.apply(null, xs), Math.min.apply(null, ys)
              , Math.max.apply(null, xs), Math.max.apply(null, ys)];
    }

    function updateBounds(bounds, pt){
        /* Returns the recangular area that contains
         * both the rectangle 'bounds' and point 'pt'.
         */
        var xMin = bounds[0]
          , yMin = bounds[1]
          , xMax = bounds[2]
          , yMax = bounds[3]
          , x = pt[0]
          , y = pt[1]
          ;
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
        return [xMin, yMin, xMax, yMax];
    }

    function pointInRect(pt, rect){
        /* Returns True when point 'pt' is inside rectangle 'rect'.
         */
        var x = pt[0]
          , y = pt[1]
          , xMin = rect[0]
          , yMin = rect[1]
          , xMax = rect[2]
          , yMax = rect[3]
          ;
        return xMin <= x && x <= xMax && yMin <= y && y <= yMax;
    }

    function unionRect(r1, r2){
        /* Returns the recangular area that contains
         * both the rectangles 'r1' and 'r2'.
         */
        var xMin = Math.min( r1[0], r2[0] )
          , yMin = Math.min( r1[1], r2[1] )
          , xMax = Math.max( r1[2], r2[2] )
          , yMax = Math.max( r1[3], r2[3] )
          ;
        return [xMin, yMin, xMax, yMax];
    }

    return {
        calcBounds: calcBounds
      , updateBounds: updateBounds
      , pointInRect: pointInRect
      , unionRect: unionRect
    };
});
