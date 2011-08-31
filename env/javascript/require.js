(function(
  userConfig, 
  defaultConfig, 
  has
) {
  //
  // This function defines the backdraft JavaScript script-inject loader--an AMD-compliant 
  // (http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition), requirejs-compatible 
  // (http://requirejs.org/) loader. 
  // 
  // This loader exists under a separate project named bdLoad.
  // 
  // For a complete tutorial on the use of this loader, see 
  // http://bdframework.org/docs/loader/loader.html.
  // 
  // The loader may be run-time configured with several configuration variables; 
  // see http://bdframework.org/docs/loader/loader.html#configVariables.
  // 
  // The loader may be run-time and/or build-time configured with has.js switches; 
  // see http://bdframework.org/docs/loader/loader.html#has.
  // 
  // In addition to AMD-compliance and requirejs-compatibility, the loader has the following
  // features:
  // 
  //  * It is highly configurable. The has.js interface is used for both run-time and build-time
  //    configuration. The default implementation assumes a full feature set for the browser. 
  //    However, this can be changed quite dramatically by providing a has.js implementation
  //    and configuration prior to entry. For example, by providing alternate inject functions 
  //    and a has.js configuration that detects a non-browser environment (e.g., V8), the loader
  //    is can be made available to a wide variety of non-browser environments. For example, the resource
  //    lib/node.js configures the the loader for use in node.
  // 
  //  * The features mentioned above are useful in constructing highly optimized release
  //    packaging. For example, it is possible to remove all dynamic script-injecting and receiving
  //    so that an entire application can be bundled into a single file.
  // 
  //  * Generalized error detection and reporting, configurable tracing, and descriptive object 
  //    state variables are included to help find and solve programming errors, with special
  //    emphasis on loading errors.
  // 
  // Since this machinery implements a loader, it does not have the luxury of using a load system and/or
  // leveraging a utility library. This results in an unpleasantly long file; here is a roadmap of the contents:
  // 
  //   1. Define the global require function upon which the loader will be built.
  //   2. Figure out which has.js implementation to use; set lexical has accordingly.
  //   3. Small library for use implementing the loader.
  //   4. Define the core loader data variables.
  //   5. Define configuration machinery and configure the loader.
  //   6. Once-only protection.
  //   7. Core loader machinery that instantiates modules as given by factories and dependencies.
  //   8. Core loader injection machinery
  //   9. Optional loader timeout API.
  //  10. Browser-only machinery:
  //        * minimal event connection machinery
  //        * script-injection machinery
  //        * optional sniff API
  //        * optional DOM content loaded detect API
  //  11. Optional trace machinery.
  //  12. Optional error reporting machinery.
  //  13. AMD define function.
  //  14. Optional automatic has module creation.
  //  15. Optional loader variable publishing
  //  16. Publish require and define to the global space.
  //  17. optional requirejs compat layer
  //  18. Start loading iaw configuration.
  //  19. Arguments to the loader constructor: (user-config, default-config, default-has-impl)
  // 
  // Language and Acronyms and Idioms
  // 
  // moduleId: a CJS module identifier, (used for public APIs)
  // mid: moduleId (used internally)
  // packageId: a package identifier (used for public APIs)
  // pid: packageId (used internally); the implied system or default package has pid===""
  // package-qualified name: a mid qualified by the pid of which the module is a member; result is the string pid + "*" + mid
  // pqn: package-qualified name
  // pack: package is used internally to reference a package object (since javascript has lame reserved words including "package")
  // The integer constant 1 is used in place of true and 0 in place of false.

  var
    //bring in the backdraft documentation generating machinery (stripped during builds)
    bd= {
      docGen: 
        // Documentation generator hook; facilitates generating documentation for named entities that have 
        // no place in normal JavaScript code such as keyword arguments, overload function signatures, and types.
        // 
        // bd.docGen has no actual run-time function; if called it simply execute a no-op. All bd.doc
        // calls are removed by the Backdraft build utility (and/or other intelligent compilers) for
        // release versions of the code.  See the ALTOVISO js-proc manual for further details.
        noop
    },

    // this will be the global require function; define it immediately so we can start hanging things off of it
    req= function(
      config,       //(object, optional) hash of configuration properties
      dependencies, //(array of commonjs.moduleId, optional) list of modules to be loaded before applying callback 
      callback      //(function, optional) lamda expression to apply to module values implied by dependencies
    ) {
      return contextRequire(config, dependencies, callback, 0, req);
    };
  
  req.has= has= userConfig.has || this.has || has;
 
  var
    // define a minimal library to help build the loader
    noop= function() {
    },

    isEmpty= function(it) {
      for (var p in it) return 0;
      return 1;
    },

    toString = {}.toString,
    testPrefix= "[object ",
    functionMarker= testPrefix + "Function]",
    arrayMarker= testPrefix + "Array]",
    stringMarker= testPrefix + "String]",
    
    isFunction= function(it) {
      return toString.call(it)==functionMarker;
    },
    
    isString= function(it) {
      return toString.call(it)==stringMarker;
    },

    isArray= function(it) {
      return toString.call(it)==arrayMarker;
    },

    forEach= function(vector, callback) {
      for (var i= 0; vector && i<vector.length;) callback(vector[i++]);
    },

    setIns= function(set, name) {
      set[name]= 1;
    },

    setDel= function(set, name) {
      delete set[name];
    },

    mix= function(dest, src) {
      for (var p in src) dest[p]= src[p];
      return dest;
    },

    escapeRegEx= function(s) {
      return s.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, function(c) {
        return "\\" + c;
      });
    },

    uidSeed= 
      1,

    uid= 
      function() {
        ///
        // Returns a unique indentifier (within the lifetime of the document) of the form /_d+/.
        return "_" + uidSeed++; 
      },

    // the loader will use these like symbols
    requested= {},
    arrived= {},
    nonmodule= {},

    // begin defining the loader

    pathTransforms=
      // list of functions from URL(string) to URL(string)
      req.pathTransforms= [],

    paths=
      // CommonJS paths
      {},

    pathsMapProg=
      // list of (from-path, to-path, regex, length) derived from paths;
      // a "program" to apply paths; see computeMapProg
      [],

    packages=
      // a map from packageId to package configuration object
      {},

    packageMap=
      // map from package name to local-installed package name
      {},

    packageMapProg=
      // list of (from-package, to-package, regex, length) derived from packageMap;
      // a "program" to apply paths; see computeMapProg
      [],

    modules=
      // A hash:(pqn) --> (module-object). module objects are simple JavaScript objects with the
      // following properties:
      // 
      //   pid: the package identifier to which the module belongs; "" indicates the system or default package
      //   id: the module identifier without the package identifier
      //   pqn: the full context-qualified name
      //   url: the URL from which the module was retrieved
      //   pack: the package object of the package to which the module belongs
      //   path: the full module name (package + path) resolved with respect to the loader (i.e., mappings have been applied)
      //   executed: 1 <==> the factory has been executed
      //   deps: the dependency vector for this module (vector of modules objects)
      //   def: the factory for this module
      //   result: the result of the running the factory for this module
      //   injected: (requested | arrived | nonmodule) the status of the module; nonmodule means the resource did not call define
      //   ready: 1 <==> all prerequisite fullfilled to execute the module
      //   load: plugin load function; applicable only for plugins
      // 
      // Modules go through several phases in creation:
      // 
      // 1. Requested: some other module's definition contains the requested module in
      //    its dependency vector or executing code explicitly demands a module via req.require.
      // 
      // 2. Injected: a script element has been appended to the head element demanding the resource implied by the URL
      // 
      // 3. Loaded: the resource injected in [2] has been evaluated.
      // 
      // 4. Defined: the resource contained a define statement that advised the loader
      //    about the module. Notice that some resources may just contain a bundle of code
      //    and never formally define a module via define
      // 
      // 5. Evaluated: the module was defined via define and the loader has evaluated the factory and computed a result.
      {},

    cache=
      ///
      // hash:(pqn)-->(function)
      ///
      // Gives the contents of a cached resource; function should cause the same actions as if the given pqn was downloaded
      // and evaluated by the host environment
      {},

    // configuration machinery

    computeMapProg= function(map) {
      // This routine takes a map target-prefix(string)-->replacement(string) into a vector 
      // of quads (target-prefix, replacement, regex-for-target-prefix, length-of-target-prefix)
      // 
      // The loader contains processes that map one string prefix to another. These
      // are encountered when applying the requirejs paths configuration and when mapping
      // package names. We can make the mapping and any replacement easier and faster by
      // replacing the map with a vector of quads and then using this structure in simple machine.
      var p, i, item, mapProg= [];
      for (p in map) mapProg.push([p, map[p]]);
      mapProg.sort(function(lhs, rhs) { return rhs[0].length - lhs[0].length; });
      for (i= 0; i<mapProg.length;) {
        item= mapProg[i++];
        item[2]= new RegExp("^" + escapeRegEx(item[0]) + "(\/|$)");
        item[3]= item[0].length + 1;
      }
      return mapProg;
    },

    fixupPackageInfo= function(packageInfo, baseUrl) {
      // calculate the precise (name, baseUrl, lib, main, mappings) for a package
      baseUrl= baseUrl || "";
      packageInfo= mix({lib:"lib", main:"main", pathTransforms:[]}, (isString(packageInfo) ? {name:packageInfo} : packageInfo));
      packageInfo.location= baseUrl + (packageInfo.location ? packageInfo.location : packageInfo.name);
      packageInfo.mapProg= computeMapProg(packageInfo.packageMap);
      var name= packageInfo.name;

      // now that we've got a fully-resolved package object, push it into the configuration
      packages[name]= packageInfo;
      packageMap[name]= name;
    },

    doWork= function(deps, callback, onLoadCallback) {
      ((deps && deps.length) || callback) && req(deps || [], callback || noop);
      onLoadCallback && req.ready(onLoadCallback);
    },

    config= function(config, booting) {
      // mix config into require, but don't trash the pathTransforms
      var p, i, transforms;

      //note: bdLoad ignores requirejs waitSecond; change your code to use "timeout" if required

      // push config into require, but don't step on certain properties that are expected and/or
      // require special processing; notice that client code can use config to hold client
      // configuration switches that have nothing to do with require
      for (p in config) if (!/pathTransforms|paths|packages|packageMap|packagePaths|cache|ready/.test(p)) {
        req[p]= config[p];
      };

      // make sure baseUrl ends with a slash
      if (!req.baseUrl) {
        req.baseUrl= "./";
      } else if (!/\/$/.test(req.baseUrl)) {
        req.baseUrl+= "/";
      }

      // interpret a pathTransforms as items that should be added to the end of the existing map
      for (transforms= config.pathTransforms, i= 0; transforms && i<transforms.length; i++) {
        pathTransforms.push(transforms[i]);
      }

      // push in any paths and recompute the internal pathmap
      pathsMapProg= computeMapProg(mix(paths, config.paths));

      // for each package found in any packages config item, augment the packages map owned by the loader
      forEach(config.packages, fixupPackageInfo);

      // for each packagePath found in any packagePaths config item, augment the packages map owned by the loader
      for (baseUrl in config.packagePaths) {
        forEach(config.packagePaths[baseUrl], function(packageInfo) {
          fixupPackageInfo(packageInfo, baseUrl + "/");
        });
      }

      // mix any packageMap config item and recompute the internal packageMapProg
      packageMapProg= computeMapProg(mix(packageMap, config.packageMap));

      // push in any new cache values
      mix(cache, config.cache);

      if (!booting) {
        doWork(config.deps, config.callback, config.ready);
      }
    };

  // configure the loader; let the user override defaults
  config(defaultConfig, 1);
  config(userConfig, 1);


  // the loader can be defined exactly once; look for global define which is the symbol AMD loaders are
  // *required* to define (as opposed to require, which is optional)
  if (has("loader-node")) {
    if (isFunction(global.define)) {
      console.log("global define already defined; did you try to load multiple AMD loaders?");
      return;
    }
  } else {
    if (isFunction(this.define)) {
      console.error("global define already defined; did you try to load multiple AMD loaders?");
      return;
    }
  }

  // build the basic loader
  var 
    injectDependencies= function(module) {
      forEach(module.deps, injectModule);
    },
  
    contextRequire= function(a1, a2, a3, referenceModule, contextRequire) {
      var module, syntheticMid;
      if (isString(a1)) {
        // signature is (moduleId)
        module= getModule(a1, referenceModule);
        if (module.plugin) {
          injectPlugin(module, true);
        }
        return module.result;
      }
      if (!isArray(a1)) {
        // a1 is a configuration
        config(a1);

        // juggle args; (a2, a3) may be (dependencies, callback)
        a1= a2;
        a2= a3;
      }
      if (isArray(a1)) {
        // signature is (requestList [,callback])

        // resolve the request list with respect to the reference module
        for (var i= 0; i<a1.length; i++) {
          a1[i]= getModule(a1[i], referenceModule);
        }

        // construct a synthetic module to control execution of the requestList, and, optionally, callback
        syntheticMid= uid();
        module= mix(makeModuleInfo("", syntheticMid, "*"+syntheticMid, 0, "", ""), {
          injected:arrived,
          deps:a1,
          def:a2||noop
        });
        injectDependencies(module);
        // try to immediately execute
        if (execModule(module)===abortExec) {
          // some deps weren't on board; therefore, push into the execQ
          execQ.push(module);
        }
      }
      return contextRequire;
    },

    createRequire= function(module) {
      var result= module.require;
      if (!result) {
        result= function(a1, a2, a3) {
          return contextRequire(a1, a2, a3, module, result);
        };
        module.require= mix(result, req);
        result.nameToUrl= result.toUrl= function(name, ext) {
          return nameToUrl(name, ext, module);
        };
        result.toAbsMid= function(mid) {
          return getModuleInfo(mid, module, packages, modules, req.baseUrl, ".", packageMapProg, pathsMapProg, pathTransforms).path;
        };
        if (has("loader-undefApi")) {
          result.undef= function(moduleId) {
           // In order to reload a module, it must be undefined (this routine) and then re-requested.
           // This is useful for testing frameworks (at least).
             var 
               module= getModule(moduleId, module),
               pqn= module.pqn;
             setDel(modules, pqn);
             setDel(waiting, pqn);
             setDel(injectedUrls, module.url);
          };
        }
      }
      return result;
    },

    execQ=
      ///
      // The list of modules that need to be evaluated.
      [],

    waiting= 
      // The set of modules upon which the loader is waiting for definition to arrive
      {},

    execComplete=
      // says the loader has completed (or not) its work
      function() {
        return defQ && !defQ.length && isEmpty(waiting) && !execQ.length;
      },

    runMapProg= function(targetMid, map) {
      // search for targetMid in map; return the map item if found; falsy otherwise
      for (var i= 0; i<map.length; i++) {
        if (map[i][2].test(targetMid)) {
          return map[i];
        }
      }
      return 0;
    },

    compactPath= function(path) {
      while(/\/\.\//.test(path)) path= path.replace(/\/\.\//, "/");
      path= path.replace(/(.*)\/\.$/, "$1");
//TODO why \. in [^\/\.] next
      while(/[^\/\.]+\/\.\./.test(path)) path= path.replace(/[^\/]+\/\.\.\/?/, "");
      return path;
/*
 * TODO: DEL
      if (!/\./.test(path)) {
        // not dots in path; short-circuit return
        return path;
      }
      var 
        parts= path.split("/"),
        result= [],
        segment;
      while (parts.length) {
        segment= parts.shift();
        if (segment=="..") {
          if (result.length && result[result.length-1].charAt(0)!=".") {
            result.pop();
          } else {
            result.push("..");
          }
        } else if (segment!="." || !result.length) {
          result.push(segment);
        }
      }
      return result.join("/");
*/
    },

    transformPath= function(
      path, 
      transforms
    ) {
      for (var i= 0, result= 0, item; !result && i<transforms.length;) {
        item= transforms[i++];
        if (isFunction(item)) {
          result= item(path);
        } else {
          result= item[0].test(path) && path.replace(item[0], item[1]);
        }
      }
      return result;
    },

    makeModuleInfo= function(pid, mid, pqn, pack, path, url) {
      var result= {pid:pid, mid:mid, pqn:pqn, pack:pack, path:path, url:url};
      return result;
    },

    getModuleInfo= function(mid, referenceModule, packages, modules, baseUrl, pageUrl, packageMapProg, pathsMapProg, pathTransforms, alwaysCreate) {
      // arguments are passed instead of using lexical variables so that this function my be used independent of bdLoad (e.g., in bdBuild)
      // alwaysCreate is useful in this case so that getModuleInfo never returns references to real modules owned by the loader
      var pid, pack, pqn, mapProg, mapItem, path, url, result;
      if (/(^\/)|(\:)|(\.[^\/]+$)/.test(mid)) {
        // absolute path or prototcol or file type was given; resolve relative to page location.pathname
        // note: this feature is totally unnecessary; you can get the same effect
        // be giving a relative path off of baseUrl or an absolute path
        url= /^\./.test(mid) ? compactPath(pageUrl + "/" + mid) : mid;
        return makeModuleInfo(0, url, "*" + url, 0, url, url);
      } else {
        if (/^\./.test(mid)) {
          // relative module ids are relative to the referenceModule if provided, otherwise the baseUrl
          mid= referenceModule ? referenceModule.path + "/../" + mid : baseUrl + mid;
        }
        // get rid of all the dots
        path= compactPath(mid);
        // find the package indicated by the module id, if any
        mapProg= referenceModule && referenceModule.pack && referenceModule.pack.mapProg;
        mapItem= (mapProg && runMapProg(path, mapProg)) || runMapProg(path, packageMapProg);
        if (mapItem) {
          // mid specified a module that's a member of a package; figure out the package id and module id
          pid= mapItem[1];
          mid= path.substring(mapItem[3]);
        } else {
          pid= "";
          mid= path;
        }
        pqn= pid + "*" + mid;
        result= modules[pqn];
        if (result) {
          return alwaysCreate ? makeModuleInfo(result.pid, result.mid, result.pqn, result.pack, result.path, result.url) : modules[pqn];
        }
      }
      // get here iff the sought-after module does not yet exist; therefore, we need 
      // to compute the URL url= pathsMap(default) || transformPath(default) || default
      if (pid) {
        pack= packages[pid];
        path= pid + "/" + (mid || pack.main);
        url= pack.location + "/" + (pack.lib ? pack.lib + "/" : "") + (mid || pack.main);
        mapItem= runMapProg(url, pathsMapProg);
        if (mapItem) {
          url= mapItem[1] + url.substring(mapItem[3]-1);
        } else {
          url= transformPath(path, pack.pathTransforms) || url;
        }
      } else {
        mapItem= runMapProg(path, pathsMapProg);
        if (mapItem) {
          url= mapItem[1] + path.substring(mapItem[3]-1);
        } else {
          url= transformPath(path, pathTransforms) || path;
        }
      }
      // if result is not absolute, add baseUrl
      if (!(/(^\/)|(\:)/.test(url))) {
        url= baseUrl + url;
      }
      url+= ".js";
      return makeModuleInfo(pid, mid, pqn, pack, path, compactPath(url));
    },

    getModule= function(mid, referenceModule) {
      // compute and optionally construct (if necessary) the module implied by the mid with respect to referenceModule
      var match, plugin, pluginResource, result, existing, pqn;
      match= mid.match(/^(.+?)\!(.+)$/);
      //TODO: change the regex above to this and test...match= mid.match(/^([^\!]+)\!(.+)$/);
      if (match) {
        // name was <plugin-module>!<plugin-resource>
        plugin= getModule(match[1], referenceModule),
        pluginResource= match[2];
        pqn= plugin.pqn + "!" + (referenceModule ? referenceModule.pqn + "!" : "") + pluginResource;
        return modules[pqn] || (modules[pqn]= {plugin:plugin, mid:pluginResource, req:(referenceModule ? createRequire(referenceModule) : req), pqn:pqn});
      } else {
        result= getModuleInfo(mid, referenceModule, packages, modules, req.baseUrl, ".", packageMapProg, pathsMapProg, pathTransforms);
        return modules[result.pqn] || (modules[result.pqn]= result);
      }
    },

    nameToUrl= req.nameToUrl= req.toUrl= function(name, ext, referenceModule) {
      // slightly different algorithm depending upon whether or not name contains
      // a filetype. This is a requirejs artifact which we don't like.
      var
        match= name.match(/(.+)(\.[^\/]+)$/),
        url= getModuleInfo(match && match[1] || name, referenceModule, packages, modules, req.baseUrl, ".", packageMapProg, pathsMapProg, pathTransforms).url;
      // recall, getModuleInfo always returns a url with a ".js" suffix; therefore, we've got to trim it
      return url.substring(0, url.length-3) + (ext ? ext : (match ? match[2] : ""));
    },
      
    cjsModuleInfo= {
      injected: arrived,
      deps: [],
      executed: 1,
      result: 1
    },
    cjsRequireModule= mix(getModule("require"), cjsModuleInfo),
    cjsExportsModule= mix(getModule("exports"), cjsModuleInfo),
    cjsModuleModule= mix(getModule("module"), cjsModuleInfo),

    // this is a flag to say at least one factory was run during a deps tree
    // traversal
    ranFactory= 0,

    runFactory= function(pqn, factory, args, cjs) {
      if (has("loader-traceApi")) {
        req.trace("loader-runFactory", [pqn]);
      }
      ranFactory= 1;
      return isFunction(factory) ? (factory.apply(null, args) || (cjs && cjs.exports)) : factory;
    },

    abortExec= {},

    evalOrder= 0,

    execModule= function(
      module
    ) {
      // run the dependency vector, then run the factory for module
      if (!module.executed) {
        if (typeof module.def=="undefined") {
          return abortExec;
        }
        var
          pqn= module.pqn,
          deps= module.deps || [],
          arg, argResult,
          args= [], 
          i= 0;

        if (has("loader-traceApi")) {
          req.trace("loader-execModule", [pqn]);
        }

        // for circular dependencies, assume the first module encountered was executed OK
        // modules that circularly depend on a module that has not run its factory will get
        // the premade cjs.exports===module.result. They can take a reference to this object and/or
        // add properties to it. When the module finally runs its factory, the factory can 
        // read/write/replace this object. Notice that so long as the object isn't replaced, any
        // reference taken earlier while walking the deps list is still valid.
        module.executed= 1;
        while (i<deps.length) {
          arg= deps[i++];
          argResult= ((arg===cjsRequireModule) ? createRequire(module) :
                                                 ((arg===cjsExportsModule) ? module.exports :
                                                                             ((arg===cjsModuleModule) ? module :
                                                                                                        execModule(arg))));
          if (argResult===abortExec) {
            module.executed= 0;
            return abortExec;
          }
          args.push(argResult);
        }
        if (has("loader-catchApi")) {
          try {
            module.result= runFactory(pqn, module.def, args, module.cjs);
          } catch (e) {
            if (!has("loader-errorApi") || !req.onError("loader/exec", [e, pqn].concat(args))) {
              throw e;
            }
          }
        } else {
          module.result= runFactory(pqn, module.def, args, module.cjs);
        }
        module.evalOrder= evalOrder++;
        if (module.loadQ) {
          // this was a plugin module
          var
            q= module.loadQ,
            load= module.load= module.result.load;
          while (q.length) {
            load.apply(null, q.shift());
          }
        }
        if (has("loader-traceApi")) {
          req.trace("loader-execModule-out", [pqn]);
        }
      }
      return module.result;
    },

    checkCompleteRecursiveGuard= 0,

    checkComplete= function() {
      if (checkCompleteRecursiveGuard) {
        return;
      }
      checkCompleteRecursiveGuard= 1;

      // keep going through the execQ as long as at least one factory is executed
      ranFactory= 1;
      while (ranFactory) {
        ranFactory= 0;
        for (var result, i= 0; i<execQ.length;) {
          result= execModule(execQ[i]);
          if (result!==abortExec) {
            execQ.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      checkCompleteRecursiveGuard= 0;
      if (has("loader-pageLoadApi")) {
        onLoad();
      }
    };

  req.toAbsMid= function(id) {
    return id;
  };

  if (has("loader-undefApi")) {
    req.undef= function(moduleId) {
     // In order to reload a module, it must be undefined (this routine) and then re-requested.
     // This is useful for testing frameworks (at least).
       var 
         module= getModule(moduleId, 0),
         pqn= module.pqn;
       setDel(modules, pqn);
       setDel(waiting, pqn);
       setDel(injectedUrls, module.url);
    };
  }

  if (has("loader-traceApi")) {
    // these make debugging nice
    var
      symbols= 
        {},

      symbol= function(name) {
        return symbols[name] || (symbols[name]= {value:name});    
      };

    requested =symbol("requested");
    arrived   =symbol("arrived");
    nonmodule =symbol("not-a-module");
  }


  if (has("loader-injectApi")) {
    var
      injectedUrls= 
        ///
        // hash:(pqn)-->(requested | arrived)
        ///
        //note
        // `requested` and `arrived` give "symbol-like" behavior since JavaScript doesn't have symbole; See
        // bd.symbol for an in-depth explanation.
        //
        {},
 
      injectPlugin= function(
        module,
        immediate
      ) {
        // injects the plugin module given by module; may have to inject the plugin itself
        var 
          pqn= module.pqn,
          onload= function(def) {
            mix(module, {executed:1, result:def});           
            setDel(waiting, pqn);
            checkComplete();
          };
        if (cache[pqn]) {
          onload(cache[pqn]);
        } else {
          var plugin= module.plugin;
          if (!plugin.load) {
            if (plugin.executed) {
              plugin.load= plugin.result.load;
            } else if (!immediate) {
              // don't go loading the plugin if were just looking for an immediate
              // make the client properly demand the module
              plugin.loadQ= [];
              plugin.load= function(id, require, callback) {
                plugin.loadQ.push([id, require, callback]);
              };
              injectModule(plugin);
              // try to get plugins executed ASAP since they are presumably needed
              // to load dependencies for other modules
              execQ.unshift(plugin);
            }
          }
          !immediate && setIns(waiting, pqn);
          plugin.load && plugin.load(module.mid, module.req, onload);
        }
      },

      // for IE, injecting a module may result in a recursive execution if the module is in the cache
      // the injecting stack informs define what is currently being injected in such cases
      injecting= [],

      injectModule= function(
        module
      ) {
        // Inject the module. In the browser environment, this means appending a script element into 
        // the head; in other environments, it means loading a file.

        var pqn= module.pqn;
        if (module.injected || waiting[pqn]) {
          return;
        }
        if (module.plugin) {
          injectPlugin(module);
          return;
        }
    
        // a normal module (not a plugin)
        module.injected= requested;
        setIns(waiting, pqn);
        var url= module.url;
        if (injectedUrls[url]) {
          // the script has already been requested (two different modules resolve to the same URL)
          return;
        }
  
        // the url implied by module has not been requested; therefore, request it
        // note that it is possible for two different pqns to imply the same url
        injectedUrls[url]= requested;
        var onLoadCallback= function() { 
          injectedUrls[url]= arrived;
          setDel(waiting, pqn);
          runDefQ(module);
          if (module.injected!==arrived) {
            // the script that contained the module arrived and has been executed yet
            // the injected prop was not advanced to arrived; therefore, onModule must
            // not have been called; therefore, it must not have been a module (it was
            // just some code); adjust state accordingly
            mix(module, {
              injected: arrived,
              deps: [],
              def: nonmodule,
              result: nonmodule
            });
          }
          checkComplete();
        };
        if (cache[pqn]) {
          injecting.push(module);
          cache[pqn].call(null);
          injecting.pop();
          onLoadCallback();
        } else {
          injecting.push(module);
          module.node= req.injectUrl(url, onLoadCallback);
          injecting.pop();
          startTimer();
        }
      },

      defQ= 
        // The queue of define arguments sent to loader.
        [],
  
      defineModule= function(module, deps, def) {
        if (has("loader-traceApi")) {
          req.trace("loader-defineModule", [module, deps]);
        }
  
        var pqn= module.pqn;
        if (module.injected==arrived) {
          req.onError("loader/multiple-define", [pqn]); 
          return module;
        }
        mix(module, {
          injected: arrived,
          deps: deps,
          def: def,
          cjs: {
            id: module.path,
            uri: module.url,
            exports: (module.result= {}),
            setExports: function(exports) {
              module.cjs.exports= exports;
            }
          }
        });

        // resolve deps with respect to pid
        for (var i= 0; i<deps.length; i++) {
          deps[i]= getModule(deps[i], module);
        }
        
        setDel(waiting, pqn);
  
        // don't inject dependencies; wait until the current script has completed executing and then inject. 
        // This allows several definitions to be contained within one script without prematurely requesting
        // resources from the server.

        return module;
      },
  
      runDefQ= function(referenceModule) {
        //defQ is an array of [id, dependencies, factory]
        var
          definedModules= [],
          module, args;
        while (defQ.length) {
          args= defQ.shift();
          // explicit define indicates possible multiple modules in a single file; delay injecting dependencies until defQ fully
          // processed since modules earlier in the queue depend on already-arrived modules that are later in the queue
          // TODO: what if no args[0] and no referenceModule
          module= args[0] && getModule(args[0]) || referenceModule;
          definedModules.push(defineModule(module, args[1], args[2]));
        }
        forEach(definedModules, injectDependencies);
      };
  }
 
  if (has("loader-timeoutApi")) {
    var
      // Timer machinery that monitors how long the loader is waiting and signals
      // an error when the timer runs out.
      timerId=
        0,
  
      clearTimer= function() {
        timerId && clearTimeout(timerId);
        timerId= 0;
      },
  
      startTimer= function() {
        clearTimer();
        req.timeout && (timerId= setTimeout(function() { 
          clearTimer();
          req.onError("loader/timeout", [waiting]); 
        }, req.timeout));
      };
  } else {
    var 
      clearTimer= noop,
      startTimer= noop;
  }

  if (has("dom")) {
    var doc= document;

    if (has("loader-pageLoadApi") || has("loader-injectApi")) {
      var on= function(node, eventName, handler, useCapture, ieEventName) {
        // Add an event listener to a DOM node using the API appropriate for the current browser; 
        // return a function that will disconnect the listener.
        if (has("dom-addEventListener")) {
          node.addEventListener(eventName, handler, !!useCapture);
          return function() {
            node.removeEventListener(eventName, handler, !!useCapture);
          };
        } else {
          if (ieEventName!==false) {
            eventName= ieEventName || "on"+eventName;
            node.attachEvent(eventName, handler);
            return function() {
              node.detachEvent(eventName, handler);
            };
          } else {
            return noop;
          }
        }
      };
    }

    if (has("loader-injectApi")) {
      var head= doc.getElementsByTagName("head")[0] || doc.getElementsByTagName("html")[0];
      req.injectUrl= req.injectUrl || function(url, callback) {
        // Append a script element to the head element with src=url; apply callback upon 
        // detecting the script has loaded.
        var 
          node= doc.createElement("script"),
          onLoad= function(e) {
            e= e || window.event;
            var node= e.target || e.srcElement;
            if (e.type==="load" || /complete|loaded/.test(node.readyState)) {
              disconnector();
              callback && callback();
            }
          },
          disconnector= on(node, "load", onLoad, false, "onreadystatechange");
        node.src= url;
        node.type= "text/javascript";
        node.charset= "utf-8";
        head.appendChild(node);
        return node;
      };  
    }

    if (has("loader-sniffApi")) {
      // TODO: check that requirejs only sniff is not baseUrl
      if (!req.baseUrl) {
        req.baseUrl= "";
        for (var match, src, dataMain, scripts= doc.getElementsByTagName("script"), i= 0; i<scripts.length; i++) {
          src= scripts[i].getAttribute("src") || "";
          if ((match= src.match(/require\.js$/))) {
            req.baseUrl= src.substring(0, match.index) || "./";
            dataMain= scripts[i].getAttribute("data-main");
            if (dataMain) {
              req.deps= req.deps || [dataMain];
            }
            // remember the base node so other machinery can use it to pass parameters (e.g., djConfig)
            req.baseNode= scripts[i];
            break;
          }
        }
      }
    }

    if (has("loader-pageLoadApi")) {
      // page load detect code derived from Dojo, Copyright (c) 2005-2010, The Dojo Foundation. Use, modification, and distribution subject to terms of license.

      //warn
      // document.readyState does not work with Firefox before 3.6. To support
      // those browsers, manually init require.pageLoaded in configuration.
    
      // require.pageLoaded can be set truthy to indicate the app "knows" the page is loaded and/or just wants it to behave as such
      req.pageLoaded= req.pageLoaded || document.readyState=="complete";

      // no need to detect if we already know...
      if (!req.pageLoaded) {
        var
          loadDisconnector= 0,
          DOMContentLoadedDisconnector= 0,
          scrollIntervalId= 0,
          detectPageLoadedFired= 0,
          detectPageLoaded= function() {
            if (detectPageLoadedFired) {
              return;
            }
            detectPageLoadedFired= 1;
      
            if (scrollIntervalId) {
              clearInterval(scrollIntervalId);
              scrollIntervalId = 0;
            }
            loadDisconnector && loadDisconnector();
            DOMContentLoadedDisconnector && DOMContentLoadedDisconnector();
            req.pageLoaded= true;
            onLoad();
          };
      
        if (!req.pageLoaded) {
          loadDisconnector= on(window, "load", detectPageLoaded, false);
          DOMContentLoadedDisconnector= on(doc, "DOMContentLoaded", detectPageLoaded, false, false);
        }

        if (!has("dom-addEventListener")) {
          // note: this code courtesy of James Burke (https://github.com/jrburke/requirejs)
          //DOMContentLoaded approximation, as found by Diego Perini:
          //http://javascript.nwbox.com/IEContentLoaded/
          if (self === self.top) {
            scrollIntervalId = setInterval(function () {
              try {
                //From this ticket:
                //http://bugs.dojotoolkit.org/ticket/11106,
                //In IE HTML Application (HTA), such as in a selenium test,
                //javascript in the iframe can't see anything outside
                //of it, so self===self.top is true, but the iframe is
                //not the top window and doScroll will be available
                //before document.body is set. Test document.body
                //before trying the doScroll trick.
                if (doc.body) {
                  doc.documentElement.doScroll("left");
                  detectPageLoaded();
                }
              } catch (e) {}
            }, 30);
          }
        }
      }

      var 
        loadQ= 
          // The queue of functions waiting to execute as soon as all conditions given
          // in require.onLoad are satisfied; see require.onLoad
          [],

        onLoadRecursiveGuard= 0,
        onLoad= function() {
          while (execComplete() && !checkCompleteRecursiveGuard && !onLoadRecursiveGuard && req.pageLoaded && loadQ.length) {
            //guard against recursions into this function
            onLoadRecursiveGuard= true;
            var f= loadQ.shift();
            if (has("loader-catchApi")) {
              try {
                f();
              } catch (e) {
                onLoadRecursiveGuard= 0;
                if (!req.onError("loader/onLoad", [e])) {
                  throw e;
                }
              }
            } else {
              f();
            }
            onLoadRecursiveGuard= 0;
          }
        };

      req.ready= function(
        context, //(object) The context in which to run execute callback
                 //(function) callback, if context missing
        callback //(function) The function to execute.
      ) {
        ///
        // Add a function to execute on DOM content loaded and all requests have arrived and been evaluated.
        if (callback) {
          loadQ.push(isString(callback) ?
            function() {context[callback]();} :
            function() {callback.call(context);}
          );
        } else {
          loadQ.push(context);
        }
        onLoad();
      };
    } else {
      req.ready= noop;
    }
  }

  if (has("loader-traceApi")) {
    req.trace= function(
      group, // the trace group to which this application belongs
      args   // the contents of the trace
    ) {
      ///
      // Tracing interface by group.
      // 
      // Sends the contents of args to the console iff require.trace[group] is truthy.
      if (req.traceSet[group]) {
        if (has("console-log-apply")) {
          console.log.apply(console, [group+": "].concat(args));
        } else {
          //IE...
          for (var i= 0; i<args.length; i++) {
            console.log(args[i]);
          }
        }
      }
    };
  } else {
    req.trace= req.trace || noop;
  }

  //
  // Error Detection and Recovery
  //
  // Several things can go wrong during loader operation:
  //
  // * A resource may not be accessible, giving a 404 error in the browser or a file error in other environments
  //   (this is usally caught by a loader timeout (see require.timeout) in the browser environment).
  // * The loader may timeout (after the period set by require.timeout) waiting for a resource to be delivered.
  // * Executing a module may cause an exception to be thrown.
  // * Executing the onLoad queue may cause an exception to be thrown.
  // 
  // In all these cases, the loader publishes the problem to interested subscribers via the function require.onError.
  // If the error was an uncaught exception, then if some subscriber signals that it has taken actions to recover 
  // and it is OK to continue by returning truthy, the exception is quashed; otherwise, the exception is rethrown. 
  // Other error conditions are handled as applicable for the particular error.
  if (has("loader-errorApi")) {
    var onError= req.onError= 
      function(
        messageId, //(string) The topic to publish
        args       //(array of anything, optional, undefined) The arguments to be applied to each subscriber.
      ) {
        ///
        // Publishes messageId to all subscribers, passing args; returns result as affected by subscribers.
        ///
        // A listener subscribes by writing
        // 
        //code
        // require.onError.listeners.push(myListener);
        ///
        // The listener signature must be `function(messageId, args`) where messageId indentifies 
        // where the exception was caught and args is an array of information gathered by the catch
        // clause. If the listener has taken corrective actions and want to stop the exception and
        // let the loader continue, it must return truthy. If no listener returns truthy, then
        // the exception is rethrown.
        for (var errorbacks= onError.listeners, result= false, i= 0; i<errorbacks.length; i++) {
          result= result || errorbacks[i](messageId, args);
        }
        console.error(messageId, args);
        onError.log.push(args);
        return result;
      };
    onError.listeners= [];
    onError.log= [];
  } else {
    req.onError= req.onError || noop;
  }

  var def= function(
    mid,          //(commonjs.moduleId, optional) list of modules to be loaded before running factory
    dependencies, //(array of commonjs.moduleId, optional)
    factory       //(any)
  ) {
    ///
    // Advises the loader of a module factory. //Implements http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition.
    ///
    //note
    // CommonJS factory scan courtesy of http://requirejs.org

    var 
      arity= arguments.length,
      args= 0,
      defaultDeps= ["require", "exports", "module"];
    if (arity==3 && dependencies==0) {
      // immediate signature
      execModule(defineModule(getModule(mid), [], factory));
      return;
    }
    if (has("loader-amdFactoryScan")) {
      if (arity==1) {
        dependencies= [];
        mid.toString()
          .replace(/(\/\*([\s\S]*?)\*\/|\/\/(.*)$)/mg, "")
          .replace(/require\(["']([\w\!\-_\.\/]+)["']\)/g, function (match, dep) {
            dependencies.push(dep);
          });
        args= [0, defaultDeps.concat(dependencies), mid];
      }
    }
    if (!args) {
      args= arity==1 ? [0, defaultDeps, mid] :
                       (arity==2 ? (isArray(mid) ? [0, mid, dependencies] : [mid, defaultDeps, dependencies]) :
                                                   [mid, dependencies, factory]);
    }
    if (has("loader-traceApi")) {
      req.trace("loader-define", args.slice(0, 2));
    }
    if (args[0]) {
      // if given a mid, always define the module immediately 
      // (no reason to give auto-detect algorithms below a chance to find an edge case to that doesn't work!)
      injectDependencies(defineModule(getModule(args[0]), args[1], args[2]));
    } else {
      // anonymous module; therefore module id is implied by the resource being loaded
      if (has("dom-addEventListener") || has("loader-node")) {
        // not IE; therefore, onLoad will fire immediately after script finishes being evaluated
        // and the defQ can be run from that callback to detect the module id
        defQ.push(args);
      } else {
        // IE; therefore, cannot depend on 1-to-1, in-order exec of onLoad with script eval and must manually detect here
        var 
          length= injecting.length,
          targetModule= length && injecting[length-1],
          pqn, module;
        if (!targetModule) {
          for (pqn in waiting) {
            module= modules[pqn];
            if (module.node && module.node.readyState === 'interactive') {
              targetModule= module;
              break;
            }
          }
        }
        if (targetModule) {
          injectDependencies(defineModule(targetModule, args[1], args[2]));
        } else {
          req.onError("loader/define-ie");
        }
      }
    }
  };
  
  if (has("loader-createHasModule")) {
    mix(getModule("has"), {injected:arrived, deps:[], executed:1, result:has});
  }

  if (has("loader-publish-privates")) {
    mix(req, {
      // these may be interesting for other modules to use
      isEmpty:isEmpty,
      isFunction:isFunction,
      isString:isString,
      isArray:isArray,
      forEach:forEach,
      setIns:setIns,
      setDel:setDel,
      mix:mix,
      uid:uid,
      on:on,
  
      // these may be interesting to look at when debugging
      paths:paths,
      packages:packages,
      modules:modules,
      execQ:execQ,
      defQ:defQ,
      waiting:waiting,
      injectedUrls:injectedUrls,
      loadQ:loadQ,
  
      // these are used by bdBuild (at least)
      computeMapProg:computeMapProg,
      runMapProg:runMapProg,
      compactPath:compactPath,
      transformPath:transformPath,
      getModuleInfo:getModuleInfo
    });
  }

  if (has("loader-node")) {
    // publish require as a property of define; the node bootstrap will export this and then delete it
    def.require= req;
    global.define= def;
    req.deps= req.deps || [];
  } else {
    define= def;
    require= req;
  }

  if (has("loader-requirejsApi")) {
    req.def= define;
  }

  if (has("loader-injectApi")) {
    doWork(req.deps, req.callback, userConfig.ready);
  } else {
    // the cache holds a map from pqn to {deps, def} of all modules that should be instantiated
    // in this mode, path and url are useless, and therefore not initialized
    (function() {
      var p;
      for (p in cache) {
        modules[p]= cache[p];
      }
      for (p in cache) {
        var module= modules[p];
        module.pqn= p;
        for (var i= 0; i<deps.length; i++) {
          deps[i]= getModule(deps[i], module);
        }
        execQ.push(module);
      }
      doCheckComplete();
    })();
  }
})
// begin default bootstrap configuration
// note: typically, some or all of these arguments are replaced when compiling the loader for a particular target
(
  // the user can send in a configuration by defining a global require object
  this.require || {}, 

  // default configuration
  {
    vendor:"altoviso.com",
    version:"1.0-beta",
    baseUrl:".",
    host:"browser",
    isBrowser:1,
    timeout:0,
    traceSet:{
      // these are listed so its simple to turn them on/off while debugging bdLoad
      "loader-define":0,
      "loader-runFactory":0,
      "loader-execModule":0,
      "loader-execModule-out":0,
      "loader-defineModule":0
    }
  },

  // has.js
  (function() {
    // if has is not provided, define a standard implementation
    // this implementation adopted from https://github.com/phiggins42/has.js
    var
      global= this,
      doc= document,
      element= doc.createElement("div"),
      cache= {
        "dom":1,
        "dom-addEventListener":!!document.addEventListener,
        "console":typeof console!="undefined",
        "console-log-apply":!!(typeof console!="undefined" && console.log && console.log.apply),
        "loader-injectApi":1,
        "loader-timeoutApi":1,
        "loader-traceApi":1,
        "loader-catchApi":1,
        "loader-pageLoadApi":1,
        "loader-errorApi":1,
        "loader-sniffApi":0,
        "loader-undefApi":0,
        "loader-requirejsApi":1,
        "loader-createHasModule":1,
        "loader-amdFactoryScan":1,
        "loader-publish-privates":1,
        "native-xhr":!!this.XMLHttpRequest
      },
      has= function(name) {
        if (typeof cache[name] == "function") {
          cache[name]= cache[name](global, doc, element);
        }
        return cache[name];
      };
      has.cache= cache;
      has.add= function(name, test, now) {
        cache[name]= now ? test(global, doc, element) : test;
      };
      if (this.has) {
        has= this.has;
        for (var p in cache) {
          has.add(p, function(){return cach[p];}, 1);
        }
      }
      return has;
  })()
);
// Copyright (c) 2008-2010, Rawld Gill and ALTOVISO LLC (www.altoviso.com). Use, modification, and distribution subject to terms of license.
