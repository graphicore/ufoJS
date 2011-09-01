/**
 * Copyright (c) 2011, Lasse Fister lasse@graphicore.de, http://graphicore.de
 * 
 * You should have received a copy of the MIT License along with this program.
 * If not, see http://www.opensource.org/licenses/mit-license.php
 * 
 * This is a translation of AbstractPointPen defined in robofab/pens/pointPen.py
 * The svn revision of the source file in trunk/Lib/ was 67 from 2008-03-11 10:18:32 +0100
 * 
 * I even copied the docstrings and comments! (These may still refer to the Python code)
 */

define(['ufojs', 'ufojs/errors'], function(main, errors) {
    var enhance = main.enhance;
    //shortcuts
    var NotImplementedError = errors.NotImplemented;
    
    /*constructor*/
    function AbstractPointPen(){};

    /*inheritance*/
    //pass

    /*definition*/
    enhance(AbstractPointPen, {
        /**
         * Start a new sub path.
         */
        beginPath: function()
        {
            throw new NotImplementedError(
                'AbstractPointPen has not implemented'
                +' beginPath');
        },
        /**
         * End the current sub path.
         */
        endPath: function()
        {
            throw new NotImplementedError(
                'AbstractPointPen has not implemented'
                +' endPath');
        },
        /**
         * Add a point to the current sub path.
         */
        addPoint: function(
            pt,
            segmentType /* default null */,
            smooth /* default false */,
            name /* default null */,
            kwargs /* default an object, javascript has no **kwargs syntax */
        ) {
            segmentType = (segmentType === undefined) ? null : segmentType;
            smooth = (smooth || false);
            name = (name === undefined) ? null : name;
            kwargs = (kwargs || {});//an "options" object
            throw new NotImplementedError(
                'AbstractPointPen has not implemented'
                +' addPoint');
        },
        /**
         * Add a sub glyph.
         */
        addComponent: function(baseGlyphName, transformation)
        {
            throw new NotImplementedError(
                'AbstractPointPen has not implemented'
                +' addComponent');
        }
    });
    return AbstractPointPen;
});
