define(
    [
        'graphicore',
        'graphicore/errors',
        './BasePen'
    ],
    function(
        main,
        errors,
        BasePen
    )
{
    var enhance = main.enhance;
    
    /**
     * noteable documents:
     *    http://www.w3.org/TR/SVG/paths.html#InterfaceSVGPathSegList
     *    http://www.w3.org/TR/SVG/paths.html#InterfaceSVGPathElement
     */
    
    
    /*constructor*/
    function SVGPen(path, glyphSet) {
        BasePen.call(this, glyphSet);
        this.path = path;
        this.segments = path.pathSegList;
    };
    
    /*inheritance*/
    SVGPen.prototype = new BasePen;

    /*definition*/
    enhance(SVGPen, {
        _commands:
        {
            'moveTo': 'createSVGPathSegMovetoAbs',
            'lineTo': 'createSVGPathSegLinetoAbs',
            'curveTo': 'createSVGPathSegCurvetoCubicAbs',
            'closePath': 'createSVGPathSegClosePath'
        },
        _addSegment: function(name, args)
        {
                //make a real array out of this
            var args = args ? [].slice.call(args) : [],
                // make a flat list out of the points, because the
                // SVG Path Commands work that way
                points = args.concat.apply([], args),
                cmd = this._commands[name],
                path = this.path,
                segment = path[cmd].apply(path, points);
            this.segments.appendItem(segment);
        },
        _moveTo: function(pt)
        {
            this._addSegment('moveTo', arguments);
        },
        _lineTo: function(pt)
        {
            this._addSegment('lineTo', arguments);
        },
        _curveToOne: function(pt1, pt2, pt3)
        {
            //notice that we change the order of the points
            this._addSegment('curveTo', [pt3, pt1, pt2]);
        },
        _closePath: function()
        {
            this._addSegment('closePath');
        },
        /**
         * Delete all segments from path
         */
        clear: function()
        {
            this.segments.clear();
        }
    });
    
    return SVGPen;
});
