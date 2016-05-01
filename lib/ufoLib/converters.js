/**
 * Ported from github.com/unified-font-object/ufoLib
 * Lib/ufoLib/converters.py at 337ef3202b49a9a4848aab1f93248823c2757d61
 */
define([
    'ufojs/errors'
  , 'ufojs/main'
  , './validators'
], function(
    errors
  , main
  , validators
) {
    "use strict";

    var UFOLibError = errors.UFOLib
      , setLike = main.setLike
      , genericTypeValidator = validators.genericTypeValidator
      , fontInfoStyleMapStyleNameValidator = validators.fontInfoStyleMapStyleNameValidator
      , fontInfoOpenTypeHeadCreatedValidator = validators.fontInfoOpenTypeHeadCreatedValidator
      , genericIntListValidator = validators.genericIntListValidator
      , fontInfoOpenTypeOS2WidthClassValidator = validators.fontInfoOpenTypeOS2WidthClassValidator
      , fontInfoOpenTypeOS2WeightClassValidator = validators.fontInfoOpenTypeOS2WeightClassValidator
      , fontInfoVersion2OpenTypeOS2PanoseValidator = validators.fontInfoVersion2OpenTypeOS2PanoseValidator
      , fontInfoOpenTypeOS2FamilyClassValidator = validators.fontInfoOpenTypeOS2FamilyClassValidator
      , fontInfoPostscriptBluesValidator = validators.fontInfoPostscriptBluesValidator
      , fontInfoPostscriptOtherBluesValidator = validators.fontInfoPostscriptOtherBluesValidator
      , fontInfoPostscriptStemsValidator = validators.fontInfoPostscriptStemsValidator
      , fontInfoPostscriptWindowsCharacterSetValidator = validators.fontInfoPostscriptWindowsCharacterSetValidator
      , genericNonNegativeIntValidator = validators.genericNonNegativeIntValidator
      , genericNonNegativeNumberValidator = validators.genericNonNegativeNumberValidator
      , fontInfoVersion3OpenTypeOS2PanoseValidator = validators.fontInfoVersion3OpenTypeOS2PanoseValidator
      , fontInfoOpenTypeGaspRangeRecordsValidator = validators.fontInfoOpenTypeGaspRangeRecordsValidator
      , fontInfoOpenTypeNameRecordsValidator = validators.fontInfoOpenTypeNameRecordsValidator
      , fontInfoWOFFMetadataUniqueIDValidator = validators.fontInfoWOFFMetadataUniqueIDValidator
      , fontInfoWOFFMetadataVendorValidator = validators.fontInfoWOFFMetadataVendorValidator
      , fontInfoWOFFMetadataCreditsValidator = validators.fontInfoWOFFMetadataCreditsValidator
      , fontInfoWOFFMetadataDescriptionValidator = validators.fontInfoWOFFMetadataDescriptionValidator
      , fontInfoWOFFMetadataLicenseValidator = validators.fontInfoWOFFMetadataLicenseValidator
      , fontInfoWOFFMetadataCopyrightValidator = validators.fontInfoWOFFMetadataCopyrightValidator
      , fontInfoWOFFMetadataTrademarkValidator = validators.fontInfoWOFFMetadataTrademarkValidator
      , fontInfoWOFFMetadataLicenseeValidator = validators.fontInfoWOFFMetadataLicenseeValidator
      , fontInfoWOFFMetadataExtensionsValidator = validators.fontInfoWOFFMetadataExtensionsValidator
      , guidelinesValidator = validators.guidelinesValidator
      ;
    /**
     * This will find kerning groups with known prefixes.
     * In some cases not all kerning groups will be referenced
     * by the kerning pairs. The algorithm for locating groups
     * in convertUFO1OrUFO2KerningToUFO3Kerning will miss these
     * unreferenced groups. By scanning for known prefixes
     * this function will catch all of the prefixed groups.
     *
     * These are the prefixes and sides that are handled:
     * @MMK_L_ - side 1
     * @MMK_R_ - side 2
     *
     * >>> testGroups = {
     * ...     "@MMK_L_1" : None,
     * ...     "@MMK_L_2" : None,
     * ...     "@MMK_L_3" : None,
     * ...     "@MMK_R_1" : None,
     * ...     "@MMK_R_2" : None,
     * ...     "@MMK_R_3" : None,
     * ...     "@MMK_l_1" : None,
     * ...     "@MMK_r_1" : None,
     * ...     "@MMK_X_1" : None,
     * ...     "foo" : None,
     * ... }
     * >>> first, second = findKnownKerningGroups(testGroups)
     * >>> sorted(first)
     * ['@MMK_L_1', '@MMK_L_2', '@MMK_L_3']
     * >>> sorted(second)
     * ['@MMK_R_1', '@MMK_R_2', '@MMK_R_3']
     */
    function findKnownKerningGroups(groups) {
        var prefixes = {
                first: ['@MMK_L_']
              , second: ['@MMK_R_']
            }
          , result = {first: new Set(), second: new Set()}
          , groupName, side, groupPrefixes, i, l, prefix
          ;

        groupsLoop:
        for(groupName in groups) {
            for(side in prefixes) {
                groupPrefixes = prefixes[side];
                for(i=0,l=groupPrefixes.length;i<l;i++) {
                    prefix = groupPrefixes[i];
                    if(groupName.indexOf(prefix) === 0) {
                        result[side].add(groupName);
                        continue groupsLoop;
                    }
                }
            }
        }
        return [result.first, result.second];
    }

    function makeUniqueGroupName(existingNames, name) {
        // Add a number to the name
        var newName = name
          , counter = 0
          ;

        while(existingNames.has(newName)) {
            counter += 1;
            newName = newName + counter;
        }
        return newName;
    }

    function _renameGroups(existingNames, prefix, name) {
        //jshint validthis:true
        var newName = makeUniqueGroupName(existingNames, prefix + name);
        existingNames.add(newName);
        this[name] = newName;
    }

    //adapted from the UFO spec
    function convertUFO1OrUFO2KerningToUFO3Kerning(kerning, groups) {
        // gather known kerning groups based on the prefixes
        var referencedGroups = findKnownKerningGroups(groups)
          , firstReferencedGroups = referencedGroups[0]
          , secondReferencedGroups = referencedGroups[1]
          , first, seconds, second
          , firstRenamedGroups = Object.create(null)
          , secondRenamedGroups = Object.create(null)
          , existingNames
          , newKerning = Object.create(null)
          , newSeconds, value, oldName
          , newGroups, k
          ;
        // Make lists of groups referenced in kerning pairs.
        for(first in kerning) {
            seconds = kerning[first];
            if(first in groups && first.indexOf('public.kern1.') !== 0)
                firstReferencedGroups.add(first);

            for(second in seconds)
                if(second in groups && second.indexOf('public.kern2.') !== 0)
                    secondReferencedGroups.add(second);
        }

        // Create new names for these groups.
        existingNames = new Set(Object.keys(groups));
        firstReferencedGroups.forEach(_renameGroups.bind(
                        firstRenamedGroups, existingNames, 'public.kern1.'));
        existingNames = new Set(Object.keys(groups));
        secondReferencedGroups.forEach(_renameGroups.bind(
                        secondRenamedGroups, existingNames, 'public.kern2.'));


        // Populate the new group names into the kerning dictionary as needed.
        for(first in kerning) {
            seconds = kerning[first];
            first = firstRenamedGroups[first] || first;
            newSeconds = Object.create(null);
            for(second in seconds) {
                value = seconds[second];
                second = secondRenamedGroups[second] || second;
                newSeconds[second] = value;
            }
            newKerning[first] = newSeconds;
        }

        // Make copies of the referenced groups and store them
        // under the new names in the overall groups dictionary.
        newGroups = Object.create(null);
        for(k in groups)
            newGroups[k] = Array.prototype.slice.call(groups[k]);

        for(oldName in firstRenamedGroups)
            newGroups[firstRenamedGroups[oldName]] = Array.prototype.slice.call(groups[oldName]);
        for(oldName in secondRenamedGroups)
            newGroups[secondRenamedGroups[oldName]] = Array.prototype.slice.call(groups[oldName]);

        // Return the kerning and the groups.
        return [newKerning, newGroups, {side1:firstRenamedGroups, side2:secondRenamedGroups}];
    }

    // ------------------------------------
    // fontinfo.plist Conversion Functions
    // ------------------------------------

    // Version Validators

    // There is no version 1 validator and there shouldn't be.
    // The version 1 spec was very loose and there were numerous
    // cases of invalid values.


    function _validateFontInfoAttribue(valueData, attr, value){
        var setup = valueData[attr]
          , valueType = setup.type
          , validator = setup.valueValidator || genericTypeValidator
          , valueOptions = setup.valueOptions
          ;
        // have specific options for the validator
        if(valueOptions)
            return validator(value, valueOptions);
        // no specific options
        if(validator === genericTypeValidator)
            return validator(value, valueType);
        return validator(value);
    }

    function _validateInfoData(validateFontInfoAttribue, infoData) {
        var validInfoData = Object.create(null)
          , attr, value
          ;
        for(attr in infoData) {
            value = infoData[attr];
            if(!validateFontInfoAttribue(attr, value))
                throw new UFOLibError('Invalid value for attribute "'
                                        + attr + '" (' + value + ')');
            else
                validInfoData[attr] = value;
        }
        return validInfoData;
    }

    // Value Options

    function _intList(i, l){
        var result = [];
        for(;i<l;i++) result.push(i);
        return result;
    }

    function _flipDict(d, keysAsInt) {
        var flipped = Object.create(null), k;
        for(k in d)
            flipped[d[k]] = keysAsInt ? parseInt(k, 10) : k;
        return flipped;
    }

    var fontInfoOpenTypeHeadFlagsOptions = _intList(0, 15)
      , fontInfoOpenTypeOS2SelectionOptions = _intList(1, 10)
      , fontInfoOpenTypeOS2UnicodeRangesOptions = _intList(0, 128)
      , fontInfoOpenTypeOS2CodePageRangesOptions = _intList(0, 64)
      , fontInfoOpenTypeOS2TypeOptions = _intList(0, 10)
        // Version Attribute Definitions
        // This defines the attributes, types and, in some
        // cases the possible values, that can exist is
        // fontinfo.plist.
      , fontInfoAttributesVersion1 = setLike([
            'familyName',
            'styleName',
            'fullName',
            'fontName',
            'menuName',
            'fontStyle',
            'note',
            'versionMajor',
            'versionMinor',
            'year',
            'copyright',
            'notice',
            'trademark',
            'license',
            'licenseURL',
            'createdBy',
            'designer',
            'designerURL',
            'vendorURL',
            'unitsPerEm',
            'ascender',
            'descender',
            'capHeight',
            'xHeight',
            'defaultWidth',
            'slantAngle',
            'italicAngle',
            'widthName',
            'weightName',
            'weightValue',
            'fondName',
            'otFamilyName',
            'otStyleName',
            'otMacName',
            'msCharSet',
            'fondID',
            'uniqueID',
            'ttVendor',
            'ttUniqueID',
            'ttVersion',
        ])
      , fontInfoAttributesVersion2ValueData = {
            'familyName': {type: 'string'},
            'styleName': {type: 'string'},
            'styleMapFamilyName': {type: 'string'},
            'styleMapStyleName': {type: 'string', valueValidator:fontInfoStyleMapStyleNameValidator},
            'versionMajor': {type: 'int'},
            'versionMinor': {type: 'int'},
            'year': {type: 'int'},
            'copyright': {type: 'string'},
            'trademark': {type: 'string'},
            'unitsPerEm': {type: ['int', 'float']},
            'descender': {type: ['int', 'float']},
            'xHeight': {type: ['int', 'float']},
            'capHeight': {type: ['int', 'float']},
            'ascender': {type: ['int', 'float']},
            'italicAngle': {type: ['float', 'int']},
            'note': {type: 'string'},
            'openTypeHeadCreated': {type: 'string', valueValidator:fontInfoOpenTypeHeadCreatedValidator},
            'openTypeHeadLowestRecPPEM': {type: ['int', 'float']},
            'openTypeHeadFlags': {type: 'integerList', valueValidator:genericIntListValidator, valueOptions:fontInfoOpenTypeHeadFlagsOptions},
            'openTypeHheaAscender': {type: ['int', 'float']},
            'openTypeHheaDescender': {type: ['int', 'float']},
            'openTypeHheaLineGap': {type: ['int', 'float']},
            'openTypeHheaCaretSlopeRise': {type: 'int'},
            'openTypeHheaCaretSlopeRun': {type: 'int'},
            'openTypeHheaCaretOffset': {type: ['int', 'float']},
            'openTypeNameDesigner': {type: 'string'},
            'openTypeNameDesignerURL': {type: 'string'},
            'openTypeNameManufacturer': {type: 'string'},
            'openTypeNameManufacturerURL': {type: 'string'},
            'openTypeNameLicense': {type: 'string'},
            'openTypeNameLicenseURL': {type: 'string'},
            'openTypeNameVersion': {type: 'string'},
            'openTypeNameUniqueID': {type: 'string'},
            'openTypeNameDescription': {type: 'string'},
            'openTypeNamePreferredFamilyName': {type: 'string'},
            'openTypeNamePreferredSubfamilyName': {type: 'string'},
            'openTypeNameCompatibleFullName': {type: 'string'},
            'openTypeNameSampleText': {type: 'string'},
            'openTypeNameWWSFamilyName': {type: 'string'},
            'openTypeNameWWSSubfamilyName': {type: 'string'},
            'openTypeOS2WidthClass': {type: 'int', valueValidator:fontInfoOpenTypeOS2WidthClassValidator},
            'openTypeOS2WeightClass': {type: 'int', valueValidator:fontInfoOpenTypeOS2WeightClassValidator},
            'openTypeOS2Selection': {type: 'integerList', valueValidator:genericIntListValidator, valueOptions:fontInfoOpenTypeOS2SelectionOptions},
            'openTypeOS2VendorID': {type: 'string'},
            'openTypeOS2Panose': {type: 'integerList', valueValidator:fontInfoVersion2OpenTypeOS2PanoseValidator},
            'openTypeOS2FamilyClass': {type: 'integerList', valueValidator:fontInfoOpenTypeOS2FamilyClassValidator},
            'openTypeOS2UnicodeRanges': {type: 'integerList', valueValidator:genericIntListValidator, valueOptions:fontInfoOpenTypeOS2UnicodeRangesOptions},
            'openTypeOS2CodePageRanges': {type: 'integerList', valueValidator:genericIntListValidator, valueOptions:fontInfoOpenTypeOS2CodePageRangesOptions},
            'openTypeOS2TypoAscender': {type: ['int', 'float']},
            'openTypeOS2TypoDescender': {type: ['int', 'float']},
            'openTypeOS2TypoLineGap': {type: ['int', 'float']},
            'openTypeOS2WinAscent': {type: ['int', 'float']},
            'openTypeOS2WinDescent': {type: ['int', 'float']},
            'openTypeOS2Type': {type: 'integerList', valueValidator:genericIntListValidator, valueOptions:fontInfoOpenTypeOS2TypeOptions},
            'openTypeOS2SubscriptXSize': {type: ['int', 'float']},
            'openTypeOS2SubscriptYSize': {type: ['int', 'float']},
            'openTypeOS2SubscriptXOffset': {type: ['int', 'float']},
            'openTypeOS2SubscriptYOffset': {type: ['int', 'float']},
            'openTypeOS2SuperscriptXSize': {type: ['int', 'float']},
            'openTypeOS2SuperscriptYSize': {type: ['int', 'float']},
            'openTypeOS2SuperscriptXOffset': {type: ['int', 'float']},
            'openTypeOS2SuperscriptYOffset': {type: ['int', 'float']},
            'openTypeOS2StrikeoutSize': {type: ['int', 'float']},
            'openTypeOS2StrikeoutPosition': {type: ['int', 'float']},
            'openTypeVheaVertTypoAscender': {type: ['int', 'float']},
            'openTypeVheaVertTypoDescender': {type: ['int', 'float']},
            'openTypeVheaVertTypoLineGap': {type: ['int', 'float']},
            'openTypeVheaCaretSlopeRise': {type: 'int'},
            'openTypeVheaCaretSlopeRun': {type: 'int'},
            'openTypeVheaCaretOffset': {type: ['int', 'float']},
            'postscriptFontName': {type: 'string'},
            'postscriptFullName': {type: 'string'},
            'postscriptSlantAngle': {type: ['float', 'int']},
            'postscriptUniqueID': {type: 'int'},
            'postscriptUnderlineThickness': {type: ['int', 'float']},
            'postscriptUnderlinePosition': {type: ['int', 'float']},
            'postscriptIsFixedPitch': {type: 'boolean'},
            'postscriptBlueValues': {type: 'integerList', valueValidator:fontInfoPostscriptBluesValidator},
            'postscriptOtherBlues': {type: 'integerList', valueValidator:fontInfoPostscriptOtherBluesValidator},
            'postscriptFamilyBlues': {type: 'integerList', valueValidator:fontInfoPostscriptBluesValidator},
            'postscriptFamilyOtherBlues': {type: 'integerList', valueValidator:fontInfoPostscriptOtherBluesValidator},
            'postscriptStemSnapH': {type: 'integerList', valueValidator:fontInfoPostscriptStemsValidator},
            'postscriptStemSnapV': {type: 'integerList', valueValidator:fontInfoPostscriptStemsValidator},
            'postscriptBlueFuzz': {type: ['int', 'float']},
            'postscriptBlueShift': {type: ['int', 'float']},
            'postscriptBlueScale': {type: ['float', 'int']},
            'postscriptForceBold': {type: 'boolean'},
            'postscriptDefaultWidthX': {type: ['int', 'float']},
            'postscriptNominalWidthX': {type: ['int', 'float']},
            'postscriptWeightName': {type: 'string'},
            'postscriptDefaultCharacter': {type: 'string'},
            'postscriptWindowsCharacterSet': {type: 'int', valueValidator:fontInfoPostscriptWindowsCharacterSetValidator},
            'macintoshFONDFamilyID': {type: 'int'},
            'macintoshFONDName': {type: 'string'},
        }
      , fontInfoAttributesVersion2 = setLike(Object.keys(fontInfoAttributesVersion2ValueData))
      , fontInfoAttributesVersion3ValueData = (function(/*arguments*/) {
            var result = Object.create(null), source, k, i, l;
            for(i=0,l=arguments.length;i<l;i++) {
                source=arguments[i];
                for(k in source)
                    // don't do that deepcopy like thing that the python ufoLib does here
                    result[k] = source[k];
            }
            return result;
        })(fontInfoAttributesVersion2ValueData, {
            'versionMinor': {type: 'int', valueValidator: genericNonNegativeIntValidator},
            'unitsPerEm': {type: ['int', 'float'], valueValidator: genericNonNegativeNumberValidator},
            'openTypeHeadLowestRecPPEM': {type: 'int', valueValidator: genericNonNegativeNumberValidator},
            'openTypeHheaAscender': {type: 'int'},
            'openTypeHheaDescender': {type: 'int'},
            'openTypeHheaLineGap': {type: 'int'},
            'openTypeHheaCaretOffset': {type: 'int'},
            'openTypeOS2Panose': {type: 'integerList', valueValidator: fontInfoVersion3OpenTypeOS2PanoseValidator},
            'openTypeOS2TypoAscender': {type: 'int'},
            'openTypeOS2TypoDescender': {type: 'int'},
            'openTypeOS2TypoLineGap': {type: 'int'},
            'openTypeOS2WinAscent': {type: 'int', valueValidator: genericNonNegativeNumberValidator},
            'openTypeOS2WinDescent': {type: 'int', valueValidator: genericNonNegativeNumberValidator},
            'openTypeOS2SubscriptXSize': {type: 'int'},
            'openTypeOS2SubscriptYSize': {type: 'int'},
            'openTypeOS2SubscriptXOffset': {type: 'int'},
            'openTypeOS2SubscriptYOffset': {type: 'int'},
            'openTypeOS2SuperscriptXSize': {type: 'int'},
            'openTypeOS2SuperscriptYSize': {type: 'int'},
            'openTypeOS2SuperscriptXOffset': {type: 'int'},
            'openTypeOS2SuperscriptYOffset': {type: 'int'},
            'openTypeOS2StrikeoutSize': {type: 'int'},
            'openTypeOS2StrikeoutPosition': {type: 'int'},
            'openTypeGaspRangeRecords': {type: 'dictList', valueValidator: fontInfoOpenTypeGaspRangeRecordsValidator},
            'openTypeNameRecords': {type: 'dictList', valueValidator: fontInfoOpenTypeNameRecordsValidator},
            'openTypeVheaVertTypoAscender': {type: 'int'},
            'openTypeVheaVertTypoDescender': {type: 'int'},
            'openTypeVheaVertTypoLineGap': {type: 'int'},
            'openTypeVheaCaretOffset': {type: 'int'},
            'woffMajorVersion': {type: 'int', valueValidator: genericNonNegativeIntValidator},
            'woffMinorVersion': {type: 'int', valueValidator: genericNonNegativeIntValidator},
            'woffMetadataUniqueID': {type: 'object', valueValidator: fontInfoWOFFMetadataUniqueIDValidator},
            'woffMetadataVendor': {type: 'object', valueValidator: fontInfoWOFFMetadataVendorValidator},
            'woffMetadataCredits': {type: 'object', valueValidator: fontInfoWOFFMetadataCreditsValidator},
            'woffMetadataDescription': {type: 'object', valueValidator: fontInfoWOFFMetadataDescriptionValidator},
            'woffMetadataLicense': {type: 'object', valueValidator: fontInfoWOFFMetadataLicenseValidator},
            'woffMetadataCopyright': {type: 'object', valueValidator: fontInfoWOFFMetadataCopyrightValidator},
            'woffMetadataTrademark': {type: 'object', valueValidator: fontInfoWOFFMetadataTrademarkValidator},
            'woffMetadataLicensee': {type: 'object', valueValidator: fontInfoWOFFMetadataLicenseeValidator},
            'woffMetadataExtensions': {type: Array, valueValidator: fontInfoWOFFMetadataExtensionsValidator},
            'guidelines': {type: Array, valueValidator: guidelinesValidator}
        })
      , fontInfoAttributesVersion3 = setLike(Object.keys(fontInfoAttributesVersion3ValueData))


        // Version Conversion Support
        // These are used from converting from version 1
        // to version 2 or vice-versa.
      , fontInfoAttributesVersion1To2 = {
            'menuName': 'styleMapFamilyName',
            'designer': 'openTypeNameDesigner',
            'designerURL': 'openTypeNameDesignerURL',
            'createdBy': 'openTypeNameManufacturer',
            'vendorURL': 'openTypeNameManufacturerURL',
            'license': 'openTypeNameLicense',
            'licenseURL': 'openTypeNameLicenseURL',
            'ttVersion': 'openTypeNameVersion',
            'ttUniqueID': 'openTypeNameUniqueID',
            'notice': 'openTypeNameDescription',
            'otFamilyName': 'openTypeNamePreferredFamilyName',
            'otStyleName': 'openTypeNamePreferredSubfamilyName',
            'otMacName': 'openTypeNameCompatibleFullName',
            'weightName': 'postscriptWeightName',
            'weightValue': 'openTypeOS2WeightClass',
            'ttVendor': 'openTypeOS2VendorID',
            'uniqueID': 'postscriptUniqueID',
            'fontName': 'postscriptFontName',
            'fondID': 'macintoshFONDFamilyID',
            'fondName': 'macintoshFONDName',
            'defaultWidth': 'postscriptDefaultWidthX',
            'slantAngle': 'postscriptSlantAngle',
            'fullName': 'postscriptFullName',
            // require special value conversion
            'fontStyle': 'styleMapStyleName',
            'widthName': 'openTypeOS2WidthClass',
            'msCharSet': 'postscriptWindowsCharacterSet'
        }
      , fontInfoAttributesVersion2To1 = _flipDict(fontInfoAttributesVersion1To2)
      , deprecatedFontInfoAttributesVersion2 = setLike(Object.keys(fontInfoAttributesVersion1To2))
      , _fontStyle2To1 = {
            'regular': 64,
            'italic': 1,
            'bold': 32,
            'bold italic': 33
        }
      , _fontStyle1To2 = (
            // this is a bit hackish. It let's me stay in the current
            // var declaration for the moment.
            _fontStyle1To2 = _flipDict(_fontStyle2To1) ,
            // Some UFO 1 files have 0
            _fontStyle1To2[0] = "regular",
            _fontStyle1To2
        )
      , _msCharSet1To2 = {
            0   : 1,
            1   : 2,
            2   : 3,
            77  : 4,
            128 : 5,
            129 : 6,
            130 : 7,
            134 : 8,
            136 : 9,
            161 : 10,
            162 : 11,
            163 : 12,
            177 : 13,
            178 : 14,
            186 : 15,
            200 : 16,
            204 : 17,
            222 : 18,
            238 : 19,
            255 : 20
        }
      , _msCharSet2To1 = _flipDict(_msCharSet1To2, true)
      , _widthName1To2 = {
            'Ultra-condensed' : 1,
            'Extra-condensed' : 2,
            'Condensed'		  : 3,
            'Semi-condensed'  : 4,
            'Medium (normal)' : 5,
            'Semi-expanded'	  : 6,
            'Expanded'		  : 7,
            'Extra-expanded'  : 8,
            'Ultra-expanded'  : 9
        }
      , _widthName2To1 = _flipDict(_widthName1To2)
      ;
    // FontLab's default width value is "Normal".
    // Many format version 1 UFOs will have this.
    _widthName1To2.Normal = 5;
    // FontLab has an "All" width value. In UFO 1
    // move this up to "Normal".
    _widthName1To2.All = 5;
    // "medium" appears in a lot of UFO 1 files.
    _widthName1To2.medium = 5;
    // "Medium" appears in a lot of UFO 1 files.
    _widthName1To2.Medium = 5;

    // 1 <-> 2
    /**
     * Convert value from version 1 to version 2 format.
     * Returns the new attribute name and the converted value.
     * If the value is None, None will be returned for the new value.
     */
    function convertFontInfoValueForAttributeFromVersion1ToVersion2(attr, value) {
        var a, v = value
          , conversion = ({
                    fontStyle: _fontStyle1To2
                  , widthName: _widthName1To2
                  , msCharSet: _msCharSet1To2
                })[value]
          ;
        if(conversion !== undefined) {
            v = conversion[value];
            if(v === undefined)
                throw new UFOLibError('Cannot convert value ('
                                +value+') for attribute ' + attr +'.');
        }
        a = fontInfoAttributesVersion1To2[attr] || attr;
        return [a, v];
    }

    /**
     * Convert value from version 2 to version 1 format.
     * Returns the new attribute name and the converted value.
     * If the value is None, None will be returned for the new value.
     */
    function convertFontInfoValueForAttributeFromVersion2ToVersion1(attr, value) {
        var a, v = value;
        if(value !== undefined)
            if (attr === 'styleMapStyleName')
                v = _fontStyle2To1[value];
            else if (attr === 'openTypeOS2WidthClass')
                v = _widthName2To1[value];
            else if (attr === 'postscriptWindowsCharacterSet')
                v = _msCharSet2To1[value];
        a = fontInfoAttributesVersion2To1[attr] || attr;
        return [a, v];
    }

    function convertFontInfoDataVersion1ToVersion2(data) {
        var converted = Object.create(null)
          , attr, value, newAttrValue, newAttr
          ;
        for(attr in data) {
            value = data[attr];
            // FontLab gives -1 for the weightValue
            // for fonts with no defined value. Many
            // format version 1 UFOs will have this.
            if(attr === 'weightValue' && value === -1)
                continue;
            newAttrValue = convertFontInfoValueForAttributeFromVersion1ToVersion2(attr, value);
            newAttr = newAttrValue[0];
            // skip if the attribute is not part of version 2
            if (!(newAttr in fontInfoAttributesVersion2))
                continue;
            // catch values that can't be converted
            if(value === undefined)
                throw new UFOLibError('Cannot convert value ('
                        + value + ') for attribute ' + newAttr + '.');
            // store
            converted[newAttr] = newAttrValue[1];
        }
        return converted;
    }

    function convertFontInfoDataVersion2ToVersion1(data) {
        var converted = Object.create(null)
          , attr, value, newAttrValue, newAttr
          ;
        for(attr in data) {
            value = data[attr];
            newAttrValue = convertFontInfoValueForAttributeFromVersion2ToVersion1(attr, value);
            newAttr = newAttrValue[0];
            // only take attributes that are registered for version 1
            if(!(newAttr in fontInfoAttributesVersion1))
                continue;
            // catch values that can't be converted
            if(value === undefined)
                                throw new UFOLibError('Cannot convert value ('
                        + value + ') for attribute ' + newAttr + '.');
            // store
            converted[newAttr] = newAttrValue[1];
        }
        return converted;
    }

    // 2 <-> 3
    var _ufo2To3NonNegativeInt = setLike([
            'versionMinor',
            'openTypeHeadLowestRecPPEM',
            'openTypeOS2WinAscent',
            'openTypeOS2WinDescent'
        ])
      , _ufo2To3NonNegativeIntOrFloat = setLike([
            'unitsPerEm'
        ])
      , _ufo2To3FloatToInt = setLike([
            'openTypeHeadLowestRecPPEM',
            'openTypeHheaAscender',
            'openTypeHheaDescender',
            'openTypeHheaLineGap',
            'openTypeHheaCaretOffset',
            'openTypeOS2TypoAscender',
            'openTypeOS2TypoDescender',
            'openTypeOS2TypoLineGap',
            'openTypeOS2WinAscent',
            'openTypeOS2WinDescent',
            'openTypeOS2SubscriptXSize',
            'openTypeOS2SubscriptYSize',
            'openTypeOS2SubscriptXOffset',
            'openTypeOS2SubscriptYOffset',
            'openTypeOS2SuperscriptXSize',
            'openTypeOS2SuperscriptYSize',
            'openTypeOS2SuperscriptXOffset',
            'openTypeOS2SuperscriptYOffset',
            'openTypeOS2StrikeoutSize',
            'openTypeOS2StrikeoutPosition',
            'openTypeVheaVertTypoAscender',
            'openTypeVheaVertTypoDescender',
            'openTypeVheaVertTypoLineGap',
            'openTypeVheaCaretOffset'
        ])
      ;

    /**
     * This performs very basic validation of the value for attribute
     * following the UFO 2 fontinfo.plist specification. The results
     * of this should not be interpretted as *correct* for the font
     * that they are part of. This merely indicates that the value
     * is of the proper type and, where the specification defines
     * a set range of possible values for an attribute, that the
     * value is in the accepted range.
     */
    var validateFontInfoVersion2ValueForAttribute = _validateFontInfoAttribue.bind(
                                null, fontInfoAttributesVersion2ValueData);
    /**
     * This performs very basic validation of the value for infoData
     * following the UFO 2 fontinfo.plist specification. The results
     * of this should not be interpretted as *correct* for the font
     * that they are part of. This merely indicates that the values
     * are of the proper type and, where the specification defines
     * a set range of possible values for an attribute, that the
     * value is in the accepted range.
     */
    var validateInfoVersion2Data = _validateInfoData.bind(
                            null, validateFontInfoVersion2ValueForAttribute);

    /**
     * This performs very basic validation of the value for attribute
     * following the UFO 3 fontinfo.plist specification. The results
     * of this should not be interpretted as *correct* for the font
     * that they are part of. This merely indicates that the value
     * is of the proper type and, where the specification defines
     * a set range of possible values for an attribute, that the
     * value is in the accepted range.
     */
    var validateFontInfoVersion3ValueForAttribute = _validateFontInfoAttribue.bind(
                                null, fontInfoAttributesVersion3ValueData);

    /**
     * This performs very basic validation of the value for infoData
     * following the UFO 3 fontinfo.plist specification. The results
     * of this should not be interpretted as *correct* for the font
     * that they are part of. This merely indicates that the values
     * are of the proper type and, where the specification defines
     * a set range of possible values for an attribute, that the
     * value is in the accepted range.
     */
    var validateInfoVersion3Data = _validateInfoData.bind(
                            null, validateFontInfoVersion3ValueForAttribute);

    /**
     * Convert value from version 2 to version 3 format.
     * Returns the new attribute name and the converted value.
     * If the value is None, None will be returned for the new value.
     */
    function convertFontInfoValueForAttributeFromVersion2ToVersion3(attr, value) {
        var v = value;
        if(attr in _ufo2To3FloatToInt)
            v = Math.round(value);
        if(attr in _ufo2To3NonNegativeInt)
            v = Math.round(Math.abs(value));
        else if(attr in _ufo2To3NonNegativeIntOrFloat)
            v = Math.abs(value);
        return [attr, v];
    }


    /**
     * Convert value from version 3 to version 2 format.
     * Returns the new attribute name and the converted value.
     * If the value is None, None will be returned for the new value.
     */
    function convertFontInfoValueForAttributeFromVersion3ToVersion2(attr, value) {
        return [attr, value];
    }

    function convertFontInfoDataVersion3ToVersion2(data) {
        var converted = Object.create(null)
          , attr, value, newAttrValue, newAttr;
        for(attr in data) {
            value = data[attr];
            newAttrValue = convertFontInfoValueForAttributeFromVersion3ToVersion2(attr, value);
            newAttr = newAttrValue[0];
            if(!(newAttr in fontInfoAttributesVersion2))
                continue;
            converted[newAttr] = newAttrValue[1];
        }
        return converted;
    }

    function convertFontInfoDataVersion2ToVersion3(data) {
        var converted = Object.create(null)
          , attr, value, newAttrValue;
        for(attr in data) {
            value = data[attr];
            newAttrValue = convertFontInfoValueForAttributeFromVersion2ToVersion3(attr, value);
            converted[newAttrValue[0]] = newAttrValue[1];
        }
        return converted;
    }

    return {
        findKnownKerningGroups: findKnownKerningGroups
      , makeUniqueGroupName: makeUniqueGroupName
      , convertUFO1OrUFO2KerningToUFO3Kerning: convertUFO1OrUFO2KerningToUFO3Kerning
      , validateInfoVersion2Data: validateInfoVersion2Data
      , validateInfoVersion3Data: validateInfoVersion3Data
      , convertFontInfoDataVersion1ToVersion2: convertFontInfoDataVersion1ToVersion2
      , convertFontInfoDataVersion2ToVersion1: convertFontInfoDataVersion2ToVersion1
      , convertFontInfoDataVersion3ToVersion2: convertFontInfoDataVersion3ToVersion2
      , convertFontInfoDataVersion2ToVersion3: convertFontInfoDataVersion2ToVersion3
      , fontInfoAttributesVersion1: fontInfoAttributesVersion1
      , fontInfoAttributesVersion2: fontInfoAttributesVersion2
      , fontInfoAttributesVersion3: fontInfoAttributesVersion3
      , deprecatedFontInfoAttributesVersion2: deprecatedFontInfoAttributesVersion2
    };
});
