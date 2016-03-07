define([
    './AbstractPointPen'
  , 'Atem-Math-Tools/transform'
], function(
    Parent
  , transform
) {
    "use strict";
    var Transform = transform.Transform;
    /**
     * PointPen that transforms all coordinates using a Affine transformation,
     * and passes them to another pen.
     */

    /*constructor*/
    /**
     * The 'outPen' argument is another PointPen object. It will receive the
     * transformed coordinates. The 'transformation' argument can either
     * be a six-element Array, or a tools.misc.transform.Transform object.
     */
    function TransformPointPen(outPen, transformation) {
        Parent.call(this);
        if( transformation instanceof Array)
            transformation = new Transform(transformation);
        this._transformation = transformation;

        this._outPen = outPen;
    }

    /*inheritance*/
    var _p = TransformPointPen.prototype = Object.create(Parent.prototype);
    _p.constructor = TransformPointPen;

    /*definition*/
    _p._transformPoint = function( pt ) {
        return this._transformation.transformPoint(pt);
    };

    _p.beginPath = function( kwargs/*optional, dict*/ ) {
        this._outPen.beginPath(kwargs);
    };

    _p.endPath = function() {
        this._outPen.endPath();
    };

    _p.addPoint = function( pt, segmentType, smooth, name, kwargs ) {
        this._outPen.addPoint(this._transformPoint(pt), segmentType, smooth, name, kwargs);
    };

    _p.addComponent = function(glyphName, transformation) {
        transformation = this._transformation.transform(transformation);
        this._outPen.addComponent(glyphName, transformation);
    };

    return TransformPointPen;
});
