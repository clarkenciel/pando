(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var exports = module.exports = {};

exports.constrainFrequency = function (lo, hi, frequency) {
  if (typeof frequency === "undefined") return 0;
  if (!isFinite(frequency)) return 0;
  while (frequency < lo || hi < frequency) {
    if (frequency < lo) frequency *= 2;
    if (frequency > hi) frequency *= 0.5;
  };
  return frequency;
};

exports.coordToFrequency = function (frequency, dimensions, coord) {
  var product = 1;
  for (var i = 0; i < dimensions.length; i++)
    product *= Math.pow(dimensions[i], coord[i]);
  return exports.constrainFrequency(
    400, 1200,
    Math.abs(frequency * product));
};

},{}],2:[function(require,module,exports){
/*****************************************
/* DOM touch support module
/*****************************************/
if (!window.CustomEvent) {
    window.CustomEvent = function (event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    };
    window.CustomEvent.prototype = window.Event.prototype;
}

(function(document) {
	var TAPTRESHOLD = 200, // time within a double tap should have happend
        TAPPRECISION = 60 / 2, // distance to identify a swipe gesture
        touch = { },
        tapCount = 0, // counts the number of touchstart events
        tapTimer = 0, // timer to detect double tap
        isTouchSwipe = false, // set to true whenever 
        absolute = Math.abs,
        touchSupported = 'ontouchstart' in window;

    function parentIfText (node) {
        
        return 'tagName' in node ? node : node.parentNode;
    }

    function dispatchEvent(type, touch) {
        if(touchSupported) {
            touch.originalEvent.preventDefault();
            touch.originalEvent.stopImmediatePropagation();
        }
        var event = new CustomEvent(type, {
            detail: touch,
            bubbles: true,
            cancelable: true
        });
        touch.target.dispatchEvent(event);
        console.log(type);

        touch = { };
        tapCount = 0;

        return event;
    }
    
    function touchStart(e) {
        if( !touchSupported || e.touches.length === 1) { 
            var coords = e.targetTouches ? e.targetTouches[0] : e;
            touch = {
                originalEvent: e,
                target: parentIfText(e.target),
                x1: coords.pageX,
                y1: coords.pageY,
                x2: coords.pageX,
                y2: coords.pageY
            };
            isTouchSwipe = false;
            tapCount++;
            if (!e.button || e.button === 1) {
                clearTimeout(tapTimer);
                tapTimer = setTimeout(function() {
                    if(absolute(touch.x2 - touch.x1) < TAPPRECISION &&
                       absolute(touch.y2 - touch.y2) < TAPPRECISION &&
                       !isTouchSwipe) {
                        dispatchEvent((tapCount===2)? 'dbltap' : 'tap', touch);
                        clearTimeout(tapTimer);
                    }
                    tapCount = 0;
                }, TAPTRESHOLD); 
            }
        }
    }

    function touchMove(e) {
        var coords = e.changedTouches ? e.changedTouches[0] : e;
        isTouchSwipe = true;
        touch.x2 = coords.pageX;
        touch.y2 = coords.pageY;
        /* the following is obsolete since at least chrome handles this 
        // if movement is detected within 200ms from start, preventDefault to preserve browser scroll etc. 
        // if (touch.target && 
        //         (absolute(touch.y2 - touch.y1) <= TAPPRECISION || 
        //          absolute(touch.x2 - touch.x1) <= TAPPRECISION)
        //     ) {   
        //         e.preventDefault();
        //         touchCancel(e);
        // }
        */
    }

    function touchCancel(e) {
        touch = {};
        tapCount = 0;
        isTouchSwipe = false;
    }

    function touchEnd(e) {
        var distX = touch.x2 - touch.x1,
            distY = touch.y2 - touch.y1,
            absX  = absolute(distX),
            absY  = absolute(distY);
        // use setTimeout here to register swipe over tap correctly,
        // otherwise a tap would be fired immediatly after a swipe
        setTimeout(function() {
            isTouchSwipe = false;
        },0);
        // if there was swipe movement, resolve the direction of swipe
        if(absX || absY) {
            if(absX > absY) {
                dispatchEvent((distX<0)? 'swipeleft': 'swiperight', touch);
            } else {
                dispatchEvent((distY<0)? 'swipeup': 'swipedown', touch);
            }
        }        
    }

    document.addEventListener(touchSupported ? 'touchstart' : 'mousedown', touchStart, false);
    document.addEventListener(touchSupported ? 'touchmove' : 'mousemove', touchMove, false);
    document.addEventListener(touchSupported ? 'touchend' : 'mouseup', touchEnd, false);
    // on touch devices, the taphold complies with contextmenu
    document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            dispatchEvent('taphold', {
                originalEvent: e,
                target: parentIfText(e.target)
            });
        }, false);

    if (touchSupported) { 
        document.addEventListener('touchcancel', touchCancel, false);          
    }
    
}(window.document));

var exports = module.exports = {};
exports.touchHelper = function(options) {
    return function(element, initialized, context) {
        if (!initialized) {
            Object.keys(options).forEach(function(touchType) {
                element.addEventListener(touchType, options[touchType], false);
            });
            context.onunload = function() {
                Object.keys(options).forEach(function(touchType) {
                    element.removeEventListener(touchType, options[touchType], false);
                });
            };
        }
    };        
};

},{}],3:[function(require,module,exports){
;(function (global, factory) { // eslint-disable-line
	"use strict"
	/* eslint-disable no-undef */
	var m = factory(global)
	if (typeof module === "object" && module != null && module.exports) {
		module.exports = m
	} else if (typeof define === "function" && define.amd) {
		define(function () { return m })
	} else {
		global.m = m
	}
	/* eslint-enable no-undef */
})(typeof window !== "undefined" ? window : {}, function (global, undefined) { // eslint-disable-line
	"use strict"

	m.version = function () {
		return "v0.2.3"
	}

	var hasOwn = {}.hasOwnProperty
	var type = {}.toString

	function isFunction(object) {
		return typeof object === "function"
	}

	function isObject(object) {
		return type.call(object) === "[object Object]"
	}

	function isString(object) {
		return type.call(object) === "[object String]"
	}

	var isArray = Array.isArray || function (object) {
		return type.call(object) === "[object Array]"
	}

	function noop() {}

	var voidElements = {
		AREA: 1,
		BASE: 1,
		BR: 1,
		COL: 1,
		COMMAND: 1,
		EMBED: 1,
		HR: 1,
		IMG: 1,
		INPUT: 1,
		KEYGEN: 1,
		LINK: 1,
		META: 1,
		PARAM: 1,
		SOURCE: 1,
		TRACK: 1,
		WBR: 1
	}

	// caching commonly used variables
	var $document, $location, $requestAnimationFrame, $cancelAnimationFrame

	// self invoking function needed because of the way mocks work
	function initialize(mock) {
		$document = mock.document
		$location = mock.location
		$cancelAnimationFrame = mock.cancelAnimationFrame || mock.clearTimeout
		$requestAnimationFrame = mock.requestAnimationFrame || mock.setTimeout
	}

	// testing API
	m.deps = function (mock) {
		initialize(global = mock || window)
		return global
	}

	m.deps(global)

	/**
	 * @typedef {String} Tag
	 * A string that looks like -> div.classname#id[param=one][param2=two]
	 * Which describes a DOM node
	 */

	function parseTagAttrs(cell, tag) {
		var classes = []
		var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g
		var match

		while ((match = parser.exec(tag))) {
			if (match[1] === "" && match[2]) {
				cell.tag = match[2]
			} else if (match[1] === "#") {
				cell.attrs.id = match[2]
			} else if (match[1] === ".") {
				classes.push(match[2])
			} else if (match[3][0] === "[") {
				var pair = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/.exec(match[3])
				cell.attrs[pair[1]] = pair[3] || (pair[2] ? "" : true)
			}
		}

		return classes
	}

	function getVirtualChildren(args, hasAttrs) {
		var children = hasAttrs ? args.slice(1) : args

		if (children.length === 1 && isArray(children[0])) {
			return children[0]
		} else {
			return children
		}
	}

	function assignAttrs(target, attrs, classes) {
		var classAttr = "class" in attrs ? "class" : "className"

		for (var attrName in attrs) {
			if (hasOwn.call(attrs, attrName)) {
				if (attrName === classAttr &&
						attrs[attrName] != null &&
						attrs[attrName] !== "") {
					classes.push(attrs[attrName])
					// create key in correct iteration order
					target[attrName] = ""
				} else {
					target[attrName] = attrs[attrName]
				}
			}
		}

		if (classes.length) target[classAttr] = classes.join(" ")
	}

	/**
	 *
	 * @param {Tag} The DOM node tag
	 * @param {Object=[]} optional key-value pairs to be mapped to DOM attrs
	 * @param {...mNode=[]} Zero or more Mithril child nodes. Can be an array,
	 *                      or splat (optional)
	 */
	function m(tag, pairs) {
		var args = [].slice.call(arguments, 1)

		if (isObject(tag)) return parameterize(tag, args)

		if (!isString(tag)) {
			throw new Error("selector in m(selector, attrs, children) should " +
				"be a string")
		}

		var hasAttrs = pairs != null && isObject(pairs) &&
			!("tag" in pairs || "view" in pairs || "subtree" in pairs)

		var attrs = hasAttrs ? pairs : {}
		var cell = {
			tag: "div",
			attrs: {},
			children: getVirtualChildren(args, hasAttrs)
		}

		assignAttrs(cell.attrs, attrs, parseTagAttrs(cell, tag))
		return cell
	}

	function forEach(list, f) {
		for (var i = 0; i < list.length && !f(list[i], i++);) {
			// function called in condition
		}
	}

	function forKeys(list, f) {
		forEach(list, function (attrs, i) {
			return (attrs = attrs && attrs.attrs) &&
				attrs.key != null &&
				f(attrs, i)
		})
	}
	// This function was causing deopts in Chrome.
	function dataToString(data) {
		// data.toString() might throw or return null if data is the return
		// value of Console.log in some versions of Firefox (behavior depends on
		// version)
		try {
			if (data != null && data.toString() != null) return data
		} catch (e) {
			// silently ignore errors
		}
		return ""
	}

	// This function was causing deopts in Chrome.
	function injectTextNode(parentElement, first, index, data) {
		try {
			insertNode(parentElement, first, index)
			first.nodeValue = data
		} catch (e) {
			// IE erroneously throws error when appending an empty text node
			// after a null
		}
	}

	function flatten(list) {
		// recursively flatten array
		for (var i = 0; i < list.length; i++) {
			if (isArray(list[i])) {
				list = list.concat.apply([], list)
				// check current index again and flatten until there are no more
				// nested arrays at that index
				i--
			}
		}
		return list
	}

	function insertNode(parentElement, node, index) {
		parentElement.insertBefore(node,
			parentElement.childNodes[index] || null)
	}

	var DELETION = 1
	var INSERTION = 2
	var MOVE = 3

	function handleKeysDiffer(data, existing, cached, parentElement) {
		forKeys(data, function (key, i) {
			existing[key = key.key] = existing[key] ? {
				action: MOVE,
				index: i,
				from: existing[key].index,
				element: cached.nodes[existing[key].index] ||
					$document.createElement("div")
			} : {action: INSERTION, index: i}
		})

		var actions = []
		for (var prop in existing) if (hasOwn.call(existing, prop)) {
			actions.push(existing[prop])
		}

		var changes = actions.sort(sortChanges)
		var newCached = new Array(cached.length)

		newCached.nodes = cached.nodes.slice()

		forEach(changes, function (change) {
			var index = change.index
			if (change.action === DELETION) {
				clear(cached[index].nodes, cached[index])
				newCached.splice(index, 1)
			}
			if (change.action === INSERTION) {
				var dummy = $document.createElement("div")
				dummy.key = data[index].attrs.key
				insertNode(parentElement, dummy, index)
				newCached.splice(index, 0, {
					attrs: {key: data[index].attrs.key},
					nodes: [dummy]
				})
				newCached.nodes[index] = dummy
			}

			if (change.action === MOVE) {
				var changeElement = change.element
				var maybeChanged = parentElement.childNodes[index]
				if (maybeChanged !== changeElement && changeElement !== null) {
					parentElement.insertBefore(changeElement,
						maybeChanged || null)
				}
				newCached[index] = cached[change.from]
				newCached.nodes[index] = changeElement
			}
		})

		return newCached
	}

	function diffKeys(data, cached, existing, parentElement) {
		var keysDiffer = data.length !== cached.length

		if (!keysDiffer) {
			forKeys(data, function (attrs, i) {
				var cachedCell = cached[i]
				return keysDiffer = cachedCell &&
					cachedCell.attrs &&
					cachedCell.attrs.key !== attrs.key
			})
		}

		if (keysDiffer) {
			return handleKeysDiffer(data, existing, cached, parentElement)
		} else {
			return cached
		}
	}

	function diffArray(data, cached, nodes) {
		// diff the array itself

		// update the list of DOM nodes by collecting the nodes from each item
		forEach(data, function (_, i) {
			if (cached[i] != null) nodes.push.apply(nodes, cached[i].nodes)
		})
		// remove items from the end of the array if the new array is shorter
		// than the old one. if errors ever happen here, the issue is most
		// likely a bug in the construction of the `cached` data structure
		// somewhere earlier in the program
		forEach(cached.nodes, function (node, i) {
			if (node.parentNode != null && nodes.indexOf(node) < 0) {
				clear([node], [cached[i]])
			}
		})

		if (data.length < cached.length) cached.length = data.length
		cached.nodes = nodes
	}

	function buildArrayKeys(data) {
		var guid = 0
		forKeys(data, function () {
			forEach(data, function (attrs) {
				if ((attrs = attrs && attrs.attrs) && attrs.key == null) {
					attrs.key = "__mithril__" + guid++
				}
			})
			return 1
		})
	}

	function isDifferentEnough(data, cached, dataAttrKeys) {
		if (data.tag !== cached.tag) return true

		if (dataAttrKeys.sort().join() !==
				Object.keys(cached.attrs).sort().join()) {
			return true
		}

		if (data.attrs.id !== cached.attrs.id) {
			return true
		}

		if (data.attrs.key !== cached.attrs.key) {
			return true
		}

		if (m.redraw.strategy() === "all") {
			return !cached.configContext || cached.configContext.retain !== true
		}

		if (m.redraw.strategy() === "diff") {
			return cached.configContext && cached.configContext.retain === false
		}

		return false
	}

	function maybeRecreateObject(data, cached, dataAttrKeys) {
		// if an element is different enough from the one in cache, recreate it
		if (isDifferentEnough(data, cached, dataAttrKeys)) {
			if (cached.nodes.length) clear(cached.nodes)

			if (cached.configContext &&
					isFunction(cached.configContext.onunload)) {
				cached.configContext.onunload()
			}

			if (cached.controllers) {
				forEach(cached.controllers, function (controller) {
					if (controller.onunload) controller.onunload({preventDefault: noop});
				});
			}
		}
	}

	function getObjectNamespace(data, namespace) {
		if (data.attrs.xmlns) return data.attrs.xmlns
		if (data.tag === "svg") return "http://www.w3.org/2000/svg"
		if (data.tag === "math") return "http://www.w3.org/1998/Math/MathML"
		return namespace
	}

	var pendingRequests = 0
	m.startComputation = function () { pendingRequests++ }
	m.endComputation = function () {
		if (pendingRequests > 1) {
			pendingRequests--
		} else {
			pendingRequests = 0
			m.redraw()
		}
	}

	function unloadCachedControllers(cached, views, controllers) {
		if (controllers.length) {
			cached.views = views
			cached.controllers = controllers
			forEach(controllers, function (controller) {
				if (controller.onunload && controller.onunload.$old) {
					controller.onunload = controller.onunload.$old
				}

				if (pendingRequests && controller.onunload) {
					var onunload = controller.onunload
					controller.onunload = noop
					controller.onunload.$old = onunload
				}
			})
		}
	}

	function scheduleConfigsToBeCalled(configs, data, node, isNew, cached) {
		// schedule configs to be called. They are called after `build` finishes
		// running
		if (isFunction(data.attrs.config)) {
			var context = cached.configContext = cached.configContext || {}

			// bind
			configs.push(function () {
				return data.attrs.config.call(data, node, !isNew, context,
					cached)
			})
		}
	}

	function buildUpdatedNode(
		cached,
		data,
		editable,
		hasKeys,
		namespace,
		views,
		configs,
		controllers
	) {
		var node = cached.nodes[0]

		if (hasKeys) {
			setAttributes(node, data.tag, data.attrs, cached.attrs, namespace)
		}

		cached.children = build(
			node,
			data.tag,
			undefined,
			undefined,
			data.children,
			cached.children,
			false,
			0,
			data.attrs.contenteditable ? node : editable,
			namespace,
			configs
		)

		cached.nodes.intact = true

		if (controllers.length) {
			cached.views = views
			cached.controllers = controllers
		}

		return node
	}

	function handleNonexistentNodes(data, parentElement, index) {
		var nodes
		if (data.$trusted) {
			nodes = injectHTML(parentElement, index, data)
		} else {
			nodes = [$document.createTextNode(data)]
			if (!(parentElement.nodeName in voidElements)) {
				insertNode(parentElement, nodes[0], index)
			}
		}

		var cached

		if (typeof data === "string" ||
				typeof data === "number" ||
				typeof data === "boolean") {
			cached = new data.constructor(data)
		} else {
			cached = data
		}

		cached.nodes = nodes
		return cached
	}

	function reattachNodes(
		data,
		cached,
		parentElement,
		editable,
		index,
		parentTag
	) {
		var nodes = cached.nodes
		if (!editable || editable !== $document.activeElement) {
			if (data.$trusted) {
				clear(nodes, cached)
				nodes = injectHTML(parentElement, index, data)
			} else if (parentTag === "textarea") {
				// <textarea> uses `value` instead of `nodeValue`.
				parentElement.value = data
			} else if (editable) {
				// contenteditable nodes use `innerHTML` instead of `nodeValue`.
				editable.innerHTML = data
			} else {
				// was a trusted string
				if (nodes[0].nodeType === 1 || nodes.length > 1 ||
						(nodes[0].nodeValue.trim &&
							!nodes[0].nodeValue.trim())) {
					clear(cached.nodes, cached)
					nodes = [$document.createTextNode(data)]
				}

				injectTextNode(parentElement, nodes[0], index, data)
			}
		}
		cached = new data.constructor(data)
		cached.nodes = nodes
		return cached
	}

	function handleTextNode(
		cached,
		data,
		index,
		parentElement,
		shouldReattach,
		editable,
		parentTag
	) {
		if (!cached.nodes.length) {
			return handleNonexistentNodes(data, parentElement, index)
		} else if (cached.valueOf() !== data.valueOf() || shouldReattach) {
			return reattachNodes(data, cached, parentElement, editable, index,
				parentTag)
		} else {
			return (cached.nodes.intact = true, cached)
		}
	}

	function getSubArrayCount(item) {
		if (item.$trusted) {
			// fix offset of next element if item was a trusted string w/ more
			// than one html element
			// the first clause in the regexp matches elements
			// the second clause (after the pipe) matches text nodes
			var match = item.match(/<[^\/]|\>\s*[^<]/g)
			if (match != null) return match.length
		} else if (isArray(item)) {
			return item.length
		}
		return 1
	}

	function buildArray(
		data,
		cached,
		parentElement,
		index,
		parentTag,
		shouldReattach,
		editable,
		namespace,
		configs
	) {
		data = flatten(data)
		var nodes = []
		var intact = cached.length === data.length
		var subArrayCount = 0

		// keys algorithm: sort elements without recreating them if keys are
		// present
		//
		// 1) create a map of all existing keys, and mark all for deletion
		// 2) add new keys to map and mark them for addition
		// 3) if key exists in new list, change action from deletion to a move
		// 4) for each key, handle its corresponding action as marked in
		//    previous steps

		var existing = {}
		var shouldMaintainIdentities = false

		forKeys(cached, function (attrs, i) {
			shouldMaintainIdentities = true
			existing[cached[i].attrs.key] = {action: DELETION, index: i}
		})

		buildArrayKeys(data)
		if (shouldMaintainIdentities) {
			cached = diffKeys(data, cached, existing, parentElement)
		}
		// end key algorithm

		var cacheCount = 0
		// faster explicitly written
		for (var i = 0, len = data.length; i < len; i++) {
			// diff each item in the array
			var item = build(
				parentElement,
				parentTag,
				cached,
				index,
				data[i],
				cached[cacheCount],
				shouldReattach,
				index + subArrayCount || subArrayCount,
				editable,
				namespace,
				configs)

			if (item !== undefined) {
				intact = intact && item.nodes.intact
				subArrayCount += getSubArrayCount(item)
				cached[cacheCount++] = item
			}
		}

		if (!intact) diffArray(data, cached, nodes)
		return cached
	}

	function makeCache(data, cached, index, parentIndex, parentCache) {
		if (cached != null) {
			if (type.call(cached) === type.call(data)) return cached

			if (parentCache && parentCache.nodes) {
				var offset = index - parentIndex
				var end = offset + (isArray(data) ? data : cached.nodes).length
				clear(
					parentCache.nodes.slice(offset, end),
					parentCache.slice(offset, end))
			} else if (cached.nodes) {
				clear(cached.nodes, cached)
			}
		}

		cached = new data.constructor()
		// if constructor creates a virtual dom element, use a blank object as
		// the base cached node instead of copying the virtual el (#277)
		if (cached.tag) cached = {}
		cached.nodes = []
		return cached
	}

	function constructNode(data, namespace) {
		if (data.attrs.is) {
			if (namespace == null) {
				return $document.createElement(data.tag, data.attrs.is)
			} else {
				return $document.createElementNS(namespace, data.tag,
					data.attrs.is)
			}
		} else if (namespace == null) {
			return $document.createElement(data.tag)
		} else {
			return $document.createElementNS(namespace, data.tag)
		}
	}

	function constructAttrs(data, node, namespace, hasKeys) {
		if (hasKeys) {
			return setAttributes(node, data.tag, data.attrs, {}, namespace)
		} else {
			return data.attrs
		}
	}

	function constructChildren(
		data,
		node,
		cached,
		editable,
		namespace,
		configs
	) {
		if (data.children != null && data.children.length > 0) {
			return build(
				node,
				data.tag,
				undefined,
				undefined,
				data.children,
				cached.children,
				true,
				0,
				data.attrs.contenteditable ? node : editable,
				namespace,
				configs)
		} else {
			return data.children
		}
	}

	function reconstructCached(
		data,
		attrs,
		children,
		node,
		namespace,
		views,
		controllers
	) {
		var cached = {
			tag: data.tag,
			attrs: attrs,
			children: children,
			nodes: [node]
		}

		unloadCachedControllers(cached, views, controllers)

		if (cached.children && !cached.children.nodes) {
			cached.children.nodes = []
		}

		// edge case: setting value on <select> doesn't work before children
		// exist, so set it again after children have been created
		if (data.tag === "select" && "value" in data.attrs) {
			setAttributes(node, data.tag, {value: data.attrs.value}, {},
				namespace)
		}

		return cached
	}

	function getController(views, view, cachedControllers, controller) {
		var controllerIndex

		if (m.redraw.strategy() === "diff" && views) {
			controllerIndex = views.indexOf(view)
		} else {
			controllerIndex = -1
		}

		if (controllerIndex > -1) {
			return cachedControllers[controllerIndex]
		} else if (isFunction(controller)) {
			return new controller()
		} else {
			return {}
		}
	}

	var unloaders = []

	function updateLists(views, controllers, view, controller) {
		if (controller.onunload != null && unloaders.map(function(u) {return u.handler}).indexOf(controller.onunload) < 0) {
			unloaders.push({
				controller: controller,
				handler: controller.onunload
			})
		}

		views.push(view)
		controllers.push(controller)
	}

	var forcing = false
	function checkView(data, view, cached, cachedControllers, controllers, views) {
		var controller = getController(cached.views, view, cachedControllers, data.controller)
		var key = data && data.attrs && data.attrs.key
		data = pendingRequests === 0 || forcing || cachedControllers && cachedControllers.indexOf(controller) > -1 ? data.view(controller) : {tag: "placeholder"}
		if (data.subtree === "retain") return data;
		data.attrs = data.attrs || {}
		data.attrs.key = key
		updateLists(views, controllers, view, controller)
		return data
	}

	function markViews(data, cached, views, controllers) {
		var cachedControllers = cached && cached.controllers

		while (data.view != null) {
			data = checkView(
				data,
				data.view.$original || data.view,
				cached,
				cachedControllers,
				controllers,
				views)
		}

		return data
	}

	function buildObject( // eslint-disable-line max-statements
		data,
		cached,
		editable,
		parentElement,
		index,
		shouldReattach,
		namespace,
		configs
	) {
		var views = []
		var controllers = []

		data = markViews(data, cached, views, controllers)

		if (data.subtree === "retain") return cached

		if (!data.tag && controllers.length) {
			throw new Error("Component template must return a virtual " +
				"element, not an array, string, etc.")
		}

		data.attrs = data.attrs || {}
		cached.attrs = cached.attrs || {}

		var dataAttrKeys = Object.keys(data.attrs)
		var hasKeys = dataAttrKeys.length > ("key" in data.attrs ? 1 : 0)

		maybeRecreateObject(data, cached, dataAttrKeys)

		if (!isString(data.tag)) return

		var isNew = cached.nodes.length === 0

		namespace = getObjectNamespace(data, namespace)

		var node
		if (isNew) {
			node = constructNode(data, namespace)
			// set attributes first, then create children
			var attrs = constructAttrs(data, node, namespace, hasKeys)

			var children = constructChildren(data, node, cached, editable,
				namespace, configs)

			cached = reconstructCached(
				data,
				attrs,
				children,
				node,
				namespace,
				views,
				controllers)
		} else {
			node = buildUpdatedNode(
				cached,
				data,
				editable,
				hasKeys,
				namespace,
				views,
				configs,
				controllers)
		}

		if (isNew || shouldReattach === true && node != null) {
			insertNode(parentElement, node, index)
		}

		// The configs are called after `build` finishes running
		scheduleConfigsToBeCalled(configs, data, node, isNew, cached)

		return cached
	}

	function build(
		parentElement,
		parentTag,
		parentCache,
		parentIndex,
		data,
		cached,
		shouldReattach,
		index,
		editable,
		namespace,
		configs
	) {
		/*
		 * `build` is a recursive function that manages creation/diffing/removal
		 * of DOM elements based on comparison between `data` and `cached` the
		 * diff algorithm can be summarized as this:
		 *
		 * 1 - compare `data` and `cached`
		 * 2 - if they are different, copy `data` to `cached` and update the DOM
		 *     based on what the difference is
		 * 3 - recursively apply this algorithm for every array and for the
		 *     children of every virtual element
		 *
		 * The `cached` data structure is essentially the same as the previous
		 * redraw's `data` data structure, with a few additions:
		 * - `cached` always has a property called `nodes`, which is a list of
		 *    DOM elements that correspond to the data represented by the
		 *    respective virtual element
		 * - in order to support attaching `nodes` as a property of `cached`,
		 *    `cached` is *always* a non-primitive object, i.e. if the data was
		 *    a string, then cached is a String instance. If data was `null` or
		 *    `undefined`, cached is `new String("")`
		 * - `cached also has a `configContext` property, which is the state
		 *    storage object exposed by config(element, isInitialized, context)
		 * - when `cached` is an Object, it represents a virtual element; when
		 *    it's an Array, it represents a list of elements; when it's a
		 *    String, Number or Boolean, it represents a text node
		 *
		 * `parentElement` is a DOM element used for W3C DOM API calls
		 * `parentTag` is only used for handling a corner case for textarea
		 * values
		 * `parentCache` is used to remove nodes in some multi-node cases
		 * `parentIndex` and `index` are used to figure out the offset of nodes.
		 * They're artifacts from before arrays started being flattened and are
		 * likely refactorable
		 * `data` and `cached` are, respectively, the new and old nodes being
		 * diffed
		 * `shouldReattach` is a flag indicating whether a parent node was
		 * recreated (if so, and if this node is reused, then this node must
		 * reattach itself to the new parent)
		 * `editable` is a flag that indicates whether an ancestor is
		 * contenteditable
		 * `namespace` indicates the closest HTML namespace as it cascades down
		 * from an ancestor
		 * `configs` is a list of config functions to run after the topmost
		 * `build` call finishes running
		 *
		 * there's logic that relies on the assumption that null and undefined
		 * data are equivalent to empty strings
		 * - this prevents lifecycle surprises from procedural helpers that mix
		 *   implicit and explicit return statements (e.g.
		 *   function foo() {if (cond) return m("div")}
		 * - it simplifies diffing code
		 */
		data = dataToString(data)
		if (data.subtree === "retain") return cached
		cached = makeCache(data, cached, index, parentIndex, parentCache)

		if (isArray(data)) {
			return buildArray(
				data,
				cached,
				parentElement,
				index,
				parentTag,
				shouldReattach,
				editable,
				namespace,
				configs)
		} else if (data != null && isObject(data)) {
			return buildObject(
				data,
				cached,
				editable,
				parentElement,
				index,
				shouldReattach,
				namespace,
				configs)
		} else if (!isFunction(data)) {
			return handleTextNode(
				cached,
				data,
				index,
				parentElement,
				shouldReattach,
				editable,
				parentTag)
		} else {
			return cached
		}
	}

	function sortChanges(a, b) {
		return a.action - b.action || a.index - b.index
	}

	function copyStyleAttrs(node, dataAttr, cachedAttr) {
		for (var rule in dataAttr) if (hasOwn.call(dataAttr, rule)) {
			if (cachedAttr == null || cachedAttr[rule] !== dataAttr[rule]) {
				node.style[rule] = dataAttr[rule]
			}
		}

		for (rule in cachedAttr) if (hasOwn.call(cachedAttr, rule)) {
			if (!hasOwn.call(dataAttr, rule)) node.style[rule] = ""
		}
	}

	var shouldUseSetAttribute = {
		list: 1,
		style: 1,
		form: 1,
		type: 1,
		width: 1,
		height: 1
	}

	function setSingleAttr(
		node,
		attrName,
		dataAttr,
		cachedAttr,
		tag,
		namespace
	) {
		if (attrName === "config" || attrName === "key") {
			// `config` isn't a real attribute, so ignore it
			return true
		} else if (isFunction(dataAttr) && attrName.slice(0, 2) === "on") {
			// hook event handlers to the auto-redrawing system
			node[attrName] = autoredraw(dataAttr, node)
		} else if (attrName === "style" && dataAttr != null &&
				isObject(dataAttr)) {
			// handle `style: {...}`
			copyStyleAttrs(node, dataAttr, cachedAttr)
		} else if (namespace != null) {
			// handle SVG
			if (attrName === "href") {
				node.setAttributeNS("http://www.w3.org/1999/xlink",
					"href", dataAttr)
			} else {
				node.setAttribute(
					attrName === "className" ? "class" : attrName,
					dataAttr)
			}
		} else if (attrName in node && !shouldUseSetAttribute[attrName]) {
			// handle cases that are properties (but ignore cases where we
			// should use setAttribute instead)
			//
			// - list and form are typically used as strings, but are DOM
			//   element references in js
			//
			// - when using CSS selectors (e.g. `m("[style='']")`), style is
			//   used as a string, but it's an object in js
			//
			// #348 don't set the value if not needed - otherwise, cursor
			// placement breaks in Chrome
			try {
				if (tag !== "input" || node[attrName] !== dataAttr) {
					node[attrName] = dataAttr
				}
			} catch (e) {
				node.setAttribute(attrName, dataAttr)
			}
		}
		else node.setAttribute(attrName, dataAttr)
	}

	function trySetAttr(
		node,
		attrName,
		dataAttr,
		cachedAttr,
		cachedAttrs,
		tag,
		namespace
	) {
		if (!(attrName in cachedAttrs) || (cachedAttr !== dataAttr)) {
			cachedAttrs[attrName] = dataAttr
			try {
				return setSingleAttr(
					node,
					attrName,
					dataAttr,
					cachedAttr,
					tag,
					namespace)
			} catch (e) {
				// swallow IE's invalid argument errors to mimic HTML's
				// fallback-to-doing-nothing-on-invalid-attributes behavior
				if (e.message.indexOf("Invalid argument") < 0) throw e
			}
		} else if (attrName === "value" && tag === "input" &&
				node.value !== dataAttr) {
			// #348 dataAttr may not be a string, so use loose comparison
			node.value = dataAttr
		}
	}

	function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
		for (var attrName in dataAttrs) if (hasOwn.call(dataAttrs, attrName)) {
			if (trySetAttr(
					node,
					attrName,
					dataAttrs[attrName],
					cachedAttrs[attrName],
					cachedAttrs,
					tag,
					namespace)) {
				continue
			}
		}
		return cachedAttrs
	}

	function clear(nodes, cached) {
		for (var i = nodes.length - 1; i > -1; i--) {
			if (nodes[i] && nodes[i].parentNode) {
				try {
					nodes[i].parentNode.removeChild(nodes[i])
				} catch (e) {
					/* eslint-disable max-len */
					// ignore if this fails due to order of events (see
					// http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
					/* eslint-enable max-len */
				}
				cached = [].concat(cached)
				if (cached[i]) unload(cached[i])
			}
		}
		// release memory if nodes is an array. This check should fail if nodes
		// is a NodeList (see loop above)
		if (nodes.length) {
			nodes.length = 0
		}
	}

	function unload(cached) {
		if (cached.configContext && isFunction(cached.configContext.onunload)) {
			cached.configContext.onunload()
			cached.configContext.onunload = null
		}
		if (cached.controllers) {
			forEach(cached.controllers, function (controller) {
				if (isFunction(controller.onunload)) {
					controller.onunload({preventDefault: noop})
				}
			})
		}
		if (cached.children) {
			if (isArray(cached.children)) forEach(cached.children, unload)
			else if (cached.children.tag) unload(cached.children)
		}
	}

	function appendTextFragment(parentElement, data) {
		try {
			parentElement.appendChild(
				$document.createRange().createContextualFragment(data))
		} catch (e) {
			parentElement.insertAdjacentHTML("beforeend", data)
		}
	}

	function injectHTML(parentElement, index, data) {
		var nextSibling = parentElement.childNodes[index]
		if (nextSibling) {
			var isElement = nextSibling.nodeType !== 1
			var placeholder = $document.createElement("span")
			if (isElement) {
				parentElement.insertBefore(placeholder, nextSibling || null)
				placeholder.insertAdjacentHTML("beforebegin", data)
				parentElement.removeChild(placeholder)
			} else {
				nextSibling.insertAdjacentHTML("beforebegin", data)
			}
		} else {
			appendTextFragment(parentElement, data)
		}

		var nodes = []

		while (parentElement.childNodes[index] !== nextSibling) {
			nodes.push(parentElement.childNodes[index])
			index++
		}

		return nodes
	}

	function autoredraw(callback, object) {
		return function (e) {
			e = e || event
			m.redraw.strategy("diff")
			m.startComputation()
			try {
				return callback.call(object, e)
			} finally {
				endFirstComputation()
			}
		}
	}

	var html
	var documentNode = {
		appendChild: function (node) {
			if (html === undefined) html = $document.createElement("html")
			if ($document.documentElement &&
					$document.documentElement !== node) {
				$document.replaceChild(node, $document.documentElement)
			} else {
				$document.appendChild(node)
			}

			this.childNodes = $document.childNodes
		},

		insertBefore: function (node) {
			this.appendChild(node)
		},

		childNodes: []
	}

	var nodeCache = []
	var cellCache = {}

	m.render = function (root, cell, forceRecreation) {
		if (!root) {
			throw new Error("Ensure the DOM element being passed to " +
				"m.route/m.mount/m.render is not undefined.")
		}
		var configs = []
		var id = getCellCacheKey(root)
		var isDocumentRoot = root === $document
		var node

		if (isDocumentRoot || root === $document.documentElement) {
			node = documentNode
		} else {
			node = root
		}

		if (isDocumentRoot && cell.tag !== "html") {
			cell = {tag: "html", attrs: {}, children: cell}
		}

		if (cellCache[id] === undefined) clear(node.childNodes)
		if (forceRecreation === true) reset(root)

		cellCache[id] = build(
			node,
			null,
			undefined,
			undefined,
			cell,
			cellCache[id],
			false,
			0,
			null,
			undefined,
			configs)

		forEach(configs, function (config) { config() })
	}

	function getCellCacheKey(element) {
		var index = nodeCache.indexOf(element)
		return index < 0 ? nodeCache.push(element) - 1 : index
	}

	m.trust = function (value) {
		value = new String(value) // eslint-disable-line no-new-wrappers
		value.$trusted = true
		return value
	}

	function gettersetter(store) {
		function prop() {
			if (arguments.length) store = arguments[0]
			return store
		}

		prop.toJSON = function () {
			return store
		}

		return prop
	}

	m.prop = function (store) {
		if ((store != null && isObject(store) || isFunction(store)) &&
				isFunction(store.then)) {
			return propify(store)
		}

		return gettersetter(store)
	}

	var roots = []
	var components = []
	var controllers = []
	var lastRedrawId = null
	var lastRedrawCallTime = 0
	var computePreRedrawHook = null
	var computePostRedrawHook = null
	var topComponent
	var FRAME_BUDGET = 16 // 60 frames per second = 1 call per 16 ms

	function parameterize(component, args) {
		function controller() {
			/* eslint-disable no-invalid-this */
			return (component.controller || noop).apply(this, args) || this
			/* eslint-enable no-invalid-this */
		}

		if (component.controller) {
			controller.prototype = component.controller.prototype
		}

		function view(ctrl) {
			var currentArgs = [ctrl].concat(args)
			for (var i = 1; i < arguments.length; i++) {
				currentArgs.push(arguments[i])
			}

			return component.view.apply(component, currentArgs)
		}

		view.$original = component.view
		var output = {controller: controller, view: view}
		if (args[0] && args[0].key != null) output.attrs = {key: args[0].key}
		return output
	}

	m.component = function (component) {
		var args = [].slice.call(arguments, 1)

		return parameterize(component, args)
	}

	function checkPrevented(component, root, index, isPrevented) {
		if (!isPrevented) {
			m.redraw.strategy("all")
			m.startComputation()
			roots[index] = root
			var currentComponent

			if (component) {
				currentComponent = topComponent = component
			} else {
				currentComponent = topComponent = component = {controller: noop}
			}

			var controller = new (component.controller || noop)()

			// controllers may call m.mount recursively (via m.route redirects,
			// for example)
			// this conditional ensures only the last recursive m.mount call is
			// applied
			if (currentComponent === topComponent) {
				controllers[index] = controller
				components[index] = component
			}
			endFirstComputation()
			if (component === null) {
				removeRootElement(root, index)
			}
			return controllers[index]
		} else if (component == null) {
			removeRootElement(root, index)
		}
	}

	m.mount = m.module = function (root, component) {
		if (!root) {
			throw new Error("Please ensure the DOM element exists before " +
				"rendering a template into it.")
		}

		var index = roots.indexOf(root)
		if (index < 0) index = roots.length

		var isPrevented = false
		var event = {
			preventDefault: function () {
				isPrevented = true
				computePreRedrawHook = computePostRedrawHook = null
			}
		}

		forEach(unloaders, function (unloader) {
			unloader.handler.call(unloader.controller, event)
			unloader.controller.onunload = null
		})

		if (isPrevented) {
			forEach(unloaders, function (unloader) {
				unloader.controller.onunload = unloader.handler
			})
		} else {
			unloaders = []
		}

		if (controllers[index] && isFunction(controllers[index].onunload)) {
			controllers[index].onunload(event)
		}

		return checkPrevented(component, root, index, isPrevented)
	}

	function removeRootElement(root, index) {
		roots.splice(index, 1)
		controllers.splice(index, 1)
		components.splice(index, 1)
		reset(root)
		nodeCache.splice(getCellCacheKey(root), 1)
	}

	var redrawing = false
	m.redraw = function (force) {
		if (redrawing) return
		redrawing = true
		if (force) forcing = true

		try {
			// lastRedrawId is a positive number if a second redraw is requested
			// before the next animation frame
			// lastRedrawID is null if it's the first redraw and not an event
			// handler
			if (lastRedrawId && !force) {
				// when setTimeout: only reschedule redraw if time between now
				// and previous redraw is bigger than a frame, otherwise keep
				// currently scheduled timeout
				// when rAF: always reschedule redraw
				if ($requestAnimationFrame === global.requestAnimationFrame ||
						new Date() - lastRedrawCallTime > FRAME_BUDGET) {
					if (lastRedrawId > 0) $cancelAnimationFrame(lastRedrawId)
					lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET)
				}
			} else {
				redraw()
				lastRedrawId = $requestAnimationFrame(function () {
					lastRedrawId = null
				}, FRAME_BUDGET)
			}
		} finally {
			redrawing = forcing = false
		}
	}

	m.redraw.strategy = m.prop()
	function redraw() {
		if (computePreRedrawHook) {
			computePreRedrawHook()
			computePreRedrawHook = null
		}
		forEach(roots, function (root, i) {
			var component = components[i]
			if (controllers[i]) {
				var args = [controllers[i]]
				m.render(root,
					component.view ? component.view(controllers[i], args) : "")
			}
		})
		// after rendering within a routed context, we need to scroll back to
		// the top, and fetch the document title for history.pushState
		if (computePostRedrawHook) {
			computePostRedrawHook()
			computePostRedrawHook = null
		}
		lastRedrawId = null
		lastRedrawCallTime = new Date()
		m.redraw.strategy("diff")
	}

	function endFirstComputation() {
		if (m.redraw.strategy() === "none") {
			pendingRequests--
			m.redraw.strategy("diff")
		} else {
			m.endComputation()
		}
	}

	m.withAttr = function (prop, withAttrCallback, callbackThis) {
		return function (e) {
			e = e || event
			/* eslint-disable no-invalid-this */
			var currentTarget = e.currentTarget || this
			var _this = callbackThis || this
			/* eslint-enable no-invalid-this */
			var target = prop in currentTarget ?
				currentTarget[prop] :
				currentTarget.getAttribute(prop)
			withAttrCallback.call(_this, target)
		}
	}

	// routing
	var modes = {pathname: "", hash: "#", search: "?"}
	var redirect = noop
	var isDefaultRoute = false
	var routeParams, currentRoute

	m.route = function (root, arg1, arg2, vdom) { // eslint-disable-line
		// m.route()
		if (arguments.length === 0) return currentRoute
		// m.route(el, defaultRoute, routes)
		if (arguments.length === 3 && isString(arg1)) {
			redirect = function (source) {
				var path = currentRoute = normalizeRoute(source)
				if (!routeByValue(root, arg2, path)) {
					if (isDefaultRoute) {
						throw new Error("Ensure the default route matches " +
							"one of the routes defined in m.route")
					}

					isDefaultRoute = true
					m.route(arg1, true)
					isDefaultRoute = false
				}
			}

			var listener = m.route.mode === "hash" ?
				"onhashchange" :
				"onpopstate"

			global[listener] = function () {
				var path = $location[m.route.mode]
				if (m.route.mode === "pathname") path += $location.search
				if (currentRoute !== normalizeRoute(path)) redirect(path)
			}

			computePreRedrawHook = setScroll
			global[listener]()

			return
		}

		// config: m.route
		if (root.addEventListener || root.attachEvent) {
			var base = m.route.mode !== "pathname" ? $location.pathname : ""
			root.href = base + modes[m.route.mode] + vdom.attrs.href
			if (root.addEventListener) {
				root.removeEventListener("click", routeUnobtrusive)
				root.addEventListener("click", routeUnobtrusive)
			} else {
				root.detachEvent("onclick", routeUnobtrusive)
				root.attachEvent("onclick", routeUnobtrusive)
			}

			return
		}
		// m.route(route, params, shouldReplaceHistoryEntry)
		if (isString(root)) {
			var oldRoute = currentRoute
			currentRoute = root

			var args = arg1 || {}
			var queryIndex = currentRoute.indexOf("?")
			var params

			if (queryIndex > -1) {
				params = parseQueryString(currentRoute.slice(queryIndex + 1))
			} else {
				params = {}
			}

			for (var i in args) if (hasOwn.call(args, i)) {
				params[i] = args[i]
			}

			var querystring = buildQueryString(params)
			var currentPath

			if (queryIndex > -1) {
				currentPath = currentRoute.slice(0, queryIndex)
			} else {
				currentPath = currentRoute
			}

			if (querystring) {
				currentRoute = currentPath +
					(currentPath.indexOf("?") === -1 ? "?" : "&") +
					querystring
			}

			var replaceHistory =
				(arguments.length === 3 ? arg2 : arg1) === true ||
				oldRoute === root

			if (global.history.pushState) {
				var method = replaceHistory ? "replaceState" : "pushState"
				computePreRedrawHook = setScroll
				computePostRedrawHook = function () {
					global.history[method](null, $document.title,
						modes[m.route.mode] + currentRoute)
				}
				redirect(modes[m.route.mode] + currentRoute)
			} else {
				$location[m.route.mode] = currentRoute
				redirect(modes[m.route.mode] + currentRoute)
			}
		}
	}

	m.route.param = function (key) {
		if (!routeParams) {
			throw new Error("You must call m.route(element, defaultRoute, " +
				"routes) before calling m.route.param()")
		}

		if (!key) {
			return routeParams
		}

		return routeParams[key]
	}

	m.route.mode = "search"

	function normalizeRoute(route) {
		return route.slice(modes[m.route.mode].length)
	}

	function routeByValue(root, router, path) {
		routeParams = {}

		var queryStart = path.indexOf("?")
		if (queryStart !== -1) {
			routeParams = parseQueryString(
				path.substr(queryStart + 1, path.length))
			path = path.substr(0, queryStart)
		}

		// Get all routes and check if there's
		// an exact match for the current path
		var keys = Object.keys(router)
		var index = keys.indexOf(path)

		if (index !== -1){
			m.mount(root, router[keys [index]])
			return true
		}

		for (var route in router) if (hasOwn.call(router, route)) {
			if (route === path) {
				m.mount(root, router[route])
				return true
			}

			var matcher = new RegExp("^" + route
				.replace(/:[^\/]+?\.{3}/g, "(.*?)")
				.replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")

			if (matcher.test(path)) {
				/* eslint-disable no-loop-func */
				path.replace(matcher, function () {
					var keys = route.match(/:[^\/]+/g) || []
					var values = [].slice.call(arguments, 1, -2)
					forEach(keys, function (key, i) {
						routeParams[key.replace(/:|\./g, "")] =
							decodeURIComponent(values[i])
					})
					m.mount(root, router[route])
				})
				/* eslint-enable no-loop-func */
				return true
			}
		}
	}

	function routeUnobtrusive(e) {
		e = e || event
		if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return

		if (e.preventDefault) {
			e.preventDefault()
		} else {
			e.returnValue = false
		}

		var currentTarget = e.currentTarget || e.srcElement
		var args

		if (m.route.mode === "pathname" && currentTarget.search) {
			args = parseQueryString(currentTarget.search.slice(1))
		} else {
			args = {}
		}

		while (currentTarget && !/a/i.test(currentTarget.nodeName)) {
			currentTarget = currentTarget.parentNode
		}

		// clear pendingRequests because we want an immediate route change
		pendingRequests = 0
		m.route(currentTarget[m.route.mode]
			.slice(modes[m.route.mode].length), args)
	}

	function setScroll() {
		if (m.route.mode !== "hash" && $location.hash) {
			$location.hash = $location.hash
		} else {
			global.scrollTo(0, 0)
		}
	}

	function buildQueryString(object, prefix) {
		var duplicates = {}
		var str = []

		for (var prop in object) if (hasOwn.call(object, prop)) {
			var key = prefix ? prefix + "[" + prop + "]" : prop
			var value = object[prop]

			if (value === null) {
				str.push(encodeURIComponent(key))
			} else if (isObject(value)) {
				str.push(buildQueryString(value, key))
			} else if (isArray(value)) {
				var keys = []
				duplicates[key] = duplicates[key] || {}
				/* eslint-disable no-loop-func */
				forEach(value, function (item) {
					/* eslint-enable no-loop-func */
					if (!duplicates[key][item]) {
						duplicates[key][item] = true
						keys.push(encodeURIComponent(key) + "=" +
							encodeURIComponent(item))
					}
				})
				str.push(keys.join("&"))
			} else if (value !== undefined) {
				str.push(encodeURIComponent(key) + "=" +
					encodeURIComponent(value))
			}
		}
		return str.join("&")
	}

	function parseQueryString(str) {
		if (str === "" || str == null) return {}
		if (str.charAt(0) === "?") str = str.slice(1)

		var pairs = str.split("&")
		var params = {}

		forEach(pairs, function (string) {
			var pair = string.split("=")
			var key = decodeURIComponent(pair[0])
			var value = pair.length === 2 ? decodeURIComponent(pair[1]) : null
			if (params[key] != null) {
				if (!isArray(params[key])) params[key] = [params[key]]
				params[key].push(value)
			}
			else params[key] = value
		})

		return params
	}

	m.route.buildQueryString = buildQueryString
	m.route.parseQueryString = parseQueryString

	function reset(root) {
		var cacheKey = getCellCacheKey(root)
		clear(root.childNodes, cellCache[cacheKey])
		cellCache[cacheKey] = undefined
	}

	m.deferred = function () {
		var deferred = new Deferred()
		deferred.promise = propify(deferred.promise)
		return deferred
	}

	function propify(promise, initialValue) {
		var prop = m.prop(initialValue)
		promise.then(prop)
		prop.then = function (resolve, reject) {
			return propify(promise.then(resolve, reject), initialValue)
		}

		prop.catch = prop.then.bind(null, null)
		return prop
	}
	// Promiz.mithril.js | Zolmeister | MIT
	// a modified version of Promiz.js, which does not conform to Promises/A+
	// for two reasons:
	//
	// 1) `then` callbacks are called synchronously (because setTimeout is too
	//    slow, and the setImmediate polyfill is too big
	//
	// 2) throwing subclasses of Error cause the error to be bubbled up instead
	//    of triggering rejection (because the spec does not account for the
	//    important use case of default browser error handling, i.e. message w/
	//    line number)

	var RESOLVING = 1
	var REJECTING = 2
	var RESOLVED = 3
	var REJECTED = 4

	function Deferred(onSuccess, onFailure) {
		var self = this
		var state = 0
		var promiseValue = 0
		var next = []

		self.promise = {}

		self.resolve = function (value) {
			if (!state) {
				promiseValue = value
				state = RESOLVING

				fire()
			}

			return self
		}

		self.reject = function (value) {
			if (!state) {
				promiseValue = value
				state = REJECTING

				fire()
			}

			return self
		}

		self.promise.then = function (onSuccess, onFailure) {
			var deferred = new Deferred(onSuccess, onFailure)

			if (state === RESOLVED) {
				deferred.resolve(promiseValue)
			} else if (state === REJECTED) {
				deferred.reject(promiseValue)
			} else {
				next.push(deferred)
			}

			return deferred.promise
		}

		function finish(type) {
			state = type || REJECTED
			next.map(function (deferred) {
				if (state === RESOLVED) {
					deferred.resolve(promiseValue)
				} else {
					deferred.reject(promiseValue)
				}
			})
		}

		function thennable(then, success, failure, notThennable) {
			if (((promiseValue != null && isObject(promiseValue)) ||
					isFunction(promiseValue)) && isFunction(then)) {
				try {
					// count protects against abuse calls from spec checker
					var count = 0
					then.call(promiseValue, function (value) {
						if (count++) return
						promiseValue = value
						success()
					}, function (value) {
						if (count++) return
						promiseValue = value
						failure()
					})
				} catch (e) {
					m.deferred.onerror(e)
					promiseValue = e
					failure()
				}
			} else {
				notThennable()
			}
		}

		function fire() {
			// check if it's a thenable
			var then
			try {
				then = promiseValue && promiseValue.then
			} catch (e) {
				m.deferred.onerror(e)
				promiseValue = e
				state = REJECTING
				return fire()
			}

			if (state === REJECTING) {
				m.deferred.onerror(promiseValue)
			}

			thennable(then, function () {
				state = RESOLVING
				fire()
			}, function () {
				state = REJECTING
				fire()
			}, function () {
				try {
					if (state === RESOLVING && isFunction(onSuccess)) {
						promiseValue = onSuccess(promiseValue)
					} else if (state === REJECTING && isFunction(onFailure)) {
						promiseValue = onFailure(promiseValue)
						state = RESOLVING
					}
				} catch (e) {
					m.deferred.onerror(e)
					promiseValue = e
					return finish()
				}

				if (promiseValue === self) {
					promiseValue = TypeError()
					finish()
				} else {
					thennable(then, function () {
						finish(RESOLVED)
					}, finish, function () {
						finish(state === RESOLVING && RESOLVED)
					})
				}
			})
		}
	}

	m.deferred.onerror = function (e) {
		if (type.call(e) === "[object Error]" &&
				!/ Error/.test(e.constructor.toString())) {
			pendingRequests = 0
			throw e
		}
	}

	m.sync = function (args) {
		var deferred = m.deferred()
		var outstanding = args.length
		var results = new Array(outstanding)
		var method = "resolve"

		function synchronizer(pos, resolved) {
			return function (value) {
				results[pos] = value
				if (!resolved) method = "reject"
				if (--outstanding === 0) {
					deferred.promise(results)
					deferred[method](results)
				}
				return value
			}
		}

		if (args.length > 0) {
			forEach(args, function (arg, i) {
				arg.then(synchronizer(i, true), synchronizer(i, false))
			})
		} else {
			deferred.resolve([])
		}

		return deferred.promise
	}

	function identity(value) { return value }

	function handleJsonp(options) {
		var callbackKey = "mithril_callback_" +
			new Date().getTime() + "_" +
			(Math.round(Math.random() * 1e16)).toString(36)

		var script = $document.createElement("script")

		global[callbackKey] = function (resp) {
			script.parentNode.removeChild(script)
			options.onload({
				type: "load",
				target: {
					responseText: resp
				}
			})
			global[callbackKey] = undefined
		}

		script.onerror = function () {
			script.parentNode.removeChild(script)

			options.onerror({
				type: "error",
				target: {
					status: 500,
					responseText: JSON.stringify({
						error: "Error making jsonp request"
					})
				}
			})
			global[callbackKey] = undefined

			return false
		}

		script.onload = function () {
			return false
		}

		script.src = options.url +
			(options.url.indexOf("?") > 0 ? "&" : "?") +
			(options.callbackKey ? options.callbackKey : "callback") +
			"=" + callbackKey +
			"&" + buildQueryString(options.data || {})

		$document.body.appendChild(script)
	}

	function createXhr(options) {
		var xhr = new global.XMLHttpRequest()
		xhr.open(options.method, options.url, true, options.user,
			options.password)

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status >= 200 && xhr.status < 300) {
					options.onload({type: "load", target: xhr})
				} else {
					options.onerror({type: "error", target: xhr})
				}
			}
		}

		if (options.serialize === JSON.stringify &&
				options.data &&
				options.method !== "GET") {
			xhr.setRequestHeader("Content-Type",
				"application/json; charset=utf-8")
		}

		if (options.deserialize === JSON.parse) {
			xhr.setRequestHeader("Accept", "application/json, text/*")
		}

		if (isFunction(options.config)) {
			var maybeXhr = options.config(xhr, options)
			if (maybeXhr != null) xhr = maybeXhr
		}

		var data = options.method === "GET" || !options.data ? "" : options.data

		if (data && !isString(data) && data.constructor !== global.FormData) {
			throw new Error("Request data should be either be a string or " +
				"FormData. Check the `serialize` option in `m.request`")
		}

		xhr.send(data)
		return xhr
	}

	function ajax(options) {
		if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
			return handleJsonp(options)
		} else {
			return createXhr(options)
		}
	}

	function bindData(options, data, serialize) {
		if (options.method === "GET" && options.dataType !== "jsonp") {
			var prefix = options.url.indexOf("?") < 0 ? "?" : "&"
			var querystring = buildQueryString(data)
			options.url += (querystring ? prefix + querystring : "")
		} else {
			options.data = serialize(data)
		}
	}

	function parameterizeUrl(url, data) {
		if (data) {
			url = url.replace(/:[a-z]\w+/gi, function(token){
				var key = token.slice(1)
				var value = data[key]
				delete data[key]
				return value
			})
		}
		return url
	}

	m.request = function (options) {
		if (options.background !== true) m.startComputation()
		var deferred = new Deferred()
		var isJSONP = options.dataType &&
			options.dataType.toLowerCase() === "jsonp"

		var serialize, deserialize, extract

		if (isJSONP) {
			serialize = options.serialize =
			deserialize = options.deserialize = identity

			extract = function (jsonp) { return jsonp.responseText }
		} else {
			serialize = options.serialize = options.serialize || JSON.stringify

			deserialize = options.deserialize =
				options.deserialize || JSON.parse
			extract = options.extract || function (xhr) {
				if (xhr.responseText.length || deserialize !== JSON.parse) {
					return xhr.responseText
				} else {
					return null
				}
			}
		}

		options.method = (options.method || "GET").toUpperCase()
		options.url = parameterizeUrl(options.url, options.data)
		bindData(options, options.data, serialize)
		options.onload = options.onerror = function (ev) {
			try {
				ev = ev || event
				var response = deserialize(extract(ev.target, options))
				if (ev.type === "load") {
					if (options.unwrapSuccess) {
						response = options.unwrapSuccess(response, ev.target)
					}

					if (isArray(response) && options.type) {
						forEach(response, function (res, i) {
							response[i] = new options.type(res)
						})
					} else if (options.type) {
						response = new options.type(response)
					}

					deferred.resolve(response)
				} else {
					if (options.unwrapError) {
						response = options.unwrapError(response, ev.target)
					}

					deferred.reject(response)
				}
			} catch (e) {
				deferred.reject(e)
			} finally {
				if (options.background !== true) m.endComputation()
			}
		}

		ajax(options)
		deferred.promise = propify(deferred.promise, options.initialValue)
		return deferred.promise
	}

	return m
})

},{}],4:[function(require,module,exports){

/* REQUIRES THAT CRACKED BE INCLUDED IN HEAD OF HTML */

var m = require('./mithril/mithril');
var Views = require('./views/views.js');
var T = require('./tools.js');
var ST = require('./audio/utils.js');

var IMOBILE = T.any([/iPad/i, /iPod/i, /iPhone/i],
                    function (p) { return navigator.userAgent.match(p) != null; });

var interrupt = function (ctl) {
  return function (e) {
    console.log("unload interrupt", e);
    Room.quit(ctl.room).then(function () {
      try {
        sessionStorage.setItem('roomName', ctl.room.name());
        sessionStorage.setItem('userName', ctl.room.user());

        ctl.reconnect = false;
        ctl.socket && ctl.socket.close();
        ctl.socket = null;
        cracked().loop('stop');
        cracked('*').stop();
        ctl.hasSound = false;
      }
      catch (e) {
        console.log('log out error', e);
        ctl.errors().push(e.message);
      }
    });
  };
};

var customBack = function (ctl) {
  return function (e) {
    console.log('customBack',e);
    var route = m.route().split('/');
    console.log(route);
    interrupt(ctl)(e);
    if (route.indexOf('pando') < route.length - 1)
      m.route(route.slice(0,-2).join('/'));
  };
};

// Structs
var App =  {
  socket: null,
  room: null,
  reconnect: false,
  hasSound: false,
  soundCallback: null,
  soundParams: null,
  errors: m.prop([])
};

var Room = function (roomName, userName) {
  this.name = m.prop(roomName || "");
  this.user = m.prop(userName || "");
  this.dimensions = m.prop([]);
  this.coord = m.prop([]);
  this.freq = m.prop(0);
  this.socket = m.prop(null);
  this.messages = m.prop([]);
  this.currentMessage = m.prop("");
  this.entryStart = m.prop(null);
};

var RoomList = function () {
  var self = this;
  this.data = m.request({ method: "GET", url: "/pando/api/rooms/list" }).
    then(function (data) {
      return {
        count: data.roomCount,
        list: data.rooms
      };
    });
};

var ParticipantParams = function () {
  this._maxInterval = 15000;
  this._minInterval = 100;
  this._maxDelay = 5;
  this._minDelay = 0.1;
  this._maxDecay = 0.25;
  this._minDecay = 0.0125;
  this._maxEntropy = 1.0;
  this._minEntropy = 0.0;
  this._entropyDecayRate = Math.random() * 0.08;
  this._entropy = 0.5;

  this._interval = this._minInterval;
  this._delay = this._minDelay;
  this._decay = this._minDecay;

  // entropy gradually lessens
  this.entropy = function (amt) {
    return typeof amt === 'undefined' ? this.getEntropy() : this.setEntropy(amt);
  };
  
  this.getEntropy = function () {
    var out = Math.ceil((Math.random() - 1.0) + this._entropy);    
    this._entropy *= 1.0 - this._entropyDecayRate;
    if (this._entropy < this._minEntropy) this._entropy = this._minEntropy;
    return out;
  };

  this.setEntropy = function (amt) {
    this._entropy = amt > this._maxEntropy ? this._maxEntropy : amt;
    return this;
  };

  this.interval = function (newInterval) {
    return typeof newInterval === 'undefined' ? this.getInterval() : this.setInterval(newInterval);
  };

  // interval gradually lengthens
  this.getInterval = function () {
    this._interval = this._interval * 1.1 > this._maxInterval ? this._maxInterval : this._interval * 1.1;
    return this._interval;    
  };

  this.setInterval = function (amt) {
    if (amt > this._maxInterval) this._interval = this._maxInterval;
    else if (amt < this._minInterval) this._interval = this._minInterval;
    else this._interval = amt;
    return this;
  };

  this.delay = function (newDelay) {
    return typeof newDelay === 'undefined' ? this.getDelay() : this.setDelay(newDelay);
  };

  // delay gradually lengthens
  this.getDelay = function () {
    this._delay = this._delay * 1.1 > this._maxDelay ? this._maxDelay : this._delay * 1.1;
    return this._delay;
  };

  this.setDelay = function (amt) {
    if (amt > this._maxDelay) this._delay = this._maxDelay;
    else if (amt < this._minDelay) this._delay = this._minDelay;
    else this._delay = amt;
    return this;
  };
  
  this.decay = function (newDecay) {
    return typeof newDecay === 'undefined' ? this.getDecay() : this.setDecay(newDecay);
  };

  this.setDecay = function (amt) {
    if (amt > this._maxDecay) this._decay = this._maxDecay;
    else if (amt < this._minDecay) this._decay = this._minDecay;
    else this._decay = amt;
    return this;
  };

  // decay gradually lengthens
  this.getDecay = function () {
    this._decay = this._decay * 1.01 > this._maxDecay ? this._maxDecay : this._decay * 1.01;
    return this._decay;
  };
};

var whenUserValid = function (room, success) {
  if (room.name() == "" || room.user() == "") {
    App.errors().push("Please provide both a room name and a user name");
  }
  else success();
};

var whenObserverValid = function (room, roomList, success) {
  var roomPopulated = !roomList.data().list.some(function (v) { return v.roomName == room.name(); });
  if (room.user() == "observer" && roomPopulated) {
    App.errors().push("You can only observe a room with at least one member");
  }
  else success();
};

// AUDIO
var resetAppSound = function (app) {
  T.when(app.killSoundCallback, app.killSoundCallback);
  app.hasSound = false;
  app.soundCallback = null;
  app.killSoundCallback = null;
  app.freq = 0;
};

var participantCallback = function (dat) {
  T.when(dat.newRoot, function () {
    console.log('part callback',dat.userName, App.room.user());
    if (dat.userName != App.room.user() && App.sound !== null) {
      App.room.freq(ST.coordToFrequency(dat.newRoot, App.room.dimensions(), App.room.coord()));
      cracked('noiseChain').frequency(App.room.freq());
      cracked.loop('stop').loop({steps:2,interval:App.soundParams.interval()}).loop('start');
    };
  });
};

var participantKill = function () {
  cracked('*').stop();
};

var observerCallback = function (dat) {
  console.log(dat);
  App.room.freq(dat.newRoot);
  if (dat.userName != App.room.name()) {
    cracked("#"+dat.userName).
      frequency(ST.coordToFrequency(App.room.freq(), App.room.dimensions(), dat.coord));
  }
};

var observerKill = function () {
  cracked('*').stop();
};

cracked.participantChain = function (opts) {
  cracked().begin("participant").sine(0).end("participant");
      
  return cracked;
};

cracked.observerChain = function (id, freq, gain) {
  cracked().
    begin("observer", {'id': id}).
    sine({'id': id+'observerSine', 'frequency': freq}).
    gain({'id': id+'observerGain', 'gain': gain}).
    end("observer");
  return cracked;
};

// ROOM MODEL
Room.connect = function (room, destination) {
  var socketAddr = 'ws://' + window.location.host + '/pando/api/connect/' + room.name() + '/' + room.user();

  App.socket = !App.socket ? new WebSocket(socketAddr) : App.socket;
  console.log('connect', App.socket);
  App.socket.onerror = function (e) {
    App.socket.close();
    App.socket = null;
    console.log("error:", e);
    App.errors().push('The user name <'+App.room.user()+'> is taken, please choose a different user name.');    
    m.route('/pando/'+room.name());
  };

  App.socket.onclose = function (e) {
    console.log("closing socket", e);
    //App.socket = null;
  };
  
  App.socket.onopen = function (x) {
    if (App.socketTimeout !== null && typeof App.socketTimeout !== 'undefined' )
      window.clearTimeout(App.socketTimeout);
    App.socketTimeout = window.setTimeout(Room.ping(App), 5000);
    console.log("socket opened");

    // move us to the room if we logged in via the landing page
    console.log('onopen', App.room.name(), App.room.user());
    //m.route('/pando/'+App.room.name()+'/'+App.room.user());
        
    App.socket.onmessage = function (message) {
      var messages, dat = JSON.parse(message.data);

      if (dat.type != 'ping')
        App.room.messages().push(dat);
      console.log('received type', dat.type);
      m.redraw();
      
      messages = document.getElementById("messages");
      messages.scrollTop = messages.scrollHeight;
      T.when(App.soundCallback, function () { App.soundCallback(dat); });
      console.log('end onmessage');
    };
    console.log('on open complete');
    console.log(destination);
    m.route(destination);
  };
};

Room.quit = function (room) {
  return m.request({ method: "DELETE",
                     url: "/pando/api/quit",
                     data: { "user-name": room.user(),
                             "room-name": room.name() }}).
    then(function () {
      console.log("successfully logged out");
      App.socket = null;
      App.room = null;
      m.route(m.route().split('/').slice(0,-1).join('/'));
      m.redraw();
    }).
    catch(function (e) { console.log("log out error:", e.message); });
};

Room.sendMessage = function (app) {
  return function () {
    var message = app.room.currentMessage();
    if (message.length > 0) {
      var entryDuration = (Date.now() - app.room.entryStart()) * 0.00000000002,
          entryAvg = message.split("").length / entryDuration,
          out = JSON.stringify({
            "type": "message",
            "message": message,
            "userName": app.room.user,
            "roomName": app.room.name,
            "frequency": 0,
            "coord": app.room.coord
          });
      
      console.log('message out', out);
      app.socket.send(out);
      app.soundParams.entropy(entryAvg);
      app.soundParams.interval(entryAvg);
      app.soundParams.decay(0);
      app.soundParams.delay(0);
      cracked.loop('stop').
        loop({steps:2,interval:app.soundParams.interval()}).
        loop('start');
      console.log(entryAvg);
      console.log(app.soundParams);
      app.room.currentMessage("");
      app.room.entryStart(null);
    };
  };
};

Room.ping = function (app) {
  return function () {
    if (app.socket) {
      console.log("ping");
      var out = JSON.stringify({
        "type": "ping",
        "userName": app.room.user,
        "roomName": app.room.name      
      });
      app.socket.send(out);    
      app.socketTimeout =  window.setTimeout(Room.ping(app), 5000);
    }
  };
};

cracked.noiseChain = function (opts) {
  cracked.begin('noiseChain').
    sine({id:opts.id,frequency:opts.frequency}).
    gain({'gain':opts.gain}).
    end('noiseChain');
  return cracked;
};

Room.participantSoundSetup = function (app) {
  
  app.soundParams = new ParticipantParams();
  
  cracked().
    noiseChain({id:'participant',frequency:0,q:200,gain:0.4}).
    adsr({id:'notes'}).
    gain({id:'master', gain:0}).
    dac();
  cracked('#notes').
    comb({id:'masterDelay',delay: app.soundParams.delay()}).
    connect('#master');
  cracked('*').start();
  
  cracked.loop({steps:2,interval:app.soundParams.interval()});
  cracked("sine,adsr").bind("step", function (index, data, array) {
    var freq,
        env = [0.0125,app.soundParams.decay(),0.1,0.1];

    // adjust frequency
    if (app.soundParams.entropy()) {
      freq = ST.coordToFrequency(app.room.freq(),
                                 app.room.dimensions(),
                                 app.room.coord().map(function (c) {
                                   return c + cracked.random(-3,3);
                                 }));
    }
    else {
      freq = app.room.freq();
    }    
    cracked('noiseChain').frequency(freq);

    // adjust delay
    cracked('#masterDelay').attr({delay: app.soundParams.delay()});
    cracked('#notes').adsr('trigger',env);

    // adjust interval
    cracked.loop('stop').loop({steps:2,interval:app.soundParams.interval()}).loop('start');
  }, [1,0]);

  return m.request({ method: "GET",
                     url: "/pando/api/rooms/info/"+app.room.name()+"/"+app.room.user() }).
    then(function (resp) {
      console.log("info response",resp);
      if (!app.hasSound) {
        try {
          var freq = ST.coordToFrequency(resp.fundamental, resp.dimensions, resp.coord);
          cracked("#participant").frequency(freq);
          cracked('#master').ramp(0.5,0.1,'gain',0.0);
          cracked.loop("start");
          
          app.soundCallback = participantCallback;
          app.killSoundCallback = participantKill;
          app.hasSound = true;
          app.room.freq(freq);
          app.room.dimensions(resp.dimensions);
          app.room.coord(resp.coord);
        }
        catch (e) {
          console.log('sound creation error', e);                    
          app.errors().push(e.message);
          resetAppSound(App);
          m.route("/pando");
        }
      }
    });
};

Room.observerSoundSetup = function (app) {

  cracked('*').start();
  
  return m.request({ method:"GET",
                     url: "/pando/api/rooms/info/users/"+app.room.name()}).
    then(function (resp) {
      var freq;
      for (var user in resp.users) {
        freq = ST.coordToFrequency(resp.root, resp.dimensions, resp.users[user].coord);
        cracked().observerChain(user, freq, 0.3).dac();
        cracked("observer").start();
      }
      app.soundCallback = observerCallback;
      app.killSoundCallback = observerKill;
      app.hasSound = true;
      app.room.freq(resp.root);
      app.room.dimensions(resp.dimensions);
      app.room.coord([0,0]);
      console.log("observer response", resp);
    }).catch(function (e) {
      console.log("observerx error", e);
    });
};

Room.fetch = function (item) {
  if (m.route.param(item) != '')
    return m.route.param(item);  
  else if (sessionStorage.getItem(item))
    return sessionStorage.getItem(item);
  else
    return null;
};

// VIEWS
Room.conversation = {
  controller: function () {
    console.log('convo controller top');
    var body = document.getElementsByTagName("body")[0],
        roomName = Room.fetch('roomName'),
        userName = Room.fetch('userName');
    sessionStorage.clear();
    
    App.room = new Room(roomName, userName);   
    body.classList.remove("auto_height");
    body.classList.add("full_height");

    // store data if the page refreshes and allow reconnect
    if (IMOBILE)
      window.onpagehide = interrupt(App);
    else
      window.onbeforeunload = interrupt(App);

    // handle back button navigation as a log out
    window.onpopstate = customBack(App);
    
    if (!App.socket) {
       console.log('connecting from conversation', App.socket);
       Room.connect(App.room);
    }
  },

  view: function (ctl) {
    var view = [Views.room.errorDisplay(App)];
    console.log('from convo view', App.socket);
    if (App.socket.readyState == 1) {
      if (App.room.user() == "observer") {
        view.push(Views.room.observerView(App.room));
      }
      else {
        view.push(Views.room.participantView(App.room, Room.sendMessage(App)));
      }
      if (!App.hasSound) {
        view.push(
          m("div.container.popup",
            Views.room.audioPrompt(
              App,
              function () {
                if (App.room.user() == "observer")
                  Room.observerSoundSetup(App);
                else
                  Room.participantSoundSetup(App);
              },
              function () {
                console.log("app", App.room.name(), App.room.user());
                Room.quit(App.room);
              })));
      }
    }
    console.log('final view', view);
    return m("div.container", view);
  }
};

var OnTheFly = {
  controller: function () {
    console.log('onthefly controller top');
    var roomName = Room.fetch('roomName'),
        userName = Room.fetch('userName');    
    sessionStorage.clear();
    App.room = new Room(roomName, userName);
    // store data if the page refreshes and allow reconnect
    if (IMOBILE)
      window.onpagehide = interrupt(App);
    else
      window.onbeforeunload = interrupt(App);

    // handle back button navigation as a log out
    window.onpopstate = customBack(App);
  },
  view: function (ctl) {
    var view = [Views.room.errorDisplay(App)];
    if (App.room.user()) {
      Room.connect(App.room, '/pando/'+App.room.name()+'/'+App.room.user());
    }
    else {
      view.push(Views.room.onTheFlyJoin(App, function () {
        whenUserValid(App.room, function () {
          Room.connect(App.room, '/pando/'+App.room.name()+'/'+App.room.user());
        });
      }));
    }
    
    return m("div.container", view);
  }
};

var Index = {
  controller: function () {
    console.log('index controller top');
    if (window.onbeforeunload) window.onbeforeunload = undefined;
    if (window.onpopstate) window.onpopstate = undefined;
    App.reconnect = false;
    App.room = App.room ? App.room : new Room();    
    this.rooms = new RoomList();
    this.room = App.room;
    cracked().loop('stop');
    cracked('*').stop();
  },
  view: function (ctl) {
    var body = document.getElementsByTagName("body")[0];
    body.classList.remove("full_height");
    body.classList.add("auto_height");
    console.log(ctl.room.user(), App.room.user());
    
    return m("div.container", [
      m("div#appTitle",
        m("div.title_text", m("p", "Pando")),
        m("div.medium_text", m("p", "a distributed, chat-oriented virtual installation"))),
      Views.room.errorDisplay(App),
      Views.room.formView(
        App.room, ctl.rooms,
        function (room, roomList) {
          whenUserValid(room, function () {
            whenObserverValid(room, roomList, function () {
              var dest = '/pando';
              if (room.name()) dest += '/' + room.name();
              if (room.user()) dest += '/' + room.user();
              ///m.route(dest);
              Room.connect(App.room, dest);
            });
          });
        })
    ]);
  }
};

var target = document.getElementById('app');

m.route.mode = "pathname";

m.route(target, "/pando", {
    "/pando": Index  
  , "/pando/:roomName": OnTheFly
  , "/pando/:roomName/:userName": Room.conversation
});

},{"./audio/utils.js":1,"./mithril/mithril":3,"./tools.js":5,"./views/views.js":8}],5:[function(require,module,exports){
var exports = module.exports = {};

exports.when = function (val, callback) {
  if (val !== null && typeof val !== "undefined") return callback();
  else return null;
};

exports.any = function (vals, test) { return vals.map(test).indexOf(true) > -1; };

},{}],6:[function(require,module,exports){
var m = require('../mithril/mithril');
var Touch = require('../mithril-touch/mithril-touch');
var exports = module.exports = {};

var hide = function (e) { this.classList.add("hidden"); };

exports.displayError = function (error) {
  return m("div.error.popup.medium_text.bold_text",           
           " - " + error);
};

exports.displayErrors = function (model) {
  return m("div#notifications.popup.container",
           { onclick: hide,
             config: Touch.touchHelper({ tap: hide }) },
           model.errors().splice(0,model.errors().length).map(exports.displayError));
};

exports.label = function (labelText, dataName) {
  return [m("br"),
          m("label.big_text.bold", { for: dataName }, labelText),
          m("br")];
};

exports.button = function (buttonText, buttonCss, onClick) {
  var realOnClick = function (e) {
    e.preventDefault();
    return onClick();
  };
  return [m("div.buttonRow",
            m("button.button.big_text" + buttonCss,
              { onclick: realOnClick,
                config: Touch.touchHelper({
                  tap: realOnClick })},
              buttonText)),
          m("br")];
};

exports.textInput = function (labelName, dataName, attr) {
  return [ exports.label(labelName, dataName)
           , m("input.big_text",
               { type: "text",
                 name: dataName,
                 onkeyup: m.withAttr("value",
                                     function (value) {
                                       attr(value);
                                       m.redraw.strategy("none");
                                     }),
                 onkeydown: m.withAttr("value",
                                     function (value) {
                                       attr(value);
                                       m.redraw.strategy("none");
                                     }),
                 oninput: m.withAttr("value",
                                     function (value) {
                                       attr(value);
                                       m.redraw.strategy("none");
                                     }),
                 value: attr()
               })
         ];
};

exports.modelNameRadio = function (model) {
  return function (room) {
    return [m("div.roomRadio",
              m("input",
                { type: "radio",
                  name: "roomName",
                  onclick: m.withAttr("value", model.name),
                  config: Touch.touchHelper({
                    tap: function (event) {
                      //console.log('event', model.user(), model.name(), event.srcElement.value);
                      event.preventDefault();                      
                      model.name(event.srcElement.value);
                      return event.srcElement.value;
                    }
                  }),
                  value: room.roomName }),
              m("div.radio_label.medium_text",
                room.roomName + ", users: " + room.userCount))];
  };
};

exports.overlay = function (contents) {
  return m("div.overlay_backdrop",
           m("div.overlay_container",
             contents()));
};

},{"../mithril-touch/mithril-touch":2,"../mithril/mithril":3}],7:[function(require,module,exports){
var m = require('../mithril/mithril');
var Touch = require('../mithril-touch/mithril-touch');
var common = require('./common');
var exports = module.exports = {};

exports.renderMessage = function (thisUser, roomName) {
  return function (message) {
    var userDiv, messageUser = message.userName;

    if (thisUser == messageUser)
      userDiv = m("div.message.username.medium_text.this_user", messageUser + ":");
    else if (roomName == messageUser)
      userDiv = m("div.message.username.medium_text.room_user", messageUser + ":");
    else
      userDiv = m("div.message.username.medium_text", messageUser + ":");
    return m("div.message",
             [userDiv,
              m("div.message.body.small_text",
                message.message.split("\n").map(function (l) { return m("p", l); }))]);
  };
};

exports.participantView = function (ctl, formCallback) {
  return m("div.container",[
    m("div#messages", ctl.messages().map(exports.renderMessage(ctl.user(), ctl.name()))),
    m("div#messageForm", [
      m("form", [
        m("textarea#messageBody.medium_text",
          { oninput: function (e) {
            ctl.currentMessage(e.target.value);
            if (ctl.entryStart === null) ctl.entryStart(Date.now());
          }
          },
          ctl.currentMessage()),
        m("div#messageSend.button",
          { onlick: formCallback,
            config: Touch.touchHelper({ tap: formCallback }) },
          m("div.imageHolder",
             m("img[src='/pando/img/send.svg']")))])])]);
};

exports.observerView = function (ctl) {
  return m("div#messages", ctl.messages().map(exports.renderMessage(ctl.user(), ctl.name())));
};

exports.formView = function (room, roomList, connectCallback) {
  return m("div#roomFormHolder.interactionHolder",
           m("form#roomForm",
             [common.textInput("User Name:", "userName", room.user),
              m("br"),
              common.textInput("Create a new room ...", "roomName", room.name),
              m("br"),
              common.label("... or select an existing room", "roomName"),
              m("br"),
              roomList.data().list.map(common.modelNameRadio(room)),
              m("br"),
              common.button("Connect", "#connect", function () {connectCallback(room, roomList);})]));
};

exports.audioPrompt = function (app, enableCallback, cancelCallback) {
  return m("div.popup.interactionHolder",
           [m("p.medium_text", "You need to enable web audio to continue"),
            m("div.buttonRow",
              [m("button.button",
                 { onclick: function () { enableCallback(); },
                   config: Touch.touchHelper({ tap: function (){enableCallback();} })
                 },
                 "Enable"),
               m("button.button",
                 { onclick: function () { cancelCallback(); },
                   config: Touch.touchHelper({ tap: function () {cancelCallback();} })
                 },
                 "Cancel & Leave")])]);
};

exports.onTheFlyJoin = function (app, clickCallback) {
  return m("div#roomFormHolder.interactionHolder",
           [common.textInput("User name:", "userName", app.room.user, true),
            m("br"),
            common.button("Join", "#connect", function () {
              clickCallback(); })]);
};

exports.errorDisplay = function (app) {
  if (app.errors().length > 0)
    return common.displayErrors(app);
  else
    return [];
};

},{"../mithril-touch/mithril-touch":2,"../mithril/mithril":3,"./common":6}],8:[function(require,module,exports){
var exports = module.exports = {};

exports.common = require('./common.js');
exports.room = require('./room.js');

},{"./common.js":6,"./room.js":7}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL2Jpbi9ub2RlLXY1LjQuMC1saW51eC14NjQvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhdWRpby91dGlscy5qcyIsIm1pdGhyaWwtdG91Y2gvbWl0aHJpbC10b3VjaC5qcyIsIm1pdGhyaWwvbWl0aHJpbC5qcyIsInNvdXJjZS5qcyIsInRvb2xzLmpzIiwidmlld3MvY29tbW9uLmpzIiwidmlld3Mvcm9vbS5qcyIsInZpZXdzL3ZpZXdzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3bEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbmV4cG9ydHMuY29uc3RyYWluRnJlcXVlbmN5ID0gZnVuY3Rpb24gKGxvLCBoaSwgZnJlcXVlbmN5KSB7XG4gIGlmICh0eXBlb2YgZnJlcXVlbmN5ID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gMDtcbiAgaWYgKCFpc0Zpbml0ZShmcmVxdWVuY3kpKSByZXR1cm4gMDtcbiAgd2hpbGUgKGZyZXF1ZW5jeSA8IGxvIHx8IGhpIDwgZnJlcXVlbmN5KSB7XG4gICAgaWYgKGZyZXF1ZW5jeSA8IGxvKSBmcmVxdWVuY3kgKj0gMjtcbiAgICBpZiAoZnJlcXVlbmN5ID4gaGkpIGZyZXF1ZW5jeSAqPSAwLjU7XG4gIH07XG4gIHJldHVybiBmcmVxdWVuY3k7XG59O1xuXG5leHBvcnRzLmNvb3JkVG9GcmVxdWVuY3kgPSBmdW5jdGlvbiAoZnJlcXVlbmN5LCBkaW1lbnNpb25zLCBjb29yZCkge1xuICB2YXIgcHJvZHVjdCA9IDE7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZGltZW5zaW9ucy5sZW5ndGg7IGkrKylcbiAgICBwcm9kdWN0ICo9IE1hdGgucG93KGRpbWVuc2lvbnNbaV0sIGNvb3JkW2ldKTtcbiAgcmV0dXJuIGV4cG9ydHMuY29uc3RyYWluRnJlcXVlbmN5KFxuICAgIDQwMCwgMTIwMCxcbiAgICBNYXRoLmFicyhmcmVxdWVuY3kgKiBwcm9kdWN0KSk7XG59O1xuIiwiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4vKiBET00gdG91Y2ggc3VwcG9ydCBtb2R1bGVcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbmlmICghd2luZG93LkN1c3RvbUV2ZW50KSB7XG4gICAgd2luZG93LkN1c3RvbUV2ZW50ID0gZnVuY3Rpb24gKGV2ZW50LCBwYXJhbXMpIHtcbiAgICAgICAgcGFyYW1zID0gcGFyYW1zIHx8IHsgYnViYmxlczogZmFsc2UsIGNhbmNlbGFibGU6IGZhbHNlLCBkZXRhaWw6IHVuZGVmaW5lZCB9O1xuICAgICAgICB2YXIgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgICAgIGV2dC5pbml0Q3VzdG9tRXZlbnQoZXZlbnQsIHBhcmFtcy5idWJibGVzLCBwYXJhbXMuY2FuY2VsYWJsZSwgcGFyYW1zLmRldGFpbCk7XG4gICAgICAgIHJldHVybiBldnQ7XG4gICAgfTtcbiAgICB3aW5kb3cuQ3VzdG9tRXZlbnQucHJvdG90eXBlID0gd2luZG93LkV2ZW50LnByb3RvdHlwZTtcbn1cblxuKGZ1bmN0aW9uKGRvY3VtZW50KSB7XG5cdHZhciBUQVBUUkVTSE9MRCA9IDIwMCwgLy8gdGltZSB3aXRoaW4gYSBkb3VibGUgdGFwIHNob3VsZCBoYXZlIGhhcHBlbmRcbiAgICAgICAgVEFQUFJFQ0lTSU9OID0gNjAgLyAyLCAvLyBkaXN0YW5jZSB0byBpZGVudGlmeSBhIHN3aXBlIGdlc3R1cmVcbiAgICAgICAgdG91Y2ggPSB7IH0sXG4gICAgICAgIHRhcENvdW50ID0gMCwgLy8gY291bnRzIHRoZSBudW1iZXIgb2YgdG91Y2hzdGFydCBldmVudHNcbiAgICAgICAgdGFwVGltZXIgPSAwLCAvLyB0aW1lciB0byBkZXRlY3QgZG91YmxlIHRhcFxuICAgICAgICBpc1RvdWNoU3dpcGUgPSBmYWxzZSwgLy8gc2V0IHRvIHRydWUgd2hlbmV2ZXIgXG4gICAgICAgIGFic29sdXRlID0gTWF0aC5hYnMsXG4gICAgICAgIHRvdWNoU3VwcG9ydGVkID0gJ29udG91Y2hzdGFydCcgaW4gd2luZG93O1xuXG4gICAgZnVuY3Rpb24gcGFyZW50SWZUZXh0IChub2RlKSB7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gJ3RhZ05hbWUnIGluIG5vZGUgPyBub2RlIDogbm9kZS5wYXJlbnROb2RlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc3BhdGNoRXZlbnQodHlwZSwgdG91Y2gpIHtcbiAgICAgICAgaWYodG91Y2hTdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgIHRvdWNoLm9yaWdpbmFsRXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRvdWNoLm9yaWdpbmFsRXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KHR5cGUsIHtcbiAgICAgICAgICAgIGRldGFpbDogdG91Y2gsXG4gICAgICAgICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgdG91Y2gudGFyZ2V0LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgICBjb25zb2xlLmxvZyh0eXBlKTtcblxuICAgICAgICB0b3VjaCA9IHsgfTtcbiAgICAgICAgdGFwQ291bnQgPSAwO1xuXG4gICAgICAgIHJldHVybiBldmVudDtcbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gdG91Y2hTdGFydChlKSB7XG4gICAgICAgIGlmKCAhdG91Y2hTdXBwb3J0ZWQgfHwgZS50b3VjaGVzLmxlbmd0aCA9PT0gMSkgeyBcbiAgICAgICAgICAgIHZhciBjb29yZHMgPSBlLnRhcmdldFRvdWNoZXMgPyBlLnRhcmdldFRvdWNoZXNbMF0gOiBlO1xuICAgICAgICAgICAgdG91Y2ggPSB7XG4gICAgICAgICAgICAgICAgb3JpZ2luYWxFdmVudDogZSxcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IHBhcmVudElmVGV4dChlLnRhcmdldCksXG4gICAgICAgICAgICAgICAgeDE6IGNvb3Jkcy5wYWdlWCxcbiAgICAgICAgICAgICAgICB5MTogY29vcmRzLnBhZ2VZLFxuICAgICAgICAgICAgICAgIHgyOiBjb29yZHMucGFnZVgsXG4gICAgICAgICAgICAgICAgeTI6IGNvb3Jkcy5wYWdlWVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlzVG91Y2hTd2lwZSA9IGZhbHNlO1xuICAgICAgICAgICAgdGFwQ291bnQrKztcbiAgICAgICAgICAgIGlmICghZS5idXR0b24gfHwgZS5idXR0b24gPT09IDEpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGFwVGltZXIpO1xuICAgICAgICAgICAgICAgIHRhcFRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoYWJzb2x1dGUodG91Y2gueDIgLSB0b3VjaC54MSkgPCBUQVBQUkVDSVNJT04gJiZcbiAgICAgICAgICAgICAgICAgICAgICAgYWJzb2x1dGUodG91Y2gueTIgLSB0b3VjaC55MikgPCBUQVBQUkVDSVNJT04gJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIWlzVG91Y2hTd2lwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2hFdmVudCgodGFwQ291bnQ9PT0yKT8gJ2RibHRhcCcgOiAndGFwJywgdG91Y2gpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRhcFRpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0YXBDb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgfSwgVEFQVFJFU0hPTEQpOyBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvdWNoTW92ZShlKSB7XG4gICAgICAgIHZhciBjb29yZHMgPSBlLmNoYW5nZWRUb3VjaGVzID8gZS5jaGFuZ2VkVG91Y2hlc1swXSA6IGU7XG4gICAgICAgIGlzVG91Y2hTd2lwZSA9IHRydWU7XG4gICAgICAgIHRvdWNoLngyID0gY29vcmRzLnBhZ2VYO1xuICAgICAgICB0b3VjaC55MiA9IGNvb3Jkcy5wYWdlWTtcbiAgICAgICAgLyogdGhlIGZvbGxvd2luZyBpcyBvYnNvbGV0ZSBzaW5jZSBhdCBsZWFzdCBjaHJvbWUgaGFuZGxlcyB0aGlzIFxuICAgICAgICAvLyBpZiBtb3ZlbWVudCBpcyBkZXRlY3RlZCB3aXRoaW4gMjAwbXMgZnJvbSBzdGFydCwgcHJldmVudERlZmF1bHQgdG8gcHJlc2VydmUgYnJvd3NlciBzY3JvbGwgZXRjLiBcbiAgICAgICAgLy8gaWYgKHRvdWNoLnRhcmdldCAmJiBcbiAgICAgICAgLy8gICAgICAgICAoYWJzb2x1dGUodG91Y2gueTIgLSB0b3VjaC55MSkgPD0gVEFQUFJFQ0lTSU9OIHx8IFxuICAgICAgICAvLyAgICAgICAgICBhYnNvbHV0ZSh0b3VjaC54MiAtIHRvdWNoLngxKSA8PSBUQVBQUkVDSVNJT04pXG4gICAgICAgIC8vICAgICApIHsgICBcbiAgICAgICAgLy8gICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIC8vICAgICAgICAgdG91Y2hDYW5jZWwoZSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgKi9cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b3VjaENhbmNlbChlKSB7XG4gICAgICAgIHRvdWNoID0ge307XG4gICAgICAgIHRhcENvdW50ID0gMDtcbiAgICAgICAgaXNUb3VjaFN3aXBlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdG91Y2hFbmQoZSkge1xuICAgICAgICB2YXIgZGlzdFggPSB0b3VjaC54MiAtIHRvdWNoLngxLFxuICAgICAgICAgICAgZGlzdFkgPSB0b3VjaC55MiAtIHRvdWNoLnkxLFxuICAgICAgICAgICAgYWJzWCAgPSBhYnNvbHV0ZShkaXN0WCksXG4gICAgICAgICAgICBhYnNZICA9IGFic29sdXRlKGRpc3RZKTtcbiAgICAgICAgLy8gdXNlIHNldFRpbWVvdXQgaGVyZSB0byByZWdpc3RlciBzd2lwZSBvdmVyIHRhcCBjb3JyZWN0bHksXG4gICAgICAgIC8vIG90aGVyd2lzZSBhIHRhcCB3b3VsZCBiZSBmaXJlZCBpbW1lZGlhdGx5IGFmdGVyIGEgc3dpcGVcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlzVG91Y2hTd2lwZSA9IGZhbHNlO1xuICAgICAgICB9LDApO1xuICAgICAgICAvLyBpZiB0aGVyZSB3YXMgc3dpcGUgbW92ZW1lbnQsIHJlc29sdmUgdGhlIGRpcmVjdGlvbiBvZiBzd2lwZVxuICAgICAgICBpZihhYnNYIHx8IGFic1kpIHtcbiAgICAgICAgICAgIGlmKGFic1ggPiBhYnNZKSB7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2hFdmVudCgoZGlzdFg8MCk/ICdzd2lwZWxlZnQnOiAnc3dpcGVyaWdodCcsIHRvdWNoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2hFdmVudCgoZGlzdFk8MCk/ICdzd2lwZXVwJzogJ3N3aXBlZG93bicsIHRvdWNoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSAgICAgICAgXG4gICAgfVxuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0b3VjaFN1cHBvcnRlZCA/ICd0b3VjaHN0YXJ0JyA6ICdtb3VzZWRvd24nLCB0b3VjaFN0YXJ0LCBmYWxzZSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0b3VjaFN1cHBvcnRlZCA/ICd0b3VjaG1vdmUnIDogJ21vdXNlbW92ZScsIHRvdWNoTW92ZSwgZmFsc2UpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIodG91Y2hTdXBwb3J0ZWQgPyAndG91Y2hlbmQnIDogJ21vdXNldXAnLCB0b3VjaEVuZCwgZmFsc2UpO1xuICAgIC8vIG9uIHRvdWNoIGRldmljZXMsIHRoZSB0YXBob2xkIGNvbXBsaWVzIHdpdGggY29udGV4dG1lbnVcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBkaXNwYXRjaEV2ZW50KCd0YXBob2xkJywge1xuICAgICAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGUsXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBwYXJlbnRJZlRleHQoZS50YXJnZXQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgaWYgKHRvdWNoU3VwcG9ydGVkKSB7IFxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRvdWNoQ2FuY2VsLCBmYWxzZSk7ICAgICAgICAgIFxuICAgIH1cbiAgICBcbn0od2luZG93LmRvY3VtZW50KSk7XG5cbnZhciBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbmV4cG9ydHMudG91Y2hIZWxwZXIgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGVsZW1lbnQsIGluaXRpYWxpemVkLCBjb250ZXh0KSB7XG4gICAgICAgIGlmICghaW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKG9wdGlvbnMpLmZvckVhY2goZnVuY3Rpb24odG91Y2hUeXBlKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHRvdWNoVHlwZSwgb3B0aW9uc1t0b3VjaFR5cGVdLCBmYWxzZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnRleHQub251bmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhvcHRpb25zKS5mb3JFYWNoKGZ1bmN0aW9uKHRvdWNoVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIodG91Y2hUeXBlLCBvcHRpb25zW3RvdWNoVHlwZV0sIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9OyAgICAgICAgXG59O1xuIiwiOyhmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcclxuXHRcInVzZSBzdHJpY3RcIlxyXG5cdC8qIGVzbGludC1kaXNhYmxlIG5vLXVuZGVmICovXHJcblx0dmFyIG0gPSBmYWN0b3J5KGdsb2JhbClcclxuXHRpZiAodHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIiAmJiBtb2R1bGUgIT0gbnVsbCAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBtXHJcblx0fSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xyXG5cdFx0ZGVmaW5lKGZ1bmN0aW9uICgpIHsgcmV0dXJuIG0gfSlcclxuXHR9IGVsc2Uge1xyXG5cdFx0Z2xvYmFsLm0gPSBtXHJcblx0fVxyXG5cdC8qIGVzbGludC1lbmFibGUgbm8tdW5kZWYgKi9cclxufSkodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LCBmdW5jdGlvbiAoZ2xvYmFsLCB1bmRlZmluZWQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxyXG5cdFwidXNlIHN0cmljdFwiXHJcblxyXG5cdG0udmVyc2lvbiA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiBcInYwLjIuM1wiXHJcblx0fVxyXG5cclxuXHR2YXIgaGFzT3duID0ge30uaGFzT3duUHJvcGVydHlcclxuXHR2YXIgdHlwZSA9IHt9LnRvU3RyaW5nXHJcblxyXG5cdGZ1bmN0aW9uIGlzRnVuY3Rpb24ob2JqZWN0KSB7XHJcblx0XHRyZXR1cm4gdHlwZW9mIG9iamVjdCA9PT0gXCJmdW5jdGlvblwiXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBpc09iamVjdChvYmplY3QpIHtcclxuXHRcdHJldHVybiB0eXBlLmNhbGwob2JqZWN0KSA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIlxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaXNTdHJpbmcob2JqZWN0KSB7XHJcblx0XHRyZXR1cm4gdHlwZS5jYWxsKG9iamVjdCkgPT09IFwiW29iamVjdCBTdHJpbmddXCJcclxuXHR9XHJcblxyXG5cdHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAob2JqZWN0KSB7XHJcblx0XHRyZXR1cm4gdHlwZS5jYWxsKG9iamVjdCkgPT09IFwiW29iamVjdCBBcnJheV1cIlxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gbm9vcCgpIHt9XHJcblxyXG5cdHZhciB2b2lkRWxlbWVudHMgPSB7XHJcblx0XHRBUkVBOiAxLFxyXG5cdFx0QkFTRTogMSxcclxuXHRcdEJSOiAxLFxyXG5cdFx0Q09MOiAxLFxyXG5cdFx0Q09NTUFORDogMSxcclxuXHRcdEVNQkVEOiAxLFxyXG5cdFx0SFI6IDEsXHJcblx0XHRJTUc6IDEsXHJcblx0XHRJTlBVVDogMSxcclxuXHRcdEtFWUdFTjogMSxcclxuXHRcdExJTks6IDEsXHJcblx0XHRNRVRBOiAxLFxyXG5cdFx0UEFSQU06IDEsXHJcblx0XHRTT1VSQ0U6IDEsXHJcblx0XHRUUkFDSzogMSxcclxuXHRcdFdCUjogMVxyXG5cdH1cclxuXHJcblx0Ly8gY2FjaGluZyBjb21tb25seSB1c2VkIHZhcmlhYmxlc1xyXG5cdHZhciAkZG9jdW1lbnQsICRsb2NhdGlvbiwgJHJlcXVlc3RBbmltYXRpb25GcmFtZSwgJGNhbmNlbEFuaW1hdGlvbkZyYW1lXHJcblxyXG5cdC8vIHNlbGYgaW52b2tpbmcgZnVuY3Rpb24gbmVlZGVkIGJlY2F1c2Ugb2YgdGhlIHdheSBtb2NrcyB3b3JrXHJcblx0ZnVuY3Rpb24gaW5pdGlhbGl6ZShtb2NrKSB7XHJcblx0XHQkZG9jdW1lbnQgPSBtb2NrLmRvY3VtZW50XHJcblx0XHQkbG9jYXRpb24gPSBtb2NrLmxvY2F0aW9uXHJcblx0XHQkY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBtb2NrLmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IG1vY2suY2xlYXJUaW1lb3V0XHJcblx0XHQkcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gbW9jay5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgbW9jay5zZXRUaW1lb3V0XHJcblx0fVxyXG5cclxuXHQvLyB0ZXN0aW5nIEFQSVxyXG5cdG0uZGVwcyA9IGZ1bmN0aW9uIChtb2NrKSB7XHJcblx0XHRpbml0aWFsaXplKGdsb2JhbCA9IG1vY2sgfHwgd2luZG93KVxyXG5cdFx0cmV0dXJuIGdsb2JhbFxyXG5cdH1cclxuXHJcblx0bS5kZXBzKGdsb2JhbClcclxuXHJcblx0LyoqXHJcblx0ICogQHR5cGVkZWYge1N0cmluZ30gVGFnXHJcblx0ICogQSBzdHJpbmcgdGhhdCBsb29rcyBsaWtlIC0+IGRpdi5jbGFzc25hbWUjaWRbcGFyYW09b25lXVtwYXJhbTI9dHdvXVxyXG5cdCAqIFdoaWNoIGRlc2NyaWJlcyBhIERPTSBub2RlXHJcblx0ICovXHJcblxyXG5cdGZ1bmN0aW9uIHBhcnNlVGFnQXR0cnMoY2VsbCwgdGFnKSB7XHJcblx0XHR2YXIgY2xhc3NlcyA9IFtdXHJcblx0XHR2YXIgcGFyc2VyID0gLyg/OihefCN8XFwuKShbXiNcXC5cXFtcXF1dKykpfChcXFsuKz9cXF0pL2dcclxuXHRcdHZhciBtYXRjaFxyXG5cclxuXHRcdHdoaWxlICgobWF0Y2ggPSBwYXJzZXIuZXhlYyh0YWcpKSkge1xyXG5cdFx0XHRpZiAobWF0Y2hbMV0gPT09IFwiXCIgJiYgbWF0Y2hbMl0pIHtcclxuXHRcdFx0XHRjZWxsLnRhZyA9IG1hdGNoWzJdXHJcblx0XHRcdH0gZWxzZSBpZiAobWF0Y2hbMV0gPT09IFwiI1wiKSB7XHJcblx0XHRcdFx0Y2VsbC5hdHRycy5pZCA9IG1hdGNoWzJdXHJcblx0XHRcdH0gZWxzZSBpZiAobWF0Y2hbMV0gPT09IFwiLlwiKSB7XHJcblx0XHRcdFx0Y2xhc3Nlcy5wdXNoKG1hdGNoWzJdKVxyXG5cdFx0XHR9IGVsc2UgaWYgKG1hdGNoWzNdWzBdID09PSBcIltcIikge1xyXG5cdFx0XHRcdHZhciBwYWlyID0gL1xcWyguKz8pKD86PShcInwnfCkoLio/KVxcMik/XFxdLy5leGVjKG1hdGNoWzNdKVxyXG5cdFx0XHRcdGNlbGwuYXR0cnNbcGFpclsxXV0gPSBwYWlyWzNdIHx8IChwYWlyWzJdID8gXCJcIiA6IHRydWUpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gY2xhc3Nlc1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZ2V0VmlydHVhbENoaWxkcmVuKGFyZ3MsIGhhc0F0dHJzKSB7XHJcblx0XHR2YXIgY2hpbGRyZW4gPSBoYXNBdHRycyA/IGFyZ3Muc2xpY2UoMSkgOiBhcmdzXHJcblxyXG5cdFx0aWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMSAmJiBpc0FycmF5KGNoaWxkcmVuWzBdKSkge1xyXG5cdFx0XHRyZXR1cm4gY2hpbGRyZW5bMF1cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiBjaGlsZHJlblxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYXNzaWduQXR0cnModGFyZ2V0LCBhdHRycywgY2xhc3Nlcykge1xyXG5cdFx0dmFyIGNsYXNzQXR0ciA9IFwiY2xhc3NcIiBpbiBhdHRycyA/IFwiY2xhc3NcIiA6IFwiY2xhc3NOYW1lXCJcclxuXHJcblx0XHRmb3IgKHZhciBhdHRyTmFtZSBpbiBhdHRycykge1xyXG5cdFx0XHRpZiAoaGFzT3duLmNhbGwoYXR0cnMsIGF0dHJOYW1lKSkge1xyXG5cdFx0XHRcdGlmIChhdHRyTmFtZSA9PT0gY2xhc3NBdHRyICYmXHJcblx0XHRcdFx0XHRcdGF0dHJzW2F0dHJOYW1lXSAhPSBudWxsICYmXHJcblx0XHRcdFx0XHRcdGF0dHJzW2F0dHJOYW1lXSAhPT0gXCJcIikge1xyXG5cdFx0XHRcdFx0Y2xhc3Nlcy5wdXNoKGF0dHJzW2F0dHJOYW1lXSlcclxuXHRcdFx0XHRcdC8vIGNyZWF0ZSBrZXkgaW4gY29ycmVjdCBpdGVyYXRpb24gb3JkZXJcclxuXHRcdFx0XHRcdHRhcmdldFthdHRyTmFtZV0gPSBcIlwiXHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHRhcmdldFthdHRyTmFtZV0gPSBhdHRyc1thdHRyTmFtZV1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoY2xhc3Nlcy5sZW5ndGgpIHRhcmdldFtjbGFzc0F0dHJdID0gY2xhc3Nlcy5qb2luKFwiIFwiKVxyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICpcclxuXHQgKiBAcGFyYW0ge1RhZ30gVGhlIERPTSBub2RlIHRhZ1xyXG5cdCAqIEBwYXJhbSB7T2JqZWN0PVtdfSBvcHRpb25hbCBrZXktdmFsdWUgcGFpcnMgdG8gYmUgbWFwcGVkIHRvIERPTSBhdHRyc1xyXG5cdCAqIEBwYXJhbSB7Li4ubU5vZGU9W119IFplcm8gb3IgbW9yZSBNaXRocmlsIGNoaWxkIG5vZGVzLiBDYW4gYmUgYW4gYXJyYXksXHJcblx0ICogICAgICAgICAgICAgICAgICAgICAgb3Igc3BsYXQgKG9wdGlvbmFsKVxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIG0odGFnLCBwYWlycykge1xyXG5cdFx0dmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSlcclxuXHJcblx0XHRpZiAoaXNPYmplY3QodGFnKSkgcmV0dXJuIHBhcmFtZXRlcml6ZSh0YWcsIGFyZ3MpXHJcblxyXG5cdFx0aWYgKCFpc1N0cmluZyh0YWcpKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcihcInNlbGVjdG9yIGluIG0oc2VsZWN0b3IsIGF0dHJzLCBjaGlsZHJlbikgc2hvdWxkIFwiICtcclxuXHRcdFx0XHRcImJlIGEgc3RyaW5nXCIpXHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGhhc0F0dHJzID0gcGFpcnMgIT0gbnVsbCAmJiBpc09iamVjdChwYWlycykgJiZcclxuXHRcdFx0IShcInRhZ1wiIGluIHBhaXJzIHx8IFwidmlld1wiIGluIHBhaXJzIHx8IFwic3VidHJlZVwiIGluIHBhaXJzKVxyXG5cclxuXHRcdHZhciBhdHRycyA9IGhhc0F0dHJzID8gcGFpcnMgOiB7fVxyXG5cdFx0dmFyIGNlbGwgPSB7XHJcblx0XHRcdHRhZzogXCJkaXZcIixcclxuXHRcdFx0YXR0cnM6IHt9LFxyXG5cdFx0XHRjaGlsZHJlbjogZ2V0VmlydHVhbENoaWxkcmVuKGFyZ3MsIGhhc0F0dHJzKVxyXG5cdFx0fVxyXG5cclxuXHRcdGFzc2lnbkF0dHJzKGNlbGwuYXR0cnMsIGF0dHJzLCBwYXJzZVRhZ0F0dHJzKGNlbGwsIHRhZykpXHJcblx0XHRyZXR1cm4gY2VsbFxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZm9yRWFjaChsaXN0LCBmKSB7XHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoICYmICFmKGxpc3RbaV0sIGkrKyk7KSB7XHJcblx0XHRcdC8vIGZ1bmN0aW9uIGNhbGxlZCBpbiBjb25kaXRpb25cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGZvcktleXMobGlzdCwgZikge1xyXG5cdFx0Zm9yRWFjaChsaXN0LCBmdW5jdGlvbiAoYXR0cnMsIGkpIHtcclxuXHRcdFx0cmV0dXJuIChhdHRycyA9IGF0dHJzICYmIGF0dHJzLmF0dHJzKSAmJlxyXG5cdFx0XHRcdGF0dHJzLmtleSAhPSBudWxsICYmXHJcblx0XHRcdFx0ZihhdHRycywgaSlcclxuXHRcdH0pXHJcblx0fVxyXG5cdC8vIFRoaXMgZnVuY3Rpb24gd2FzIGNhdXNpbmcgZGVvcHRzIGluIENocm9tZS5cclxuXHRmdW5jdGlvbiBkYXRhVG9TdHJpbmcoZGF0YSkge1xyXG5cdFx0Ly8gZGF0YS50b1N0cmluZygpIG1pZ2h0IHRocm93IG9yIHJldHVybiBudWxsIGlmIGRhdGEgaXMgdGhlIHJldHVyblxyXG5cdFx0Ly8gdmFsdWUgb2YgQ29uc29sZS5sb2cgaW4gc29tZSB2ZXJzaW9ucyBvZiBGaXJlZm94IChiZWhhdmlvciBkZXBlbmRzIG9uXHJcblx0XHQvLyB2ZXJzaW9uKVxyXG5cdFx0dHJ5IHtcclxuXHRcdFx0aWYgKGRhdGEgIT0gbnVsbCAmJiBkYXRhLnRvU3RyaW5nKCkgIT0gbnVsbCkgcmV0dXJuIGRhdGFcclxuXHRcdH0gY2F0Y2ggKGUpIHtcclxuXHRcdFx0Ly8gc2lsZW50bHkgaWdub3JlIGVycm9yc1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIFwiXCJcclxuXHR9XHJcblxyXG5cdC8vIFRoaXMgZnVuY3Rpb24gd2FzIGNhdXNpbmcgZGVvcHRzIGluIENocm9tZS5cclxuXHRmdW5jdGlvbiBpbmplY3RUZXh0Tm9kZShwYXJlbnRFbGVtZW50LCBmaXJzdCwgaW5kZXgsIGRhdGEpIHtcclxuXHRcdHRyeSB7XHJcblx0XHRcdGluc2VydE5vZGUocGFyZW50RWxlbWVudCwgZmlyc3QsIGluZGV4KVxyXG5cdFx0XHRmaXJzdC5ub2RlVmFsdWUgPSBkYXRhXHJcblx0XHR9IGNhdGNoIChlKSB7XHJcblx0XHRcdC8vIElFIGVycm9uZW91c2x5IHRocm93cyBlcnJvciB3aGVuIGFwcGVuZGluZyBhbiBlbXB0eSB0ZXh0IG5vZGVcclxuXHRcdFx0Ly8gYWZ0ZXIgYSBudWxsXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBmbGF0dGVuKGxpc3QpIHtcclxuXHRcdC8vIHJlY3Vyc2l2ZWx5IGZsYXR0ZW4gYXJyYXlcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRpZiAoaXNBcnJheShsaXN0W2ldKSkge1xyXG5cdFx0XHRcdGxpc3QgPSBsaXN0LmNvbmNhdC5hcHBseShbXSwgbGlzdClcclxuXHRcdFx0XHQvLyBjaGVjayBjdXJyZW50IGluZGV4IGFnYWluIGFuZCBmbGF0dGVuIHVudGlsIHRoZXJlIGFyZSBubyBtb3JlXHJcblx0XHRcdFx0Ly8gbmVzdGVkIGFycmF5cyBhdCB0aGF0IGluZGV4XHJcblx0XHRcdFx0aS0tXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBsaXN0XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBpbnNlcnROb2RlKHBhcmVudEVsZW1lbnQsIG5vZGUsIGluZGV4KSB7XHJcblx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShub2RlLFxyXG5cdFx0XHRwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdIHx8IG51bGwpXHJcblx0fVxyXG5cclxuXHR2YXIgREVMRVRJT04gPSAxXHJcblx0dmFyIElOU0VSVElPTiA9IDJcclxuXHR2YXIgTU9WRSA9IDNcclxuXHJcblx0ZnVuY3Rpb24gaGFuZGxlS2V5c0RpZmZlcihkYXRhLCBleGlzdGluZywgY2FjaGVkLCBwYXJlbnRFbGVtZW50KSB7XHJcblx0XHRmb3JLZXlzKGRhdGEsIGZ1bmN0aW9uIChrZXksIGkpIHtcclxuXHRcdFx0ZXhpc3Rpbmdba2V5ID0ga2V5LmtleV0gPSBleGlzdGluZ1trZXldID8ge1xyXG5cdFx0XHRcdGFjdGlvbjogTU9WRSxcclxuXHRcdFx0XHRpbmRleDogaSxcclxuXHRcdFx0XHRmcm9tOiBleGlzdGluZ1trZXldLmluZGV4LFxyXG5cdFx0XHRcdGVsZW1lbnQ6IGNhY2hlZC5ub2Rlc1tleGlzdGluZ1trZXldLmluZGV4XSB8fFxyXG5cdFx0XHRcdFx0JGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcclxuXHRcdFx0fSA6IHthY3Rpb246IElOU0VSVElPTiwgaW5kZXg6IGl9XHJcblx0XHR9KVxyXG5cclxuXHRcdHZhciBhY3Rpb25zID0gW11cclxuXHRcdGZvciAodmFyIHByb3AgaW4gZXhpc3RpbmcpIGlmIChoYXNPd24uY2FsbChleGlzdGluZywgcHJvcCkpIHtcclxuXHRcdFx0YWN0aW9ucy5wdXNoKGV4aXN0aW5nW3Byb3BdKVxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBjaGFuZ2VzID0gYWN0aW9ucy5zb3J0KHNvcnRDaGFuZ2VzKVxyXG5cdFx0dmFyIG5ld0NhY2hlZCA9IG5ldyBBcnJheShjYWNoZWQubGVuZ3RoKVxyXG5cclxuXHRcdG5ld0NhY2hlZC5ub2RlcyA9IGNhY2hlZC5ub2Rlcy5zbGljZSgpXHJcblxyXG5cdFx0Zm9yRWFjaChjaGFuZ2VzLCBmdW5jdGlvbiAoY2hhbmdlKSB7XHJcblx0XHRcdHZhciBpbmRleCA9IGNoYW5nZS5pbmRleFxyXG5cdFx0XHRpZiAoY2hhbmdlLmFjdGlvbiA9PT0gREVMRVRJT04pIHtcclxuXHRcdFx0XHRjbGVhcihjYWNoZWRbaW5kZXhdLm5vZGVzLCBjYWNoZWRbaW5kZXhdKVxyXG5cdFx0XHRcdG5ld0NhY2hlZC5zcGxpY2UoaW5kZXgsIDEpXHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGNoYW5nZS5hY3Rpb24gPT09IElOU0VSVElPTikge1xyXG5cdFx0XHRcdHZhciBkdW1teSA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXHJcblx0XHRcdFx0ZHVtbXkua2V5ID0gZGF0YVtpbmRleF0uYXR0cnMua2V5XHJcblx0XHRcdFx0aW5zZXJ0Tm9kZShwYXJlbnRFbGVtZW50LCBkdW1teSwgaW5kZXgpXHJcblx0XHRcdFx0bmV3Q2FjaGVkLnNwbGljZShpbmRleCwgMCwge1xyXG5cdFx0XHRcdFx0YXR0cnM6IHtrZXk6IGRhdGFbaW5kZXhdLmF0dHJzLmtleX0sXHJcblx0XHRcdFx0XHRub2RlczogW2R1bW15XVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0bmV3Q2FjaGVkLm5vZGVzW2luZGV4XSA9IGR1bW15XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChjaGFuZ2UuYWN0aW9uID09PSBNT1ZFKSB7XHJcblx0XHRcdFx0dmFyIGNoYW5nZUVsZW1lbnQgPSBjaGFuZ2UuZWxlbWVudFxyXG5cdFx0XHRcdHZhciBtYXliZUNoYW5nZWQgPSBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdXHJcblx0XHRcdFx0aWYgKG1heWJlQ2hhbmdlZCAhPT0gY2hhbmdlRWxlbWVudCAmJiBjaGFuZ2VFbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShjaGFuZ2VFbGVtZW50LFxyXG5cdFx0XHRcdFx0XHRtYXliZUNoYW5nZWQgfHwgbnVsbClcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0bmV3Q2FjaGVkW2luZGV4XSA9IGNhY2hlZFtjaGFuZ2UuZnJvbV1cclxuXHRcdFx0XHRuZXdDYWNoZWQubm9kZXNbaW5kZXhdID0gY2hhbmdlRWxlbWVudFxyXG5cdFx0XHR9XHJcblx0XHR9KVxyXG5cclxuXHRcdHJldHVybiBuZXdDYWNoZWRcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGRpZmZLZXlzKGRhdGEsIGNhY2hlZCwgZXhpc3RpbmcsIHBhcmVudEVsZW1lbnQpIHtcclxuXHRcdHZhciBrZXlzRGlmZmVyID0gZGF0YS5sZW5ndGggIT09IGNhY2hlZC5sZW5ndGhcclxuXHJcblx0XHRpZiAoIWtleXNEaWZmZXIpIHtcclxuXHRcdFx0Zm9yS2V5cyhkYXRhLCBmdW5jdGlvbiAoYXR0cnMsIGkpIHtcclxuXHRcdFx0XHR2YXIgY2FjaGVkQ2VsbCA9IGNhY2hlZFtpXVxyXG5cdFx0XHRcdHJldHVybiBrZXlzRGlmZmVyID0gY2FjaGVkQ2VsbCAmJlxyXG5cdFx0XHRcdFx0Y2FjaGVkQ2VsbC5hdHRycyAmJlxyXG5cdFx0XHRcdFx0Y2FjaGVkQ2VsbC5hdHRycy5rZXkgIT09IGF0dHJzLmtleVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChrZXlzRGlmZmVyKSB7XHJcblx0XHRcdHJldHVybiBoYW5kbGVLZXlzRGlmZmVyKGRhdGEsIGV4aXN0aW5nLCBjYWNoZWQsIHBhcmVudEVsZW1lbnQpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gY2FjaGVkXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBkaWZmQXJyYXkoZGF0YSwgY2FjaGVkLCBub2Rlcykge1xyXG5cdFx0Ly8gZGlmZiB0aGUgYXJyYXkgaXRzZWxmXHJcblxyXG5cdFx0Ly8gdXBkYXRlIHRoZSBsaXN0IG9mIERPTSBub2RlcyBieSBjb2xsZWN0aW5nIHRoZSBub2RlcyBmcm9tIGVhY2ggaXRlbVxyXG5cdFx0Zm9yRWFjaChkYXRhLCBmdW5jdGlvbiAoXywgaSkge1xyXG5cdFx0XHRpZiAoY2FjaGVkW2ldICE9IG51bGwpIG5vZGVzLnB1c2guYXBwbHkobm9kZXMsIGNhY2hlZFtpXS5ub2RlcylcclxuXHRcdH0pXHJcblx0XHQvLyByZW1vdmUgaXRlbXMgZnJvbSB0aGUgZW5kIG9mIHRoZSBhcnJheSBpZiB0aGUgbmV3IGFycmF5IGlzIHNob3J0ZXJcclxuXHRcdC8vIHRoYW4gdGhlIG9sZCBvbmUuIGlmIGVycm9ycyBldmVyIGhhcHBlbiBoZXJlLCB0aGUgaXNzdWUgaXMgbW9zdFxyXG5cdFx0Ly8gbGlrZWx5IGEgYnVnIGluIHRoZSBjb25zdHJ1Y3Rpb24gb2YgdGhlIGBjYWNoZWRgIGRhdGEgc3RydWN0dXJlXHJcblx0XHQvLyBzb21ld2hlcmUgZWFybGllciBpbiB0aGUgcHJvZ3JhbVxyXG5cdFx0Zm9yRWFjaChjYWNoZWQubm9kZXMsIGZ1bmN0aW9uIChub2RlLCBpKSB7XHJcblx0XHRcdGlmIChub2RlLnBhcmVudE5vZGUgIT0gbnVsbCAmJiBub2Rlcy5pbmRleE9mKG5vZGUpIDwgMCkge1xyXG5cdFx0XHRcdGNsZWFyKFtub2RlXSwgW2NhY2hlZFtpXV0pXHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblxyXG5cdFx0aWYgKGRhdGEubGVuZ3RoIDwgY2FjaGVkLmxlbmd0aCkgY2FjaGVkLmxlbmd0aCA9IGRhdGEubGVuZ3RoXHJcblx0XHRjYWNoZWQubm9kZXMgPSBub2Rlc1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYnVpbGRBcnJheUtleXMoZGF0YSkge1xyXG5cdFx0dmFyIGd1aWQgPSAwXHJcblx0XHRmb3JLZXlzKGRhdGEsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0Zm9yRWFjaChkYXRhLCBmdW5jdGlvbiAoYXR0cnMpIHtcclxuXHRcdFx0XHRpZiAoKGF0dHJzID0gYXR0cnMgJiYgYXR0cnMuYXR0cnMpICYmIGF0dHJzLmtleSA9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRhdHRycy5rZXkgPSBcIl9fbWl0aHJpbF9fXCIgKyBndWlkKytcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHRcdHJldHVybiAxXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaXNEaWZmZXJlbnRFbm91Z2goZGF0YSwgY2FjaGVkLCBkYXRhQXR0cktleXMpIHtcclxuXHRcdGlmIChkYXRhLnRhZyAhPT0gY2FjaGVkLnRhZykgcmV0dXJuIHRydWVcclxuXHJcblx0XHRpZiAoZGF0YUF0dHJLZXlzLnNvcnQoKS5qb2luKCkgIT09XHJcblx0XHRcdFx0T2JqZWN0LmtleXMoY2FjaGVkLmF0dHJzKS5zb3J0KCkuam9pbigpKSB7XHJcblx0XHRcdHJldHVybiB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGRhdGEuYXR0cnMuaWQgIT09IGNhY2hlZC5hdHRycy5pZCkge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChkYXRhLmF0dHJzLmtleSAhPT0gY2FjaGVkLmF0dHJzLmtleSkge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChtLnJlZHJhdy5zdHJhdGVneSgpID09PSBcImFsbFwiKSB7XHJcblx0XHRcdHJldHVybiAhY2FjaGVkLmNvbmZpZ0NvbnRleHQgfHwgY2FjaGVkLmNvbmZpZ0NvbnRleHQucmV0YWluICE9PSB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT09IFwiZGlmZlwiKSB7XHJcblx0XHRcdHJldHVybiBjYWNoZWQuY29uZmlnQ29udGV4dCAmJiBjYWNoZWQuY29uZmlnQ29udGV4dC5yZXRhaW4gPT09IGZhbHNlXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGZhbHNlXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBtYXliZVJlY3JlYXRlT2JqZWN0KGRhdGEsIGNhY2hlZCwgZGF0YUF0dHJLZXlzKSB7XHJcblx0XHQvLyBpZiBhbiBlbGVtZW50IGlzIGRpZmZlcmVudCBlbm91Z2ggZnJvbSB0aGUgb25lIGluIGNhY2hlLCByZWNyZWF0ZSBpdFxyXG5cdFx0aWYgKGlzRGlmZmVyZW50RW5vdWdoKGRhdGEsIGNhY2hlZCwgZGF0YUF0dHJLZXlzKSkge1xyXG5cdFx0XHRpZiAoY2FjaGVkLm5vZGVzLmxlbmd0aCkgY2xlYXIoY2FjaGVkLm5vZGVzKVxyXG5cclxuXHRcdFx0aWYgKGNhY2hlZC5jb25maWdDb250ZXh0ICYmXHJcblx0XHRcdFx0XHRpc0Z1bmN0aW9uKGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkKSkge1xyXG5cdFx0XHRcdGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkKClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGNhY2hlZC5jb250cm9sbGVycykge1xyXG5cdFx0XHRcdGZvckVhY2goY2FjaGVkLmNvbnRyb2xsZXJzLCBmdW5jdGlvbiAoY29udHJvbGxlcikge1xyXG5cdFx0XHRcdFx0aWYgKGNvbnRyb2xsZXIub251bmxvYWQpIGNvbnRyb2xsZXIub251bmxvYWQoe3ByZXZlbnREZWZhdWx0OiBub29wfSk7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldE9iamVjdE5hbWVzcGFjZShkYXRhLCBuYW1lc3BhY2UpIHtcclxuXHRcdGlmIChkYXRhLmF0dHJzLnhtbG5zKSByZXR1cm4gZGF0YS5hdHRycy54bWxuc1xyXG5cdFx0aWYgKGRhdGEudGFnID09PSBcInN2Z1wiKSByZXR1cm4gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXHJcblx0XHRpZiAoZGF0YS50YWcgPT09IFwibWF0aFwiKSByZXR1cm4gXCJodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGgvTWF0aE1MXCJcclxuXHRcdHJldHVybiBuYW1lc3BhY2VcclxuXHR9XHJcblxyXG5cdHZhciBwZW5kaW5nUmVxdWVzdHMgPSAwXHJcblx0bS5zdGFydENvbXB1dGF0aW9uID0gZnVuY3Rpb24gKCkgeyBwZW5kaW5nUmVxdWVzdHMrKyB9XHJcblx0bS5lbmRDb21wdXRhdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmIChwZW5kaW5nUmVxdWVzdHMgPiAxKSB7XHJcblx0XHRcdHBlbmRpbmdSZXF1ZXN0cy0tXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRwZW5kaW5nUmVxdWVzdHMgPSAwXHJcblx0XHRcdG0ucmVkcmF3KClcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHVubG9hZENhY2hlZENvbnRyb2xsZXJzKGNhY2hlZCwgdmlld3MsIGNvbnRyb2xsZXJzKSB7XHJcblx0XHRpZiAoY29udHJvbGxlcnMubGVuZ3RoKSB7XHJcblx0XHRcdGNhY2hlZC52aWV3cyA9IHZpZXdzXHJcblx0XHRcdGNhY2hlZC5jb250cm9sbGVycyA9IGNvbnRyb2xsZXJzXHJcblx0XHRcdGZvckVhY2goY29udHJvbGxlcnMsIGZ1bmN0aW9uIChjb250cm9sbGVyKSB7XHJcblx0XHRcdFx0aWYgKGNvbnRyb2xsZXIub251bmxvYWQgJiYgY29udHJvbGxlci5vbnVubG9hZC4kb2xkKSB7XHJcblx0XHRcdFx0XHRjb250cm9sbGVyLm9udW5sb2FkID0gY29udHJvbGxlci5vbnVubG9hZC4kb2xkXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiAocGVuZGluZ1JlcXVlc3RzICYmIGNvbnRyb2xsZXIub251bmxvYWQpIHtcclxuXHRcdFx0XHRcdHZhciBvbnVubG9hZCA9IGNvbnRyb2xsZXIub251bmxvYWRcclxuXHRcdFx0XHRcdGNvbnRyb2xsZXIub251bmxvYWQgPSBub29wXHJcblx0XHRcdFx0XHRjb250cm9sbGVyLm9udW5sb2FkLiRvbGQgPSBvbnVubG9hZFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNjaGVkdWxlQ29uZmlnc1RvQmVDYWxsZWQoY29uZmlncywgZGF0YSwgbm9kZSwgaXNOZXcsIGNhY2hlZCkge1xyXG5cdFx0Ly8gc2NoZWR1bGUgY29uZmlncyB0byBiZSBjYWxsZWQuIFRoZXkgYXJlIGNhbGxlZCBhZnRlciBgYnVpbGRgIGZpbmlzaGVzXHJcblx0XHQvLyBydW5uaW5nXHJcblx0XHRpZiAoaXNGdW5jdGlvbihkYXRhLmF0dHJzLmNvbmZpZykpIHtcclxuXHRcdFx0dmFyIGNvbnRleHQgPSBjYWNoZWQuY29uZmlnQ29udGV4dCA9IGNhY2hlZC5jb25maWdDb250ZXh0IHx8IHt9XHJcblxyXG5cdFx0XHQvLyBiaW5kXHJcblx0XHRcdGNvbmZpZ3MucHVzaChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0cmV0dXJuIGRhdGEuYXR0cnMuY29uZmlnLmNhbGwoZGF0YSwgbm9kZSwgIWlzTmV3LCBjb250ZXh0LFxyXG5cdFx0XHRcdFx0Y2FjaGVkKVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYnVpbGRVcGRhdGVkTm9kZShcclxuXHRcdGNhY2hlZCxcclxuXHRcdGRhdGEsXHJcblx0XHRlZGl0YWJsZSxcclxuXHRcdGhhc0tleXMsXHJcblx0XHRuYW1lc3BhY2UsXHJcblx0XHR2aWV3cyxcclxuXHRcdGNvbmZpZ3MsXHJcblx0XHRjb250cm9sbGVyc1xyXG5cdCkge1xyXG5cdFx0dmFyIG5vZGUgPSBjYWNoZWQubm9kZXNbMF1cclxuXHJcblx0XHRpZiAoaGFzS2V5cykge1xyXG5cdFx0XHRzZXRBdHRyaWJ1dGVzKG5vZGUsIGRhdGEudGFnLCBkYXRhLmF0dHJzLCBjYWNoZWQuYXR0cnMsIG5hbWVzcGFjZSlcclxuXHRcdH1cclxuXHJcblx0XHRjYWNoZWQuY2hpbGRyZW4gPSBidWlsZChcclxuXHRcdFx0bm9kZSxcclxuXHRcdFx0ZGF0YS50YWcsXHJcblx0XHRcdHVuZGVmaW5lZCxcclxuXHRcdFx0dW5kZWZpbmVkLFxyXG5cdFx0XHRkYXRhLmNoaWxkcmVuLFxyXG5cdFx0XHRjYWNoZWQuY2hpbGRyZW4sXHJcblx0XHRcdGZhbHNlLFxyXG5cdFx0XHQwLFxyXG5cdFx0XHRkYXRhLmF0dHJzLmNvbnRlbnRlZGl0YWJsZSA/IG5vZGUgOiBlZGl0YWJsZSxcclxuXHRcdFx0bmFtZXNwYWNlLFxyXG5cdFx0XHRjb25maWdzXHJcblx0XHQpXHJcblxyXG5cdFx0Y2FjaGVkLm5vZGVzLmludGFjdCA9IHRydWVcclxuXHJcblx0XHRpZiAoY29udHJvbGxlcnMubGVuZ3RoKSB7XHJcblx0XHRcdGNhY2hlZC52aWV3cyA9IHZpZXdzXHJcblx0XHRcdGNhY2hlZC5jb250cm9sbGVycyA9IGNvbnRyb2xsZXJzXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG5vZGVcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGhhbmRsZU5vbmV4aXN0ZW50Tm9kZXMoZGF0YSwgcGFyZW50RWxlbWVudCwgaW5kZXgpIHtcclxuXHRcdHZhciBub2Rlc1xyXG5cdFx0aWYgKGRhdGEuJHRydXN0ZWQpIHtcclxuXHRcdFx0bm9kZXMgPSBpbmplY3RIVE1MKHBhcmVudEVsZW1lbnQsIGluZGV4LCBkYXRhKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0bm9kZXMgPSBbJGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpXVxyXG5cdFx0XHRpZiAoIShwYXJlbnRFbGVtZW50Lm5vZGVOYW1lIGluIHZvaWRFbGVtZW50cykpIHtcclxuXHRcdFx0XHRpbnNlcnROb2RlKHBhcmVudEVsZW1lbnQsIG5vZGVzWzBdLCBpbmRleClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBjYWNoZWRcclxuXHJcblx0XHRpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIgfHxcclxuXHRcdFx0XHR0eXBlb2YgZGF0YSA9PT0gXCJudW1iZXJcIiB8fFxyXG5cdFx0XHRcdHR5cGVvZiBkYXRhID09PSBcImJvb2xlYW5cIikge1xyXG5cdFx0XHRjYWNoZWQgPSBuZXcgZGF0YS5jb25zdHJ1Y3RvcihkYXRhKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y2FjaGVkID0gZGF0YVxyXG5cdFx0fVxyXG5cclxuXHRcdGNhY2hlZC5ub2RlcyA9IG5vZGVzXHJcblx0XHRyZXR1cm4gY2FjaGVkXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWF0dGFjaE5vZGVzKFxyXG5cdFx0ZGF0YSxcclxuXHRcdGNhY2hlZCxcclxuXHRcdHBhcmVudEVsZW1lbnQsXHJcblx0XHRlZGl0YWJsZSxcclxuXHRcdGluZGV4LFxyXG5cdFx0cGFyZW50VGFnXHJcblx0KSB7XHJcblx0XHR2YXIgbm9kZXMgPSBjYWNoZWQubm9kZXNcclxuXHRcdGlmICghZWRpdGFibGUgfHwgZWRpdGFibGUgIT09ICRkb2N1bWVudC5hY3RpdmVFbGVtZW50KSB7XHJcblx0XHRcdGlmIChkYXRhLiR0cnVzdGVkKSB7XHJcblx0XHRcdFx0Y2xlYXIobm9kZXMsIGNhY2hlZClcclxuXHRcdFx0XHRub2RlcyA9IGluamVjdEhUTUwocGFyZW50RWxlbWVudCwgaW5kZXgsIGRhdGEpXHJcblx0XHRcdH0gZWxzZSBpZiAocGFyZW50VGFnID09PSBcInRleHRhcmVhXCIpIHtcclxuXHRcdFx0XHQvLyA8dGV4dGFyZWE+IHVzZXMgYHZhbHVlYCBpbnN0ZWFkIG9mIGBub2RlVmFsdWVgLlxyXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQudmFsdWUgPSBkYXRhXHJcblx0XHRcdH0gZWxzZSBpZiAoZWRpdGFibGUpIHtcclxuXHRcdFx0XHQvLyBjb250ZW50ZWRpdGFibGUgbm9kZXMgdXNlIGBpbm5lckhUTUxgIGluc3RlYWQgb2YgYG5vZGVWYWx1ZWAuXHJcblx0XHRcdFx0ZWRpdGFibGUuaW5uZXJIVE1MID0gZGF0YVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdC8vIHdhcyBhIHRydXN0ZWQgc3RyaW5nXHJcblx0XHRcdFx0aWYgKG5vZGVzWzBdLm5vZGVUeXBlID09PSAxIHx8IG5vZGVzLmxlbmd0aCA+IDEgfHxcclxuXHRcdFx0XHRcdFx0KG5vZGVzWzBdLm5vZGVWYWx1ZS50cmltICYmXHJcblx0XHRcdFx0XHRcdFx0IW5vZGVzWzBdLm5vZGVWYWx1ZS50cmltKCkpKSB7XHJcblx0XHRcdFx0XHRjbGVhcihjYWNoZWQubm9kZXMsIGNhY2hlZClcclxuXHRcdFx0XHRcdG5vZGVzID0gWyRkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKV1cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGluamVjdFRleHROb2RlKHBhcmVudEVsZW1lbnQsIG5vZGVzWzBdLCBpbmRleCwgZGF0YSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0Y2FjaGVkID0gbmV3IGRhdGEuY29uc3RydWN0b3IoZGF0YSlcclxuXHRcdGNhY2hlZC5ub2RlcyA9IG5vZGVzXHJcblx0XHRyZXR1cm4gY2FjaGVkXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBoYW5kbGVUZXh0Tm9kZShcclxuXHRcdGNhY2hlZCxcclxuXHRcdGRhdGEsXHJcblx0XHRpbmRleCxcclxuXHRcdHBhcmVudEVsZW1lbnQsXHJcblx0XHRzaG91bGRSZWF0dGFjaCxcclxuXHRcdGVkaXRhYmxlLFxyXG5cdFx0cGFyZW50VGFnXHJcblx0KSB7XHJcblx0XHRpZiAoIWNhY2hlZC5ub2Rlcy5sZW5ndGgpIHtcclxuXHRcdFx0cmV0dXJuIGhhbmRsZU5vbmV4aXN0ZW50Tm9kZXMoZGF0YSwgcGFyZW50RWxlbWVudCwgaW5kZXgpXHJcblx0XHR9IGVsc2UgaWYgKGNhY2hlZC52YWx1ZU9mKCkgIT09IGRhdGEudmFsdWVPZigpIHx8IHNob3VsZFJlYXR0YWNoKSB7XHJcblx0XHRcdHJldHVybiByZWF0dGFjaE5vZGVzKGRhdGEsIGNhY2hlZCwgcGFyZW50RWxlbWVudCwgZWRpdGFibGUsIGluZGV4LFxyXG5cdFx0XHRcdHBhcmVudFRhZylcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiAoY2FjaGVkLm5vZGVzLmludGFjdCA9IHRydWUsIGNhY2hlZClcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldFN1YkFycmF5Q291bnQoaXRlbSkge1xyXG5cdFx0aWYgKGl0ZW0uJHRydXN0ZWQpIHtcclxuXHRcdFx0Ly8gZml4IG9mZnNldCBvZiBuZXh0IGVsZW1lbnQgaWYgaXRlbSB3YXMgYSB0cnVzdGVkIHN0cmluZyB3LyBtb3JlXHJcblx0XHRcdC8vIHRoYW4gb25lIGh0bWwgZWxlbWVudFxyXG5cdFx0XHQvLyB0aGUgZmlyc3QgY2xhdXNlIGluIHRoZSByZWdleHAgbWF0Y2hlcyBlbGVtZW50c1xyXG5cdFx0XHQvLyB0aGUgc2Vjb25kIGNsYXVzZSAoYWZ0ZXIgdGhlIHBpcGUpIG1hdGNoZXMgdGV4dCBub2Rlc1xyXG5cdFx0XHR2YXIgbWF0Y2ggPSBpdGVtLm1hdGNoKC88W15cXC9dfFxcPlxccypbXjxdL2cpXHJcblx0XHRcdGlmIChtYXRjaCAhPSBudWxsKSByZXR1cm4gbWF0Y2gubGVuZ3RoXHJcblx0XHR9IGVsc2UgaWYgKGlzQXJyYXkoaXRlbSkpIHtcclxuXHRcdFx0cmV0dXJuIGl0ZW0ubGVuZ3RoXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gMVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYnVpbGRBcnJheShcclxuXHRcdGRhdGEsXHJcblx0XHRjYWNoZWQsXHJcblx0XHRwYXJlbnRFbGVtZW50LFxyXG5cdFx0aW5kZXgsXHJcblx0XHRwYXJlbnRUYWcsXHJcblx0XHRzaG91bGRSZWF0dGFjaCxcclxuXHRcdGVkaXRhYmxlLFxyXG5cdFx0bmFtZXNwYWNlLFxyXG5cdFx0Y29uZmlnc1xyXG5cdCkge1xyXG5cdFx0ZGF0YSA9IGZsYXR0ZW4oZGF0YSlcclxuXHRcdHZhciBub2RlcyA9IFtdXHJcblx0XHR2YXIgaW50YWN0ID0gY2FjaGVkLmxlbmd0aCA9PT0gZGF0YS5sZW5ndGhcclxuXHRcdHZhciBzdWJBcnJheUNvdW50ID0gMFxyXG5cclxuXHRcdC8vIGtleXMgYWxnb3JpdGhtOiBzb3J0IGVsZW1lbnRzIHdpdGhvdXQgcmVjcmVhdGluZyB0aGVtIGlmIGtleXMgYXJlXHJcblx0XHQvLyBwcmVzZW50XHJcblx0XHQvL1xyXG5cdFx0Ly8gMSkgY3JlYXRlIGEgbWFwIG9mIGFsbCBleGlzdGluZyBrZXlzLCBhbmQgbWFyayBhbGwgZm9yIGRlbGV0aW9uXHJcblx0XHQvLyAyKSBhZGQgbmV3IGtleXMgdG8gbWFwIGFuZCBtYXJrIHRoZW0gZm9yIGFkZGl0aW9uXHJcblx0XHQvLyAzKSBpZiBrZXkgZXhpc3RzIGluIG5ldyBsaXN0LCBjaGFuZ2UgYWN0aW9uIGZyb20gZGVsZXRpb24gdG8gYSBtb3ZlXHJcblx0XHQvLyA0KSBmb3IgZWFjaCBrZXksIGhhbmRsZSBpdHMgY29ycmVzcG9uZGluZyBhY3Rpb24gYXMgbWFya2VkIGluXHJcblx0XHQvLyAgICBwcmV2aW91cyBzdGVwc1xyXG5cclxuXHRcdHZhciBleGlzdGluZyA9IHt9XHJcblx0XHR2YXIgc2hvdWxkTWFpbnRhaW5JZGVudGl0aWVzID0gZmFsc2VcclxuXHJcblx0XHRmb3JLZXlzKGNhY2hlZCwgZnVuY3Rpb24gKGF0dHJzLCBpKSB7XHJcblx0XHRcdHNob3VsZE1haW50YWluSWRlbnRpdGllcyA9IHRydWVcclxuXHRcdFx0ZXhpc3RpbmdbY2FjaGVkW2ldLmF0dHJzLmtleV0gPSB7YWN0aW9uOiBERUxFVElPTiwgaW5kZXg6IGl9XHJcblx0XHR9KVxyXG5cclxuXHRcdGJ1aWxkQXJyYXlLZXlzKGRhdGEpXHJcblx0XHRpZiAoc2hvdWxkTWFpbnRhaW5JZGVudGl0aWVzKSB7XHJcblx0XHRcdGNhY2hlZCA9IGRpZmZLZXlzKGRhdGEsIGNhY2hlZCwgZXhpc3RpbmcsIHBhcmVudEVsZW1lbnQpXHJcblx0XHR9XHJcblx0XHQvLyBlbmQga2V5IGFsZ29yaXRobVxyXG5cclxuXHRcdHZhciBjYWNoZUNvdW50ID0gMFxyXG5cdFx0Ly8gZmFzdGVyIGV4cGxpY2l0bHkgd3JpdHRlblxyXG5cdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0Ly8gZGlmZiBlYWNoIGl0ZW0gaW4gdGhlIGFycmF5XHJcblx0XHRcdHZhciBpdGVtID0gYnVpbGQoXHJcblx0XHRcdFx0cGFyZW50RWxlbWVudCxcclxuXHRcdFx0XHRwYXJlbnRUYWcsXHJcblx0XHRcdFx0Y2FjaGVkLFxyXG5cdFx0XHRcdGluZGV4LFxyXG5cdFx0XHRcdGRhdGFbaV0sXHJcblx0XHRcdFx0Y2FjaGVkW2NhY2hlQ291bnRdLFxyXG5cdFx0XHRcdHNob3VsZFJlYXR0YWNoLFxyXG5cdFx0XHRcdGluZGV4ICsgc3ViQXJyYXlDb3VudCB8fCBzdWJBcnJheUNvdW50LFxyXG5cdFx0XHRcdGVkaXRhYmxlLFxyXG5cdFx0XHRcdG5hbWVzcGFjZSxcclxuXHRcdFx0XHRjb25maWdzKVxyXG5cclxuXHRcdFx0aWYgKGl0ZW0gIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdGludGFjdCA9IGludGFjdCAmJiBpdGVtLm5vZGVzLmludGFjdFxyXG5cdFx0XHRcdHN1YkFycmF5Q291bnQgKz0gZ2V0U3ViQXJyYXlDb3VudChpdGVtKVxyXG5cdFx0XHRcdGNhY2hlZFtjYWNoZUNvdW50KytdID0gaXRlbVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCFpbnRhY3QpIGRpZmZBcnJheShkYXRhLCBjYWNoZWQsIG5vZGVzKVxyXG5cdFx0cmV0dXJuIGNhY2hlZFxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gbWFrZUNhY2hlKGRhdGEsIGNhY2hlZCwgaW5kZXgsIHBhcmVudEluZGV4LCBwYXJlbnRDYWNoZSkge1xyXG5cdFx0aWYgKGNhY2hlZCAhPSBudWxsKSB7XHJcblx0XHRcdGlmICh0eXBlLmNhbGwoY2FjaGVkKSA9PT0gdHlwZS5jYWxsKGRhdGEpKSByZXR1cm4gY2FjaGVkXHJcblxyXG5cdFx0XHRpZiAocGFyZW50Q2FjaGUgJiYgcGFyZW50Q2FjaGUubm9kZXMpIHtcclxuXHRcdFx0XHR2YXIgb2Zmc2V0ID0gaW5kZXggLSBwYXJlbnRJbmRleFxyXG5cdFx0XHRcdHZhciBlbmQgPSBvZmZzZXQgKyAoaXNBcnJheShkYXRhKSA/IGRhdGEgOiBjYWNoZWQubm9kZXMpLmxlbmd0aFxyXG5cdFx0XHRcdGNsZWFyKFxyXG5cdFx0XHRcdFx0cGFyZW50Q2FjaGUubm9kZXMuc2xpY2Uob2Zmc2V0LCBlbmQpLFxyXG5cdFx0XHRcdFx0cGFyZW50Q2FjaGUuc2xpY2Uob2Zmc2V0LCBlbmQpKVxyXG5cdFx0XHR9IGVsc2UgaWYgKGNhY2hlZC5ub2Rlcykge1xyXG5cdFx0XHRcdGNsZWFyKGNhY2hlZC5ub2RlcywgY2FjaGVkKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0Y2FjaGVkID0gbmV3IGRhdGEuY29uc3RydWN0b3IoKVxyXG5cdFx0Ly8gaWYgY29uc3RydWN0b3IgY3JlYXRlcyBhIHZpcnR1YWwgZG9tIGVsZW1lbnQsIHVzZSBhIGJsYW5rIG9iamVjdCBhc1xyXG5cdFx0Ly8gdGhlIGJhc2UgY2FjaGVkIG5vZGUgaW5zdGVhZCBvZiBjb3B5aW5nIHRoZSB2aXJ0dWFsIGVsICgjMjc3KVxyXG5cdFx0aWYgKGNhY2hlZC50YWcpIGNhY2hlZCA9IHt9XHJcblx0XHRjYWNoZWQubm9kZXMgPSBbXVxyXG5cdFx0cmV0dXJuIGNhY2hlZFxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gY29uc3RydWN0Tm9kZShkYXRhLCBuYW1lc3BhY2UpIHtcclxuXHRcdGlmIChkYXRhLmF0dHJzLmlzKSB7XHJcblx0XHRcdGlmIChuYW1lc3BhY2UgPT0gbnVsbCkge1xyXG5cdFx0XHRcdHJldHVybiAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChkYXRhLnRhZywgZGF0YS5hdHRycy5pcylcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIGRhdGEudGFnLFxyXG5cdFx0XHRcdFx0ZGF0YS5hdHRycy5pcylcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIGlmIChuYW1lc3BhY2UgPT0gbnVsbCkge1xyXG5cdFx0XHRyZXR1cm4gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZGF0YS50YWcpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIGRhdGEudGFnKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gY29uc3RydWN0QXR0cnMoZGF0YSwgbm9kZSwgbmFtZXNwYWNlLCBoYXNLZXlzKSB7XHJcblx0XHRpZiAoaGFzS2V5cykge1xyXG5cdFx0XHRyZXR1cm4gc2V0QXR0cmlidXRlcyhub2RlLCBkYXRhLnRhZywgZGF0YS5hdHRycywge30sIG5hbWVzcGFjZSlcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiBkYXRhLmF0dHJzXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBjb25zdHJ1Y3RDaGlsZHJlbihcclxuXHRcdGRhdGEsXHJcblx0XHRub2RlLFxyXG5cdFx0Y2FjaGVkLFxyXG5cdFx0ZWRpdGFibGUsXHJcblx0XHRuYW1lc3BhY2UsXHJcblx0XHRjb25maWdzXHJcblx0KSB7XHJcblx0XHRpZiAoZGF0YS5jaGlsZHJlbiAhPSBudWxsICYmIGRhdGEuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRyZXR1cm4gYnVpbGQoXHJcblx0XHRcdFx0bm9kZSxcclxuXHRcdFx0XHRkYXRhLnRhZyxcclxuXHRcdFx0XHR1bmRlZmluZWQsXHJcblx0XHRcdFx0dW5kZWZpbmVkLFxyXG5cdFx0XHRcdGRhdGEuY2hpbGRyZW4sXHJcblx0XHRcdFx0Y2FjaGVkLmNoaWxkcmVuLFxyXG5cdFx0XHRcdHRydWUsXHJcblx0XHRcdFx0MCxcclxuXHRcdFx0XHRkYXRhLmF0dHJzLmNvbnRlbnRlZGl0YWJsZSA/IG5vZGUgOiBlZGl0YWJsZSxcclxuXHRcdFx0XHRuYW1lc3BhY2UsXHJcblx0XHRcdFx0Y29uZmlncylcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiBkYXRhLmNoaWxkcmVuXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWNvbnN0cnVjdENhY2hlZChcclxuXHRcdGRhdGEsXHJcblx0XHRhdHRycyxcclxuXHRcdGNoaWxkcmVuLFxyXG5cdFx0bm9kZSxcclxuXHRcdG5hbWVzcGFjZSxcclxuXHRcdHZpZXdzLFxyXG5cdFx0Y29udHJvbGxlcnNcclxuXHQpIHtcclxuXHRcdHZhciBjYWNoZWQgPSB7XHJcblx0XHRcdHRhZzogZGF0YS50YWcsXHJcblx0XHRcdGF0dHJzOiBhdHRycyxcclxuXHRcdFx0Y2hpbGRyZW46IGNoaWxkcmVuLFxyXG5cdFx0XHRub2RlczogW25vZGVdXHJcblx0XHR9XHJcblxyXG5cdFx0dW5sb2FkQ2FjaGVkQ29udHJvbGxlcnMoY2FjaGVkLCB2aWV3cywgY29udHJvbGxlcnMpXHJcblxyXG5cdFx0aWYgKGNhY2hlZC5jaGlsZHJlbiAmJiAhY2FjaGVkLmNoaWxkcmVuLm5vZGVzKSB7XHJcblx0XHRcdGNhY2hlZC5jaGlsZHJlbi5ub2RlcyA9IFtdXHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gZWRnZSBjYXNlOiBzZXR0aW5nIHZhbHVlIG9uIDxzZWxlY3Q+IGRvZXNuJ3Qgd29yayBiZWZvcmUgY2hpbGRyZW5cclxuXHRcdC8vIGV4aXN0LCBzbyBzZXQgaXQgYWdhaW4gYWZ0ZXIgY2hpbGRyZW4gaGF2ZSBiZWVuIGNyZWF0ZWRcclxuXHRcdGlmIChkYXRhLnRhZyA9PT0gXCJzZWxlY3RcIiAmJiBcInZhbHVlXCIgaW4gZGF0YS5hdHRycykge1xyXG5cdFx0XHRzZXRBdHRyaWJ1dGVzKG5vZGUsIGRhdGEudGFnLCB7dmFsdWU6IGRhdGEuYXR0cnMudmFsdWV9LCB7fSxcclxuXHRcdFx0XHRuYW1lc3BhY2UpXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGNhY2hlZFxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZ2V0Q29udHJvbGxlcih2aWV3cywgdmlldywgY2FjaGVkQ29udHJvbGxlcnMsIGNvbnRyb2xsZXIpIHtcclxuXHRcdHZhciBjb250cm9sbGVySW5kZXhcclxuXHJcblx0XHRpZiAobS5yZWRyYXcuc3RyYXRlZ3koKSA9PT0gXCJkaWZmXCIgJiYgdmlld3MpIHtcclxuXHRcdFx0Y29udHJvbGxlckluZGV4ID0gdmlld3MuaW5kZXhPZih2aWV3KVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y29udHJvbGxlckluZGV4ID0gLTFcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoY29udHJvbGxlckluZGV4ID4gLTEpIHtcclxuXHRcdFx0cmV0dXJuIGNhY2hlZENvbnRyb2xsZXJzW2NvbnRyb2xsZXJJbmRleF1cclxuXHRcdH0gZWxzZSBpZiAoaXNGdW5jdGlvbihjb250cm9sbGVyKSkge1xyXG5cdFx0XHRyZXR1cm4gbmV3IGNvbnRyb2xsZXIoKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIHt9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR2YXIgdW5sb2FkZXJzID0gW11cclxuXHJcblx0ZnVuY3Rpb24gdXBkYXRlTGlzdHModmlld3MsIGNvbnRyb2xsZXJzLCB2aWV3LCBjb250cm9sbGVyKSB7XHJcblx0XHRpZiAoY29udHJvbGxlci5vbnVubG9hZCAhPSBudWxsICYmIHVubG9hZGVycy5tYXAoZnVuY3Rpb24odSkge3JldHVybiB1LmhhbmRsZXJ9KS5pbmRleE9mKGNvbnRyb2xsZXIub251bmxvYWQpIDwgMCkge1xyXG5cdFx0XHR1bmxvYWRlcnMucHVzaCh7XHJcblx0XHRcdFx0Y29udHJvbGxlcjogY29udHJvbGxlcixcclxuXHRcdFx0XHRoYW5kbGVyOiBjb250cm9sbGVyLm9udW5sb2FkXHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblxyXG5cdFx0dmlld3MucHVzaCh2aWV3KVxyXG5cdFx0Y29udHJvbGxlcnMucHVzaChjb250cm9sbGVyKVxyXG5cdH1cclxuXHJcblx0dmFyIGZvcmNpbmcgPSBmYWxzZVxyXG5cdGZ1bmN0aW9uIGNoZWNrVmlldyhkYXRhLCB2aWV3LCBjYWNoZWQsIGNhY2hlZENvbnRyb2xsZXJzLCBjb250cm9sbGVycywgdmlld3MpIHtcclxuXHRcdHZhciBjb250cm9sbGVyID0gZ2V0Q29udHJvbGxlcihjYWNoZWQudmlld3MsIHZpZXcsIGNhY2hlZENvbnRyb2xsZXJzLCBkYXRhLmNvbnRyb2xsZXIpXHJcblx0XHR2YXIga2V5ID0gZGF0YSAmJiBkYXRhLmF0dHJzICYmIGRhdGEuYXR0cnMua2V5XHJcblx0XHRkYXRhID0gcGVuZGluZ1JlcXVlc3RzID09PSAwIHx8IGZvcmNpbmcgfHwgY2FjaGVkQ29udHJvbGxlcnMgJiYgY2FjaGVkQ29udHJvbGxlcnMuaW5kZXhPZihjb250cm9sbGVyKSA+IC0xID8gZGF0YS52aWV3KGNvbnRyb2xsZXIpIDoge3RhZzogXCJwbGFjZWhvbGRlclwifVxyXG5cdFx0aWYgKGRhdGEuc3VidHJlZSA9PT0gXCJyZXRhaW5cIikgcmV0dXJuIGRhdGE7XHJcblx0XHRkYXRhLmF0dHJzID0gZGF0YS5hdHRycyB8fCB7fVxyXG5cdFx0ZGF0YS5hdHRycy5rZXkgPSBrZXlcclxuXHRcdHVwZGF0ZUxpc3RzKHZpZXdzLCBjb250cm9sbGVycywgdmlldywgY29udHJvbGxlcilcclxuXHRcdHJldHVybiBkYXRhXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBtYXJrVmlld3MoZGF0YSwgY2FjaGVkLCB2aWV3cywgY29udHJvbGxlcnMpIHtcclxuXHRcdHZhciBjYWNoZWRDb250cm9sbGVycyA9IGNhY2hlZCAmJiBjYWNoZWQuY29udHJvbGxlcnNcclxuXHJcblx0XHR3aGlsZSAoZGF0YS52aWV3ICE9IG51bGwpIHtcclxuXHRcdFx0ZGF0YSA9IGNoZWNrVmlldyhcclxuXHRcdFx0XHRkYXRhLFxyXG5cdFx0XHRcdGRhdGEudmlldy4kb3JpZ2luYWwgfHwgZGF0YS52aWV3LFxyXG5cdFx0XHRcdGNhY2hlZCxcclxuXHRcdFx0XHRjYWNoZWRDb250cm9sbGVycyxcclxuXHRcdFx0XHRjb250cm9sbGVycyxcclxuXHRcdFx0XHR2aWV3cylcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gZGF0YVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYnVpbGRPYmplY3QoIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXN0YXRlbWVudHNcclxuXHRcdGRhdGEsXHJcblx0XHRjYWNoZWQsXHJcblx0XHRlZGl0YWJsZSxcclxuXHRcdHBhcmVudEVsZW1lbnQsXHJcblx0XHRpbmRleCxcclxuXHRcdHNob3VsZFJlYXR0YWNoLFxyXG5cdFx0bmFtZXNwYWNlLFxyXG5cdFx0Y29uZmlnc1xyXG5cdCkge1xyXG5cdFx0dmFyIHZpZXdzID0gW11cclxuXHRcdHZhciBjb250cm9sbGVycyA9IFtdXHJcblxyXG5cdFx0ZGF0YSA9IG1hcmtWaWV3cyhkYXRhLCBjYWNoZWQsIHZpZXdzLCBjb250cm9sbGVycylcclxuXHJcblx0XHRpZiAoZGF0YS5zdWJ0cmVlID09PSBcInJldGFpblwiKSByZXR1cm4gY2FjaGVkXHJcblxyXG5cdFx0aWYgKCFkYXRhLnRhZyAmJiBjb250cm9sbGVycy5sZW5ndGgpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiQ29tcG9uZW50IHRlbXBsYXRlIG11c3QgcmV0dXJuIGEgdmlydHVhbCBcIiArXHJcblx0XHRcdFx0XCJlbGVtZW50LCBub3QgYW4gYXJyYXksIHN0cmluZywgZXRjLlwiKVxyXG5cdFx0fVxyXG5cclxuXHRcdGRhdGEuYXR0cnMgPSBkYXRhLmF0dHJzIHx8IHt9XHJcblx0XHRjYWNoZWQuYXR0cnMgPSBjYWNoZWQuYXR0cnMgfHwge31cclxuXHJcblx0XHR2YXIgZGF0YUF0dHJLZXlzID0gT2JqZWN0LmtleXMoZGF0YS5hdHRycylcclxuXHRcdHZhciBoYXNLZXlzID0gZGF0YUF0dHJLZXlzLmxlbmd0aCA+IChcImtleVwiIGluIGRhdGEuYXR0cnMgPyAxIDogMClcclxuXHJcblx0XHRtYXliZVJlY3JlYXRlT2JqZWN0KGRhdGEsIGNhY2hlZCwgZGF0YUF0dHJLZXlzKVxyXG5cclxuXHRcdGlmICghaXNTdHJpbmcoZGF0YS50YWcpKSByZXR1cm5cclxuXHJcblx0XHR2YXIgaXNOZXcgPSBjYWNoZWQubm9kZXMubGVuZ3RoID09PSAwXHJcblxyXG5cdFx0bmFtZXNwYWNlID0gZ2V0T2JqZWN0TmFtZXNwYWNlKGRhdGEsIG5hbWVzcGFjZSlcclxuXHJcblx0XHR2YXIgbm9kZVxyXG5cdFx0aWYgKGlzTmV3KSB7XHJcblx0XHRcdG5vZGUgPSBjb25zdHJ1Y3ROb2RlKGRhdGEsIG5hbWVzcGFjZSlcclxuXHRcdFx0Ly8gc2V0IGF0dHJpYnV0ZXMgZmlyc3QsIHRoZW4gY3JlYXRlIGNoaWxkcmVuXHJcblx0XHRcdHZhciBhdHRycyA9IGNvbnN0cnVjdEF0dHJzKGRhdGEsIG5vZGUsIG5hbWVzcGFjZSwgaGFzS2V5cylcclxuXHJcblx0XHRcdHZhciBjaGlsZHJlbiA9IGNvbnN0cnVjdENoaWxkcmVuKGRhdGEsIG5vZGUsIGNhY2hlZCwgZWRpdGFibGUsXHJcblx0XHRcdFx0bmFtZXNwYWNlLCBjb25maWdzKVxyXG5cclxuXHRcdFx0Y2FjaGVkID0gcmVjb25zdHJ1Y3RDYWNoZWQoXHJcblx0XHRcdFx0ZGF0YSxcclxuXHRcdFx0XHRhdHRycyxcclxuXHRcdFx0XHRjaGlsZHJlbixcclxuXHRcdFx0XHRub2RlLFxyXG5cdFx0XHRcdG5hbWVzcGFjZSxcclxuXHRcdFx0XHR2aWV3cyxcclxuXHRcdFx0XHRjb250cm9sbGVycylcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdG5vZGUgPSBidWlsZFVwZGF0ZWROb2RlKFxyXG5cdFx0XHRcdGNhY2hlZCxcclxuXHRcdFx0XHRkYXRhLFxyXG5cdFx0XHRcdGVkaXRhYmxlLFxyXG5cdFx0XHRcdGhhc0tleXMsXHJcblx0XHRcdFx0bmFtZXNwYWNlLFxyXG5cdFx0XHRcdHZpZXdzLFxyXG5cdFx0XHRcdGNvbmZpZ3MsXHJcblx0XHRcdFx0Y29udHJvbGxlcnMpXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGlzTmV3IHx8IHNob3VsZFJlYXR0YWNoID09PSB0cnVlICYmIG5vZGUgIT0gbnVsbCkge1xyXG5cdFx0XHRpbnNlcnROb2RlKHBhcmVudEVsZW1lbnQsIG5vZGUsIGluZGV4KVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIFRoZSBjb25maWdzIGFyZSBjYWxsZWQgYWZ0ZXIgYGJ1aWxkYCBmaW5pc2hlcyBydW5uaW5nXHJcblx0XHRzY2hlZHVsZUNvbmZpZ3NUb0JlQ2FsbGVkKGNvbmZpZ3MsIGRhdGEsIG5vZGUsIGlzTmV3LCBjYWNoZWQpXHJcblxyXG5cdFx0cmV0dXJuIGNhY2hlZFxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYnVpbGQoXHJcblx0XHRwYXJlbnRFbGVtZW50LFxyXG5cdFx0cGFyZW50VGFnLFxyXG5cdFx0cGFyZW50Q2FjaGUsXHJcblx0XHRwYXJlbnRJbmRleCxcclxuXHRcdGRhdGEsXHJcblx0XHRjYWNoZWQsXHJcblx0XHRzaG91bGRSZWF0dGFjaCxcclxuXHRcdGluZGV4LFxyXG5cdFx0ZWRpdGFibGUsXHJcblx0XHRuYW1lc3BhY2UsXHJcblx0XHRjb25maWdzXHJcblx0KSB7XHJcblx0XHQvKlxyXG5cdFx0ICogYGJ1aWxkYCBpcyBhIHJlY3Vyc2l2ZSBmdW5jdGlvbiB0aGF0IG1hbmFnZXMgY3JlYXRpb24vZGlmZmluZy9yZW1vdmFsXHJcblx0XHQgKiBvZiBET00gZWxlbWVudHMgYmFzZWQgb24gY29tcGFyaXNvbiBiZXR3ZWVuIGBkYXRhYCBhbmQgYGNhY2hlZGAgdGhlXHJcblx0XHQgKiBkaWZmIGFsZ29yaXRobSBjYW4gYmUgc3VtbWFyaXplZCBhcyB0aGlzOlxyXG5cdFx0ICpcclxuXHRcdCAqIDEgLSBjb21wYXJlIGBkYXRhYCBhbmQgYGNhY2hlZGBcclxuXHRcdCAqIDIgLSBpZiB0aGV5IGFyZSBkaWZmZXJlbnQsIGNvcHkgYGRhdGFgIHRvIGBjYWNoZWRgIGFuZCB1cGRhdGUgdGhlIERPTVxyXG5cdFx0ICogICAgIGJhc2VkIG9uIHdoYXQgdGhlIGRpZmZlcmVuY2UgaXNcclxuXHRcdCAqIDMgLSByZWN1cnNpdmVseSBhcHBseSB0aGlzIGFsZ29yaXRobSBmb3IgZXZlcnkgYXJyYXkgYW5kIGZvciB0aGVcclxuXHRcdCAqICAgICBjaGlsZHJlbiBvZiBldmVyeSB2aXJ0dWFsIGVsZW1lbnRcclxuXHRcdCAqXHJcblx0XHQgKiBUaGUgYGNhY2hlZGAgZGF0YSBzdHJ1Y3R1cmUgaXMgZXNzZW50aWFsbHkgdGhlIHNhbWUgYXMgdGhlIHByZXZpb3VzXHJcblx0XHQgKiByZWRyYXcncyBgZGF0YWAgZGF0YSBzdHJ1Y3R1cmUsIHdpdGggYSBmZXcgYWRkaXRpb25zOlxyXG5cdFx0ICogLSBgY2FjaGVkYCBhbHdheXMgaGFzIGEgcHJvcGVydHkgY2FsbGVkIGBub2Rlc2AsIHdoaWNoIGlzIGEgbGlzdCBvZlxyXG5cdFx0ICogICAgRE9NIGVsZW1lbnRzIHRoYXQgY29ycmVzcG9uZCB0byB0aGUgZGF0YSByZXByZXNlbnRlZCBieSB0aGVcclxuXHRcdCAqICAgIHJlc3BlY3RpdmUgdmlydHVhbCBlbGVtZW50XHJcblx0XHQgKiAtIGluIG9yZGVyIHRvIHN1cHBvcnQgYXR0YWNoaW5nIGBub2Rlc2AgYXMgYSBwcm9wZXJ0eSBvZiBgY2FjaGVkYCxcclxuXHRcdCAqICAgIGBjYWNoZWRgIGlzICphbHdheXMqIGEgbm9uLXByaW1pdGl2ZSBvYmplY3QsIGkuZS4gaWYgdGhlIGRhdGEgd2FzXHJcblx0XHQgKiAgICBhIHN0cmluZywgdGhlbiBjYWNoZWQgaXMgYSBTdHJpbmcgaW5zdGFuY2UuIElmIGRhdGEgd2FzIGBudWxsYCBvclxyXG5cdFx0ICogICAgYHVuZGVmaW5lZGAsIGNhY2hlZCBpcyBgbmV3IFN0cmluZyhcIlwiKWBcclxuXHRcdCAqIC0gYGNhY2hlZCBhbHNvIGhhcyBhIGBjb25maWdDb250ZXh0YCBwcm9wZXJ0eSwgd2hpY2ggaXMgdGhlIHN0YXRlXHJcblx0XHQgKiAgICBzdG9yYWdlIG9iamVjdCBleHBvc2VkIGJ5IGNvbmZpZyhlbGVtZW50LCBpc0luaXRpYWxpemVkLCBjb250ZXh0KVxyXG5cdFx0ICogLSB3aGVuIGBjYWNoZWRgIGlzIGFuIE9iamVjdCwgaXQgcmVwcmVzZW50cyBhIHZpcnR1YWwgZWxlbWVudDsgd2hlblxyXG5cdFx0ICogICAgaXQncyBhbiBBcnJheSwgaXQgcmVwcmVzZW50cyBhIGxpc3Qgb2YgZWxlbWVudHM7IHdoZW4gaXQncyBhXHJcblx0XHQgKiAgICBTdHJpbmcsIE51bWJlciBvciBCb29sZWFuLCBpdCByZXByZXNlbnRzIGEgdGV4dCBub2RlXHJcblx0XHQgKlxyXG5cdFx0ICogYHBhcmVudEVsZW1lbnRgIGlzIGEgRE9NIGVsZW1lbnQgdXNlZCBmb3IgVzNDIERPTSBBUEkgY2FsbHNcclxuXHRcdCAqIGBwYXJlbnRUYWdgIGlzIG9ubHkgdXNlZCBmb3IgaGFuZGxpbmcgYSBjb3JuZXIgY2FzZSBmb3IgdGV4dGFyZWFcclxuXHRcdCAqIHZhbHVlc1xyXG5cdFx0ICogYHBhcmVudENhY2hlYCBpcyB1c2VkIHRvIHJlbW92ZSBub2RlcyBpbiBzb21lIG11bHRpLW5vZGUgY2FzZXNcclxuXHRcdCAqIGBwYXJlbnRJbmRleGAgYW5kIGBpbmRleGAgYXJlIHVzZWQgdG8gZmlndXJlIG91dCB0aGUgb2Zmc2V0IG9mIG5vZGVzLlxyXG5cdFx0ICogVGhleSdyZSBhcnRpZmFjdHMgZnJvbSBiZWZvcmUgYXJyYXlzIHN0YXJ0ZWQgYmVpbmcgZmxhdHRlbmVkIGFuZCBhcmVcclxuXHRcdCAqIGxpa2VseSByZWZhY3RvcmFibGVcclxuXHRcdCAqIGBkYXRhYCBhbmQgYGNhY2hlZGAgYXJlLCByZXNwZWN0aXZlbHksIHRoZSBuZXcgYW5kIG9sZCBub2RlcyBiZWluZ1xyXG5cdFx0ICogZGlmZmVkXHJcblx0XHQgKiBgc2hvdWxkUmVhdHRhY2hgIGlzIGEgZmxhZyBpbmRpY2F0aW5nIHdoZXRoZXIgYSBwYXJlbnQgbm9kZSB3YXNcclxuXHRcdCAqIHJlY3JlYXRlZCAoaWYgc28sIGFuZCBpZiB0aGlzIG5vZGUgaXMgcmV1c2VkLCB0aGVuIHRoaXMgbm9kZSBtdXN0XHJcblx0XHQgKiByZWF0dGFjaCBpdHNlbGYgdG8gdGhlIG5ldyBwYXJlbnQpXHJcblx0XHQgKiBgZWRpdGFibGVgIGlzIGEgZmxhZyB0aGF0IGluZGljYXRlcyB3aGV0aGVyIGFuIGFuY2VzdG9yIGlzXHJcblx0XHQgKiBjb250ZW50ZWRpdGFibGVcclxuXHRcdCAqIGBuYW1lc3BhY2VgIGluZGljYXRlcyB0aGUgY2xvc2VzdCBIVE1MIG5hbWVzcGFjZSBhcyBpdCBjYXNjYWRlcyBkb3duXHJcblx0XHQgKiBmcm9tIGFuIGFuY2VzdG9yXHJcblx0XHQgKiBgY29uZmlnc2AgaXMgYSBsaXN0IG9mIGNvbmZpZyBmdW5jdGlvbnMgdG8gcnVuIGFmdGVyIHRoZSB0b3Btb3N0XHJcblx0XHQgKiBgYnVpbGRgIGNhbGwgZmluaXNoZXMgcnVubmluZ1xyXG5cdFx0ICpcclxuXHRcdCAqIHRoZXJlJ3MgbG9naWMgdGhhdCByZWxpZXMgb24gdGhlIGFzc3VtcHRpb24gdGhhdCBudWxsIGFuZCB1bmRlZmluZWRcclxuXHRcdCAqIGRhdGEgYXJlIGVxdWl2YWxlbnQgdG8gZW1wdHkgc3RyaW5nc1xyXG5cdFx0ICogLSB0aGlzIHByZXZlbnRzIGxpZmVjeWNsZSBzdXJwcmlzZXMgZnJvbSBwcm9jZWR1cmFsIGhlbHBlcnMgdGhhdCBtaXhcclxuXHRcdCAqICAgaW1wbGljaXQgYW5kIGV4cGxpY2l0IHJldHVybiBzdGF0ZW1lbnRzIChlLmcuXHJcblx0XHQgKiAgIGZ1bmN0aW9uIGZvbygpIHtpZiAoY29uZCkgcmV0dXJuIG0oXCJkaXZcIil9XHJcblx0XHQgKiAtIGl0IHNpbXBsaWZpZXMgZGlmZmluZyBjb2RlXHJcblx0XHQgKi9cclxuXHRcdGRhdGEgPSBkYXRhVG9TdHJpbmcoZGF0YSlcclxuXHRcdGlmIChkYXRhLnN1YnRyZWUgPT09IFwicmV0YWluXCIpIHJldHVybiBjYWNoZWRcclxuXHRcdGNhY2hlZCA9IG1ha2VDYWNoZShkYXRhLCBjYWNoZWQsIGluZGV4LCBwYXJlbnRJbmRleCwgcGFyZW50Q2FjaGUpXHJcblxyXG5cdFx0aWYgKGlzQXJyYXkoZGF0YSkpIHtcclxuXHRcdFx0cmV0dXJuIGJ1aWxkQXJyYXkoXHJcblx0XHRcdFx0ZGF0YSxcclxuXHRcdFx0XHRjYWNoZWQsXHJcblx0XHRcdFx0cGFyZW50RWxlbWVudCxcclxuXHRcdFx0XHRpbmRleCxcclxuXHRcdFx0XHRwYXJlbnRUYWcsXHJcblx0XHRcdFx0c2hvdWxkUmVhdHRhY2gsXHJcblx0XHRcdFx0ZWRpdGFibGUsXHJcblx0XHRcdFx0bmFtZXNwYWNlLFxyXG5cdFx0XHRcdGNvbmZpZ3MpXHJcblx0XHR9IGVsc2UgaWYgKGRhdGEgIT0gbnVsbCAmJiBpc09iamVjdChkYXRhKSkge1xyXG5cdFx0XHRyZXR1cm4gYnVpbGRPYmplY3QoXHJcblx0XHRcdFx0ZGF0YSxcclxuXHRcdFx0XHRjYWNoZWQsXHJcblx0XHRcdFx0ZWRpdGFibGUsXHJcblx0XHRcdFx0cGFyZW50RWxlbWVudCxcclxuXHRcdFx0XHRpbmRleCxcclxuXHRcdFx0XHRzaG91bGRSZWF0dGFjaCxcclxuXHRcdFx0XHRuYW1lc3BhY2UsXHJcblx0XHRcdFx0Y29uZmlncylcclxuXHRcdH0gZWxzZSBpZiAoIWlzRnVuY3Rpb24oZGF0YSkpIHtcclxuXHRcdFx0cmV0dXJuIGhhbmRsZVRleHROb2RlKFxyXG5cdFx0XHRcdGNhY2hlZCxcclxuXHRcdFx0XHRkYXRhLFxyXG5cdFx0XHRcdGluZGV4LFxyXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQsXHJcblx0XHRcdFx0c2hvdWxkUmVhdHRhY2gsXHJcblx0XHRcdFx0ZWRpdGFibGUsXHJcblx0XHRcdFx0cGFyZW50VGFnKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIGNhY2hlZFxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc29ydENoYW5nZXMoYSwgYikge1xyXG5cdFx0cmV0dXJuIGEuYWN0aW9uIC0gYi5hY3Rpb24gfHwgYS5pbmRleCAtIGIuaW5kZXhcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGNvcHlTdHlsZUF0dHJzKG5vZGUsIGRhdGFBdHRyLCBjYWNoZWRBdHRyKSB7XHJcblx0XHRmb3IgKHZhciBydWxlIGluIGRhdGFBdHRyKSBpZiAoaGFzT3duLmNhbGwoZGF0YUF0dHIsIHJ1bGUpKSB7XHJcblx0XHRcdGlmIChjYWNoZWRBdHRyID09IG51bGwgfHwgY2FjaGVkQXR0cltydWxlXSAhPT0gZGF0YUF0dHJbcnVsZV0pIHtcclxuXHRcdFx0XHRub2RlLnN0eWxlW3J1bGVdID0gZGF0YUF0dHJbcnVsZV1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGZvciAocnVsZSBpbiBjYWNoZWRBdHRyKSBpZiAoaGFzT3duLmNhbGwoY2FjaGVkQXR0ciwgcnVsZSkpIHtcclxuXHRcdFx0aWYgKCFoYXNPd24uY2FsbChkYXRhQXR0ciwgcnVsZSkpIG5vZGUuc3R5bGVbcnVsZV0gPSBcIlwiXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR2YXIgc2hvdWxkVXNlU2V0QXR0cmlidXRlID0ge1xyXG5cdFx0bGlzdDogMSxcclxuXHRcdHN0eWxlOiAxLFxyXG5cdFx0Zm9ybTogMSxcclxuXHRcdHR5cGU6IDEsXHJcblx0XHR3aWR0aDogMSxcclxuXHRcdGhlaWdodDogMVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc2V0U2luZ2xlQXR0cihcclxuXHRcdG5vZGUsXHJcblx0XHRhdHRyTmFtZSxcclxuXHRcdGRhdGFBdHRyLFxyXG5cdFx0Y2FjaGVkQXR0cixcclxuXHRcdHRhZyxcclxuXHRcdG5hbWVzcGFjZVxyXG5cdCkge1xyXG5cdFx0aWYgKGF0dHJOYW1lID09PSBcImNvbmZpZ1wiIHx8IGF0dHJOYW1lID09PSBcImtleVwiKSB7XHJcblx0XHRcdC8vIGBjb25maWdgIGlzbid0IGEgcmVhbCBhdHRyaWJ1dGUsIHNvIGlnbm9yZSBpdFxyXG5cdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0fSBlbHNlIGlmIChpc0Z1bmN0aW9uKGRhdGFBdHRyKSAmJiBhdHRyTmFtZS5zbGljZSgwLCAyKSA9PT0gXCJvblwiKSB7XHJcblx0XHRcdC8vIGhvb2sgZXZlbnQgaGFuZGxlcnMgdG8gdGhlIGF1dG8tcmVkcmF3aW5nIHN5c3RlbVxyXG5cdFx0XHRub2RlW2F0dHJOYW1lXSA9IGF1dG9yZWRyYXcoZGF0YUF0dHIsIG5vZGUpXHJcblx0XHR9IGVsc2UgaWYgKGF0dHJOYW1lID09PSBcInN0eWxlXCIgJiYgZGF0YUF0dHIgIT0gbnVsbCAmJlxyXG5cdFx0XHRcdGlzT2JqZWN0KGRhdGFBdHRyKSkge1xyXG5cdFx0XHQvLyBoYW5kbGUgYHN0eWxlOiB7Li4ufWBcclxuXHRcdFx0Y29weVN0eWxlQXR0cnMobm9kZSwgZGF0YUF0dHIsIGNhY2hlZEF0dHIpXHJcblx0XHR9IGVsc2UgaWYgKG5hbWVzcGFjZSAhPSBudWxsKSB7XHJcblx0XHRcdC8vIGhhbmRsZSBTVkdcclxuXHRcdFx0aWYgKGF0dHJOYW1lID09PSBcImhyZWZcIikge1xyXG5cdFx0XHRcdG5vZGUuc2V0QXR0cmlidXRlTlMoXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIsXHJcblx0XHRcdFx0XHRcImhyZWZcIiwgZGF0YUF0dHIpXHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0bm9kZS5zZXRBdHRyaWJ1dGUoXHJcblx0XHRcdFx0XHRhdHRyTmFtZSA9PT0gXCJjbGFzc05hbWVcIiA/IFwiY2xhc3NcIiA6IGF0dHJOYW1lLFxyXG5cdFx0XHRcdFx0ZGF0YUF0dHIpXHJcblx0XHRcdH1cclxuXHRcdH0gZWxzZSBpZiAoYXR0ck5hbWUgaW4gbm9kZSAmJiAhc2hvdWxkVXNlU2V0QXR0cmlidXRlW2F0dHJOYW1lXSkge1xyXG5cdFx0XHQvLyBoYW5kbGUgY2FzZXMgdGhhdCBhcmUgcHJvcGVydGllcyAoYnV0IGlnbm9yZSBjYXNlcyB3aGVyZSB3ZVxyXG5cdFx0XHQvLyBzaG91bGQgdXNlIHNldEF0dHJpYnV0ZSBpbnN0ZWFkKVxyXG5cdFx0XHQvL1xyXG5cdFx0XHQvLyAtIGxpc3QgYW5kIGZvcm0gYXJlIHR5cGljYWxseSB1c2VkIGFzIHN0cmluZ3MsIGJ1dCBhcmUgRE9NXHJcblx0XHRcdC8vICAgZWxlbWVudCByZWZlcmVuY2VzIGluIGpzXHJcblx0XHRcdC8vXHJcblx0XHRcdC8vIC0gd2hlbiB1c2luZyBDU1Mgc2VsZWN0b3JzIChlLmcuIGBtKFwiW3N0eWxlPScnXVwiKWApLCBzdHlsZSBpc1xyXG5cdFx0XHQvLyAgIHVzZWQgYXMgYSBzdHJpbmcsIGJ1dCBpdCdzIGFuIG9iamVjdCBpbiBqc1xyXG5cdFx0XHQvL1xyXG5cdFx0XHQvLyAjMzQ4IGRvbid0IHNldCB0aGUgdmFsdWUgaWYgbm90IG5lZWRlZCAtIG90aGVyd2lzZSwgY3Vyc29yXHJcblx0XHRcdC8vIHBsYWNlbWVudCBicmVha3MgaW4gQ2hyb21lXHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0aWYgKHRhZyAhPT0gXCJpbnB1dFwiIHx8IG5vZGVbYXR0ck5hbWVdICE9PSBkYXRhQXR0cikge1xyXG5cdFx0XHRcdFx0bm9kZVthdHRyTmFtZV0gPSBkYXRhQXR0clxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRcdG5vZGUuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBkYXRhQXR0cilcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBub2RlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgZGF0YUF0dHIpXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiB0cnlTZXRBdHRyKFxyXG5cdFx0bm9kZSxcclxuXHRcdGF0dHJOYW1lLFxyXG5cdFx0ZGF0YUF0dHIsXHJcblx0XHRjYWNoZWRBdHRyLFxyXG5cdFx0Y2FjaGVkQXR0cnMsXHJcblx0XHR0YWcsXHJcblx0XHRuYW1lc3BhY2VcclxuXHQpIHtcclxuXHRcdGlmICghKGF0dHJOYW1lIGluIGNhY2hlZEF0dHJzKSB8fCAoY2FjaGVkQXR0ciAhPT0gZGF0YUF0dHIpKSB7XHJcblx0XHRcdGNhY2hlZEF0dHJzW2F0dHJOYW1lXSA9IGRhdGFBdHRyXHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0cmV0dXJuIHNldFNpbmdsZUF0dHIoXHJcblx0XHRcdFx0XHRub2RlLFxyXG5cdFx0XHRcdFx0YXR0ck5hbWUsXHJcblx0XHRcdFx0XHRkYXRhQXR0cixcclxuXHRcdFx0XHRcdGNhY2hlZEF0dHIsXHJcblx0XHRcdFx0XHR0YWcsXHJcblx0XHRcdFx0XHRuYW1lc3BhY2UpXHJcblx0XHRcdH0gY2F0Y2ggKGUpIHtcclxuXHRcdFx0XHQvLyBzd2FsbG93IElFJ3MgaW52YWxpZCBhcmd1bWVudCBlcnJvcnMgdG8gbWltaWMgSFRNTCdzXHJcblx0XHRcdFx0Ly8gZmFsbGJhY2stdG8tZG9pbmctbm90aGluZy1vbi1pbnZhbGlkLWF0dHJpYnV0ZXMgYmVoYXZpb3JcclxuXHRcdFx0XHRpZiAoZS5tZXNzYWdlLmluZGV4T2YoXCJJbnZhbGlkIGFyZ3VtZW50XCIpIDwgMCkgdGhyb3cgZVxyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2UgaWYgKGF0dHJOYW1lID09PSBcInZhbHVlXCIgJiYgdGFnID09PSBcImlucHV0XCIgJiZcclxuXHRcdFx0XHRub2RlLnZhbHVlICE9PSBkYXRhQXR0cikge1xyXG5cdFx0XHQvLyAjMzQ4IGRhdGFBdHRyIG1heSBub3QgYmUgYSBzdHJpbmcsIHNvIHVzZSBsb29zZSBjb21wYXJpc29uXHJcblx0XHRcdG5vZGUudmFsdWUgPSBkYXRhQXR0clxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc2V0QXR0cmlidXRlcyhub2RlLCB0YWcsIGRhdGFBdHRycywgY2FjaGVkQXR0cnMsIG5hbWVzcGFjZSkge1xyXG5cdFx0Zm9yICh2YXIgYXR0ck5hbWUgaW4gZGF0YUF0dHJzKSBpZiAoaGFzT3duLmNhbGwoZGF0YUF0dHJzLCBhdHRyTmFtZSkpIHtcclxuXHRcdFx0aWYgKHRyeVNldEF0dHIoXHJcblx0XHRcdFx0XHRub2RlLFxyXG5cdFx0XHRcdFx0YXR0ck5hbWUsXHJcblx0XHRcdFx0XHRkYXRhQXR0cnNbYXR0ck5hbWVdLFxyXG5cdFx0XHRcdFx0Y2FjaGVkQXR0cnNbYXR0ck5hbWVdLFxyXG5cdFx0XHRcdFx0Y2FjaGVkQXR0cnMsXHJcblx0XHRcdFx0XHR0YWcsXHJcblx0XHRcdFx0XHRuYW1lc3BhY2UpKSB7XHJcblx0XHRcdFx0Y29udGludWVcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGNhY2hlZEF0dHJzXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBjbGVhcihub2RlcywgY2FjaGVkKSB7XHJcblx0XHRmb3IgKHZhciBpID0gbm9kZXMubGVuZ3RoIC0gMTsgaSA+IC0xOyBpLS0pIHtcclxuXHRcdFx0aWYgKG5vZGVzW2ldICYmIG5vZGVzW2ldLnBhcmVudE5vZGUpIHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0bm9kZXNbaV0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2Rlc1tpXSlcclxuXHRcdFx0XHR9IGNhdGNoIChlKSB7XHJcblx0XHRcdFx0XHQvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXHJcblx0XHRcdFx0XHQvLyBpZ25vcmUgaWYgdGhpcyBmYWlscyBkdWUgdG8gb3JkZXIgb2YgZXZlbnRzIChzZWVcclxuXHRcdFx0XHRcdC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjE5MjYwODMvZmFpbGVkLXRvLWV4ZWN1dGUtcmVtb3ZlY2hpbGQtb24tbm9kZSlcclxuXHRcdFx0XHRcdC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYWNoZWQgPSBbXS5jb25jYXQoY2FjaGVkKVxyXG5cdFx0XHRcdGlmIChjYWNoZWRbaV0pIHVubG9hZChjYWNoZWRbaV0pXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdC8vIHJlbGVhc2UgbWVtb3J5IGlmIG5vZGVzIGlzIGFuIGFycmF5LiBUaGlzIGNoZWNrIHNob3VsZCBmYWlsIGlmIG5vZGVzXHJcblx0XHQvLyBpcyBhIE5vZGVMaXN0IChzZWUgbG9vcCBhYm92ZSlcclxuXHRcdGlmIChub2Rlcy5sZW5ndGgpIHtcclxuXHRcdFx0bm9kZXMubGVuZ3RoID0gMFxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gdW5sb2FkKGNhY2hlZCkge1xyXG5cdFx0aWYgKGNhY2hlZC5jb25maWdDb250ZXh0ICYmIGlzRnVuY3Rpb24oY2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQpKSB7XHJcblx0XHRcdGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkKClcclxuXHRcdFx0Y2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQgPSBudWxsXHJcblx0XHR9XHJcblx0XHRpZiAoY2FjaGVkLmNvbnRyb2xsZXJzKSB7XHJcblx0XHRcdGZvckVhY2goY2FjaGVkLmNvbnRyb2xsZXJzLCBmdW5jdGlvbiAoY29udHJvbGxlcikge1xyXG5cdFx0XHRcdGlmIChpc0Z1bmN0aW9uKGNvbnRyb2xsZXIub251bmxvYWQpKSB7XHJcblx0XHRcdFx0XHRjb250cm9sbGVyLm9udW5sb2FkKHtwcmV2ZW50RGVmYXVsdDogbm9vcH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cdFx0aWYgKGNhY2hlZC5jaGlsZHJlbikge1xyXG5cdFx0XHRpZiAoaXNBcnJheShjYWNoZWQuY2hpbGRyZW4pKSBmb3JFYWNoKGNhY2hlZC5jaGlsZHJlbiwgdW5sb2FkKVxyXG5cdFx0XHRlbHNlIGlmIChjYWNoZWQuY2hpbGRyZW4udGFnKSB1bmxvYWQoY2FjaGVkLmNoaWxkcmVuKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYXBwZW5kVGV4dEZyYWdtZW50KHBhcmVudEVsZW1lbnQsIGRhdGEpIHtcclxuXHRcdHRyeSB7XHJcblx0XHRcdHBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQoXHJcblx0XHRcdFx0JGRvY3VtZW50LmNyZWF0ZVJhbmdlKCkuY3JlYXRlQ29udGV4dHVhbEZyYWdtZW50KGRhdGEpKVxyXG5cdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWVuZFwiLCBkYXRhKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaW5qZWN0SFRNTChwYXJlbnRFbGVtZW50LCBpbmRleCwgZGF0YSkge1xyXG5cdFx0dmFyIG5leHRTaWJsaW5nID0gcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XVxyXG5cdFx0aWYgKG5leHRTaWJsaW5nKSB7XHJcblx0XHRcdHZhciBpc0VsZW1lbnQgPSBuZXh0U2libGluZy5ub2RlVHlwZSAhPT0gMVxyXG5cdFx0XHR2YXIgcGxhY2Vob2xkZXIgPSAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIilcclxuXHRcdFx0aWYgKGlzRWxlbWVudCkge1xyXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyLCBuZXh0U2libGluZyB8fCBudWxsKVxyXG5cdFx0XHRcdHBsYWNlaG9sZGVyLmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWJlZ2luXCIsIGRhdGEpXHJcblx0XHRcdFx0cGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChwbGFjZWhvbGRlcilcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRuZXh0U2libGluZy5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmViZWdpblwiLCBkYXRhKVxyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRhcHBlbmRUZXh0RnJhZ21lbnQocGFyZW50RWxlbWVudCwgZGF0YSlcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgbm9kZXMgPSBbXVxyXG5cclxuXHRcdHdoaWxlIChwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdICE9PSBuZXh0U2libGluZykge1xyXG5cdFx0XHRub2Rlcy5wdXNoKHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0pXHJcblx0XHRcdGluZGV4KytcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbm9kZXNcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGF1dG9yZWRyYXcoY2FsbGJhY2ssIG9iamVjdCkge1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChlKSB7XHJcblx0XHRcdGUgPSBlIHx8IGV2ZW50XHJcblx0XHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiZGlmZlwiKVxyXG5cdFx0XHRtLnN0YXJ0Q29tcHV0YXRpb24oKVxyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdHJldHVybiBjYWxsYmFjay5jYWxsKG9iamVjdCwgZSlcclxuXHRcdFx0fSBmaW5hbGx5IHtcclxuXHRcdFx0XHRlbmRGaXJzdENvbXB1dGF0aW9uKClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIGh0bWxcclxuXHR2YXIgZG9jdW1lbnROb2RlID0ge1xyXG5cdFx0YXBwZW5kQ2hpbGQ6IGZ1bmN0aW9uIChub2RlKSB7XHJcblx0XHRcdGlmIChodG1sID09PSB1bmRlZmluZWQpIGh0bWwgPSAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImh0bWxcIilcclxuXHRcdFx0aWYgKCRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiZcclxuXHRcdFx0XHRcdCRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgIT09IG5vZGUpIHtcclxuXHRcdFx0XHQkZG9jdW1lbnQucmVwbGFjZUNoaWxkKG5vZGUsICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpXHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0JGRvY3VtZW50LmFwcGVuZENoaWxkKG5vZGUpXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMuY2hpbGROb2RlcyA9ICRkb2N1bWVudC5jaGlsZE5vZGVzXHJcblx0XHR9LFxyXG5cclxuXHRcdGluc2VydEJlZm9yZTogZnVuY3Rpb24gKG5vZGUpIHtcclxuXHRcdFx0dGhpcy5hcHBlbmRDaGlsZChub2RlKVxyXG5cdFx0fSxcclxuXHJcblx0XHRjaGlsZE5vZGVzOiBbXVxyXG5cdH1cclxuXHJcblx0dmFyIG5vZGVDYWNoZSA9IFtdXHJcblx0dmFyIGNlbGxDYWNoZSA9IHt9XHJcblxyXG5cdG0ucmVuZGVyID0gZnVuY3Rpb24gKHJvb3QsIGNlbGwsIGZvcmNlUmVjcmVhdGlvbikge1xyXG5cdFx0aWYgKCFyb290KSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIkVuc3VyZSB0aGUgRE9NIGVsZW1lbnQgYmVpbmcgcGFzc2VkIHRvIFwiICtcclxuXHRcdFx0XHRcIm0ucm91dGUvbS5tb3VudC9tLnJlbmRlciBpcyBub3QgdW5kZWZpbmVkLlwiKVxyXG5cdFx0fVxyXG5cdFx0dmFyIGNvbmZpZ3MgPSBbXVxyXG5cdFx0dmFyIGlkID0gZ2V0Q2VsbENhY2hlS2V5KHJvb3QpXHJcblx0XHR2YXIgaXNEb2N1bWVudFJvb3QgPSByb290ID09PSAkZG9jdW1lbnRcclxuXHRcdHZhciBub2RlXHJcblxyXG5cdFx0aWYgKGlzRG9jdW1lbnRSb290IHx8IHJvb3QgPT09ICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpIHtcclxuXHRcdFx0bm9kZSA9IGRvY3VtZW50Tm9kZVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0bm9kZSA9IHJvb3RcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoaXNEb2N1bWVudFJvb3QgJiYgY2VsbC50YWcgIT09IFwiaHRtbFwiKSB7XHJcblx0XHRcdGNlbGwgPSB7dGFnOiBcImh0bWxcIiwgYXR0cnM6IHt9LCBjaGlsZHJlbjogY2VsbH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoY2VsbENhY2hlW2lkXSA9PT0gdW5kZWZpbmVkKSBjbGVhcihub2RlLmNoaWxkTm9kZXMpXHJcblx0XHRpZiAoZm9yY2VSZWNyZWF0aW9uID09PSB0cnVlKSByZXNldChyb290KVxyXG5cclxuXHRcdGNlbGxDYWNoZVtpZF0gPSBidWlsZChcclxuXHRcdFx0bm9kZSxcclxuXHRcdFx0bnVsbCxcclxuXHRcdFx0dW5kZWZpbmVkLFxyXG5cdFx0XHR1bmRlZmluZWQsXHJcblx0XHRcdGNlbGwsXHJcblx0XHRcdGNlbGxDYWNoZVtpZF0sXHJcblx0XHRcdGZhbHNlLFxyXG5cdFx0XHQwLFxyXG5cdFx0XHRudWxsLFxyXG5cdFx0XHR1bmRlZmluZWQsXHJcblx0XHRcdGNvbmZpZ3MpXHJcblxyXG5cdFx0Zm9yRWFjaChjb25maWdzLCBmdW5jdGlvbiAoY29uZmlnKSB7IGNvbmZpZygpIH0pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRDZWxsQ2FjaGVLZXkoZWxlbWVudCkge1xyXG5cdFx0dmFyIGluZGV4ID0gbm9kZUNhY2hlLmluZGV4T2YoZWxlbWVudClcclxuXHRcdHJldHVybiBpbmRleCA8IDAgPyBub2RlQ2FjaGUucHVzaChlbGVtZW50KSAtIDEgOiBpbmRleFxyXG5cdH1cclxuXHJcblx0bS50cnVzdCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG5cdFx0dmFsdWUgPSBuZXcgU3RyaW5nKHZhbHVlKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ldy13cmFwcGVyc1xyXG5cdFx0dmFsdWUuJHRydXN0ZWQgPSB0cnVlXHJcblx0XHRyZXR1cm4gdmFsdWVcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldHRlcnNldHRlcihzdG9yZSkge1xyXG5cdFx0ZnVuY3Rpb24gcHJvcCgpIHtcclxuXHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGgpIHN0b3JlID0gYXJndW1lbnRzWzBdXHJcblx0XHRcdHJldHVybiBzdG9yZVxyXG5cdFx0fVxyXG5cclxuXHRcdHByb3AudG9KU09OID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRyZXR1cm4gc3RvcmVcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gcHJvcFxyXG5cdH1cclxuXHJcblx0bS5wcm9wID0gZnVuY3Rpb24gKHN0b3JlKSB7XHJcblx0XHRpZiAoKHN0b3JlICE9IG51bGwgJiYgaXNPYmplY3Qoc3RvcmUpIHx8IGlzRnVuY3Rpb24oc3RvcmUpKSAmJlxyXG5cdFx0XHRcdGlzRnVuY3Rpb24oc3RvcmUudGhlbikpIHtcclxuXHRcdFx0cmV0dXJuIHByb3BpZnkoc3RvcmUpXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGdldHRlcnNldHRlcihzdG9yZSlcclxuXHR9XHJcblxyXG5cdHZhciByb290cyA9IFtdXHJcblx0dmFyIGNvbXBvbmVudHMgPSBbXVxyXG5cdHZhciBjb250cm9sbGVycyA9IFtdXHJcblx0dmFyIGxhc3RSZWRyYXdJZCA9IG51bGxcclxuXHR2YXIgbGFzdFJlZHJhd0NhbGxUaW1lID0gMFxyXG5cdHZhciBjb21wdXRlUHJlUmVkcmF3SG9vayA9IG51bGxcclxuXHR2YXIgY29tcHV0ZVBvc3RSZWRyYXdIb29rID0gbnVsbFxyXG5cdHZhciB0b3BDb21wb25lbnRcclxuXHR2YXIgRlJBTUVfQlVER0VUID0gMTYgLy8gNjAgZnJhbWVzIHBlciBzZWNvbmQgPSAxIGNhbGwgcGVyIDE2IG1zXHJcblxyXG5cdGZ1bmN0aW9uIHBhcmFtZXRlcml6ZShjb21wb25lbnQsIGFyZ3MpIHtcclxuXHRcdGZ1bmN0aW9uIGNvbnRyb2xsZXIoKSB7XHJcblx0XHRcdC8qIGVzbGludC1kaXNhYmxlIG5vLWludmFsaWQtdGhpcyAqL1xyXG5cdFx0XHRyZXR1cm4gKGNvbXBvbmVudC5jb250cm9sbGVyIHx8IG5vb3ApLmFwcGx5KHRoaXMsIGFyZ3MpIHx8IHRoaXNcclxuXHRcdFx0LyogZXNsaW50LWVuYWJsZSBuby1pbnZhbGlkLXRoaXMgKi9cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoY29tcG9uZW50LmNvbnRyb2xsZXIpIHtcclxuXHRcdFx0Y29udHJvbGxlci5wcm90b3R5cGUgPSBjb21wb25lbnQuY29udHJvbGxlci5wcm90b3R5cGVcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiB2aWV3KGN0cmwpIHtcclxuXHRcdFx0dmFyIGN1cnJlbnRBcmdzID0gW2N0cmxdLmNvbmNhdChhcmdzKVxyXG5cdFx0XHRmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdGN1cnJlbnRBcmdzLnB1c2goYXJndW1lbnRzW2ldKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gY29tcG9uZW50LnZpZXcuYXBwbHkoY29tcG9uZW50LCBjdXJyZW50QXJncylcclxuXHRcdH1cclxuXHJcblx0XHR2aWV3LiRvcmlnaW5hbCA9IGNvbXBvbmVudC52aWV3XHJcblx0XHR2YXIgb3V0cHV0ID0ge2NvbnRyb2xsZXI6IGNvbnRyb2xsZXIsIHZpZXc6IHZpZXd9XHJcblx0XHRpZiAoYXJnc1swXSAmJiBhcmdzWzBdLmtleSAhPSBudWxsKSBvdXRwdXQuYXR0cnMgPSB7a2V5OiBhcmdzWzBdLmtleX1cclxuXHRcdHJldHVybiBvdXRwdXRcclxuXHR9XHJcblxyXG5cdG0uY29tcG9uZW50ID0gZnVuY3Rpb24gKGNvbXBvbmVudCkge1xyXG5cdFx0dmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSlcclxuXHJcblx0XHRyZXR1cm4gcGFyYW1ldGVyaXplKGNvbXBvbmVudCwgYXJncylcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGNoZWNrUHJldmVudGVkKGNvbXBvbmVudCwgcm9vdCwgaW5kZXgsIGlzUHJldmVudGVkKSB7XHJcblx0XHRpZiAoIWlzUHJldmVudGVkKSB7XHJcblx0XHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiYWxsXCIpXHJcblx0XHRcdG0uc3RhcnRDb21wdXRhdGlvbigpXHJcblx0XHRcdHJvb3RzW2luZGV4XSA9IHJvb3RcclxuXHRcdFx0dmFyIGN1cnJlbnRDb21wb25lbnRcclxuXHJcblx0XHRcdGlmIChjb21wb25lbnQpIHtcclxuXHRcdFx0XHRjdXJyZW50Q29tcG9uZW50ID0gdG9wQ29tcG9uZW50ID0gY29tcG9uZW50XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Y3VycmVudENvbXBvbmVudCA9IHRvcENvbXBvbmVudCA9IGNvbXBvbmVudCA9IHtjb250cm9sbGVyOiBub29wfVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgY29udHJvbGxlciA9IG5ldyAoY29tcG9uZW50LmNvbnRyb2xsZXIgfHwgbm9vcCkoKVxyXG5cclxuXHRcdFx0Ly8gY29udHJvbGxlcnMgbWF5IGNhbGwgbS5tb3VudCByZWN1cnNpdmVseSAodmlhIG0ucm91dGUgcmVkaXJlY3RzLFxyXG5cdFx0XHQvLyBmb3IgZXhhbXBsZSlcclxuXHRcdFx0Ly8gdGhpcyBjb25kaXRpb25hbCBlbnN1cmVzIG9ubHkgdGhlIGxhc3QgcmVjdXJzaXZlIG0ubW91bnQgY2FsbCBpc1xyXG5cdFx0XHQvLyBhcHBsaWVkXHJcblx0XHRcdGlmIChjdXJyZW50Q29tcG9uZW50ID09PSB0b3BDb21wb25lbnQpIHtcclxuXHRcdFx0XHRjb250cm9sbGVyc1tpbmRleF0gPSBjb250cm9sbGVyXHJcblx0XHRcdFx0Y29tcG9uZW50c1tpbmRleF0gPSBjb21wb25lbnRcclxuXHRcdFx0fVxyXG5cdFx0XHRlbmRGaXJzdENvbXB1dGF0aW9uKClcclxuXHRcdFx0aWYgKGNvbXBvbmVudCA9PT0gbnVsbCkge1xyXG5cdFx0XHRcdHJlbW92ZVJvb3RFbGVtZW50KHJvb3QsIGluZGV4KVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBjb250cm9sbGVyc1tpbmRleF1cclxuXHRcdH0gZWxzZSBpZiAoY29tcG9uZW50ID09IG51bGwpIHtcclxuXHRcdFx0cmVtb3ZlUm9vdEVsZW1lbnQocm9vdCwgaW5kZXgpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRtLm1vdW50ID0gbS5tb2R1bGUgPSBmdW5jdGlvbiAocm9vdCwgY29tcG9uZW50KSB7XHJcblx0XHRpZiAoIXJvb3QpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiUGxlYXNlIGVuc3VyZSB0aGUgRE9NIGVsZW1lbnQgZXhpc3RzIGJlZm9yZSBcIiArXHJcblx0XHRcdFx0XCJyZW5kZXJpbmcgYSB0ZW1wbGF0ZSBpbnRvIGl0LlwiKVxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBpbmRleCA9IHJvb3RzLmluZGV4T2Yocm9vdClcclxuXHRcdGlmIChpbmRleCA8IDApIGluZGV4ID0gcm9vdHMubGVuZ3RoXHJcblxyXG5cdFx0dmFyIGlzUHJldmVudGVkID0gZmFsc2VcclxuXHRcdHZhciBldmVudCA9IHtcclxuXHRcdFx0cHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRpc1ByZXZlbnRlZCA9IHRydWVcclxuXHRcdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IG51bGxcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGZvckVhY2godW5sb2FkZXJzLCBmdW5jdGlvbiAodW5sb2FkZXIpIHtcclxuXHRcdFx0dW5sb2FkZXIuaGFuZGxlci5jYWxsKHVubG9hZGVyLmNvbnRyb2xsZXIsIGV2ZW50KVxyXG5cdFx0XHR1bmxvYWRlci5jb250cm9sbGVyLm9udW5sb2FkID0gbnVsbFxyXG5cdFx0fSlcclxuXHJcblx0XHRpZiAoaXNQcmV2ZW50ZWQpIHtcclxuXHRcdFx0Zm9yRWFjaCh1bmxvYWRlcnMsIGZ1bmN0aW9uICh1bmxvYWRlcikge1xyXG5cdFx0XHRcdHVubG9hZGVyLmNvbnRyb2xsZXIub251bmxvYWQgPSB1bmxvYWRlci5oYW5kbGVyXHJcblx0XHRcdH0pXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR1bmxvYWRlcnMgPSBbXVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChjb250cm9sbGVyc1tpbmRleF0gJiYgaXNGdW5jdGlvbihjb250cm9sbGVyc1tpbmRleF0ub251bmxvYWQpKSB7XHJcblx0XHRcdGNvbnRyb2xsZXJzW2luZGV4XS5vbnVubG9hZChldmVudClcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gY2hlY2tQcmV2ZW50ZWQoY29tcG9uZW50LCByb290LCBpbmRleCwgaXNQcmV2ZW50ZWQpXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZW1vdmVSb290RWxlbWVudChyb290LCBpbmRleCkge1xyXG5cdFx0cm9vdHMuc3BsaWNlKGluZGV4LCAxKVxyXG5cdFx0Y29udHJvbGxlcnMuc3BsaWNlKGluZGV4LCAxKVxyXG5cdFx0Y29tcG9uZW50cy5zcGxpY2UoaW5kZXgsIDEpXHJcblx0XHRyZXNldChyb290KVxyXG5cdFx0bm9kZUNhY2hlLnNwbGljZShnZXRDZWxsQ2FjaGVLZXkocm9vdCksIDEpXHJcblx0fVxyXG5cclxuXHR2YXIgcmVkcmF3aW5nID0gZmFsc2VcclxuXHRtLnJlZHJhdyA9IGZ1bmN0aW9uIChmb3JjZSkge1xyXG5cdFx0aWYgKHJlZHJhd2luZykgcmV0dXJuXHJcblx0XHRyZWRyYXdpbmcgPSB0cnVlXHJcblx0XHRpZiAoZm9yY2UpIGZvcmNpbmcgPSB0cnVlXHJcblxyXG5cdFx0dHJ5IHtcclxuXHRcdFx0Ly8gbGFzdFJlZHJhd0lkIGlzIGEgcG9zaXRpdmUgbnVtYmVyIGlmIGEgc2Vjb25kIHJlZHJhdyBpcyByZXF1ZXN0ZWRcclxuXHRcdFx0Ly8gYmVmb3JlIHRoZSBuZXh0IGFuaW1hdGlvbiBmcmFtZVxyXG5cdFx0XHQvLyBsYXN0UmVkcmF3SUQgaXMgbnVsbCBpZiBpdCdzIHRoZSBmaXJzdCByZWRyYXcgYW5kIG5vdCBhbiBldmVudFxyXG5cdFx0XHQvLyBoYW5kbGVyXHJcblx0XHRcdGlmIChsYXN0UmVkcmF3SWQgJiYgIWZvcmNlKSB7XHJcblx0XHRcdFx0Ly8gd2hlbiBzZXRUaW1lb3V0OiBvbmx5IHJlc2NoZWR1bGUgcmVkcmF3IGlmIHRpbWUgYmV0d2VlbiBub3dcclxuXHRcdFx0XHQvLyBhbmQgcHJldmlvdXMgcmVkcmF3IGlzIGJpZ2dlciB0aGFuIGEgZnJhbWUsIG90aGVyd2lzZSBrZWVwXHJcblx0XHRcdFx0Ly8gY3VycmVudGx5IHNjaGVkdWxlZCB0aW1lb3V0XHJcblx0XHRcdFx0Ly8gd2hlbiByQUY6IGFsd2F5cyByZXNjaGVkdWxlIHJlZHJhd1xyXG5cdFx0XHRcdGlmICgkcmVxdWVzdEFuaW1hdGlvbkZyYW1lID09PSBnbG9iYWwucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0XHRcdFx0XHRcdG5ldyBEYXRlKCkgLSBsYXN0UmVkcmF3Q2FsbFRpbWUgPiBGUkFNRV9CVURHRVQpIHtcclxuXHRcdFx0XHRcdGlmIChsYXN0UmVkcmF3SWQgPiAwKSAkY2FuY2VsQW5pbWF0aW9uRnJhbWUobGFzdFJlZHJhd0lkKVxyXG5cdFx0XHRcdFx0bGFzdFJlZHJhd0lkID0gJHJlcXVlc3RBbmltYXRpb25GcmFtZShyZWRyYXcsIEZSQU1FX0JVREdFVClcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmVkcmF3KClcclxuXHRcdFx0XHRsYXN0UmVkcmF3SWQgPSAkcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdGxhc3RSZWRyYXdJZCA9IG51bGxcclxuXHRcdFx0XHR9LCBGUkFNRV9CVURHRVQpXHJcblx0XHRcdH1cclxuXHRcdH0gZmluYWxseSB7XHJcblx0XHRcdHJlZHJhd2luZyA9IGZvcmNpbmcgPSBmYWxzZVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0bS5yZWRyYXcuc3RyYXRlZ3kgPSBtLnByb3AoKVxyXG5cdGZ1bmN0aW9uIHJlZHJhdygpIHtcclxuXHRcdGlmIChjb21wdXRlUHJlUmVkcmF3SG9vaykge1xyXG5cdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vaygpXHJcblx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0Zm9yRWFjaChyb290cywgZnVuY3Rpb24gKHJvb3QsIGkpIHtcclxuXHRcdFx0dmFyIGNvbXBvbmVudCA9IGNvbXBvbmVudHNbaV1cclxuXHRcdFx0aWYgKGNvbnRyb2xsZXJzW2ldKSB7XHJcblx0XHRcdFx0dmFyIGFyZ3MgPSBbY29udHJvbGxlcnNbaV1dXHJcblx0XHRcdFx0bS5yZW5kZXIocm9vdCxcclxuXHRcdFx0XHRcdGNvbXBvbmVudC52aWV3ID8gY29tcG9uZW50LnZpZXcoY29udHJvbGxlcnNbaV0sIGFyZ3MpIDogXCJcIilcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHRcdC8vIGFmdGVyIHJlbmRlcmluZyB3aXRoaW4gYSByb3V0ZWQgY29udGV4dCwgd2UgbmVlZCB0byBzY3JvbGwgYmFjayB0b1xyXG5cdFx0Ly8gdGhlIHRvcCwgYW5kIGZldGNoIHRoZSBkb2N1bWVudCB0aXRsZSBmb3IgaGlzdG9yeS5wdXNoU3RhdGVcclxuXHRcdGlmIChjb21wdXRlUG9zdFJlZHJhd0hvb2spIHtcclxuXHRcdFx0Y29tcHV0ZVBvc3RSZWRyYXdIb29rKClcclxuXHRcdFx0Y29tcHV0ZVBvc3RSZWRyYXdIb29rID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0bGFzdFJlZHJhd0lkID0gbnVsbFxyXG5cdFx0bGFzdFJlZHJhd0NhbGxUaW1lID0gbmV3IERhdGUoKVxyXG5cdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJkaWZmXCIpXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBlbmRGaXJzdENvbXB1dGF0aW9uKCkge1xyXG5cdFx0aWYgKG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT09IFwibm9uZVwiKSB7XHJcblx0XHRcdHBlbmRpbmdSZXF1ZXN0cy0tXHJcblx0XHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiZGlmZlwiKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0bS5lbmRDb21wdXRhdGlvbigpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRtLndpdGhBdHRyID0gZnVuY3Rpb24gKHByb3AsIHdpdGhBdHRyQ2FsbGJhY2ssIGNhbGxiYWNrVGhpcykge1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChlKSB7XHJcblx0XHRcdGUgPSBlIHx8IGV2ZW50XHJcblx0XHRcdC8qIGVzbGludC1kaXNhYmxlIG5vLWludmFsaWQtdGhpcyAqL1xyXG5cdFx0XHR2YXIgY3VycmVudFRhcmdldCA9IGUuY3VycmVudFRhcmdldCB8fCB0aGlzXHJcblx0XHRcdHZhciBfdGhpcyA9IGNhbGxiYWNrVGhpcyB8fCB0aGlzXHJcblx0XHRcdC8qIGVzbGludC1lbmFibGUgbm8taW52YWxpZC10aGlzICovXHJcblx0XHRcdHZhciB0YXJnZXQgPSBwcm9wIGluIGN1cnJlbnRUYXJnZXQgP1xyXG5cdFx0XHRcdGN1cnJlbnRUYXJnZXRbcHJvcF0gOlxyXG5cdFx0XHRcdGN1cnJlbnRUYXJnZXQuZ2V0QXR0cmlidXRlKHByb3ApXHJcblx0XHRcdHdpdGhBdHRyQ2FsbGJhY2suY2FsbChfdGhpcywgdGFyZ2V0KVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Ly8gcm91dGluZ1xyXG5cdHZhciBtb2RlcyA9IHtwYXRobmFtZTogXCJcIiwgaGFzaDogXCIjXCIsIHNlYXJjaDogXCI/XCJ9XHJcblx0dmFyIHJlZGlyZWN0ID0gbm9vcFxyXG5cdHZhciBpc0RlZmF1bHRSb3V0ZSA9IGZhbHNlXHJcblx0dmFyIHJvdXRlUGFyYW1zLCBjdXJyZW50Um91dGVcclxuXHJcblx0bS5yb3V0ZSA9IGZ1bmN0aW9uIChyb290LCBhcmcxLCBhcmcyLCB2ZG9tKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcclxuXHRcdC8vIG0ucm91dGUoKVxyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiBjdXJyZW50Um91dGVcclxuXHRcdC8vIG0ucm91dGUoZWwsIGRlZmF1bHRSb3V0ZSwgcm91dGVzKVxyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMgJiYgaXNTdHJpbmcoYXJnMSkpIHtcclxuXHRcdFx0cmVkaXJlY3QgPSBmdW5jdGlvbiAoc291cmNlKSB7XHJcblx0XHRcdFx0dmFyIHBhdGggPSBjdXJyZW50Um91dGUgPSBub3JtYWxpemVSb3V0ZShzb3VyY2UpXHJcblx0XHRcdFx0aWYgKCFyb3V0ZUJ5VmFsdWUocm9vdCwgYXJnMiwgcGF0aCkpIHtcclxuXHRcdFx0XHRcdGlmIChpc0RlZmF1bHRSb3V0ZSkge1xyXG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJFbnN1cmUgdGhlIGRlZmF1bHQgcm91dGUgbWF0Y2hlcyBcIiArXHJcblx0XHRcdFx0XHRcdFx0XCJvbmUgb2YgdGhlIHJvdXRlcyBkZWZpbmVkIGluIG0ucm91dGVcIilcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRpc0RlZmF1bHRSb3V0ZSA9IHRydWVcclxuXHRcdFx0XHRcdG0ucm91dGUoYXJnMSwgdHJ1ZSlcclxuXHRcdFx0XHRcdGlzRGVmYXVsdFJvdXRlID0gZmFsc2VcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBsaXN0ZW5lciA9IG0ucm91dGUubW9kZSA9PT0gXCJoYXNoXCIgP1xyXG5cdFx0XHRcdFwib25oYXNoY2hhbmdlXCIgOlxyXG5cdFx0XHRcdFwib25wb3BzdGF0ZVwiXHJcblxyXG5cdFx0XHRnbG9iYWxbbGlzdGVuZXJdID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHZhciBwYXRoID0gJGxvY2F0aW9uW20ucm91dGUubW9kZV1cclxuXHRcdFx0XHRpZiAobS5yb3V0ZS5tb2RlID09PSBcInBhdGhuYW1lXCIpIHBhdGggKz0gJGxvY2F0aW9uLnNlYXJjaFxyXG5cdFx0XHRcdGlmIChjdXJyZW50Um91dGUgIT09IG5vcm1hbGl6ZVJvdXRlKHBhdGgpKSByZWRpcmVjdChwYXRoKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IHNldFNjcm9sbFxyXG5cdFx0XHRnbG9iYWxbbGlzdGVuZXJdKClcclxuXHJcblx0XHRcdHJldHVyblxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIGNvbmZpZzogbS5yb3V0ZVxyXG5cdFx0aWYgKHJvb3QuYWRkRXZlbnRMaXN0ZW5lciB8fCByb290LmF0dGFjaEV2ZW50KSB7XHJcblx0XHRcdHZhciBiYXNlID0gbS5yb3V0ZS5tb2RlICE9PSBcInBhdGhuYW1lXCIgPyAkbG9jYXRpb24ucGF0aG5hbWUgOiBcIlwiXHJcblx0XHRcdHJvb3QuaHJlZiA9IGJhc2UgKyBtb2Rlc1ttLnJvdXRlLm1vZGVdICsgdmRvbS5hdHRycy5ocmVmXHJcblx0XHRcdGlmIChyb290LmFkZEV2ZW50TGlzdGVuZXIpIHtcclxuXHRcdFx0XHRyb290LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKVxyXG5cdFx0XHRcdHJvb3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHJvdXRlVW5vYnRydXNpdmUpXHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cm9vdC5kZXRhY2hFdmVudChcIm9uY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSlcclxuXHRcdFx0XHRyb290LmF0dGFjaEV2ZW50KFwib25jbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHRcdC8vIG0ucm91dGUocm91dGUsIHBhcmFtcywgc2hvdWxkUmVwbGFjZUhpc3RvcnlFbnRyeSlcclxuXHRcdGlmIChpc1N0cmluZyhyb290KSkge1xyXG5cdFx0XHR2YXIgb2xkUm91dGUgPSBjdXJyZW50Um91dGVcclxuXHRcdFx0Y3VycmVudFJvdXRlID0gcm9vdFxyXG5cclxuXHRcdFx0dmFyIGFyZ3MgPSBhcmcxIHx8IHt9XHJcblx0XHRcdHZhciBxdWVyeUluZGV4ID0gY3VycmVudFJvdXRlLmluZGV4T2YoXCI/XCIpXHJcblx0XHRcdHZhciBwYXJhbXNcclxuXHJcblx0XHRcdGlmIChxdWVyeUluZGV4ID4gLTEpIHtcclxuXHRcdFx0XHRwYXJhbXMgPSBwYXJzZVF1ZXJ5U3RyaW5nKGN1cnJlbnRSb3V0ZS5zbGljZShxdWVyeUluZGV4ICsgMSkpXHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cGFyYW1zID0ge31cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Zm9yICh2YXIgaSBpbiBhcmdzKSBpZiAoaGFzT3duLmNhbGwoYXJncywgaSkpIHtcclxuXHRcdFx0XHRwYXJhbXNbaV0gPSBhcmdzW2ldXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBxdWVyeXN0cmluZyA9IGJ1aWxkUXVlcnlTdHJpbmcocGFyYW1zKVxyXG5cdFx0XHR2YXIgY3VycmVudFBhdGhcclxuXHJcblx0XHRcdGlmIChxdWVyeUluZGV4ID4gLTEpIHtcclxuXHRcdFx0XHRjdXJyZW50UGF0aCA9IGN1cnJlbnRSb3V0ZS5zbGljZSgwLCBxdWVyeUluZGV4KVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGN1cnJlbnRQYXRoID0gY3VycmVudFJvdXRlXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChxdWVyeXN0cmluZykge1xyXG5cdFx0XHRcdGN1cnJlbnRSb3V0ZSA9IGN1cnJlbnRQYXRoICtcclxuXHRcdFx0XHRcdChjdXJyZW50UGF0aC5pbmRleE9mKFwiP1wiKSA9PT0gLTEgPyBcIj9cIiA6IFwiJlwiKSArXHJcblx0XHRcdFx0XHRxdWVyeXN0cmluZ1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgcmVwbGFjZUhpc3RvcnkgPVxyXG5cdFx0XHRcdChhcmd1bWVudHMubGVuZ3RoID09PSAzID8gYXJnMiA6IGFyZzEpID09PSB0cnVlIHx8XHJcblx0XHRcdFx0b2xkUm91dGUgPT09IHJvb3RcclxuXHJcblx0XHRcdGlmIChnbG9iYWwuaGlzdG9yeS5wdXNoU3RhdGUpIHtcclxuXHRcdFx0XHR2YXIgbWV0aG9kID0gcmVwbGFjZUhpc3RvcnkgPyBcInJlcGxhY2VTdGF0ZVwiIDogXCJwdXNoU3RhdGVcIlxyXG5cdFx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gc2V0U2Nyb2xsXHJcblx0XHRcdFx0Y29tcHV0ZVBvc3RSZWRyYXdIb29rID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0Z2xvYmFsLmhpc3RvcnlbbWV0aG9kXShudWxsLCAkZG9jdW1lbnQudGl0bGUsXHJcblx0XHRcdFx0XHRcdG1vZGVzW20ucm91dGUubW9kZV0gKyBjdXJyZW50Um91dGUpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJlZGlyZWN0KG1vZGVzW20ucm91dGUubW9kZV0gKyBjdXJyZW50Um91dGUpXHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0JGxvY2F0aW9uW20ucm91dGUubW9kZV0gPSBjdXJyZW50Um91dGVcclxuXHRcdFx0XHRyZWRpcmVjdChtb2Rlc1ttLnJvdXRlLm1vZGVdICsgY3VycmVudFJvdXRlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRtLnJvdXRlLnBhcmFtID0gZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0aWYgKCFyb3V0ZVBhcmFtcykge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJZb3UgbXVzdCBjYWxsIG0ucm91dGUoZWxlbWVudCwgZGVmYXVsdFJvdXRlLCBcIiArXHJcblx0XHRcdFx0XCJyb3V0ZXMpIGJlZm9yZSBjYWxsaW5nIG0ucm91dGUucGFyYW0oKVwiKVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICgha2V5KSB7XHJcblx0XHRcdHJldHVybiByb3V0ZVBhcmFtc1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiByb3V0ZVBhcmFtc1trZXldXHJcblx0fVxyXG5cclxuXHRtLnJvdXRlLm1vZGUgPSBcInNlYXJjaFwiXHJcblxyXG5cdGZ1bmN0aW9uIG5vcm1hbGl6ZVJvdXRlKHJvdXRlKSB7XHJcblx0XHRyZXR1cm4gcm91dGUuc2xpY2UobW9kZXNbbS5yb3V0ZS5tb2RlXS5sZW5ndGgpXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByb3V0ZUJ5VmFsdWUocm9vdCwgcm91dGVyLCBwYXRoKSB7XHJcblx0XHRyb3V0ZVBhcmFtcyA9IHt9XHJcblxyXG5cdFx0dmFyIHF1ZXJ5U3RhcnQgPSBwYXRoLmluZGV4T2YoXCI/XCIpXHJcblx0XHRpZiAocXVlcnlTdGFydCAhPT0gLTEpIHtcclxuXHRcdFx0cm91dGVQYXJhbXMgPSBwYXJzZVF1ZXJ5U3RyaW5nKFxyXG5cdFx0XHRcdHBhdGguc3Vic3RyKHF1ZXJ5U3RhcnQgKyAxLCBwYXRoLmxlbmd0aCkpXHJcblx0XHRcdHBhdGggPSBwYXRoLnN1YnN0cigwLCBxdWVyeVN0YXJ0KVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIEdldCBhbGwgcm91dGVzIGFuZCBjaGVjayBpZiB0aGVyZSdzXHJcblx0XHQvLyBhbiBleGFjdCBtYXRjaCBmb3IgdGhlIGN1cnJlbnQgcGF0aFxyXG5cdFx0dmFyIGtleXMgPSBPYmplY3Qua2V5cyhyb3V0ZXIpXHJcblx0XHR2YXIgaW5kZXggPSBrZXlzLmluZGV4T2YocGF0aClcclxuXHJcblx0XHRpZiAoaW5kZXggIT09IC0xKXtcclxuXHRcdFx0bS5tb3VudChyb290LCByb3V0ZXJba2V5cyBbaW5kZXhdXSlcclxuXHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdH1cclxuXHJcblx0XHRmb3IgKHZhciByb3V0ZSBpbiByb3V0ZXIpIGlmIChoYXNPd24uY2FsbChyb3V0ZXIsIHJvdXRlKSkge1xyXG5cdFx0XHRpZiAocm91dGUgPT09IHBhdGgpIHtcclxuXHRcdFx0XHRtLm1vdW50KHJvb3QsIHJvdXRlcltyb3V0ZV0pXHJcblx0XHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIG1hdGNoZXIgPSBuZXcgUmVnRXhwKFwiXlwiICsgcm91dGVcclxuXHRcdFx0XHQucmVwbGFjZSgvOlteXFwvXSs/XFwuezN9L2csIFwiKC4qPylcIilcclxuXHRcdFx0XHQucmVwbGFjZSgvOlteXFwvXSsvZywgXCIoW15cXFxcL10rKVwiKSArIFwiXFwvPyRcIilcclxuXHJcblx0XHRcdGlmIChtYXRjaGVyLnRlc3QocGF0aCkpIHtcclxuXHRcdFx0XHQvKiBlc2xpbnQtZGlzYWJsZSBuby1sb29wLWZ1bmMgKi9cclxuXHRcdFx0XHRwYXRoLnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0dmFyIGtleXMgPSByb3V0ZS5tYXRjaCgvOlteXFwvXSsvZykgfHwgW11cclxuXHRcdFx0XHRcdHZhciB2YWx1ZXMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSwgLTIpXHJcblx0XHRcdFx0XHRmb3JFYWNoKGtleXMsIGZ1bmN0aW9uIChrZXksIGkpIHtcclxuXHRcdFx0XHRcdFx0cm91dGVQYXJhbXNba2V5LnJlcGxhY2UoLzp8XFwuL2csIFwiXCIpXSA9XHJcblx0XHRcdFx0XHRcdFx0ZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlc1tpXSlcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHRtLm1vdW50KHJvb3QsIHJvdXRlcltyb3V0ZV0pXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0XHQvKiBlc2xpbnQtZW5hYmxlIG5vLWxvb3AtZnVuYyAqL1xyXG5cdFx0XHRcdHJldHVybiB0cnVlXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHJvdXRlVW5vYnRydXNpdmUoZSkge1xyXG5cdFx0ZSA9IGUgfHwgZXZlbnRcclxuXHRcdGlmIChlLmN0cmxLZXkgfHwgZS5tZXRhS2V5IHx8IGUuc2hpZnRLZXkgfHwgZS53aGljaCA9PT0gMikgcmV0dXJuXHJcblxyXG5cdFx0aWYgKGUucHJldmVudERlZmF1bHQpIHtcclxuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRlLnJldHVyblZhbHVlID0gZmFsc2VcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgY3VycmVudFRhcmdldCA9IGUuY3VycmVudFRhcmdldCB8fCBlLnNyY0VsZW1lbnRcclxuXHRcdHZhciBhcmdzXHJcblxyXG5cdFx0aWYgKG0ucm91dGUubW9kZSA9PT0gXCJwYXRobmFtZVwiICYmIGN1cnJlbnRUYXJnZXQuc2VhcmNoKSB7XHJcblx0XHRcdGFyZ3MgPSBwYXJzZVF1ZXJ5U3RyaW5nKGN1cnJlbnRUYXJnZXQuc2VhcmNoLnNsaWNlKDEpKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0YXJncyA9IHt9XHJcblx0XHR9XHJcblxyXG5cdFx0d2hpbGUgKGN1cnJlbnRUYXJnZXQgJiYgIS9hL2kudGVzdChjdXJyZW50VGFyZ2V0Lm5vZGVOYW1lKSkge1xyXG5cdFx0XHRjdXJyZW50VGFyZ2V0ID0gY3VycmVudFRhcmdldC5wYXJlbnROb2RlXHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gY2xlYXIgcGVuZGluZ1JlcXVlc3RzIGJlY2F1c2Ugd2Ugd2FudCBhbiBpbW1lZGlhdGUgcm91dGUgY2hhbmdlXHJcblx0XHRwZW5kaW5nUmVxdWVzdHMgPSAwXHJcblx0XHRtLnJvdXRlKGN1cnJlbnRUYXJnZXRbbS5yb3V0ZS5tb2RlXVxyXG5cdFx0XHQuc2xpY2UobW9kZXNbbS5yb3V0ZS5tb2RlXS5sZW5ndGgpLCBhcmdzKVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc2V0U2Nyb2xsKCkge1xyXG5cdFx0aWYgKG0ucm91dGUubW9kZSAhPT0gXCJoYXNoXCIgJiYgJGxvY2F0aW9uLmhhc2gpIHtcclxuXHRcdFx0JGxvY2F0aW9uLmhhc2ggPSAkbG9jYXRpb24uaGFzaFxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Z2xvYmFsLnNjcm9sbFRvKDAsIDApXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBidWlsZFF1ZXJ5U3RyaW5nKG9iamVjdCwgcHJlZml4KSB7XHJcblx0XHR2YXIgZHVwbGljYXRlcyA9IHt9XHJcblx0XHR2YXIgc3RyID0gW11cclxuXHJcblx0XHRmb3IgKHZhciBwcm9wIGluIG9iamVjdCkgaWYgKGhhc093bi5jYWxsKG9iamVjdCwgcHJvcCkpIHtcclxuXHRcdFx0dmFyIGtleSA9IHByZWZpeCA/IHByZWZpeCArIFwiW1wiICsgcHJvcCArIFwiXVwiIDogcHJvcFxyXG5cdFx0XHR2YXIgdmFsdWUgPSBvYmplY3RbcHJvcF1cclxuXHJcblx0XHRcdGlmICh2YWx1ZSA9PT0gbnVsbCkge1xyXG5cdFx0XHRcdHN0ci5wdXNoKGVuY29kZVVSSUNvbXBvbmVudChrZXkpKVxyXG5cdFx0XHR9IGVsc2UgaWYgKGlzT2JqZWN0KHZhbHVlKSkge1xyXG5cdFx0XHRcdHN0ci5wdXNoKGJ1aWxkUXVlcnlTdHJpbmcodmFsdWUsIGtleSkpXHJcblx0XHRcdH0gZWxzZSBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcclxuXHRcdFx0XHR2YXIga2V5cyA9IFtdXHJcblx0XHRcdFx0ZHVwbGljYXRlc1trZXldID0gZHVwbGljYXRlc1trZXldIHx8IHt9XHJcblx0XHRcdFx0LyogZXNsaW50LWRpc2FibGUgbm8tbG9vcC1mdW5jICovXHJcblx0XHRcdFx0Zm9yRWFjaCh2YWx1ZSwgZnVuY3Rpb24gKGl0ZW0pIHtcclxuXHRcdFx0XHRcdC8qIGVzbGludC1lbmFibGUgbm8tbG9vcC1mdW5jICovXHJcblx0XHRcdFx0XHRpZiAoIWR1cGxpY2F0ZXNba2V5XVtpdGVtXSkge1xyXG5cdFx0XHRcdFx0XHRkdXBsaWNhdGVzW2tleV1baXRlbV0gPSB0cnVlXHJcblx0XHRcdFx0XHRcdGtleXMucHVzaChlbmNvZGVVUklDb21wb25lbnQoa2V5KSArIFwiPVwiICtcclxuXHRcdFx0XHRcdFx0XHRlbmNvZGVVUklDb21wb25lbnQoaXRlbSkpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0XHRzdHIucHVzaChrZXlzLmpvaW4oXCImXCIpKVxyXG5cdFx0XHR9IGVsc2UgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRzdHIucHVzaChlbmNvZGVVUklDb21wb25lbnQoa2V5KSArIFwiPVwiICtcclxuXHRcdFx0XHRcdGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBzdHIuam9pbihcIiZcIilcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHBhcnNlUXVlcnlTdHJpbmcoc3RyKSB7XHJcblx0XHRpZiAoc3RyID09PSBcIlwiIHx8IHN0ciA9PSBudWxsKSByZXR1cm4ge31cclxuXHRcdGlmIChzdHIuY2hhckF0KDApID09PSBcIj9cIikgc3RyID0gc3RyLnNsaWNlKDEpXHJcblxyXG5cdFx0dmFyIHBhaXJzID0gc3RyLnNwbGl0KFwiJlwiKVxyXG5cdFx0dmFyIHBhcmFtcyA9IHt9XHJcblxyXG5cdFx0Zm9yRWFjaChwYWlycywgZnVuY3Rpb24gKHN0cmluZykge1xyXG5cdFx0XHR2YXIgcGFpciA9IHN0cmluZy5zcGxpdChcIj1cIilcclxuXHRcdFx0dmFyIGtleSA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzBdKVxyXG5cdFx0XHR2YXIgdmFsdWUgPSBwYWlyLmxlbmd0aCA9PT0gMiA/IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzFdKSA6IG51bGxcclxuXHRcdFx0aWYgKHBhcmFtc1trZXldICE9IG51bGwpIHtcclxuXHRcdFx0XHRpZiAoIWlzQXJyYXkocGFyYW1zW2tleV0pKSBwYXJhbXNba2V5XSA9IFtwYXJhbXNba2V5XV1cclxuXHRcdFx0XHRwYXJhbXNba2V5XS5wdXNoKHZhbHVlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgcGFyYW1zW2tleV0gPSB2YWx1ZVxyXG5cdFx0fSlcclxuXHJcblx0XHRyZXR1cm4gcGFyYW1zXHJcblx0fVxyXG5cclxuXHRtLnJvdXRlLmJ1aWxkUXVlcnlTdHJpbmcgPSBidWlsZFF1ZXJ5U3RyaW5nXHJcblx0bS5yb3V0ZS5wYXJzZVF1ZXJ5U3RyaW5nID0gcGFyc2VRdWVyeVN0cmluZ1xyXG5cclxuXHRmdW5jdGlvbiByZXNldChyb290KSB7XHJcblx0XHR2YXIgY2FjaGVLZXkgPSBnZXRDZWxsQ2FjaGVLZXkocm9vdClcclxuXHRcdGNsZWFyKHJvb3QuY2hpbGROb2RlcywgY2VsbENhY2hlW2NhY2hlS2V5XSlcclxuXHRcdGNlbGxDYWNoZVtjYWNoZUtleV0gPSB1bmRlZmluZWRcclxuXHR9XHJcblxyXG5cdG0uZGVmZXJyZWQgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQoKVxyXG5cdFx0ZGVmZXJyZWQucHJvbWlzZSA9IHByb3BpZnkoZGVmZXJyZWQucHJvbWlzZSlcclxuXHRcdHJldHVybiBkZWZlcnJlZFxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcHJvcGlmeShwcm9taXNlLCBpbml0aWFsVmFsdWUpIHtcclxuXHRcdHZhciBwcm9wID0gbS5wcm9wKGluaXRpYWxWYWx1ZSlcclxuXHRcdHByb21pc2UudGhlbihwcm9wKVxyXG5cdFx0cHJvcC50aGVuID0gZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG5cdFx0XHRyZXR1cm4gcHJvcGlmeShwcm9taXNlLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KSwgaW5pdGlhbFZhbHVlKVxyXG5cdFx0fVxyXG5cclxuXHRcdHByb3AuY2F0Y2ggPSBwcm9wLnRoZW4uYmluZChudWxsLCBudWxsKVxyXG5cdFx0cmV0dXJuIHByb3BcclxuXHR9XHJcblx0Ly8gUHJvbWl6Lm1pdGhyaWwuanMgfCBab2xtZWlzdGVyIHwgTUlUXHJcblx0Ly8gYSBtb2RpZmllZCB2ZXJzaW9uIG9mIFByb21pei5qcywgd2hpY2ggZG9lcyBub3QgY29uZm9ybSB0byBQcm9taXNlcy9BK1xyXG5cdC8vIGZvciB0d28gcmVhc29uczpcclxuXHQvL1xyXG5cdC8vIDEpIGB0aGVuYCBjYWxsYmFja3MgYXJlIGNhbGxlZCBzeW5jaHJvbm91c2x5IChiZWNhdXNlIHNldFRpbWVvdXQgaXMgdG9vXHJcblx0Ly8gICAgc2xvdywgYW5kIHRoZSBzZXRJbW1lZGlhdGUgcG9seWZpbGwgaXMgdG9vIGJpZ1xyXG5cdC8vXHJcblx0Ly8gMikgdGhyb3dpbmcgc3ViY2xhc3NlcyBvZiBFcnJvciBjYXVzZSB0aGUgZXJyb3IgdG8gYmUgYnViYmxlZCB1cCBpbnN0ZWFkXHJcblx0Ly8gICAgb2YgdHJpZ2dlcmluZyByZWplY3Rpb24gKGJlY2F1c2UgdGhlIHNwZWMgZG9lcyBub3QgYWNjb3VudCBmb3IgdGhlXHJcblx0Ly8gICAgaW1wb3J0YW50IHVzZSBjYXNlIG9mIGRlZmF1bHQgYnJvd3NlciBlcnJvciBoYW5kbGluZywgaS5lLiBtZXNzYWdlIHcvXHJcblx0Ly8gICAgbGluZSBudW1iZXIpXHJcblxyXG5cdHZhciBSRVNPTFZJTkcgPSAxXHJcblx0dmFyIFJFSkVDVElORyA9IDJcclxuXHR2YXIgUkVTT0xWRUQgPSAzXHJcblx0dmFyIFJFSkVDVEVEID0gNFxyXG5cclxuXHRmdW5jdGlvbiBEZWZlcnJlZChvblN1Y2Nlc3MsIG9uRmFpbHVyZSkge1xyXG5cdFx0dmFyIHNlbGYgPSB0aGlzXHJcblx0XHR2YXIgc3RhdGUgPSAwXHJcblx0XHR2YXIgcHJvbWlzZVZhbHVlID0gMFxyXG5cdFx0dmFyIG5leHQgPSBbXVxyXG5cclxuXHRcdHNlbGYucHJvbWlzZSA9IHt9XHJcblxyXG5cdFx0c2VsZi5yZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0XHRcdGlmICghc3RhdGUpIHtcclxuXHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZVxyXG5cdFx0XHRcdHN0YXRlID0gUkVTT0xWSU5HXHJcblxyXG5cdFx0XHRcdGZpcmUoKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gc2VsZlxyXG5cdFx0fVxyXG5cclxuXHRcdHNlbGYucmVqZWN0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0XHRcdGlmICghc3RhdGUpIHtcclxuXHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZVxyXG5cdFx0XHRcdHN0YXRlID0gUkVKRUNUSU5HXHJcblxyXG5cdFx0XHRcdGZpcmUoKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gc2VsZlxyXG5cdFx0fVxyXG5cclxuXHRcdHNlbGYucHJvbWlzZS50aGVuID0gZnVuY3Rpb24gKG9uU3VjY2Vzcywgb25GYWlsdXJlKSB7XHJcblx0XHRcdHZhciBkZWZlcnJlZCA9IG5ldyBEZWZlcnJlZChvblN1Y2Nlc3MsIG9uRmFpbHVyZSlcclxuXHJcblx0XHRcdGlmIChzdGF0ZSA9PT0gUkVTT0xWRUQpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VWYWx1ZSlcclxuXHRcdFx0fSBlbHNlIGlmIChzdGF0ZSA9PT0gUkVKRUNURUQpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZWplY3QocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdG5leHQucHVzaChkZWZlcnJlZClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2VcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBmaW5pc2godHlwZSkge1xyXG5cdFx0XHRzdGF0ZSA9IHR5cGUgfHwgUkVKRUNURURcclxuXHRcdFx0bmV4dC5tYXAoZnVuY3Rpb24gKGRlZmVycmVkKSB7XHJcblx0XHRcdFx0aWYgKHN0YXRlID09PSBSRVNPTFZFRCkge1xyXG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlVmFsdWUpXHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGRlZmVycmVkLnJlamVjdChwcm9taXNlVmFsdWUpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIHRoZW5uYWJsZSh0aGVuLCBzdWNjZXNzLCBmYWlsdXJlLCBub3RUaGVubmFibGUpIHtcclxuXHRcdFx0aWYgKCgocHJvbWlzZVZhbHVlICE9IG51bGwgJiYgaXNPYmplY3QocHJvbWlzZVZhbHVlKSkgfHxcclxuXHRcdFx0XHRcdGlzRnVuY3Rpb24ocHJvbWlzZVZhbHVlKSkgJiYgaXNGdW5jdGlvbih0aGVuKSkge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHQvLyBjb3VudCBwcm90ZWN0cyBhZ2FpbnN0IGFidXNlIGNhbGxzIGZyb20gc3BlYyBjaGVja2VyXHJcblx0XHRcdFx0XHR2YXIgY291bnQgPSAwXHJcblx0XHRcdFx0XHR0aGVuLmNhbGwocHJvbWlzZVZhbHVlLCBmdW5jdGlvbiAodmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNvdW50KyspIHJldHVyblxyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZVxyXG5cdFx0XHRcdFx0XHRzdWNjZXNzKClcclxuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uICh2YWx1ZSkge1xyXG5cdFx0XHRcdFx0XHRpZiAoY291bnQrKykgcmV0dXJuXHJcblx0XHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IHZhbHVlXHJcblx0XHRcdFx0XHRcdGZhaWx1cmUoKVxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9IGNhdGNoIChlKSB7XHJcblx0XHRcdFx0XHRtLmRlZmVycmVkLm9uZXJyb3IoZSlcclxuXHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IGVcclxuXHRcdFx0XHRcdGZhaWx1cmUoKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRub3RUaGVubmFibGUoKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZmlyZSgpIHtcclxuXHRcdFx0Ly8gY2hlY2sgaWYgaXQncyBhIHRoZW5hYmxlXHJcblx0XHRcdHZhciB0aGVuXHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0dGhlbiA9IHByb21pc2VWYWx1ZSAmJiBwcm9taXNlVmFsdWUudGhlblxyXG5cdFx0XHR9IGNhdGNoIChlKSB7XHJcblx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpXHJcblx0XHRcdFx0cHJvbWlzZVZhbHVlID0gZVxyXG5cdFx0XHRcdHN0YXRlID0gUkVKRUNUSU5HXHJcblx0XHRcdFx0cmV0dXJuIGZpcmUoKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoc3RhdGUgPT09IFJFSkVDVElORykge1xyXG5cdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihwcm9taXNlVmFsdWUpXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoZW5uYWJsZSh0aGVuLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0c3RhdGUgPSBSRVNPTFZJTkdcclxuXHRcdFx0XHRmaXJlKClcclxuXHRcdFx0fSwgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHN0YXRlID0gUkVKRUNUSU5HXHJcblx0XHRcdFx0ZmlyZSgpXHJcblx0XHRcdH0sIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0aWYgKHN0YXRlID09PSBSRVNPTFZJTkcgJiYgaXNGdW5jdGlvbihvblN1Y2Nlc3MpKSB7XHJcblx0XHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IG9uU3VjY2Vzcyhwcm9taXNlVmFsdWUpXHJcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHN0YXRlID09PSBSRUpFQ1RJTkcgJiYgaXNGdW5jdGlvbihvbkZhaWx1cmUpKSB7XHJcblx0XHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IG9uRmFpbHVyZShwcm9taXNlVmFsdWUpXHJcblx0XHRcdFx0XHRcdHN0YXRlID0gUkVTT0xWSU5HXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpXHJcblx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBlXHJcblx0XHRcdFx0XHRyZXR1cm4gZmluaXNoKClcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmIChwcm9taXNlVmFsdWUgPT09IHNlbGYpIHtcclxuXHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IFR5cGVFcnJvcigpXHJcblx0XHRcdFx0XHRmaW5pc2goKVxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR0aGVubmFibGUodGhlbiwgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRmaW5pc2goUkVTT0xWRUQpXHJcblx0XHRcdFx0XHR9LCBmaW5pc2gsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0ZmluaXNoKHN0YXRlID09PSBSRVNPTFZJTkcgJiYgUkVTT0xWRUQpXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdG0uZGVmZXJyZWQub25lcnJvciA9IGZ1bmN0aW9uIChlKSB7XHJcblx0XHRpZiAodHlwZS5jYWxsKGUpID09PSBcIltvYmplY3QgRXJyb3JdXCIgJiZcclxuXHRcdFx0XHQhLyBFcnJvci8udGVzdChlLmNvbnN0cnVjdG9yLnRvU3RyaW5nKCkpKSB7XHJcblx0XHRcdHBlbmRpbmdSZXF1ZXN0cyA9IDBcclxuXHRcdFx0dGhyb3cgZVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0bS5zeW5jID0gZnVuY3Rpb24gKGFyZ3MpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9IG0uZGVmZXJyZWQoKVxyXG5cdFx0dmFyIG91dHN0YW5kaW5nID0gYXJncy5sZW5ndGhcclxuXHRcdHZhciByZXN1bHRzID0gbmV3IEFycmF5KG91dHN0YW5kaW5nKVxyXG5cdFx0dmFyIG1ldGhvZCA9IFwicmVzb2x2ZVwiXHJcblxyXG5cdFx0ZnVuY3Rpb24gc3luY2hyb25pemVyKHBvcywgcmVzb2x2ZWQpIHtcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xyXG5cdFx0XHRcdHJlc3VsdHNbcG9zXSA9IHZhbHVlXHJcblx0XHRcdFx0aWYgKCFyZXNvbHZlZCkgbWV0aG9kID0gXCJyZWplY3RcIlxyXG5cdFx0XHRcdGlmICgtLW91dHN0YW5kaW5nID09PSAwKSB7XHJcblx0XHRcdFx0XHRkZWZlcnJlZC5wcm9taXNlKHJlc3VsdHMpXHJcblx0XHRcdFx0XHRkZWZlcnJlZFttZXRob2RdKHJlc3VsdHMpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiB2YWx1ZVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGFyZ3MubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRmb3JFYWNoKGFyZ3MsIGZ1bmN0aW9uIChhcmcsIGkpIHtcclxuXHRcdFx0XHRhcmcudGhlbihzeW5jaHJvbml6ZXIoaSwgdHJ1ZSksIHN5bmNocm9uaXplcihpLCBmYWxzZSkpXHJcblx0XHRcdH0pXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRkZWZlcnJlZC5yZXNvbHZlKFtdKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBpZGVudGl0eSh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgfVxyXG5cclxuXHRmdW5jdGlvbiBoYW5kbGVKc29ucChvcHRpb25zKSB7XHJcblx0XHR2YXIgY2FsbGJhY2tLZXkgPSBcIm1pdGhyaWxfY2FsbGJhY2tfXCIgK1xyXG5cdFx0XHRuZXcgRGF0ZSgpLmdldFRpbWUoKSArIFwiX1wiICtcclxuXHRcdFx0KE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDFlMTYpKS50b1N0cmluZygzNilcclxuXHJcblx0XHR2YXIgc2NyaXB0ID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIilcclxuXHJcblx0XHRnbG9iYWxbY2FsbGJhY2tLZXldID0gZnVuY3Rpb24gKHJlc3ApIHtcclxuXHRcdFx0c2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KVxyXG5cdFx0XHRvcHRpb25zLm9ubG9hZCh7XHJcblx0XHRcdFx0dHlwZTogXCJsb2FkXCIsXHJcblx0XHRcdFx0dGFyZ2V0OiB7XHJcblx0XHRcdFx0XHRyZXNwb25zZVRleHQ6IHJlc3BcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHRcdGdsb2JhbFtjYWxsYmFja0tleV0gPSB1bmRlZmluZWRcclxuXHRcdH1cclxuXHJcblx0XHRzY3JpcHQub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0c2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KVxyXG5cclxuXHRcdFx0b3B0aW9ucy5vbmVycm9yKHtcclxuXHRcdFx0XHR0eXBlOiBcImVycm9yXCIsXHJcblx0XHRcdFx0dGFyZ2V0OiB7XHJcblx0XHRcdFx0XHRzdGF0dXM6IDUwMCxcclxuXHRcdFx0XHRcdHJlc3BvbnNlVGV4dDogSlNPTi5zdHJpbmdpZnkoe1xyXG5cdFx0XHRcdFx0XHRlcnJvcjogXCJFcnJvciBtYWtpbmcganNvbnAgcmVxdWVzdFwiXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdFx0Z2xvYmFsW2NhbGxiYWNrS2V5XSA9IHVuZGVmaW5lZFxyXG5cclxuXHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHR9XHJcblxyXG5cdFx0c2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHR9XHJcblxyXG5cdFx0c2NyaXB0LnNyYyA9IG9wdGlvbnMudXJsICtcclxuXHRcdFx0KG9wdGlvbnMudXJsLmluZGV4T2YoXCI/XCIpID4gMCA/IFwiJlwiIDogXCI/XCIpICtcclxuXHRcdFx0KG9wdGlvbnMuY2FsbGJhY2tLZXkgPyBvcHRpb25zLmNhbGxiYWNrS2V5IDogXCJjYWxsYmFja1wiKSArXHJcblx0XHRcdFwiPVwiICsgY2FsbGJhY2tLZXkgK1xyXG5cdFx0XHRcIiZcIiArIGJ1aWxkUXVlcnlTdHJpbmcob3B0aW9ucy5kYXRhIHx8IHt9KVxyXG5cclxuXHRcdCRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNjcmlwdClcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGNyZWF0ZVhocihvcHRpb25zKSB7XHJcblx0XHR2YXIgeGhyID0gbmV3IGdsb2JhbC5YTUxIdHRwUmVxdWVzdCgpXHJcblx0XHR4aHIub3BlbihvcHRpb25zLm1ldGhvZCwgb3B0aW9ucy51cmwsIHRydWUsIG9wdGlvbnMudXNlcixcclxuXHRcdFx0b3B0aW9ucy5wYXNzd29yZClcclxuXHJcblx0XHR4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcclxuXHRcdFx0XHRpZiAoeGhyLnN0YXR1cyA+PSAyMDAgJiYgeGhyLnN0YXR1cyA8IDMwMCkge1xyXG5cdFx0XHRcdFx0b3B0aW9ucy5vbmxvYWQoe3R5cGU6IFwibG9hZFwiLCB0YXJnZXQ6IHhocn0pXHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdG9wdGlvbnMub25lcnJvcih7dHlwZTogXCJlcnJvclwiLCB0YXJnZXQ6IHhocn0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKG9wdGlvbnMuc2VyaWFsaXplID09PSBKU09OLnN0cmluZ2lmeSAmJlxyXG5cdFx0XHRcdG9wdGlvbnMuZGF0YSAmJlxyXG5cdFx0XHRcdG9wdGlvbnMubWV0aG9kICE9PSBcIkdFVFwiKSB7XHJcblx0XHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsXHJcblx0XHRcdFx0XCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIpXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKG9wdGlvbnMuZGVzZXJpYWxpemUgPT09IEpTT04ucGFyc2UpIHtcclxuXHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoXCJBY2NlcHRcIiwgXCJhcHBsaWNhdGlvbi9qc29uLCB0ZXh0LypcIilcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoaXNGdW5jdGlvbihvcHRpb25zLmNvbmZpZykpIHtcclxuXHRcdFx0dmFyIG1heWJlWGhyID0gb3B0aW9ucy5jb25maWcoeGhyLCBvcHRpb25zKVxyXG5cdFx0XHRpZiAobWF5YmVYaHIgIT0gbnVsbCkgeGhyID0gbWF5YmVYaHJcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZGF0YSA9IG9wdGlvbnMubWV0aG9kID09PSBcIkdFVFwiIHx8ICFvcHRpb25zLmRhdGEgPyBcIlwiIDogb3B0aW9ucy5kYXRhXHJcblxyXG5cdFx0aWYgKGRhdGEgJiYgIWlzU3RyaW5nKGRhdGEpICYmIGRhdGEuY29uc3RydWN0b3IgIT09IGdsb2JhbC5Gb3JtRGF0YSkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJSZXF1ZXN0IGRhdGEgc2hvdWxkIGJlIGVpdGhlciBiZSBhIHN0cmluZyBvciBcIiArXHJcblx0XHRcdFx0XCJGb3JtRGF0YS4gQ2hlY2sgdGhlIGBzZXJpYWxpemVgIG9wdGlvbiBpbiBgbS5yZXF1ZXN0YFwiKVxyXG5cdFx0fVxyXG5cclxuXHRcdHhoci5zZW5kKGRhdGEpXHJcblx0XHRyZXR1cm4geGhyXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBhamF4KG9wdGlvbnMpIHtcclxuXHRcdGlmIChvcHRpb25zLmRhdGFUeXBlICYmIG9wdGlvbnMuZGF0YVR5cGUudG9Mb3dlckNhc2UoKSA9PT0gXCJqc29ucFwiKSB7XHJcblx0XHRcdHJldHVybiBoYW5kbGVKc29ucChvcHRpb25zKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIGNyZWF0ZVhocihvcHRpb25zKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYmluZERhdGEob3B0aW9ucywgZGF0YSwgc2VyaWFsaXplKSB7XHJcblx0XHRpZiAob3B0aW9ucy5tZXRob2QgPT09IFwiR0VUXCIgJiYgb3B0aW9ucy5kYXRhVHlwZSAhPT0gXCJqc29ucFwiKSB7XHJcblx0XHRcdHZhciBwcmVmaXggPSBvcHRpb25zLnVybC5pbmRleE9mKFwiP1wiKSA8IDAgPyBcIj9cIiA6IFwiJlwiXHJcblx0XHRcdHZhciBxdWVyeXN0cmluZyA9IGJ1aWxkUXVlcnlTdHJpbmcoZGF0YSlcclxuXHRcdFx0b3B0aW9ucy51cmwgKz0gKHF1ZXJ5c3RyaW5nID8gcHJlZml4ICsgcXVlcnlzdHJpbmcgOiBcIlwiKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0b3B0aW9ucy5kYXRhID0gc2VyaWFsaXplKGRhdGEpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBwYXJhbWV0ZXJpemVVcmwodXJsLCBkYXRhKSB7XHJcblx0XHRpZiAoZGF0YSkge1xyXG5cdFx0XHR1cmwgPSB1cmwucmVwbGFjZSgvOlthLXpdXFx3Ky9naSwgZnVuY3Rpb24odG9rZW4pe1xyXG5cdFx0XHRcdHZhciBrZXkgPSB0b2tlbi5zbGljZSgxKVxyXG5cdFx0XHRcdHZhciB2YWx1ZSA9IGRhdGFba2V5XVxyXG5cdFx0XHRcdGRlbGV0ZSBkYXRhW2tleV1cclxuXHRcdFx0XHRyZXR1cm4gdmFsdWVcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHRcdHJldHVybiB1cmxcclxuXHR9XHJcblxyXG5cdG0ucmVxdWVzdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblx0XHRpZiAob3B0aW9ucy5iYWNrZ3JvdW5kICE9PSB0cnVlKSBtLnN0YXJ0Q29tcHV0YXRpb24oKVxyXG5cdFx0dmFyIGRlZmVycmVkID0gbmV3IERlZmVycmVkKClcclxuXHRcdHZhciBpc0pTT05QID0gb3B0aW9ucy5kYXRhVHlwZSAmJlxyXG5cdFx0XHRvcHRpb25zLmRhdGFUeXBlLnRvTG93ZXJDYXNlKCkgPT09IFwianNvbnBcIlxyXG5cclxuXHRcdHZhciBzZXJpYWxpemUsIGRlc2VyaWFsaXplLCBleHRyYWN0XHJcblxyXG5cdFx0aWYgKGlzSlNPTlApIHtcclxuXHRcdFx0c2VyaWFsaXplID0gb3B0aW9ucy5zZXJpYWxpemUgPVxyXG5cdFx0XHRkZXNlcmlhbGl6ZSA9IG9wdGlvbnMuZGVzZXJpYWxpemUgPSBpZGVudGl0eVxyXG5cclxuXHRcdFx0ZXh0cmFjdCA9IGZ1bmN0aW9uIChqc29ucCkgeyByZXR1cm4ganNvbnAucmVzcG9uc2VUZXh0IH1cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHNlcmlhbGl6ZSA9IG9wdGlvbnMuc2VyaWFsaXplID0gb3B0aW9ucy5zZXJpYWxpemUgfHwgSlNPTi5zdHJpbmdpZnlcclxuXHJcblx0XHRcdGRlc2VyaWFsaXplID0gb3B0aW9ucy5kZXNlcmlhbGl6ZSA9XHJcblx0XHRcdFx0b3B0aW9ucy5kZXNlcmlhbGl6ZSB8fCBKU09OLnBhcnNlXHJcblx0XHRcdGV4dHJhY3QgPSBvcHRpb25zLmV4dHJhY3QgfHwgZnVuY3Rpb24gKHhocikge1xyXG5cdFx0XHRcdGlmICh4aHIucmVzcG9uc2VUZXh0Lmxlbmd0aCB8fCBkZXNlcmlhbGl6ZSAhPT0gSlNPTi5wYXJzZSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHhoci5yZXNwb25zZVRleHRcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0cmV0dXJuIG51bGxcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRvcHRpb25zLm1ldGhvZCA9IChvcHRpb25zLm1ldGhvZCB8fCBcIkdFVFwiKS50b1VwcGVyQ2FzZSgpXHJcblx0XHRvcHRpb25zLnVybCA9IHBhcmFtZXRlcml6ZVVybChvcHRpb25zLnVybCwgb3B0aW9ucy5kYXRhKVxyXG5cdFx0YmluZERhdGEob3B0aW9ucywgb3B0aW9ucy5kYXRhLCBzZXJpYWxpemUpXHJcblx0XHRvcHRpb25zLm9ubG9hZCA9IG9wdGlvbnMub25lcnJvciA9IGZ1bmN0aW9uIChldikge1xyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdGV2ID0gZXYgfHwgZXZlbnRcclxuXHRcdFx0XHR2YXIgcmVzcG9uc2UgPSBkZXNlcmlhbGl6ZShleHRyYWN0KGV2LnRhcmdldCwgb3B0aW9ucykpXHJcblx0XHRcdFx0aWYgKGV2LnR5cGUgPT09IFwibG9hZFwiKSB7XHJcblx0XHRcdFx0XHRpZiAob3B0aW9ucy51bndyYXBTdWNjZXNzKSB7XHJcblx0XHRcdFx0XHRcdHJlc3BvbnNlID0gb3B0aW9ucy51bndyYXBTdWNjZXNzKHJlc3BvbnNlLCBldi50YXJnZXQpXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0aWYgKGlzQXJyYXkocmVzcG9uc2UpICYmIG9wdGlvbnMudHlwZSkge1xyXG5cdFx0XHRcdFx0XHRmb3JFYWNoKHJlc3BvbnNlLCBmdW5jdGlvbiAocmVzLCBpKSB7XHJcblx0XHRcdFx0XHRcdFx0cmVzcG9uc2VbaV0gPSBuZXcgb3B0aW9ucy50eXBlKHJlcylcclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdH0gZWxzZSBpZiAob3B0aW9ucy50eXBlKSB7XHJcblx0XHRcdFx0XHRcdHJlc3BvbnNlID0gbmV3IG9wdGlvbnMudHlwZShyZXNwb25zZSlcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKHJlc3BvbnNlKVxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRpZiAob3B0aW9ucy51bndyYXBFcnJvcikge1xyXG5cdFx0XHRcdFx0XHRyZXNwb25zZSA9IG9wdGlvbnMudW53cmFwRXJyb3IocmVzcG9uc2UsIGV2LnRhcmdldClcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRkZWZlcnJlZC5yZWplY3QocmVzcG9uc2UpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGNhdGNoIChlKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KGUpXHJcblx0XHRcdH0gZmluYWxseSB7XHJcblx0XHRcdFx0aWYgKG9wdGlvbnMuYmFja2dyb3VuZCAhPT0gdHJ1ZSkgbS5lbmRDb21wdXRhdGlvbigpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRhamF4KG9wdGlvbnMpXHJcblx0XHRkZWZlcnJlZC5wcm9taXNlID0gcHJvcGlmeShkZWZlcnJlZC5wcm9taXNlLCBvcHRpb25zLmluaXRpYWxWYWx1ZSlcclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlXHJcblx0fVxyXG5cclxuXHRyZXR1cm4gbVxyXG59KVxyXG4iLCJcbi8qIFJFUVVJUkVTIFRIQVQgQ1JBQ0tFRCBCRSBJTkNMVURFRCBJTiBIRUFEIE9GIEhUTUwgKi9cblxudmFyIG0gPSByZXF1aXJlKCcuL21pdGhyaWwvbWl0aHJpbCcpO1xudmFyIFZpZXdzID0gcmVxdWlyZSgnLi92aWV3cy92aWV3cy5qcycpO1xudmFyIFQgPSByZXF1aXJlKCcuL3Rvb2xzLmpzJyk7XG52YXIgU1QgPSByZXF1aXJlKCcuL2F1ZGlvL3V0aWxzLmpzJyk7XG5cbnZhciBJTU9CSUxFID0gVC5hbnkoWy9pUGFkL2ksIC9pUG9kL2ksIC9pUGhvbmUvaV0sXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChwKSB7IHJldHVybiBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKHApICE9IG51bGw7IH0pO1xuXG52YXIgaW50ZXJydXB0ID0gZnVuY3Rpb24gKGN0bCkge1xuICByZXR1cm4gZnVuY3Rpb24gKGUpIHtcbiAgICBjb25zb2xlLmxvZyhcInVubG9hZCBpbnRlcnJ1cHRcIiwgZSk7XG4gICAgUm9vbS5xdWl0KGN0bC5yb29tKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ3Jvb21OYW1lJywgY3RsLnJvb20ubmFtZSgpKTtcbiAgICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgndXNlck5hbWUnLCBjdGwucm9vbS51c2VyKCkpO1xuXG4gICAgICAgIGN0bC5yZWNvbm5lY3QgPSBmYWxzZTtcbiAgICAgICAgY3RsLnNvY2tldCAmJiBjdGwuc29ja2V0LmNsb3NlKCk7XG4gICAgICAgIGN0bC5zb2NrZXQgPSBudWxsO1xuICAgICAgICBjcmFja2VkKCkubG9vcCgnc3RvcCcpO1xuICAgICAgICBjcmFja2VkKCcqJykuc3RvcCgpO1xuICAgICAgICBjdGwuaGFzU291bmQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdsb2cgb3V0IGVycm9yJywgZSk7XG4gICAgICAgIGN0bC5lcnJvcnMoKS5wdXNoKGUubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59O1xuXG52YXIgY3VzdG9tQmFjayA9IGZ1bmN0aW9uIChjdGwpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChlKSB7XG4gICAgY29uc29sZS5sb2coJ2N1c3RvbUJhY2snLGUpO1xuICAgIHZhciByb3V0ZSA9IG0ucm91dGUoKS5zcGxpdCgnLycpO1xuICAgIGNvbnNvbGUubG9nKHJvdXRlKTtcbiAgICBpbnRlcnJ1cHQoY3RsKShlKTtcbiAgICBpZiAocm91dGUuaW5kZXhPZigncGFuZG8nKSA8IHJvdXRlLmxlbmd0aCAtIDEpXG4gICAgICBtLnJvdXRlKHJvdXRlLnNsaWNlKDAsLTIpLmpvaW4oJy8nKSk7XG4gIH07XG59O1xuXG4vLyBTdHJ1Y3RzXG52YXIgQXBwID0gIHtcbiAgc29ja2V0OiBudWxsLFxuICByb29tOiBudWxsLFxuICByZWNvbm5lY3Q6IGZhbHNlLFxuICBoYXNTb3VuZDogZmFsc2UsXG4gIHNvdW5kQ2FsbGJhY2s6IG51bGwsXG4gIHNvdW5kUGFyYW1zOiBudWxsLFxuICBlcnJvcnM6IG0ucHJvcChbXSlcbn07XG5cbnZhciBSb29tID0gZnVuY3Rpb24gKHJvb21OYW1lLCB1c2VyTmFtZSkge1xuICB0aGlzLm5hbWUgPSBtLnByb3Aocm9vbU5hbWUgfHwgXCJcIik7XG4gIHRoaXMudXNlciA9IG0ucHJvcCh1c2VyTmFtZSB8fCBcIlwiKTtcbiAgdGhpcy5kaW1lbnNpb25zID0gbS5wcm9wKFtdKTtcbiAgdGhpcy5jb29yZCA9IG0ucHJvcChbXSk7XG4gIHRoaXMuZnJlcSA9IG0ucHJvcCgwKTtcbiAgdGhpcy5zb2NrZXQgPSBtLnByb3AobnVsbCk7XG4gIHRoaXMubWVzc2FnZXMgPSBtLnByb3AoW10pO1xuICB0aGlzLmN1cnJlbnRNZXNzYWdlID0gbS5wcm9wKFwiXCIpO1xuICB0aGlzLmVudHJ5U3RhcnQgPSBtLnByb3AobnVsbCk7XG59O1xuXG52YXIgUm9vbUxpc3QgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5kYXRhID0gbS5yZXF1ZXN0KHsgbWV0aG9kOiBcIkdFVFwiLCB1cmw6IFwiL3BhbmRvL2FwaS9yb29tcy9saXN0XCIgfSkuXG4gICAgdGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY291bnQ6IGRhdGEucm9vbUNvdW50LFxuICAgICAgICBsaXN0OiBkYXRhLnJvb21zXG4gICAgICB9O1xuICAgIH0pO1xufTtcblxudmFyIFBhcnRpY2lwYW50UGFyYW1zID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLl9tYXhJbnRlcnZhbCA9IDE1MDAwO1xuICB0aGlzLl9taW5JbnRlcnZhbCA9IDEwMDtcbiAgdGhpcy5fbWF4RGVsYXkgPSA1O1xuICB0aGlzLl9taW5EZWxheSA9IDAuMTtcbiAgdGhpcy5fbWF4RGVjYXkgPSAwLjI1O1xuICB0aGlzLl9taW5EZWNheSA9IDAuMDEyNTtcbiAgdGhpcy5fbWF4RW50cm9weSA9IDEuMDtcbiAgdGhpcy5fbWluRW50cm9weSA9IDAuMDtcbiAgdGhpcy5fZW50cm9weURlY2F5UmF0ZSA9IE1hdGgucmFuZG9tKCkgKiAwLjA4O1xuICB0aGlzLl9lbnRyb3B5ID0gMC41O1xuXG4gIHRoaXMuX2ludGVydmFsID0gdGhpcy5fbWluSW50ZXJ2YWw7XG4gIHRoaXMuX2RlbGF5ID0gdGhpcy5fbWluRGVsYXk7XG4gIHRoaXMuX2RlY2F5ID0gdGhpcy5fbWluRGVjYXk7XG5cbiAgLy8gZW50cm9weSBncmFkdWFsbHkgbGVzc2Vuc1xuICB0aGlzLmVudHJvcHkgPSBmdW5jdGlvbiAoYW10KSB7XG4gICAgcmV0dXJuIHR5cGVvZiBhbXQgPT09ICd1bmRlZmluZWQnID8gdGhpcy5nZXRFbnRyb3B5KCkgOiB0aGlzLnNldEVudHJvcHkoYW10KTtcbiAgfTtcbiAgXG4gIHRoaXMuZ2V0RW50cm9weSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgb3V0ID0gTWF0aC5jZWlsKChNYXRoLnJhbmRvbSgpIC0gMS4wKSArIHRoaXMuX2VudHJvcHkpOyAgICBcbiAgICB0aGlzLl9lbnRyb3B5ICo9IDEuMCAtIHRoaXMuX2VudHJvcHlEZWNheVJhdGU7XG4gICAgaWYgKHRoaXMuX2VudHJvcHkgPCB0aGlzLl9taW5FbnRyb3B5KSB0aGlzLl9lbnRyb3B5ID0gdGhpcy5fbWluRW50cm9weTtcbiAgICByZXR1cm4gb3V0O1xuICB9O1xuXG4gIHRoaXMuc2V0RW50cm9weSA9IGZ1bmN0aW9uIChhbXQpIHtcbiAgICB0aGlzLl9lbnRyb3B5ID0gYW10ID4gdGhpcy5fbWF4RW50cm9weSA/IHRoaXMuX21heEVudHJvcHkgOiBhbXQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgdGhpcy5pbnRlcnZhbCA9IGZ1bmN0aW9uIChuZXdJbnRlcnZhbCkge1xuICAgIHJldHVybiB0eXBlb2YgbmV3SW50ZXJ2YWwgPT09ICd1bmRlZmluZWQnID8gdGhpcy5nZXRJbnRlcnZhbCgpIDogdGhpcy5zZXRJbnRlcnZhbChuZXdJbnRlcnZhbCk7XG4gIH07XG5cbiAgLy8gaW50ZXJ2YWwgZ3JhZHVhbGx5IGxlbmd0aGVuc1xuICB0aGlzLmdldEludGVydmFsID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2ludGVydmFsID0gdGhpcy5faW50ZXJ2YWwgKiAxLjEgPiB0aGlzLl9tYXhJbnRlcnZhbCA/IHRoaXMuX21heEludGVydmFsIDogdGhpcy5faW50ZXJ2YWwgKiAxLjE7XG4gICAgcmV0dXJuIHRoaXMuX2ludGVydmFsOyAgICBcbiAgfTtcblxuICB0aGlzLnNldEludGVydmFsID0gZnVuY3Rpb24gKGFtdCkge1xuICAgIGlmIChhbXQgPiB0aGlzLl9tYXhJbnRlcnZhbCkgdGhpcy5faW50ZXJ2YWwgPSB0aGlzLl9tYXhJbnRlcnZhbDtcbiAgICBlbHNlIGlmIChhbXQgPCB0aGlzLl9taW5JbnRlcnZhbCkgdGhpcy5faW50ZXJ2YWwgPSB0aGlzLl9taW5JbnRlcnZhbDtcbiAgICBlbHNlIHRoaXMuX2ludGVydmFsID0gYW10O1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIHRoaXMuZGVsYXkgPSBmdW5jdGlvbiAobmV3RGVsYXkpIHtcbiAgICByZXR1cm4gdHlwZW9mIG5ld0RlbGF5ID09PSAndW5kZWZpbmVkJyA/IHRoaXMuZ2V0RGVsYXkoKSA6IHRoaXMuc2V0RGVsYXkobmV3RGVsYXkpO1xuICB9O1xuXG4gIC8vIGRlbGF5IGdyYWR1YWxseSBsZW5ndGhlbnNcbiAgdGhpcy5nZXREZWxheSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9kZWxheSA9IHRoaXMuX2RlbGF5ICogMS4xID4gdGhpcy5fbWF4RGVsYXkgPyB0aGlzLl9tYXhEZWxheSA6IHRoaXMuX2RlbGF5ICogMS4xO1xuICAgIHJldHVybiB0aGlzLl9kZWxheTtcbiAgfTtcblxuICB0aGlzLnNldERlbGF5ID0gZnVuY3Rpb24gKGFtdCkge1xuICAgIGlmIChhbXQgPiB0aGlzLl9tYXhEZWxheSkgdGhpcy5fZGVsYXkgPSB0aGlzLl9tYXhEZWxheTtcbiAgICBlbHNlIGlmIChhbXQgPCB0aGlzLl9taW5EZWxheSkgdGhpcy5fZGVsYXkgPSB0aGlzLl9taW5EZWxheTtcbiAgICBlbHNlIHRoaXMuX2RlbGF5ID0gYW10O1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuICBcbiAgdGhpcy5kZWNheSA9IGZ1bmN0aW9uIChuZXdEZWNheSkge1xuICAgIHJldHVybiB0eXBlb2YgbmV3RGVjYXkgPT09ICd1bmRlZmluZWQnID8gdGhpcy5nZXREZWNheSgpIDogdGhpcy5zZXREZWNheShuZXdEZWNheSk7XG4gIH07XG5cbiAgdGhpcy5zZXREZWNheSA9IGZ1bmN0aW9uIChhbXQpIHtcbiAgICBpZiAoYW10ID4gdGhpcy5fbWF4RGVjYXkpIHRoaXMuX2RlY2F5ID0gdGhpcy5fbWF4RGVjYXk7XG4gICAgZWxzZSBpZiAoYW10IDwgdGhpcy5fbWluRGVjYXkpIHRoaXMuX2RlY2F5ID0gdGhpcy5fbWluRGVjYXk7XG4gICAgZWxzZSB0aGlzLl9kZWNheSA9IGFtdDtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBkZWNheSBncmFkdWFsbHkgbGVuZ3RoZW5zXG4gIHRoaXMuZ2V0RGVjYXkgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fZGVjYXkgPSB0aGlzLl9kZWNheSAqIDEuMDEgPiB0aGlzLl9tYXhEZWNheSA/IHRoaXMuX21heERlY2F5IDogdGhpcy5fZGVjYXkgKiAxLjAxO1xuICAgIHJldHVybiB0aGlzLl9kZWNheTtcbiAgfTtcbn07XG5cbnZhciB3aGVuVXNlclZhbGlkID0gZnVuY3Rpb24gKHJvb20sIHN1Y2Nlc3MpIHtcbiAgaWYgKHJvb20ubmFtZSgpID09IFwiXCIgfHwgcm9vbS51c2VyKCkgPT0gXCJcIikge1xuICAgIEFwcC5lcnJvcnMoKS5wdXNoKFwiUGxlYXNlIHByb3ZpZGUgYm90aCBhIHJvb20gbmFtZSBhbmQgYSB1c2VyIG5hbWVcIik7XG4gIH1cbiAgZWxzZSBzdWNjZXNzKCk7XG59O1xuXG52YXIgd2hlbk9ic2VydmVyVmFsaWQgPSBmdW5jdGlvbiAocm9vbSwgcm9vbUxpc3QsIHN1Y2Nlc3MpIHtcbiAgdmFyIHJvb21Qb3B1bGF0ZWQgPSAhcm9vbUxpc3QuZGF0YSgpLmxpc3Quc29tZShmdW5jdGlvbiAodikgeyByZXR1cm4gdi5yb29tTmFtZSA9PSByb29tLm5hbWUoKTsgfSk7XG4gIGlmIChyb29tLnVzZXIoKSA9PSBcIm9ic2VydmVyXCIgJiYgcm9vbVBvcHVsYXRlZCkge1xuICAgIEFwcC5lcnJvcnMoKS5wdXNoKFwiWW91IGNhbiBvbmx5IG9ic2VydmUgYSByb29tIHdpdGggYXQgbGVhc3Qgb25lIG1lbWJlclwiKTtcbiAgfVxuICBlbHNlIHN1Y2Nlc3MoKTtcbn07XG5cbi8vIEFVRElPXG52YXIgcmVzZXRBcHBTb3VuZCA9IGZ1bmN0aW9uIChhcHApIHtcbiAgVC53aGVuKGFwcC5raWxsU291bmRDYWxsYmFjaywgYXBwLmtpbGxTb3VuZENhbGxiYWNrKTtcbiAgYXBwLmhhc1NvdW5kID0gZmFsc2U7XG4gIGFwcC5zb3VuZENhbGxiYWNrID0gbnVsbDtcbiAgYXBwLmtpbGxTb3VuZENhbGxiYWNrID0gbnVsbDtcbiAgYXBwLmZyZXEgPSAwO1xufTtcblxudmFyIHBhcnRpY2lwYW50Q2FsbGJhY2sgPSBmdW5jdGlvbiAoZGF0KSB7XG4gIFQud2hlbihkYXQubmV3Um9vdCwgZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKCdwYXJ0IGNhbGxiYWNrJyxkYXQudXNlck5hbWUsIEFwcC5yb29tLnVzZXIoKSk7XG4gICAgaWYgKGRhdC51c2VyTmFtZSAhPSBBcHAucm9vbS51c2VyKCkgJiYgQXBwLnNvdW5kICE9PSBudWxsKSB7XG4gICAgICBBcHAucm9vbS5mcmVxKFNULmNvb3JkVG9GcmVxdWVuY3koZGF0Lm5ld1Jvb3QsIEFwcC5yb29tLmRpbWVuc2lvbnMoKSwgQXBwLnJvb20uY29vcmQoKSkpO1xuICAgICAgY3JhY2tlZCgnbm9pc2VDaGFpbicpLmZyZXF1ZW5jeShBcHAucm9vbS5mcmVxKCkpO1xuICAgICAgY3JhY2tlZC5sb29wKCdzdG9wJykubG9vcCh7c3RlcHM6MixpbnRlcnZhbDpBcHAuc291bmRQYXJhbXMuaW50ZXJ2YWwoKX0pLmxvb3AoJ3N0YXJ0Jyk7XG4gICAgfTtcbiAgfSk7XG59O1xuXG52YXIgcGFydGljaXBhbnRLaWxsID0gZnVuY3Rpb24gKCkge1xuICBjcmFja2VkKCcqJykuc3RvcCgpO1xufTtcblxudmFyIG9ic2VydmVyQ2FsbGJhY2sgPSBmdW5jdGlvbiAoZGF0KSB7XG4gIGNvbnNvbGUubG9nKGRhdCk7XG4gIEFwcC5yb29tLmZyZXEoZGF0Lm5ld1Jvb3QpO1xuICBpZiAoZGF0LnVzZXJOYW1lICE9IEFwcC5yb29tLm5hbWUoKSkge1xuICAgIGNyYWNrZWQoXCIjXCIrZGF0LnVzZXJOYW1lKS5cbiAgICAgIGZyZXF1ZW5jeShTVC5jb29yZFRvRnJlcXVlbmN5KEFwcC5yb29tLmZyZXEoKSwgQXBwLnJvb20uZGltZW5zaW9ucygpLCBkYXQuY29vcmQpKTtcbiAgfVxufTtcblxudmFyIG9ic2VydmVyS2lsbCA9IGZ1bmN0aW9uICgpIHtcbiAgY3JhY2tlZCgnKicpLnN0b3AoKTtcbn07XG5cbmNyYWNrZWQucGFydGljaXBhbnRDaGFpbiA9IGZ1bmN0aW9uIChvcHRzKSB7XG4gIGNyYWNrZWQoKS5iZWdpbihcInBhcnRpY2lwYW50XCIpLnNpbmUoMCkuZW5kKFwicGFydGljaXBhbnRcIik7XG4gICAgICBcbiAgcmV0dXJuIGNyYWNrZWQ7XG59O1xuXG5jcmFja2VkLm9ic2VydmVyQ2hhaW4gPSBmdW5jdGlvbiAoaWQsIGZyZXEsIGdhaW4pIHtcbiAgY3JhY2tlZCgpLlxuICAgIGJlZ2luKFwib2JzZXJ2ZXJcIiwgeydpZCc6IGlkfSkuXG4gICAgc2luZSh7J2lkJzogaWQrJ29ic2VydmVyU2luZScsICdmcmVxdWVuY3knOiBmcmVxfSkuXG4gICAgZ2Fpbih7J2lkJzogaWQrJ29ic2VydmVyR2FpbicsICdnYWluJzogZ2Fpbn0pLlxuICAgIGVuZChcIm9ic2VydmVyXCIpO1xuICByZXR1cm4gY3JhY2tlZDtcbn07XG5cbi8vIFJPT00gTU9ERUxcblJvb20uY29ubmVjdCA9IGZ1bmN0aW9uIChyb29tLCBkZXN0aW5hdGlvbikge1xuICB2YXIgc29ja2V0QWRkciA9ICd3czovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdCArICcvcGFuZG8vYXBpL2Nvbm5lY3QvJyArIHJvb20ubmFtZSgpICsgJy8nICsgcm9vbS51c2VyKCk7XG5cbiAgQXBwLnNvY2tldCA9ICFBcHAuc29ja2V0ID8gbmV3IFdlYlNvY2tldChzb2NrZXRBZGRyKSA6IEFwcC5zb2NrZXQ7XG4gIGNvbnNvbGUubG9nKCdjb25uZWN0JywgQXBwLnNvY2tldCk7XG4gIEFwcC5zb2NrZXQub25lcnJvciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgQXBwLnNvY2tldC5jbG9zZSgpO1xuICAgIEFwcC5zb2NrZXQgPSBudWxsO1xuICAgIGNvbnNvbGUubG9nKFwiZXJyb3I6XCIsIGUpO1xuICAgIEFwcC5lcnJvcnMoKS5wdXNoKCdUaGUgdXNlciBuYW1lIDwnK0FwcC5yb29tLnVzZXIoKSsnPiBpcyB0YWtlbiwgcGxlYXNlIGNob29zZSBhIGRpZmZlcmVudCB1c2VyIG5hbWUuJyk7ICAgIFxuICAgIG0ucm91dGUoJy9wYW5kby8nK3Jvb20ubmFtZSgpKTtcbiAgfTtcblxuICBBcHAuc29ja2V0Lm9uY2xvc2UgPSBmdW5jdGlvbiAoZSkge1xuICAgIGNvbnNvbGUubG9nKFwiY2xvc2luZyBzb2NrZXRcIiwgZSk7XG4gICAgLy9BcHAuc29ja2V0ID0gbnVsbDtcbiAgfTtcbiAgXG4gIEFwcC5zb2NrZXQub25vcGVuID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoQXBwLnNvY2tldFRpbWVvdXQgIT09IG51bGwgJiYgdHlwZW9mIEFwcC5zb2NrZXRUaW1lb3V0ICE9PSAndW5kZWZpbmVkJyApXG4gICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KEFwcC5zb2NrZXRUaW1lb3V0KTtcbiAgICBBcHAuc29ja2V0VGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KFJvb20ucGluZyhBcHApLCA1MDAwKTtcbiAgICBjb25zb2xlLmxvZyhcInNvY2tldCBvcGVuZWRcIik7XG5cbiAgICAvLyBtb3ZlIHVzIHRvIHRoZSByb29tIGlmIHdlIGxvZ2dlZCBpbiB2aWEgdGhlIGxhbmRpbmcgcGFnZVxuICAgIGNvbnNvbGUubG9nKCdvbm9wZW4nLCBBcHAucm9vbS5uYW1lKCksIEFwcC5yb29tLnVzZXIoKSk7XG4gICAgLy9tLnJvdXRlKCcvcGFuZG8vJytBcHAucm9vbS5uYW1lKCkrJy8nK0FwcC5yb29tLnVzZXIoKSk7XG4gICAgICAgIFxuICAgIEFwcC5zb2NrZXQub25tZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgIHZhciBtZXNzYWdlcywgZGF0ID0gSlNPTi5wYXJzZShtZXNzYWdlLmRhdGEpO1xuXG4gICAgICBpZiAoZGF0LnR5cGUgIT0gJ3BpbmcnKVxuICAgICAgICBBcHAucm9vbS5tZXNzYWdlcygpLnB1c2goZGF0KTtcbiAgICAgIGNvbnNvbGUubG9nKCdyZWNlaXZlZCB0eXBlJywgZGF0LnR5cGUpO1xuICAgICAgbS5yZWRyYXcoKTtcbiAgICAgIFxuICAgICAgbWVzc2FnZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1lc3NhZ2VzXCIpO1xuICAgICAgbWVzc2FnZXMuc2Nyb2xsVG9wID0gbWVzc2FnZXMuc2Nyb2xsSGVpZ2h0O1xuICAgICAgVC53aGVuKEFwcC5zb3VuZENhbGxiYWNrLCBmdW5jdGlvbiAoKSB7IEFwcC5zb3VuZENhbGxiYWNrKGRhdCk7IH0pO1xuICAgICAgY29uc29sZS5sb2coJ2VuZCBvbm1lc3NhZ2UnKTtcbiAgICB9O1xuICAgIGNvbnNvbGUubG9nKCdvbiBvcGVuIGNvbXBsZXRlJyk7XG4gICAgY29uc29sZS5sb2coZGVzdGluYXRpb24pO1xuICAgIG0ucm91dGUoZGVzdGluYXRpb24pO1xuICB9O1xufTtcblxuUm9vbS5xdWl0ID0gZnVuY3Rpb24gKHJvb20pIHtcbiAgcmV0dXJuIG0ucmVxdWVzdCh7IG1ldGhvZDogXCJERUxFVEVcIixcbiAgICAgICAgICAgICAgICAgICAgIHVybDogXCIvcGFuZG8vYXBpL3F1aXRcIixcbiAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgXCJ1c2VyLW5hbWVcIjogcm9vbS51c2VyKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicm9vbS1uYW1lXCI6IHJvb20ubmFtZSgpIH19KS5cbiAgICB0aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwic3VjY2Vzc2Z1bGx5IGxvZ2dlZCBvdXRcIik7XG4gICAgICBBcHAuc29ja2V0ID0gbnVsbDtcbiAgICAgIEFwcC5yb29tID0gbnVsbDtcbiAgICAgIG0ucm91dGUobS5yb3V0ZSgpLnNwbGl0KCcvJykuc2xpY2UoMCwtMSkuam9pbignLycpKTtcbiAgICAgIG0ucmVkcmF3KCk7XG4gICAgfSkuXG4gICAgY2F0Y2goZnVuY3Rpb24gKGUpIHsgY29uc29sZS5sb2coXCJsb2cgb3V0IGVycm9yOlwiLCBlLm1lc3NhZ2UpOyB9KTtcbn07XG5cblJvb20uc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbiAoYXBwKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1lc3NhZ2UgPSBhcHAucm9vbS5jdXJyZW50TWVzc2FnZSgpO1xuICAgIGlmIChtZXNzYWdlLmxlbmd0aCA+IDApIHtcbiAgICAgIHZhciBlbnRyeUR1cmF0aW9uID0gKERhdGUubm93KCkgLSBhcHAucm9vbS5lbnRyeVN0YXJ0KCkpICogMC4wMDAwMDAwMDAwMixcbiAgICAgICAgICBlbnRyeUF2ZyA9IG1lc3NhZ2Uuc3BsaXQoXCJcIikubGVuZ3RoIC8gZW50cnlEdXJhdGlvbixcbiAgICAgICAgICBvdXQgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJtZXNzYWdlXCIsXG4gICAgICAgICAgICBcIm1lc3NhZ2VcIjogbWVzc2FnZSxcbiAgICAgICAgICAgIFwidXNlck5hbWVcIjogYXBwLnJvb20udXNlcixcbiAgICAgICAgICAgIFwicm9vbU5hbWVcIjogYXBwLnJvb20ubmFtZSxcbiAgICAgICAgICAgIFwiZnJlcXVlbmN5XCI6IDAsXG4gICAgICAgICAgICBcImNvb3JkXCI6IGFwcC5yb29tLmNvb3JkXG4gICAgICAgICAgfSk7XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKCdtZXNzYWdlIG91dCcsIG91dCk7XG4gICAgICBhcHAuc29ja2V0LnNlbmQob3V0KTtcbiAgICAgIGFwcC5zb3VuZFBhcmFtcy5lbnRyb3B5KGVudHJ5QXZnKTtcbiAgICAgIGFwcC5zb3VuZFBhcmFtcy5pbnRlcnZhbChlbnRyeUF2Zyk7XG4gICAgICBhcHAuc291bmRQYXJhbXMuZGVjYXkoMCk7XG4gICAgICBhcHAuc291bmRQYXJhbXMuZGVsYXkoMCk7XG4gICAgICBjcmFja2VkLmxvb3AoJ3N0b3AnKS5cbiAgICAgICAgbG9vcCh7c3RlcHM6MixpbnRlcnZhbDphcHAuc291bmRQYXJhbXMuaW50ZXJ2YWwoKX0pLlxuICAgICAgICBsb29wKCdzdGFydCcpO1xuICAgICAgY29uc29sZS5sb2coZW50cnlBdmcpO1xuICAgICAgY29uc29sZS5sb2coYXBwLnNvdW5kUGFyYW1zKTtcbiAgICAgIGFwcC5yb29tLmN1cnJlbnRNZXNzYWdlKFwiXCIpO1xuICAgICAgYXBwLnJvb20uZW50cnlTdGFydChudWxsKTtcbiAgICB9O1xuICB9O1xufTtcblxuUm9vbS5waW5nID0gZnVuY3Rpb24gKGFwcCkge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGlmIChhcHAuc29ja2V0KSB7XG4gICAgICBjb25zb2xlLmxvZyhcInBpbmdcIik7XG4gICAgICB2YXIgb3V0ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBcInR5cGVcIjogXCJwaW5nXCIsXG4gICAgICAgIFwidXNlck5hbWVcIjogYXBwLnJvb20udXNlcixcbiAgICAgICAgXCJyb29tTmFtZVwiOiBhcHAucm9vbS5uYW1lICAgICAgXG4gICAgICB9KTtcbiAgICAgIGFwcC5zb2NrZXQuc2VuZChvdXQpOyAgICBcbiAgICAgIGFwcC5zb2NrZXRUaW1lb3V0ID0gIHdpbmRvdy5zZXRUaW1lb3V0KFJvb20ucGluZyhhcHApLCA1MDAwKTtcbiAgICB9XG4gIH07XG59O1xuXG5jcmFja2VkLm5vaXNlQ2hhaW4gPSBmdW5jdGlvbiAob3B0cykge1xuICBjcmFja2VkLmJlZ2luKCdub2lzZUNoYWluJykuXG4gICAgc2luZSh7aWQ6b3B0cy5pZCxmcmVxdWVuY3k6b3B0cy5mcmVxdWVuY3l9KS5cbiAgICBnYWluKHsnZ2Fpbic6b3B0cy5nYWlufSkuXG4gICAgZW5kKCdub2lzZUNoYWluJyk7XG4gIHJldHVybiBjcmFja2VkO1xufTtcblxuUm9vbS5wYXJ0aWNpcGFudFNvdW5kU2V0dXAgPSBmdW5jdGlvbiAoYXBwKSB7XG4gIFxuICBhcHAuc291bmRQYXJhbXMgPSBuZXcgUGFydGljaXBhbnRQYXJhbXMoKTtcbiAgXG4gIGNyYWNrZWQoKS5cbiAgICBub2lzZUNoYWluKHtpZDoncGFydGljaXBhbnQnLGZyZXF1ZW5jeTowLHE6MjAwLGdhaW46MC40fSkuXG4gICAgYWRzcih7aWQ6J25vdGVzJ30pLlxuICAgIGdhaW4oe2lkOidtYXN0ZXInLCBnYWluOjB9KS5cbiAgICBkYWMoKTtcbiAgY3JhY2tlZCgnI25vdGVzJykuXG4gICAgY29tYih7aWQ6J21hc3RlckRlbGF5JyxkZWxheTogYXBwLnNvdW5kUGFyYW1zLmRlbGF5KCl9KS5cbiAgICBjb25uZWN0KCcjbWFzdGVyJyk7XG4gIGNyYWNrZWQoJyonKS5zdGFydCgpO1xuICBcbiAgY3JhY2tlZC5sb29wKHtzdGVwczoyLGludGVydmFsOmFwcC5zb3VuZFBhcmFtcy5pbnRlcnZhbCgpfSk7XG4gIGNyYWNrZWQoXCJzaW5lLGFkc3JcIikuYmluZChcInN0ZXBcIiwgZnVuY3Rpb24gKGluZGV4LCBkYXRhLCBhcnJheSkge1xuICAgIHZhciBmcmVxLFxuICAgICAgICBlbnYgPSBbMC4wMTI1LGFwcC5zb3VuZFBhcmFtcy5kZWNheSgpLDAuMSwwLjFdO1xuXG4gICAgLy8gYWRqdXN0IGZyZXF1ZW5jeVxuICAgIGlmIChhcHAuc291bmRQYXJhbXMuZW50cm9weSgpKSB7XG4gICAgICBmcmVxID0gU1QuY29vcmRUb0ZyZXF1ZW5jeShhcHAucm9vbS5mcmVxKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHAucm9vbS5kaW1lbnNpb25zKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHAucm9vbS5jb29yZCgpLm1hcChmdW5jdGlvbiAoYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYyArIGNyYWNrZWQucmFuZG9tKC0zLDMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGZyZXEgPSBhcHAucm9vbS5mcmVxKCk7XG4gICAgfSAgICBcbiAgICBjcmFja2VkKCdub2lzZUNoYWluJykuZnJlcXVlbmN5KGZyZXEpO1xuXG4gICAgLy8gYWRqdXN0IGRlbGF5XG4gICAgY3JhY2tlZCgnI21hc3RlckRlbGF5JykuYXR0cih7ZGVsYXk6IGFwcC5zb3VuZFBhcmFtcy5kZWxheSgpfSk7XG4gICAgY3JhY2tlZCgnI25vdGVzJykuYWRzcigndHJpZ2dlcicsZW52KTtcblxuICAgIC8vIGFkanVzdCBpbnRlcnZhbFxuICAgIGNyYWNrZWQubG9vcCgnc3RvcCcpLmxvb3Aoe3N0ZXBzOjIsaW50ZXJ2YWw6YXBwLnNvdW5kUGFyYW1zLmludGVydmFsKCl9KS5sb29wKCdzdGFydCcpO1xuICB9LCBbMSwwXSk7XG5cbiAgcmV0dXJuIG0ucmVxdWVzdCh7IG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgICAgICAgICAgIHVybDogXCIvcGFuZG8vYXBpL3Jvb21zL2luZm8vXCIrYXBwLnJvb20ubmFtZSgpK1wiL1wiK2FwcC5yb29tLnVzZXIoKSB9KS5cbiAgICB0aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICBjb25zb2xlLmxvZyhcImluZm8gcmVzcG9uc2VcIixyZXNwKTtcbiAgICAgIGlmICghYXBwLmhhc1NvdW5kKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdmFyIGZyZXEgPSBTVC5jb29yZFRvRnJlcXVlbmN5KHJlc3AuZnVuZGFtZW50YWwsIHJlc3AuZGltZW5zaW9ucywgcmVzcC5jb29yZCk7XG4gICAgICAgICAgY3JhY2tlZChcIiNwYXJ0aWNpcGFudFwiKS5mcmVxdWVuY3koZnJlcSk7XG4gICAgICAgICAgY3JhY2tlZCgnI21hc3RlcicpLnJhbXAoMC41LDAuMSwnZ2FpbicsMC4wKTtcbiAgICAgICAgICBjcmFja2VkLmxvb3AoXCJzdGFydFwiKTtcbiAgICAgICAgICBcbiAgICAgICAgICBhcHAuc291bmRDYWxsYmFjayA9IHBhcnRpY2lwYW50Q2FsbGJhY2s7XG4gICAgICAgICAgYXBwLmtpbGxTb3VuZENhbGxiYWNrID0gcGFydGljaXBhbnRLaWxsO1xuICAgICAgICAgIGFwcC5oYXNTb3VuZCA9IHRydWU7XG4gICAgICAgICAgYXBwLnJvb20uZnJlcShmcmVxKTtcbiAgICAgICAgICBhcHAucm9vbS5kaW1lbnNpb25zKHJlc3AuZGltZW5zaW9ucyk7XG4gICAgICAgICAgYXBwLnJvb20uY29vcmQocmVzcC5jb29yZCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnc291bmQgY3JlYXRpb24gZXJyb3InLCBlKTsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgIGFwcC5lcnJvcnMoKS5wdXNoKGUubWVzc2FnZSk7XG4gICAgICAgICAgcmVzZXRBcHBTb3VuZChBcHApO1xuICAgICAgICAgIG0ucm91dGUoXCIvcGFuZG9cIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbn07XG5cblJvb20ub2JzZXJ2ZXJTb3VuZFNldHVwID0gZnVuY3Rpb24gKGFwcCkge1xuXG4gIGNyYWNrZWQoJyonKS5zdGFydCgpO1xuICBcbiAgcmV0dXJuIG0ucmVxdWVzdCh7IG1ldGhvZDpcIkdFVFwiLFxuICAgICAgICAgICAgICAgICAgICAgdXJsOiBcIi9wYW5kby9hcGkvcm9vbXMvaW5mby91c2Vycy9cIithcHAucm9vbS5uYW1lKCl9KS5cbiAgICB0aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICB2YXIgZnJlcTtcbiAgICAgIGZvciAodmFyIHVzZXIgaW4gcmVzcC51c2Vycykge1xuICAgICAgICBmcmVxID0gU1QuY29vcmRUb0ZyZXF1ZW5jeShyZXNwLnJvb3QsIHJlc3AuZGltZW5zaW9ucywgcmVzcC51c2Vyc1t1c2VyXS5jb29yZCk7XG4gICAgICAgIGNyYWNrZWQoKS5vYnNlcnZlckNoYWluKHVzZXIsIGZyZXEsIDAuMykuZGFjKCk7XG4gICAgICAgIGNyYWNrZWQoXCJvYnNlcnZlclwiKS5zdGFydCgpO1xuICAgICAgfVxuICAgICAgYXBwLnNvdW5kQ2FsbGJhY2sgPSBvYnNlcnZlckNhbGxiYWNrO1xuICAgICAgYXBwLmtpbGxTb3VuZENhbGxiYWNrID0gb2JzZXJ2ZXJLaWxsO1xuICAgICAgYXBwLmhhc1NvdW5kID0gdHJ1ZTtcbiAgICAgIGFwcC5yb29tLmZyZXEocmVzcC5yb290KTtcbiAgICAgIGFwcC5yb29tLmRpbWVuc2lvbnMocmVzcC5kaW1lbnNpb25zKTtcbiAgICAgIGFwcC5yb29tLmNvb3JkKFswLDBdKTtcbiAgICAgIGNvbnNvbGUubG9nKFwib2JzZXJ2ZXIgcmVzcG9uc2VcIiwgcmVzcCk7XG4gICAgfSkuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwib2JzZXJ2ZXJ4IGVycm9yXCIsIGUpO1xuICAgIH0pO1xufTtcblxuUm9vbS5mZXRjaCA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIGlmIChtLnJvdXRlLnBhcmFtKGl0ZW0pICE9ICcnKVxuICAgIHJldHVybiBtLnJvdXRlLnBhcmFtKGl0ZW0pOyAgXG4gIGVsc2UgaWYgKHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oaXRlbSkpXG4gICAgcmV0dXJuIHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oaXRlbSk7XG4gIGVsc2VcbiAgICByZXR1cm4gbnVsbDtcbn07XG5cbi8vIFZJRVdTXG5Sb29tLmNvbnZlcnNhdGlvbiA9IHtcbiAgY29udHJvbGxlcjogZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKCdjb252byBjb250cm9sbGVyIHRvcCcpO1xuICAgIHZhciBib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJib2R5XCIpWzBdLFxuICAgICAgICByb29tTmFtZSA9IFJvb20uZmV0Y2goJ3Jvb21OYW1lJyksXG4gICAgICAgIHVzZXJOYW1lID0gUm9vbS5mZXRjaCgndXNlck5hbWUnKTtcbiAgICBzZXNzaW9uU3RvcmFnZS5jbGVhcigpO1xuICAgIFxuICAgIEFwcC5yb29tID0gbmV3IFJvb20ocm9vbU5hbWUsIHVzZXJOYW1lKTsgICBcbiAgICBib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJhdXRvX2hlaWdodFwiKTtcbiAgICBib2R5LmNsYXNzTGlzdC5hZGQoXCJmdWxsX2hlaWdodFwiKTtcblxuICAgIC8vIHN0b3JlIGRhdGEgaWYgdGhlIHBhZ2UgcmVmcmVzaGVzIGFuZCBhbGxvdyByZWNvbm5lY3RcbiAgICBpZiAoSU1PQklMRSlcbiAgICAgIHdpbmRvdy5vbnBhZ2VoaWRlID0gaW50ZXJydXB0KEFwcCk7XG4gICAgZWxzZVxuICAgICAgd2luZG93Lm9uYmVmb3JldW5sb2FkID0gaW50ZXJydXB0KEFwcCk7XG5cbiAgICAvLyBoYW5kbGUgYmFjayBidXR0b24gbmF2aWdhdGlvbiBhcyBhIGxvZyBvdXRcbiAgICB3aW5kb3cub25wb3BzdGF0ZSA9IGN1c3RvbUJhY2soQXBwKTtcbiAgICBcbiAgICBpZiAoIUFwcC5zb2NrZXQpIHtcbiAgICAgICBjb25zb2xlLmxvZygnY29ubmVjdGluZyBmcm9tIGNvbnZlcnNhdGlvbicsIEFwcC5zb2NrZXQpO1xuICAgICAgIFJvb20uY29ubmVjdChBcHAucm9vbSk7XG4gICAgfVxuICB9LFxuXG4gIHZpZXc6IGZ1bmN0aW9uIChjdGwpIHtcbiAgICB2YXIgdmlldyA9IFtWaWV3cy5yb29tLmVycm9yRGlzcGxheShBcHApXTtcbiAgICBjb25zb2xlLmxvZygnZnJvbSBjb252byB2aWV3JywgQXBwLnNvY2tldCk7XG4gICAgaWYgKEFwcC5zb2NrZXQucmVhZHlTdGF0ZSA9PSAxKSB7XG4gICAgICBpZiAoQXBwLnJvb20udXNlcigpID09IFwib2JzZXJ2ZXJcIikge1xuICAgICAgICB2aWV3LnB1c2goVmlld3Mucm9vbS5vYnNlcnZlclZpZXcoQXBwLnJvb20pKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB2aWV3LnB1c2goVmlld3Mucm9vbS5wYXJ0aWNpcGFudFZpZXcoQXBwLnJvb20sIFJvb20uc2VuZE1lc3NhZ2UoQXBwKSkpO1xuICAgICAgfVxuICAgICAgaWYgKCFBcHAuaGFzU291bmQpIHtcbiAgICAgICAgdmlldy5wdXNoKFxuICAgICAgICAgIG0oXCJkaXYuY29udGFpbmVyLnBvcHVwXCIsXG4gICAgICAgICAgICBWaWV3cy5yb29tLmF1ZGlvUHJvbXB0KFxuICAgICAgICAgICAgICBBcHAsXG4gICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoQXBwLnJvb20udXNlcigpID09IFwib2JzZXJ2ZXJcIilcbiAgICAgICAgICAgICAgICAgIFJvb20ub2JzZXJ2ZXJTb3VuZFNldHVwKEFwcCk7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgUm9vbS5wYXJ0aWNpcGFudFNvdW5kU2V0dXAoQXBwKTtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiYXBwXCIsIEFwcC5yb29tLm5hbWUoKSwgQXBwLnJvb20udXNlcigpKTtcbiAgICAgICAgICAgICAgICBSb29tLnF1aXQoQXBwLnJvb20pO1xuICAgICAgICAgICAgICB9KSkpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmxvZygnZmluYWwgdmlldycsIHZpZXcpO1xuICAgIHJldHVybiBtKFwiZGl2LmNvbnRhaW5lclwiLCB2aWV3KTtcbiAgfVxufTtcblxudmFyIE9uVGhlRmx5ID0ge1xuICBjb250cm9sbGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgY29uc29sZS5sb2coJ29udGhlZmx5IGNvbnRyb2xsZXIgdG9wJyk7XG4gICAgdmFyIHJvb21OYW1lID0gUm9vbS5mZXRjaCgncm9vbU5hbWUnKSxcbiAgICAgICAgdXNlck5hbWUgPSBSb29tLmZldGNoKCd1c2VyTmFtZScpOyAgICBcbiAgICBzZXNzaW9uU3RvcmFnZS5jbGVhcigpO1xuICAgIEFwcC5yb29tID0gbmV3IFJvb20ocm9vbU5hbWUsIHVzZXJOYW1lKTtcbiAgICAvLyBzdG9yZSBkYXRhIGlmIHRoZSBwYWdlIHJlZnJlc2hlcyBhbmQgYWxsb3cgcmVjb25uZWN0XG4gICAgaWYgKElNT0JJTEUpXG4gICAgICB3aW5kb3cub25wYWdlaGlkZSA9IGludGVycnVwdChBcHApO1xuICAgIGVsc2VcbiAgICAgIHdpbmRvdy5vbmJlZm9yZXVubG9hZCA9IGludGVycnVwdChBcHApO1xuXG4gICAgLy8gaGFuZGxlIGJhY2sgYnV0dG9uIG5hdmlnYXRpb24gYXMgYSBsb2cgb3V0XG4gICAgd2luZG93Lm9ucG9wc3RhdGUgPSBjdXN0b21CYWNrKEFwcCk7XG4gIH0sXG4gIHZpZXc6IGZ1bmN0aW9uIChjdGwpIHtcbiAgICB2YXIgdmlldyA9IFtWaWV3cy5yb29tLmVycm9yRGlzcGxheShBcHApXTtcbiAgICBpZiAoQXBwLnJvb20udXNlcigpKSB7XG4gICAgICBSb29tLmNvbm5lY3QoQXBwLnJvb20sICcvcGFuZG8vJytBcHAucm9vbS5uYW1lKCkrJy8nK0FwcC5yb29tLnVzZXIoKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdmlldy5wdXNoKFZpZXdzLnJvb20ub25UaGVGbHlKb2luKEFwcCwgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aGVuVXNlclZhbGlkKEFwcC5yb29tLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgUm9vbS5jb25uZWN0KEFwcC5yb29tLCAnL3BhbmRvLycrQXBwLnJvb20ubmFtZSgpKycvJytBcHAucm9vbS51c2VyKCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG0oXCJkaXYuY29udGFpbmVyXCIsIHZpZXcpO1xuICB9XG59O1xuXG52YXIgSW5kZXggPSB7XG4gIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZygnaW5kZXggY29udHJvbGxlciB0b3AnKTtcbiAgICBpZiAod2luZG93Lm9uYmVmb3JldW5sb2FkKSB3aW5kb3cub25iZWZvcmV1bmxvYWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHdpbmRvdy5vbnBvcHN0YXRlKSB3aW5kb3cub25wb3BzdGF0ZSA9IHVuZGVmaW5lZDtcbiAgICBBcHAucmVjb25uZWN0ID0gZmFsc2U7XG4gICAgQXBwLnJvb20gPSBBcHAucm9vbSA/IEFwcC5yb29tIDogbmV3IFJvb20oKTsgICAgXG4gICAgdGhpcy5yb29tcyA9IG5ldyBSb29tTGlzdCgpO1xuICAgIHRoaXMucm9vbSA9IEFwcC5yb29tO1xuICAgIGNyYWNrZWQoKS5sb29wKCdzdG9wJyk7XG4gICAgY3JhY2tlZCgnKicpLnN0b3AoKTtcbiAgfSxcbiAgdmlldzogZnVuY3Rpb24gKGN0bCkge1xuICAgIHZhciBib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJib2R5XCIpWzBdO1xuICAgIGJvZHkuY2xhc3NMaXN0LnJlbW92ZShcImZ1bGxfaGVpZ2h0XCIpO1xuICAgIGJvZHkuY2xhc3NMaXN0LmFkZChcImF1dG9faGVpZ2h0XCIpO1xuICAgIGNvbnNvbGUubG9nKGN0bC5yb29tLnVzZXIoKSwgQXBwLnJvb20udXNlcigpKTtcbiAgICBcbiAgICByZXR1cm4gbShcImRpdi5jb250YWluZXJcIiwgW1xuICAgICAgbShcImRpdiNhcHBUaXRsZVwiLFxuICAgICAgICBtKFwiZGl2LnRpdGxlX3RleHRcIiwgbShcInBcIiwgXCJQYW5kb1wiKSksXG4gICAgICAgIG0oXCJkaXYubWVkaXVtX3RleHRcIiwgbShcInBcIiwgXCJhIGRpc3RyaWJ1dGVkLCBjaGF0LW9yaWVudGVkIHZpcnR1YWwgaW5zdGFsbGF0aW9uXCIpKSksXG4gICAgICBWaWV3cy5yb29tLmVycm9yRGlzcGxheShBcHApLFxuICAgICAgVmlld3Mucm9vbS5mb3JtVmlldyhcbiAgICAgICAgQXBwLnJvb20sIGN0bC5yb29tcyxcbiAgICAgICAgZnVuY3Rpb24gKHJvb20sIHJvb21MaXN0KSB7XG4gICAgICAgICAgd2hlblVzZXJWYWxpZChyb29tLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aGVuT2JzZXJ2ZXJWYWxpZChyb29tLCByb29tTGlzdCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICB2YXIgZGVzdCA9ICcvcGFuZG8nO1xuICAgICAgICAgICAgICBpZiAocm9vbS5uYW1lKCkpIGRlc3QgKz0gJy8nICsgcm9vbS5uYW1lKCk7XG4gICAgICAgICAgICAgIGlmIChyb29tLnVzZXIoKSkgZGVzdCArPSAnLycgKyByb29tLnVzZXIoKTtcbiAgICAgICAgICAgICAgLy8vbS5yb3V0ZShkZXN0KTtcbiAgICAgICAgICAgICAgUm9vbS5jb25uZWN0KEFwcC5yb29tLCBkZXN0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIF0pO1xuICB9XG59O1xuXG52YXIgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcCcpO1xuXG5tLnJvdXRlLm1vZGUgPSBcInBhdGhuYW1lXCI7XG5cbm0ucm91dGUodGFyZ2V0LCBcIi9wYW5kb1wiLCB7XG4gICAgXCIvcGFuZG9cIjogSW5kZXggIFxuICAsIFwiL3BhbmRvLzpyb29tTmFtZVwiOiBPblRoZUZseVxuICAsIFwiL3BhbmRvLzpyb29tTmFtZS86dXNlck5hbWVcIjogUm9vbS5jb252ZXJzYXRpb25cbn0pO1xuIiwidmFyIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5leHBvcnRzLndoZW4gPSBmdW5jdGlvbiAodmFsLCBjYWxsYmFjaykge1xuICBpZiAodmFsICE9PSBudWxsICYmIHR5cGVvZiB2YWwgIT09IFwidW5kZWZpbmVkXCIpIHJldHVybiBjYWxsYmFjaygpO1xuICBlbHNlIHJldHVybiBudWxsO1xufTtcblxuZXhwb3J0cy5hbnkgPSBmdW5jdGlvbiAodmFscywgdGVzdCkgeyByZXR1cm4gdmFscy5tYXAodGVzdCkuaW5kZXhPZih0cnVlKSA+IC0xOyB9O1xuIiwidmFyIG0gPSByZXF1aXJlKCcuLi9taXRocmlsL21pdGhyaWwnKTtcbnZhciBUb3VjaCA9IHJlcXVpcmUoJy4uL21pdGhyaWwtdG91Y2gvbWl0aHJpbC10b3VjaCcpO1xudmFyIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG52YXIgaGlkZSA9IGZ1bmN0aW9uIChlKSB7IHRoaXMuY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTsgfTtcblxuZXhwb3J0cy5kaXNwbGF5RXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgcmV0dXJuIG0oXCJkaXYuZXJyb3IucG9wdXAubWVkaXVtX3RleHQuYm9sZF90ZXh0XCIsICAgICAgICAgICBcbiAgICAgICAgICAgXCIgLSBcIiArIGVycm9yKTtcbn07XG5cbmV4cG9ydHMuZGlzcGxheUVycm9ycyA9IGZ1bmN0aW9uIChtb2RlbCkge1xuICByZXR1cm4gbShcImRpdiNub3RpZmljYXRpb25zLnBvcHVwLmNvbnRhaW5lclwiLFxuICAgICAgICAgICB7IG9uY2xpY2s6IGhpZGUsXG4gICAgICAgICAgICAgY29uZmlnOiBUb3VjaC50b3VjaEhlbHBlcih7IHRhcDogaGlkZSB9KSB9LFxuICAgICAgICAgICBtb2RlbC5lcnJvcnMoKS5zcGxpY2UoMCxtb2RlbC5lcnJvcnMoKS5sZW5ndGgpLm1hcChleHBvcnRzLmRpc3BsYXlFcnJvcikpO1xufTtcblxuZXhwb3J0cy5sYWJlbCA9IGZ1bmN0aW9uIChsYWJlbFRleHQsIGRhdGFOYW1lKSB7XG4gIHJldHVybiBbbShcImJyXCIpLFxuICAgICAgICAgIG0oXCJsYWJlbC5iaWdfdGV4dC5ib2xkXCIsIHsgZm9yOiBkYXRhTmFtZSB9LCBsYWJlbFRleHQpLFxuICAgICAgICAgIG0oXCJiclwiKV07XG59O1xuXG5leHBvcnRzLmJ1dHRvbiA9IGZ1bmN0aW9uIChidXR0b25UZXh0LCBidXR0b25Dc3MsIG9uQ2xpY2spIHtcbiAgdmFyIHJlYWxPbkNsaWNrID0gZnVuY3Rpb24gKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgcmV0dXJuIG9uQ2xpY2soKTtcbiAgfTtcbiAgcmV0dXJuIFttKFwiZGl2LmJ1dHRvblJvd1wiLFxuICAgICAgICAgICAgbShcImJ1dHRvbi5idXR0b24uYmlnX3RleHRcIiArIGJ1dHRvbkNzcyxcbiAgICAgICAgICAgICAgeyBvbmNsaWNrOiByZWFsT25DbGljayxcbiAgICAgICAgICAgICAgICBjb25maWc6IFRvdWNoLnRvdWNoSGVscGVyKHtcbiAgICAgICAgICAgICAgICAgIHRhcDogcmVhbE9uQ2xpY2sgfSl9LFxuICAgICAgICAgICAgICBidXR0b25UZXh0KSksXG4gICAgICAgICAgbShcImJyXCIpXTtcbn07XG5cbmV4cG9ydHMudGV4dElucHV0ID0gZnVuY3Rpb24gKGxhYmVsTmFtZSwgZGF0YU5hbWUsIGF0dHIpIHtcbiAgcmV0dXJuIFsgZXhwb3J0cy5sYWJlbChsYWJlbE5hbWUsIGRhdGFOYW1lKVxuICAgICAgICAgICAsIG0oXCJpbnB1dC5iaWdfdGV4dFwiLFxuICAgICAgICAgICAgICAgeyB0eXBlOiBcInRleHRcIixcbiAgICAgICAgICAgICAgICAgbmFtZTogZGF0YU5hbWUsXG4gICAgICAgICAgICAgICAgIG9ua2V5dXA6IG0ud2l0aEF0dHIoXCJ2YWx1ZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnJlZHJhdy5zdHJhdGVneShcIm5vbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgIG9ua2V5ZG93bjogbS53aXRoQXR0cihcInZhbHVlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0ucmVkcmF3LnN0cmF0ZWd5KFwibm9uZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgb25pbnB1dDogbS53aXRoQXR0cihcInZhbHVlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0ucmVkcmF3LnN0cmF0ZWd5KFwibm9uZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgdmFsdWU6IGF0dHIoKVxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgIF07XG59O1xuXG5leHBvcnRzLm1vZGVsTmFtZVJhZGlvID0gZnVuY3Rpb24gKG1vZGVsKSB7XG4gIHJldHVybiBmdW5jdGlvbiAocm9vbSkge1xuICAgIHJldHVybiBbbShcImRpdi5yb29tUmFkaW9cIixcbiAgICAgICAgICAgICAgbShcImlucHV0XCIsXG4gICAgICAgICAgICAgICAgeyB0eXBlOiBcInJhZGlvXCIsXG4gICAgICAgICAgICAgICAgICBuYW1lOiBcInJvb21OYW1lXCIsXG4gICAgICAgICAgICAgICAgICBvbmNsaWNrOiBtLndpdGhBdHRyKFwidmFsdWVcIiwgbW9kZWwubmFtZSksXG4gICAgICAgICAgICAgICAgICBjb25maWc6IFRvdWNoLnRvdWNoSGVscGVyKHtcbiAgICAgICAgICAgICAgICAgICAgdGFwOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdldmVudCcsIG1vZGVsLnVzZXIoKSwgbW9kZWwubmFtZSgpLCBldmVudC5zcmNFbGVtZW50LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpOyAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5uYW1lKGV2ZW50LnNyY0VsZW1lbnQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudC5zcmNFbGVtZW50LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgIHZhbHVlOiByb29tLnJvb21OYW1lIH0pLFxuICAgICAgICAgICAgICBtKFwiZGl2LnJhZGlvX2xhYmVsLm1lZGl1bV90ZXh0XCIsXG4gICAgICAgICAgICAgICAgcm9vbS5yb29tTmFtZSArIFwiLCB1c2VyczogXCIgKyByb29tLnVzZXJDb3VudCkpXTtcbiAgfTtcbn07XG5cbmV4cG9ydHMub3ZlcmxheSA9IGZ1bmN0aW9uIChjb250ZW50cykge1xuICByZXR1cm4gbShcImRpdi5vdmVybGF5X2JhY2tkcm9wXCIsXG4gICAgICAgICAgIG0oXCJkaXYub3ZlcmxheV9jb250YWluZXJcIixcbiAgICAgICAgICAgICBjb250ZW50cygpKSk7XG59O1xuIiwidmFyIG0gPSByZXF1aXJlKCcuLi9taXRocmlsL21pdGhyaWwnKTtcbnZhciBUb3VjaCA9IHJlcXVpcmUoJy4uL21pdGhyaWwtdG91Y2gvbWl0aHJpbC10b3VjaCcpO1xudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4vY29tbW9uJyk7XG52YXIgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbmV4cG9ydHMucmVuZGVyTWVzc2FnZSA9IGZ1bmN0aW9uICh0aGlzVXNlciwgcm9vbU5hbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgdmFyIHVzZXJEaXYsIG1lc3NhZ2VVc2VyID0gbWVzc2FnZS51c2VyTmFtZTtcblxuICAgIGlmICh0aGlzVXNlciA9PSBtZXNzYWdlVXNlcilcbiAgICAgIHVzZXJEaXYgPSBtKFwiZGl2Lm1lc3NhZ2UudXNlcm5hbWUubWVkaXVtX3RleHQudGhpc191c2VyXCIsIG1lc3NhZ2VVc2VyICsgXCI6XCIpO1xuICAgIGVsc2UgaWYgKHJvb21OYW1lID09IG1lc3NhZ2VVc2VyKVxuICAgICAgdXNlckRpdiA9IG0oXCJkaXYubWVzc2FnZS51c2VybmFtZS5tZWRpdW1fdGV4dC5yb29tX3VzZXJcIiwgbWVzc2FnZVVzZXIgKyBcIjpcIik7XG4gICAgZWxzZVxuICAgICAgdXNlckRpdiA9IG0oXCJkaXYubWVzc2FnZS51c2VybmFtZS5tZWRpdW1fdGV4dFwiLCBtZXNzYWdlVXNlciArIFwiOlwiKTtcbiAgICByZXR1cm4gbShcImRpdi5tZXNzYWdlXCIsXG4gICAgICAgICAgICAgW3VzZXJEaXYsXG4gICAgICAgICAgICAgIG0oXCJkaXYubWVzc2FnZS5ib2R5LnNtYWxsX3RleHRcIixcbiAgICAgICAgICAgICAgICBtZXNzYWdlLm1lc3NhZ2Uuc3BsaXQoXCJcXG5cIikubWFwKGZ1bmN0aW9uIChsKSB7IHJldHVybiBtKFwicFwiLCBsKTsgfSkpXSk7XG4gIH07XG59O1xuXG5leHBvcnRzLnBhcnRpY2lwYW50VmlldyA9IGZ1bmN0aW9uIChjdGwsIGZvcm1DYWxsYmFjaykge1xuICByZXR1cm4gbShcImRpdi5jb250YWluZXJcIixbXG4gICAgbShcImRpdiNtZXNzYWdlc1wiLCBjdGwubWVzc2FnZXMoKS5tYXAoZXhwb3J0cy5yZW5kZXJNZXNzYWdlKGN0bC51c2VyKCksIGN0bC5uYW1lKCkpKSksXG4gICAgbShcImRpdiNtZXNzYWdlRm9ybVwiLCBbXG4gICAgICBtKFwiZm9ybVwiLCBbXG4gICAgICAgIG0oXCJ0ZXh0YXJlYSNtZXNzYWdlQm9keS5tZWRpdW1fdGV4dFwiLFxuICAgICAgICAgIHsgb25pbnB1dDogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGN0bC5jdXJyZW50TWVzc2FnZShlLnRhcmdldC52YWx1ZSk7XG4gICAgICAgICAgICBpZiAoY3RsLmVudHJ5U3RhcnQgPT09IG51bGwpIGN0bC5lbnRyeVN0YXJ0KERhdGUubm93KCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIGN0bC5jdXJyZW50TWVzc2FnZSgpKSxcbiAgICAgICAgbShcImRpdiNtZXNzYWdlU2VuZC5idXR0b25cIixcbiAgICAgICAgICB7IG9ubGljazogZm9ybUNhbGxiYWNrLFxuICAgICAgICAgICAgY29uZmlnOiBUb3VjaC50b3VjaEhlbHBlcih7IHRhcDogZm9ybUNhbGxiYWNrIH0pIH0sXG4gICAgICAgICAgbShcImRpdi5pbWFnZUhvbGRlclwiLFxuICAgICAgICAgICAgIG0oXCJpbWdbc3JjPScvcGFuZG8vaW1nL3NlbmQuc3ZnJ11cIikpKV0pXSldKTtcbn07XG5cbmV4cG9ydHMub2JzZXJ2ZXJWaWV3ID0gZnVuY3Rpb24gKGN0bCkge1xuICByZXR1cm4gbShcImRpdiNtZXNzYWdlc1wiLCBjdGwubWVzc2FnZXMoKS5tYXAoZXhwb3J0cy5yZW5kZXJNZXNzYWdlKGN0bC51c2VyKCksIGN0bC5uYW1lKCkpKSk7XG59O1xuXG5leHBvcnRzLmZvcm1WaWV3ID0gZnVuY3Rpb24gKHJvb20sIHJvb21MaXN0LCBjb25uZWN0Q2FsbGJhY2spIHtcbiAgcmV0dXJuIG0oXCJkaXYjcm9vbUZvcm1Ib2xkZXIuaW50ZXJhY3Rpb25Ib2xkZXJcIixcbiAgICAgICAgICAgbShcImZvcm0jcm9vbUZvcm1cIixcbiAgICAgICAgICAgICBbY29tbW9uLnRleHRJbnB1dChcIlVzZXIgTmFtZTpcIiwgXCJ1c2VyTmFtZVwiLCByb29tLnVzZXIpLFxuICAgICAgICAgICAgICBtKFwiYnJcIiksXG4gICAgICAgICAgICAgIGNvbW1vbi50ZXh0SW5wdXQoXCJDcmVhdGUgYSBuZXcgcm9vbSAuLi5cIiwgXCJyb29tTmFtZVwiLCByb29tLm5hbWUpLFxuICAgICAgICAgICAgICBtKFwiYnJcIiksXG4gICAgICAgICAgICAgIGNvbW1vbi5sYWJlbChcIi4uLiBvciBzZWxlY3QgYW4gZXhpc3Rpbmcgcm9vbVwiLCBcInJvb21OYW1lXCIpLFxuICAgICAgICAgICAgICBtKFwiYnJcIiksXG4gICAgICAgICAgICAgIHJvb21MaXN0LmRhdGEoKS5saXN0Lm1hcChjb21tb24ubW9kZWxOYW1lUmFkaW8ocm9vbSkpLFxuICAgICAgICAgICAgICBtKFwiYnJcIiksXG4gICAgICAgICAgICAgIGNvbW1vbi5idXR0b24oXCJDb25uZWN0XCIsIFwiI2Nvbm5lY3RcIiwgZnVuY3Rpb24gKCkge2Nvbm5lY3RDYWxsYmFjayhyb29tLCByb29tTGlzdCk7fSldKSk7XG59O1xuXG5leHBvcnRzLmF1ZGlvUHJvbXB0ID0gZnVuY3Rpb24gKGFwcCwgZW5hYmxlQ2FsbGJhY2ssIGNhbmNlbENhbGxiYWNrKSB7XG4gIHJldHVybiBtKFwiZGl2LnBvcHVwLmludGVyYWN0aW9uSG9sZGVyXCIsXG4gICAgICAgICAgIFttKFwicC5tZWRpdW1fdGV4dFwiLCBcIllvdSBuZWVkIHRvIGVuYWJsZSB3ZWIgYXVkaW8gdG8gY29udGludWVcIiksXG4gICAgICAgICAgICBtKFwiZGl2LmJ1dHRvblJvd1wiLFxuICAgICAgICAgICAgICBbbShcImJ1dHRvbi5idXR0b25cIixcbiAgICAgICAgICAgICAgICAgeyBvbmNsaWNrOiBmdW5jdGlvbiAoKSB7IGVuYWJsZUNhbGxiYWNrKCk7IH0sXG4gICAgICAgICAgICAgICAgICAgY29uZmlnOiBUb3VjaC50b3VjaEhlbHBlcih7IHRhcDogZnVuY3Rpb24gKCl7ZW5hYmxlQ2FsbGJhY2soKTt9IH0pXG4gICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgIFwiRW5hYmxlXCIpLFxuICAgICAgICAgICAgICAgbShcImJ1dHRvbi5idXR0b25cIixcbiAgICAgICAgICAgICAgICAgeyBvbmNsaWNrOiBmdW5jdGlvbiAoKSB7IGNhbmNlbENhbGxiYWNrKCk7IH0sXG4gICAgICAgICAgICAgICAgICAgY29uZmlnOiBUb3VjaC50b3VjaEhlbHBlcih7IHRhcDogZnVuY3Rpb24gKCkge2NhbmNlbENhbGxiYWNrKCk7fSB9KVxuICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICBcIkNhbmNlbCAmIExlYXZlXCIpXSldKTtcbn07XG5cbmV4cG9ydHMub25UaGVGbHlKb2luID0gZnVuY3Rpb24gKGFwcCwgY2xpY2tDYWxsYmFjaykge1xuICByZXR1cm4gbShcImRpdiNyb29tRm9ybUhvbGRlci5pbnRlcmFjdGlvbkhvbGRlclwiLFxuICAgICAgICAgICBbY29tbW9uLnRleHRJbnB1dChcIlVzZXIgbmFtZTpcIiwgXCJ1c2VyTmFtZVwiLCBhcHAucm9vbS51c2VyLCB0cnVlKSxcbiAgICAgICAgICAgIG0oXCJiclwiKSxcbiAgICAgICAgICAgIGNvbW1vbi5idXR0b24oXCJKb2luXCIsIFwiI2Nvbm5lY3RcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBjbGlja0NhbGxiYWNrKCk7IH0pXSk7XG59O1xuXG5leHBvcnRzLmVycm9yRGlzcGxheSA9IGZ1bmN0aW9uIChhcHApIHtcbiAgaWYgKGFwcC5lcnJvcnMoKS5sZW5ndGggPiAwKVxuICAgIHJldHVybiBjb21tb24uZGlzcGxheUVycm9ycyhhcHApO1xuICBlbHNlXG4gICAgcmV0dXJuIFtdO1xufTtcbiIsInZhciBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuZXhwb3J0cy5jb21tb24gPSByZXF1aXJlKCcuL2NvbW1vbi5qcycpO1xuZXhwb3J0cy5yb29tID0gcmVxdWlyZSgnLi9yb29tLmpzJyk7XG4iXX0=
