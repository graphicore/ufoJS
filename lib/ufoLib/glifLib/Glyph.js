/**
 * Copyright (c) 2012, Lasse Fister lasse@graphicore.de, http://graphicore.de
 * 
 * You should have received a copy of the MIT License along with this program.
 * If not, see http://www.opensource.org/licenses/mit-license.php
 * 
 * This is a port of glifLib.Glyph defined in robofab/branches/ufo3k/Lib/ufoLib/gliflib.py
 *
 */ 
 
define(
    [
        'ufojs/errors'
      , 'ufojs/obtainJS/lib/obtain'
      , 'ufojs/tools/pens/PointToSegmentPen'
    ],
    function(
        errors
      , obtain
      , PointToSegmentPen
) {
    "use strict";
    
    // ------------
    // Simple Glyph
    //-------------
    
    /**
     * Minimal glyph object. It has no glyph attributes until either
     * the draw() or the drawPoint() method has been called.
     * 
     * The methods of this glyph are not enumerable, so that a 
     *     for(var k in glyph){ ... }
     * yields only glyph attributes
     */
     
    function Glyph(glyphName, glyphSet) {
        Object.defineProperty(_p, 'glyphName', {
            enumerable: false
          , value: glyphName
        })
        
        Object.defineProperty(_p, 'glyphSet', {
            enumerable: false
          , value: glyphSet
        })
    };
    
    var _p = Glyph.prototype;
    
    /**
     * Draw the outline of this glyph onto a *FontTools* Pen.
     * The rest of the data will be written directly onto the Glyph
     */
     Object.defineProperty(_p, 'draw', {
        enumerable: false
      , value: function(obtainsSwitch, pen) {
            var pointPen = PointToSegmentPen(pen);
            return this.drawPoints(obtainsSwitch, pointPen);
        }
    })
    
    
    Object.defineProperty(_p, '_readGlyph', {
        enumerable: false
      , value: function(obtainSwitch, pointPen) {
            var args = Array.prototype.slice.call(arguments);
            // insert this.glyphName
            // and the glyphObject argument === this
            args.splice(1, 0, this.glyphName, this);
            // args is now: [obtainSwitch, glyphname, this, pointPen]
            return this.glyphSet.readGlyph.apply(this.glyphSet, args)
        }
    })
    
    /**
     * Draw the outline of this glyph onto a PointPen.
     * The rest of the data will be written directly onto the Glyph
     */
    Object.defineProperty(_p, 'drawPoints', {
        enumerable: false
      , value: obtain.factory(
            {
                readGlyph: [false, 'pen', _p._readGlyph]
            }
          , {
                readGlyph: [true, 'pen', _p._readGlyph]
            }
          , ['pen']
          , function(obtain){ return obtain('readGlyph'); }
        )
    })
    
    return Glyph;
});
