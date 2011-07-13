define(
    ['graphicore', 'graphicore/errors'],
    function(main, errors)
{
    doh.register("graphicore.main", [
    function Test_enhance(){
        var enhance = main.enhance;
        var AbstractObject = function(){};
        enhance(AbstractObject, {
            test: function(){
                throw new errors.NotImplemented;
            }
        });
        
        var ConcreteObject = function(){};
        ConcreteObject.prototype = new AbstractObject;
        enhance(ConcreteObject, {
            test: function(){
                return true;
            }
        });
        var abstract = new AbstractObject;
        doh.assertError(
            errors.NotImplemented,
            abstract, 'test',
            []
        );
        
        var concrete = new ConcreteObject;
        doh.assertTrue(concrete.test());
        doh.assertTrue(concrete instanceof AbstractObject);
    },
    function Test_range_Ranges(){
        
        doh.assertEqual([], main.range(1,1,1));
        
        var list = [];
        for(var i in main.range(10)) list.push(i);
        doh.assertEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], list);
        
        var list = [];
        for(var i in main.range(7, 10)) list.push(i);
        doh.assertEqual([7, 8, 9], list);
        
        var list = [];
        for(var i in main.range(0, -10, -1)) list.push(i);
        doh.assertEqual([0, -1, -2, -3, -4, -5, -6, -7, -8, -9], list);
        
        var list = [];
        for(var i in main.range(2, 10, 2)) list.push(i);
        doh.assertEqual([2, 4, 6, 8], list);
        
        var list = [];
        for(var i in main.range(0, 10, -1)) list.push(i);
        doh.assertEqual([], list);
        
        var list = [];
        for(var i in main.range(0, -10, 1)) list.push(i);
        doh.assertEqual([], list);
    },
    function Test_range_Errors() {
        
        doh.assertError(
            errors.Value,
            main, 'range',
            [0, 1, 0],
            'step may not be 0'
        );
        
        doh.assertError(
            errors.Type,
            main, 'range',
            []
        );
        doh.assertError(
            errors.Type,
            main, 'range',
            [1, 1, 1, 1]
        );
        
        doh.assertError(
            errors.Type,
            main, 'range',
            [false]
        );
        doh.assertError(
            errors.Type,
            main, 'range',
            [1, false]
        );
        doh.assertError(
            errors.Type,
            main, 'range',
            [1, 1, null]
        );
        
        //we don't allow floats
        doh.assertError(
            errors.Type,
            main, 'range',
            [1, 1, 1.5]
        );
        doh.assertError(
            errors.Type,
            main, 'range',
            [1, 1.5, 1]
        );
        doh.assertError(
            errors.Type,
            main, 'range',
            [1.5, 1, 1]
        );
    },
    function Test_round(){
        
        var float = 1/3;//like 0.3333333333333333
        
        doh.assertEqual(0, main.round(float));
        doh.assertEqual(0.3, main.round(float, 10));
        doh.assertEqual(0.33, main.round(float, 100));
        doh.assertEqual(0.333, main.round(float, 1000));
        doh.assertEqual(0.3333, main.round(float, 10000));
        doh.assertEqual(0.33333, main.round(float, 100000));
        doh.assertEqual(0.333333, main.round(float, 1000000));
        
        var float = 2/3;//like 0.6666666666666666
        
        doh.assertEqual(1, main.round(float));
        doh.assertEqual(0.7, main.round(float, 10));
        doh.assertEqual(0.67, main.round(float, 100));
        doh.assertEqual(0.667, main.round(float, 1000));
        doh.assertEqual(0.6667, main.round(float, 10000));
        doh.assertEqual(0.66667, main.round(float, 100000));
        doh.assertEqual(0.666667, main.round(float, 1000000));
    },
    function Test_isInt(){
        doh.assertTrue(main.isInt(0));
        doh.assertTrue(main.isInt(1));
        doh.assertTrue(main.isInt(-1));
        doh.assertTrue(main.isInt(1000));
        doh.assertTrue(main.isInt(56789876));
        //!this is javascript, there is no real int type
        doh.assertTrue(main.isInt(6.0));
        
        doh.assertFalse(main.isInt(56789.876));
        doh.assertFalse(main.isInt('567'));
        doh.assertFalse(main.isInt(''));
        doh.assertFalse(main.isInt(null));
        doh.assertFalse(main.isInt(undefined));
        doh.assertFalse(main.isInt([]));
    }
    ]);
});
