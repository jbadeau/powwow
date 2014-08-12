(function() {
/**
 * almond 0.2.5 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("almond", function(){});

define('mout/lang/kindOf',['require','exports','module'],function (require, exports, module) {

    var _rKind = /^\[object (.*)\]$/,
        _toString = Object.prototype.toString,
        UNDEF;

    /**
     * Gets the "kind" of value. (e.g. "String", "Number", etc)
     */
    function kindOf(val) {
        if (val === null) {
            return 'Null';
        } else if (val === UNDEF) {
            return 'Undefined';
        } else {
            return _rKind.exec( _toString.call(val) )[1];
        }
    }
    module.exports = kindOf;


});

define('mout/lang/isKind',['require','exports','module','./kindOf'],function (require, exports, module) {var kindOf = require('./kindOf');
    /**
     * Check if value is from a specific "kind".
     */
    function isKind(val, kind){
        return kindOf(val) === kind;
    }
    module.exports = isKind;


});

define('mout/lang/isBoolean',['require','exports','module','./isKind'],function (require, exports, module) {var isKind = require('./isKind');
    /**
     */
    function isBoolean(val) {
        return isKind(val, 'Boolean');
    }
    module.exports = isBoolean;


});

define('mout/array/indexOf',['require','exports','module'],function (require, exports, module) {

    /**
     * Array.indexOf
     */
    function indexOf(arr, item, fromIndex) {
        fromIndex = fromIndex || 0;
        var n = arr.length,
            i = fromIndex < 0? n + fromIndex : fromIndex;
        while (i < n) {
            // we iterate over sparse items since there is no way to make it
            // work properly on IE 7-8. see #64
            if (arr[i] === item) {
                return i;
            }
            i += 1;
        }
        return -1;
    }

    module.exports = indexOf;


});

define('mout/array/forEach',['require','exports','module'],function (require, exports, module) {

    /**
     * Array forEach
     */
    function forEach(arr, callback, thisObj) {
        if (arr == null) {
            return;
        }
        var i = -1,
            n = arr.length;
        while (++i < n) {
            // we iterate over sparse items since there is no way to make it
            // work properly on IE 7-8. see #64
            if ( callback.call(thisObj, arr[i], i, arr) === false ) {
                break;
            }
        }
    }

    module.exports = forEach;



});

define('mout/function/prop',['require','exports','module'],function (require, exports, module) {

    /**
     * Returns a function that gets a property of the passed object
     */
    function prop(name){
        return function(obj){
            return obj[name];
        };
    }

    module.exports = prop;



});

define('mout/object/hasOwn',['require','exports','module'],function (require, exports, module) {

    /**
     * Safer Object.hasOwnProperty
     */
     function hasOwn(obj, prop){
         return Object.prototype.hasOwnProperty.call(obj, prop);
     }

     module.exports = hasOwn;



});

define('mout/object/forIn',['require','exports','module'],function (require, exports, module) {

    var _hasDontEnumBug,
        _dontEnums;

    function checkDontEnum(){
        _dontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ];

        _hasDontEnumBug = true;

        for (var key in {'toString': null}) {
            _hasDontEnumBug = false;
        }
    }

    /**
     * Similar to Array/forEach but works over object properties and fixes Don't
     * Enum bug on IE.
     * based on: http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
     */
    function forIn(obj, fn, thisObj){
        var key, i = 0;
        // no need to check if argument is a real object that way we can use
        // it for arrays, functions, date, etc.

        //post-pone check till needed
        if (_hasDontEnumBug == null) checkDontEnum();

        for (key in obj) {
            if (exec(fn, obj, key, thisObj) === false) {
                break;
            }
        }

        if (_hasDontEnumBug) {
            while (key = _dontEnums[i++]) {
                // since we aren't using hasOwn check we need to make sure the
                // property was overwritten
                if (obj[key] !== Object.prototype[key]) {
                    if (exec(fn, obj, key, thisObj) === false) {
                        break;
                    }
                }
            }
        }
    }

    function exec(fn, obj, key, thisObj){
        return fn.call(thisObj, obj[key], key, obj);
    }

    module.exports = forIn;



});

define('mout/object/forOwn',['require','exports','module','./hasOwn','./forIn'],function (require, exports, module) {var hasOwn = require('./hasOwn');
var forIn = require('./forIn');

    /**
     * Similar to Array/forEach but works over object properties and fixes Don't
     * Enum bug on IE.
     * based on: http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
     */
    function forOwn(obj, fn, thisObj){
        forIn(obj, function(val, key){
            if (hasOwn(obj, key)) {
                return fn.call(thisObj, obj[key], key, obj);
            }
        });
    }

    module.exports = forOwn;



});

define('mout/object/matches',['require','exports','module','./forOwn'],function (require, exports, module) {var forOwn = require('./forOwn');

    /**
     * checks if a object contains all given properties/values
     */
    function matches(target, props){
        // can't use "object/every" because of circular dependency
        var result = true;
        forOwn(props, function(val, key){
            if (target[key] !== val) {
                // break loop at first difference
                return (result = false);
            }
        });
        return result;
    }

    module.exports = matches;



});

define('mout/function/makeIterator_',['require','exports','module','./prop','../object/matches'],function (require, exports, module) {var prop = require('./prop');
var matches = require('../object/matches');

    /**
     * Converts argument into a valid iterator.
     * Used internally on most array/object/collection methods that receives a
     * callback/iterator providing a shortcut syntax.
     */
    function makeIterator(src){
        switch(typeof src) {
            case 'object':
                // typeof null == "object"
                return (src != null)? function(val, key, target){
                    return matches(val, src);
                } : src;
            case 'string':
            case 'number':
                return prop(src);
            default:
                return src;
        }
    }

    module.exports = makeIterator;



});

define('mout/array/filter',['require','exports','module','./forEach','../function/makeIterator_'],function (require, exports, module) {var forEach = require('./forEach');
var makeIterator = require('../function/makeIterator_');

    /**
     * Array filter
     */
    function filter(arr, callback, thisObj) {
        callback = makeIterator(callback);
        var results = [];
        forEach(arr, function (val, i, arr) {
            if ( callback.call(thisObj, val, i, arr) ) {
                results.push(val);
            }
        });
        return results;
    }

    module.exports = filter;



});

define('mout/array/unique',['require','exports','module','./indexOf','./filter'],function (require, exports, module) {var indexOf = require('./indexOf');
var filter = require('./filter');

    /**
     * @return {array} Array of unique items
     */
    function unique(arr){
        return filter(arr, isUnique);
    }

    function isUnique(item, i, arr){
        return indexOf(arr, item, i+1) === -1;
    }

    module.exports = unique;



});

define('mout/array/every',['require','exports','module','../function/makeIterator_'],function (require, exports, module) {var makeIterator = require('../function/makeIterator_');

    /**
     * Array every
     */
    function every(arr, callback, thisObj) {
        callback = makeIterator(callback);
        var result = true,
            i = -1,
            n = arr.length;
        while (++i < n) {
            // we iterate over sparse items since there is no way to make it
            // work properly on IE 7-8. see #64
            if (!callback.call(thisObj, arr[i], i, arr) ) {
                result = false;
                break;
            }
        }
        return result;
    }

    module.exports = every;


});

define('mout/array/contains',['require','exports','module','./indexOf'],function (require, exports, module) {var indexOf = require('./indexOf');

    /**
     * If array contains values.
     */
    function contains(arr, val) {
        return indexOf(arr, val) !== -1;
    }
    module.exports = contains;


});

define('mout/array/intersection',['require','exports','module','./unique','./filter','./every','./contains'],function (require, exports, module) {var unique = require('./unique');
var filter = require('./filter');
var every = require('./every');
var contains = require('./contains');


    /**
     * Return a new Array with elements common to all Arrays.
     * - based on underscore.js implementation
     */
    function intersection(arr) {
        var arrs = Array.prototype.slice.call(arguments, 1),
            result = filter(unique(arr), function(needle){
                return every(arrs, function(haystack){
                    return contains(haystack, needle);
                });
            });
        return result;
    }

    module.exports = intersection;



});

define('mout/array/compact',['require','exports','module','./filter'],function (require, exports, module) {var filter = require('./filter');

    /**
     * Remove all null/undefined items from array.
     */
    function compact(arr) {
        return filter(arr, function(val){
            return (val != null);
        });
    }

    module.exports = compact;


});

define('mout/array/remove',['require','exports','module','./indexOf'],function (require, exports, module) {var indexOf = require('./indexOf');

    /**
     * Remove a single item from the array.
     * (it won't remove duplicates, just a single item)
     */
    function remove(arr, item){
        var idx = indexOf(arr, item);
        if (idx !== -1) arr.splice(idx, 1);
    }

    module.exports = remove;


});

define('mout/object/keys',['require','exports','module','./forOwn'],function (require, exports, module) {var forOwn = require('./forOwn');

    /**
     * Get object keys
     */
     var keys = Object.keys || function (obj) {
            var keys = [];
            forOwn(obj, function(val, key){
                keys.push(key);
            });
            return keys;
        };

    module.exports = keys;



});

define('mout/object/size',['require','exports','module','./forOwn'],function (require, exports, module) {var forOwn = require('./forOwn');

    /**
     * Get object size
     */
    function size(obj) {
        var count = 0;
        forOwn(obj, function(){
            count++;
        });
        return count;
    }

    module.exports = size;



});

/*jshint regexp:false*/

