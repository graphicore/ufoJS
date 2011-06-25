/**
 * straight from
 * fontTools.pens.basePen.py -- Tools and base classes to build pen objects.
 * 
 * The Pen Protocol
 * 
 * A Pen is a kind of object that standardizes the way how to "draw" outlines:
 * it is a middle man between an outline and a drawing. In other words:
 * it is an abstraction for drawing outlines, making sure that outline objects
 * don't need to know the details about how and where they're being drawn, and
 * that drawings don't need to know the details of how outlines are stored.
 * 
 * The most basic pattern is this:
 * 
 *     outline.draw(pen)  # 'outline' draws itself onto 'pen'
 * 
 * Pens can be used to render outlines to the screen, but also to construct
 * new outlines. Eg. an outline object can be both a drawable object (it has a
 * draw() method) as well as a pen itself: you *build* an outline using pen
 * methods.
 * 
 * The AbstractPen class defines the Pen protocol. It implements almost
 * nothing (only no-op closePath() and endPath() methods), but is useful
 * for documentation purposes. Subclassing it basically tells the reader:
 * "this class implements the Pen protocol.". An examples of an AbstractPen
 * subclass is fontTools.pens.transformPen.TransformPen.
 * 
 * The BasePen class is a base implementation useful for pens that actually
 * draw (for example a pen renders outlines using a native graphics engine).
 * BasePen contains a lot of base functionality, making it very easy to build
 * a pen that fully conforms to the pen protocol. Note that if you subclass
 * BasePen, you _don't_ override moveTo(), lineTo(), etc., but _moveTo(),
 * _lineTo(), etc. See the BasePen doc string for details. Examples of
 * BasePen subclasses are fontTools.pens.boundsPen.BoundsPen and
 * fontTools.pens.cocoaPen.CocoaPen.
 * 
 * Coordinates are usually expressed as (x, y) tuples, but generally any
 * sequence of length 2 will do.
 */
define(function(){
    // this stuff might eventually not go in here, this file is more to
    // hold the text above
    return {
       decomposeQuadraticSegment :function(){},
       decomposeSuperBezierSegment :function(){},
    }
})
