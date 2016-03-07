define(
    ['doh', 'ufojs/ufoLib/converters'],
    function(doh, converters)
{
    "use strict";
    var convertUFO1OrUFO2KerningToUFO3Kerning = converters.convertUFO1OrUFO2KerningToUFO3Kerning;

    doh.register("ufojs.ufoLib.converters", [
    function Test_convertUFO1OrUFO2KerningToUFO3Kerning_noKnownPrefixes() {
        var testKerning = {
                "A" : {
                    "A" : 1,
                    "B" : 2,
                    "CGroup" : 3,
                    "DGroup" : 4
                },
                "BGroup" : {
                    "A" : 5,
                    "B" : 6,
                    "CGroup" : 7,
                    "DGroup" : 8
                },
                "CGroup" : {
                    "A" : 9,
                    "B" : 10,
                    "CGroup" : 11,
                    "DGroup" : 12
                },
            }
          , testGroups = {
                "BGroup" : ["B"],
                "CGroup" : ["C"],
                "DGroup" : ["D"],
            }
          , expectedKerning = {
                "A" : {
                    "A": 1,
                    "B": 2,
                    "public.kern2.CGroup": 3,
                    "public.kern2.DGroup": 4
                },
                "public.kern1.BGroup": {
                    "A": 5,
                    "B": 6,
                    "public.kern2.CGroup": 7,
                    "public.kern2.DGroup": 8
                },
                "public.kern1.CGroup": {
                    "A": 9,
                    "B": 10,
                    "public.kern2.CGroup": 11,
                    "public.kern2.DGroup": 12
                }
            }
          , expectedGroups = {
                "BGroup": ["B"],
                "CGroup": ["C"],
                "DGroup": ["D"],
                "public.kern1.BGroup": ["B"],
                "public.kern1.CGroup": ["C"],
                "public.kern2.CGroup": ["C"],
                "public.kern2.DGroup": ["D"],
            }
          , result = convertUFO1OrUFO2KerningToUFO3Kerning(testKerning, testGroups)
          ;
        // kerning, groups, maps = result
        doh.assertEqual(expectedKerning, result[0]);
        doh.assertEqual(expectedGroups, result[1]);
    },
    function Test_convertUFO1OrUFO2KerningToUFO3Kerning_knownPrefixes() {
        var testKerning = {
                "A" : {
                    "A" : 1,
                    "B" : 2,
                    "@MMK_R_CGroup" : 3,
                    "@MMK_R_DGroup" : 4
                },
                "@MMK_L_BGroup" : {
                    "A" : 5,
                    "B" : 6,
                    "@MMK_R_CGroup" : 7,
                    "@MMK_R_DGroup" : 8
                },
                "@MMK_L_CGroup" : {
                    "A" : 9,
                    "B" : 10,
                    "@MMK_R_CGroup" : 11,
                    "@MMK_R_DGroup" : 12
                },
            }
          , testGroups = {
                "@MMK_L_BGroup" : ["B"],
                "@MMK_L_CGroup" : ["C"],
                "@MMK_L_XGroup" : ["X"],
                "@MMK_R_CGroup" : ["C"],
                "@MMK_R_DGroup" : ["D"],
                "@MMK_R_XGroup" : ["X"],
            }
          , expectedKerning = {
                "A" : {
                    "A": 1,
                    "B": 2,
                    "public.kern2.@MMK_R_CGroup": 3,
                    "public.kern2.@MMK_R_DGroup": 4
                },
                "public.kern1.@MMK_L_BGroup": {
                    "A": 5,
                    "B": 6,
                    "public.kern2.@MMK_R_CGroup": 7,
                    "public.kern2.@MMK_R_DGroup": 8
                },
                "public.kern1.@MMK_L_CGroup": {
                    "A": 9,
                    "B": 10,
                    "public.kern2.@MMK_R_CGroup": 11,
                    "public.kern2.@MMK_R_DGroup": 12
                }
            }
          , expectedGroups = {
                "@MMK_L_BGroup": ["B"],
                "@MMK_L_CGroup": ["C"],
                "@MMK_L_XGroup": ["X"],
                "@MMK_R_CGroup": ["C"],
                "@MMK_R_DGroup": ["D"],
                "@MMK_R_XGroup": ["X"],
                "public.kern1.@MMK_L_BGroup": ["B"],
                "public.kern1.@MMK_L_CGroup": ["C"],
                "public.kern1.@MMK_L_XGroup": ["X"],
                "public.kern2.@MMK_R_CGroup": ["C"],
                "public.kern2.@MMK_R_DGroup": ["D"],
                "public.kern2.@MMK_R_XGroup": ["X"],
            }
          , result = convertUFO1OrUFO2KerningToUFO3Kerning(testKerning, testGroups)
          ;
        // kerning, groups, maps = result
        doh.assertEqual(expectedKerning, result[0]);
        doh.assertEqual(expectedGroups, result[1]);
    },
    function Test_convertUFO1OrUFO2KerningToUFO3Kerning_mixesPrefixes() {
        var testKerning = {
                "A" : {
                    "A" : 1,
                    "B" : 2,
                    "@MMK_R_CGroup" : 3,
                    "DGroup" : 4
                },
                "BGroup" : {
                    "A" : 5,
                    "B" : 6,
                    "@MMK_R_CGroup" : 7,
                    "DGroup" : 8
                },
                "@MMK_L_CGroup" : {
                    "A" : 9,
                    "B" : 10,
                    "@MMK_R_CGroup" : 11,
                    "DGroup" : 12
                },
            }
          , testGroups = {
                "BGroup" : ["B"],
                "@MMK_L_CGroup" : ["C"],
                "@MMK_R_CGroup" : ["C"],
                "DGroup" : ["D"],
            }
          , expectedKerning = {
                "A" : {
                    "A": 1,
                    "B": 2,
                    "public.kern2.@MMK_R_CGroup": 3,
                    "public.kern2.DGroup": 4
                },
                "public.kern1.BGroup": {
                    "A": 5,
                    "B": 6,
                    "public.kern2.@MMK_R_CGroup": 7,
                    "public.kern2.DGroup": 8
                },
                "public.kern1.@MMK_L_CGroup": {
                    "A": 9,
                    "B": 10,
                    "public.kern2.@MMK_R_CGroup": 11,
                    "public.kern2.DGroup": 12
                }
            }
          , expectedGroups = {
                "BGroup": ["B"],
                "@MMK_L_CGroup": ["C"],
                "@MMK_R_CGroup": ["C"],
                "DGroup": ["D"],
                "public.kern1.BGroup": ["B"],
                "public.kern1.@MMK_L_CGroup": ["C"],
                "public.kern2.@MMK_R_CGroup": ["C"],
                "public.kern2.DGroup": ["D"],
            }
          , result = convertUFO1OrUFO2KerningToUFO3Kerning(testKerning, testGroups)
          ;
        // kerning, groups, maps = result
        doh.assertEqual(expectedKerning, result[0]);
        doh.assertEqual(expectedGroups, result[1]);
    }]);
});
