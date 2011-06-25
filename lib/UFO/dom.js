//some helpers for the handling of parts of the dom
define(function() {
    var dom = {
        // https://developer.mozilla.org/en/Using_XPath
        evaluateXPath: function(aNode, aExpr) {
            var xpe = aNode.ownerDocument || aNode;
            var nsResolver = xpe.createNSResolver(xpe.documentElement);
            var result = xpe.evaluate(
                aExpr,
                aNode,
                nsResolver,
                XPathResult.ORDERED_NODE_ITERATOR_TYPE,
                null
            );
            var found = [];
            var res;
            while (res = result.iterateNext())
                found.push(res);
            return found;
        },
        getAtrributesAsDict: function(DOMElement) {
            var dict = {};
            for (var i = 0; i < DOMElement.attributes.length; i++) {
                var attrib = DOMElement.attributes[i];
                dict[attrib.name] = attrib.value;
            }
            return dict;
        }
    };
    return dom;
});
