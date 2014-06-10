define(
    ['ufojs/main', 'ufojs/errors', 'ufojs/ufoLib/filenames'],
    function(main, errors, filenames)
{
    var userNameToFileName = filenames.userNameToFileName,
        handleClash1 = filenames.handleClash1,
        handleClash2 = filenames.handleClash2;
    doh.register("ufojs.ufoLib.filenames", [
    function Test_userNameToFileName() {
        // from the python doctest
        doh.assertEqual('a', userNameToFileName("a"));
        doh.assertEqual('A_', userNameToFileName("A"));
        doh.assertEqual('A_E_', userNameToFileName("AE"));
        doh.assertEqual('A_e', userNameToFileName("Ae"));
        doh.assertEqual('ae', userNameToFileName("ae"));
        doh.assertEqual('aE_', userNameToFileName("aE"));
        doh.assertEqual('a.alt', userNameToFileName("a.alt"));
        doh.assertEqual('A_.alt', userNameToFileName("A.alt"));
        doh.assertEqual('A_.A_lt', userNameToFileName("A.Alt"));
        doh.assertEqual('A_.aL_t', userNameToFileName("A.aLt"));
        doh.assertEqual('A_.alT_', userNameToFileName("A.alT"));
        doh.assertEqual('T__H_', userNameToFileName("T_H"));
        doh.assertEqual('T__h', userNameToFileName("T_h"));
        doh.assertEqual('t_h', userNameToFileName("t_h"));
        doh.assertEqual('F__F__I_', userNameToFileName("F_F_I"));
        doh.assertEqual('f_f_i', userNameToFileName("f_f_i"));
        doh.assertEqual('A_acute_V_.swash', userNameToFileName("Aacute_V.swash"));
        doh.assertEqual('_notdef', userNameToFileName(".notdef"));
        doh.assertEqual('_con', userNameToFileName("con"));
        doh.assertEqual('C_O_N_', userNameToFileName("CON"));
        doh.assertEqual('_con.alt', userNameToFileName("con.alt"));
        doh.assertEqual('alt._con', userNameToFileName("alt.con"));
    },
    function Test_handleClash1() {
        // from the python doctest
        var prefix = "00000.",
            suffix = ".0000000000",
            existing = ['aaaaa'],
            e;
         
        e = main.setLike(existing);
         doh.assertEqual(
            '00000.AAAAA000000000000001.0000000000',
            handleClash1("AAAAA", e, prefix, suffix)
        );
        
        e = main.setLike(existing);
        e[prefix + "aaaaa" + '000000000000001' + suffix] = true;
         doh.assertEqual(
            '00000.AAAAA000000000000002.0000000000',
            handleClash1("AAAAA", e, prefix, suffix)
        );
        
        e = main.setLike(existing);
        e[prefix + "AAAAA" + "000000000000002" + suffix] = true;
         doh.assertEqual(
            '00000.AAAAA000000000000001.0000000000',
            handleClash1("AAAAA", e, prefix, suffix)
        );
    },
    function Test_handleClash2() {
        // from the python doctest
        var prefix = "00000.",
            suffix = ".0000000000",
            existing = [],
            e;
        for(var i=0; i<100; i++)
            existing.push(prefix + i + suffix);
        e = main.setLike(existing);
        doh.assertEqual(
            '00000.100.0000000000',
            handleClash2(e, prefix, suffix)
        );
        
        e = main.setLike(existing);
        delete(e[prefix + "1" + suffix]);
        doh.assertEqual(
            '00000.1.0000000000',
            handleClash2(e, prefix, suffix)
        );
        
        e = main.setLike(existing);
        delete(e[prefix + "2" + suffix]);
        doh.assertEqual(
            '00000.2.0000000000',
            handleClash2(e, prefix, suffix)
        );
    }
    ]);
});
