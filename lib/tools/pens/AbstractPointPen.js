define(['graphicore', 'graphicore/errors'], function(main, errors) {
    var enhance = main.enhance;
    //shortcuts
    var NotImplementedError = errors.NotImplemented;
    
    /*********************
     * AbstractPointPen as seen at the Robofab Project
     *
     * I even copied the docstrings!
     *********************/
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
