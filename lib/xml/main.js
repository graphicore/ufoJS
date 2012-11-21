/**
 * Copyright (c) 2011, Lasse Fister lasse@graphicore.de, http://graphicore.de
 * 
 * You should have received a copy of the MIT License along with this program.
 * If not, see http://www.opensource.org/licenses/mit-license.php
 * 
 * This returns the browsers xml tools or if in nodejs a mapping to the
 * libxmljs api so that it can be used like the w3c tools.
 * 
 * IMPORTANT for nodejs with libxmljs: As the need of this project regarding
 * xml tools is not so big, there will likely be no full DOM w3c api
 * available. Thus, things like running jQuery on a libxmljs element won't
 * work.
 */

define([
    'ufojs/errors'
], function(
    errors
) {
    var DependencyError = errors.Dependency,
        TypeError = errors.Type,
        NotImplementedError = errors.NotImplemented,
        ParserError = errors.Parser;
    
    var xml, implementation;
    if(typeof DOMParser !== 'undefined') {
        implementation = 'w3c';
        //this is straightforward, we just map the apis that are there
        xml = {
            get implementation() {
                return implementation;
            },
            Parser: DOMParser,
            Serializer: XMLSerializer,
            XPathEvaluator: XPathEvaluator,
            XPathResult: XPathResult,
        // XPathException is undefined in Firefox
        //    XPathException: XPathException,
            XSLTProcessor: XSLTProcessor,
            createDocument: function() {
                var args = [].slice.call(arguments);
                return document.implementation.createDocument.apply(
                    document.implementation, args);
            },
            createDocumentType: function() {
                var args = [].slice.call(arguments);
                return document.implementation.createDocumentType.apply(
                    document.implementation, args);
            }
        }
        return xml;
    }
    /**
     * this is for the nodejs environment
     * 
     * The impementation is not complete but enough for my purposes.
     * If there is a better W3C DOM environment for nodeJS please let me
     * know.
     * caveats:
     * The sax parser does not mention things that would be interesting
     * for xsl/xslt/dtd parsing
     * especially the Doctype of your document won't be recognized
     * 
     * The Serializer throws NotImplementedError on:
     * ENTITY_REFERENCE_NODE, ENTITY_NODE, NOTATION_NODE
     */
    
    
    // the files libs are loaded syncronously with requireJS handing over
    // the call to nodes commomJS require mechanism
    
    // jsdom is available via nodes npm or http://jsdom.org
    var r = require.nodeRequire,
        path = r('path'),
        dom = r('jsdom').dom.level3.core,
        //dunno why i need to force node like this to load the files
        jsdomPath = path.dirname(r.resolve('jsdom')) + '/jsdom/',
        encodeHTML = r(jsdomPath + 'browser/htmlencoding.js').HTMLEncode,
        // https://github.com/polotek/libxmljs
        // another sax parser is https://github.com/robrighter/node-xml 
        xmlparser = r('libxmljs');
    if(dom) {
        implementation = 'jsdom';
        xml = {
            Parser: function(){},
            Serializer: function(){},
            XPathEvaluator: dom.XPathEvaluator,
            XPathResult: dom.XPathResult,
        //    XPathException: dom.XPathException,
            createDocument: function() {
                var args = [].slice.call(arguments),
                    implementation = new dom.DOMImplementation();
                return implementation.createDocument.apply(implementation, args);
            },
            createDocumentType: function() {
                var args = [].slice.call(arguments),
                    implementation = new dom.DOMImplementation();
                return implementation.createDocumentType.apply(implementation, args);
            },
            get implementation() {
                return implementation;
            }
        };
        //FIXME: How would we get the doctype for our document?
        xml.Parser.prototype.parseFromString = function(string, mimeType) {
            if(!(mimeType in {'text/xml': true, 'application/xml': true}))
                //so it's clear that we don't support html here
                throw new TypeError('MIME-Type must be an XML type like '
                    + '"text/xml" or "application/xml".');
            
            var options = {contentType: mimeType},
                doc = new dom.Document(options),
                currentElement = doc,
                totalElements = 0,
                parser;
            
            parser = new xmlparser.SaxParser({
                endDocument: function() {
                    var counted = doc.getElementsByTagName("*").length;
                    //errors.assert(
                    //    doc.getElementsByTagName("*").length === totalElements,
                    //    ['Expected', totalElements,
                    //        'elements but found', counted].join(' ')
                    //);
                },
                startElementNS: function(elem, attrs, prefix, uri, namespaces) {
                    totalElements++;
                    var element;
                    if(uri)
                        element = doc.createElementNS(uri, prefix+':'+elem);
                    else
                        element = doc.createElement(elem);
                    //attrs - an array of arrays: [[key, prefix, uri, value]]
                    attrs.map(function(attr){
                        var key = attr[0],
                            prefix = attr[1],
                            uri = attr[2],
                            value = attr[3];
                        if(uri)
                            element.setAttributeNS(
                                uri,
                                (prefix) ? prefix + ':' + key : key,
                                value
                            );
                        else
                            element.setAttribute(key, value);
                    });
                    namespaces.map(function(attr){
                        var name = attr[0],
                            value = attr[1];
                        element.setAttribute('xmlns:' + name, value || '');
                    });
                    
                    currentElement.appendChild(element);
                    currentElement = element;
                },
                endElementNS: function(elem, prefix, uri) {
                    currentElement = currentElement.parentNode;
                },
                characters: function(chars) {
                    var node = doc.createTextNode(chars);
                    currentElement.appendChild(node);
                },
                cdata: function(cdata) {
                    var node = doc.createCDATASection(cdata);
                    currentElement.appendChild(node);
                },
                comment: function(comment) {
                    var node = doc.createComment(comment);
                    currentElement.appendChild(node);
                },
                warning: function(message) {
                    errors.warn('XML SAX2 Parser: ' + message);
                },
                error: function(message) {
                    throw new ParserError('XML SAX2 Parser: ' + message);
                }
            });
            parser.parseString(string);
            return doc;
        };
        
        var _serializer = {
            dispatch: function(node) {
                return _serializer.renderer[node.nodeType](node);
            },
            renderer: {}
        };
        _serializer.renderer[dom.Node.ELEMENT_NODE] = function(node){
            var empty = (node.childNodes.length === 0),
                attributes = [].slice.call(node.attributes).map(_serializer.dispatch),
                children = [].slice.call(node.childNodes).map(_serializer.dispatch),
                start = ['<', node.name],
                end = empty ? ['/>'] : ['</', node.name, '>'];
                if(!empty) attributes.push('>');
            return start.concat(attributes, children, end).join('');
        };
        _serializer.renderer[dom.Node.ATTRIBUTE_NODE] = function(node){
            //prepending a space before every attribute
            return [' ', node.name, '="', encodeHTML(node.nodeValue, true), '"'].join('');
        };
        _serializer.renderer[dom.Node.TEXT_NODE] = function(node){
            return encodeHTML(node.nodeValue);
        };
        _serializer.renderer[dom.Node.CDATA_SECTION_NODE] = function(node){
            return ['<![CDATA[', node.nodeValue, ']]>'].join('');
        };
        _serializer.renderer[dom.Node.ENTITY_REFERENCE_NODE] = function(node){
            throw new NotImplementedError('Rendering a the node type ENTITY_REFERENCE_NODE.');
        };
        _serializer.renderer[dom.Node.ENTITY_NODE] = function(node){
            throw new NotImplementedError('Rendering a the node type ENTITY_NODE.');
        };
        _serializer.renderer[dom.Node.PROCESSING_INSTRUCTION_NODE] = function(node){
            return['<?', node.target, ' ', node.nodeValue,'?>'].join(''); 
        };
        _serializer.renderer[dom.Node.COMMENT_NODE] = function(node){
            return['<!--', node.nodeValue, '-->'].join(''); 
        };
        _serializer.renderer[dom.Node.DOCUMENT_NODE] = function(node) {
            return [].slice.call(node.childNodes).map(_serializer.dispatch).join('');
        };
        _serializer.renderer[dom.Node.DOCUMENT_TYPE_NODE] = function(node){
            var start = ['<!DOCTYPE ', node.name],
                pubId = [],
                sysId = [],
                end = ['>'],
                quote;
            if (node.publicId)
                // Public ID may never contain double quotes, so this is always safe.
                pubId = [' PUBLIC "', node.publicId,'" '];
            if (node.systemId) {
                if (!node.publicId)
                    pubId.push(' SYSTEM ');
                // System ID may contain double quotes OR single quotes, not never both.
                quote =  (node.systemId.indexOf('"') > -1) ? '\''  : '"';
                sysId = [quote, node.systemId, quote];
            }
            return start.concat(pubId, sysId, end).join('');
        };
        _serializer.renderer[dom.Node.DOCUMENT_FRAGMENT_NODE] = function(node){
            return [].slice.call(node.childNodes).map(_serializer.dispatch).join('');
        };
        _serializer.renderer[dom.Node.NOTATION_NODE] = function(node){
            throw new NotImplementedError('Rendering a the node type NOTATION_NODE.');
        };
        
        xml.Serializer.prototype.serializeToString = function(doc){
            ret = ['<?xml version="1.0" encoding="UTF-8"?>\n'];
            ret.push(_serializer.dispatch(doc));
            return ret.join('');
        };
        return xml;
    }
    throw new DependencyError('No XML api available.');
});
