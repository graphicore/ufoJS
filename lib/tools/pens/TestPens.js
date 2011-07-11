define(
    ['graphicore', 'graphicore/errors', './AbstractPen' ,'./BasePen'],
    function(main, errors, AbstractPen, BasePen)
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
        this.commands.push(Array.concat([functionName], Array.slice(args)));
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
    var AbstractTestPen = function() {
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
    var BaseTestPen = function() {
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
        }
    });
    return {
        AbstractTestPen: AbstractTestPen,
        BaseTestPen: BaseTestPen
    };
});
