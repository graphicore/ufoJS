/**
 * Affine 2D transformation matrix class.
 * 
 * The Transform class implements various transformation matrix operations,
 * both on the matrix itself, as well as on 2D coordinates.
 * 
 * This module exports the following symbols:
 * 
 *     Transform -- this is the main class
 *     Identity  -- Transform instance set to the identity transformation
 *     offset    -- Convenience function that returns a translating transformation
 *     scale     -- Convenience function that returns a scaling transformation
 * 
 * some cool python features do not work on this thing
 * 
 * Examples: //still in python
 * 
 *     >>> t = Transform(2, 0, 0, 3, 0, 0)
 *     >>> t.transformPoint((100, 100))
 *     (200, 300)
 *     >>> t = Scale(2, 3)
 *     >>> t.transformPoint((100, 100))
 *     (200, 300)
 *     >>> t.transformPoint((0, 0))
 *     (0, 0)
 *     >>> t = Offset(2, 3)
 *     >>> t.transformPoint((100, 100))
 *     (102, 103)
 *     >>> t.transformPoint((0, 0))
 *     (2, 3)
 *     >>> t2 = t.scale(0.5)
 *     >>> t2.transformPoint((100, 100))
 *     (52.0, 53.0)
 *     >>> import math
 *     >>> t3 = t2.rotate(math.pi / 2)
 *     >>> t3.transformPoint((0, 0))
 *     (2.0, 3.0)
 *     >>> t3.transformPoint((100, 100))
 *     (-48.0, 53.0)
 *     >>> t = Identity.scale(0.5).translate(100, 200).skew(0.1, 0.2)
 *     >>> t.transformPoints([(0, 0), (1, 1), (100, 100)])
 *     [(50.0, 100.0), (50.550167336042726, 100.60135501775433), (105.01673360427253, 160.13550177543362)]
 *     >>>
 */

