define(
    ['graphicore', 'graphicore/errors'],
    function(main, errors)
{
    doh.register("graphicore.main", [
    function Test_Enhance(){
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
    function Test_Range_Ranges(){
        
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
    function Test_Range_Errors() {
        
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
    }
    ]);
});
