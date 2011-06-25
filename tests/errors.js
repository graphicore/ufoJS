define(['graphicore/errors'], function(errors){
    
    var count_runs_of_Test_MakeError = 0; 
    
    doh.register("graphicore.errors", [
    function Test_Errors(){
        var raiser = {raise:function(err){throw new err;}}
        doh.assertError(
            Error,
            raiser, 'raise',
            [errors.Error],
            'errors.Error must inherit from Error'
        );
        
        doh.assertError(
            errors.Error,
            raiser, 'raise',
            [errors.NotImplemented],
            'errors.NotImplemented must inherit from errors.Error'
        );
    },
    function Test_MakeError(){
        var raiser = {
            raise: function(err)
            { 
                throw new err;
            }
        }
        
        if(count_runs_of_Test_MakeError < 1)
        {
            // will fail on the seccond run of the test in the same instance
            // because the error module will have a NewError then, what is
            // what we want
            doh.assertTrue(errors.NewError === undefined);
        } else {
            doh.assertFalse(errors.NewError === undefined);
        }
        count_runs_of_Test_MakeError += 1;
        
        errors.makeError('NewError', undefined, new errors.Error);
        
        doh.assertFalse(errors.NewError === undefined);
        
        doh.assertError(
            errors.Error,
            raiser, 'raise',
            [errors.NewError],
            'makeError must make a child of errors.Error'
        );
        
        var myNamespace = {};
        errors.makeError('NewError', undefined, new Error, myNamespace);
        doh.assertFalse(myNamespace.NewError === undefined);
        doh.assertError(
            Error,
            raiser, 'raise',
            [myNamespace.NewError],
            'makeError must make a child of Error in myNamespace.NewError'
        );
    }
    ]);
});
