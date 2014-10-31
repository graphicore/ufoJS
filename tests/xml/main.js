define(
    ['ufojs/main', 'ufojs/errors' ,'ufojs/xml/main'],
    function(main, errors, xml)
{
    /**
     * TODO: Testing the xml Module should be done far more, as this is a
     * point where the implementations from the various Environments differ
     * greatly.
     * 
     * FIXME: test all of the exposed API
     */
    doh.register("xml.main", [
        function Test_parseFromString() {
            var parser = new xml.Parser()
              ,  doc =  parser.parseFromString(
                    '<root><child attr="attribute content">Content!</child></root>'
                , 'text/xml');
              ;
            
            doh.assertEqual(doc.documentElement.tagName, 'root');
            doh.assertEqual(doc.documentElement.firstChild.tagName, 'child');
            doh.assertEqual(doc.documentElement.firstChild.textContent, 'Content!');
            doh.assertTrue(doc.documentElement.firstChild.hasAttribute('attr'));
            doh.assertEqual(doc.documentElement.firstChild.getAttribute('attr'), 'attribute content');
            
        },
        /**
         * Apperently this is broken in browsers as these don't throw
         * Errors when parsing garbage.
         * 
         * So here is a test to see how well our workarounds do.
         */
        function Test_parseFromString_BadInput() {
            var parser = new xml.Parser();
            doh.assertError(
                errors.Parser,
                parser, 'parseFromString',
                ['<broken stuff', 'text/xml'],
                'Broken XML must raise ParserError'
            )
            
            doh.assertError(
                errors.Parser,
                parser, 'parseFromString',
                ['<broken', 'text/xml'],
                'Broken XML must raise ParserError'
            )
        },
        function Test_serializeToString() {
            var parser = new xml.Parser()
              , doc = parser.parseFromString(
                    '<?xml version="1.0" encoding="UTF-8"?>'
                  + '<root><child attr="attribute content">Content!</child></root>'
                  , 'text/xml')
              , serializer = new xml.Serializer()
              , doc2, roundtripped
              , result
              ;
            

            
            result = serializer.serializeToString(doc)
            
            doh.assertEqual(0, result.indexOf('<?xml'));
            
            doc2 = parser.parseFromString(result, 'text/xml')
            roundtripped = serializer.serializeToString(doc2)
            // FIXME:
            // in chrome result differs from roundtripped
            // if the original string, that was used to create "doc"
            // has no xml-declaration;
            // Because in that case the first doc is serialized without
            // adding an xml-declaration and we add it afterwards in the
            // xml-module, including a linebreak between xml-declaration and
            // content.
            // When doc *had* an xml-declaration, chrome serializes it again
            // with an xml-declaration, but it doesn't add the linebreak
            // bettween xml-declaration and content, thus the differnce.
            doh.assertEqual(result, roundtripped);
        }
    ])
    
    
})
