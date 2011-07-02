define(
    ['graphicore', 'graphicore/errors'],
    function(main, errors)
{
    doh.register("graphicore.main", [
    function Test_Enhance(){
        var enhance = main.enhance;
        var AbstractObject = function(){};
        enhance(AbstractObject, {
            test: function(){
                throw new errors.NotImplemented;
            }
        });
        
        var ConcreteObject = function(){};
        ConcreteObject.prototype = new AbstractObject;
        enhance(ConcreteObject, {
            test: function(){
                return true;
            }
        });
        var abstract = new AbstractObject;
        doh.assertError(
            errors.NotImplemented,
            abstract, 'test',
            []
        );
        
        var concrete = new ConcreteObject;
        doh.assertTrue(concrete.test());
        doh.assertTrue(concrete instanceof AbstractObject);
    }
    ]);
});
