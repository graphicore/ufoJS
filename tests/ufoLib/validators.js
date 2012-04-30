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
    function Test_genericNonNegativeIntValidator() {
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
    function Test_genericNonNegativeNumberValidator() {
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
        doh.assertError(
            TypeError,
            validators, 'genericDictValidator',
            [{}],
            'seccond argument must be type of object'
        );
        // not a dict
        doh.assertFalse(validators.genericDictValidator(function(){}, {}));
        doh.assertFalse(validators.genericDictValidator(undefined,{}));
        
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
    function Test_fontInfoOpenTypeGaspRangeRecordsValidator() {
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
        var value = '2012/04/25 11:39:44';
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
    },
    function Test_fontInfoOpenTypeNameRecordsValidator() {
        doh.assertFalse(validators.fontInfoOpenTypeNameRecordsValidator({}));
        doh.assertFalse(validators.fontInfoOpenTypeNameRecordsValidator(function(){}));
        doh.assertFalse(validators.fontInfoOpenTypeNameRecordsValidator(true));
        doh.assertFalse(validators.fontInfoOpenTypeNameRecordsValidator(1));
        doh.assertFalse(validators.fontInfoOpenTypeNameRecordsValidator(''));
        
        doh.assertTrue(validators.fontInfoOpenTypeNameRecordsValidator([]));
        
        var value = [{
            nameID: 5,
            platformID: 3,
            encodingID: 8,
            languageID: 89,
            string: 'hi'
        }];        
        doh.assertTrue(validators.fontInfoOpenTypeNameRecordsValidator(value));
        
        value.push({
            nameID: 7,
            platformID: 23,
            encodingID: 98,
            languageID: 21,
            string: 'hello'
        });
        doh.assertTrue(validators.fontInfoOpenTypeNameRecordsValidator(value));
        
        value.push({
            nameID: '7',
            platformID: 23,
            encodingID: 98,
            languageID: 21,
            string: 'hello'
        });
        doh.assertFalse(validators.fontInfoOpenTypeNameRecordsValidator(value));
        
        value[2] = {
            nameID: 7,
            platformID: false,
            encodingID: 98,
            languageID: 21,
            string: 'hello'
        };
        doh.assertFalse(validators.fontInfoOpenTypeNameRecordsValidator(value));
        
        value[2] = {
            nameID: 7,
            platformID: 58,
            encodingID: [],
            languageID: 21,
            string: 'hello'
        };
        doh.assertFalse(validators.fontInfoOpenTypeNameRecordsValidator(value));
        
        value[2] = {
            nameID: 7,
            platformID: 58,
            encodingID: 90,
            languageID: 13,
            string: 987
        };
        doh.assertFalse(validators.fontInfoOpenTypeNameRecordsValidator(value));
        
        value[2] = {
            nameID: 7,
            platformID: 58,
            encodingID: 90,
            string: 'hello'
        };
        doh.assertFalse(validators.fontInfoOpenTypeNameRecordsValidator(value));
        value[2] = {
            nameID: 7,
            platformID: 58,
            encodingID: 90,
            languageID: 6
        };
        doh.assertFalse(validators.fontInfoOpenTypeNameRecordsValidator(value));
        
        value[2] = {
            nameID: 7,
            platformID: 58,
            languageID: 67,
            string: 'hello'
        };
        doh.assertFalse(validators.fontInfoOpenTypeNameRecordsValidator(value));
        
        value[2] = {
            nameID: 7,
            encodingID: 90,
            languageID: 67,
            string: 'hello'
        };
        doh.assertFalse(validators.fontInfoOpenTypeNameRecordsValidator(value));
        
        value[2] = {
            platformID: 58,
            encodingID: 90,
            languageID: 67,
            string: 'hello'
        };
        doh.assertFalse(validators.fontInfoOpenTypeNameRecordsValidator(value));
        
        value[2] = {
            nameID: 7,
            platformID: 58,
            encodingID: 90,
            languageID: 67,
            string: 'hello'
        };
        doh.assertTrue(validators.fontInfoOpenTypeNameRecordsValidator(value));
    },
    function Test_fontInfoOpenTypeOS2WeightClassValidator() {
        doh.assertTrue(validators.fontInfoOpenTypeOS2WeightClassValidator(4565));
        doh.assertTrue(validators.fontInfoOpenTypeOS2WeightClassValidator(0));
        doh.assertTrue(validators.fontInfoOpenTypeOS2WeightClassValidator(2));
        doh.assertFalse(validators.fontInfoOpenTypeOS2WeightClassValidator(-1));
        
        // isInt
        doh.assertFalse(validators.fontInfoOpenTypeOS2WeightClassValidator(1.456));
        doh.assertFalse(validators.fontInfoOpenTypeOS2WeightClassValidator('5'));
        doh.assertFalse(validators.fontInfoOpenTypeOS2WeightClassValidator(true));
        doh.assertFalse(validators.fontInfoOpenTypeOS2WeightClassValidator([]));
        doh.assertFalse(validators.fontInfoOpenTypeOS2WeightClassValidator({}));
        doh.assertFalse(validators.fontInfoOpenTypeOS2WeightClassValidator());
    },
    function Test_fontInfoOpenTypeOS2WidthClassValidator() {
        for(var i=1; i<10; i++)
            doh.assertTrue(validators.fontInfoOpenTypeOS2WidthClassValidator(i));
        doh.assertFalse(validators.fontInfoOpenTypeOS2WidthClassValidator(10));
        doh.assertFalse(validators.fontInfoOpenTypeOS2WidthClassValidator(0));
        
        // isInt
        doh.assertFalse(validators.fontInfoOpenTypeOS2WidthClassValidator(1.456));
        doh.assertFalse(validators.fontInfoOpenTypeOS2WidthClassValidator('5'));
        doh.assertFalse(validators.fontInfoOpenTypeOS2WidthClassValidator(true));
        doh.assertFalse(validators.fontInfoOpenTypeOS2WidthClassValidator([]));
        doh.assertFalse(validators.fontInfoOpenTypeOS2WidthClassValidator({}));
        doh.assertFalse(validators.fontInfoOpenTypeOS2WidthClassValidator());
    },
    function Test_fontInfoVersion2OpenTypeOS2PanoseValidator() {
        //currently expects an Array of 10 values, all integer
        var value = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        doh.assertTrue(validators.fontInfoVersion2OpenTypeOS2PanoseValidator(value));
        
        //negative is ok, too
        value[7] = -10;
        doh.assertTrue(validators.fontInfoVersion2OpenTypeOS2PanoseValidator(value));
        
        //9 items
        value.pop();
        doh.assertFalse(validators.fontInfoVersion2OpenTypeOS2PanoseValidator(value));
        
        //11 items
        value.push(5456341);
        value.push(-55654);  
        doh.assertFalse(validators.fontInfoVersion2OpenTypeOS2PanoseValidator(value));
        
        //10 items again
        value.pop();
        doh.assertTrue(validators.fontInfoVersion2OpenTypeOS2PanoseValidator(value));
        
        // must be all integer
        value[5] = '5';
        doh.assertFalse(validators.fontInfoVersion2OpenTypeOS2PanoseValidator(value));
        value[5] = true;
        doh.assertFalse(validators.fontInfoVersion2OpenTypeOS2PanoseValidator(value));
        value[5] = 1.123456;
        doh.assertFalse(validators.fontInfoVersion2OpenTypeOS2PanoseValidator(value));
        value[5] = {};
        doh.assertFalse(validators.fontInfoVersion2OpenTypeOS2PanoseValidator(value));
        
        // not instanceof Array
        value = {0:0, 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:9, length: 10};
        doh.assertFalse(validators.fontInfoVersion2OpenTypeOS2PanoseValidator(value));
        value = true;
        doh.assertFalse(validators.fontInfoVersion2OpenTypeOS2PanoseValidator(value));
        value = '';
        doh.assertFalse(validators.fontInfoVersion2OpenTypeOS2PanoseValidator(value));
        
        //make an ancestor of Array
        var Value = function() {
            this.length = arguments.length;
            for(var i=0; i<arguments.length; i++)
                this[i] = arguments[i];
        };
        Value.prototype = new Array();
        value = new Value(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
        doh.assertTrue(validators.fontInfoVersion2OpenTypeOS2PanoseValidator(value));
    },
    function Test_fontInfoVersion3OpenTypeOS2PanoseValidator() {
        //currently expects an Array of 10 values, all integer and >= 0
        var value = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        doh.assertTrue(validators.fontInfoVersion3OpenTypeOS2PanoseValidator(value));
        
        //9 items
        value.pop();
        doh.assertFalse(validators.fontInfoVersion3OpenTypeOS2PanoseValidator(value));
        
        //11 items
        value.push(5456341);
        value.push(55654);  
        doh.assertFalse(validators.fontInfoVersion3OpenTypeOS2PanoseValidator(value));
        
        //10 items again
        value.pop();
        doh.assertTrue(validators.fontInfoVersion3OpenTypeOS2PanoseValidator(value));
        
        //must be all integer and negative is not ok
        value[5] = -10;
        doh.assertFalse(validators.fontInfoVersion3OpenTypeOS2PanoseValidator(value));
        value[5] = '5';
        doh.assertFalse(validators.fontInfoVersion3OpenTypeOS2PanoseValidator(value));
        value[5] = true;
        doh.assertFalse(validators.fontInfoVersion3OpenTypeOS2PanoseValidator(value));
        value[5] = 1.123456;
        doh.assertFalse(validators.fontInfoVersion3OpenTypeOS2PanoseValidator(value));
        value[5] = {};
        doh.assertFalse(validators.fontInfoVersion3OpenTypeOS2PanoseValidator(value));
        
        // not instanceof Array
        value = {0:0, 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:9, length: 10};
        doh.assertFalse(validators.fontInfoVersion3OpenTypeOS2PanoseValidator(value));
        value = true;
        doh.assertFalse(validators.fontInfoVersion3OpenTypeOS2PanoseValidator(value));
        value = '';
        doh.assertFalse(validators.fontInfoVersion3OpenTypeOS2PanoseValidator(value));
        
        //make an ancestor of Array
        var Value = function() {
            this.length = arguments.length;
            for(var i=0; i<arguments.length; i++)
                this[i] = arguments[i];
        };
        Value.prototype = new Array();
        value = new Value(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
        doh.assertTrue(validators.fontInfoVersion3OpenTypeOS2PanoseValidator(value));
    },
    function Test_fontInfoOpenTypeOS2FamilyClassValidator() {
        // Array of two, both integer.
        // first between 0 and 14 inclusively
        // sccond between 0 and 15 inclusively
        var value = [0, 0];
        doh.assertTrue(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        var value = [14, 15];
        doh.assertTrue(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        var value = [7, 1];
        doh.assertTrue(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        
        var value = [-7, 1];
        doh.assertFalse(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        var value = [7, -1];
        doh.assertFalse(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        var value = [15, 1];
        doh.assertFalse(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        var value = [7, 16];
        doh.assertFalse(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        
        var value = [7, true];
        doh.assertFalse(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        var value = [{}, 1];
        doh.assertFalse(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        var value = [7, '1'];
        doh.assertFalse(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        var value = ['7', '1'];
        doh.assertFalse(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        
        var value = [7, 1, 5];
        doh.assertFalse(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        var value = [7];
        doh.assertFalse(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        var value = [];
        doh.assertFalse(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        var value = {};
        doh.assertFalse(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        var value = '';
        doh.assertFalse(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        var value = false;
        doh.assertFalse(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
        var value = undefined;
        doh.assertFalse(validators.fontInfoOpenTypeOS2FamilyClassValidator(value));
    },
    function Test_fontInfoPostscriptBluesValidator() {
        // an Array of at max 14 numerical values.
        // The length of the Array must be an even number
        // when you change stuff in here change
        // Tests_fontInfoPostscriptOtherBluesValidator, accordingly
        var value = [
            7.2, 1.3,
            -5, 7,
            123, 963245,
            -522125, -5421,
            451, .541,
            -142.24, 551,
            -.1, 1654
        ];
        doh.assertTrue(validators.fontInfoPostscriptBluesValidator(value));
        
        //too much
        value.push(1);
        doh.assertFalse(validators.fontInfoPostscriptBluesValidator(value));
        value.push(1);
        doh.assertFalse(validators.fontInfoPostscriptBluesValidator(value));
        
        while(value.length){
            // odd number is false
            value.pop();
            doh.assertFalse(validators.fontInfoPostscriptBluesValidator(value));
            // even number is true
            value.pop();
            doh.assertTrue(validators.fontInfoPostscriptBluesValidator(value));
        }
        
        value = [1, 3];
        doh.assertTrue(validators.fontInfoPostscriptBluesValidator(value));
        value = [1, '3'];
        doh.assertFalse(validators.fontInfoPostscriptBluesValidator(value));
        value = [1, NaN];
        doh.assertFalse(validators.fontInfoPostscriptBluesValidator(value));
        
        //instanceof Array
        value = '';
        doh.assertFalse(validators.fontInfoPostscriptBluesValidator(value));
        value = true;
        doh.assertFalse(validators.fontInfoPostscriptBluesValidator(value));
        value = undefined;
        doh.assertFalse(validators.fontInfoPostscriptBluesValidator(value));
    },
    function Test_fontInfoPostscriptOtherBluesValidator() {
        // an Array of at max 10 numerical values.
        // The length of the Array must be an even number
        // when you change stuff in here change
        // Test_fontInfoPostscriptBluesValidator, accordingly
        var value = [
            7.2, 1.3,
            -5, 7,
            123, 963245,
            -522125, -5421,
            451, .541
        ];
        doh.assertTrue(validators.fontInfoPostscriptOtherBluesValidator(value));
        
        //too much
        value.push(1);
        doh.assertFalse(validators.fontInfoPostscriptOtherBluesValidator(value));
        value.push(1);
        doh.assertFalse(validators.fontInfoPostscriptOtherBluesValidator(value));
        
        while(value.length){
            // odd number is false
            value.pop();
            doh.assertFalse(validators.fontInfoPostscriptOtherBluesValidator(value));
            // even number is true
            value.pop();
            doh.assertTrue(validators.fontInfoPostscriptOtherBluesValidator(value));
        }
        
        value = [1, 3];
        doh.assertTrue(validators.fontInfoPostscriptOtherBluesValidator(value));
        value = [1, '3'];
        doh.assertFalse(validators.fontInfoPostscriptOtherBluesValidator(value));
        value = [1, NaN];
        doh.assertFalse(validators.fontInfoPostscriptOtherBluesValidator(value));
        
        //instanceof Array
        value = '';
        doh.assertFalse(validators.fontInfoPostscriptOtherBluesValidator(value));
        value = true;
        doh.assertFalse(validators.fontInfoPostscriptOtherBluesValidator(value));
        value = undefined;
        doh.assertFalse(validators.fontInfoPostscriptOtherBluesValidator(value));
    },
    function Test_fontInfoPostscriptStemsValidator() {
        // Array of max 12 numeric items
        var value =  [
            1, 2, 3, 9654,
            45.234, .234, -.234, -134124.12,
            -9521, 0, -1, 654
        ]
        doh.assertTrue(validators.fontInfoPostscriptStemsValidator(value));
        
        value.push(234);
        doh.assertFalse(validators.fontInfoPostscriptStemsValidator(value));
        
        value.pop();
        value[2] = NaN;
        doh.assertFalse(validators.fontInfoPostscriptStemsValidator(value));
        
        value[2] = true;
        doh.assertFalse(validators.fontInfoPostscriptStemsValidator(value));
        
        value[2] = [];
        doh.assertFalse(validators.fontInfoPostscriptStemsValidator(value));
        
        value[2] = '3';
        doh.assertFalse(validators.fontInfoPostscriptStemsValidator(value));
        
        value[2] = function(){};
        doh.assertFalse(validators.fontInfoPostscriptStemsValidator(value));
        
        value[2] = 45;
        while(value.length) {
            value.pop();
            doh.assertTrue(validators.fontInfoPostscriptStemsValidator(value));
        }
    },
    function Test_fontInfoPostscriptWindowsCharacterSetValidator() {
        var value = '1';
        doh.assertFalse(validators.fontInfoPostscriptWindowsCharacterSetValidator(value));
        value = true;
        doh.assertFalse(validators.fontInfoPostscriptWindowsCharacterSetValidator(value));
        value = [];
        doh.assertFalse(validators.fontInfoPostscriptWindowsCharacterSetValidator(value));
        value = 2.5;
        doh.assertFalse(validators.fontInfoPostscriptWindowsCharacterSetValidator(value));
        value = 0;
        doh.assertFalse(validators.fontInfoPostscriptWindowsCharacterSetValidator(value));
        value = 21;
        doh.assertFalse(validators.fontInfoPostscriptWindowsCharacterSetValidator(value));
        for(var value=1; value<21; value++)
            doh.assertTrue(validators.fontInfoPostscriptWindowsCharacterSetValidator(value));
    },
    function Test_fontInfoWOFFMetadataUniqueIDValidator() {
        // no dict
        var value = '7';
        doh.assertFalse(validators.fontInfoWOFFMetadataUniqueIDValidator(value));
        value = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataUniqueIDValidator(value));
        value = undefined;
        doh.assertFalse(validators.fontInfoWOFFMetadataUniqueIDValidator(value));
        value = 5;
        doh.assertFalse(validators.fontInfoWOFFMetadataUniqueIDValidator(value));
        
        // bad dict
        value = {};
        doh.assertFalse(validators.fontInfoWOFFMetadataUniqueIDValidator(value));
        value = {id: 5};
        doh.assertFalse(validators.fontInfoWOFFMetadataUniqueIDValidator(value));
        value = {id: 'hi', rubbish: true};
        doh.assertFalse(validators.fontInfoWOFFMetadataUniqueIDValidator(value));
        
        // good dict
        delete(value.rubbish);
        doh.assertTrue(validators.fontInfoWOFFMetadataUniqueIDValidator(value));
        value = {id: ''};
        doh.assertTrue(validators.fontInfoWOFFMetadataUniqueIDValidator(value));
    },
    function Test_fontInfoWOFFMetadataVendorValidator() {
        // no dict …
        var value = '';
        doh.assertFalse(validators.fontInfoWOFFMetadataVendorValidator(value));
        value = 5;
        doh.assertFalse(validators.fontInfoWOFFMetadataVendorValidator(value));
        value = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataVendorValidator(value));
        
        //bad dict
        value = {};
        value = {id: true};
        doh.assertFalse(validators.fontInfoWOFFMetadataVendorValidator(value));
        value = {url: 'http://'};
        doh.assertFalse(validators.fontInfoWOFFMetadataVendorValidator(value));
        value = {rubbish: true};
        doh.assertFalse(validators.fontInfoWOFFMetadataVendorValidator(value));
        
        // good dict
        value = {name: 'abc'};
        doh.assertTrue(validators.fontInfoWOFFMetadataVendorValidator(value));
        
        value = {
            name: 'abc',
            url: 'abc',
            dir: 'ltr',
            'class': 'abc'
        };
        doh.assertTrue(validators.fontInfoWOFFMetadataVendorValidator(value));
        delete(value.url);
        doh.assertTrue(validators.fontInfoWOFFMetadataVendorValidator(value));
        delete(value['class']);
        doh.assertTrue(validators.fontInfoWOFFMetadataVendorValidator(value));
        
        //bad again, values have to be all string
        value.dir = 5;
        doh.assertFalse(validators.fontInfoWOFFMetadataVendorValidator(value));
        delete(value.dir);
        value['class'] = [];
        doh.assertFalse(validators.fontInfoWOFFMetadataVendorValidator(value));
        delete(value['class']);
        value.url = false
        doh.assertFalse(validators.fontInfoWOFFMetadataVendorValidator(value));
        
        // good
        value.url = 'http://';
        doh.assertTrue(validators.fontInfoWOFFMetadataVendorValidator(value));
        
        // dir has to be 'ltr' or 'rtl', when present
        value.dir = 'hello';
        doh.assertFalse(validators.fontInfoWOFFMetadataVendorValidator(value));
        value.dir = 'ltr';
        doh.assertTrue(validators.fontInfoWOFFMetadataVendorValidator(value));
        value.dir = 'rtl';
        doh.assertTrue(validators.fontInfoWOFFMetadataVendorValidator(value));
    },
    function Test_fontInfoWOFFMetadataCreditsValidator() {
        // dict with one key 'credits' having more than zero items of
        // {
        //    "name" : ['string', true],
        //    "url" : ['string', false],
        //    "role" : ['string', false],
        //    "dir" : ['string', false],
        //    "class" : ['string', false]
        //};
        
        //no dict
        var value = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataCreditsValidator(value));
        value = 5;
        doh.assertFalse(validators.fontInfoWOFFMetadataCreditsValidator(value));
        value = '';
        doh.assertFalse(validators.fontInfoWOFFMetadataCreditsValidator(value));
        
        //no key 'credits' which is an Array
        value = {};
        doh.assertFalse(validators.fontInfoWOFFMetadataCreditsValidator(value));
        value = {credits: {}};
        doh.assertFalse(validators.fontInfoWOFFMetadataCreditsValidator(value));
        value = {credits: ''};
        doh.assertFalse(validators.fontInfoWOFFMetadataCreditsValidator(value));
        value = {credits: 4};
        doh.assertFalse(validators.fontInfoWOFFMetadataCreditsValidator(value));
        //unexpected key
        value = {credits: [], rubbish: true};
        doh.assertFalse(validators.fontInfoWOFFMetadataCreditsValidator(value));
        
        // minimal valid
        delete(value.rubbish);
        var credits = value.credits;
        credits.push({name: ''});
        doh.assertTrue(validators.fontInfoWOFFMetadataCreditsValidator(value));
        
        // fully filled valid credits item
        // and more than one credits items
        credits.push({
            name: 'some name',
            url: 'string is enough',
            role: 'author',
            dir: 'ltr',
            'class': 'hi'
        });
        doh.assertTrue(validators.fontInfoWOFFMetadataCreditsValidator(value));
        
        //dir must be 'ltr' or 'rtl' when present
        credits[1].dir = 'hello';
        doh.assertFalse(validators.fontInfoWOFFMetadataCreditsValidator(value));
        credits[1].dir = 'rtl';
        doh.assertTrue(validators.fontInfoWOFFMetadataCreditsValidator(value));
        credits[1].dir = 15;
        doh.assertFalse(validators.fontInfoWOFFMetadataCreditsValidator(value));
        delete(credits[1].dir);
        doh.assertTrue(validators.fontInfoWOFFMetadataCreditsValidator(value));
        
        //url must be string when present
        credits[0].url = [];
        doh.assertFalse(validators.fontInfoWOFFMetadataCreditsValidator(value));
        credits[0].url = 'hello';
        doh.assertTrue(validators.fontInfoWOFFMetadataCreditsValidator(value));
        
        //role must be string when present
        credits[0].role = false;
        doh.assertFalse(validators.fontInfoWOFFMetadataCreditsValidator(value));
        credits[0].role = 'hi';
        doh.assertTrue(validators.fontInfoWOFFMetadataCreditsValidator(value));
        
        //class must be string when present
        credits[0]['class'] = [];
        doh.assertFalse(validators.fontInfoWOFFMetadataCreditsValidator(value));
        credits[0]['class'] = 'gooday';
        doh.assertTrue(validators.fontInfoWOFFMetadataCreditsValidator(value));
        
        //name must be present and string
        delete(credits[0].name);
        doh.assertFalse(validators.fontInfoWOFFMetadataCreditsValidator(value));
        credits[0].name = function(){};
        doh.assertFalse(validators.fontInfoWOFFMetadataCreditsValidator(value));
        credits[0].name = 'a name';
        doh.assertTrue(validators.fontInfoWOFFMetadataCreditsValidator(value));
    },
    //doing this first because some following validators depend on it
    // This test got copied to:
    //      Test_fontInfoWOFFMetadataExtensionValueValidator
    //      Test_fontInfoWOFFMetadataExtensionNameValidator
    // reflect changes there, too
    function Test_fontInfoWOFFMetadataTextValue() {
        //{
        //    text: mandatory, string
        //    language: optional, string
        //    dir: optional, string
        //    class: optional, string
        //}
        
        // no dict
        var value = 4;
        doh.assertFalse(validators.fontInfoWOFFMetadataTextValue(value));
        value = false;
        doh.assertFalse(validators.fontInfoWOFFMetadataTextValue(value));
        value = '';
        doh.assertFalse(validators.fontInfoWOFFMetadataTextValue(value));
        
        // wrong dict
        value = {};
        doh.assertFalse(validators.fontInfoWOFFMetadataTextValue(value));
        value = {rubbish: 'junk'};
        doh.assertFalse(validators.fontInfoWOFFMetadataTextValue(value));
        
        // minimal correct
        value = {text: ''};
        doh.assertTrue(validators.fontInfoWOFFMetadataTextValue(value));
        
        // text must be string
        value.text = 43;
        doh.assertFalse(validators.fontInfoWOFFMetadataTextValue(value));
        value.text = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataTextValue(value));
        value.text = [];
        doh.assertFalse(validators.fontInfoWOFFMetadataTextValue(value));
        value.text = 'A text';
        doh.assertTrue(validators.fontInfoWOFFMetadataTextValue(value));
        
        //if dir is present ist must be 'ltr' or 'rtl'
        value.dir = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataTextValue(value));
        value.dir = '';
        doh.assertFalse(validators.fontInfoWOFFMetadataTextValue(value));
        value.dir = 'whatever';
        doh.assertFalse(validators.fontInfoWOFFMetadataTextValue(value));
        value.dir = 'ltr';
        doh.assertTrue(validators.fontInfoWOFFMetadataTextValue(value));
        value.dir = 'rtl';
        doh.assertTrue(validators.fontInfoWOFFMetadataTextValue(value));
        
        //if language or class are present either needs to be string
        value.language = 'klingon';
        doh.assertTrue(validators.fontInfoWOFFMetadataTextValue(value));
        value.language = '';
        doh.assertTrue(validators.fontInfoWOFFMetadataTextValue(value));
        value.language = 1011010;
        doh.assertFalse(validators.fontInfoWOFFMetadataTextValue(value));
        value.language = 'javascript';
        doh.assertTrue(validators.fontInfoWOFFMetadataTextValue(value));
        
        value['class'] = 'something';
        doh.assertTrue(validators.fontInfoWOFFMetadataTextValue(value));
        value['class'] = '';
        doh.assertTrue(validators.fontInfoWOFFMetadataTextValue(value));
        value['class'] = 5;
        doh.assertFalse(validators.fontInfoWOFFMetadataTextValue(value));
        value['class'] = function(){};
        doh.assertFalse(validators.fontInfoWOFFMetadataTextValue(value));
        value['class'] = 'anything';
        doh.assertTrue(validators.fontInfoWOFFMetadataTextValue(value));
        delete(value.language);
        doh.assertTrue(validators.fontInfoWOFFMetadataTextValue(value));
    },
    function Test_fontInfoWOFFMetadataDescriptionValidator() {
        // {
        //    url: optional, string
        //    text: mandatory, Array of 0 or more fontInfoWOFFMetadataTextValue
        // }
        
        //no dict
        var value = 5;
        doh.assertFalse(validators.fontInfoWOFFMetadataDescriptionValidator(value));
        value = false;
        doh.assertFalse(validators.fontInfoWOFFMetadataDescriptionValidator(value));
        value = undefined;
        doh.assertFalse(validators.fontInfoWOFFMetadataDescriptionValidator(value));
        
        //minimal tue
        value = {text: []};
        doh.assertTrue(validators.fontInfoWOFFMetadataDescriptionValidator(value));
        
        //when url is present ist must be a string
        value.url = '';
        doh.assertTrue(validators.fontInfoWOFFMetadataDescriptionValidator(value));
        value.url = 54;
        doh.assertFalse(validators.fontInfoWOFFMetadataDescriptionValidator(value));
        value.url = false;
        doh.assertFalse(validators.fontInfoWOFFMetadataDescriptionValidator(value));
        value.url = 'http://some.url.com';
        doh.assertTrue(validators.fontInfoWOFFMetadataDescriptionValidator(value));
        
        // fontInfoWOFFMetadataTextValue was tested above, I won't do it
        // here completely
        // minimal true is  {text: ''};
        value.text.push({text: ''});
        doh.assertTrue(validators.fontInfoWOFFMetadataDescriptionValidator(value));
        value.text.push({text: ''});
        doh.assertTrue(validators.fontInfoWOFFMetadataDescriptionValidator(value));
        value.text.push({});
        doh.assertFalse(validators.fontInfoWOFFMetadataDescriptionValidator(value));
        value.text[2].text = 'hello';
        doh.assertTrue(validators.fontInfoWOFFMetadataDescriptionValidator(value));
        value.text[2].dir = 'ltr';
        doh.assertTrue(validators.fontInfoWOFFMetadataDescriptionValidator(value));
        value.text[2].dir = 'nothing real';
        doh.assertFalse(validators.fontInfoWOFFMetadataDescriptionValidator(value));
        value.text[2].dir = 'rtl';
        doh.assertTrue(validators.fontInfoWOFFMetadataDescriptionValidator(value));
    },
    function Test_fontInfoWOFFMetadataLicenseValidator() {
        //{
        //    url: optional, string
        //    text: optional, Array of fontInfoWOFFMetadataTextValue
        //    id: optional, string
        //}
        
        // no dict
        var value = 7;
        doh.assertFalse(validators.fontInfoWOFFMetadataLicenseValidator(value));
        value = undefined;
        doh.assertFalse(validators.fontInfoWOFFMetadataLicenseValidator(value));
        
        // minimal true (all is optional)
        value = {};
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseValidator(value));
        
        //when url is present it must be string
        value.url = '';
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseValidator(value));
        value.url = [];
        doh.assertFalse(validators.fontInfoWOFFMetadataLicenseValidator(value));
        value.url = 'somestring';
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseValidator(value));
        
        //when id is present it must be string
        value.id = '';
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseValidator(value));
        value.id = [];
        doh.assertFalse(validators.fontInfoWOFFMetadataLicenseValidator(value));
        value.id = 'unique?';
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseValidator(value));
        
        
        // text when present must be an array of zero or more fontInfoWOFFMetadataTextValue
        value.text = '';
        doh.assertFalse(validators.fontInfoWOFFMetadataLicenseValidator(value));
        value.text = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataLicenseValidator(value));
        value.text = [];
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseValidator(value));
        
        // fontInfoWOFFMetadataTextValue was tested above, I won't do it
        // here completely
        // minimal true is  {text: ''};
        value.text.push({text: ''});
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseValidator(value));
        value.text.push({text: ''});
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseValidator(value));
        value.text.push({});
        doh.assertFalse(validators.fontInfoWOFFMetadataLicenseValidator(value));
        value.text[2].text = 'hello';
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseValidator(value));
        value.text[2].dir = 'ltr';
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseValidator(value));
        value.text[2].dir = 'nothing real';
        doh.assertFalse(validators.fontInfoWOFFMetadataLicenseValidator(value));
        value.text[2].dir = 'rtl';
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseValidator(value));
    },
    function Test_fontInfoWOFFMetadataTrademarkValidator() {
        // {
        //    text: mandatory Array of zero or more fontInfoWOFFMetadataTextValue
        // }
        
        // not a dict
        var value = '';
        doh.assertFalse(validators.fontInfoWOFFMetadataTrademarkValidator(value));
        value = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataTrademarkValidator(value));
        value = 56;
        doh.assertFalse(validators.fontInfoWOFFMetadataTrademarkValidator(value));
        
        // text must be present and array of zero or more fontInfoWOFFMetadataTextValue
        value.text = '';
        doh.assertFalse(validators.fontInfoWOFFMetadataTrademarkValidator(value));
        value.text = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataTrademarkValidator(value));
        // minimal true
        value = {text:[]};
        doh.assertTrue(validators.fontInfoWOFFMetadataTrademarkValidator(value));
        
        // unexpected key
        value.rubbish = 'something'
        doh.assertFalse(validators.fontInfoWOFFMetadataTrademarkValidator(value));
        delete(value.rubbish);
        
        // fontInfoWOFFMetadataTextValue was tested above, I won't do it
        // here completely
        // minimal true is  {text: ''};
        value.text.push({text: ''});
        doh.assertTrue(validators.fontInfoWOFFMetadataTrademarkValidator(value));
        value.text.push({text: ''});
        doh.assertTrue(validators.fontInfoWOFFMetadataTrademarkValidator(value));
        value.text.push({});
        doh.assertFalse(validators.fontInfoWOFFMetadataTrademarkValidator(value));
        value.text[2].text = 'hello';
        doh.assertTrue(validators.fontInfoWOFFMetadataTrademarkValidator(value));
        value.text[2].dir = 'ltr';
        doh.assertTrue(validators.fontInfoWOFFMetadataTrademarkValidator(value));
        value.text[2].dir = 'nothing real';
        doh.assertFalse(validators.fontInfoWOFFMetadataTrademarkValidator(value));
        value.text[2].dir = 'rtl';
        doh.assertTrue(validators.fontInfoWOFFMetadataTrademarkValidator(value));
    },
    // this is a copy of Test_fontInfoWOFFMetadataTrademarkValidator but using another validator
    function Test_fontInfoWOFFMetadataCopyrightValidator() {
        // {
        //    text: mandatory Array of zero or more fontInfoWOFFMetadataTextValue
        // }
        
        // not a dict
        var value = '';
        doh.assertFalse(validators.fontInfoWOFFMetadataCopyrightValidator(value));
        value = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataCopyrightValidator(value));
        value = 56;
        doh.assertFalse(validators.fontInfoWOFFMetadataCopyrightValidator(value));
        
        // text must be present and array of zero or more fontInfoWOFFMetadataTextValue
        value.text = '';
        doh.assertFalse(validators.fontInfoWOFFMetadataCopyrightValidator(value));
        value.text = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataCopyrightValidator(value));
        // minimal true
        value = {text:[]};
        doh.assertTrue(validators.fontInfoWOFFMetadataCopyrightValidator(value));
        
        // unexpected key
        value.rubbish = 'something'
        doh.assertFalse(validators.fontInfoWOFFMetadataCopyrightValidator(value));
        delete(value.rubbish);
        
        // fontInfoWOFFMetadataTextValue was tested above, I won't do it
        // here completely
        // minimal true is  {text: ''};
        value.text.push({text: ''});
        doh.assertTrue(validators.fontInfoWOFFMetadataCopyrightValidator(value));
        value.text.push({text: ''});
        doh.assertTrue(validators.fontInfoWOFFMetadataCopyrightValidator(value));
        value.text.push({});
        doh.assertFalse(validators.fontInfoWOFFMetadataCopyrightValidator(value));
        value.text[2].text = 'hello';
        doh.assertTrue(validators.fontInfoWOFFMetadataCopyrightValidator(value));
        value.text[2].dir = 'ltr';
        doh.assertTrue(validators.fontInfoWOFFMetadataCopyrightValidator(value));
        value.text[2].dir = 'nothing real';
        doh.assertFalse(validators.fontInfoWOFFMetadataCopyrightValidator(value));
        value.text[2].dir = 'rtl';
        doh.assertTrue(validators.fontInfoWOFFMetadataCopyrightValidator(value));
    },
    function Test_fontInfoWOFFMetadataLicenseeValidator() {
        //{
        //    "name" : mandatory, string,
        //    "dir" : optional, string, either 'ltr' or 'rtl'
        //    "class" : optional, string
        //}
        
        //no dict
        var value = 4;
        doh.assertFalse(validators.fontInfoWOFFMetadataLicenseeValidator(value));
        value = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataLicenseeValidator(value));
        value = '';
        doh.assertFalse(validators.fontInfoWOFFMetadataLicenseeValidator(value));
        value = function(){};
        doh.assertFalse(validators.fontInfoWOFFMetadataLicenseeValidator(value));
        
        //minimal true
        value = {name: ''};
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseeValidator(value));
        //unexpected keys:
        value.answer = 42;
        doh.assertFalse(validators.fontInfoWOFFMetadataLicenseeValidator(value));
        delete(value.answer);
        value.name = 'Hönes';
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseeValidator(value));
        
        //when dir is present it must be 'ltr' or 'rtl'
        value.dir = 'rtl';
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseeValidator(value));
        value.dir = 'fghjkl';
        doh.assertFalse(validators.fontInfoWOFFMetadataLicenseeValidator(value));
        value.dir = 'ltr';
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseeValidator(value));
        
        //class, when present, must be string
        value['class'] =  '';
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseeValidator(value));
        value['class'] =  5;
        doh.assertFalse(validators.fontInfoWOFFMetadataLicenseeValidator(value));
        value['class'] =  {};
        doh.assertFalse(validators.fontInfoWOFFMetadataLicenseeValidator(value));
        value['class'] =  'a class';
        doh.assertTrue(validators.fontInfoWOFFMetadataLicenseeValidator(value));
    },
    // copy of Test_fontInfoWOFFMetadataTextValue except of the validator function name
    function Test_fontInfoWOFFMetadataExtensionNameValidator() {
        //{
        //    text: mandatory, string
        //    language: optional, string
        //    dir: optional, string
        //    class: optional, string
        //}
        
        // no dict
        var value = 4;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value = false;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value = '';
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        
        // wrong dict
        value = {};
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value = {rubbish: 'junk'};
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        
        // minimal correct
        value = {text: ''};
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        
        // text must be string
        value.text = 43;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value.text = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value.text = [];
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value.text = 'A text';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        
        //if dir is present ist must be 'ltr' or 'rtl'
        value.dir = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value.dir = '';
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value.dir = 'whatever';
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value.dir = 'ltr';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value.dir = 'rtl';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        
        //if language or class are present either needs to be string
        value.language = 'klingon';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value.language = '';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value.language = 1011010;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value.language = 'javascript';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        
        value['class'] = 'something';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value['class'] = '';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value['class'] = 5;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value['class'] = function(){};
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        value['class'] = 'anything';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
        delete(value.language);
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionNameValidator(value));
    },
    // copy of Test_fontInfoWOFFMetadataTextValue except of the validator function name
    function Test_fontInfoWOFFMetadataExtensionValueValidator() {
        //{
        //    text: mandatory, string
        //    language: optional, string
        //    dir: optional, string
        //    class: optional, string
        //}
        
        // no dict
        var value = 4;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value = false;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value = '';
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        
        // wrong dict
        value = {};
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value = {rubbish: 'junk'};
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        
        // minimal correct
        value = {text: ''};
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        
        // text must be string
        value.text = 43;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value.text = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value.text = [];
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value.text = 'A text';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        
        //if dir is present ist must be 'ltr' or 'rtl'
        value.dir = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value.dir = '';
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value.dir = 'whatever';
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value.dir = 'ltr';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value.dir = 'rtl';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        
        //if language or class are present either needs to be string
        value.language = 'klingon';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value.language = '';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value.language = 1011010;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value.language = 'javascript';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        
        value['class'] = 'something';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value['class'] = '';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value['class'] = 5;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value['class'] = function(){};
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        value['class'] = 'anything';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
        delete(value.language);
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValueValidator(value));
    },
    function Test_fontInfoWOFFMetadataExtensionItemValidator() {
        //{
        //    names: mandatory, Array of zero or more fontInfoWOFFMetadataExtensionNameValidator
        //    values: mandatory Array of zero or more fontInfoWOFFMetadataExtensionValueValidator
        //    id: optional, string
        //}
        
        // no dict
        var value = 7;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value = '';
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        // not enough mandatory keys
        value = {};
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        
        // minimal true
        value.values = [];
        value.names = [];
        
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        //values must be array
        value.values = 5;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value.values = 'hello';
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value.values = {};
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value.values = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value.values = [];
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
    
        //names must be array
        value.names = 5;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value.names = 'hello';
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value.names = {};
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value.names = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value.names = [];
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        
        //unexpected keys
        value.rubbish = false;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        delete(value.rubbish);
        
        //optional id has wrong type
        value.id = 23;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value.id = {};
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value.id = false;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value.id = 'Hellooo';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        
        // values and names have already testet validators, so this is just
        // a minimum check
        value.names.push({
            text: 'name',
            dir: 'ltr'
        });
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value.values.push({
            text: 'item',
            dir: 'rtl'
        });
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value.names.push({
            text: 'name 2',
            dir: 'ttb'
        });
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value.names.pop();
        value.values.push({
            text: 'item 2',
            dir: 'ttb'
        });
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
        value.values[1].dir = 'ltr'
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionItemValidator(value));
    },
    function Test_fontInfoWOFFMetadataExtensionValidator() {
        // {
        //     names: optional, Array of zero or more fontInfoWOFFMetadataExtensionNameValidator
        //     items: mandatory, Array of zero or more fontInfoWOFFMetadataExtensionItemValidator
        //     id: optional, string
        // }
        
        //no dict
        var value = 9;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        value = 'qwerty';
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        value = false;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        // not all mandatory
        value = {};
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        // minimal true
        value.items = [];
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValidator(value));
        //wrong type for items
        value.items = {};
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        value.items = '';
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        value.items = 456;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        value.items = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        
        // unexpected key
        value.items = [];
        value.rubbish = 'something';
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        delete(value.rubbish);
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValidator(value));
        
        //wrong type for optional id
        value.id = 12;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        value.id = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        value.id = function(){};
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        value.id = [123,2345];
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        value.id = '';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValidator(value));
        value.id = 'hello';
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValidator(value));
        
        //wrong type for optional names
        value.names = 12;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        value.names = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        value.names = function(){};
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        value.names = 'hello';
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        value.names = [];
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValidator(value));
        
        // the contents of names and values arech checked wit already tested validators
        // this is just a minimal check
        value.names.push({
            text: 'a name',
            dir: 'rtl'
        });
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValidator(value));
        value.names.push(5);
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
        value.names.pop();
        value.items.push({
            names: [{text:'hi'}],
            values: [
                {text: 'item',dir: 'rtl'},
                {text: 'another',dir: 'rtl'}
            ]
        });
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionValidator(value));
        
        value.items.push({
            names: [{}],
            values: [
                {text: 'item',dir: 'rtl'},
                {text: 'another',dir: 'rtl'}
            ]
        });
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionValidator(value));
    },
    function Test_fontInfoWOFFMetadataExtensionsValidator() {
        // Array of at least one fontInfoWOFFMetadataExtensionValidator
        var value = {};
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionsValidator(value));
        value = 23;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionsValidator(value));
        value = 'hi';
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionsValidator(value));
        value = true;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionsValidator(value));
        value = undefined;
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionsValidator(value));
        value = [];
        doh.assertFalse(validators.fontInfoWOFFMetadataExtensionsValidator(value));
        // minimal true
        // fontInfoWOFFMetadataExtensionValidator is tested above
        value.push({items: []});
        doh.assertTrue(validators.fontInfoWOFFMetadataExtensionsValidator(value));
    },
    function Test_identifierValidator() {
        //not a string
        var value = undefined, i;
        doh.assertFalse(validators.identifierValidator(value));
        value = true;
        doh.assertFalse(validators.identifierValidator(value));
        value = [];
        doh.assertFalse(validators.identifierValidator(value));
        value = {};
        doh.assertFalse(validators.identifierValidator(value));
        value = 17;
        doh.assertFalse(validators.identifierValidator(value));
        // too short
        value = '';
        doh.assertFalse(validators.identifierValidator(value));
        //good length and content
        value = 'a';
        doh.assertTrue(validators.identifierValidator(value));
        value = [];
        for(i=0; i<100; i++)
            value.push('a');
        value = value.join('');
        doh.assertTrue(validators.identifierValidator(value));
        //too long
        value += 'a';
        doh.assertFalse(validators.identifierValidator(value));
        
        //bad content
        value = 'ä';
        doh.assertFalse(validators.identifierValidator(value));
        
        value = String.fromCharCode(0x2026);
        doh.assertFalse(validators.identifierValidator(value));
        
        value = String.fromCharCode(0x7F);
        doh.assertFalse(validators.identifierValidator(value));
        
        value = String.fromCharCode(0x1f);
        doh.assertFalse(validators.identifierValidator(value));
        
        // 0x20 = 32
        // 0x7e = 126
        // so all valid values fit in one string
        value = [];
        for(i=0x20; i<0x7f; i++)
            value.push(String.fromCharCode(i));
        value = value.join('');
        doh.assertTrue(validators.identifierValidator(value));
    },
    function Test_colorValidator() {
        //not string
        var value = 1;
        doh.assertFalse(validators.colorValidator(value));
        value = false;
        doh.assertFalse(validators.colorValidator(value));
        value = undefined;
        doh.assertFalse(validators.colorValidator(value));
        value = [];
        doh.assertFalse(validators.colorValidator(value));
        
        //from the Python doctest
        value = "0,0,0,0";
        doh.assertTrue(validators.colorValidator(value));
        value = ".5,.5,.5,.5";
        doh.assertTrue(validators.colorValidator(value));
        value = "0.5,0.5,0.5,0.5";
        doh.assertTrue(validators.colorValidator(value));
        value = "1,1,1,1";
        doh.assertTrue(validators.colorValidator(value));
        
        //values greater than 1 are forbidden
        value = "2,0,0,0";
        doh.assertFalse(validators.colorValidator(value));
        value = "0,2,0,0";
        doh.assertFalse(validators.colorValidator(value));
        value = "0,0,2,0";
        doh.assertFalse(validators.colorValidator(value));
        value = "0,0,0,2";
        doh.assertFalse(validators.colorValidator(value));
        
        //values smaller than 0 are forbidden (and minus signs, too)
        value = "-.3,0,0,0";
        doh.assertFalse(validators.colorValidator(value));
        value = "0,-.3,0,0";
        doh.assertFalse(validators.colorValidator(value));
        value = "0,0,-.3,0";
        doh.assertFalse(validators.colorValidator(value));
        value = "0,0,0,-.3";
        doh.assertFalse(validators.colorValidator(value));
        
        // wont accept plus signs
        value = ".3,0,0,0";
        doh.assertTrue(validators.colorValidator(value));
        value = "+.3,0,0,0";
        doh.assertFalse(validators.colorValidator(value));
        value = "0,+.3,0,0";
        doh.assertFalse(validators.colorValidator(value));
        value = "0,0,+3,0";
        doh.assertFalse(validators.colorValidator(value));
        value = "0,0,0,+3";
        doh.assertFalse(validators.colorValidator(value));
        
        //badly formatted
        value = "1r,1,1,1";
        doh.assertFalse(validators.colorValidator(value));
        value = "1,1g,1,1";
        doh.assertFalse(validators.colorValidator(value));
        value = "1,1,1b,1";
        doh.assertFalse(validators.colorValidator(value));
        value = "1,1,1,1a";
        doh.assertFalse(validators.colorValidator(value));
        
        //commas missing
        value = "1 1 1 1";
        doh.assertFalse(validators.colorValidator(value));
        value = "1 1,1,1";
        doh.assertFalse(validators.colorValidator(value));
        value = "1,1 1,1";
        doh.assertFalse(validators.colorValidator(value));
        value = "1,1,1 1";
        doh.assertFalse(validators.colorValidator(value));
        
        value = "1, 1, 1, 1";
        doh.assertTrue(validators.colorValidator(value));
    },
    function Test_guidelineValidator(){
        // {
        //    x: x and/or y must be there, numeric
        //    y: x and/or y must be there, numeric
        //    angle: if x and y are defined, angle must be defined
        //           else it must not be defined,  number between 0 and 360
        //    name: optional, string
        //    color: optional, colorValidator
        //    identifier: optional, identifierValidator
        // }
        //not dict
        var value = 5;
        doh.assertFalse(validators.guidelineValidator(value));
        value = '';
        doh.assertFalse(validators.guidelineValidator(value));
        value = true;
        doh.assertFalse(validators.guidelineValidator(value));
        
        //minimal true
        value = {x: 5};
        doh.assertTrue(validators.guidelineValidator(value));
        value = {y: -51.5};
        doh.assertTrue(validators.guidelineValidator(value));
        //x and y must be defined to make angle needed
        value.angle = 30;
        doh.assertFalse(validators.guidelineValidator(value));
        value.x = 33.8;
        doh.assertTrue(validators.guidelineValidator(value));
        //now there must ne an angle
        delete(value.angle);
        doh.assertFalse(validators.guidelineValidator(value));
        //between 0 and 360
        value.angle = -1;
        doh.assertFalse(validators.guidelineValidator(value));
        value.angle = -.01;
        doh.assertFalse(validators.guidelineValidator(value));
        value.angle = 360.1;
        doh.assertFalse(validators.guidelineValidator(value));
        value.angle = 768;
        doh.assertFalse(validators.guidelineValidator(value));
        value.angle = 0;
        doh.assertTrue(validators.guidelineValidator(value));
        value.angle = 360;
        doh.assertTrue(validators.guidelineValidator(value));
        
        //name must be string when present
        value.name = 15;
        doh.assertFalse(validators.guidelineValidator(value));
        value.name = '';
        doh.assertTrue(validators.guidelineValidator(value));
        value.name = 'my name';
        doh.assertTrue(validators.guidelineValidator(value));
        
        //color and identifier have tested validators, so less tests here
        value.identifier = 'wrönǵ¢öǹŧ€nt';
        doh.assertFalse(validators.guidelineValidator(value));
        value.identifier = 'good " # $ % & \' @ content';
        doh.assertTrue(validators.guidelineValidator(value));
        
        value.color = '0 0 0 0';
        doh.assertFalse(validators.guidelineValidator(value));
        value.color = '.1, 0, 1, 0.9';
        doh.assertTrue(validators.guidelineValidator(value));
    },
    function Test_guidelinesValidator() {
        // Array of zero or more guidelineValidator
        // an guidelineValidator.identifier must be unique within the array
        // and within the keys! of the optional seccond argument 'identifiers'
        
        //no Array
        var value = '';
        doh.assertFalse(validators.guidelinesValidator(value));
        value = 5;
        doh.assertFalse(validators.guidelinesValidator(value));
        value = {};
        doh.assertFalse(validators.guidelinesValidator(value));
        value = true;
        doh.assertFalse(validators.guidelinesValidator(value));
        
        //minimal true
        value = [];
        doh.assertTrue(validators.guidelinesValidator(value));
        
        //test the identifier uniqueness
        value.push({
            x: 5,
            identifier: 'first id'
        });
        value.push({
            y: 173,
            identifier: 'first id'
        });
        doh.assertFalse(validators.guidelinesValidator(value));
        value[1].identifier = 'seccond id';
        doh.assertTrue(validators.guidelinesValidator(value));
        
        // see whether the identifiers argument works
        var identifiers = {};
        identifiers[value[1].identifier] = true;
        doh.assertFalse(validators.guidelinesValidator(value, identifiers));
        var identifiers = {'someId': true};
        doh.assertTrue(validators.guidelinesValidator(value, identifiers));
    },
    function Test_anchorValidator(){
        // {
        //   x: mandatory, number
        //   y: mandatory, number
        //   name: optional, string
        //   color: optional colorValidator
        //   identifier: optional, identifierValidator
        // }
        
        
        //not dict
        var value = 9;
        doh.assertFalse(validators.anchorValidator(value));
        value = '';
        doh.assertFalse(validators.anchorValidator(value));
        value = true;
        doh.assertFalse(validators.anchorValidator(value));
        value = undefined;
        doh.assertFalse(validators.anchorValidator(value));
        
        //minimal true
        value = {
            x: 15.8,
            y: -152876
        };
        doh.assertTrue(validators.anchorValidator(value));
        
        //when name then a string
        value.name = ['hi'];
        doh.assertFalse(validators.anchorValidator(value));
        value.name = 5;
        doh.assertFalse(validators.anchorValidator(value));
        value.name = false;
        doh.assertFalse(validators.anchorValidator(value));
        value.name = '';
        doh.assertTrue(validators.anchorValidator(value));
        value.name = 'Hi';
        doh.assertTrue(validators.anchorValidator(value));
        
        //color and identifier have tested validators, so less tests here
        value.identifier = 'wrönǵ¢öǹŧ€nt';
        doh.assertFalse(validators.anchorValidator(value));
        value.identifier = 'good " # $ % & \' @ content';
        doh.assertTrue(validators.anchorValidator(value));
        
        value.color = '0 0 0 0';
        doh.assertFalse(validators.anchorValidator(value));
        value.color = '.1, 0, 1, 0.9';
        doh.assertTrue(validators.anchorValidator(value));
    },
    function Test_anchorsValidator() {
        // Array of zero or more anchorValidator
        // an anchorValidator.identifier must be unique within the array
        // and within the keys! of the optional seccond argument 'identifiers'
        
        //no Array
        var value = '';
        doh.assertFalse(validators.anchorsValidator(value));
        value = 5;
        doh.assertFalse(validators.anchorsValidator(value));
        value = {};
        doh.assertFalse(validators.anchorsValidator(value));
        value = true;
        doh.assertFalse(validators.anchorsValidator(value));
        
        //minimal true
        value = [];
        doh.assertTrue(validators.anchorsValidator(value));
        
        //test the identifier uniqueness
        value.push({
            x: 5,
            y: -96.45,
            identifier: 'first id'
        });
        value.push({
            x: 65.5864,
            y: 17.3,
            identifier: 'first id'
        });
        doh.assertFalse(validators.anchorsValidator(value));
        value[1].identifier = 'seccond id';
        doh.assertTrue(validators.anchorsValidator(value));
        
        // see whether the identifiers argument works
        var identifiers = {};
        identifiers[value[1].identifier] = true;
        doh.assertFalse(validators.anchorsValidator(value, identifiers));
        var identifiers = {'someId': true};
        doh.assertTrue(validators.anchorsValidator(value, identifiers));
    },
    function Test_imageValidator(){
        // {
        //   fileName: mandatory, string with at least one character
        //   xScale: optional, number
        //   xyScale:  optional, number
        //   yxScale:  optional, number
        //   yScale:  optional, number
        //   xOffset:  optional, number
        //   yOffset:  optional, number
        //   color:  optional, colorValidator
        // }
        
        //no dict
        var value = 6;
        doh.assertFalse(validators.imageValidator(value));
        value = 'abc';
        doh.assertFalse(validators.imageValidator(value));
        value = true;
        doh.assertFalse(validators.imageValidator(value));
        //not the mandatory keys
        value = {};
        doh.assertFalse(validators.imageValidator(value));
        
        //minimal true
        value.fileName = 'a';
        doh.assertTrue(validators.imageValidator(value));
        
        value.fileName = '';
        doh.assertFalse(validators.imageValidator(value));
        // in the Python Sources are no rules for the format of a fileName
        value.fileName = '23454321=-098?AXDc*ä_325//\\';
        doh.assertTrue(validators.imageValidator(value));
        
        //all other values must be numbers when present
        value.xScale = '15';
        doh.assertFalse(validators.imageValidator(value));
        value.xScale = 15;
        doh.assertTrue(validators.imageValidator(value));
        
        value.xyScale = true;
        doh.assertFalse(validators.imageValidator(value));
        value.xyScale = 1.5;
        doh.assertTrue(validators.imageValidator(value));
        
        value.yxScale = [];
        doh.assertFalse(validators.imageValidator(value));
        value.yxScale = -5;
        doh.assertTrue(validators.imageValidator(value));
        
        value.xOffset = {};
        doh.assertFalse(validators.imageValidator(value));
        value.xOffset = 500056456312;
        doh.assertTrue(validators.imageValidator(value));
        
        value.yOffset = function(){};
        doh.assertFalse(validators.imageValidator(value));
        value.yOffset = -0.6312;
        doh.assertTrue(validators.imageValidator(value));
    },
    function Test_pngValidator(){
        doh.assertError(
            errors.NotImplemented,
            validators, 'pngValidator',
            [],//any call to this validator will throw an error
            'It\'s not quite clear how to implement this yet'
        );
    }
    ]);
});
