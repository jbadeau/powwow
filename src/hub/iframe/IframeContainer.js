(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Class', '../Container' ], factory);
	}
	else {
		root.powwow.hub..iframe.IframeContainer = factory(root.dejavu.Class, root.powwow.hub.Container);
	}
}(this, function(Class, Container) {

	'use strict';

	var IframeContainer = Class.declare({

		$name : 'IframeContainer',

		$implements : Container,

		/**
		 * Create a new Iframe Container.
		 *
		 * @constructor
		 *
		 * IframeContainer implements the Container interface to provide a
		 * container that isolates client components into secure sandboxes by
		 * leveraging the isolation features provided by browser iframes.
		 *
		 * @param {OpenAjax.hub.ManagedHub}
		 *            hub Managed Hub instance to which this Container belongs
		 * @param {String}
		 *            clientID A string ID that identifies a particular client
		 *            of a Managed Hub. Unique within the context of the
		 *            ManagedHub.
		 * @param {Object}
		 *            params Parameters used to instantiate the IframeContainer.
		 *            Once the constructor is called, the params object belongs
		 *            exclusively to the IframeContainer. The caller MUST not
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
		 * @param {Object}
		 *            params.IframeContainer.parent DOM element that is to be
		 *            parent of iframe
		 * @param {String}
		 *            params.IframeContainer.uri Initial Iframe URI (Container
		 *            will add parameters to this URI)
		 * @param {String}
		 *            params.IframeContainer.tunnelURI URI of the tunnel iframe.
		 *            Must be from the same origin as the page which
		 *            instantiates the IframeContainer.
		 * @param {Object}
		 *            [params.IframeContainer.iframeAttrs] Attributes to add to
		 *            IFRAME DOM entity. For example: { style: { width: "100%",
		 *            height: "100%" }, className: "some_class" }
		 * @param {Number}
		 *            [params.IframeContainer.timeout] Load timeout in
		 *            milliseconds. If not specified, defaults to 15000. If the
		 *            client at params.IframeContainer.uri does not establish a
		 *            connection with this container in the given time, the
		 *            onSecurityAlert callback is called with a LoadTimeout
		 *            error code.
		 * @param {Function}
		 *            [params.IframeContainer.seed] A function that returns a
		 *            string that will be used to seed the pseudo-random number
		 *            generator, which is used to create the security tokens. An
		 *            implementation of IframeContainer may choose to ignore
		 *            this value.
		 * @param {Number}
		 *            [params.IframeContainer.tokenLength] Length of the
		 *            security tokens used when transmitting messages. If not
		 *            specified, defaults to 6. An implementation of
		 *            IframeContainer may choose to ignore this value.
		 *
		 * @throws {OpenAjax.hub.Error.BadParameters}
		 *             if required params are not present or null
		 * @throws {OpenAjax.hub.Error.Duplicate}
		 *             if a Container with this clientID already exists in the
		 *             given Managed Hub
		 * @throws {OpenAjax.hub.Error.Disconnected}
		 *             if hub is not connected
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

	return IframeContainer;

}));