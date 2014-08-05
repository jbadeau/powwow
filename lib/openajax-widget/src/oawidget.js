/*
        Copyright 2006-2009 OpenAjax Alliance

        Licensed under the Apache License, Version 2.0 (the "License"); 
        you may not use this file except in compliance with the License. 
        You may obtain a copy of the License at
        
                http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software 
        distributed under the License is distributed on an "AS IS" BASIS, 
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
        See the License for the specific language governing permissions and 
        limitations under the License.
*/

////////////////////////////////////////////////////////////////////////////////

/****************************************************************
	THIS FILE IS OUT OF DATE AND MIGHT BE TOTALLY OBSOLETE
	 
	This file was designed initially to define the Widget APIs
	found in the OpenAjax Metadata 1.0 Specification at
	http://www.openajax.org/member/wiki/OpenAjax_Metadata_1.0_Specification_Widget_APIs.
	The idea was to use a technique similar to what OpenAjax Alliance
	did with OpenAjax Hub 2.0, which was to maintain the "truth"
	in open source and then copy JSDoc snippets from open source into the spec.

	But as of now, for OpenAjax Metadata 1.0, the truth is in the spec
	and the JSDoc comments in this file are out of date.
	
	We might delete this file in the future.
****************************************************************/

/**
 * OpenAjax.widget global object
 */

if ( typeof OpenAjax.widget == "undefined" ) {
    OpenAjax.widget = {};
}

/**
 * Global function that returns a widget instance whose ID is wid
 * 
 * @param {Object} wid
 * 
 * @returns a widget instance, or null if none can be found
 * @type {Object}
 */
OpenAjax.widget.byId = function(wid) {}


////////////////////////////////////////////////////////////////////////////////

/* 

/**
 * Dimensions represents a set of dimensions in pixels.
 * 
 * The permitted properties, height and width, are integers 
 * and refer to the number of pixels.
 * 
 * Both properties are optional, so {} is a valid Dimensions
 * object, as is { height: 40 } or { width: 250 }.
 * 
 */
// OpenAjax.widget.Dimensions = {
//	height: 0,
// 	width: 0
// }; 

/**
 * OpenAjax.widget.Error defines widgets-specific exception names.
 * This is analogous to OpenAjax.hub.Error.
 */
OpenAjax.widget.Error = {
	// define any widget-specific exceptions here.
};


/**
 * OpenAjax.widget.Event represents an event in the widget life cycle.
 * The event payload varies depending on the type of event being reported.
 * In some cases, the payload is empty. 
 */
// OpenAjax.widget.Event = Object;



/**
 * OpenAjax.widget.Adapter interface
 * 
 * For each widget implementation object (widget) that is instantiated, 
 * the mash-up framework automatically constructs an object 
 * ("widget adapter") of type OpenAjax.widget.Adapter and sets 
 * 
 * 	widget.OpenAjax = Adapter;
 */

/**
 * The constructor for an Adapter is not defined by the standard.
 */
OpenAjax.widget.Adapter = function() {}

/**
 * Returns the ID string corresponding to this widget
 * (i.e., the value of the __WID__ substitution variable).
 * 
 * @returns 
 * 		ID string corresponding to this widget
 * @type {String}
 * 
 * @throws ... ? TODO 
 */
OpenAjax.widget.Adapter.prototype.getId = function() {};

