"use strict";
/**
 * Copyright (c) 2011, Lasse Fister lasse@graphicore.de, http://graphicore.de
 * 
 * You should have received a copy of the MIT License along with this program.
 * If not, see http://www.opensource.org/licenses/mit-license.php
 * 
 * These pens are used within the unit tests. They store the last method
 * name and its arguments in an array at pen.commands so that we can assert
 * on the values of the call. Use pen.flush() to receive all previous
 * commands since the last pen.flush()
 */

define(
    [
        'ufojs',
        'ufojs/errors',
        './AbstractPen',
        './BasePen',
        './BasePointToSegmentPen'
    ],
    function(
        main,
        errors,
        AbstractPen,
        BasePen,
        BasePointToSegmentPen
    )
{
    var enhance = main.enhance;
    
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
    AbstractTestPen.prototype = Object.create(AbstractPen.prototype);

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
    BaseTestPen.prototype = Object.create(BasePen.prototype);

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
    function BasePointToSegmentTestPen() {
        this.commands = [];
        BasePointToSegmentPen.apply(this, arguments);
    };
    
    /*inheritance*/
    BasePointToSegmentTestPen.prototype = Object.create(BasePointToSegmentPen.prototype);

    /*definition*/
    enhance(BasePointToSegmentTestPen, {
        _store: _store,
        flush: flush,
        _flushContour: function(segments) {
            this._store('_flushContour', arguments);
        }
    });
    
    return {
        AbstractTestPen: AbstractTestPen,
        BaseTestPen: BaseTestPen,
        BasePointToSegmentTestPen: BasePointToSegmentTestPen
    };
});
