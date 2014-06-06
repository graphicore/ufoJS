/**
 * Copyright (c) 2011, Lasse Fister lasse@graphicore.de, http://graphicore.de
 * 
 * You should have received a copy of the MIT License along with this program.
 * If not, see http://www.opensource.org/licenses/mit-license.php
 * 
 * These methods currently return only the contour data from glif files.
 *
 * This:
<?xml version="1.0" encoding="UTF-8"?>
<glyph name="A" format="1">
  <advance width="487"/>
  <unicode hex="0041"/>
  <outline>
    <contour>
      <point x="243" y="681" type="move" name="top"/>
    </contour>
    <contour>
      <point x="243" y="739" type="move" name="top"/>
    </contour>
    <contour>
      <point x="243" y="-75" type="move" name="bottom"/>
    </contour>
    <contour>
      <point x="243" y="739" type="move" name="top"/>
    </contour>
    <contour>
      <point x="243" y="-75" type="move" name="bottom"/>
    </contour>
    <contour>
      <point x="460" y="0" type="line"/>
      <point x="318" y="664" type="line"/>
      <point x="169" y="664" type="line"/>
      <point x="27" y="0" type="line"/>
      <point x="129" y="0" type="line"/>
      <point x="150" y="94" type="line"/>
      <point x="328" y="94" type="line"/>
      <point x="348" y="0" type="line"/>
    </contour>
    <contour>
      <point x="307" y="189" type="line"/>
      <point x="172" y="189" type="line"/>
      <point x="214" y="398" type="line"/>
      <point x="239" y="541" type="line"/>
      <point x="249" y="541" type="line"/>
      <point x="264" y="399" type="line"/>
    </contour>
  </outline>
</glyph>
*
* Becomes:
*
{
  "outline": [
    [
      "contour",
      [
        {
          "x": "243",
          "y": "681",
          "type": "move",
          "name": "top"
        }
      ]
    ],
    [
      "contour",
      [
        {
          "x": "243",
          "y": "739",
          "type": "move",
          "name": "top"
        }
      ]
    ],
    [
      "contour",
      [
        {
          "x": "243",
          "y": "-75",
          "type": "move",
          "name": "bottom"
        }
      ]
    ],
    [
      "contour",
      [
        {
          "x": "243",
          "y": "739",
          "type": "move",
          "name": "top"
        }
      ]
    ],
    [
      "contour",
      [
        {
          "x": "243",
          "y": "-75",
          "type": "move",
          "name": "bottom"
        }
      ]
    ],
    [
      "contour",
      [
        {
          "x": "460",
          "y": "0",
          "type": "line"
        },
        {
          "x": "318",
          "y": "664",
          "type": "line"
        },
        {
          "x": "169",
          "y": "664",
          "type": "line"
        },
        {
          "x": "27",
          "y": "0",
          "type": "line"
        },
        {
          "x": "129",
          "y": "0",
          "type": "line"
        },
        {
          "x": "150",
          "y": "94",
          "type": "line"
        },
        {
          "x": "328",
          "y": "94",
          "type": "line"
        },
        {
          "x": "348",
          "y": "0",
          "type": "line"
        }
      ]
    ],
    [
      "contour",
      [
        {
          "x": "307",
          "y": "189",
          "type": "line"
        },
        {
          "x": "172",
          "y": "189",
          "type": "line"
        },
        {
          "x": "214",
          "y": "398",
          "type": "line"
        },
        {
          "x": "239",
          "y": "541",
          "type": "line"
        },
        {
          "x": "249",
          "y": "541",
          "type": "line"
        },
        {
          "x": "264",
          "y": "399",
          "type": "line"
        }
      ]
    ]
  ]
}


*/

define(['./dom', './glyph'], function(dom, glyph) {
    "use strict";
    /*definition*/
    var glyphFactories = {
        fromGlifString: function(glifString) {
            var parser = new DOMParser();
            var glifDoc = parser.parseFromString(glifString, "text/xml");
            return glyphFactories.fromGlifDocument(glifDoc)
        },
        fromGlifDocument: function(glifDoc) {
            var glyph = {},
                outlineChildrenExpr = '/glyph/outline[1]/contour|/glyph/outline[1]/component',
                outlineElements = dom.evaluateXPath( glifDoc, outlineChildrenExpr ),
                contourExpr = './point';
                                
            glyph.outline = outlineElements.map(function(element){
                var value;
                if(element.tagName === 'contour') {
                    value = dom.evaluateXPath( element, contourExpr )
                                .map(dom.getAtrributesAsDict);
                } else if(element.tagName === 'component') {
                    value = dom.getAtrributesAsDict(element);
                }
                return[element.tagName, value];
            });
            return glyph;
        }
    }
    return glyphFactories;
});
