define(
    ['ufojs', 'ufojs/errors', 'ufojs/plistLib/main'],
    function(main, errors)
{
    doh.register("plistLib.main", [
    function Test_fail(){
        throw new errors.notImplemented('These tests are not written yet :(');
    }
    ])
});
