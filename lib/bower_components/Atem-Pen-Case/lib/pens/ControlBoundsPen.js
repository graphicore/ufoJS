define(
    [
        './BasePen'
      , 'Atem-Pen-Case/tools/arrayTools'
    ],
    function(
        Parent
      , arrayTools
) {
    "use strict";
    var updateBounds = arrayTools.updateBounds;

    /**
     * javascript port based on the original python sources from:
     * https://github.com/robofab-developers/robofab/blob/445e45d75567efccd51574c4aa2a14d15eb1d4db/Lib/robofab/pens/boundsPen.py
     *
     * but also check the boundsPen.py file in the master branch:
     * https://github.com/robofab-developers/robofab/blob/master/Lib/robofab/pens/boundsPen.py
     * as it seems more actively mantained even though the code in their ufo3k branch is the primary source for ufoJS.
     *
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

    /* constructor */
    function ControlBoundsPen (glyphSet) {
        Parent.call(this, glyphSet);
        this.bounds = undefined;
        this._start = undefined;
    }

    /* inheritance */
    var _p = ControlBoundsPen.prototype = Object.create(Parent.prototype);
    _p.constructor = ControlBoundsPen;

    _p._moveTo = function (pt, kwargs/* optional, object contour attributes*/){
        this._start = pt;
    };

    _p._addMoveTo = function (){
        if (this._start === undefined)
            return;
        if (this.bounds){
            this.bounds = updateBounds(this.bounds, this._start);
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
        this.bounds = updateBounds(this.bounds, pt);
    };

    _p._curveToOne = function (bcp1, bcp2, pt){
        this._addMoveTo();
        this.bounds = updateBounds(this.bounds, bcp1);
        this.bounds = updateBounds(this.bounds, bcp2);
        this.bounds = updateBounds(this.bounds, pt);
    };

    _p._qCurveToOne = function (bcp, pt){
        this._addMoveTo();
        this.bounds = updateBounds(this.bounds, bcp);
        this.bounds = updateBounds(this.bounds, pt);
    };

    return ControlBoundsPen;
});
