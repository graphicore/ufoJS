define([
    './arrayTools'
],
function(
    arrayTools
){
    "use strict";
    /**
     * javascript port based on the original python sources from:
     * https://github.com/behdad/fonttools/blob/b30e12ae00b30a701b6829951c254d7e44c34057/Lib/fontTools/misc/bezierTools.py
     *
     * The following methods are not ported, though:
     * - splitLine(pt1, pt2, where, isHorizontal)
     * - splitQuadratic(pt1, pt2, pt3, where, isHorizontal)
     * - splitCubic(pt1, pt2, pt3, pt4, where, isHorizontal)
     * - splitQuadraticAtT(pt1, pt2, pt3, *ts)
     * - splitCubicAtT(pt1, pt2, pt3, pt4, *ts)
     * - _splitQuadraticAtT(a, b, c, *ts)
     * - _splitCubicAtT(a, b, c, d, *ts)
     * - solveCubic(a, b, c, d)
     * - calcQuadraticPoints(a, b, c)
     * - calcCubicPoints(a, b, c, d)
     *
     */
    var epsilon = 1e-12
      , calcBounds = arrayTools.calcBounds
      ;
    function solveQuadratic(a, b, c, sqroot_){
        /* Solve a quadratic equation where a, b and c are real.
         *
         * a*x*x + b*x + c = 0
         *
         * This function returns a list of roots. Note that the
         * returned list is neither guaranteed to be sorted nor
         * to contain unique values!
         */
        var sqroot = sqroot_ || Math.sqrt
          , roots
          , D2
          , rD2
          ;
        if (Math.abs(a) < epsilon){
            if (Math.abs(b) < epsilon){
                // We have a non-equation;
                // therefore, we have no valid solution
                roots = [];
            }
            else {
                // We have a linear equation with 1 root.
                roots = [-c/b];
            }
        }
        else {
            // We have a true quadratic equation.
            // Apply the quadratic formula to find two roots.
            D2 = b*b - 4.0*a*c;
            if (D2 >= 0.0){
                rD2 = sqroot(D2);
                roots = [(-b+rD2)/2.0/a, (-b-rD2)/2.0/a];
            }
            else {
                // complex roots, ignore
                roots = [];
            }
        }
        return roots;
    }

    function calcQuadraticParameters(pt1, pt2, pt3){
        var x2 = pt2[0]
          , y2 = pt2[1]
          , x3 = pt3[0]
          , y3 = pt3[1]
          , cx = pt1[0]
          , cy = pt1[1]
          , bx = (x2 - cx) * 2.0
          , by = (y2 - cy) * 2.0
          , ax = x3 - cx - bx
          , ay = y3 - cy - by
          ;
        return [[ax, ay], [bx, by], [cx, cy]];
    }

    function calcCubicParameters(pt1, pt2, pt3, pt4){
        var x2 = pt2[0]
          , y2 = pt2[1]
          , x3 = pt3[0]
          , y3 = pt3[1]
          , x4 = pt4[0]
          , y4 = pt4[1]
          , dx = pt1[0]
          , dy = pt1[1]
          , cx = (x2 - dx) * 3.0
          , cy = (y2 - dy) * 3.0
          , bx = (x3 - x2) * 3.0 - cx
          , by = (y3 - y2) * 3.0 - cy
          , ax = x4 - dx - cx - bx
          , ay = y4 - dy - cy - by
          ;
        return [[ax, ay], [bx, by], [cx, cy], [dx, dy]];
    }

    function calcQuadraticBounds(pt1, pt2, pt3){
        /* Return the bounding box for a qudratic bezier segment.
         *
         * pt1 and pt3 are the "anchor" points, pt2 is the "handle".
         *
         * >>> calcQuadraticBounds((0, 0), (50, 100), (100, 0))
         * (0, 0, 100, 50.0)
         * >>> calcQuadraticBounds((0, 0), (100, 0), (100, 100))
         * (0.0, 0.0, 100, 100)
         */
        var params = calcQuadraticParameters(pt1, pt2, pt3)
          , ax = params[0]
          , ay = params[1]
          , bx = params[2]
          , by = params[3]
          , cx = params[4]
          , cy = params[5]
          , ax2 = ax*2.0
          , ay2 = ay*2.0
          , points = []
          , roots = []
          , t
          ;
        if (ax2 !== 0) {
            roots.push(-bx/ax2);
        }
        if (ay2 !== 0) {
            roots.push(-by/ay2);
        }

        while((t = roots.pop()) !== undefined) {
            if (0 <= t && t < 1) {
                points.push([ax*t*t + bx*t + cx, ay*t*t + by*t + cy]);
            }
        }
        points.push(pt1, pt3);

        return calcBounds(points);
    }

    function calcCubicBounds(pt1, pt2, pt3, pt4){
        /* Return the bounding rectangle for a cubic bezier segment.
         * pt1 and pt4 are the "anchor" points, pt2 and pt3 are the "handles".
         *
         * >>> calcCubicBounds((0, 0), (25, 100), (75, 100), (100, 0))
         * (0, 0, 100, 75.0)
         * >>> calcCubicBounds((0, 0), (50, 0), (100, 50), (100, 100))
         * (0.0, 0.0, 100, 100)
         * >>> calcCubicBounds((50, 0), (0, 100), (100, 100), (50, 0))
         * (35.566243270259356, 0, 64.43375672974068, 75.0)
         */
        var params = calcCubicParameters(pt1, pt2, pt3, pt4)
          , ax = params[0]
          , ay = params[1]
          , bx = params[2]
          , by = params[3]
          , cx = params[4]
          , cy = params[5]
          , dx = params[6]
          , dy = params[7]
          , ax3 = ax * 3.0
          , ay3 = ay * 3.0
          , bx2 = bx * 2.0
          , by2 = by * 2.0
          , points = []
          , roots = [] , i, l, t
          ;
        roots = [].concat(solveQuadratic(ax3, bx2, cx), solveQuadratic(ay3, by2, cy));
        for (i=0, l=roots.length; i<l; i++){
            t = roots[i];
            if (0 <= t && t < 1)
                points.push([ax*t*t*t + bx*t*t + cx * t + dx, ay*t*t*t + by*t*t + cy * t + dy]);
        }
        points.push(pt1, pt4);
        return calcBounds(points);
    }

    return {
        calcQuadraticBounds: calcQuadraticBounds
      , calcCubicBounds: calcCubicBounds
      , solveQuadratic: solveQuadratic
    };
});