define('lib/functionMeta',[], function () {

    'use strict';

    /**
     * Extract meta data from a function.
     * It returns an object containing the number of normal arguments, the number
     * of optional arguments, the function signature, the function name and the visibility.
     *
     * Will return null if the function arguments are invalid.
     *
     * @param {Function} func The function
     * @param {String}   name The name of the function
     *
     * @return {Object|null} An object containg the function metadata
     */
    function functionMeta(func, name) {
        var matches = /^function(\s+[a-zA-Z0-9_\$]*)*\s*\(([^\(]*)\)/m.exec(func.toString()),
            ret,
            split,
            optionalReached = false,
            length,
            x;

        // Analyze arguments
        if (!matches) {
            return null;
        }

        split = (matches[2] || '').split(/\s*,\s*/gm);
        length = split.length;

        ret = { mandatory: 0, optional: 0, signature: '' };

        if (split[0] !== '') {
            for (x = 0; x < length; x += 1) {
                if (split[x].charAt(0) === '$') {
                    ret.optional += 1;
                    ret.signature += split[x] + ', ';
                    optionalReached = true;
                } else if (!optionalReached) {
                    ret.mandatory += 1;
                    ret.signature += split[x] + ', ';
                } else {
                    return null;
                }
            }

            ret.signature = ret.signature.substr(0, ret.signature.length - 2);
        }

        // Analyze visibility
        if (name) {
            if (name.charAt(0) === '_') {
                if (name.charAt(1) === '_') {
                    ret.isPrivate = true;
                } else {
                    ret.isProtected = true;
                }
            } else {
                ret.isPublic = true;
            }
        }

        return ret;
    }

    return functionMeta;
});

define('mout/lang/isNumber',['require','exports','module','./isKind'],function (require, exports, module) {var isKind = require('./isKind');
    /**
     */
    function isNumber(val) {
        return isKind(val, 'Number');
    }
    module.exports = isNumber;


});

define('mout/lang/isString',['require','exports','module','./isKind'],function (require, exports, module) {var isKind = require('./isKind');
    /**
     */
    function isString(val) {
        return isKind(val, 'String');
    }
    module.exports = isString;


});

define('lib/isImmutable',[
    'mout/lang/isNumber',
    'mout/lang/isString',
    'mout/lang/isBoolean'
], function (
    isNumber,
    isString,
    isBoolean
) {

    'use strict';

    /**
     * Checks if a value is immutable.
     *
     * @param {Mixed} value The value
     *
     * @return {Boolean} True if it is, false otherwise
     */
    function isImmutable(value) {
        return value == null || isBoolean(value) || isNumber(value) || isString(value);
    }

    return isImmutable;
});

define('lib/propertyMeta',['./isImmutable'], function (isImmutable) {

    'use strict';

    /**
     * Extract meta data from a property.
     *
     * @param {Mixed} prop The property
     * @param {String} name The name of the property
     *
     * @return {Object} An object containg the metadata
     */
    function propertyMeta(prop, name) {
        var ret = {};

        // Is it undefined?
        if (prop === undefined) {
            return null;
        }

        // Analyze visibility
        if (name) {
            if (name.charAt(0) === '_') {
                if (name.charAt(1) === '_') {
                    ret.isPrivate = true;
                } else {
                    ret.isProtected = true;
                }
            } else {
                ret.isPublic = true;
            }
        }

        ret.isImmutable = isImmutable(prop);

        return ret;
    }

    return propertyMeta;
});

define('lib/isFunctionCompatible',[], function () {

    'use strict';

    /**
     * Check if a function signature is compatible with another.
     *
     * @param {Function} func1 The function to be checked
     * @param {Function} func2 The function to be compared with
     *
     * @return {Boolean} True if it's compatible, false otherwise
     */
    function isFunctionCompatible(func1, func2) {
        return func1.mandatory === func2.mandatory && func1.optional >= func2.optional;
    }

    return isFunctionCompatible;
});

define('mout/array/append',['require','exports','module'],function (require, exports, module) {

    /**
     * Appends an array to the end of another.
     * The first array will be modified.
     */
    function append(arr1, arr2) {
        var pad = arr1.length,
            i = -1,
            n = arr2.length;
        while (++i < n) {
            arr1[pad + i] = arr2[i];
        }
        return arr1;
    }
    module.exports = append;


});

define('lib/checkKeywords',[
    'mout/object/hasOwn',
    'mout/array/append'
], function (
    hasOwn,
    append
) {

    'use strict';

    var reservedNormal = ['$constructor', '$initializing', '$static', '$self', '$super', '$underStrict'],
        reservedAll = append(['initialize'], reservedNormal),
        reservedStatics = ['$parent', '$super', '$self', '$static', 'extend'];

    /**
     * Verify reserved words found in classes/interfaces.
     * The second parameter can be normal or statics.
     * Normal will test for reserved words of the instance.
     * $statics will test for reserved words in the ckass statics.
     *
     * Will throw an error if any reserved key is found.
     *
     * @param {Object} object The object to verify
     * @param {String} [type] The list of reserved word to test (defaults to all)
     */
    function checkKeywords(object, type) {
        var reserved = type === 'normal' || !type ? reservedNormal : (type === 'all' ? reservedAll : reservedStatics),
            x;

        for (x = reserved.length - 1; x >= 0; x -= 1) {
            if (hasOwn(object, reserved[x])) {
                throw new Error('"' + object.$name + '" is using a reserved keyword: ' + reserved[x]);
            }
        }
    }

    return checkKeywords;
});

define('mout/array/some',['require','exports','module','../function/makeIterator_'],function (require, exports, module) {var makeIterator = require('../function/makeIterator_');

    /**
     * Array some
     */
    function some(arr, callback, thisObj) {
        callback = makeIterator(callback);
        var result = false,
            i = -1,
            n = arr.length;
        while (++i < n) {
            // we iterate over sparse items since there is no way to make it
            // work properly on IE 7-8. see #64
            if ( callback.call(thisObj, arr[i], i, arr) ) {
                result = true;
                break;
            }
        }
        return result;
    }

    module.exports = some;


});

define('mout/array/difference',['require','exports','module','./unique','./filter','./some','./contains'],function (require, exports, module) {var unique = require('./unique');
var filter = require('./filter');
var some = require('./some');
var contains = require('./contains');


    /**
     * Return a new Array with elements that aren't present in the other Arrays.
     */
    function difference(arr) {
        var arrs = Array.prototype.slice.call(arguments, 1),
            result = filter(unique(arr), function(needle){
                return !some(arrs, function(haystack){
                    return contains(haystack, needle);
                });
            });
        return result;
    }

    module.exports = difference;



});

define('lib/testKeywords',[
    'mout/array/difference',
    'mout/object/hasOwn'
], function (
    difference,
    hasOwn
) {

    'use strict';

    var keywords = [
        '$name', '$extends', '$implements', '$borrows',
        '$statics', '$finals', '$abstracts', '$constants'
    ];

    /**
     * Tests if an object contains an unallowed keyword in a given context.
     *
     * @param {String} object    The object to verify
     * @param {Array}  [allowed  The list of allowed keywords (defaults to [])
     *
     * @return {Mixed} False if is ok, or the key that is unallowed.
     */
    function testKeywords(object, allowed) {
        var test = allowed ? difference(keywords, allowed) : keywords,
            x;

        for (x = test.length - 1; x >= 0; x -= 1) {
            if (hasOwn(object, test[x])) {
                return test[x];
            }
        }

        return false;
    }

    return testKeywords;
});

define('mout/lang/isFunction',['require','exports','module','./isKind'],function (require, exports, module) {var isKind = require('./isKind');
    /**
     */
    function isFunction(val) {
        return isKind(val, 'Function');
    }
    module.exports = isFunction;


});

define('lib/hasDefineProperty',['mout/lang/isFunction'], function (isFunction) {

    'use strict';

    /**
     * Check if the environment supports Object.hasDefineProperty.
     * There is some quirks related to IE that is handled inside.
     *
     * @return {Boolean} True if it supports, false otherwise
     */
    function hasDefineProperty() {
        if (!isFunction(Object.defineProperty)) {
            return false;
        }

        // Avoid IE8 bug
        try {
            Object.defineProperty({}, 'x', {});
        } catch (e) {
            return false;
        }

        return true;
    }

    return hasDefineProperty();
});
define('lib/isObjectPrototypeSpoiled',[], function () {

    'use strict';

    /**
     * Checks if object prototype has non enumerable properties attached.
     *
     * @return {Boolean} True if it is, false otherwise
     */
    function isObjectPrototypeSpoiled() {
        var obj = {},
            key;

        for (key in obj) {
            if (key) {  // This is just to trick jslint..
                return true;
            }
        }

        return false;
    }

    return isObjectPrototypeSpoiled;
});

define('lib/checkObjectPrototype',[
    './isObjectPrototypeSpoiled',
    'mout/lang/isFunction'
], function (
    isObjectPrototypeSpoiled,
    isFunction
) {

    'use strict';

    /**
     * Checks object prototype, throwing an error if it has enumerable properties.
     * Also seals it, preventing any additions or deletions.
     */
    function checkObjectPrototype() {
        if (isObjectPrototypeSpoiled()) {
            throw new Error('dejavu will not work properly if Object.prototype has enumerable properties!');
        }

        // TODO: should we really do this? the user could legitimately adding non enumerable properties..
        if (isFunction(Object.seal) && !Object.isSealed(Object.prototype)) {
            Object.seal(Object.prototype);
        }
    }

    return checkObjectPrototype;
});

/*global process*/

define('lib/randomAccessor',['mout/array/contains'], function (contains) {

    'use strict';

    var random,
        allowed = ['ClassWrapper', 'InterfaceWrapper', 'AbstractClassWrapper', 'FinalClassWrapper', 'instanceOfWrapper', 'inspectWrapper'],
        nrAllowed = allowed.length,
        nrAccesses = 0;

    if (!(typeof window !== 'undefined' && window.navigator && window.document)) {
        random = process.pid;
    } else {
        random = new Date().getTime() + '_' + Math.floor((Math.random() * 100000000 + 1));
    }

    /**
     * Provides access to a random string that allows acceess to some hidden properties
     * used through this library.
     *
     * @param {Function} caller The function that is trying to access
     *
     * @return {String} The random string
     */
    function randomAccessor(caller) {
        if (nrAccesses > nrAllowed || !contains(allowed, caller)) {
            throw new Error('Can\'t access random identifier.');
        }

        nrAccesses += 1;

        return random;
    }

    return randomAccessor;
});

define('options',[], function () {

    'use strict';

    return {
        locked: true
    };
});

define('mout/object/mixIn',['require','exports','module','./forOwn'],function (require, exports, module) {var forOwn = require('./forOwn');

    /**
    * Combine properties from all the objects into first one.
    * - This method affects target object in place, if you want to create a new Object pass an empty object as first param.
    * @param {object} target    Target Object
    * @param {...object} objects    Objects to be combined (0...n objects).
    * @return {object} Target Object.
    */
    function mixIn(target, objects){
        var i = 0,
            n = arguments.length,
            obj;
        while(++i < n){
            obj = arguments[i];
            if (obj != null) {
                forOwn(obj, copyProp, target);
            }
        }
        return target;
    }

    function copyProp(val, key){
        this[key] = val;
    }

    module.exports = mixIn;


});

define('mout/lang/createObject',['require','exports','module','../object/mixIn'],function (require, exports, module) {var mixIn = require('../object/mixIn');

    /**
     * Create Object using prototypal inheritance and setting custom properties.
     * - Mix between Douglas Crockford Prototypal Inheritance <http://javascript.crockford.com/prototypal.html> and the EcmaScript 5 `Object.create()` method.
     * @param {object} parent    Parent Object.
     * @param {object} [props] Object properties.
     * @return {object} Created object.
     */
    function createObject(parent, props){
        function F(){}
        F.prototype = parent;
        return mixIn(new F(), props);

    }
    module.exports = createObject;



});

define('mout/lang/isObject',['require','exports','module','./isKind'],function (require, exports, module) {var isKind = require('./isKind');
    /**
     */
    function isObject(val) {
        return isKind(val, 'Object');
    }
    module.exports = isObject;


});

define('mout/lang/isArray',['require','exports','module','./isKind'],function (require, exports, module) {var isKind = require('./isKind');
    /**
     */
    var isArray = Array.isArray || function (val) {
        return isKind(val, 'Array');
    };
    module.exports = isArray;


});

define('lib/inspect',[
    './randomAccessor',
    './hasDefineProperty',
    'mout/lang/createObject',
    'mout/lang/isObject',
    'mout/lang/isArray',
    'mout/lang/isFunction',
    'mout/object/hasOwn'
], function (
    randomAccessor,
    hasDefineProperty,
    createObject,
    isObject,
    isArray,
    isFunction,
    hasOwn
) {

    'use strict';

    var random = randomAccessor('inspectWrapper'),
        $class = '$class_' + random,
        $wrapped = '$wrapped_' + random,
        cacheKeyword = '$cache_' + random,
        redefinedCacheKeyword = '$redefined_cache_' + random,
        prev,
        tmp;

    // Function prototype bind shim
    // Can't use mout bind because of IE's
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (context) {
            var fn = this, args = Array.prototype.slice.call(arguments, 1);
            return function () {
                return fn.apply(context, Array.prototype.concat.apply(args, arguments));
            };
        };
    }

    /**
     * Fetches an already inspected target from the cache.
     * Returns null if not in the cache.
     *
     * @param {Object|Function} target The instance or constructor.
     * @param {Array}           cache  The cache
     *
     * @return {Object|Function} The inspected target
     */
    function fetchCache(target, cache) {
        var x,
            length = cache.length,
            curr;

        for (x = 0; x < length; x += 1) {
            curr = cache[x];
            if (curr.target === target) {
                return curr.inspect;
            }
        }

        return null;
    }

    /**
     * Inspects an instance.
     *
     * @param {Object} target The instance
     * @param {Array}  cache  The cache
     *
     * @return {Object} The inspected instance
     */
    function inspectInstance(target, cache) {
        // If browser has no define property it means it is too old and
        // in that case we return the target itself.
        // This could be improved but I think it does not worth the trouble
        if (!hasDefineProperty) {
            return target;
        }

        var def,
            simpleConstructor,
            methodsCache,
            propertiesCache,
            obj,
            tmp,
            key;

        obj = fetchCache(target, cache.instances);
        if (obj) {
            return obj;
        }

        def = target.$static[$class];
        simpleConstructor = def.simpleConstructor;
        methodsCache = target[cacheKeyword].methods;
        propertiesCache = target[cacheKeyword].properties;

        obj = createObject(simpleConstructor.prototype);
        cache.instances.push({ target: target, inspect: obj });

        // Methods
        for (key in target[redefinedCacheKeyword].methods) {
            obj[key] = inspect(methodsCache[key], cache, true);
        }

        // Properties
        for (key in target[redefinedCacheKeyword].properties) {
            tmp = hasOwn(propertiesCache, key) ? propertiesCache[key] : target[key];
            obj[key] = inspect(tmp, cache, true);
        }

        // Handle undeclared properties
        methodsCache = def.methods;
        propertiesCache = def.properties;
        for (key in target) {
            if (hasOwn(target, key) && !hasOwn(obj, key) && !propertiesCache[key] && !methodsCache[key]) {
                obj[key] = inspect(target[key], cache, true);
            }
        }

        // Fix the .constructor
        tmp = obj.constructor.$constructor;
        while (tmp) {
            inspectConstructor(tmp, cache, true);
            tmp = tmp.$parent;
        }

        return obj;
    }

    /**
     * Inspects an constructor.
     *
     * @param {Function} target The constructor
     *
     * @return {Object} The inspected constructor
     */
    function inspectConstructor(target, cache) {
        // If browser has no define property it means it is too old and
        // in that case we return the target itself.
        // This could be improved but I think it does not worth the trouble
        if (!hasDefineProperty) {
            return target;
        }

        var def,
            methodsCache,
            propertiesCache,
            membersCache,
            obj,
            tmp,
            key;

        obj = fetchCache(target, cache.constructors);
        if (obj) {
            return obj;
        }

        def = target[$class];
        obj = def.simpleConstructor;
        methodsCache = target[cacheKeyword].methods;
        propertiesCache = target[cacheKeyword].properties;

        cache.constructors.push({ target: target, inspect: obj });

        // Constructor methods
        for (key in methodsCache) {
            obj[key] = inspect(methodsCache[key], cache, true);
        }

        // Constructor properties
        for (key in propertiesCache) {
            tmp = propertiesCache[key];
            obj[key] = inspect(tmp, cache, true);
        }

        // Handle constructor undeclared properties
        methodsCache = def.methods;
        propertiesCache = def.properties;
        for (key in target) {
            if (hasOwn(target, key) && !hasOwn(obj, key) && !propertiesCache[key] && !methodsCache[key]) {
                obj[key] = inspect(target[key], cache, true);
            }
        }

        obj = obj.prototype;

        // Prototype members
        target = target.prototype;
        membersCache = def.ownMembers;
        methodsCache = def.methods;
        propertiesCache = def.properties;

        for (key in membersCache) {
            tmp = methodsCache[key] ? methodsCache[key].implementation : propertiesCache[key].value;
            obj[key] = inspect(tmp, cache, true);
        }

        // Handle undeclared prototype members
        for (key in target) {
            if (hasOwn(target, key) && !hasOwn(obj, key) && !membersCache[key]) {
                obj[key] = inspect(target[key], cache, true);
            }
        }

        return obj;
    }

    /**
     * Inspects a property, recursively finding for instances/constructors.
     *
     * @param {Object}  prop  The property
     * @param {Array}   cache The cache
     * @param {Boolean} clone True to clone findings, false otherwise
     *
     * @return {Object} The inspected property
     */
    function inspect(prop, cache, clone) {
        var key,
            x,
            length,
            ret;

        cache = cache || {
            others: [],
            instances: [],
            constructors: []
        };

        if (isObject(prop)) {
            // Check if it is an instance
            if (prop.$static) {
                return inspectInstance(prop, cache);
            }

            // Object is a collection
            // Attempt to fetch from cache
            ret = fetchCache(prop, cache.others);
            if (ret) {
                return ret;
            }

            ret = {};
            cache.others.push({ target: prop, inspect: ret });

            // Iterate over each key value of the object, inspecting it
            for (key in prop) {
                ret[key] = inspect(prop[key], cache, clone);
            }

            return ret;
        }

        // Array is a collection
        if (isArray(prop)) {
            // Attempt to fetch from cache
            ret = fetchCache(prop, cache.others);
            if (ret) {
                return ret;
            }

            ret = [];
            cache.others.push({ target: prop, inspect: ret });

            // Iterate over each item of the array, inspecting it
            length = prop.length;
            for (x = 0; x < length; x += 1) {
                ret.push(inspect(prop[x], cache, clone));
            }

            return ret;
        }

        if (isFunction(prop)) {
            // Check if is a constructor
            if (prop[$class]) {
                return inspectConstructor(prop, cache);
            }

            // Otherwise check if it is a wrapper function or a normal one
            return prop[$wrapped] || prop;
        }

        return prop;
    }

    // Add inspect method to the console
    if (typeof console === 'object' && (!console.inspect || !console.inspect.dejavu)) {
        tmp = typeof navigator !== 'undefined' && /msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent);
        prev = console.inspect || (tmp ? console.dir || console.log : console.log);  // console.dir is better in IE

        // Fix for IE..
        if (typeof prev === 'object') {
            prev = Function.prototype.call.bind(prev, console);
        }

        console.inspect = function () {
            var args = [],
                length = arguments.length,
                x;

            for (x = 0; x < length; x += 1) {
                args[x] = inspect(arguments[x]);
            }

            return prev.apply(console, args);
        };
        console.inspect.dejavu = true;
    }
});
define('lib/printWarning',[], function () {

    'use strict';

    /**
     * Simple function to print warning in the console only if the console is available.
     *
     * @param {String} message The message to print
     */
    function printWarning(message) {
        if (typeof console !== 'undefined') {
            console.warn(message);
        }
    }

    return printWarning;
});

define('lib/obfuscateProperty',['./hasDefineProperty'], function (hasDefineProperty) {

    'use strict';

    /**
     * Sets the key of object with the specified value.
     * The property is obfuscated, by not being enumerable, configurable and writable.
     *
     * @param {Object}  obj           The object
     * @param {String}  key           The key
     * @param {Mixed}   value         The value
     * @param {Boolean} [isWritable]  True to be writable, false otherwise (defaults to false)
     * @param {Boolean} [isDeletable] True to be deletable, false otherwise (defaults to false)
     */
    function obfuscateProperty(obj, key, value, isWritable, isDeletable) {
        if (hasDefineProperty) {
            Object.defineProperty(obj, key, {
                value: value,
                configurable: isDeletable || false,
                writable: isWritable || false,
                enumerable: false
            });
        } else {
            obj[key] = value;
        }
    }

    return obfuscateProperty;
});

define('mout/lang/isDate',['require','exports','module','./isKind'],function (require, exports, module) {var isKind = require('./isKind');
    /**
     */
    function isDate(val) {
        return isKind(val, 'Date');
    }
    module.exports = isDate;


});

