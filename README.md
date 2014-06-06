ufoJS
=====

With ufoJS you can load, manipulate and save font data in JavaScript.
A [UFO: Unified Font Object](http://unifiedfontobject.org) is a directory 
based file format representing font data in a human readable way. UFO
is already supported by all major font development tools. ufoJS enables
browser based font development tools that blend nicely into
professional workflows.

ufoJS is tested with nodeJS and current Firefox and Chrome. You can run the
unit tests with other browsers and see where it breaks and where it works.

Technology remarks
------------------

The starting point for ufoJS is porting RoboFab to JavaScript. Once this
is done to a satisfactory point, we can start with optimizing the APIs and
inner  workings for new challenges. However, the first goal is to become
useful and fully unit tested.

There are already significant differences to the RoboFab legacy:

 * ufoJS provides both a synchronous and an [asynchronous](http://en.wikipedia.org/wiki/Asynchronous_I/O)
   API.
   
   * The asynchronous API is particularly useful for User Interfaces or
   fast NodeJS based servers. JavaScript developers know this concept already.
   * The synchronous API is useful for adhoc-scripting, simple command line
     programms or webworkers. It is less complex to write synchronous scripts.
     
   [ObtainJS](https://github.com/graphicore/obtainJS) is used to implement the
   asynchronous and synchronous API side bz side. Go to the OtainJS
   Repository to learn how to use APIs implemented with it or how to implement
   APIs with ObtainJS.
   
 * ufoJS does file system abstraction based on a dependency injection
   pattern. You can write your own persistence module and just use it.
   See the [I/O modules](https://github.com/graphicore/ufoJS/tree/master/lib/tools/io)
   for the yet early state of the Interface.

There is no good Documentation or guide yet. You are welcome to start that
and I would gladly support you. In the meantime your options are:

* [Read the source, Luke](http://blog.codinghorror.com/learn-to-read-the-source-luke/)
  and read the unit tests, too. Also, there is a mini sample App, the [glif-renderer](./env/glif-renderer.xhtml)
* See how things are done with RoboFab and try to transfer you knowledge.


Further Reading
---------------

### [UFO Reference](http://unifiedfontobject.org)

keep this under your pillow ;-)

### Code Input

ufoJS is based on porting the Python code of FontTools and RoboFab to JavaScript.

The files of the Python sources are referenced in the headers of the files
of this project.

[FontTools](http://sourceforge.net/projects/fonttools/)
Author: Just van Rossum 

[RoboFab](http://www.robofab.org)
Authors: Erik van Blokland, Tal Leming, Just van Rossum

### Dependencies

The Project itself uses an [Modules/AsynchronousDefinition-Loader](http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition)
defined by [commonJs](http://www.commonjs.org/) and currently provided by
[RequireJS](http://requirejs.org/) and [RequireJS for nodeJs](https://github.com/jrburke/r.js)
Author: James Burke

The Tests are driven by (an old version of) the [D.O.H: Dojo Objective Harness](http://dojotoolkit.org/reference-guide/util/doh.html)
Authors: Alex Russell, Pete Higgins, Dustin Machi, Jared Jurkiewicz

The implementation of the Synchronous/Asynchronous APIs is made
with [ObtainJS](https://github.com/graphicore/obtainJS) Author: Lasse Fister

<hr />

Copyright (c) 2011, 2012, 2013, 2014, Lasse Fister lasse@graphicore.de, http://graphicore.de

You should have received a copy of the MIT License along with this program.
If not, see http://www.opensource.org/licenses/mit-license.php