/**
 * Return the maximum size that the mash-up framework will allow
 * this widget to grow to. The size refers to the element that
 * contains the widget inside the container. So, if an iframe
 * container is used and the iframe window contains a DIV, 
 * the returned dimensions refer to the DIV (and NOT the
 * iframe or the iframe's parent element).
 * 
 * The returned Dimensions object specifies the dimensions of 
 * the widget that the mash-up is willing to permit. If the 
 * mash-up does not return a width or a height this signifies 
 * the widget can ask for whatever size it would like when 
 * using the adjustDimensions method.
 * 
 * For example, if a widget must be at most 500 pixels wide but 
 * the framework does not constrain the height, this function 
 * would return the Dimensions object
 * 
 * 		{ width: 500 }. 
 * 
 * Because the mash-up container mirrors size constraints to the 
 * clients, there is no need to send a request to the manager
 * application. This function will therefore return immediately.
 *  
 * However, developers should be cautious. If getAvailableDimensions 
 * is called at roughly the same time as other widgets are being
 * resized, the information that it returns may be out of date.
 * This information should therefore be regarded as a hint.
 * 
 * @returns 
 * 		The return value is an object with a width and/or a height 
 * 		property representing the current dimensions of the widget.
 * @type {OpenAjax.widget.Dimensions}
 * 
 * @throws ... ? TODO // disconnected
 */
OpenAjax.widget.Adapter.prototype.getAvailableDimensions = function() {};

/**
 * Request the current width and height in an Object which the 
 * widget occupies in the container. The size refers to the 
 * element that contains the widget inside the container. So, 
 * if an iframe container is used and the iframe window 
 * contains a DIV, the returned dimensions refer to the DIV 
 * (and NOT the iframe or the iframe's parent element).
 * 
 * The returned Dimensions object specifies the dimensions of 
 * the widget that the mash-up is willing to permit. If the 
 * mash-up does not return a width or a height this signifies 
 * the widget can ask for whatever size it would like when 
 * using the adjustDimensions method.
 * 
 * For example, if a widget's size is currently 500px x 400px, 
 * this function would return the Dimensions object
 * 
 * 		{ width: 500, height: 400 }. 
 * 
 * Because the mash-up container mirrors size constraints to the 
 * clients, there is no need to send a request to the manager
 * application. This function will therefore return immediately.
 *  
 * However, developers should be cautious. If getAvailableDimensions 
 * is called at roughly the same time as other widgets are being
 * resized, the information that it returns may be out of date.
 * This information should therefore be regarded as a hint.
 * 
 * @returns 
 * 		The return value is an object with a width and a height 
 * 		property representing the current dimensions of the widget.
 * @type {OpenAjax.widget.Dimensions}
 * 
 * @throws ... ? TODO // disconnected
 */
OpenAjax.widget.Adapter.prototype.getDimensions = function() {};

/**
 * Request that the mash-up update width and height of the element 
 * which the widget occupies inside the container. 
 * 
 * The requested size refers to the element that contains the 
 * widget inside the container. So, if an iframe container is 
 * used and the iframe window contains a DIV, the returned 
 * dimensions refer to the DIV (and NOT the iframe or the 
 * iframe's parent element).
 * 
 * Various results are possible. The widget adapter/mash-up 
 * might:
 * 
 * 1. change the dimensions to the requested size, OR
 * 
 * 2. change the dimensions, but to a size different from the
 * requested size (usually smaller in one or both dimensions,
 * based on space constraints), OR
 * 
 * 3. not change the current dimensions at all.
 * 
 * If the size does change, the widget will be notified of the 
 * change via an onSizeChanged event (assuming that the widget 
 * has the appropriate event handler).
 * 
 * @param {OpenAjax.widget.Dimensions} dimensions
 * 		This parameter is a Dimensions object. For example:
 * 		{ width: 500, height: 400 } requests that the height be reset 
 * 			to 500px and that the width be reset ti 400px.
 * 		{ height: 400 } requests that the height be reset to 400px
 * 			and that the width be left alone.
 * 		{ width: 500 } requests that the width be reset to 500px
 * 			and that the height be left alone.
 * 			The width and height properties specify the requested 
 * 			with and height to adjust the widget to. 
 * 
 * @throws ... ? TODO // disconnected
 */
OpenAjax.widget.Adapter.prototype.adjustDimensions = function( dimensions ) {};

/** 
 * Returns the widget's current mode.
 * 
 * @returns
 * 		The widget's current mode
 * @type {String}
 */