define('mout/lang/isRegExp',['require','exports','module','./isKind'],function (require, exports, module) {var isKind = require('./isKind');
    /**
     */
    function isRegExp(val) {
        return isKind(val, 'RegExp');
    }
    module.exports = isRegExp;


});

define('mout/array/combine',['require','exports','module','./indexOf'],function (require, exports, module) {var indexOf = require('./indexOf');

    /**
     * Combines an array with all the items of another.
     * Does not allow duplicates and is case and type sensitive.
     */
    function combine(arr1, arr2) {

        var x, length = arr2.length;

        for (x = 0; x < length; x++) {
            if (indexOf(arr1, arr2[x]) === -1) {
                arr1.push(arr2[x]);
            }
        }

        return arr1;
    }
    module.exports = combine;


});

define('mout/lang/isPlainObject',['require','exports','module'],function (require, exports, module) {

    /**
     * Checks if the value is created by the `Object` constructor.
     */
    function isPlainObject(value) {
        return (!!value
            && typeof value === 'object'
            && value.constructor === Object);
    }

    module.exports = isPlainObject;



});

define('mout/lang/clone',['require','exports','module','./kindOf','./isPlainObject','../object/mixIn'],function (require, exports, module) {var kindOf = require('./kindOf');
var isPlainObject = require('./isPlainObject');
var mixIn = require('../object/mixIn');

    /**
     * Clone native types.
     */
    function clone(val){
        switch (kindOf(val)) {
            case 'Object':
                return cloneObject(val);
            case 'Array':
                return cloneArray(val);
            case 'RegExp':
                return cloneRegExp(val);
            case 'Date':
                return cloneDate(val);
            default:
                return val;
        }
    }

    function cloneObject(source) {
        if (isPlainObject(source)) {
            return mixIn({}, source);
        } else {
            return source;
        }
    }

    function cloneRegExp(r) {
        var flags = '';
        flags += r.multiline ? 'm' : '';
        flags += r.global ? 'g' : '';
        flags += r.ignorecase ? 'i' : '';
        return new RegExp(r.source, flags);
    }

    function cloneDate(date) {
        return new Date(+date);
    }

    function cloneArray(arr) {
        return arr.slice();
    }

    module.exports = clone;



});

define('mout/lang/deepClone',['require','exports','module','./clone','../object/forOwn','./kindOf','./isPlainObject'],function (require, exports, module) {var clone = require('./clone');
var forOwn = require('../object/forOwn');
var kindOf = require('./kindOf');
var isPlainObject = require('./isPlainObject');

    /**
     * Recursively clone native types.
     */
    function deepClone(val, instanceClone) {
        switch ( kindOf(val) ) {
            case 'Object':
                return cloneObject(val, instanceClone);
            case 'Array':
                return cloneArray(val, instanceClone);
            default:
                return clone(val);
        }
    }

    function cloneObject(source, instanceClone) {
        if (isPlainObject(source)) {
            var out = {};
            forOwn(source, function(val, key) {
                this[key] = deepClone(val, instanceClone);
            }, out);
            return out;
        } else if (instanceClone) {
            return instanceClone(source);
        } else {
            return source;
        }
    }

    function cloneArray(arr, instanceClone) {
        var out = [],
            i = -1,
            n = arr.length,
            val;
        while (++i < n) {
            out[i] = deepClone(arr[i], instanceClone);
        }
        return out;
    }

    module.exports = deepClone;




});

define('lib/mixIn',[], function () {

    'use strict';

    /**
     * This method does exactly the same as the mout counterpart but
     * does not perform hasOwn for each key in the objects.
     * This is only done because the object prototype is guaranteed to be sealed.
     * There is other ones that could be also optimized, but this is the most used
     * one in the loose version.
     *
     * @param {object}    target  Target Object
     * @param {...object} objects Objects to be combined (0...n objects)
     *
     * @return {object} Target Object
     */
    function mixIn(target, objects) {
        var x,
            length = arguments.length,
            key,
            curr;

        for (x = 1; x < length; x += 1) {
            curr = arguments[x];
            for (key in arguments[x]) {
                target[key] = curr[key];
            }
        }

        return target;
    }

    return mixIn;
});

define('mout/function/bind',['require','exports','module'],function (require, exports, module) {

    function slice(arr, offset){
        return Array.prototype.slice.call(arr, offset || 0);
    }

    /**
     * Return a function that will execute in the given context, optionally adding any additional supplied parameters to the beginning of the arguments collection.
     * @param {Function} fn  Function.
     * @param {object} context   Execution context.
     * @param {rest} args    Arguments (0...n arguments).
     * @return {Function} Wrapped Function.
     */
    function bind(fn, context, args){
        var argsArr = slice(arguments, 2); //curried args
        return function(){
            return fn.apply(context, argsArr.concat(slice(arguments)));
        };
    }

    module.exports = bind;



});

define('mout/lang/toArray',['require','exports','module','./kindOf'],function (require, exports, module) {var kindOf = require('./kindOf');

    var _win = this;

    /**
     * Convert array-like object into array
     */
    function toArray(val){
        var ret = [],
            kind = kindOf(val),
            n;

        if (val != null) {
            if ( val.length == null || kind === 'String' || kind === 'Function' || kind === 'RegExp' || val === _win ) {
                //string, regexp, function have .length but user probably just want
                //to wrap value into an array..
                ret[ret.length] = val;
            } else {
                //window returns true on isObject in IE7 and may have length
                //property. `typeof NodeList` returns `function` on Safari so
                //we can't use it (#58)
                n = val.length;
                while (n--) {
                    ret[n] = val[n];
                }
            }
        }
        return ret;
    }
    module.exports = toArray;


});

define('mout/array/insert',['require','exports','module','./difference','../lang/toArray'],function (require, exports, module) {var difference = require('./difference');
var toArray = require('../lang/toArray');

    /**
     * Insert item into array if not already present.
     */
    function insert(arr, rest_items) {
        var diff = difference(toArray(arguments).slice(1), arr);
        if (diff.length) {
            Array.prototype.push.apply(arr, diff);
        }
        return arr.length;
    }
    module.exports = insert;


});