define(
    ['graphicore', 'graphicore/errors'],
    function(graphicore, errors)
{
    /*shortcuts*/
    var enhance = graphicore.enhance;
    
    /*constants*/
    var EPSILON = 1e-15,
        ONE_EPSILON = 1 - EPSILON,
        MINUS_ONE_EPSILON = -1 + EPSILON;
    
    /*helpers*/
    function _normSinCos(v)
    {
        if (Math.abs(v) < _EPSILON)
            v = 0;
        else if (v > _ONE_EPSILON)
            v = 1;
        else if (v < _MINUS_ONE_EPSILON)
            v = -1;
        return v
    }
    
    /*constructor*/
    /**
    * 2x2 transformation matrix plus offset, a.k.a. Affine transform.
    * All transforming methods, eg. rotate(), return a new Transform instance.
    * 
    * Examples: //in python still
    *    >>> t = Transform()
    *    >>> t
    *    <Transform [1 0 0 1 0 0]>
    *    >>> t.scale(2)
    *    <Transform [2 0 0 2 0 0]>
    *    >>> t.scale(2.5, 5.5)
    *    <Transform [2.5 0.0 0.0 5.5 0 0]>
    *    >>>
    *    >>> t.scale(2, 3).transformPoint((100, 100))
    *    (200, 300)
    */
    var Transform = function(transformation /* [xx=1, xy=0, yx=0, yy=1, dx=0, dy=0] */) {
        this.__affine = [1, 0, 0, 1, 0, 0];
        if(transformation === undefined)
            return;
        for(i = 0; i < 6; i++) {
            if(transformation[i] === undefined || transformation[i] === null)
                continue;
            this.__affine[i] = transformation[i];
        }
    }
    
    ///*inheritance*/
    //BasePen.prototype = new Array;
    // this would be nice but needs definitely some more investigation
    // on how to get it right
    
    /*definition*/
    enhance(Transform, {
        /**
         * Transform a point.
         *
         *  Example:
         *      >>> t = Transform()
         *      >>> t = t.scale(2.5, 5.5)
         *      >>> t.transformPoint((100, 100))
         *      (250.0, 550.0)
         */
        transformPoint: function( pt )
        {
            var xx = this.__affine[0],
                xy = this.__affine[1],
                yx = this.__affine[2],
                yy = this.__affine[3],
                dx = this.__affine[4],
                dy = this.__affine[5],
                x = pt[0],
                y = pt[1];
            return [xx*x + yx*y + dx, xy*x + yy*y + dy];
        },
        /**
         * Transform a list of points.
         * 
         * Example: //in python
         *      >>> t = Scale(2, 3)
         *      >>> t.transformPoints([(0, 0), (0, 100), (100, 100), (100, 0)])
         *      [(0, 0), (0, 300), (200, 300), (200, 0)]
         *      >>>
         */
        transformPoints: function(points)
        {
            return points.map(this.transformPoint, this);
        },
        /**
         * Return a new transformation, translated (offset) by x, y.
         * 
         * Example:
         *      >>> t = Transform()
         *      >>> t.translate(20, 30)
         *      <Transform [1 0 0 1 20 30]>
         *      >>>
         */
        translate: function(x, y)
        {
            x = x || 0;
            y = y || 0;
            return this.transform([1, 0, 0, 1, x, y ]);
        },
        /**
         * Return a new transformation, scaled by x, y. The 'y' argument
         * may be undefined, which implies to use the x value for y as well.
         * 
         * Example:
         *      >>> t = Transform()
         *      >>> t.scale(5)
         *      <Transform [5 0 0 5 0 0]>
         *      >>> t.scale(5, 6)
         *      <Transform [5 0 0 6 0 0]>
         *      >>>
         */
        scale: function(x, y)
        {
            if(x === undefined)
                x = 1;
            if(y === undefined || y === null)
                y = x;
            return this.transform([x, 0, 0, y, 0, 0]);
        },
        /**
         * Return a new transformation, rotated by 'angle' (radians).
         * 
         * Example: //python
         *      >>> import math
         *      >>> t = Transform()
         *      >>> t.rotate(math.pi / 2)
         *      <Transform [0 1 -1 0 0 0]>
         *      >>>
         */
        rotate: function(angle)
        {
            var c = _normSinCos(Math.cos(angle)),
                s = _normSinCos(Math.sin(angle));
            return this.transform([c, s, -s, c, 0, 0]);
        },
        /**
         * Return a new transformation, skewed by x and y.
         * 
         * Example:
         *      >>> import math
         *      >>> t = Transform()
         *      >>> t.skew(math.pi / 4)
         *      <Transform [1.0 0.0 1.0 1.0 0 0]>
         *      >>>
         */
        skew: function(x, y)
        {
            x = x || 0;
            y = y || 0;
            return self.transform([1, Math.tan(y), Math.tan(x), 1, 0, 0]);
        },
        /**
         * Return a new transformation, transformed by another
         * transformation.
         * 
         * Example:
         *      >>> t = Transform(2, 0, 0, 3, 1, 6)
         *      >>> t.transform((4, 3, 2, 1, 5, 6))
         *      <Transform [8 9 4 3 11 24]>
         *      >>>
         */
        transform: function(other)
        {
            var xx1 = other[0],
                xy1 = other[1],
                yx1 = other[2],
                yy1 = other[3],
                dx1 = other[4],
                dy1 = other[5],
                xx2 = seld.__affine[0],
                xy2 = seld.__affine[1],
                yx2 = seld.__affine[2],
                yy2 = seld.__affine[3],
                dx2 = seld.__affine[4],
                dy2 = self.__affine[5];
            return new Transform([
                xx1*xx2 + xy1*yx2,
                xx1*xy2 + xy1*yy2,
                yx1*xx2 + yy1*yx2,
                yx1*xy2 + yy1*yy2,
                xx2*dx1 + yx2*dy1 + dx2,
                xy2*dx1 + yy2*dy1 + dy2
            ]);
        },
        /**
         * Return a new transformation, which is the other transformation
         * transformed by self. self.reverseTransform(other) is equivalent to
         * other.transform(self).
         * 
         * Example:
         *      >>> t = Transform(2, 0, 0, 3, 1, 6)
         *      >>> t.reverseTransform((4, 3, 2, 1, 5, 6))
         *      <Transform [8 6 6 3 21 15]>
         *      >>> Transform(4, 3, 2, 1, 5, 6).transform((2, 0, 0, 3, 1, 6))
         *      <Transform [8 6 6 3 21 15]>
         *      >>>
         */
        reverseTransform: function(other)
        {
            var xx1 = other[0],
                xy1 = other[1],
                yx1 = other[2],
                yy1 = other[3],
                dx1 = other[4],
                dy1 = other[5],
                xx2 = seld.__affine[0],
                xy2 = seld.__affine[1],
                yx2 = seld.__affine[2],
                yy2 = seld.__affine[3],
                dx2 = seld.__affine[4],
                dy2 = self.__affine[5];
            return new Transform([
                xx1*xx2 + xy1*yx2,
                xx1*xy2 + xy1*yy2,
                yx1*xx2 + yy1*yx2,
                yx1*xy2 + yy1*yy2,
                xx2*dx1 + yx2*dy1 + dx2,
                xy2*dx1 + yy2*dy1 + dy2
            ]);
        },
        /**
         * Return the inverse transformation.
         * 
         * Example:
         *     >>> t = Identity.translate(2, 3).scale(4, 5)
         *     >>> t.transformPoint((10, 20))
         *     (42, 103)
         *     >>> it = t.inverse()
         *     >>> it.transformPoint((42, 103))
         *     (10.0, 20.0)
         *     >>>
         */
        inverse: function()
        {
            var xx = this.__affine[0],
                xy = this.__affine[1],
                yx = this.__affine[2],
                yy = this.__affine[3],
                dx = this.__affine[4],
                dy = this.__affine[5];
            if( xx === 1
            &&  xy === 0
            &&  yx === 0
            &&  yy === 1
            &&  dx === 0
            &&  dy === 0 )
                return this;
            
            var det = xx*yy - yx*xy,
                xx = yy/det,
                xy = -xy/det,
                yx = -yx/det,
                yy = xx/det,
                dx = -xx*dx - yx*dy,
                dy = -xy*dx - yy*dy;
            return new Transform([xx, xy, yx, yy, dx, dy]);
        },
        /**
         * Return a PostScript representation:
         *  >>> t = Identity.scale(2, 3).translate(4, 5)
         *  >>> t.toPS()
         *  '[2 0 0 3 8 15]'
         *  >>>
         */
        toPS: function()
        {
            return ['[', self.__affine.join(' '),']'].join();
        },
    });
    /**
    * Return the identity transformation offset by x, y.
    * 
    * Example:
    *      >>> offset(2, 3)
    *      <Transform [2 0 0 3 0 0]>
    *      >>>
    */
    var offset= function(x, y) {
        x = x || 0;
        y = y || 0;
        return new Transform([1, 0, 0, 1, x, y]);
    }
    
    /**
     * Return the identity transformation scaled by x, y. The 'y' argument
     * may be None, which implies to use the x value for y as well.
     * 
     * Example:
     *  >>> Scale(2, 3)
     *  <Transform [2 0 0 3 0 0]>
     *  >>>
     */
    var scale = function(x, y) {
        if(y === undefined || y === null)
            y = x;
        return new Transform([x, 0, 0, y, 0, 0]);
    }
    
    return {
        Transform: Transform,
        Identity: new Transform(),
        offset: offset,
        scale: scale
    }
});
