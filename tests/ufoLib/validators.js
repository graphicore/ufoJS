define(
    ['ufojs', 'ufojs/errors', 'ufojs/ufoLib/validators'],
    function(main, errors, validators)
{
    doh.register("ufojs.ufoLib.validators", [
    function Test_isDictEnough() {
        doh.assertTrue(validators.isDictEnough({}));
        doh.assertTrue(validators.isDictEnough([]));
        doh.assertTrue(validators.isDictEnough(new (function(){})));
        doh.assertFalse(validators.isDictEnough(function(){}));
        doh.assertFalse(validators.isDictEnough(1));
        doh.assertFalse(validators.isDictEnough('a'));
        doh.assertFalse(validators.isDictEnough(true));
        doh.assertFalse(validators.isDictEnough(NaN));
        doh.assertFalse(validators.isDictEnough());
    },
    function Test_genericTypeValidator() {
        // this is just an alias for main.isInstance at the moment
        // so let's hope that main.isInstance tests good
        doh.assertEqual(validators.genericTypeValidator, main.isInstance);
    },
    function Test_genericIntListValidator() {
        doh.assertError(
            TypeError,
            validators, 'genericIntListValidator',
            [[]],
            'seccond argument must be an array'
        );
        doh.assertTrue(validators.genericIntListValidator([],[]));
        doh.assertTrue(validators.genericIntListValidator([1,2,3,4],[1,2,3,4]));
        doh.assertTrue(validators.genericIntListValidator([2,2,3,3],[3,2]));
        doh.assertTrue(validators.genericIntListValidator([],[1]));
        doh.assertFalse(validators.genericIntListValidator([1],[]));
        doh.assertFalse(validators.genericIntListValidator([1,2,3],[4,5,6]));
        doh.assertTrue(validators.genericIntListValidator([5],[5]));
        doh.assertFalse(validators.genericIntListValidator([undefined],[undefined]));
        doh.assertFalse(validators.genericIntListValidator(['1'],['1']));
        doh.assertFalse(validators.genericIntListValidator(['1'],[1]));
        doh.assertFalse(validators.genericIntListValidator([1.7],[1.7]));
    },
    function Test_genericNonNegativeIntValidator(){
        doh.assertTrue(validators.genericNonNegativeIntValidator(5));
        doh.assertTrue(validators.genericNonNegativeIntValidator(0));
        doh.assertTrue(validators.genericNonNegativeIntValidator(7040145));
        doh.assertFalse(validators.genericNonNegativeIntValidator(1.7));
        doh.assertFalse(validators.genericNonNegativeIntValidator('5'));
        doh.assertFalse(validators.genericNonNegativeIntValidator(true));
        doh.assertFalse(validators.genericNonNegativeIntValidator(-5));
        doh.assertFalse(validators.genericNonNegativeIntValidator(-1.7));
        doh.assertFalse(validators.genericNonNegativeIntValidator({}));
    },
    function Test_genericNonNegativeNumberValidator(){
        doh.assertTrue(validators.genericNonNegativeNumberValidator(5));
        doh.assertTrue(validators.genericNonNegativeNumberValidator(5453521));
        doh.assertTrue(validators.genericNonNegativeNumberValidator(35461.54211));
        doh.assertTrue(validators.genericNonNegativeNumberValidator(.4));
        doh.assertTrue(validators.genericNonNegativeNumberValidator(0));
        doh.assertTrue(validators.genericNonNegativeNumberValidator(1.7));
       
        doh.assertFalse(validators.genericNonNegativeNumberValidator(-5));
        doh.assertFalse(validators.genericNonNegativeNumberValidator(-5453521));
        doh.assertFalse(validators.genericNonNegativeNumberValidator(-35461.54211));
        doh.assertFalse(validators.genericNonNegativeNumberValidator(-.4));
        doh.assertFalse(validators.genericNonNegativeNumberValidator(-1.7));
        
        doh.assertFalse(validators.genericNonNegativeNumberValidator([]));
        doh.assertFalse(validators.genericNonNegativeNumberValidator());
        doh.assertFalse(validators.genericNonNegativeNumberValidator(function(){}));
    },
    function Test_genericDictValidator() {
        // not a dict
        doh.assertFalse(validators.genericDictValidator(function(){}));
        doh.assertFalse(validators.genericDictValidator(1));
        doh.assertFalse(validators.genericDictValidator());
        
        doh.assertTrue(validators.genericDictValidator({},{}));
         
        // missing required keys
        var prototype = {
            a: ['string', true], //required
            b: ['string', false], //optional
            c: ['string'], //optional
        },
        value = {
            a: 'a',
            b: 'b'
        };
        doh.assertTrue(validators.genericDictValidator(value,prototype));
        delete(value.a);
        doh.assertFalse(validators.genericDictValidator(value,prototype));
        delete(value.b);
        doh.assertFalse(validators.genericDictValidator(value,prototype));
        value.a = '';
        doh.assertTrue(validators.genericDictValidator(value,prototype));
        
        // unknown keys
        value.x = undefined;
        doh.assertFalse(validators.genericDictValidator(value,prototype));
        
        // incorrect types
        // uses main.isInstance
        value = {
            a: 'a',
            b: 'b',
            c: undefined
        };
        doh.assertTrue(validators.genericDictValidator(value,prototype));
        value.c = '';
        doh.assertTrue(validators.genericDictValidator(value,prototype));
        value.c = null;
        doh.assertTrue(validators.genericDictValidator(value,prototype));
        value.c = 1;
        doh.assertFalse(validators.genericDictValidator(value,prototype));
        delete(value.c);
        value.a = true;
        doh.assertFalse(validators.genericDictValidator(value,prototype));
        value.a = undefined;
        doh.assertFalse(validators.genericDictValidator(value,prototype));
        value.a = null;
        doh.assertFalse(validators.genericDictValidator(value,prototype));
        value.a = 1;
        doh.assertFalse(validators.genericDictValidator(value,prototype));
        prototype.a[0] = ['int', 'string'];
        doh.assertTrue(validators.genericDictValidator(value,prototype));
        value.a = '';
        doh.assertTrue(validators.genericDictValidator(value,prototype));
        value.a = 1.3;
        doh.assertFalse(validators.genericDictValidator(value,prototype));
        value.a = 1;
        prototype.b[0] = Array;
        value.b = [];
        doh.assertTrue(validators.genericDictValidator(value,prototype));
    },
    function Test_fontInfoStyleMapStyleNameValidator() {
        doh.assertTrue(validators.fontInfoStyleMapStyleNameValidator('regular'));
        doh.assertTrue(validators.fontInfoStyleMapStyleNameValidator('italic'));
        doh.assertTrue(validators.fontInfoStyleMapStyleNameValidator('bold'));
        doh.assertTrue(validators.fontInfoStyleMapStyleNameValidator('bold italic'));
        
        doh.assertFalse(validators.fontInfoStyleMapStyleNameValidator('black'));
        doh.assertFalse(validators.fontInfoStyleMapStyleNameValidator('light'));
        doh.assertFalse(validators.fontInfoStyleMapStyleNameValidator('slanted'));
        doh.assertFalse(validators.fontInfoStyleMapStyleNameValidator());
        doh.assertFalse(validators.fontInfoStyleMapStyleNameValidator(1));
    },
    function Test_fontInfoOpenTypeGaspRangeRecordsValidator(){
        //no Array
        doh.assertFalse(validators.fontInfoOpenTypeGaspRangeRecordsValidator());
        doh.assertFalse(validators.fontInfoOpenTypeGaspRangeRecordsValidator({}));
        doh.assertFalse(validators.fontInfoOpenTypeGaspRangeRecordsValidator(5));
        //empty is allowed
        doh.assertTrue(validators.fontInfoOpenTypeGaspRangeRecordsValidator([]));
        
        //dunno if this would be a useable value, but it is supposed to be valid
        var value = [
            {
                rangeMaxPPEM: 5,
                rangeGaspBehavior: [1,2,0]
            },
            {
                rangeMaxPPEM:6,
                rangeGaspBehavior: [3,1,2,2,2]
            }
        ];
        doh.assertTrue(validators.fontInfoOpenTypeGaspRangeRecordsValidator(value));
        value.reverse();
        //fail ppemOrder
        doh.assertFalse(validators.fontInfoOpenTypeGaspRangeRecordsValidator(value));
        value.reverse()
        
        //ppemValidity
        value[0].rangeMaxPPEM = -1;
        doh.assertFalse(validators.fontInfoOpenTypeGaspRangeRecordsValidator(value));
        value[0].rangeMaxPPEM = 0;
        doh.assertTrue(validators.fontInfoOpenTypeGaspRangeRecordsValidator(value));
        
        //bad rangeRecord
        value.push(true);
        doh.assertFalse(validators.fontInfoOpenTypeGaspRangeRecordsValidator(value));
        
        value.pop(true);
        var flawed = {};
        value.push(flawed);
        doh.assertFalse(validators.fontInfoOpenTypeGaspRangeRecordsValidator(value));
        
        flawed.rangeMaxPPEM = 5;
        flawed.rangeGaspBehavior= 7;
        doh.assertFalse(validators.fontInfoOpenTypeGaspRangeRecordsValidator(value));
        
        delete(flawed.rangeGaspBehavior);
        doh.assertFalse(validators.fontInfoOpenTypeGaspRangeRecordsValidator(value));
        
        flawed.rangeMaxPPEM = 9;
        flawed.rangeGaspBehavior = [2,3,0];
        doh.assertTrue(validators.fontInfoOpenTypeGaspRangeRecordsValidator(value));
    },
    function Test_fontInfoOpenTypeHeadCreatedValidator() {
        // format: 0000/00/00 00:00:00
        value = '2012/04/25 11:39:44';
        doh.assertTrue(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        
        //wrong type
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(1502354));
        
        //basic formatting
        value = '2012/4/25 11:39:44';//too short
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/25 11:39:449';//too long
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/25 11:3 :44';//too many spaces
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/25T11:39:44';//not enough spaces
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012-04/25 11:39:44';//date has not enoug slashes
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012//4/25 11:39:44';//date has too many slashes
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/25 11:39-44';//time has not enoug colons
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/25 11:39::4';//time has too many colons
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '212/004/25 11:39:44';//year wrong length
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/004/2 11:39:44';//month wrong length
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/2 111:39:44';//day wrong length
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = 'a012/04/25 11:39:44';//year NaN
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/4./25 11:39:44';//month not an integer string
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/a5 11:39:44';//day NaN
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/14/25 11:39:44';//month out of range
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/-4/25 11:39:44';//month out of range
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/02/30 11:39:44';//day is no date
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2011/02/29 11:39:44';//day is no date
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/02/29 11:39:44';//day is a date!
        doh.assertTrue(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/25 1:39:444';//hour wrong length
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/25 11:9:444';//minute wrong length
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        // skip: impossible!
        // value = '2012/04/25 11:39:44';//second wrong length
        // doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/25 a1:39:44';//hour NaN
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/25 11:a9:44';//minute NaN
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/25 11:39:4a';//second not an integer string
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/25 25:39:44';//hour out of range
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/25 -1:39:44';//hour out of range
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/25 11:60:44';//minute out of range
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/25 11:-5:44';//minute out of range
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/25 11:39:60';//second out of range
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '2012/04/25 11:39:-9';//second out of range
        doh.assertFalse(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        
        value = '+012/04/25 11:39:09';//this is allowed, too
        doh.assertTrue(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        
        value = '-999/01/01 00:00:00';//min date
        doh.assertTrue(validators.fontInfoOpenTypeHeadCreatedValidator(value));
        value = '9999/12/31 23:59:59';//max date
        doh.assertTrue(validators.fontInfoOpenTypeHeadCreatedValidator(value));
    }
    ]);
});
