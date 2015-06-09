define([],
function() {
    "use strict";

    function calcBounds(points){
        /* Returns the recangular area that contains
         * all points in the list 'points'.
         */
        var xMin = points[0][0]
          , yMin = points[0][1]
          , xMax = points[0][0]
          , yMax = points[0][1]
          , pt, x, y, i
          ;
        for (i=0; i<points.length; i++){
            pt = points[i];
            x = pt[0];
            y = pt[1];
            if (x < xMin) xMin = x;
            if (x > xMax) xMax = x;
            if (y < yMin) yMin = y;
            if (y > yMax) yMax = y;
        }
        return [xMin, yMin, xMax, yMax];
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