OpenAjax.widget.Adapter.prototype.getMode = function() {};

/** 
 * Request transition to a specified mode. The widget container might
 * not honor this request. If the request is honored, then the onModeChanged
 * event will notify the widget of the change (if the widget has a handler for
 * that event).
 * 
 * @param {String} mode
 *      The name of the mode to which the widget is requesting transition
 */
OpenAjax.widget.Adapter.prototype.requestMode = function( mode ) {};

/**
 * Returns the current value of the requested property name. 
 * 
 * This function returns immediately.
 * 
 * @param {Object} name	 
 * 		This is the name of the property to retrieve
 * 
 * @returns 
 * 		The current value of the property named name. 
 * 		The value must be serializeable as JSON.
 * @type {*}
 * 
 * @throws ... ? TODO	// Bad object type, invalid name?
 */
OpenAjax.widget.Adapter.prototype.getPropertyValue = function( name ) {};

/**
 * Set the value of the requested property name.   
 * This function may cause the updated value of the 
 * property to be published. This function returns 
 * immediately.
 * 
 * @param {Object} name	 
 * 		This is the name of the property to set
 * @param {*} value
 * 		This is the value to which the property is to be set.
 * 		The value must be serializeable as JSON.
 * 
 * @throws ... ? TODO	// Bad object type, invalid name, disconnected?
 * 		Can you set a property name if the manager is disconnected 
 * 		from the widget?
 */
OpenAjax.widget.Adapter.prototype.setPropertyValue = function( name, value ) {};


/**
 * Return array containing the names of all of the widget's properties,
 * in arbitrary order.
 * 
 * @returns 
 * 		An array containing the names of all of the widget's properties
 * @type {String[]}
 * 
 */
OpenAjax.widget.Adapter.prototype.getPropertyNames = function() {};

/**
 * Returns the localized version of the given string.
 * 
 * @param {String} key
 * 		The lookup key for the localization string. 
 * 		This parameter must be an exact string match
 * 		with the 'name' attribute on a <msg> element 
 * 		within a message bundle file.
 * 
 * @returns 
 * 		The localized version of the string.
 * @type {String}
 * 
 * 
 * @throws ... ? TODO	// NotFound
 */
OpenAjax.widget.Adapter.prototype.getMsg = function( key ) {};

/**
 * Returns a URL string that is suitable for use with the current proxy server.
 * Some environments will use proxy servers and others will not. For environments 
 * that do not use proxy server techniques, this method returns the original URL 
 * string.
 * 
 * @param {String} url
 * 		URL to be proxied
 * 
 * @returns 
 * 		A URL string
 * @type {String}
 * 
 * 
 * @throws ... ? TODO	
 */
OpenAjax.widget.Adapter.prototype.getProxyUrl = function( url ) {};


////////////////////////////////////////////////////////////////////////////////

/**
 * OpenAjax.widget.Widget Interface
 * 
 * A widget implementation may implement any or all of the event handler
 * functions defined on this interface. Implementing an event handler
 * function automatically registers the function to handle events. 
 * Removing the function automatically unregisters it.
 * 
 * Every widget implementation must support a zero-parameter constructor. 
 * 
 * After instantiating a widget (theWidget), the mash-up framework 
 * (NOT the widget implementation itself) automatically sets:
 * 
 * 		theWidget.OpenAjax = new OpenAjax.widget.Adapter(...);
 */

/**
 * @constructor
 * 
 * There must be a default (zero parameters) constructor.
 * 
 * @throws ... ? TODO
 */
// OpenAjax.widget.Widget = function() {};

/** 
 * OPTIONAL FUNCTION
 * 
 * This event signals that the widget has finished loading and that all 
 * resources specified by <library> and <require> elements are available. 
 * This event carries no predefined payload.
 * 
 * This is NOT the same as a window or page onload event.
 * 
 * @param {OpenAjax.widget.Event} event
 * 		Load event. There is no payload
 * 
 * @throws ... ? TODO
 */
