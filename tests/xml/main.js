define(
    ['ufojs', 'ufojs/errors' ,'ufojs/xml/main'],
    function(main, errors, xml)
{
    /**
     * TODO: Testing the xml Module should be done far more, as this is a
     * point where the implementations from the varoius Environments differ
     * strongly.
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
         * Apperently this is broken in the Browsers as these dont throw
         * Errors when parsing garbage.
         * 
         * So here is a test to see how well our workarounds do.
         */
        function Test_parseFromString_BadInput(){
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
        }
        
        
    ])
    
    
})
