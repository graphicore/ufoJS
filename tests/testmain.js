define(
    ['ufojs/main', 'ufojs/errors'],
    function(main, errors)
{
    doh.register("ufojs.main", [
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
        doh.assertEqual(0.3, main.round(float, 1));
        doh.assertEqual(0.33, main.round(float, 2));
        doh.assertEqual(0.333, main.round(float, 3));
        doh.assertEqual(0.3333, main.round(float, 4));
        doh.assertEqual(0.33333, main.round(float, 5));
        doh.assertEqual(0.333333, main.round(float, 6));

        var float = 2/3;//like 0.6666666666666666

        doh.assertEqual(1, main.round(float));
        doh.assertEqual(0.7, main.round(float, 1));
        doh.assertEqual(0.67, main.round(float, 2));
        doh.assertEqual(0.667, main.round(float, 3));
        doh.assertEqual(0.6667, main.round(float, 4));
        doh.assertEqual(0.66667, main.round(float, 5));
        doh.assertEqual(0.666667, main.round(float, 6));
    },
    function Test_roundRecursiveFunc() {
        var testdata = [
            ['a', 2/3, 'b', 1.3, 2, {donttouch: 'me', invisible: 1/3}],
            5, 1/3, true, false, null, undefined];

        var expecting = [
                ['a', 1, 'b', 1, 2, {donttouch: 'me', invisible: 1/3}],
                5, 0, true, false, null, undefined],
            exp = 0,
            testfunc = main.roundRecursiveFunc(exp);
        doh.assertEqual(expecting, testfunc(testdata));
        doh.assertEqual(expecting, main.roundRecursive(testdata, exp));

        var expecting = [
                ['a', 0.7, 'b', 1.3, 2, {donttouch: 'me', invisible: 1/3}],
                5, .3, true, false, null, undefined],
            exp = 1,
            testfunc = main.roundRecursiveFunc(exp);
        doh.assertEqual(expecting, testfunc(testdata));
        doh.assertEqual(expecting, main.roundRecursive(testdata, exp));

        var expecting = [
                ['a', 0.6667, 'b', 1.3, 2, {donttouch: 'me', invisible: 1/3}],
                5, .3333, true, false, null, undefined],
            exp = 4,
            testfunc = main.roundRecursiveFunc(exp);
        doh.assertEqual(expecting, testfunc(testdata));
        doh.assertEqual(expecting, main.roundRecursive(testdata, exp));

        var testdata = 2/3,
            exp = 4,
            testfunc = main.roundRecursiveFunc(exp);
        doh.assertEqual(0.6667, testfunc(testdata));
        doh.assertEqual(0.6667, main.roundRecursive(testdata, exp));

        var testdata = {a: 2/3},
            exp = 4,
            testfunc = main.roundRecursiveFunc(exp);
        doh.assertEqual({a: 2/3}, testfunc(testdata));
        doh.assertEqual({a: 2/3}, main.roundRecursive(testdata, exp));

        var testdata = '0.123456789',
            exp = 4,
            testfunc = main.roundRecursiveFunc(exp);
        doh.assertEqual(testdata, testfunc(testdata));
        doh.assertEqual(testdata, main.roundRecursive(testdata, exp));
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
    },
    function Test_parseDate() {
        //This are not really in depth tests of the function. Anyone?

        var expected = Date.parse('Fri Oct 14 2011 00:21:40 GMT+0200 (CEST)');
            result = main.parseDate('2011-10-13T22:21:40.000Z');
        doh.assertEqual(expected.valueOf(), result.valueOf());

        //see if the fallback to standart parsing works, too
        var dateJS = 'Fri Oct 14 2011 00:21:40 GMT+0200 (CEST)',
            expected = Date.parse(dateJS);
            result = main.parseDate(dateJS);
        doh.assertEqual(expected.valueOf(), result.valueOf());

        // actually this passes but is rather an implementation specific
        // detail. the timestamp is generated with Date.UTC() which can do
        // date arithmetic things i.e. the 13. month is the first month of
        // next year. Is this expected from a dateparsing function???
        // if yes we must test it.
        var expected = Date.parse('Sun Feb 05 2012 05:11:40 GMT+0100 (CET)'),
            result = new Date(main.parseDate('2011-13-35T27:71:40.000Z'));
        doh.assertEqual(expected.valueOf(), result.valueOf());

        var result = new Date(main.parseDate('This is no date at all.'));
        doh.assertTrue(isNaN(result.getTime()));
    }
    ]);
});
