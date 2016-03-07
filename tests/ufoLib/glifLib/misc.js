define([
    'doh'
  , 'ufojs/main'
  , 'ufojs/errors'
  , 'ufojs/ufoLib/filenames'
  , 'ufojs/ufoLib/validators'
  , 'ufojs/ufoLib/glifLib/misc'],
function(
    doh
  , main
  , errors
  , filenames
  , validators
  , misc
) {
    "use strict";
    doh.register("ufoLib.glifLib.misc", [
    /**
     * this wraps ufoLib/filenames.userNameToFileName which is already tested
     * so here is just a short check
     */
    function Test_glyphNameToFileName() {
        var glyphSet = {
                contents: {}
            }
          , glyphName = 'a'
          , resultA
          , resultB
          , i = 10
        ;
        for(;i>0;i--) {
            resultA =  filenames.userNameToFileName(glyphName,
                                        glyphSet.contents, '', '.glif');
            resultB = misc.glyphNameToFileName(glyphName, glyphSet)
            doh.assertEqual(resultA, resultB);
            // create new clashes each iteration
            glyphSet.contents[resultA] = null;
        }
    }
  , function Test_validateLayerInfoVersion3ValueForAttribute() {
        doh.assertFalse(misc.validateLayerInfoVersion3ValueForAttribute('made-up', 1))

        // this uses ufoLib.validators.genericTypeValidator
        doh.assertTrue(misc.validateLayerInfoVersion3ValueForAttribute('lib', {}))
        doh.assertFalse(misc.validateLayerInfoVersion3ValueForAttribute('lib', 1))
        doh.assertFalse(misc.validateLayerInfoVersion3ValueForAttribute('lib', false))

        // this uses ufoLib.validators.colorValidator, so just a rough check here:

        //good
        doh.assertTrue(misc.validateLayerInfoVersion3ValueForAttribute('color','1,1,1,1'))
        doh.assertTrue(misc.validateLayerInfoVersion3ValueForAttribute('color','1,0,0,0'))
        // may not be > 1
        doh.assertFalse(misc.validateLayerInfoVersion3ValueForAttribute('color', '1,0,0,2'))
        // missing comma
        doh.assertFalse(misc.validateLayerInfoVersion3ValueForAttribute('color', '1,1,1 1'))
        // something else
        doh.assertFalse(misc.validateLayerInfoVersion3ValueForAttribute('color', [1,2,3,4]))

    }
  , function Test_validateLayerInfoVersion3Data() {
        var infoData, result;

        infoData = {
            'made-up': 1000
        }
        doh.assertError(
           errors.GlifLib,
           misc, 'validateLayerInfoVersion3Data',
           [infoData],
           'unknown attribute'
        );

        infoData = {};
        doh.assertEqual(infoData, misc.validateLayerInfoVersion3Data(infoData))

        infoData = {
            'color': '1 1 1 1',
        };
        doh.assertError(
           errors.GlifLib,
           misc, 'validateLayerInfoVersion3Data',
           [infoData],
           'invalid value for attribute'
        );
        infoData.color = '0,.7,.1,1';
        doh.assertEqual(infoData, misc.validateLayerInfoVersion3Data(infoData))

        infoData.lib = undefined;
        doh.assertError(
           errors.GlifLib,
           misc, 'validateLayerInfoVersion3Data',
           [infoData],
           'invalid value for attribute'
        );
        infoData.lib = {answer: 42};
        doh.assertEqual(infoData, misc.validateLayerInfoVersion3Data(infoData))

        delete infoData.color;
        doh.assertEqual(infoData, misc.validateLayerInfoVersion3Data(infoData))


        // validateLayerInfoVersion3Data copies the values to a new object
        result = misc.validateLayerInfoVersion3Data(infoData);
        doh.assertFalse(result === infoData)
    }
    ])
});
