define(
    [
        'ufojs/tools/pens/BasePen'
      , 'ufojs/tools/misc/arrayTools'
    ],
    function(
        Parent
      , arrayTools
) {
    "use strict";

    /**
	 * Pen to calculate the 'control bounds' of a shape. This is the
	 * bounding box of all control points __on closed paths__, so may
	 * be larger than the actual bounding box if there are curves that
	 * don't have points on their extremes.
	 * 
	 * Single points, or anchors, are ignored.
	 *
	 * When the shape has been drawn, the bounds are available as the
	 * 'bounds' attribute of the pen object. It's a 4-tuple:
	 *
	 * (xMin, yMin, xMax, yMax)
	 * 
	 * This replaces fontTools/pens/boundsPen (temporarily?)
	 * The fontTools bounds pen takes lose anchor points into account, 
	 * this one doesn't.
	 */
    /*constructor*/
    function ControlBoundsPen (glyphSet) {
        Parent.call(this, glyphSet);
		this.bounds = undefined;
		this._start = undefined;
    }

    /*inheritance*/
    var _p = ControlBoundsPen.prototype = Object.create(Parent.prototype);

    _p._moveTo = function (pt, kwargs/* optional, object contour attributes*/){
		this._start = pt;
    };
	
	_p._addMoveTo = function (){
		if (this._start == undefined)
			return;
		if (this.bounds){
			this.bounds = arrayTools.updateBounds(this.bounds, this._start);
        }
		else {
			var x = this._start[0]
              , y = this._start[1]
              ;
			this.bounds = [x, y, x, y];
        }
		this._start = undefined;
    };

	_p._lineTo = function (pt){
		this._addMoveTo();
		this.bounds = arrayTools.updateBounds(this.bounds, pt);
    };

	_p._curveToOne = function (bcp1, bcp2, pt){
		this._addMoveTo();
		this.bounds = arrayTools.updateBounds(this.bounds, bcp1);
		this.bounds = arrayTools.updateBounds(this.bounds, bcp2);
		this.bounds = arrayTools.updateBounds(this.bounds, pt);
    };

	_p._qCurveToOne = function (bcp, pt){
		this._addMoveTo();
		this.bounds = arrayTools.updateBounds(this.bounds, bcp);
		this.bounds = arrayTools.updateBounds(this.bounds, pt);
    };

    return ControlBoundsPen;
});
