/**
 * Copyright (c) 2012, Lasse Fister lasse@graphicore.de, http://graphicore.de
 * 
 * You should have received a copy of the MIT License along with this program.
 * If not, see http://www.opensource.org/licenses/mit-license.php
 * 
 * This is a port of glifLib.GLIFPointPen defined in
 * robofab/branches/ufo3k/Lib/ufoLib/gliflib.py
 * 
 */ 
 
define(
    [
        'ufojs',
        'ufojs/errors',
        'ufojs/xml/main',
        'ufojs/tools/pens/AbstractPointPen',
        'ufojs/ufoLib/validators',
        './constants'
    ],
    function(
        main,
        errors,
        xml,
        AbstractPointPen,
        validators,
        constants
) {
    "use strict";
    //shortcuts
    var enhance = main.enhance,
        isNumber = main.isNumber,
        assert = errors.assert,
        GlifLibError = errors.GlifLib,
        identifierValidator = validators.identifierValidator,
        transformationInfo = constants.transformationInfo;
    
    /*constructor*/
    
    /**
     * Helper class using the PointPen protocol to write the <outline>
     * part of .glif files.
     */
    function GLIFPointPen(
        element /* DOM Element*/,
        identifiers /* dict optional */,
        formatVersion /*default 2*/
    ) {
        
        if(!(element instanceof xml.Node))
            throw new GlifLibError('Element must be an instance of xml.Node.')
        
        this._element = element;
        this._formatVersion = formatVersion === undefined ? 2 : formatVersion;
        this._identifiers = identifiers || {};
        
        this._document = element.ownerDocument;
        this._prevPointTypes = [];
        this._prevOffCurveCount = 0;
        this._currentPath = null;
    }
    
    /*inheritance*/
    GLIFPointPen.prototype = Object.create(AbstractPointPen.prototype);
    
    /*definition*/
    enhance(GLIFPointPen, {
        get element() {
            return this._element;
        }
      , get identifiers() {
            return this._identifiers;
        }
      , get formatVersion() {
            return this._formatVersion;
        }
      , beginPath: function(kwargs /* optional, object looks for the key 'identifiers'*/) {
            kwargs = kwargs || {}
            
            assert(this._currentPath === null,
                'currentPath is not null, call endPath');
            this._currentPath = this._document.createElement('contour');
            if(this._checkIdentifier(kwargs.identifier))
                this._currentPath.setAttribute('identifier', kwargs.identifier);
            this._prevOffCurveCount = 0
        },
        endPath: function () {
            assert(this._currentPath !== null,
                'currentPath is null, call beginPath');
            
            if ( this._prevPointTypes.length
                && this._prevPointTypes[0] === 'move'
                && this._prevPointTypes.slice(-1)[0] == 'offcurve'
            )
                throw new GlifLibError('open contour has loose offcurve point');
            
            this._element.appendChild(this._currentPath);
            this._currentPath = null;
            this._prevOffCurveCount = 0;
            this._prevPointTypes = [];
        },
        addPoint: function(
            pt,
            segmentType /* default null */,
            smooth /* default false */,
            name /* default null */,
            kwargs /* default an object, javascript has no **kwargs syntax
                looks for the key "identifier"
            */
        ) {
            assert(this._currentPath !== null,
                'currentPath is null, call beginPath');
            
            segmentType = (segmentType === undefined) ? null : segmentType;
            smooth = (smooth || false);
            name = (name === undefined) ? null : name;
            kwargs = (kwargs || {});//an "options" object
            
            var point = this._document.createElement('point');
            
            // coordinates
            if(pt === undefined)
                throw new GlifLibError('Missing point argument');
            if(pt.filter(isNumber).length < 2)
                throw new GlifLibError('coordinates must be int or float')
            
            point.setAttribute('x', pt[0]);
            point.setAttribute('y', pt[1]);
            
            // segment type
            if (segmentType === 'offcurve')
                segmentType = null
            else if(segmentType == 'move' && this._prevPointTypes.length)
                throw new GlifLibError('move occurs after a point has '
                    +'already been added to the contour.')
            else if(
                segmentType == 'line'
                && this._prevPointTypes.length
                && this._prevPointTypes.slice(-1)[0] === 'offcurve'
            )
                throw new GlifLibError('offcurve occurs before line point.');
            else if (segmentType === 'curve' && this._prevOffCurveCount > 2)
                throw new GlifLibError('too many offcurve points before '
                    + 'curve point.');
            
            if (segmentType !== null)
                point.setAttribute('type', segmentType);
            else
                segmentType = 'offcurve'
            
            if (segmentType === 'offcurve')
                this._prevOffCurveCount += 1;
            else
                this._prevOffCurveCount = 0;
            
            this._prevPointTypes.push(segmentType);
            
            // smooth
            if(smooth) {
                if(segmentType === 'offcurve')
                    throw new GlifLibError('can\'t set smooth in an '
                        + 'offcurve point.');
                 point.setAttribute('smooth', 'yes');
            }
            // name
            if (name !== null)
                point.setAttribute('name', name);
            
            // identifier
            if(this._checkIdentifier(kwargs.identifier))
                point.setAttribute('identifier', kwargs.identifier);
                
            this._currentPath.appendChild(point);
        },
        addComponent: function(glyphName, transformation, kwargs/*optional dict*/) {
            var component = this._document.createElement('component')
              , kwargs = kwargs || {}
              , i=0
              , attr, defaultVal;
            component.setAttribute('base', glyphName);
            
            // the python code was here:
            // for (attr, default), value in zip(_transformationInfo, transformation):
            // not shure if the python code is right here
            for(;i<transformationInfo.length && i<transformation.length; i++) {
                attr = transformationInfo[i][0];
                defaultVal = transformationInfo[i][1];
                if(!isNumber(transformation[i]))
                    throw new GlifLibError('transformation values must '
                        + 'be int or float');
                if(transformation[i] !== defaultVal)
                   component.setAttribute(attr, transformation[i]);
            }
            
            if(this._checkIdentifier(kwargs.identifier))
                component.setAttribute('identifier', kwargs.identifier);
            this._element.appendChild(component);
        },
        _checkIdentifier: function(identifier) {
            if(identifier === undefined || this._formatVersion < 2)
                return false;
            if(identifier in this._identifiers)
                throw new GlifLibError('identifier used more than once: '
                    + identifier);
            if(!identifierValidator(identifier))
                throw new GlifLibError('identifier not formatted properly: '
                    +  identifier);
            this._identifiers[identifier] = true;
            return true;
        }
    });
    
    return GLIFPointPen;
});