define('Class',[
    'mout/lang/isBoolean',
    'mout/array/intersection',
    'mout/array/unique',
    'mout/array/compact',
    'mout/array/remove',
    'mout/object/keys',
    'mout/object/size',
    './lib/functionMeta',
    './lib/propertyMeta',
    './lib/isFunctionCompatible',
    './lib/checkKeywords',
    './lib/testKeywords',
    './lib/hasDefineProperty',
    './lib/checkObjectPrototype',
    './lib/randomAccessor',
    './options',
    './lib/inspect',
    './lib/printWarning',
    './lib/obfuscateProperty',
    './lib/isImmutable',
    'mout/lang/isString',
    'mout/lang/isFunction',
    'mout/lang/isObject',
    'mout/lang/isArray',
    'mout/lang/isDate',
    'mout/lang/isRegExp',
    'mout/lang/createObject',
    'mout/object/hasOwn',
    'mout/array/combine',
    'mout/array/contains',
    'mout/lang/deepClone',
    './lib/mixIn',
    'mout/function/bind',
    'mout/lang/toArray',
    'mout/array/insert'
], function ClassWrapper(
    isBoolean,
    intersection,
    unique,
    compact,
    remove,
    keys,
    size,
    functionMeta,
    propertyMeta,
    isFunctionCompatible,
    checkKeywords,
    testKeywords,
    hasDefineProperty,
    checkObjectPrototype,
    randomAccessor,
    options,
    inspect,
    printWarning,
    obfuscateProperty,
    isImmutable,
    isString,
    isFunction,
    isObject,
    isArray,
    isDate,
    isRegExp,
    createObject,
    hasOwn,
    combine,
    contains,
    deepClone,
    mixIn,
    bind,
    toArray,
    insert
) {

    'use strict';

    checkObjectPrototype();

    var createClass,
        Class = {},
        random = randomAccessor('ClassWrapper'),
        $class = '$class_' + random,
        $interface = '$interface_' + random,
        $abstract = '$abstract_' + random,
        $bound = '$bound_' + random,
        $name = '$name_' + random,
        $anonymous = '$anonymous_' + random,
        $wrapped = '$wrapped_' + random,
        cacheKeyword = '$cache_' + random,
        redefinedCacheKeyword = '$redefined_cache_' + random,
        nextId = 0,
        caller = null,
        toStringInstance,
        toStringConstructor,
        glob = typeof window !== 'undefined' && window.navigator && window.document ? window : global;

    /**
     * Function that does exactly the same as the mout counterpart,
     * but is faster in firefox due to a bug:
     * https://bugzilla.mozilla.org/show_bug.cgi?id=816439
     */
    function inheritPrototype(A, B) {
        var F = function () {};
        F.prototype = B.prototype;
        A.prototype = new F();
        A.prototype.constructor = A;
    }

    /**
     * Wraps a method.
     * Makes some aliases, such as $super and $self, work correctly.
     *
     * @param {String}   name        The method name
     * @param {Function} method      The method to wrap
     * @param {Function} constructor The constructor
     *
     * @return {Function} The wrapper
     */
    function wrapMethod(name, method, constructor, isStatic) {
        if (method[$wrapped]) {
            method = method[$wrapped];
        }

        var parentClass = constructor.$parent,
            parentSource = parentClass && (isStatic ? parentClass : parentClass.prototype),
            parentMeta = parentClass && parentClass[$class][isStatic ? 'staticMethods' : 'methods'][name],
            parentLocked = parentClass && parentClass[$class].locked && !parentClass[$class].forceUnlocked,
            parentMethod,
            wrapper;

        if (parentMeta) {
            if (!isStatic && parentMeta.isPrivate && name === 'initialize') {
                parentMethod = callingPrivateConstructor;
                parentSource = null;
            } else {
                parentMethod = parentMeta.implementation;
            }
        } else {
            parentMethod = defaultSuper;
        }

        wrapper = function () {
            var that = this == null || this === glob ? {} : this,
                _super = that.$super,
                _self = that.$self,
                prevCaller,
                ret,
                parent;

            // Use the real source of the method if available, fallbacking to the
            // cached one because private/protected are not on the parent prototype
            // See: https://github.com/IndigoUnited/dejavu/issues/49
            parent = parentLocked || !parentSource ? parentMethod : parentSource[name];

            prevCaller = caller;
            caller = {
                method: method,
                constructor: constructor,
                constructorId: constructor[$class].id
            };
            that.$super = parent;
            that.$self = constructor;

            try {
                ret = method.apply(this, arguments);
            } finally {
                that.$super = _super;
                that.$self = _self;
                caller = prevCaller;
            }

            return ret;
        };

        obfuscateProperty(wrapper, $wrapped, method);

        if (method[$name]) {
            obfuscateProperty(wrapper, $name, method[$name]);
        }

        return wrapper;
    }

    /**
     * Default function to execute when a class atempts to call its parent private constructor.
     */
    function callingPrivateConstructor() {
        /*jshint validthis:true*/
        throw new Error('Cannot call parent constructor in class "' + this.$name + '" because it\'s declared as private.');
    }

    /**
     * Adds a method to a class.
     * This method will throw an error if something is not right.
     * Valid options:
     *   - isStatic: true|false Defaults to false
     *   - isFinal:  true|false Defaults to false
     *   - isConst:  true|false Defaults to false
     *
     * @param {String}   name        The method name
     * @param {Function} method      The method itself
     * @param {Function} constructor The class constructor in which the method metadata will be saved
     * @param {Object}   [opts]      The options, defaults to {}
     */
    function addMethod(name, method, constructor, opts) {
        opts = opts || {};

        var metadata,
            isStatic = !!opts.isStatic,
            forcePublic = !!(opts.forcePublic || constructor[$class].isVanilla),
            isFinal,
            target,
            tmp,
            originalMethod,
            inherited;

        // Unwrap method if already wrapped
        if (method[$wrapped]) {
            method = method[$wrapped];
        }

        // Check if function is already being used by another class or within the same class
        if (method[$name]) {
            if (method[$name] !== name) {
                tmp = method;
                method = function () {
                    return tmp.apply(this, arguments);
                };
                obfuscateProperty(method, $name, name);
            }
        } else {
            obfuscateProperty(method, $name, name);
        }

        // If the initialize is inherited, copy the metadata
        if (!isStatic && name === 'initialize' && method.$inherited) {
            metadata = mixIn({}, constructor.$parent[$class].methods[name]);
            inherited = true;
            delete method.$inherited;
        } else if (opts.metadata) {
            metadata = opts.metadata;
            isFinal = metadata.isFinal;
        } else {
            // Grab function metadata and throw error if is not valid (it's invalid if the arguments are invalid)
            if (method[$wrapped]) {
                throw new Error('Cannot grab metadata from wrapped method.');
            }
            metadata = functionMeta(method, name);
            if (!metadata) {
                throw new Error((isStatic ? 'Static method' : 'Method') + ' "' + name + '" contains optional arguments before mandatory ones in class "' + constructor.prototype.$name + '".');
            }

            metadata.isFinal = isFinal = !!opts.isFinal;

            if (isStatic) {
                if (constructor[$class].staticMethods[name]) {
                    metadata.allowed = constructor[$class].staticMethods[name].allowed;
                }
            } else {
                if (constructor[$class].methods[name]) {
                    metadata.allowed = constructor[$class].methods[name].allowed;
                }
            }
        }

        // Force public if told so
        if (forcePublic) {
            forcePublicMetadata(metadata);
        }

        // Take care of $prefix if the method is initialize
        if (name === 'initialize' && method.$prefix != null) {
            if (method.$prefix === '_') {
                metadata.isProtected = true;
            } else if (method.$prefix === '__') {
                metadata.isPrivate = true;
            }

            delete method.$prefix;
        }

        // Check if it's a private method classified as final
        if (metadata.isPrivate && isFinal) {
            throw new Error('Private method "' + name + '" cannot be classified as final in class "' + constructor.prototype.$name + '".');
        }

        // Check if a property with the same name exists
        target = isStatic ? constructor[$class].staticProperties : constructor[$class].properties;
        if (isObject(target[name])) {
            throw new Error((isStatic ? 'Static method' : 'Method') + ' "' + name + '" is overwriting a ' + (isStatic ? 'static ' : '') + 'property with the same name in class "' + constructor.prototype.$name + '".');
        }

        target = isStatic ? constructor[$class].staticMethods : constructor[$class].methods;

        // Check if the method already exists
        if (isObject(target[name])) {
            if (target[name].forcedPublic) {
                forcePublicMetadata(metadata);
            } else {
                // Are we overriding a private method?
                if (target[name].isPrivate && name !== 'initialize') {
                    throw new Error('Cannot override private ' + (isStatic ? 'static ' : '') + ' method "' + name + '" in class "' + constructor.prototype.$name + '".');
                }
            }

            // Are we overriding a final method?
            if (target[name].isFinal) {
                throw new Error('Cannot override final method "' + name + '" in class "' + constructor.prototype.$name + '".');
            }
            // Are they compatible?
            if (metadata.checkCompatibility && !isFunctionCompatible(metadata, target[name])) {
                throw new Error((isStatic ? 'Static method' : 'Method') + ' "' + name + '(' + metadata.signature + ')" defined in abstract class "' + constructor.prototype.$name + '" overrides its ancestor but it is not compatible with its signature: "' + name + '(' + target[name].signature + ')".');
            }
        }

        target[name] = metadata;

        if (!isStatic) {
            constructor[$class].ownMembers[name] = true;
        }

        originalMethod = method;
        method = wrapMethod(name, method, constructor, isStatic);

        obfuscateProperty(method, $name, name);
        metadata.implementation = method;

        // Add it to the constructor or the prototype only if public
        if (metadata.isPublic || !hasDefineProperty) {
            target = isStatic ? constructor : constructor.prototype;
            target[name] = method;
        }

        // If the function is specified to be bound, add it to the binds
        if (originalMethod[$bound]) {
            if (!isStatic) {
                insert(constructor[$class].binds, name);
            }
            delete originalMethod[$bound];
        }

        if (metadata.isProtected) {
            if (metadata.allowed) {
                insert(metadata.allowed, constructor[$class].id);
            } else {
                metadata.allowed = [constructor[$class].id];
            }
        } else if (metadata.isPrivate) {
            metadata.allowed = constructor[$class].id;
        }
    }

    /**
     * Adds a property to the class methods metadata.
     * This method will throw an error if something is not right.
     * Valid options:
     *   - isStatic: true|false Defaults to false
     *   - isFinal:  true|false Defaults to false
     *   - isConst:  true|false Defaults to false
     *
     * @param {String}   name        The property name
     * @param {Function} value       The property itself
     * @param {Function} constructor The class constructor in which the method metadata will be saved
     * @param {Object}   [opts]      The options (defaults to {})
     */
    function addProperty(name, value, constructor, opts) {
        opts = opts || {};

        var metadata,
            isStatic,
            isFinal,
            isConst,
            forcePublic = !!(opts.forcePublic || constructor[$class].isVanilla),
            target;

        if (opts.metadata) {
            metadata = opts.metadata;
            isFinal = metadata.isFinal;
            isConst = metadata.isConst;
            isStatic = !!opts.isStatic || isConst;
        } else {
            metadata = propertyMeta(value, name);
            if (!metadata) {
                throw new Error('Value of property "' + name + '"  in class "' + constructor.prototype.$name + '" cannot be parsed (undefined values are not allowed).');
            }
            metadata.isFinal = isFinal = !!opts.isFinal;
            metadata.isConst = isConst = !!opts.isConst;
            isStatic = !!opts.isStatic || isConst;

            if (isStatic) {
                if (constructor[$class].staticProperties[name]) {
                    metadata.allowed = constructor[$class].staticProperties[name].allowed;
                }
            } else {
                if (constructor[$class].properties[name]) {
                    metadata.allowed = constructor[$class].properties[name].allowed;
                }
            }
        }

        // Force public if told so
        if (forcePublic) {
            forcePublicMetadata(metadata);
        }

        // Check if the metadata was fine (if not then the property is undefined)
        if (!metadata) {
            throw new Error('Value of ' + (isConst ? 'constant ' : (isStatic ? 'static ' : '')) + ' property "' + name + '" defined in class "' + constructor.prototype.$name + '" can\'t be undefined (use null instead).');
        }
        // Check if its a constant and its value is immutable
        if (isConst && !metadata.isImmutable) {
            throw new Error('Value for constant "' + name + '" defined in class "' + constructor.prototype.$name + '" must be a primitive type (immutable).');
        }
        // Check if it's a private property classified as final
        if (metadata.isPrivate && isFinal) {
            throw new Error((isStatic ? 'Static property' : 'Property') + ' "' + name + '" cannot be classified as final in class "' + constructor.prototype.$name + '".');
        }

        target = isStatic ? constructor[$class].staticMethods : constructor[$class].methods;

        // Check if a method with the same name exists
        if (isObject(target[name])) {
            throw new Error((isConst ? 'Constant property' : (isStatic ? 'Static property' : 'Property')) + ' "' + name + '" is overwriting a ' + (isStatic ? 'static ' : '') + 'method with the same name in class "' + constructor.prototype.$name + '".');
        }

        target = isStatic ? constructor[$class].staticProperties : constructor[$class].properties;

        if (isObject(target[name])) {
            // Force public if told so
            if (target[name].forcedPublic) {
                forcePublicMetadata(metadata);
            } else {
                // Are we overriding a private property?
                if (target[name].isPrivate) {
                    throw new Error('Cannot override private ' + (isConst ? 'constant ' : (isStatic ? 'static ' : '')) + ' property "' + name + ' in class "' + constructor.prototype.$name + '".');
                }
            }
            // Are we overriding a constant?
            if (target[name].isConst) {
                throw new Error('Cannot override constant property "' + name + '" in class "' + constructor.prototype.$name + '".');
            }
            // Are we overriding a final property?
            if (target[name].isFinal) {
                throw new Error('Cannot override final property "' + name + '" in class "' + constructor.prototype.$name + '".');
            }
        }

        target[name] = metadata;
        metadata.value = value;
        if (!isStatic) {
            constructor[$class].ownMembers[name] = true;
        }

        // Add it to the constructor or the prototype only if public
        if (metadata.isPublic || !hasDefineProperty) {
            target = isStatic ? constructor : constructor.prototype;
            target[name] = value;
        }

        if (isFinal) {
            metadata.isFinal = isFinal;
        } else if (isConst) {
            metadata.isConst = isConst;
        }

        if (metadata.isProtected) {
            if (metadata.allowed) {
                insert(metadata.allowed, constructor[$class].id);
            } else {
                metadata.allowed = [constructor[$class].id];
            }
        } else if (metadata.isPrivate) {
            metadata.allowed = constructor[$class].id;
        }
    }

    /**
     * Forces the property/function visibility to public
     *
     * @param  {Object} metadata The member metadata object
     */
    function forcePublicMetadata(metadata) {
        delete metadata.isProtected;
        delete metadata.isPrivate;
        metadata.isPublic = metadata.forcedPublic = true;
    }

    /**
     * Borrows members from a vanilla object definition.
     *
     * @param {Object}   params      The parameters
     * @param {Function} constructor The constructor
     */
    function borrowFromVanilla(params, constructor) {
        // The members borrowed must be interpreted as public
        // This is because they do not use the $binds and maybe calling protected/private members
        // from anonymous functions

        var key,
            value,
            opts = { forcePublic: true };

        // Grab mixin members
        for (key in params) {
            // Ignore the constructor
            if (/^(_){0,2}initialize$/.test(key)) {
                continue;
            }

            value = params[key];

            if (!hasOwn(constructor.prototype, key)) {    // Already defined members are not overwritten
                if (isFunction(value) && !value[$class] && !value[$interface]) {
                    addMethod(key, value, constructor, opts);
                } else {
                    addProperty(key, value, constructor, opts);
                }
            }
        }

        constructor[$class].forceUnlocked = true;
    }

    /**
     * Parse borrows (mixins).
     *
     * @param {Object}   params      The parameters
     * @param {Function} constructor The constructor
     */
    function parseBorrows(params, constructor) {
        if (hasOwn(params, '$borrows')) {
            var current,
                mixins = toArray(params.$borrows),
                i = mixins.length,
                key,
                opts = {};

            // Verify argument type
            if (!i && !isArray(params.$borrows)) {
                throw new Error('$borrows of class "' + constructor.prototype.$name + '" must be a class/object or an array of classes/objects.');
            }
            // Verify duplicate entries
            if (i !== unique(mixins).length && compact(mixins).length === i) {
                throw new Error('There are duplicate entries defined in $borrows of class "' + constructor.prototype.$name + '".');
            }

            for (i -= 1; i >= 0; i -= 1) {
                current = mixins[i];

                // If is a vanilla object
                if (isObject(current)) {
                    if (current.$static) {
                        throw new Error('Entry at index ' + i + ' in $borrows of class "' + constructor.prototype.$name + '" is not a valid class/object.');
                    }
                    borrowFromVanilla(current, constructor);
                    continue;
                }
                // If is a vanilla class
                if (isFunction(current) && !current[$interface]) {
                    if (!current[$class]) {
                        borrowFromVanilla(current.prototype, constructor);
                        continue;
                    }
                } else {
                    throw new Error('Entry at index ' + i + ' in $borrows of class "' + constructor.prototype.$name + '" is not a valid class/object.');
                }

                current = current.prototype;

                // Verify if is an abstract class with unimplemented members
                if (current.$static[$abstract] && current.$static[$abstract].unimplemented) {
                    throw new Error('Entry at index ' + i + ' in $borrows of class "' + constructor.prototype.$name + '" is an abstract class with abstract members, which are not allowed.');
                }

                // Verify if it has parent
                if (current.$static.$parent) {
                    throw new Error('Entry at index ' + i + ' in $borrows of class "' + constructor.prototype.$name + '" is an inherited class (only root classes are supported).');
                }

                delete opts.isStatic;

                // Grab mixin members
                for (key in current.$static[$class].methods) {
                    if (!hasOwn(constructor.prototype, key)) {    // Already defined members are not overwritten
                        // We need to clone the metadata and delete the allowed because otherwise multiple classes borrowing from the same would have access
                        // Same applies to the things bellow
                        opts.metadata = mixIn({}, current.$static[$class].methods[key]);
                        delete opts.metadata.allowed;
                        addMethod(key, opts.metadata.implementation || current[key], constructor, opts);
                    }
                }

                for (key in current.$static[$class].properties) {
                    if (!hasOwn(constructor.prototype, key)) {    // Already defined members are not overwritten
                        opts.metadata = mixIn({}, current.$static[$class].properties[key]);
                        delete opts.metadata.allowed;
                        addProperty(key, opts.metadata.value || current[key], constructor, opts);
                    }
                }

                opts.isStatic = true;

                // Grab mixin static members
                for (key in current.$static[$class].staticMethods) {
                    opts.metadata = mixIn({}, current.$static[$class].staticMethods[key]);
                    delete opts.metadata.allowed;
                    addMethod(key, opts.metadata.implementation || current.$static[key], constructor, opts);
                }

                for (key in current.$static[$class].staticProperties) {
                    opts.metadata = mixIn({}, current.$static[$class].staticProperties[key]);
                    delete opts.metadata.allowed;
                    addProperty(key, opts.metadata.value || current.$static[key], constructor, opts);
                }

                if (current.$static[$class].isVanilla) {
                    constructor[$class].forceUnlocked = true;
                }

                // Merge the binds
                combine(constructor[$class].binds, current.$static[$class].binds);
            }

            delete params.$borrows;
        }
    }

    /**
     * Handle class interfaces.
     *
     * @param {Array}  interfs The array of interfaces
     * @param {Object} target  The target that has the interfaces
     */
    function handleInterfaces(interfs, target) {
        var interfaces = toArray(interfs),
            interf,
            x = interfaces.length,
            k,
            opts = { isConst: true };

        // Verify argument type
        if (!x && !isArray(interfs)) {
            throw new Error('$implements of class "' + target.prototype.$name + '" must be an interface or an array of interfaces.');
        }
        // Verify duplicate interfaces
        if (x !== unique(interfaces).length && compact(interfaces).length === x) {
            throw new Error('There are duplicate entries in $implements of class "' + target.prototype.$name + '".');
        }

        for (x -= 1; x >= 0; x -= 1) {
            interf = interfaces[x];

            // Verify if it's a valid interface
            if (!isFunction(interf) || !interf[$interface]) {
                throw new Error('Entry at index ' + x + ' in $implements of class "' + target.prototype.$name + '" is not a valid interface.');
            }

            // Inherit constants and add interface to the interfaces array
            if (!contains(target[$class].interfaces, interf)) {
                // Inherit constants
                for (k in interf[$interface].constants) {
                    addProperty(k, interf[k], target, opts);
                }

                // Add to interfaces array
                target[$class].interfaces.push(interf);
            }

            if (!target[$abstract]) {
                interfaces[x][$interface].check(target);
            }
        }
    }

    /**
     * Parse an object members.
     *
     * @param {Object}   params      The parameters
     * @param {Function} constructor The constructor
     * @param {Boolean}  isFinal     Parse the members as finals
     */
    function parseMembers(params, constructor, isFinal) {
        var opts = { isFinal: !!isFinal },
            key,
            value,
            cache = {},
            unallowed;

        // Add each method metadata, verifying its signature
        if (hasOwn(params, '$statics')) {
            // Check if is an object
            if (!isObject(params.$statics)) {
                throw new Error('$statics definition of class "' + params.$name + '" must be an object.');
            }

            // Check reserved keywords
            checkKeywords(params.$statics, 'statics');

            // Check unallowed keywords
            unallowed = testKeywords(params.$statics);
            if (unallowed) {
                throw new Error('$statics ' + (isFinal ? 'inside $finals ' : '') + ' of class "' + constructor.prototype.$name + '" contains an unallowed keyword: "' + unallowed + '".');
            }

            opts.isStatic = true;

            for (key in params.$statics) {
                value = params.$statics[key];

                if (isFunction(value) && !value[$class] && !value[$interface]) {
                    addMethod(key, value, constructor, opts);
                } else {
                    addProperty(key, value, constructor, opts);
                }
            }

            delete opts.isStatic;
            delete params.$statics;
        }

        // Save certain keywords in the cache for the loop bellow to work faster
        if (hasOwn(params, '$implements')) {
            cache.$implements = params.$implements;
            delete params.$implements;
        }

        if (hasOwn(params, '$abstracts')) {
            cache.$abstracts = params.$abstracts;
            delete params.$abstracts;
        }

        for (key in params) {
            value = params[key];

            if (isFunction(value) && !value[$class] && !value[$interface]) {
                addMethod(key, value, constructor, opts);
            } else {
                addProperty(key, value, constructor, opts);
            }
        }

        // Restore from cache
        mixIn(params, cache);
    }

    /**
     * Parse all the class members, including finals, static and constants.
     *
     * @param {Object}   params      The parameters
     * @param {Function} constructor The constructor
     */
    function parseClass(params, constructor) {
        var opts = {},
            key,
            value,
            saved = {},
            unallowed,
            ambiguous;

        // Check and save constants to parse later
        if (hasOwn(params, '$constants')) {
            // Check argument
            if (!isObject(params.$constants)) {
                throw new Error('$constants of class "' + constructor.prototype.$name + '" must be an object.');
            }

            // Check reserved keywords
            checkKeywords(params.$constants, 'statics');

            // Check unallowed keywords
            unallowed = testKeywords(params.$constants);
            if (unallowed) {
                throw new Error('$constants of class "' + constructor.prototype.$name + '" contains an unallowed keyword: "' + unallowed + '".');
            }

            // Check ambiguity
            if (isObject(params.$statics)) {
                ambiguous = intersection(keys(params.$constants), keys(params.$statics));
                if (ambiguous.length) {
                    throw new Error('There are members defined in class "' + constructor.prototype.$name + '" with the same name but with different modifiers: "' + ambiguous.join('", ') + '".');
                }
            }

            saved.$constants = params.$constants;
            delete params.$constants;
        }

        // Check and save finals to parse later
        if (hasOwn(params, '$finals')) {
            // Check argument
            if (!isObject(params.$finals)) {
                throw new Error('$finals of class "' + constructor.prototype.$name + '" must be an object.');
            }

            // Check reserved keywords
            checkKeywords(params.$finals);

            // Check unallowed keywords
            unallowed = testKeywords(params.$finals, ['$statics']);
            if (unallowed) {
                throw new Error('$finals of class "' + constructor.prototype.$name + '" contains an unallowed keyword: "' + unallowed + '".');
            }

            // Check ambiguity
            if (isObject(params.$finals.$statics)) {
                if (isObject(params.$statics)) {
                    ambiguous = intersection(keys(params.$finals.$statics), keys(params.$statics));
                    if (ambiguous.length) {
                        throw new Error('There are members defined in class "' + constructor.prototype.$name + '" with the same name but with different modifiers: "' + ambiguous.join('", ') + '".');
                    }
                }
                if (saved.$constants) {
                    ambiguous = intersection(keys(params.$finals.$statics), keys(saved.$constants));
                    if (ambiguous.length) {
                        throw new Error('There are members defined in class "' + constructor.prototype.$name + '" with the same name but with different modifiers: "' + ambiguous.join('", ') + '".');
                    }
                }
            }
            ambiguous = intersection(keys(params), keys(params.$finals));
            if (ambiguous.length) {
                remove(ambiguous, '$statics');
                if (ambiguous.length) {
                    throw new Error('There are members defined in class "' + constructor.prototype.$name + '" with the same name but with different modifiers: "' + ambiguous.join('", ') + '".');
                }
            }

            saved.$finals = params.$finals;
            delete params.$finals;
        }

        // Check and save locked to parse later
        if (hasOwn(params, '$locked')) {
            if (!isBoolean(params.$locked)) {
                throw new Error('$locked of class "' + constructor.prototype.name + '" must be a boolean.');
            }

            saved.$locked = params.$locked;
            delete params.$locked;
        }

        // Parse members
        parseMembers(params, constructor);

        // Parse constants
        if (saved.$constants) {
            opts.isConst = true;

            for (key in saved.$constants) {
                value = saved.$constants[key];

                addProperty(key, value, constructor, opts);
            }

            delete opts.isConst;
        }

        // Parse finals
        if (saved.$finals) {
            parseMembers(saved.$finals, constructor, true);
        }

        // Parse locked
        if (hasOwn(saved, '$locked')) {
            if (constructor[$class].forceUnlocked && saved.$locked) {
                throw new Error('Class "' + constructor.prototype.$name + '" cannot be locked because it borrows or extends from a vanilla class.');
            }
            if (constructor[$class].locked === false && saved.$locked) {
                throw new Error('Class "' + constructor.prototype.$name + '" inherits from an unlocked class, therefore its subclasses cannot be locked.');
            }
            constructor[$class].locked = !!saved.$locked;
            delete constructor.prototype.$locked;
        } else if (!hasOwn(constructor[$class], 'locked')) {
            constructor[$class].locked = !!options.locked;
        }
    }

    /**
     * Applies the context of given methods in the target.
     *
     * @param {Array}  fns      The array of functions to be bound
     * @param {Object} instance The target instance
     */
    function applyBinds(fns, instance) {
        var i,
            current;

        for (i = fns.length - 1; i >= 0; i -= 1) {
            current = instance[fns[i]];
            instance[fns[i]] = bind(current, instance);
            instance[fns[i]][$name] = current.$name;
        }
    }

    /**
     * Protects a method according to its visibility.
     *
     * @param {String} name     The method name
     * @param {Object} meta     The function meta
     * @param {Object} instance The instance that will have the method
     */
    function protectMethod(name, meta, instance) {
        instance[cacheKeyword].methods[name] = meta.implementation;

        if (meta.isPrivate) {
            Object.defineProperty(instance, name, {
                get: function get() {
                    var method = instance[cacheKeyword].methods[name],
                        isConstructor = name === 'initialize',
                        currCaller;

                    currCaller = caller;

                    if (instance.$initializing || (currCaller && (currCaller.method[$name] || currCaller.method[$anonymous]) && meta.allowed === currCaller.constructorId)) {
                        return method;
                    }

                    if (!isConstructor) {
                        throw new Error('Cannot access private method "' + name + '" of class "' + instance.$name + '".');
                    } else {
                        throw new Error('Constructor of class "' + instance.$name + '" is private.');
                    }
                },
                set: function set(newVal) {
                    if (instance.$initializing || !instance.$static[$class].locked || instance.$static[$class].forceUnlocked) {
                        instance[cacheKeyword].methods[name] = newVal;
                        instance[redefinedCacheKeyword].methods[name] = true; // This is just for the inspect
                    } else {
                        throw new Error('Cannot set private method "' + name + '" of class "' + instance.$name + '".');
                    }
                },
                configurable: false,
                enumerable: true
            });
        } else if (meta.isProtected) {
            Object.defineProperty(instance, name, {
                get: function get() {
                    var method = instance[cacheKeyword].methods[name],
                        isConstructor = name === 'initialize',
                        currCaller;

                    currCaller = caller;

                    if (instance.$initializing || (currCaller && (currCaller.method[$name] || currCaller.method[$anonymous]) && (contains(meta.allowed, currCaller.constructorId) || instance instanceof currCaller.constructor))) {
                        return method;
                    }

                    if (!isConstructor) {
                        throw new Error('Cannot access protected method "' + name + '" of class "' + instance.$name + '".');
                    } else {
                        throw new Error('Constructor of class "' + instance.$name + '" is protected.');
                    }
                },
                set: function set(newVal) {
                    if (instance.$initializing || !instance.$static[$class].locked || instance.$static[$class].forceUnlocked) {
                        instance[cacheKeyword].methods[name] = newVal;
                        instance[redefinedCacheKeyword].methods[name] = true; // This is just for the inspect
                    } else {
                        throw new Error('Cannot set protected method "' + name + '" of class "' + instance.$name + '".');
                    }
                },
                configurable: false,
                enumerable: true
            });
        } else {
            Object.defineProperty(instance, name, {
                get: function get() {
                    return instance[cacheKeyword].methods[name];
                },
                set: function set(newVal) {
                    if (instance.$initializing || !instance.$static[$class].locked || instance.$static[$class].forceUnlocked) {
                        instance[cacheKeyword].methods[name] = newVal;
                        instance[redefinedCacheKeyword].methods[name] = true;
                    } else {
                        throw new Error('Cannot set public method "' + name + '" of class "' + instance.$name + '".');
                    }
                },
                configurable: false,
                enumerable: true
            });
        }
    }

    /**
     * Protects a static method according to its visibility.
     *
     * @param {String}   name        The method name
     * @param {Object}   meta        The function meta
     * @param {Function} constructor The constructor that will have the method
     */
    function protectStaticMethod(name, meta, constructor) {
        constructor[cacheKeyword].methods[name] = meta.implementation;

        if (meta.isPrivate) {
            Object.defineProperty(constructor, name, {
                get: function get() {
                    var method = constructor[cacheKeyword].methods[name],
                        currCaller;

                    currCaller = caller;

                    if (currCaller && (currCaller.method[$name] || currCaller.method[$anonymous]) && meta.allowed === currCaller.constructorId) {
                        return method;
                    }

                    throw new Error('Cannot access private static method "' + name + '" of class "' + constructor.prototype.$name + '".');
                },
                set: function set(newVal) {
                    if (!constructor[$class].locked || constructor[$class].forceUnlocked) {
                        constructor[cacheKeyword].methods[name] = newVal;
                    } else {
                        throw new Error('Cannot set private static method "' + name + '" of class "' + constructor.prototype.$name + '".');
                    }
                },
                configurable: false,
                enumerable: true
            });
        } else if (meta.isProtected) {
            Object.defineProperty(constructor, name, {
                get: function get() {
                    var method = constructor[cacheKeyword].methods[name],
                        currCaller;

                    currCaller = caller;

                    if (currCaller && (currCaller.method[$name] || currCaller.method[$anonymous]) && (contains(meta.allowed, currCaller.constructorId) || constructor.prototype instanceof currCaller.constructor)) {
                        return method;
                    }

                    throw new Error('Cannot access protected static method "' + name + '" of class "' + constructor.prototype.$name + '".');
                },
                set: function set(newVal) {
                    if (!constructor[$class].locked || constructor[$class].forceUnlocked) {
                        constructor[cacheKeyword].methods[name] = newVal;
                    } else {
                        throw new Error('Cannot set protected static method "' + name + '" of class "' + constructor.prototype.$name + '".');
                    }
                },
                configurable: false,
                enumerable: true
            });
        } else {
            Object.defineProperty(constructor, name, {
                get: function get() {
                    return constructor[cacheKeyword].methods[name];
                },
                set: function set(newVal) {
                    if (!constructor[$class].locked || constructor[$class].forceUnlocked) {
                        constructor[cacheKeyword].methods[name] = newVal;
                    } else {
                        throw new Error('Cannot set public static method "' + name + '" of class "' + constructor.prototype.$name + '".');
                    }
                },
                configurable: false,
                enumerable: true
            });
        }
    }

    /**
     * Protects a property according to its visibility.
     *
     * @param {String} name     The property name
     * @param {Object} meta     The property meta
     * @param {Object} instance The instance that will have the property
     */
    function protectProperty(name, meta, instance) {
        if (meta.isPrivate) {
            if (!meta.isImmutable) {
                instance[cacheKeyword].properties[name] = deepClone(meta.value);
                instance[redefinedCacheKeyword].properties[name] = true; // This is just for the inspect
            } else {
                instance[cacheKeyword].properties[name] = meta.value;
            }

            Object.defineProperty(instance, name, {
                get: function get() {
                    var currCaller = caller;

                    if (instance.$initializing || (currCaller && (currCaller.method[$name] || currCaller.method[$anonymous]) && meta.allowed === currCaller.constructorId)) {
                        return instance[cacheKeyword].properties[name];
                    }

                    throw new Error('Cannot access private property "' + name + '" of class "' + instance.$name + '".');
                },
                set: function set(newVal) {
                    var currCaller = caller;

                    if (instance.$initializing || (currCaller && (currCaller.method[$name] || currCaller.method[$anonymous]) && meta.allowed === currCaller.constructorId)) {
                        instance[cacheKeyword].properties[name] = newVal;
                        instance[redefinedCacheKeyword].properties[name] = true;
                    } else {
                        throw new Error('Cannot set private property "' + name + '" of class "' + instance.$name + '".');
                    }
                },
                configurable: false,
                enumerable: true
            });
        } else if (meta.isProtected) {
            if (!meta.isImmutable) {
                instance[cacheKeyword].properties[name] = deepClone(meta.value);
                instance[redefinedCacheKeyword].properties[name] = true; // This is just for the inspect
            } else {
                instance[cacheKeyword].properties[name] = meta.value;
            }

            Object.defineProperty(instance, name, {
                get: function get() {
                    var currCaller = caller;

                    if (instance.$initializing || (currCaller && (currCaller.method[$name] || currCaller.method[$anonymous]) && (contains(meta.allowed, currCaller.constructorId) || instance instanceof currCaller.constructor))) {
                        return instance[cacheKeyword].properties[name];
                    }

                    throw new Error('Cannot access protected property "' + name + '" of class "' + instance.$name + '".');
                },
                set: function set(newVal) {
                    var currCaller = caller;

                    if (instance.$initializing || (currCaller && (currCaller.method[$name] || currCaller.method[$anonymous]) && (contains(meta.allowed, currCaller.constructorId) || instance instanceof currCaller.constructor))) {
                        instance[cacheKeyword].properties[name] = newVal;
                        instance[redefinedCacheKeyword].properties[name] = true;
                    } else {
                        throw new Error('Cannot set protected property "' + name + '" of class "' + instance.$name + '".');
                    }
                },
                configurable: false,
                enumerable: true
            });
        } else if (!meta.isImmutable) {
            instance[name] = deepClone(instance[name]);
            instance[redefinedCacheKeyword].properties[name] = true; // This is just for the inspect
        } else {
            instance[name] = meta.value;
        }
    }

    /**
     * Protects a static property according to its visibility.
     *
     * @param {String}   name        The property name
     * @param {Object}   meta        The property meta
     * @param {Function} constructor The constructor that will have the property
     */
    function protectStaticProperty(name, meta, constructor) {
        constructor[cacheKeyword].properties[name] = meta.value;

        if (meta.isPrivate) {
            Object.defineProperty(constructor, name, {
                get: function get() {
                    var currCaller = caller;

                    if (currCaller && (currCaller.method[$name] || currCaller.method[$anonymous]) && meta.allowed === currCaller.constructorId) {
                        return constructor[cacheKeyword].properties[name];
                    }

                    throw new Error('Cannot access private static property "' + name + '" of class "' + constructor.prototype.$name + '".');
                },
                set: meta.isConst ?
                        function () {
                            throw new Error('Cannot change value of constant property "' + name + '" of class "' + constructor.prototype.$name + '".');
                        } :
                        function set(newVal) {
                            var currCaller = caller;

                            if (currCaller && (currCaller.method[$name] || currCaller.method[$anonymous]) && meta.allowed === currCaller.constructorId) {
                                constructor[cacheKeyword].properties[name] = newVal;
                            } else {
                                throw new Error('Cannot set private property "' + name + '" of class "' + constructor.prototype.$name + '".');
                            }
                        },
                configurable: false,
                enumerable: true
            });
        } else if (meta.isProtected) {
            Object.defineProperty(constructor, name, {
                get: function get() {
                    var currCaller = caller;

                    if (currCaller && (currCaller.method[$name] || currCaller.method[$anonymous]) && (contains(meta.allowed, currCaller.constructorId) || constructor.prototype instanceof currCaller.constructor)) {
                        return constructor[cacheKeyword].properties[name];
                    }

                    throw new Error('Cannot access protected static property "' + name + '" of class "' + constructor.prototype.$name + '".');
                },
                set: meta.isConst ?
                        function () {
                            throw new Error('Cannot change value of constant property "' + name + '" of class "' + constructor.prototype.$name + '".');
                        } :
                        function set(newVal) {
                            var currCaller = caller;

                            if (currCaller && (currCaller.method[$name] || currCaller.method[$anonymous]) && (contains(meta.allowed, currCaller.constructorId) || constructor.prototype instanceof currCaller.constructor)) {
                                constructor[cacheKeyword].properties[name] = newVal;
                            } else {
                                throw new Error('Cannot set protected static property "' + name + '" of class "' + constructor.prototype.$name + '".');
                            }
                        },
                configurable: false,
                enumerable: true
            });
        } else if (meta.isConst) {
            Object.defineProperty(constructor, name, {
                get: function () {
                    return constructor[cacheKeyword].properties[name];
                },
                set: function () {
                    throw new Error('Cannot change value of constant property "' + name + '" of class "' + constructor.prototype.$name + '".');
                },
                configurable: false,
                enumerable: true
            });
        }
    }

    /**
     * Protects an instance.
     *
     * All its methods and properties will be secured according to their visibility.
     *
     * @param {Object} instance The instance to be protected
     */
    function protectInstance(instance) {
        var key;

        obfuscateProperty(instance, cacheKeyword, { properties: {}, methods: {} });
        obfuscateProperty(instance, redefinedCacheKeyword, { properties: {}, methods: {} }); // This is for the inspect

        for (key in instance.$static[$class].methods) {
            protectMethod(key, instance.$static[$class].methods[key], instance);
        }

        for (key in instance.$static[$class].properties) {
            protectProperty(key, instance.$static[$class].properties[key], instance);
        }
    }

    /**
     * Protects a constructor.
     *
     * All its methods and properties will be secured according to their visibility.
     *
     * @param {Function} constructor The constructor to be protected
     */
    function protectConstructor(constructor) {
        var key,
            target,
            meta,
            prototype = constructor.prototype;

        obfuscateProperty(constructor, cacheKeyword, { properties: {}, methods: {} });

        for (key in constructor[$class].staticMethods) {
            protectStaticMethod(key, constructor[$class].staticMethods[key], constructor);
        }

        for (key in constructor[$class].staticProperties) {
            protectStaticProperty(key, constructor[$class].staticProperties[key], constructor);
        }

        // Prevent any properties/methods from being added and deleted to the constructor/prototype
        if (isFunction(Object.seal) && constructor[$class].locked && !constructor[$class].forceUnlocked) {
            Object.seal(constructor);
            Object.seal(prototype);
        }
    }

    /**
     * Builds the constructor function that calls the initialize and do
     * more things internally.
     *
     * @param {Function} constructor The constructor function to assume and fill
     * @param {Boolean}  isAbstract  Treat this class as abstract
     *
     * @return {Function} The constructor function
     */
    function createConstructor(constructor, isAbstract) {
        var Instance = constructor || function Instance() {
            var x,
                tmp;

            // Check if the user forgot the new keyword
            if (!(this instanceof Instance)) {
                throw new Error('Constructor called as a function, use the new keyword instead.');
            }

            // If it's abstract, it cannot be instantiated
            if (isAbstract) {
                throw new Error('An abstract class cannot be instantiated.');
            }

            obfuscateProperty(this, '$initializing', true, true, true);  // Mark it in order to let abstract classes run their initialize
            obfuscateProperty(this, '$super', null, true);               // Add the super to the instance object to speed lookup of the wrapper function
            obfuscateProperty(this, '$self', null, true);                // Add the self to the instance object to speed lookup of the wrapper function

            tmp = this.$static[$class];

            // Apply private/protected members
            if (hasDefineProperty) {
                protectInstance(this);
            } else {
                // Reset some types of the object in order for each instance to have their variables
                for (x in tmp.properties) {
                    if (!tmp.properties[x].isImmutable) {
                        this[x] = deepClone(this[x]);
                    }
                }
            }

            // Apply binds
            if (tmp.binds.length) {
                applyBinds(tmp.binds, this, this);
            }

            delete this.$initializing;

            // Prevent any properties/methods to be added and deleted
            if (!tmp.forceUnlocked && tmp.locked && isFunction(Object.seal)) {
                Object.seal(this);
            }

            // Call initialize
            this.initialize.apply(this, arguments);
        };

        if (!Instance[$class]) {
            obfuscateProperty(Instance, $class, { methods: {}, properties: {}, staticMethods: {}, staticProperties: {}, ownMembers: {}, interfaces: [], binds: [] });
            if (hasDefineProperty) {
                Instance[$class].simpleConstructor = function () {};
                obfuscateProperty(Instance[$class].simpleConstructor, '$constructor', Instance);
            }
        }

        return Instance;
    }

    /**
     * Marks a function as part of the class.
     *
     * @param {Function} func The function
     */
    function doMember(func) {
        /*jshint validthis:true*/
        func = func || this;

        // Check if it is a named func already
        if (func[$name]) {
            return func;
        }

        // Check if outside the instance/class
        if (!caller) {
            throw new Error('Attempting to mark a function as a member outside an instance/class.');
        }

        // Check if already marked as anonymous
        if (func[$anonymous]) {
            throw new Error('Function is already marked as an member.');
        }

        func[$anonymous] = true;
        func = wrapMethod(null, func, caller.constructor);
        func[$anonymous] = true;

        return func;
    }

    /**
     * Default implementation of the super function.
     */
    function defaultSuper() {
        throw new Error('Trying to call $super when there is no parent function.');
    }

    /**
     * Bind.
     * Works for anonymous functions also.
     *
     * @param {Function} func   The function to be bound
     * @param {...mixed} [args] The arguments to also be bound
     *
     * @return {Function} The bound function
     */
    function doBind(func) {
        /*jshint validthis:true*/
        var args = toArray(arguments),
            bound,
            isAnonymous;

        if (this && !func[$wrapped] && this.$static && this.$static[$class]) {
            func[$anonymous] = true;
            func = wrapMethod(null, func, this.$self || this.$static);
            args[0] = func;
            isAnonymous = true;
        }

        args.splice(1, 0, this);
        bound = bind.apply(func, args);
        if (isAnonymous) {
            bound[$anonymous] = func[$anonymous] = true;
        }

        return bound;
    }

    /**
     * Static bind.
     * Works for anonymous functions also.
     *
     * @param {Function} func   The function to be bound
     * @param {...mixed} [args] The arguments to also be bound
     *
     * @return {Function} The bound function
     */
    function doBindStatic(func) {
        /*jshint validthis:true*/
        var args = toArray(arguments),
            bound,
            isAnonymous;

        if (this && !func[$wrapped] && this.$static && this.$static[$class]) {
            func[$anonymous] = true;
            func = wrapMethod(null, func, this.$self || this.$static, true);
            args[0] = func;
            isAnonymous = true;
        }

        args.splice(1, 0, this);
        bound = bind.apply(func, args);
        if (isAnonymous) {
            bound[$anonymous] = func[$anonymous] = true;
        }

        return bound;
    }

    /**
     * Inherits aditional data from the parent, such as metadata, binds and static members.
     *
     * @param {Function} constructor The constructor
     * @param {Function} parent      The parent
     */
    function inheritParent(constructor, parent) {
        var x,
            binds = parent[$class].binds,
            key,
            value,
            classId = constructor[$class].id;

        // Inherit binds
        for (x = binds.length - 1; x >= 0; x -= 1) {
            if (binds[x].substr(0, 2) !== '__') {
                constructor[$class].binds.push(binds[x]);
            }
        }

        // Inherit methods and properties
        for (key in parent[$class].methods) {
            value = parent[$class].methods[key];
            constructor[$class].methods[key] = value;

            if (value.isProtected) {
                value.allowed.push(classId);
            }
        }

        for (key in parent[$class].properties) {
            value = parent[$class].properties[key];
            constructor[$class].properties[key] = value;

            if (value.isProtected) {
                value.allowed.push(classId);
            }
        }

        // Inherit static methods and properties
        for (key in parent[$class].staticMethods) {
            value = parent[$class].staticMethods[key];

            if (!value.isPrivate) {
                constructor[$class].staticMethods[key] = value;
                constructor[key] = value.implementation;

                if (value.isProtected) {
                    value.allowed.push(classId);
                }
            }
        }

        for (key in parent[$class].staticProperties) {
            value = parent[$class].staticProperties[key];

            if (!value.isPrivate) {
                constructor[$class].staticProperties[key] = value;
                constructor[key] = value.value;
                if (value.isProtected) {
                    value.allowed.push(classId);
                }

            }
        }

        // Make inheritance also for the simple constructor (for the inspect)
        if (hasDefineProperty) {
            inheritPrototype(constructor[$class].simpleConstructor, parent[$class].simpleConstructor);
        }

        // Inherit locked and forceUnlocked
        if (hasOwn(parent[$class], 'locked')) {
            constructor[$class].locked = parent[$class].locked;
        }
        if (hasOwn(parent[$class], 'forceUnlocked')) {
            constructor[$class].forceUnlocked = parent[$class].forceUnlocked;
        }

        obfuscateProperty(constructor, '$parent', parent);

        // Inherit implemented interfaces
        constructor[$class].interfaces = [].concat(parent[$class].interfaces);
    }

    /**
     * Function to easily extend another class.
     *
     * @param {Object|Function} params An object containing methods and properties or a function that returns it
     *
     * @return {Function} The new class constructor
     */
    function extend(params, $arg) {
        /*jshint validthis:true*/
        return Class.declare(this, params, $arg);
    }

    /**
     * Method that will print a readable string describing an instance.
     *
     * @return {String} The readable string
     */
    toStringInstance = function () {
        return '[instance #' + this.$name + ']';
    };

    /**
     * Method that will print a readable string describing an instance.
     *
     * @return {String} The readable string
     */
    toStringConstructor = function () {
        return '[constructor #' + this.prototype.$name + ']';
    };

    /**
     * Create a class definition.
     *
     * @param {Object}      params        An object containing methods and properties
     * @param {Constructor} [constructor] Assume the passed constructor
     * @param {Object}      [opts]        Options
     *
     * @return {Function} The constructor
     */
    createClass = function (params, constructor, opts) {
        opts = opts || {};

        var dejavu,
            parent,
            tmp,
            key,
            x,
            found;

        // Validate class name
        if (hasOwn(params, '$name')) {
            if (!isString(params.$name)) {
                throw new Error('Class name must be a string.');
            } else if (/\s+/.test(params.$name)) {
                throw new Error('Class name cannot have spaces.');
            }
        } else {
            params.$name = 'Unnamed';
        }

        // Verify if the class has abstract methods but is not defined as abstract
        if (hasOwn(params, '$abstracts') && !opts.isAbstract) {
            throw new Error('Class "' + params.$name + '" has abstract methods, therefore it must be defined as abstract.');
        }

        // Verify if initialize is a method (only for non vanilla classes)
        if (!opts.isVanilla) {
            tmp = ['__', '_', ''];
            found = false;
            for (x = tmp.length - 1; x >= 0; x -= 1) {
                key = tmp[x] + 'initialize';
                if (hasOwn(params, key)) {
                    if (!isFunction(params[key])) {
                        throw new Error('The "' + key + '" member of class "' + params.$name + '" must be a function.');
                    }
                    if (found) {
                        throw new Error('Several constructors with different visibility where found in class "' + params.$name + '".');
                    }
                    found = true;

                    // Mark the initialize method with its real prefix to be used later to protect the method
                    params[key].$prefix = tmp[x];
                }
            }
        }

        // Verify reserved words
        checkKeywords(params, 'normal');

        if (hasOwn(params, '$extends')) {
            parent = params.$extends;
            delete params.$extends;

            // Verify if parent is a valid class
            if (isFunction(parent) && !parent[$interface]) {
                // If its a vanilla class create a dejavu class based on it
                if (!parent[$class]) {
                    parent = createClass(parent.prototype, parent, { isVanilla: true });
                }

                // Verify if we are inheriting a final class
                if (parent[$class].finalClass) {
                    throw new Error('Class "' + params.$name + '" cannot inherit from final class "' + parent.prototype.$name + '".');
                }
            } else {
                throw new Error('Specified parent class in $extends of "' + params.$name + '" is not a valid class.');
            }

            dejavu = createConstructor(constructor, opts.isAbstract);
            dejavu[$class].id = nextId += 1;

            if (opts.isVanilla) {
                params.initialize = function () { dejavu.apply(this, arguments); };
                dejavu[$class].forceUnlocked = true;
                dejavu[$class].isVanilla = true;
            } else if (!params.initialize && !params._initialize && !params.__initialize) {
                params.initialize = function () { parent.prototype.initialize.apply(this, arguments); };
                params.initialize.$inherited = true;
            } else {
                params.initialize = params.initialize || params._initialize || params.__initialize;
            }
            inheritPrototype(dejavu, parent);
            inheritParent(dejavu, parent);
        } else {
            dejavu = createConstructor(constructor, opts.isAbstract);
            dejavu[$class].id = nextId += 1;

            if (opts.isVanilla) {
                params.initialize = function () { dejavu.apply(this, arguments); };
                dejavu[$class].forceUnlocked = true;
                dejavu[$class].isVanilla = true;
            } else {
                params.initialize = params.initialize || params._initialize || params.__initialize || function () {};
            }
        }

        if (!opts.isVanilla) {
            delete params._initialize;
            delete params.__initialize;
        }

        if (opts.isAbstract) {
            obfuscateProperty(dejavu, $abstract, true, true); // Signal it has abstract
        }

        dejavu.prototype.$name = params.$name;
        delete params.$name;

        // Parse mixins
        parseBorrows(params, dejavu);

        // Parse class members
        parseClass(params, dejavu);

        // Assign aliases
        obfuscateProperty(dejavu.prototype, '$static', dejavu);
        obfuscateProperty(dejavu, '$static', dejavu);
        obfuscateProperty(dejavu, '$self', null, true);
        obfuscateProperty(dejavu, '$super', null, true);
        obfuscateProperty(dejavu, '$member', doMember);
        obfuscateProperty(dejavu, '$bind', doBindStatic);
        if (!dejavu.$parent) {
            obfuscateProperty(dejavu.prototype, '$bind', doBind);
            obfuscateProperty(dejavu.prototype, '$member', doMember);
        }

        // Add toString() if not defined yet
        if (params.toString === Object.prototype.toString) {
            obfuscateProperty(dejavu.prototype, 'toString', toStringInstance, true);
        }
        if (dejavu.toString === Function.prototype.toString) {
            obfuscateProperty(dejavu, 'toString', toStringConstructor, true);
        }

        // If we are a concrete class that extends an abstract class, we need to verify the methods existence
        if (parent && parent[$abstract] && !opts.isAbstract) {
            parent[$abstract].check(dejavu);
        }

        // Handle interfaces
        if (hasOwn(params, '$implements')) {
            handleInterfaces(params.$implements, dejavu);
            delete dejavu.prototype.$implements;
        }

        // Remove abstracts reference
        if (hasOwn(params, '$abstracts')) {
            delete params.$abstracts;
        }

        // Supply .extend() to easily extend a class
        dejavu.extend = extend;

        // Prevent any properties/methods to be added and deleted
        if (hasDefineProperty) {
            protectConstructor(dejavu);
        }

        return dejavu;
    };

    /**
     * Function to declare a class.
     * This function can be called with various formats.
     *
     * @param {Function|Object} arg1 A class to extend or an object/function to obtain the members
     * @param {Function|Object} arg2 Object/function to obtain the members
     *
     * @return {Function} The constructor
     */
    Class.declare = function (arg1, arg2, $arg3) {
        var params,
            callable = isFunction(this) ? this : createClass,
            tmp,
            constructor;

        if (arg1 && arg2 && arg2 !== true) {
            if (!isFunction(arg1) || !arg1[$class]) {
                throw new Error('Expected first argument to be a class.');
            }

            // create(parentClass, func | props, true | false)
            if ((tmp = isFunction(arg2)) || $arg3) {
                constructor = createConstructor();
                params = tmp ? arg2(arg1.prototype, arg1, constructor) : arg2;
            // create(parentClass, props, false)
            } else {
                params = arg2;
            }

            if (params.$extends) {
                throw new Error('Object cannot contain an $extends property.');
            }

            params.$extends = arg1;
        // create(func | props, true | false)
        } else if ((tmp = isFunction(arg1)) || arg2) {
            constructor = createConstructor();
            params = tmp ? arg1(constructor) : arg1;
        // create (props)
        } else {
            params = arg1;
        }

        // Validate params as an object
        if (!isObject(params)) {
            throw new Error('Expected class definition to be an object with the class members.');
        }

        return callable(params, constructor);
    };

    // Add a reference to the createFunction method to be used by other files
    obfuscateProperty(Class, '$create', createClass);

    // Add custom bound function to supply binds
    if (!Function.prototype.$bound || !Function.prototype.$bound.dejavu) {
        try {
            obfuscateProperty(Function.prototype, '$bound', function () {
                this[$bound] = true;

                return this;
            });
            Function.prototype.$bound.dejavu = true;
        } catch (e) {
            printWarning('Could not set Function.prototype.$bound.');
        }
    }

    // Add custom bind function to supply binds
    if (!Function.prototype.$bind || !Function.prototype.$bind.dejavu) {
        try {
            obfuscateProperty(Function.prototype, '$bind', function (context) {
                var args = toArray(arguments);
                args.splice(0, 1, this);

                if (isFunction(context)) {
                    return doBindStatic.apply(context, args);
                }

                return doBind.apply(context, args);
            });
            Function.prototype.$bind.dejavu = true;
        } catch (e) {
            printWarning('Could not set Function.prototype.$bind.');
        }
    }

    // Add custom member function to supply marking a function as part of the class
    if (!Function.prototype.$member || !Function.prototype.$member.dejavu) {
        try {
            obfuscateProperty(Function.prototype, '$member', function () {
                return doMember(this);
            });
            Function.prototype.$member.dejavu = true;
        } catch (e) {
            printWarning('Could not set Function.prototype.$member.');
        }
    }

    return Class;
});