// OpenAjax.widget.Widget.prototype.onLoad = function(event) {};


/** 
 * OPTIONAL FUNCTION
 * 
 * This event signals that the page is about to reload the widget. 
 * This notification is intended to allow the widget to store any 
 * transient data such that it can be recovered by the reloaded 
 * instance. This event carries no predefined payload.
 * 
 * This is NOT the same as a window or page onunload event.
 * 
 * @param {OpenAjax.widget.Event} event
 * 		Unload event. There is no payload
 * 
 * @throws ... ? TODO
 */
// OpenAjax.widget.Widget.prototype.onUnload = function(event) {};


/** 
 * OPTIONAL FUNCTION
 * 
 * If the onChange callback exists, it is invoked after ANY property 
 * value changes. This allows a developer to have a single callback 
 * for any property change events. Need to specify signature for the 
 * callback function 
 * 
 * @param {OpenAjax.widget.Event} event
 * 		OnChange event. The event payload is an object that has the 
 * 		following properties:
 * 
 * @param {String} event.property
 * 		Property's name (same as 'name' attribute on <property> element)
 * @param {String} event.oldValue
 * 		Any JSON-serializable JavaScript value (e.g., String or Object)
 * @param {String} event.newValue
 * 		Any JSON-serializable JavaScript value (e.g., String or Object)
 * 
 * @throws ... ? TODO
 */
// OpenAjax.widget.Widget.prototype.onChange = function(event) {};

/** 
 * OPTIONAL FUNCTION
 * 
 * If the onChange<PROPNAME> callback exists, it is invoked after a
 * property called <PROPNAME> property value changes. This allows a 
 * developer to have different callbacks for different properties. 
 * 
 * @param {OpenAjax.widget.Event} event
 * 		OnChangePROPNAME event, where PROPNAME is the property's name
 * 		with the first letter capitalized, e.g. onChangeDate. 
 * 		The structure of the event payload object is the same as for 
 * 		onChange()
 */
// OpenAjax.widget.Widget.prototype.onChange<PROPNAME> = function(event) {};

/** 
 * OPTIONAL FUNCTION
 * 
 * This event signals that the mode for the widget has changed. 
 * 
 * @param {OpenAjax.widget.Event} event
 * 		ModeChanged event. The event payload is an object that has the 
 * 		following properties:
 * 
 * @param {String} event.oldMode
 * 		"view"|"edit"|"help"|<QName>
 * @param {String} event.newMode
 * 		"view"|"edit"|"help"|<QName>
 * @param {String} event.renderedBy
 *		"widget" | "host"
 * 
 * @throws ... ? TODO
 */
// OpenAjax.widget.Widget.prototype.modeChanged = function(event) {};

/** 
 * OPTIONAL FUNCTION
 * 
 * This event signals that the widget has just been resized by the host. 
 * 
 * @param {OpenAjax.widget.Event} event
 * 		SizeChanged event. The event payload is an object that has the 
 * 		following properties:
 * 
 * @param {String} event.oldWidth
 * @param {String} event.oldHeight
 * @param {String} event.newWidth
 * @param {String} event.newHeight
 * 
 * @throws ... ? TODO
 */
// OpenAjax.widget.Widget.prototype.sizeChanged = function(event) {};

/** 
 * OPTIONAL FUNCTION
 * 
 * This event signals that the container considers the widget to be stale. 
 * Examples when this state could occur include when server-side 
 * coordination between components resulted in the component behind 
 * the widget to receive some coordination activity. Since the container 
 * can be aware of such states, but has no knowledge of the impacts on 
 * what the widget is presenting to the user, it generates this event to 
 * signal the situation to the widget. 
 * 
 * @param {OpenAjax.widget.Event} event
 * 		The event object payload is empty.
 * 
 * @throws ... ? TODO
 */
// OpenAjax.widget.Widget.prototype.refresh = function(event) {};

