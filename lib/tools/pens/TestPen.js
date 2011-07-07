define(
    ['graphicore', 'graphicore/errors', './BasePen'],
    function(main, errors, BasePen)
{
    var enhance = main.enhance;
    
    /*********************
     * stores the last method name and its arguments in a narray at
     * TestPen.last so that we can assert on it
     *********************/

    /*constructor*/
    var TestPen = function() {
        this.last = [];
        BasePen.apply(this, arguments);
    };
    
    /*inheritance*/
    TestPen.prototype = new BasePen;

    /*definition*/
    enhance(TestPen, {
        _store: function(functionName, args)
        {
            this.last.push(Array.concat([functionName], Array.slice(args)));
        },
        flush: function()
        {
            var last = this.last;
            this.last = [];
            return last;
        },
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
    return TestPen;
});
