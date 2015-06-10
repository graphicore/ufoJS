define(
    [
        'ufojs/tools/pens/ControlBoundsPen'
      , 'ufojs/tools/misc/arrayTools'
      , 'ufojs/tools/misc/bezierTools'
    ],
    function(
        Parent
      , arrayTools
      , bezierTools
) {
    "use strict";
    /**
     * javascript port based on the original python sources from:
     * https://github.com/robofab-developers/robofab/blob/445e45d75567efccd51574c4aa2a14d15eb1d4db/Lib/robofab/pens/boundsPen.py
     *
     * but also check the boundsPen.py file in the master branch:
     * https://github.com/robofab-developers/robofab/blob/master/Lib/robofab/pens/boundsPen.py
     * as it seems more actively mantained even though the code in their ufo3k branch is the primary source for ufoJS.
     *
     * Pen to calculate the bounds of a shape. It calculates the
     * correct bounds even when the shape contains curves that don't
     * have points on their extremes. This is somewhat slower to compute
     * than the "control bounds".
     *
     * When the shape has been drawn, the bounds are available as the
     * 'bounds' attribute of the pen object. It's a 4-tuple:
     *
     * (xMin, yMin, xMax, yMax)
     */

    /* constructor */
    function BoundsPen (glyphSet) {
        Parent.call(this, glyphSet);
		this.bounds = undefined;
		this._start = undefined;
    }

    /* inheritance */
    var _p = BoundsPen.prototype = Object.create(Parent.prototype);

    _p._curveToOne = function (bcp1, bcp2, pt){
		this._addMoveTo();
		this.bounds = arrayTools.updateBounds(this.bounds, pt);
		if (!arrayTools.pointInRect(bcp1, this.bounds) ||
            !arrayTools.pointInRect(bcp2, this.bounds)){
			this.bounds = arrayTools.unionRect(this.bounds,
                bezierTools.calcCubicBounds(
				    this._getCurrentPoint()
                  , bcp1
                  , bcp2
                  , pt
                )
            );
        }
    };

    _p._qCurveToOne = function (bcp, pt){
		this._addMoveTo();
		this.bounds = arrayTools.updateBounds(this.bounds, pt);
		if (! arrayTools.pointInRect(bcp, this.bounds)){
			this.bounds = arrayTools.unionRect(
                this.bounds
              , bezierTools.calcQuadraticBounds(
					this._getCurrentPoint()
                  , bcp
                  , pt
                )
            );
        }
    };

    _p.getBounds = function (){
        return this.bounds;
    };

    return BoundsPen;
});
