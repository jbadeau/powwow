(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Interface' ], factory);
	}
	else {
		root.powwow.Container = factory(root.dejavu.Interface);
	}
}(this, function(Interface) {

	'use strict';

	var Container = Interface.declare({

		$name : 'Container',

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

	});

	return Container;

}));