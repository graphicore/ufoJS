//this is just a layer to load all the tests. they will register themselves
//with the global! doh object.
define([
    'tests/errors',
    'tests/testmain',
    'tests/tools/pens/AbstractPen',
    'tests/tools/pens/main',
    'tests/tools/misc/transform',
    'tests/tools/pens/TransformPen',
    'tests/tools/pens/BasePen',
    'tests/tools/pens/AbstractPointPen',
    'tests/tools/pens/BasePointToSegmentPen',
    'tests/tools/pens/PointToSegmentPen',
    'tests/plistLib/main',
    'tests/ufoLib/validators'
],'test Layer');
