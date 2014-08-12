(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	}
	else {
		root.Container = factory();
	}
}(this, function() {

	'use strict';

	/**
	 * Container
	 * 
	 * @constructor
	 * 
	 * Container represents an instance of a manager-side object that contains
	 * and communicates with a single client of the hub. The container might be
	 * an inline container, an iframe FIM container, or an iframe PostMessage
	 * container, or it might be an instance of some other implementation.
	 * 
	 * @param {OpenAjax.hub.ManagedHub}
	 *            hub Managed Hub instance
	 * @param {String}
	 *            clientID A string ID that identifies a particular client of a
	 *            Managed Hub. Unique within the context of the ManagedHub.
	 * @param {Object}
	 *            params Parameters used to instantiate the Container. Once the
	 *            constructor is called, the params object belongs exclusively
	 *            to the Container. The caller MUST not modify it.
	 *            Implementations of Container may specify additional properties
	 *            for the params object, besides those identified below. The
	 *            following params properties MUST be supported by all Container
	 *            implementations:
	 * @param {Function}
	 *            params.Container.onSecurityAlert Called when an attempted
	 *            security breach is thwarted. Function is defined as follows:
	 *            function(container, securityAlert)
	 * @param {Function}
	 *            [params.Container.onConnect] Called when the client connects
	 *            to the Managed Hub. Function is defined as follows:
	 *            function(container)
	 * @param {Function}
	 *            [params.Container.onDisconnect] Called when the client
	 *            disconnects from the Managed Hub. Function is defined as
	 *            follows: function(container)
	 * @param {Object}
	 *            [params.Container.scope] Whenever one of the Container's
	 *            callback functions is called, references to "this" in the
	 *            callback will refer to the scope object. If no scope is
	 *            provided, default is window.
	 * @param {Function}
	 *            [params.Container.log] Optional logger function. Would be used
	 *            to log to console.log or equivalent.
	 * 
	 * @throws {OpenAjax.hub.Error.BadParameters}
	 *             if required params are not present or null
	 * @throws {OpenAjax.hub.Error.Duplicate}
	 *             if a Container with this clientID already exists in the given
	 *             Managed Hub
	 * @throws {OpenAjax.hub.Error.Disconnected}
	 *             if ManagedHub is not connected
	 */
	function Container(hub, clientID, params) {
	}

	Container.prototype = {

		/**
		 * Send a message to the client inside this container. This function
		 * MUST only be called by ManagedHub.
		 * 
		 * @param {String}
		 *            topic The topic name for the published message
		 * @param {*}
		 *            data The payload. Can be any JSON-serializable value.
		 * @param {String}
		 *            containerSubscriptionId Container's ID for a subscription,
		 *            from previous call to subscribeForClient()
		 */
		sendToClient : function(topic, data, containerSubscriptionId) {
		},

		/**
		 * Shut down a container. remove does all of the following: -
		 * disconnects container from HubClient - unsubscribes from all of its
		 * existing subscriptions in the ManagedHub
		 * 
		 * This function is only called by ManagedHub.removeContainer Calling
		 * this function does NOT cause the container's onDisconnect callback to
		 * be invoked.
		 */
		remove : function() {
		},

		/**
		 * Returns true if the given client is connected to the managed hub.
		 * Else returns false.
		 * 
		 * @returns true if the client is connected to the managed hub
		 * @type boolean
		 */
		isConnected : function() {
		},

		/**
		 * Returns the clientID passed in when this Container was instantiated.
		 * 
		 * @returns The clientID
		 * @type {String}
		 */
		getClientID : function() {
		},

		/**
		 * If DISCONNECTED: Returns null If CONNECTED: Returns the origin
		 * associated with the window containing the HubClient associated with
		 * this Container instance. The origin has the format
		 * 
		 * [protocol]://[host]
		 * 
		 * where:
		 * 
		 * [protocol] is "http" or "https" [host] is the hostname of the partner
		 * page.
		 * 
		 * @returns Partner's origin
		 * @type {String}
		 */
		getPartnerOrigin : function() {
		},

		/**
		 * Returns the params object associated with this Container instance.
		 * 
		 * @returns params The params object associated with this Container
		 *          instance
		 * @type {Object}
		 */
		getParameters : function() {
		},

		/**
		 * Returns the ManagedHub to which this Container belongs.
		 * 
		 * @returns ManagedHub The ManagedHub object associated with this
		 *          Container instance
		 * @type {OpenAjax.hub.ManagedHub}
		 */
		getHub : function() {
		}

	};

	return Container;

}));