/**
 * Copyright (c) 2012, Lasse Fister lasse@graphicore.de, http://graphicore.de
 * 
 * You should have received a copy of the MIT License along with this program.
 * If not, see http://www.opensource.org/licenses/mit-license.php
 * 
 * This is a port of the validators defined in robofab/branches/ufo3k/Lib/ufoLib/validators.py
 * The svn revision of the source file was 563 from 2012-02-21 13:59:23 +0100
 * 
 */
 
define(
    [
        'ufojs',
        'ufojs/errors'
    ],
    function(
        main,
        errors
    )
{
    var enhance = main.enhance,
        isInstance = main.isInstance,
        isInt = main.isInt,
        range = main.range,
        isIntString = main.isIntString,
        isDigits = main.isDigits,
        fixedCharCodeAt = main.fixedCharCodeAt,
        assert = errors.assert,
        NotImplementedError = errors.NotImplemented,
        ValueError = errors.Value
        //we'll return module when all public functions are assigned to it
        module = {};
    
    // -------
    // Generic
    // -------

    /**
     * This looks very different in javascript than in python. I assume
     * in javascript a type of 'object' isDictEnough. This is implemented
     * for completeness
     * 
     * Some objects will likely come in that aren't
     * dicts but are dict-ish enough.
     */
    function isDictEnough(value) {
        return typeof value === 'object';
    }
    module.isDictEnough = isDictEnough;
    
    /**
     * Generic. (Added at version 2.)
     */
    //function genericTypeValidator(value, typ) {
    //    return isInstance(value, typ);
    //}
    //module.genericTypeValidator = genericTypeValidator;
    module.genericTypeValidator = isInstance;
    
    /**
     * Generic. (Added at version 2.)
     */
    function genericIntListValidator(values, validValues) {
        if(!(validValues instanceof Array))
            throw new TypeError('genericIntListValidator expects'+
                ' validValues to be an Array');
        if(!(values instanceof Array))
            return false;
        var validValuesDict = {}, i;
        
        for(i = 0; i<validValues.length; i++)
            // must not be int just number is enough because the values
            // will be checked for being int. However, it might be a reason
            // to throw a TypeError
            if(typeof validValues[i] === 'number')
                validValuesDict[validValues[i]] = true;
        
        for(i = 0; i<values.length; i++) {
            if(!isInt(values[i]))
                return false;
            if(!(values[i] in validValuesDict))
                return false;
        }
        return true
    }
    module.genericIntListValidator = genericIntListValidator;
    
    /**
     * Generic. (Added at version 3.)
     */
    function genericNonNegativeIntValidator(value){
        if(!isInt(value) || value < 0)
            return false;
        return true;
    }
    module.genericNonNegativeIntValidator = genericNonNegativeIntValidator;
    
    /**
     * Generic. (Added at version 3.)
     */
    function genericNonNegativeNumberValidator(value) {
        if( typeof value !== 'number' || value < 0)
            return false;
        return true;
    }
    module.genericNonNegativeNumberValidator = genericNonNegativeNumberValidator;
    
    /**
     * Generic. (Added at version 3.)
     */
    function genericDictValidator(value, prototype) {
        var key, val, prototypeType, required;
        
        if(typeof prototype !== 'object')
            throw new TypeError('genericDictValidator expects  prototype'+
                ' to be type of object');
        
        // not a dict
        if(typeof value !== 'object')
            return false;
        
        // missing required keys
        for(key in prototype) {
            // prototype[key][0] is prototypeType
            // prototype[key][1] is required
            if(!prototype[key][1])
                continue;
            if(!(key in value))
                return false;
        }
        
        // unknown keys
        for(key in value)
            if( !(key in prototype) )
                return false;
        
        // incorrect types
        for(key in value) {
            val = value[key];
            prototypeType = prototype[key][0];
            required = prototype[key][1];
            // don't know if I like this continue here. the key is there
            // so the type must be correct. not?
            if( (val === undefined || val === null) && !required)
                continue;
            if(!isInstance(val, prototypeType))
                return false;
        }
        return true;
    }
    module.genericDictValidator = genericDictValidator
    
    
    // --------------
    // fontinfo.plist
    // --------------

    // Data Validators
    
    /**
     * Version 2+.
     */
    function fontInfoStyleMapStyleNameValidator(value) {
        var options = {
                "regular": true,
                "italic": true,
                "bold": true,
                "bold italic": true
            };
        return value in options;
    }
    module.fontInfoStyleMapStyleNameValidator = fontInfoStyleMapStyleNameValidator;
    
    /**
     * Version 3+.
     */
    function fontInfoOpenTypeGaspRangeRecordsValidator(value) {
        if(!(value instanceof Array))
            return false
        if(value.length === 0)
            return true
        var validBehaviors = [0, 1, 2, 3],
            dictPrototype = {
                rangeMaxPPEM:['int', true],
                rangeGaspBehavior: [Array, true]
            },
            ppemOrder = [], ppemOrderSorted, ppem, behavior, ppemValidity,
            behaviorValidity, rangeRecord, k, i;
        for(k in value) {
            rangeRecord = value[k];
            if(!genericDictValidator(rangeRecord, dictPrototype))
                return false;
            ppem = rangeRecord.rangeMaxPPEM;
            behavior = rangeRecord.rangeGaspBehavior;
            ppemValidity = genericNonNegativeIntValidator(ppem);
            if(!ppemValidity)
                return false;
            behaviorValidity = genericIntListValidator(
                behavior,
                validBehaviors
            );
            if(!behaviorValidity)
                return false;
            ppemOrder.push(ppem);
        }
        ppemOrderSorted = [].slice.call(ppemOrder).sort();
        for(var i = 0; i<ppemOrder.length; i++)
            if(ppemOrder[i] !== ppemOrderSorted[i])
                return false;
        return true;
    }
    module.fontInfoOpenTypeGaspRangeRecordsValidator = fontInfoOpenTypeGaspRangeRecordsValidator;
    
    /**
     * Version 2+.
     */
    function fontInfoOpenTypeHeadCreatedValidator(value) {
        // format: 0000/00/00 00:00:00
        
        var dateTime, date, time, year, month, day, hour, minute, second;
        
        if(typeof value !== 'string') return false;
        
        //basic formatting
        if(value.length !== 19) return false;
        
        dateTime = value.split(" ");
        if(dateTime.length !== 2) return false;
        
        date = dateTime[0].split('/');
        if(date.length !== 3) return false;
        
        time = dateTime[1].split(':');
        if(time.length !== 3) return false;
            
        // date
        year = date[0];
        month = date[1];
        day = date[2];
        
        if(year.length != 4) return false;
            
        if(month.length != 2) return false;
            
        if(day.length != 2) return false;
        
        if(!isIntString(year))return false;
        year = parseInt(year, 10);
        if(isNaN(year)) return false;
        
        if(!isIntString(month))return false;
        month = parseInt(month, 10);
        if(isNaN(month)) return false;
        
        if(!isIntString(day))return false;
        day = parseInt(day, 10);
        if(isNaN(day)) return false;
        
        if(month < 1 || month > 12) return false;
        
        var monthMaxDay = new Date(year, month, 0).getDate();
        if(day < 1 || day > monthMaxDay) return false;
        
        //time
        hour = time[0];
        minute = time[1];
        second = time[2];
        
        if (hour.length != 2) return false;
        
        if (minute.length != 2) return false;
        // this will never happen as everything else is in place and has
        // the right length
        if (second.length != 2) return false;
        
        if(!isIntString(hour))return false;
        hour = parseInt(hour, 10);
        if(isNaN(hour)) return false;
        
        if(!isIntString(minute))return false;
        minute = parseInt(minute, 10);
        if(isNaN(minute)) return false;
        
        if(!isIntString(second))return false;
        second = parseInt(second, 10);
        if(isNaN(second)) return false;
        
        if(hour < 0 || hour > 23) return false;
        
        if(minute < 0 || minute > 59) return false;
        
        if(second < 0 || second > 59) return false;
        
        // fallback
        return true
    }
    module.fontInfoOpenTypeHeadCreatedValidator = fontInfoOpenTypeHeadCreatedValidator;
    
    /**
     * Version 3+.
     */
    function fontInfoOpenTypeNameRecordsValidator(value) {
        if(!(value instanceof Array))
            return false;
        var dictPrototype = {
            nameID: ['int', true],
            platformID: ['int', true],
            encodingID: ['int', true],
            languageID: ['int', true],
            string: ['string', true]
        };
        for(var i=0; i<value.length; i++)
            if(!genericDictValidator(value[i], dictPrototype))
                return false;
        return true;
    }
    module.fontInfoOpenTypeNameRecordsValidator = fontInfoOpenTypeNameRecordsValidator;
    
    /**
     * Version 2+.
     */
    function fontInfoOpenTypeOS2WeightClassValidator(value) {
        if(!isInt(value)) return false;
        if(value < 0) return false;
        return true;
    }
    module.fontInfoOpenTypeOS2WeightClassValidator = fontInfoOpenTypeOS2WeightClassValidator;
    
    /**
     * Version 2+.
     */
    function fontInfoOpenTypeOS2WidthClassValidator(value) {
        if(!isInt(value))
            return false;
        if(value < 1)
            return false;
        if(value > 9)
            return false
        return true;
    }
    module.fontInfoOpenTypeOS2WidthClassValidator = fontInfoOpenTypeOS2WidthClassValidator;
    
    /**
     * Version 2.
     */
    function fontInfoVersion2OpenTypeOS2PanoseValidator(values) {
        if(!(values instanceof Array))
            return false;
        if(values.length != 10)
            return false;
        for(var i=0; i<values.length; i++)
            if(!isInt(value[i]))
                return false;
        // XXX further validation?
        return true;
    }
    module.fontInfoVersion2OpenTypeOS2PanoseValidator = fontInfoVersion2OpenTypeOS2PanoseValidator;
    
    /**
     * Version 3+.
     */
    function fontInfoVersion3OpenTypeOS2PanoseValidator(values) {
        if(!(values instanceof Array))
            return false;
        
        if(values.length != 10)
            return false;
        
        for(var i=0; i<values.length; i++) {
            if(!isInt(value[i]))
                return false;
        
            if(value[i] < 0)
                return false;
        }
        // XXX further validation?
        return true;
    }
    module.fontInfoVersion3OpenTypeOS2PanoseValidator = fontInfoVersion3OpenTypeOS2PanoseValidator;
    
    /**
     * Version 2+.
     */
    function fontInfoOpenTypeOS2FamilyClassValidator(values) {
        if(!(values instanceof Array))
            return false;
        
        if (values.length !== 2)
            return false;
        
        for(var i=0; i<values.length; i++)
            if(isInt(values[i]))
                return false
        
        var classID = values[0],
            subclassID = values[1];
        
        if(classID < 0 || classID > 14)
            return false;
        
        if(subclassID < 0 || subclassID > 15)
            return false
        
        return true;
    }
    module.fontInfoOpenTypeOS2FamilyClassValidator = fontInfoOpenTypeOS2FamilyClassValidator;
    
    /**
     * Version 2+.
     */
    function fontInfoPostscriptBluesValidator(values) {
        if(!values instanceof Array)
            return false;
        if(values.length > 14)
            return false;
        if(values.length % 2)
            return false;
        for(var i=0; i<values.length; i++)
            if(typeof value[i] !== 'number')
                return false;
        return true;
    }
    module.fontInfoPostscriptBluesValidator = fontInfoPostscriptBluesValidator;
    
    /**
     * Version 2+.
     */
    function fontInfoPostscriptOtherBluesValidator(values){
        if(!(values instanceof Array))
            return false;
        if(values.length > 10)
            return false;
        if(values.length % 2)
            return false;
        for(var i=0; i<values.length; i++)
            if(typeof values[i] !== 'number')
                return false;
        return true;
    }
    module.fontInfoPostscriptOtherBluesValidator = fontInfoPostscriptOtherBluesValidator;
    
    /**
     * Version 2+.
     */
    function fontInfoPostscriptStemsValidator(values) {
        if(!(values instanceof Array))
            return false;
        if(values.length > 12)
            return false;
        for(var i=0; i<values.length; i++)
            if(typeof values[i] !== 'number')
                return false;
        return true;
    }
    module.fontInfoPostscriptStemsValidator = module.fontInfoPostscriptStemsValidator
    
    /**
     * Version 2+.
     */
    function fontInfoPostscriptWindowsCharacterSetValidator(value) {
        var validValues = range(1, 21);
        if(!(value in validValues))
            return false;
        return true;
    }
    module.fontInfoPostscriptWindowsCharacterSetValidator = fontInfoPostscriptWindowsCharacterSetValidator;
    
    /**
     * Version 3+.
     */
    function fontInfoWOFFMetadataUniqueIDValidator(value) {
        var dictPrototype = {id: ['string', true]};
        if(!genericDictValidator(value, dictPrototype))
            return false;
        return true;
    }
    module.fontInfoWOFFMetadataUniqueIDValidator = fontInfoWOFFMetadataUniqueIDValidator;
    
    /**
     * Version 3+.
     */
    function fontInfoWOFFMetadataVendorValidator(value) {
        var dictPrototype = {
            'name' : ['string', true],
            'url' : ['string', false],
            'dir' : ['string', false],
            'class' : ['string', false]
        };
        if(!genericDictValidator(value, dictPrototype))
            return false;
        if('dir' in value && !(value['dir'] in {'ltr': true, 'rtl' : true}))
            return false;
        return true;
    }
    module.fontInfoWOFFMetadataVendorValidator = fontInfoWOFFMetadataVendorValidator;
    
    /**
     * Version 3+.
     */
    function fontInfoWOFFMetadataCreditsValidator(value) {
        var dictPrototype = {credits: [Array, true]},
            i, credit;
        if(!genericDictValidator(value, dictPrototype))
            return false;
        if(!value["credits"].length)
            return false;
        dictPrototype = {
            "name" : ['string', true],
            "url" : ['string', false],
            "role" : ['string', false],
            "dir" : ['string', false],
            "class" : ['string', false]
        };
        for(i=0; i<value["credits"].length; i++) {
            credit = value["credits"][i];
            if(!genericDictValidator(credit, dictPrototype))
                return false;
            if('dir' in credit && !(credit['dir'] in {'ltr': true, 'rtl' : true}))
                return false;
        }
        return true;
    }
    module.fontInfoWOFFMetadataCreditsValidator = fontInfoWOFFMetadataCreditsValidator;
    
    /**
     * Version 3+.
     */
    function fontInfoWOFFMetadataDescriptionValidator(value) {
        var dictPrototype = {
            url: ['string', false],
            textL: [Array, true]
        };
        if(!genericDictValidator(value, dictPrototype))
            return false;
        for(var i=0; i<value["text"].length; i++)
            if(!fontInfoWOFFMetadataTextValue(text))
                return false;
        return true;
    }
    module.fontInfoWOFFMetadataDescriptionValidator = fontInfoWOFFMetadataDescriptionValidator;
    
    /**
     * Version 3+.
     */
    function fontInfoWOFFMetadataLicenseValidator(value) {
        var dictPrototype = {
            url: ['string', false],
            text: [Array, false],
            id: ['string', false]
        };
        if(!genericDictValidator(value, dictPrototype))
            return false;
        if('text' in value)
            for(var i=0; i<value['text'].length; i++)
                if(!fontInfoWOFFMetadataTextValue(value['text'][i]))
                    return false;
        return true;
    }
    module.fontInfoWOFFMetadataLicenseValidator = fontInfoWOFFMetadataLicenseValidator;
    
    /**
     * Version 3+.
     */
    function fontInfoWOFFMetadataTrademarkValidator(value) {
        var dictPrototype = {text: [Array, true]};
        if(!genericDictValidator(value, dictPrototype))
            return false;
        for(var i=0; i<value['text'].length; i++)
            if(!fontInfoWOFFMetadataTextValue(value['text'][i]))
                return false;
        return true;
    }
    module.fontInfoWOFFMetadataTrademarkValidator = fontInfoWOFFMetadataTrademarkValidator;
    
    /**
     * Version 3+.
     */
    function fontInfoWOFFMetadataCopyrightValidator(value) {
        var dictPrototype = {text: [Array, true]};
        if(!genericDictValidator(value, dictPrototype))
            return false;
        for(var i=0; i< value.text.length; i++)
            if(!fontInfoWOFFMetadataTextValue(value.text[i]))
                return false;
        return true;
    }
    module.fontInfoWOFFMetadataCopyrightValidator = fontInfoWOFFMetadataCopyrightValidator;
    
    /**
     * Version 3+.
     */
    function fontInfoWOFFMetadataLicenseeValidator(value){
        var dictPrototype = {
            "name" : ['string', true],
            "dir" : ['string', false],
            "class" : ['string', false]
        };
        if(!genericDictValidator(value, dictPrototype))
            return false;
        if('dir' in value && !(value.dir in {'ltr': true, 'rtl': true}))
            return false;
        return true;
    }
    module.fontInfoWOFFMetadataLicenseeValidator = fontInfoWOFFMetadataLicenseeValidator;
    
    /**
     * Version 3+.
     */
    function fontInfoWOFFMetadataTextValue(value){
        var dictPrototype = {
            "text" : ['string', true],
            "language" : ['string', false],
            "dir" : ['string', false],
            "class" : ['string', false]
        };
        if(!genericDictValidator(value, dictPrototype))
            return false;
        if('dir' in value && !(value.dir in {'ltr': true, 'rtl': true}))
            return false;
        return true;
    }
    module.fontInfoWOFFMetadataTextValue = fontInfoWOFFMetadataTextValue;
    
    /**
     * Version 3+.
     */
    function fontInfoWOFFMetadataExtensionsValidator(value) {
        if(!(value instanceof Array))
            return false;
        if(!value.length)
            return false;
        for(var i=0; i<value.length; i++)
            if(!fontInfoWOFFMetadataExtensionValidator(value[i]))
                return false;
        return true;
    }
    module.fontInfoWOFFMetadataExtensionsValidator = fontInfoWOFFMetadataExtensionsValidator;
    
    /**
     * Version 3+.
     */
    function fontInfoWOFFMetadataExtensionValidator(value) {
        var dictPrototype = {
            names: [Array, false],
            items: [Array, true],
            id: ['string', false]
        }
        if(!genericDictValidator(value, dictPrototype))
            return false;
        if('names' in value)
            for(var i=0; i<value.names.length; i++)
                if(!fontInfoWOFFMetadataExtensionNameValidator(value.names[i]))
                    return false;
        for(var i=0; i<value.items.length; i++)
            if(!fontInfoWOFFMetadataExtensionItemValidator(value.items[i]))
                return false;
        return true;
    }
    module.fontInfoWOFFMetadataExtensionValidator = fontInfoWOFFMetadataExtensionValidator;
    
    /**
     * Version 3+.
     */
    function fontInfoWOFFMetadataExtensionItemValidator(value) {
        var dictPrototype = {
            id: ['string', false],
            names: [Array, true],
            values: [Array, true]
        };
        if(!genericDictValidator(value, dictPrototype))
            return false;
        for(var i=0; i<value.names.length; i++)
            if(!fontInfoWOFFMetadataExtensionNameValidator(value.names[i]))
                return false;
        for(var i=0; i<values.values.length; i++)
            if(!fontInfoWOFFMetadataExtensionValueValidator(value.values[i]))
                return false;
        return true;
    }
    module.fontInfoWOFFMetadataExtensionItemValidator = fontInfoWOFFMetadataExtensionItemValidator;
    
    /**
     * Version 3+.
     */
    function fontInfoWOFFMetadataExtensionNameValidator(value) {
        var dictPrototype = {
            text: ['string', true],
            language: ['string', false],
            dir: ['string', false],
            class: ['string', false]
        };
        if(!genericDictValidator(value, dictPrototype))
            return false;
        return true;
    }
    module.fontInfoWOFFMetadataExtensionNameValidator = fontInfoWOFFMetadataExtensionNameValidator;
    
    /**
     * Version 3+.
     */
    function fontInfoWOFFMetadataExtensionValueValidator(value) {
        var dictPrototype = {
            text: ['string', true],
            language: ['string', false],
            dir: ['string', false],
            class: ['string', false]
        };
        if(!genericDictValidator(value, dictPrototype))
            return false;
        return true;
    }
    module.fontInfoWOFFMetadataExtensionValueValidator = fontInfoWOFFMetadataExtensionValueValidator;
    
    
    // ----------
    // Guidelines
    // ----------
    
    /**
     * Version 3+.
     */
    function guidelinesValidator(value, identifiers/* default = object */) {
        if(!(value instanceof Array))
            return false;
        if(identifiers === undefined)
            identifiers = {};
        for(var i=0; i<value.length; i++) {
            var guide = value[i];
            if(!guidelineValidator(guide))
                return false;
            var identifier = guide.identifier;
            if(identifier !== undefined) {
                if(identifier in identifiers)
                    return false;
                identifiers[identifier] = true;
            }
        }
        return True
    }
    module.guidelinesValidator = guidelinesValidator;
    
    /**
     * Version 3+.
     */
    function guidelineValidator(value) {
        var dictPrototype = {
            x: ['number', false],
            y: ['number', false],
            angle: ['number', false],
            name: ['string', false],
            color: ['string', false],
            identifier: ['string', false]
        }, x, y, angle, identifier, color;
        if(!genericDictValidator(value, dictPrototype))
            return false;
        x = value.x;
        y = value.y;
        angle = value.angle;
        // x or y must be present
        if(x === undefined && y === undefined)
            return false;
        // if x or y are None, angle must not be present
        if((x === undefined || y === undefined) && angle !== undefined)
            return false;
        // if x and y are defined, angle must be defined
        if(x !== undefined && y !== undefined && angle === undefined)
            return false;
        // angle must be between 0 and 360
        if(angle !== undefined && (angle < 0 || angle > 360))
                return false;
        // identifier must be 1 or more characters
        identifier = value.identifier;
        if(identifier !== undefined && !identifierValidator(identifier))
            return false;
        // color must follow the proper format
        color = value.color;
        if(color !== undefined && !colorValidator(color))
            return false;
        return true;
    }
    module.guidelineValidator = guidelineValidator;
    
    
    // -------
    // Anchors
    // -------
    
    /**
     * Version 3+.
     */
    function anchorsValidator(value, identifiers/* default: object */) {
        if(!(value instanceof Array))
            return false;
        if(identifiers === undefined)
            identifiers = {}, identifier;
        var anchor;
        for(var i=0; i<value.length; i++) {
            anchor = value[i];
            if(!anchorValidator(anchor))
                return false;
            identifier = anchor.identifier;
            if(identifier !== undefined){
                if(identifier in identifiers)
                    return false
                identifiers[identifier] = true;
            }
        }
        return true;
    }
    module.anchorsValidator = anchorsValidator;
    
    
    /**
     * Version 3+.
     */
    function anchorValidator(value){
        var dictPrototype = {
            x: ['number', false],
            y: ['number', false],
            name: ['string', false],
            color: ['string', false],
            identifier: ['string', false]
        }, x, y, identifier, color;
        if(!genericDictValidator(value, dictPrototype))
            return false;
        x = value.x;
        y = value.y;
        // x and y must be pesent
        // Lasse: could't that be validated with making them required for
        // genericDictValidator?
        if(x === undefined || y === undefined)
            return false;
        // identifier must be 1 or more characters
        identifier = value.identifier;
        if(identifier !== undefined && !identifierValidator(identifier))
            return false;
        // color must follow the proper format
        color = value.get("color");
        if(color !== undefined && !colorValidator(color))
            return false;
        return true;
    }
    module.anchorValidator = anchorValidator;
    
    
    // ----------
    // Identifier
    // ----------
    
    /**
     * Version 3+.
     * 
     * Python doctest
     * >>> identifierValidator("a")
     * True
     * >>> identifierValidator("")
     * False
     * >>> identifierValidator("a" * 101)
     * False
     */
    function identifierValidator(value) {
        var validCharactersMin = 0x20,
         validCharactersMax = 0x7E,
         c;
        if (typeof value !== 'string')
            return false;
        if(value.length === 0 || value.length > 100)
            return false;
        for(var i=0; i<value.length; i++) {
            c = fixedCharCodeAt(value, i);
            if(c === false)
                //was handled in the iteration before
                continue;
            if(c < validCharactersMin || c > validCharactersMax)
                return false;
        }
        return true;
    }
    module.identifierValidator = identifierValidator;
    
    
    // -----
    // Color
    // -----
    
    /**
     * Version 3+.
     *
     *  Python doctest
     *  >>> colorValidator("0,0,0,0")
     *  True
     *  >>> colorValidator(".5,.5,.5,.5")
     *  True
     *  >>> colorValidator("0.5,0.5,0.5,0.5")
     *  True
     *  >>> colorValidator("1,1,1,1")
     *  True
     *
     *  >>> colorValidator("2,0,0,0")
     *  False
     *  >>> colorValidator("0,2,0,0")
     *  False
     *  >>> colorValidator("0,0,2,0")
     *  False
     *  >>> colorValidator("0,0,0,2")
     *  False
     *
     *  >>> colorValidator("1r,1,1,1")
     *  False
     *  >>> colorValidator("1,1g,1,1")
     *  False
     *  >>> colorValidator("1,1,1b,1")
     *  False
     *  >>> colorValidator("1,1,1,1a")
     *  False
     *
     *  >>> colorValidator("1 1 1 1")
     *  False
     *  >>> colorValidator("1 1,1,1")
     *  False
     *  >>> colorValidator("1,1 1,1")
     *  False
     *  >>> colorValidator("1,1,1 1")
     *  False
     *
     *  >>> colorValidator("1, 1, 1, 1")
     *  True
     */
    function colorValidator(value) {
        if(typeof value !== 'string')
            return false;
        var parts = value.split(","),
            // this will allow things like
            // '1' '.1' '.' '31.5' '0.' '2323' '123.' '14' '12.1234' '12.1234'
            numberFormat = /^[0-9]*[.]?[0-9]*$/,
            i, part, number;
        if(parts.length != 4)
            return false;
        for(i=0; i<parts.length; i++) {
            part = parts[i].trim();
            if(!numberFormat.test(part))
                return false;
            if (  isNaN(number = parseFloat(part))
               && isNaN(number = parseInt(part, 10)))
                return false;
            else if (number < 0)
                return false;
            else if( number > 1 )
                return false;
        }
        return true;
    }
    module.colorValidator = colorValidator;
    
    
    // -----
    // image
    // -----
    
    /**
     * Version 3+.
     */
    function imageValidator(value) {
        var dictPrototype = {
            fileName: ['string', true],
            xScale: ['number', false],
            xyScale: ['number', false],
            yxScale: ['number', false],
            yScale: ['number', false],
            xOffset: ['number', false],
            yOffset: ['number', false],
            color: ['string', false]
        };
        if(!genericDictValidator(value, dictPrototype))
            return false;
        // fileName must be one or more characters
        if(!value.fileName.length)
            return false;
        // color must follow the proper format
        color = value.color;
        if(color !== undefined && !colorValidator(color))
            return false;
        return true
    }
    module.imageValidator = imageValidator;
    
    /**
     * Version 3+.
     *
     * This checks the signature of the image data.
     * 
     * I'll not implement this unless I'm implementing where this thing is
     * used. Filesystem functionality for browser or in asynchronous nodeJS
     * is too different from this code to make a good decision here and now.
     * 
     * will I need a fileObj-like thing, too?
     */
    function pngValidator(path/*=None*/, data/*=None*/, fileObj/*=None*/) {
        throw new NotImplementedError('can\'t decide yet how to do filesystem'
            + ' stuff here.');
    // Python source:
    //    assert path is not None or data is not None or fileObj is not None
    //    if path is not None:
    //        f = open(path, "rb")
    //        signature = f.read(8)
    //        f.close()
    //    elif data is not None:
    //        signature = data[:8]
    //    elif fileObj is not None:
    //        pos = fileObj.tell()
    //        signature = fileObj.read(8)
    //        fileObj.seek(pos)
    //    if signature != "\x89PNG\r\n\x1a\n":
    //        return False, "Image does not begin with the PNG signature."
    //    return True, None
    }
    
    // -------------------
    // layercontents.plist
    // -------------------
    
    /**
     * Check the validity of layercontents.plist.
     * Version 3+.
     */
    function layerContentsValidator(value, ufoPath) {
        var bogusFileMessage = 'layercontents.plist in not in the correct'
            + ' format.',
            // did we find the default layer (where directoryName === 'glyphs')
            foundDefault = false,
            usedLayerNames, usedDirectories, entry, i, j, layerName,
            directoryName, p;
        // file isn't in the right format
        if(!(value instanceof Array))
            return [false, bogusFileMessage];
        // work through each entry
        usedLayerNames = {};
        usedDirectories = {};
        for(i=0; i<value.length; i++){
            entry = value[i];
            // layer entry in the incorrect format
            if(!(entry instanceof Array))
                return [false, bogusFileMessage];
            if(entry.length !== 2)
                return [false, bogusFileMessage];
            for(j=0; j<entry.length; j++)
                if(typeof entry[j] !== 'string')
                    return [false, bogusFileMessage];
            layerName = entry[0];
            directoryName = entry[1];
            // check directory naming
            if(directoryName !== 'glyphs') {
                if(directoryName.indexOf('glyphs.') !== 0)
                    return [false, [ 'Invalid directory name (', directoryName,
                        ') in layercontents.plist.'].join('')];
            } else
                //we found the default layer
                foundDefault = true;
            if(layerName.length === 0)
                return [false, 'Empty layer name in layercontents.plist.'];
            // directory doesn't exist
            // Lasse: the separator of pathes in ufoJS might always be /
            // p = os.path.join(ufoPath, directoryName);
            // then: 
            p = [ufoPath, directoryName].join('/');
            throw new NotImplementedError('There\'s nothing like pythons'
                +' os.path.exists here, yet');
            if(!os.path.exists(p))
                return [false, 'A glyphset does not exist at '
                    + directoryName];
            //empty name
            if(layerName.length === 0)
                return [false, 'A layer has an empty name.'];
            // default layer name
            if(layerName === 'public.default' && directoryName !== 'glyphs')
                return [false, 'The name public.default is being used by'
                    +' a layer that is not the default.'];
            // check usage
            if(layerName in usedLayerNames)
                return [false, ['The layer name ', layerName,
                        ' is used by more than one layer.'].join('')];
            usedLayerNames[layerName] = true;
            if(directoryName in usedDirectories)
                return [false, [ 'The directory ', directoryName,
                        ' is used by more than one layer.'].join('')];
            usedDirectories[directoryName] = true;
        }
        // did we find the default layer (where directoryName === 'glyphs')
        if(!foundDefault)
            // missing default layer
            return [false, 'The required default glyph set is not in the UFO.'];
        return [true, undefined];
    }
    module.layerContentsValidator = layerContentsValidator;
    
    
    // ------------
    // groups.plist
    // ------------
    
    /**
     * Check the validity of the groups.
     * Version 3+ (though it's backwards compatible with UFO 1 and UFO 2).
     * 
     * Python doctest
     * >>> groups = {"A" : ["A", "A"], "A2" : ["A"]}
     * >>> groupsValidator(groups)
     * (True, None)
     *
     * >>> groups = {"" : ["A"]}
     * >>> groupsValidator(groups)
     * (False, 'A group has an empty name.')
     *
     * >>> groups = {"public.awesome" : ["A"]}
     * >>> groupsValidator(groups)
     * (True, None)
     *
     * >>> groups = {"public.kern1." : ["A"]}
     * >>> groupsValidator(groups)
     * (False, 'The group data contains a kerning group with an incomplete name.')
     * >>> groups = {"public.kern2." : ["A"]}
     * >>> groupsValidator(groups)
     * (False, 'The group data contains a kerning group with an incomplete name.')
     *
     * >>> groups = {"public.kern1.A" : ["A"], "public.kern2.A" : ["A"]}
     * >>> groupsValidator(groups)
     * (True, None)
     *
     * >>> groups = {"public.kern1.A1" : ["A"], "public.kern1.A2" : ["A"]}
     * >>> groupsValidator(groups)
     * (False, 'The glyph "A" occurs in too many kerning groups.')
     */
    function groupsValidator(value) {
        var bogusFormatMessage = 'The group data is not in the correct format.',
            firstSideMapping, secondSideMapping, groupName, glyphList, d,
            i, glyphName;
        
        if(typeof value !== 'object')
            return [false, bogusFormatMessage];
        firstSideMapping = {};
        secondSideMapping = {};
        for(groupName in value){
            glyphList = value[groupName];
            if(typeof groupName !== 'string')
                return [false, bogusFormatMessage];
            if(!(glyphList instanceof Array))
                return [false, bogusFormatMessage];
            if(groupName.length === 0)
                return [false, 'A group has an empty name.'];
            if(groupName.indexOf('public.') === 0) {
                if(groupName.indexOf('public.kern1.') !== 0
                    && groupName.indexOf('public.kern2.') !== 0)
                    // unknown pubic.* name. silently skip.
                    continue;
                else if('public.kernN.'.length === groupName.length)
                    return [false, 'The group data contains a kerning '
                        +'group with an incomplete name.'];
                
                d = (groupName.indexOf('public.kern1.') === 0)
                    ? firstSideMapping : secondSideMapping;
                for(i=0; i<glyphList.length; i++) {
                    glyphName = glyphList[i];
                    if(typeof glyphName !== 'string')
                        return [false, ['The group data ', groupName,
                            'contains an invalid member.'].join('')];
                    if(glyphName in d)
                        return [false, ['The glyph "', glyphName,
                            '" occurs in too many kerning groups.'].join('')];
                    d[glyphName] = groupName;
                }
            }
        }
        return [true, undefined];
    }
    module.groupsValidator = groupsValidator;
    
    
    // -------------
    // kerning.plist
    // -------------
    
    /**
     * join a and b to astring that is unique for the combination of
     * a and b
     */
    var _kerningNamesHash_escapeEscape = /\\/g,
        _kerningNamesHash_escapeKomma = /,/g;
    function _kerningNamesHash_escaper(str) {
        return str.replace(
                _kerningNamesHash_escapeEscape, '\\\\'
            ).replace(
                _kerningNamesHash_escapeKomma, '\\,'
            );
    }
    function _kerningNamesHash(a, b) {
        if(typeof a !== 'string' || typeof b !== 'string')
            throw new ValueError('Both arguments of _kerningNamesHash'
                +' must be string');
        return([a, b].map(_kerningNamesHash_escaper).join(','));
    }
    
    /**
     * This validates a passed kerning dictionary
     * using the provided groups. The validation
     * checks to make sure that there are no conflicting
     * glyph + group and group + glyph exceptions.
     * 
     * problem:
     * in python the kern dict contains keys as tuples like: kerning[left, right]
     * where left and right are group names
     * so
     * kerning= {
     *  (left, right): data,
     *  (left2, right2): data2
     * }
     * 
     * I assume for javascript that a list like the following will work out:
     * kerning = [
     *  [[left, right], data],
     *  [[left2, right2], data2]
     * ]
     * I use a helper to make a lookup object :(  _kerningNamesHash
     * 
     * Python doctest
     * >>> groups = {
     * ...     "public.kern1.O" : ["O", "D", "Q"],
     * ...     "public.kern2.E" : ["E", "F"]
     * ... }
     * >>> kerning = {
     * ...     ("public.kern1.O", "public.kern2.E") : -100,
     * ...     ("public.kern1.O", "F") : -200,
     * ...     ("D", "F") : -300,
     * ... }
     * >>> kerningValidator(kerning, groups)
     * True
     * >>> kerning = {
     * ...     ("public.kern1.O", "public.kern2.E") : -100,
     * ...     ("public.kern1.O", "F") : -200,
     * ...     ("Q", "public.kern2.E") : -250,
     * ...     ("D", "F") : -300,
     * ... }
     * >>> kerningValidator(kerning, groups)
     * False
     */
    function kerningValidator(kerning, groups) {
        // flatten the groups
        var flatFirstGroups = {},
            flatSecondGroups = {},
            groupName, glyphList, d, i, glyphName, first, second,
            firstIsGroup, secondIsGroup, firstOptions, firstGroup, glyph,
            j, secondOptions, firstGroup, kerningLookup = {}, hash;
        
        //make a lookup to check fast if the groups exist alredy
        for(i=0; i<kerning.length; i++) {
            first = kerning[i][0][0];
            second = kerning[i][0][1];
            kerningLookup[_kerningNamesHash(first, second)] = true;
        }
        for(groupName in groups) {
            glyphList = groups[groupName];
            if(groupName.indexOf('public.kern1.') !== 0
                && groupName.indexOf('public.kern2.') !== 0)
                continue;
            if(groupName.indexOf('public.kern1.') === 0)
                d = flatFirstGroups;
            else if(groupName.indexOf('public.kern2.') === 0)
                d = flatSecondGroups;
            for(i=0; i<glyphList.length; i++){
                glyphName = glyphList[i];
                d[glyphName] = groupName;
            }
        }
        // search for conflicts
        for(i=0; i<kerning.length; i++) {
            first = kerning[i][0][0];
            second = kerning[i][0][1];
            firstIsGroup = first.indexOf('public.kern1.') === 0;
            secondIsGroup = second.indexOf('public.kern2.') === 0;
            // skip anything other than glyph + group and group + glyph
            if(firstIsGroup && secondIsGroup)
                continue;
            if (!firstIsGroup && !secondIsGroup)
                continue;
            // if the first is a glyph and it isn't in a group, skip
            if(!firstIsGroup && !(first in flatFirstGroups))
                continue;
            // if the second is a glyph and it isn't in a group, skip
            if (!secondIsGroup && !(second in flatSecondGroups))
                    continue;
            // skip unknown things
            if(firstIsGroup && !(first in groups))
                continue;
            if(firstIsGroup && !(second in flatSecondGroups))
                continue;
            if(secondIsGroup && !(second in groups))
                continue;
            if(secondIsGroup && !(first in flatFirstGroups))
                continue;
            // validate group + glyph
            if(firstIsGroup) {
                firstOptions = groups[first];
                secondGroup = flatSecondGroups[second];
                for(j=0; j<firstOptions.length; j++) {
                    glyph = firstOptions[j];
                    hash = _kerningNamesHash(glyph, secondGroup);
                    if(hash in kerningLookup)
                        return false;
                }
            }
            // validate glyph + group
            if(secondIsGroup) {
                secondOptions = groups[second];
                firstGroup = flatFirstGroups[first];
                for(j=0; j<secondOptions.length; j++) {
                    glyph = secondOptions[j];
                    hash = _kerningNamesHash(firstGroup, glyph);
                    if(hash in kerningLookup)
                        return false;
                }
            }
        }
        // fallback
        return true;
    }
    module.kerningValidator = kerningValidator;
    
    // -------------
    // lib.plist/lib
    // -------------
    
    /**
     * Check the validity of the lib.
     * Version 3+ (though it's backwards compatible with UFO 1 and UFO 2).
     *
     * Python doctest
     * >>> lib = {"foo" : "bar"}
     * >>> fontLibValidator(lib)
     * (True, None)
     *
     * >>> lib = {"public.awesome" : "hello"}
     * >>> fontLibValidator(lib)
     * (True, None)
     *
     * >>> lib = {"public.glyphOrder" : ["A", "C", "B"]}
     * >>> fontLibValidator(lib)
     * (True, None)
     *
     * >>> lib = {"public.glyphOrder" : "hello"}
     * >>> fontLibValidator(lib)
     * (False, 'public.glyphOrder is not properly formatted.')
     *
     * >>> lib = {"public.glyphOrder" : ["A", 1, "B"]}
     * >>> fontLibValidator(lib)
     * (False, 'public.glyphOrder is not properly formatted.')
     */
    function fontLibValidator(value){
        var bogusFormatMessage = 'The lib data is not in the correct format.',
            bogusGlyphOrderMessage = 'public.glyphOrder is not properly formatted.',
            key, val, i, glyphName;
        if(typeof value !== 'object')
            return [false, bogusFormatMessage];
        for(key in value) {
            val = value[key];
            if(typeof key !== 'string')
                return [false, bogusFormatMessage];
            // public.glyphOrder
            if(key === 'public.glyphOrder') {
                if(!(val instanceof Array))
                    return [false, bogusGlyphOrderMessage];
                for(i=0; i<val.length; i++){
                    glyphName = val[i];
                    if(typeof glyphName !== 'string')
                        return [false, bogusGlyphOrderMessage];
                }
            }
        }
        return [true, undefined];
    }
    module.fontLibValidator = fontLibValidator;
    // --------
    // GLIF lib
    // --------
    
    /**
     * Check the validity of the lib.
     * Version 3+ (though it's backwards compatible with UFO 1 and UFO 2).
     * 
     * Python doctest
     * >>> lib = {"foo" : "bar"}
     * >>> glyphLibValidator(lib)
     * (True, None)
     * 
     * >>> lib = {"public.awesome" : "hello"}
     * >>> glyphLibValidator(lib)
     * (True, None)
     * 
     * >>> lib = {"public.markColor" : "1,0,0,0.5"}
     * >>> glyphLibValidator(lib)
     * (True, None)
     * 
     * >>> lib = {"public.markColor" : 1}
     * >>> glyphLibValidator(lib)
     * (False, 'public.markColor is not properly formatted.')
     */
    function glyphLibValidator(value) {
        var bogusFormatMessage = 'The lib data is not in the correct format.',
            bogusColorMessage = 'public.markColor is not properly formatted.',
            key, val;
        if(typeof value !== 'object')
            return [false, bogusFormatMessage];
        for(key in value){
            val = value[key];
            if(typeof key !== 'string')
                return [false, bogusFormatMessage];
            // public.markColor
            if(key === 'public.markColor' && !colorValidator(val))
                return [false, bogusColorMessage];
        }
        return [true, undefined];
    }
    module.glyphLibValidator = glyphLibValidator;
    
    //export the validators
    return module;
});
