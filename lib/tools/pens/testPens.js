define(
    [
        'graphicore',
        'graphicore/errors',
        './AbstractPen',
        './BasePen',
        './BasePointPen'
    ],
    function(main, errors, AbstractPen, BasePen, BasePointPen)
{
    var enhance = main.enhance;
    
    /*********************
     * These pens store the last method name and its arguments in an
     * array at pen.commands so that we can assert on the values of the
     * call. Use pen.flush() to receive all previous commands since the
     * last pen.flush()
     *********************/
    
    var _store = function(functionName, args)
    {
        this.commands.push([functionName].concat([].slice.call(args)));
    }
    
    /**
     * return all commands since the last flush and reset this.commands
     */
    var flush = function()
    {
        var commands = this.commands;
        this.commands = [];
        return commands;
    }
    
    
    /*constructor*/
    function AbstractTestPen() {
        this.commands = [];
    };
    
    /*inheritance*/
    AbstractTestPen.prototype = new AbstractPen;

    /*definition*/
    enhance(AbstractTestPen, {
        _store: _store,
        flush: flush,
        moveTo: function(pt)
        {
            this._store('moveTo', arguments);
        },
        lineTo: function(pt)
        {
            this._store('lineTo', arguments);
        },
        curveTo: function(/* *points */)
        {
            this._store('curveTo', arguments);
        },
        qCurveTo: function (/* *points */)
        {
            this._store('qCurveTo', arguments);
        },
        closePath: function()
        {
            this._store('closePath', arguments);
        },
        endPath: function()
        {
            this._store('endPath', arguments);
        },
        addComponent: function(glyphName, transformation)
        {
            this._store('addComponent', arguments);
        }
    });


    /*constructor*/
    function BaseTestPen() {
        this.commands = [];
        BasePen.apply(this, arguments);
    };
    
    /*inheritance*/
    BaseTestPen.prototype = new BasePen;

    /*definition*/
    enhance(BaseTestPen, {
        _store: _store,
        flush: flush,
        _moveTo: function(pt)
        {
            this._store('_moveTo', arguments);
        },
        _lineTo: function(pt)
        {
            this._store('_lineTo', arguments);
        },
        _curveToOne: function(bcp1, bcp2, pt)
        {
            this._store('_curveToOne', arguments);
        },
        _closePath: function()
        {
            this._store('_closePath', arguments);
        },
        _endPath: function()
        {
            this._store('_endPath', arguments);
        },
    });
    
    
    /*constructor*/
    function BasePointTestPen() {
        this.commands = [];
        BasePointPen.apply(this, arguments);
    };
    
    /*inheritance*/
    BasePointTestPen.prototype = new BasePointPen;

    /*definition*/
    enhance(BasePointTestPen, {
        _store: _store,
        flush: flush,
        _flushContour: function(segments) {
            this._store('_flushContour', arguments);
        }
    });
    
    return {
        AbstractTestPen: AbstractTestPen,
        BaseTestPen: BaseTestPen,
        BasePointTestPen: BasePointTestPen
    };
});
