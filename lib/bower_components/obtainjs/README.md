ObtainJS 
========
ObtainJS is a micro framework to bring together asynchronous and 
synchronous JavaScript code. It helps you to Don't Repeat Yourself 
(DRY) if you are developing a library with interfaces for both 
blocking/synchronous and non-blocking/asynchronous execution models.

As a *USER*
-----------

of a library that was implemented with ObtainJS you won't have to learn
a lot. Typically a function defined using ObtainJS has as first argument
the switch, that lets you choose the execution path, followed by its normal
arguments:

```js

// readFile has an obtainJS API:
function readFile(obtainAsyncExecutionSwitch, path) { /* ... */ }

```

#### execute synchronously

If the obtainSwitch is a falsy value readFile will execute synchronously
and return the result directly.

```js
var asyncExecution = false, result;
try {
    result = readFile(asyncExecution, './file-to-read.js');
} catch(error) {
    // handle the error
}
// do something with result

```

#### execute asynchronously
If the obtainSwitch is a truthy value readFile will execute asynchronously
and *always* return a Promise.
 
See [Promises at MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)

```js 
var asyncExecution = true, promise;

promise = readFile(asyncExecution, './file-to-read.js');
promise.then(
    function(result) {
        // do something with result
    },
    function(error){
        // handle the error
    }
)

// Alternatively use the returned promise directly:

readFile(asyncExecution, './file-to-read.js')
    .then(
        function(result) {
            // do something with result
        },
        function(error){
            // handle the error
        }
    )
```

You can use a callback based api, too. Note that the Promise is returned anyways.

```js
var asyncExecution;

function unifiedCallback(error, result){
    if(error)
        // handle the error
    else
        // do something with result
}

asyncExecution = {unified: unifiedCallback}

readfile(asyncExecution, './file-to-read.js');
```

or with a separate callback and errback

``` js
var asyncExecution;

function callback(result) {
    // do something with result
}

function errback(error) {
    // handle the error
}

var asyncExecution = {callback: callback, errback: errback}
readfile(asyncExecution, './file-to-read.js');

```


As a smart ;-) *LIBRARY AUTHOR*
-------------------------------

who's going to implement a API using with ObtainJS the work is a bit more.
Stay with me.

The behavior above is achieved by defining a twofold dependency tree: one
for the actions  of the synchronous execution path and one for the actions
of the  asynchronous execution path.

Actions are small functions with dependencies on the results of other 
actions. The asynchronous execution path will fallback to synchronous
actions if there is no asynchronous action defined for a dependency. 
*You wouldn't define an asynchronous action if its synchronous
equivalent is non-blocking*. This is where you **DRY**!

So, what you do, for example, is splitting your synchronous and blocking 
method in small function-chunks. These chunks depend on the results of each
other. Then you define a non-blocking AND asynchronous chunk for each
synchronous AND blocking chunk. The rest does obtainJS for you. Namely:

 * creating a switch for synchronous or asynchronous execution
 * resolving the dependency tree
 * executing the chunks in the right order
 * providing you with the results via:
   * return value when using the synchronous path
   * promises OR callbacks (your choice!) when using the asynchronous path

