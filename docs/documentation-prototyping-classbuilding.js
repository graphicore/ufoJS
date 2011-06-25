/**
 * The Prototype thing always caused confusion with me so I sat down and
 * figured out a way that works for me.
 * Using almost pure javascript and a little helping method I want to
 * outline here how inheritance is done in the libraries of this project.
 * It was very important for me to be able to write the bulk of the
 * (class)-definitions in the {}-object-literal form. Because this, I
 * think, is better to read.
 *
 * There could be more magic with some kind of wrapping method, but I like
 * the verbosity of this approach and I see no significant improvement
 * syntaxwise when wrapping this together.
 */

/**
 * Set the properties of the (propably empty) prototype object of your
 * constructor.
 */
function enhance(constructor, blueprint)
{
    for(var i in blueprint)
    {
        var getter = blueprint.__lookupGetter__(i),
            setter = blueprint.__lookupSetter__(i);
        if ( getter || setter ) {
            if ( getter )
                constructor.prototype.__defineGetter__(i, getter);
            if ( setter )
                constructor.prototype.__defineSetter__(i, setter);
        } else
            constructor.prototype[i] = blueprint[i];
    };
}


/*****************************
 * Abstract Object Conctructor
 *****************************/
/*constructor*/
Abstract = function()
{
    /**
     * this is a dirty trick: only init (build state) if this is ment as
     * constructor not as a prototype for inheritance. This is the main
     * problem with the prototype thing in javascript, i think: the double
     * usage of constructors in different contexts. just be aware of it
     **/
    if(arguments.length)
        this.__init__.apply(this, arguments);
};
/*definition*/
enhance(Abstract, {
    __init__: function(name)
    {
        this.counter = 0;
        this.name = name;
    },
    set name(val)
    {
        this._name = val + ':';
    },
    get name()
    {
        return '!' + this._name;
    },
    do: function()
    {
        this.count();
        console.log(this.name, this.counter, 'not implemented');
    },
    count: function()
    {
        this.counter++;
    }
});

/*****************************
 * General Object Conctructor
 *****************************/
/*constructor*/
General = function(name)
{
    /*building state with Abstract constructor*/
    Abstract.call(this, name);
};
/*inheritance*/
General.prototype = new Abstract;
/*definition*/
enhance(General,
{
    do: function()
    {
        this.count();
        console.log(this.name, this.counter);
    },
});

/*****************************
 * Special Object Conctructor
 *****************************/
/*constructor*/
Special = function(name)
{
    /*building state with General constructor*/
    General.call(this, name);
};
/*inheritance*/
Special.prototype = new General;
/*definition*/
enhance(Special,
{
    do: function()
    {
        this.count();
        console.log(this.name, this.counter, 'special');
    }
});

window.onload = function(){
    console.log('init');

    pens = [
        new Abstract('abstract A'),
        new Abstract('abstract B'),
        new General('general A'),
        new General('general B'),
        new Special('special A'),
        new Special('special B'),
    ];
    for (var i = 0; i < pens.length; i++) {
        pens[i].do();
    }
    for (var i = 0; i < pens.length; i++) {
        pens[i].do();
    }

    console.log((pens[0] instanceof Abstract));
    console.log((pens[2] instanceof Abstract));
    console.log((pens[2] instanceof Special));
    console.log((pens[2] instanceof General));

    /*
    expected:
        init
        !abstract A: 1 not implemented
        !abstract B: 1 not implemented
        !general A: 1
        !general B: 1
        !special A: 1 special
        !special B: 1 special
        !abstract A: 2 not implemented
        !abstract B: 2 not implemented
        !general A: 2
        !general B: 2
        !special A: 2 special
        !special B: 2 special
        true
        true
        false
        true
    */
};