/*jshint regexp:false*/

define('lib/isFunctionEmpty',[], function () {

    'use strict';

    /**
     * Check if a function has no body.
     *
     * @param {Function} func The function
     *
     * @return {Boolean} True if it's empty, false otherwise
     */
    function isFunctionEmpty(func) {
        return (/^function\s*\([^\(]*\)\s*\{\s*(["']use strict["'];)?\s*\}$/m).test(func.toString());
    }

    return isFunctionEmpty;
});

define('AbstractClass',[
    'mout/lang/isObject',
    'mout/lang/isFunction',
    'mout/lang/isString',
    'mout/lang/toArray',
    'mout/function/bind',
    './lib/functionMeta',
    './lib/isFunctionEmpty',
    './lib/isFunctionCompatible',
    './lib/checkKeywords',
    './lib/testKeywords',
    './lib/checkObjectPrototype',
    './lib/hasDefineProperty',
    './lib/randomAccessor',
    './lib/mixIn',
    'mout/object/hasOwn',
    'mout/array/insert',
    './Class'
], function AbstractClassWrapper(
    isObject,
    isFunction,
    isString,
    toArray,
    bind,
    functionMeta,
    isFunctionEmpty,
    isFunctionCompatible,
    checkKeywords,
    testKeywords,
    checkObjectPrototype,
    hasDefineProperty,
    randomAccessor,
    mixIn,
    hasOwn,
    insert,
    Class
) {

    'use strict';

    var random = randomAccessor('AbstractClassWrapper'),
        $class = '$class_' + random,
        $interface = '$interface_' + random,
        $abstract = '$abstract_' + random,
        $bound = '$bound_' + random,
        AbstractClass = {};

    checkObjectPrototype();

    /**
     * Add an abstract method to an abstract class.
     * This method will throw an error if something is not right.
     * Valid options:
     *   - isStatic: true|false Defaults to false
     *
     * @param {String}   name        The method name
     * @param {Function} method      The method itself
     * @param {Object}   constructor The class constructor
     * @param {Object}   [opts]      The options, defaults to {}
     */
    function addMethod(name, method, constructor, opts) {
        var metadata,
            isStatic = opts && opts.isStatic,
            target;

        // Check if it is a private member
        if (name.substr(0, 2) === '__') {
            throw new Error('Abstract class "' + constructor.prototype.$name + '" contains an unallowed abstract ' + (isStatic ? 'static ' : '') + 'private method: "' + name + '".');
        }
        // Check if it contains implementation
        if (!isFunctionEmpty(method)) {
            throw new Error((isStatic ? 'Static method' : 'Method') + ' "' + name + '" must be anonymous and contain no implementation in abstract class "' + constructor.prototype.$name + '".');
        }

        target = isStatic ? constructor : constructor.prototype;

        // Check if function is ok
        metadata = functionMeta(method, name);
        if (metadata === null) {
            throw new Error((isStatic ? 'Static method' : 'Method') + ' "' + name + '" contains optional arguments before mandatory ones in abstract class "' + constructor.prototype.$name + '".');
        }

        // Check if a variable exists with the same name
        target = isStatic ? constructor[$class].staticProperties : constructor[$class].properties;
        if (isObject(target[name])) {
            throw new Error('Abstract method "' + name + '" defined in abstract class "' + constructor.prototype.$name + '" conflicts with an already defined property.');
        }


        target = isStatic ? constructor[$class].staticMethods : constructor[$class].methods;

        // Check if it is already implemented
        if (isObject(target[name])) {
            throw new Error('Abstract method "' + name + '" defined in abstract class "' + constructor.prototype.$name + '" seems to be already implemented and cannot be declared as abstract anymore.');
        }

        target = isStatic ? constructor[$abstract].staticMethods : constructor[$abstract].methods;

        // Check if the method already exists and if it's compatible
        if (isObject(target[name])) {
            if (!isFunctionCompatible(metadata, target[name])) {
                throw new Error((isStatic ? 'Static method' : 'Method') + ' "' + name + '(' + metadata.signature + ')" defined in abstract class "' + constructor.prototype.$name + '" overrides its ancestor but it is not compatible with its signature: "' + name + '(' + target[name].signature + ')".');
            }
        }

        if (!isStatic && method[$bound]) {
            insert(constructor[$class].binds, name);
        }

        metadata.checkCompatibility = true;

        target[name] = metadata;
    }

    /**
     * Checks if an abstract class is well implemented in a class.
     * In order to this function to work, it must be bound to an abstract class definition.
     *
     * @param {Function} target The class to be checked
     */
    function checkClass(target) {
        /*jshint validthis:true*/
        var key,
            value;

        // Check normal functions
        for (key in this[$abstract].methods) {

            value = this[$abstract].methods[key];

            if (!target[$class].methods[key]) {
                throw new Error('Class "' + target.prototype.$name + '" does not implement abstract class "' + this.prototype.$name + '" correctly, method "' + key + '" was not found.');
            }
            if (!isFunctionCompatible(target[$class].methods[key], value)) {
                throw new Error('Method "' + key + '(' + target[$class].methods[key].signature + ')" defined in class "' + target.prototype.$name + '" is not compatible with the one found in abstract class "' + this.prototype.$name + '": "' + key + '(' + value.signature + ')".');
            }
        }

        // Check static functions
        for (key in this[$abstract].staticMethods) {

            value = this[$abstract].staticMethods[key];

            if (!target[$class].staticMethods[key]) {
                throw new Error('Class "' + target.prototype.$name + '" does not implement abstract class "' + this.prototype.$name + '" correctly, static method "' + key + '" was not found.');
            }
            if (!isFunctionCompatible(target[$class].staticMethods[key], value)) {
                throw new Error('Static method "' + key + '(' + target[$class].staticMethods[key].signature + ')" defined in class "' + target.prototype.$name + '" is not compatible with the one found in abstract class "' + this.prototype.$name + '": "' + key + '(' + value.signature + ')".');
            }
        }
    }

    /**
     * Parse abstract methods.
     *
     * @param {Object}   abstracts   The object that contains the abstract methods
     * @param {Function} constructor The constructor
     */
    function parseAbstracts(abstracts, constructor) {
        var optsStatic = { isStatic: true },
            key,
            value,
            unallowed;

        // Check argument
        if (!isObject(abstracts)) {
            throw new Error('$abstracts defined in abstract class "' + constructor.prototype.$name + '" must be an object.');
        }

        // Check reserved keywords
        checkKeywords(abstracts);

        // Check unallowed keywords
        unallowed = testKeywords(abstracts, ['$statics']);
        if (unallowed) {
            throw new Error('$statics inside $abstracts of abstract class "' + constructor.prototype.$name + '" contains an unallowed keyword: "' + unallowed + '".');
        }

        if (hasOwn(abstracts, '$statics')) {
            // Check argument
            if (!isObject(abstracts.$statics)) {
                throw new Error('$statics definition in $abstracts of abstract class "' + constructor.prototype.$name + '" must be an object.');
            }

            // Check keywords
            checkKeywords(abstracts.$statics, 'statics');

            // Check unallowed keywords
            unallowed = testKeywords(abstracts.$statics);
            if (unallowed) {
                throw new Error('$statics inside $abstracts of abstract class "' + constructor.prototype.$name + '" contains an unallowed keyword: "' + unallowed + '".');
            }

            for (key in abstracts.$statics) {
                value = abstracts.$statics[key];

                // Check if it is not a function
                if (!isFunction(value) || value[$interface] || value[$class]) {
                    throw new Error('Abstract member "' + key + '" found in abstract class "' + constructor.prototype.$name + '" is not a function.');
                }

                addMethod(key, value, constructor, optsStatic);
            }

            delete abstracts.$statics;
        }

        for (key in abstracts) {
            value = abstracts[key];

            // Check if it is not a function
            if (!isFunction(value) || value[$interface] || value[$class]) {
                throw new Error('Abstract member "' + key + '" found in abstract class "' + constructor.prototype.$name + '" is not a function.');
            }

            addMethod(key, value, constructor);
        }
    }

    /**
     * Parse interfaces.
     *
     * @param {Array}    interfaces  The interfaces
     * @param {Function} constructor The constructor
     */
    function parseInterfaces(interfaces, constructor) {
        var interfs = toArray(interfaces),
            x = interfs.length,
            interf,
            key,
            value;

        for (x -= 1; x >= 0; x -= 1) {
            interf = interfs[x];

            // Grab methods
            for (key in interf[$interface].methods) {

                value = interf[$interface].methods[key];

                 // Check if method is already defined as abstract and is compatible
                if (constructor[$abstract].methods[key]) {
                    if (!isFunctionCompatible(constructor[$abstract].methods[key], value)) {
                        throw new Error('Method "' + key + '( ' + value.signature + ')" described in interface "' + interf.prototype.$name + '" is not compatible with the one already defined in "' + constructor.prototype.$name + '": "' + key + '(' + constructor[$abstract].methods[key].signature + ')".');
                    }
                } else {
                    constructor[$abstract].methods[key] = interf[$interface].methods[key];
                }
            }

            // Grab static methods
            for (key in interf[$interface].staticMethods) {

                value = interf[$interface].staticMethods[key];

                // Check if method is already defined as abstract and is compatible
                if (constructor[$abstract].staticMethods[key]) {
                    if (!isFunctionCompatible(constructor[$abstract].staticMethods[key], value)) {
                        throw new Error('Static method "' + key + '( ' + value.signature + ')" described in interface "' + interf.prototype.$name + '" is not compatible with the one already defined in "' + constructor.prototype.$name + '": "' + key + '(' + constructor[$abstract].staticMethods[key].signature + ')".');
                    }
                } else {
                    constructor[$abstract].staticMethods[key] = value;
                }
            }
        }
    }

    /**
     * Create an abstract class definition.
     *
     * @param {Object}      params        An object containing methods and properties
     * @param {Constructor} [constructor] Assume the passed constructor
     *
     * @return {Function} The constructor
     */
    function createAbstractClass(params, constructor) {
        if (!isObject(params)) {
            throw new Error('Expected abstract class definition to be an object with the abstract class members.');
        }
        // Validate class name
        if (hasOwn(params, '$name')) {
            if (!isString(params.$name)) {
                throw new Error('Abstract class name must be a string.');
            } else if (/\s+/.test(params.$name)) {
                throw new Error('Abstract class name cannot have spaces.');
            }
        } else {
            params.$name = 'Unnamed';
        }

        var def,
            abstractObj = { methods: {}, staticMethods: {}, unimplemented: 0 },
            saved = {},
            key;

        // If we are extending an abstract class also, inherit the abstract methods
        if (isFunction(params.$extends)) {
            if (params.$extends[$abstract]) {
                mixIn(abstractObj.methods, params.$extends[$abstract].methods);
                mixIn(abstractObj.staticMethods, params.$extends[$abstract].staticMethods);
            }
        }

        // Handle abstract methods
        if (hasOwn(params, '$abstracts')) {
            saved.$abstracts = params.$abstracts;     // Save them for later use
        }

        // Handle interfaces
        if (hasOwn(params, '$implements')) {
            saved.$interfaces = params.$implements;   // Save them for later use
        }

        // Create the class definition
        def = Class.$create(params, constructor, { isAbstract: true });

        abstractObj.check = bind(checkClass, def);

        if (hasDefineProperty) {
            Object.defineProperty(def, $abstract, {
                value: abstractObj,
                writable: false
            });
        } else {
            def[$abstract] = abstractObj;
        }

        // Parse the saved interfaces
        if (hasOwn(saved, '$interfaces')) {
            parseInterfaces(saved.$interfaces, def);
        }

        // Parse the abstract methods
        if (hasOwn(saved, '$abstracts')) {
            parseAbstracts(saved.$abstracts, def);
        }

        // Finally update the unimplemented count
        for (key in def[$abstract].methods) {
            if (!def[$class].methods[key]) {
                abstractObj.unimplemented += 1;
            }
        }
        for (key in def[$abstract].staticMethods) {
            if (!def[$class].staticMethods[key]) {
                abstractObj.unimplemented += 1;
            }
        }

        return def;
    }

    /**
     * Function to declare an abstract class.
     * This function can be called with various formats.
     * The first parameter can be a class to extend.
     * The second parameter must be an object containing the class members or a function to obtain it.
     *
     * @param {Function|Object} arg1 A class, an object or a function
     * @param {Function|Object} arg2 Object containing the class members or a function to obtain it.
     *
     * @return {Function} The constructor
     */
    AbstractClass.declare = function (arg1, arg2, $arg3) {
        return Class.declare.call(createAbstractClass, arg1, arg2, $arg3);
    };

    return AbstractClass;
});

define('Interface',[
    'mout/lang/isObject',
    'mout/lang/isArray',
    'mout/lang/isString',
    'mout/function/bind',
    'mout/array/intersection',
    'mout/array/unique',
    'mout/array/compact',
    'mout/object/keys',
    './lib/checkKeywords',
    './lib/testKeywords',
    './lib/functionMeta',
    './lib/isFunctionEmpty',
    './lib/isFunctionCompatible',
    './lib/checkObjectPrototype',
    './lib/obfuscateProperty',
    './lib/randomAccessor',
    './lib/isImmutable',
    './lib/hasDefineProperty',
    './lib/mixIn',
    'mout/lang/isFunction',
    'mout/object/hasOwn',
    'mout/lang/toArray'
], function InterfaceWrapper(
    isObject,
    isArray,
    isString,
    bind,
    intersection,
    unique,
    compact,
    keys,
    checkKeywords,
    testKeywords,
    functionMeta,
    isFunctionEmpty,
    isFunctionCompatible,
    checkObjectPrototype,
    obfuscateProperty,
    randomAccessor,
    isImmutable,
    hasDefineProperty,
    mixIn,
    isFunction,
    hasOwn,
    toArray
) {

    'use strict';

    var random = randomAccessor('InterfaceWrapper'),
        $class = '$class_' + random,
        $interface = '$interface_' + random,
        Interface = {};

    checkObjectPrototype();

    /**
     * Checks if an interface is well implemented in a class.
     * In order to this function to work, it must be bound to an interface definition.
     *
     * @param {Function} target The class to be checked
     */
    function checkClass(target) {
        /*jshint validthis:true*/
        var key,
            value;

        // Check normal functions
        for (key in this[$interface].methods) {
            value = this[$interface].methods[key];

            if (!target[$class].methods[key]) {
                throw new Error('Class "' + target.prototype.$name + '" does not implement interface "' + this.prototype.$name + '" correctly, method "' + key + '" was not found.');
            }
            if (!isFunctionCompatible(target[$class].methods[key], value)) {
                throw new Error('Method "' + key + '(' + target[$class].methods[key].signature + ')" defined in class "' + target.prototype.$name + '" is not compatible with the one found in interface "' + this.prototype.$name + '": "' + key + '(' + value.signature + ')".');
            }
        }

        // Check static functions
        for (key in this[$interface].staticMethods) {

            value = this[$interface].staticMethods[key];

            if (!target[$class].staticMethods[key]) {
                throw new Error('Class "' + target.prototype.$name + '" does not implement interface "' + this.prototype.$name + '" correctly, static method "' + key + '" was not found.');
            }
            if (!isFunctionCompatible(target[$class].staticMethods[key], value)) {
                throw new Error('Static method "' + key + '(' + target[$class].staticMethods[key].signature + ')" defined in class "' + target.prototype.$name + '" is not compatible with the one found in interface "' + this.prototype.$name + '": "' + key + '(' + value.signature + ')".');
            }
        }
    }

    /**
     * Adds a method to an interface.
     * This method will throw an error if something is not right.
     * Valid options:
     *   - isStatic: true|false Defaults to false
     *
     * @param {String}   name   The method name
     * @param {Function} method The method itself
     * @param {Function} interf The interface in which the method metadata will be saved
     * @param {Object}   [opts] The options (defaults to {})
     */
    function addMethod(name, method, interf, opts) {
        var metadata,
            isStatic = opts && opts.isStatic,
            target;

        // Check if it is not a function
        if (!isFunction(method) || method[$interface] || method[$class]) {
            throw new Error('Member "' + name + '" found in interface "' + interf.prototype.$name + '" is not a function.');
        }
        // Check if it is public
        if (name.charAt(0) === '_') {
            throw new Error('Interface "' + interf.prototype.$name + '" contains an unallowed non public method: "' + name + '".');
        }
        // Check if it contains no implementation
        if (!isFunctionEmpty(method)) {
            throw new Error((isStatic ? 'Static method' : 'Method') + ' "' + name + '" must be anonymous and contain no implementation in interface "' + interf.prototype.$name + '".');
        }
        // Check if function is ok
        metadata = functionMeta(method, name);
        if (metadata === null) {
            throw new Error((isStatic ? 'Static method' : 'Method') + ' "' + name + '" contains optional arguments before mandatory ones in interface "' + interf.prototype.$name + '".');
        }

        target = isStatic ? interf[$interface].staticMethods : interf[$interface].methods;

        // Check if the method already exists and it's compatible
        if (isObject(target[name])) {
            if (!isFunctionCompatible(metadata, target[name])) {
                throw new Error((isStatic ? 'Static method' : 'Method') + ' "' + name + '(' + metadata.signature + ')" defined in interface "' + interf.prototype.$name + '" overrides its ancestor but it is not compatible with its signature: "' + name + '(' + target[name].signature + ')".');
            }
        }

        target[name] = metadata;
    }

    /**
     * Assigns a constant to the interface.
     * This method will protect the constant from being changed.
     *
     * @param {String}   name        The constant name
     * @param {Function} value       The constant value
     * @param {Function} interf      The interface in which the constant will be saved
     */
    function assignConstant(name, value, interf) {
        if (hasDefineProperty) {
            Object.defineProperty(interf, name, {
                get: function () {
                    return value;
                },
                set: function () {
                    throw new Error('Cannot change value of constant property "' + name + '" of interface "' + this.prototype.$name + '".');
                },
                configurable: false,
                enumerable: true
            });
        } else {
            interf[name] = value;
        }
    }

    /**
     * Adds a constant to an interface.
     * This method will throw an error if something is not right.
     *
     * @param {String}   name        The constant name
     * @param {Function} value       The constant value
     * @param {Function} interf      The interface in which the constant will be saved
     */
    function addConstant(name, value, interf) {
        var target;

        // Check if it is public
        if (name.charAt(0) === '_') {
            throw new Error('Interface "' + interf.prototype.$name + '" contains an unallowed non public method: "' + name + '".');
        }
        // Check if it is a primitive value
        if (!isImmutable(value)) {
            throw new Error('Value for constant property "' + name + '" defined in interface "' + interf.prototype.$name + '" must be a primitive type.');
        }

        target = interf[$interface].constants;

        // Check if the constant already exists
        if (target[name]) {
            throw new Error('Cannot override constant property "' + name + '" in interface "' + interf.prototype.$name + '".');
        }

        target[name] = true;
        assignConstant(name, value, interf);
    }

    /**
     * Function to easily extend another interface.
     *
     * @param {Object} params An object containing methods and properties
     *
     * @return {Function} The new interface
     */
    function extend(params) {
        /*jshint validthis:true*/
        if (params.$extends) {
            throw new Error('Object passed cannot contain an $extends property.');
        }

        params.$extends = this;

        return Interface.declare(params);
    }

    /**
     * Create an interface definition.
     *
     * @param {Object} params An object containing methods and properties
     *
     * @return {Function} The constructor
     */
    function createInterface(params) {
        // Validate params as an object
        if (!isObject(params)) {
            throw new Error('Expected interface definition to be an object with the interface members.');
        }
        // Validate class name
        if (hasOwn(params, '$name')) {
            if (!isString(params.$name)) {
                throw new Error('Interface name must be a string.');
            } else if (/\s+/.test(params.$name)) {
                throw new Error('Interface name cannot have spaces.');
            }
        } else {
            params.$name = 'Unnamed';
        }

        checkKeywords(params);

        var parents,
            current,
            k,
            i,
            value,
            duplicate,
            opts = {},
            name,
            ambiguous,
            unallowed,
            interf = function () {
                throw new Error('Interfaces cannot be instantiated.');
            };

        obfuscateProperty(interf, $interface, { parents: [], methods: {}, staticMethods: {}, constants: {}, check: bind(checkClass, interf) });
        interf.prototype.$name = params.$name;

        if (hasOwn(params, '$extends')) {
            parents = toArray(params.$extends);
            k = parents.length;

            // Verify argument type
            if (!k && !isArray(params.$extends)) {
                throw new Error('$extends of "' + params.$name + '" seems to point to an nonexistent interface.');
            }
            // Verify duplicate entries
            if (k !== unique(parents).length && compact(parents).length === k) {
                throw new Error('There are duplicate entries defined in $extends of "' + params.$name + '".');
            }

            for (k -= 1; k >= 0; k -= 1) {
                current = parents[k];

                // Check if it is a valid interface
                if (!isFunction(current) || !current[$interface]) {
                    throw new Error('Specified interface in $extends at index ' +  k + ' of "' + params.$name + '" is not a valid interface.');
                }

                // Merge methods
                duplicate = intersection(keys(interf[$interface].methods), keys(current[$interface].methods));
                i = duplicate.length;
                if (i) {
                    for (i -= 1; i >= 0; i -= 1) {
                        if (!isFunctionCompatible(interf[$interface].methods[duplicate[i]], current[$interface].methods[duplicate[i]]) &&
                                !isFunctionCompatible(current[$interface].methods[duplicate[i]], interf[$interface].methods[duplicate[i]])) {
                            throw new Error('Interface "' + params.$name + '" is inheriting method "' + duplicate[i] + '" from different parents with incompatible signatures.');
                        }
                    }
                }
                mixIn(interf[$interface].methods, current[$interface].methods);

                // Merge static methods
                duplicate = intersection(keys(interf[$interface].staticMethods), keys(current[$interface].staticMethods));
                i = duplicate.length;
                if (i) {
                    for (i -= 1; i >= 0; i -= 1) {
                        if (!isFunctionCompatible(interf[$interface].staticMethods[duplicate[i]], current[$interface].staticMethods[duplicate[i]]) &&
                                !isFunctionCompatible(current[$interface].staticMethods[duplicate[i]], interf[$interface].staticMethods[duplicate[i]])) {
                            throw new Error('Interface "' + params.$name + '" is inheriting static method "' + duplicate[i] + '" from different parents with incompatible signatures.');
                        }
                    }
                }
                mixIn(interf[$interface].staticMethods, current[$interface].staticMethods);

                // Add interface constants
                for (i in current[$interface].constants) {
                    if (interf[$interface].constants[i]) {
                        if (interf[i] !== current[i]) {
                            throw new Error('Interface "' + params.$name + '" is inheriting constant property "' + i + '" from different parents with different values.');
                        }
                    } else {
                        interf[$interface].constants[i] = current[$interface].constants[i];
                        assignConstant(i, current[i], interf);
                    }
                }

                // Add interface to the parents
                interf[$interface].parents.push(current);
            }

            delete params.$extends;
        }

        // Check if the interface defines the initialize function
        if (hasOwn(params, 'initialize')) {
            throw new Error('Interface "' + params.$name + '" can\'t define the initialize method.');
        }

        // Parse constants
        if (hasOwn(params, '$constants')) {
            // Check argument
            if (!isObject(params.$constants)) {
                throw new Error('$constants definition of interface "' + params.$name + '" must be an object.');
            }

            // Check reserved keywords
            checkKeywords(params.$constants, 'statics');

            // Check unallowed keywords
            unallowed = testKeywords(params.$constants);
            if (unallowed) {
                throw new Error('$constants of interface "' + interf.prototype.$name + '" contains an unallowed keyword: "' + unallowed + '".');
            }

            // Check ambiguity
            if (hasOwn(params, '$statics')) {
                ambiguous = intersection(keys(params.$constants), keys(params.$statics));
                if (ambiguous.length) {
                    throw new Error('There are members defined in interface "' + params.$name + '" with the same name but with different modifiers: "' + ambiguous.join('", ') + '".');
                }
            }

            for (k in params.$constants) {
                addConstant(k, params.$constants[k], interf);
            }

            delete params.$constants;
        }

        // Parse statics
        if (hasOwn(params, '$statics')) {
            // Check argument
            if (!isObject(params.$statics)) {
                throw new Error('$statics definition of interface "' + params.$name + '" must be an object.');
            }

            // Check reserved keywords
            checkKeywords(params.$statics, 'statics');

            // Check unallowed keywords
            unallowed = testKeywords(params.$statics);
            if (unallowed) {
                throw new Error('$statics of interface "' + interf.prototype.$name + '" contains an unallowed keyword: "' + unallowed + '".');
            }

            opts.isStatic = true;

            for (k in params.$statics) {
                value = params.$statics[k];

                // Check if it is not a function
                if (!isFunction(value) || value[$interface] || value[$class]) {
                    throw new Error('Static member "' + k + '" found in interface "' + params.$name + '" is not a function.');
                }

                addMethod(k, value, interf, opts);
            }

            delete opts.isStatic;
            delete params.$statics;
        }

        name = params.$name;
        delete params.$name;

        // Check unallowed keywords
        unallowed = testKeywords(params, ['$extends', '$statics', '$constants']);
        if (unallowed) {
            throw new Error('$statics of interface "' + interf.prototype.$name + '" contains an unallowed keyword: "' + unallowed + '".');
        }

        for (k in params) {
            addMethod(k, params[k], interf);
        }

        params.$name = name;

        // Supply .extend() to easily extend an interface
        interf.extend = extend;

        return interf;
    }

    /**
     * Function to declare an Interface.
     *
     * @param {Object} obj An object containing the interface members.
     *
     * @return {Function} The Interface
     */
    Interface.declare = createInterface;

    return Interface;
});

/*jshint laxcomma:true*/

define('FinalClass',[
    './Class'
    , './lib/randomAccessor'
    , './lib/checkObjectPrototype'
], function FinalClassWrapper(
    Class
    , randomAccessor
    , checkObjectPrototype
) {

    'use strict';

    checkObjectPrototype();

    var random = randomAccessor('FinalClassWrapper'),
        $class = '$class_' + random,
        FinalClass = {};

    /**
     * Create a final class definition.
     *
     * @param {Object}      params        An object containing methods and properties
     * @param {Constructor} [constructor] Assume the passed constructor
     *
     * @return {Function} The constructor
     */
    function createFinalClass(params, constructor) {
        var def = Class.$create(params, constructor);
        def[$class].finalClass = true;

        return def;
    }

    /**
     * Function to declare a final class.
     * This function can be called with various formats.
     *
     * @param {Function|Object} arg1 A class to extend or an object/function to obtain the members
     * @param {Function|Object} arg2 Object/function to obtain the members
     *
     * @return {Function} The constructor
     */
    FinalClass.declare = function (arg1, arg2, $arg3) {
        return Class.declare.call(createFinalClass, arg1, arg2, $arg3);
    };

    return FinalClass;
});

define('instanceOf',[
    'mout/lang/isFunction'
    , './lib/randomAccessor'
], function instanceOfWrapper(
    isFunction
    , randomAccessor
) {

    'use strict';

    var random = randomAccessor('instanceOfWrapper'),
        $class = '$class_' + random,
        $interface = '$interface_' + random;

    /**
     * Check if an interface is descendant of another.
     *
     * @param {Function} interf1 The interface to be checked
     * @param {Function} interf2 The interface to be expected as the ancestor
     *
     * @return {Boolean} True if it's a descendant, false otherwise
     */
    function interfaceDescendantOf(interf1, interf2) {
        var x,
            parents = interf1[$interface].parents;

        for (x = parents.length - 1; x >= 0; x -= 1) {
            if (parents[x] === interf2) {
                return true;
            }
            if (interfaceDescendantOf(interf1, parents[x])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if an instance of a class is an instance of an interface.
     *
     * @param {Object}   instance The instance to be checked
     * @param {Function} target   The interface
     *
     * @return {Boolean} True if it is, false otherwise
     */
    function instanceOfInterface(instance, target) {
        var x,
            interfaces = instance.$static[$class].interfaces;

        for (x = interfaces.length - 1; x >= 0; x -= 1) {
            if (interfaces[x] === target || interfaceDescendantOf(interfaces[x], target)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Custom instanceOf that also works on interfaces.
     *
     * @param {Object}   instance The instance to be checked
     * @param {Function} target   The target
     *
     * @return {Boolean} True if it is a valid instance of target, false otherwise
     */
    function instanceOf(instance, target) {
        if (!isFunction(target)) {
            return false;
        }

        if (instance instanceof target) {
            return true;
        }

        if (instance && instance.$static && instance.$static[$class] && target && target[$interface]) {
            return instanceOfInterface(instance, target);
        }

        return false;
    }

    return instanceOf;
});
define('dejavu',[
    './Class',
    './AbstractClass',
    './Interface',
    './FinalClass',
    './instanceOf',
    './options'
], function (
    Class,
    AbstractClass,
    Interface,
    FinalClass,
    instanceOf,
    options
) {

    'use strict';

    var dejavu = {};

    dejavu.Class = Class;
    dejavu.AbstractClass = AbstractClass;
    dejavu.Interface = Interface;
    dejavu.FinalClass = FinalClass;
    dejavu.instanceOf = instanceOf;
    dejavu.options = options;

    dejavu.mode = 'strict';
    window.dejavu = dejavu;
});

require('dejavu', null, null, true);

}());