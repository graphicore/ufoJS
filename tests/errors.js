define(['doh', 'ufojs/errors'], function(doh, errors){

    var count_runs_of_Test_MakeError = 0;
    var raiser = {raise:function(err){throw new err;}}
    doh.register("ufojs.errors", [
    function Test_Errors(){
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
    function Test_asssert(){
        doh.assertError(
            errors.Assertion,
            errors, 'assert',
            [false],
            'assertion must raise when false'
        );

        //noting may happen
        doh.assertEqual(errors.assert(true), null);
    }
    ]);
});
