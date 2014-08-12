(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Class', '../Container' ], factory);
	}
	else {
		root.powwow.inline.InlineContainer = factory(root.dejavu.Class, root.powwow.hub.Container);
	}
}(this, function(Class, Container) {

	'use strict';

	var InlineContainer = Class.declare({

		$name : 'InlineContainer',

		$implements : Container,

		/**
		 * Create a new Inline Container.
		 *
		 * @constructor
		 *
		 * InlineContainer implements the Container interface to provide a
		 * container that places components within the same browser frame as the
		 * main mashup application. As such, this container does not isolate
		 * client components into secure sandboxes.
		 *
		 * @param {OpenAjax.hub.ManagedHub}
		 *            hub Managed Hub instance to which this Container belongs
		 * @param {String}
		 *            clientID A string ID that identifies a particular client
		 *            of a Managed Hub. Unique within the context of the
		 *            ManagedHub.
		 * @param {Object}
		 *            params Parameters used to instantiate the InlineContainer.
		 *            Once the constructor is called, the params object belongs
		 *            exclusively to the InlineContainer. The caller MUST not
		 *            modify it. The following are the pre-defined properties on
		 *            params:
		 * @param {Function}
		 *            params.Container.onSecurityAlert Called when an attempted
		 *            security breach is thwarted. Function is defined as
		 *            follows: function(container, securityAlert)
		 * @param {Function}
		 *            [params.Container.onConnect] Called when the client
		 *            connects to the Managed Hub. Function is defined as
		 *            follows: function(container)
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
		 *            [params.Container.log] Optional logger function. Would be
		 *            used to log to console.log or equivalent.
		 *
		 * @throws {OpenAjax.hub.Error.BadParameters}
		 *             if required params are not present or null
		 * @throws {OpenAjax.hub.Error.Duplicate}
		 *             if a Container with this clientID already exists in the
		 *             given Managed Hub
		 * @throws {OpenAjax.hub.Error.Disconnected}
		 *             if ManagedHub is not connected
		 */
		initialize : function(hub, clientID, params) {
		},

		/** ****************************************************************** */
		/** Container interface methods */
		/** ****************************************************************** */

		sendToClient : function(topic, data, containerSubscriptionId) {
		},

		remove : function() {
		},

		isConnected : function() {
		},

		getClientID : function() {
		},

		getPartnerOrigin : function() {
		},

		getParameters : function() {
		},

		getHub : function() {
		}

	});

	return InlineContainer;

}));