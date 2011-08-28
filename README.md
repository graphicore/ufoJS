graphicore Font Building
========================

Copyright (c) 2011, Lasse Fister lasse@graphicore.de, http://graphicore.de

You should have received a copy of the MIT License along with this program.
If not, see http://www.opensource.org/licenses/mit-license.php

About
-----

This software will eventually enable JavaScript environments to do presentation,
creation and manipulation of font data. Therefore concepts and algorithms
of the FontTools and RoboFab (see Credits) where translated into JavaScript.

Credits
-------

### Code Input

This project aims to provide a similar API to font data in JavaScript as
the (mostly) Python Projects FontTools and RoboFab. To achieve that I did
(more or less) translate some of the  FontTools and RoboFab files into
JavaScript. Therefore the original ideas and algorithms are from these
projects and they serve as reference for what behavior is right or wrong.
Any discrepancies between the JavaScript and Python versions especially
those caused by the differences of the languages or those caused by the
incapabilities of the translator are completely discussible.

The files of the original sources are referenced in the files of this
project where they where used.

[FontTools](http://sourceforge.net/projects/fonttools/)
Author: Just van Rossum 

[RoboFab](http://www.robofab.org)
Authors: Erik van Blokland, Tal Leming, Just van Rossum

### Reference

This is closely related to the RoboFab way of working with font data.
It's the RoboFab way of storing font data and the main reason why I think
using the RoboFab/FontTools code is a good idea: compatibility to the UFO.

[Unified Font Object](http://unifiedfontobject.org)
Authors:  Erik van Blokland, Tal Leming, Just van Rossum

### Dependencies

The Project itself requires an [Modules/AsynchronousDefinition-Loader](http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition)
defined by [commonJs](http://www.commonjs.org/) and currently provided by
[bdload](http://bdframework.org/bdLoad/docs/bdLoad-tutorial/bdLoad-tutorial.html)
Author: Rawld Gill

The Tests are driven by the [D.O.H: Dojo Objective Harness](http://dojotoolkit.org/reference-guide/util/doh.html)
Authors: Alex Russell, Pete Higgins, Dustin Machi, Jared Jurkiewicz

The [dojo toolkit](http://dojotoolkit.org/) is used where a webbrowser is
involved. The lib itself has no dependencies on it.