#### Here is the readFile function
from above, taken directly from working code at
[ufoJS](https://github.com/graphicore/ufoJS/blob/master/lib/tools/io/staticBrowserREST.js)

```js
define(['ufojs/obtainJS/lib/obtain'], function(obtain) {
    
    // obtain.factory creates our final function
    var readFile = obtain.factory(
        // this is the synchronous dependency definition
        {
            // this action is NOT in the async tree, the async execution
            // path will fall back to this method
            uri: ['path', function _path2uri(path) {
                return path.split('/').map(encodeURIComponent).join('/')
            }]
            // synchronous AJAX request
          , readFile:['uri', function(path) {
                var request = new XMLHttpRequest();
                request.open('GET', path, false);
                request.send(null);
                
                if(request.status !== 200)
                    throw _errorFromRequest(request);
                
                return request.responseText;
            }]
        }
      ,
      // this is the asynchronous dependency definition
      {
            // aynchronous AJAX request
            readFile:['uri', '_callback', function(path, callback) {
                var request = new XMLHttpRequest()
                  , result
                  , error
                  ;
                request.open('GET', path, true);
                
                request.onreadystatechange = function (aEvt) {
                    if (request.readyState != 4 /*DONE*/)
                        return;
                    
                    if (request.status !== 200)
                        error = _errorFromRequest(request);
                    else
                        result = request.responseText
                    callback(error, result)
                }
                request.send(null);
            }]
        }
      // this are the "regular" function arguments
      , ['path']
      // this is the "job", a driver function that receives as first
      // argument the obtain api. A method that the name of an action or
      // of an argument as input and returns its result
      // Note that job is potentially called multiple times during
      // asynchronoys execution
      , function(obtain, path){ return obtain('readFile'); }
    );
})

```

#### a skeleton

```
var myFunction = obtain.factory(
    // sync actions
    {},
    // async actions
    {},
    // arguments
    [],
    //job
    function(obtain){}
);

```

#### action/getter definition

```js

// To define a getter we give it a name provide a definition array.
{
    // sync
    
    sum: ['arg1', 'arg2',
    // the last item in the definition array is always the action/getter itself.
    // it is called when all dependencies are resolved
    function(arg1, arg2) {
        // function body.
        var value = arg1 + arg2
        return value
    }]
}

// For asynchronous getters you have different options:
{
    // async
    
    // the special name "_callback" will inject a callback function
    sample1: ['arg1',  '_callback', function(arg1, callback) {
            // callback(error, result)
        }],
    // you can order separate callback and errback when using both special
    // names "_callback" and "_errback"
    sample2: ['arg1',  '_callback', '_errback', function(arg1, callback, errback) {
            // errback(error)
            // callback(result)
        }],
    // return a promise
    sample3: ['arg1', function(arg1) {
            var promise = new Promise(/* do what you have to*/);
            
            return promise
        }]
}

```

The items in the definition array before the action are the dependencies
their values are going to be injected into the call to action, when
available.

If the type of an dependency **is not a string**: It's injected as a value
directly. This way you can effectively do currying.

If the type of the value **is a string**: It's looked up in the dependency
tree for the current execution path(sync or async).

* If its name is defined as an caller-argument (in the third argument of obtain.factory) the value
    is taken from the invoking call.
* If its name is defined as the name of another action, that action is
    executed and its return value is used as a parameter. An action will
    executed only once per run, later invocations will return a cached value.
    * If the  execution path is asynchronous obtain will first look for a
      asynchronous action definition. If that is not found it falls back
      to a synchronous definition.

If you wish to pass a String as value to your getter you must define it as
an instance of obtain.Argument:  `new obtain.Argument('mystring argument is not a getter')`
    


#### A more complete example
from [ufoLib/glifLib/GlyphSet.js](https://github.com/graphicore/ufoJS/blob/master/lib/ufoLib/glifLib/GlyphSet.js)

Note that: obtainJS is aware of the host object and propagates `this`
correctly to all actions.


```js
    /**
     * Read the glif from I/O and cache it. Return a reference to the
     * cache object: [text, mtime, glifDocument(if alredy build by this.getGLIFDocument)]
     *
     * Has the obtainJS sync/async api.
     */
    GlypSet.prototype._getGLIFcache = obtain.factory(
        { //sync
            fileName: ['glyphName', function fileName(glyphName) {
                var name = this.contents[glyphName];
                if(!(glyphName in this.contents) || this.contents[glyphName] === undefined)
                    throw new KeyError(glyphName);
                return this.contents[glyphName]
            }]
          , glyphNameInCache: ['glyphName', function(glyphName) {
                return glyphName in this._glifCache;
            }]
          , path: ['fileName', function(fileName) {
                return [this.dirName, fileName].join('/');
            }]
          , mtime: ['path', 'glyphName', function(path, glyphName) {
                try {
                    return this._io.getMtime(false, path);
                }
                catch(error) {
                    if(error instanceof IONoEntryError)
                        error = new KeyError(glyphName, error.stack);
                    throw error;
                }
            }]
          , text: ['path', 'glyphName', function(path, glyphName) {
                try {
                    return this._io.readFile(false, path);
                }
                catch(error) {
                    if(error instanceof IONoEntryError)
                        error = new KeyError(glyphName, error.stack);
                    throw error;
                }
            }]
          , refreshedCache: ['glyphName', 'text', 'mtime',
            function(glyphName, text, mtime) {
                return (this._glifCache[glyphName] = [text, mtime]);
            }]
        }
        //async getters
      , {
            mtime: ['path', 'glyphName', '_callback',
            function(path, glyphName, callback) {
                var _callback = function(error, result){
                    if(error instanceof IONoEntryError)
                        error = new KeyError(glyphName, error.stack);
                    callback(error, result)
                }
                this._io.getMtime({unified: _callback}, path);
            }]
          , text: ['path', 'glyphName', '_callback',
            function(path, glyphName, callback){
                var _callback = function(error, result) {
                    if(error instanceof IONoEntryError)
                        error = new KeyError(glyphName, error.stack);
                    callback(error, result)
                }
                this._io.readFile({unified: _callback}, path);
            }
          ]
        }
        , ['glyphName']
        , function job(obtain, glyphName) {
            if(obtain('glyphNameInCache')) {
                if(obtain('mtime').getTime() === this._glifCache[glyphName][1].getTime()) {
                    // cache is fresh
                    return this._glifCache[glyphName];
                }
            }
            // still here? need read!
            // refreshing the cache:
            obtain('refreshedCache')
            return this._glifCache[glyphName];
        }
    )
```



### To run tests in nodeJS
```
$ ./runtest.sh
```
### To run tests in the browser:

```
$ ./serve.sh
```
1. Go to [`http://localhost:8000/node_modules/intern/client.html?config=tests/intern`](http://localhost:8000/node_modules/intern/client.html?config=tests/intern)
* And open you debug tool (F12) in the browser.
* In some Browsers you need to reload, because the console was not loaded
  when the tests where executed.
* Testing output should appear in the console. 
