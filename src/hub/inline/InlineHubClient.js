(function(root, factory) {
	if (typeof define === 'function' && define.amd) {

		define([ '../HubClient' ], factory);
	}
	else {
		root.InlineHubClient = factory(root.HubClient);
	}
}(this, function(HubClient) {

	'use strict';

	function InlineHubClient(params) {
		if (!params || !params.HubClient || !params.HubClient.onSecurityAlert || !params.InlineHubClient || !params.InlineHubClient.container) {
			throw new Error(OpenAjax.hub.Error.BadParameters);
		}

		var container = params.InlineHubClient.container;
		var scope = params.HubClient.scope || window;

		if (params.HubClient.log) {
			var log = function(msg) {
				try {
					params.HubClient.log.call(scope, "InlineHubClient::" + container.getClientID() + ": " + msg);
				}
				catch (e) {
					OpenAjax.hub._debugger();
				}
			};
		}
		else {
			log = function() {
			};
		}
		this._log = log;
	}

	InlineHubClient.prototype = {

		/**
		 * Requests a connection to the ManagedHub, via the InlineContainer
		 * associated with this InlineHubClient.
		 * 
		 * If the Container accepts the connection request, this HubClient's
		 * state is set to CONNECTED and the HubClient invokes the onComplete
		 * callback function.
		 * 
		 * If the Container refuses the connection request, the HubClient
		 * invokes the onComplete callback function with an error code. The
		 * error code might, for example, indicate that the Container is being
		 * destroyed.
		 * 
		 * If the HubClient is already connected, calling connect will cause the
		 * HubClient to immediately invoke the onComplete callback with the
		 * error code OpenAjax.hub.Error.Duplicate.
		 * 
		 * @param {Function}
		 *            [onComplete] Callback function to call when this operation
		 *            completes.
		 * @param {Object}
		 *            [scope] When the onComplete function is invoked, the
		 *            JavaScript "this" keyword refers to this scope object. If
		 *            no scope is provided, default is window.
		 * 
		 * In this implementation of InlineHubClient, this function operates
		 * SYNCHRONOUSLY, so the onComplete callback function is invoked before
		 * this connect function returns. Developers are cautioned that in
		 * IframeHubClient implementations, this is not the case.
		 * 
		 * A client application may call InlineHubClient.disconnect and then
		 * call InlineHubClient.connect to reconnect to the Managed Hub.
		 */
		connect : function(onComplete, scope) {
			container.connect(this, onComplete, scope);
		},

		/**
		 * Disconnect from the ManagedHub
		 * 
		 * Disconnect immediately:
		 * 
		 * 1. Sets the HubClient's state to DISCONNECTED. 2. Causes the
		 * HubClient to send a Disconnect request to the associated Container.
		 * 3. Ensures that the client application will receive no more onData or
		 * onComplete callbacks associated with this connection, except for the
		 * disconnect function's own onComplete callback. 4. Automatically
		 * destroys all of the HubClient's subscriptions.
		 * 
		 * @param {Function}
		 *            [onComplete] Callback function to call when this operation
		 *            completes.
		 * @param {Object}
		 *            [scope] When the onComplete function is invoked, the
		 *            JavaScript "this" keyword refers to the scope object. If
		 *            no scope is provided, default is window.
		 * 
		 * In this implementation of InlineHubClient, the disconnect function
		 * operates SYNCHRONOUSLY, so the onComplete callback function is
		 * invoked before this function returns. Developers are cautioned that
		 * in IframeHubClient implementations, this is not the case.
		 * 
		 * A client application is allowed to call HubClient.disconnect and then
		 * call HubClient.connect in order to reconnect.
		 */
		disconnect : function(onComplete, scope) {
			container.disconnect(this, onComplete, scope);
		},

		getPartnerOrigin : function() {
			return container.getPartnerOrigin();
		},

		getClientID : function() {
			return container.getClientID();
		},

		/** * OpenAjax.hub.Hub interface implementation ** */

		/**
		 * Subscribe to a topic.
		 * 
		 * @param {String}
		 *            topic A valid topic string. MAY include wildcards.
		 * @param {Function}
		 *            onData Callback function that is invoked whenever an event
		 *            is published on the topic
		 * @param {Object}
		 *            [scope] When onData callback or onComplete callback is
		 *            invoked, the JavaScript "this" keyword refers to this
		 *            scope object. If no scope is provided, default is window.
		 * @param {Function}
		 *            [onComplete] Invoked to tell the client application
		 *            whether the subscribe operation succeeded or failed.
		 * @param {*}
		 *            [subscriberData] Client application provides this data,
		 *            which is handed back to the client application in the
		 *            subscriberData parameter of the onData and onComplete
		 *            callback functions.
		 * 
		 * @returns subscriptionID Identifier representing the subscription.
		 *          This identifier is an arbitrary ID string that is unique
		 *          within this Hub instance
		 * @type {String}
		 * 
		 * @throws {OpenAjax.hub.Error.Disconnected}
		 *             if this Hub instance is not in CONNECTED state
		 * @throws {OpenAjax.hub.Error.BadParameters}
		 *             if the topic is invalid (e.g. contains an empty token)
		 * 
		 * In this implementation of InlineHubClient, the subscribe function
		 * operates Thus, onComplete is invoked before this function returns.
		 * Developers are cautioned that in most implementations of HubClient,
		 * onComplete is invoked after this function returns.
		 * 
		 * If unsubscribe is called before subscribe completes, the subscription
		 * is immediately terminated, and onComplete is never invoked.
		 */
		subscribe : function(topic, onData, scope, onComplete, subscriberData) {
			return container.subscribe(topic, onData, scope, onComplete, subscriberData);
		},

		/**
		 * Publish an event on 'topic' with the given data.
		 * 
		 * @param {String}
		 *            topic A valid topic string. MUST NOT include wildcards.
		 * @param {*}
		 *            data Valid publishable data. To be portable across
		 *            different Container implementations, this value SHOULD be
		 *            serializable as JSON.
		 * 
		 * @throws {OpenAjax.hub.Error.Disconnected}
		 *             if this Hub instance is not in CONNECTED state
		 * 
		 * In this implementation, publish operates SYNCHRONOUSLY. Data will be
		 * delivered to subscribers after this function returns. In most
		 * implementations, publish operates synchronously, delivering its data
		 * to the clients before this function returns.
		 */
		publish : function(topic, data) {
			container.publish(topic, data);
		},

		/**
		 * Unsubscribe from a subscription
		 * 
		 * @param {String}
		 *            subscriptionID A subscriptionID returned by
		 *            InlineHubClient.prototype.subscribe()
		 * @param {Function}
		 *            [onComplete] Callback function invoked when unsubscribe
		 *            completes
		 * @param {Object}
		 *            [scope] When onComplete callback function is invoked, the
		 *            JavaScript "this" keyword refers to this scope object.
		 * 
		 * @throws {OpenAjax.hub.Error.NoSubscription}
		 *             if no such subscription is found
		 * 
		 * To facilitate cleanup, it is possible to call unsubscribe even when
		 * the HubClient is in a DISCONNECTED state.
		 * 
		 * In this implementation of HubClient, this function operates
		 * SYNCHRONOUSLY. Thus, onComplete is invoked before this function
		 * returns. Developers are cautioned that in most implementations of
		 * HubClient, onComplete is invoked after this function returns.
		 */
		unsubscribe : function(subscriptionID, onComplete, scope) {
			container.unsubscribe(subscriptionID, onComplete, scope);
		},

		isConnected : function() {
			return container.isConnected();
		},

		getScope : function() {
			return scope;
		},

		getSubscriberData : function(subID) {
			return container.getSubscriberData(subID);
		},

		getSubscriberScope : function(subID) {
			return container.getSubscriberScope(subID);
		},

		/**
		 * Returns the params object associated with this Hub instance. Allows
		 * mix-in code to access parameters passed into constructor that created
		 * this Hub instance.
		 * 
		 * @returns params the params object associated with this Hub instance
		 * @type {Object}
		 */
		getParameters : function() {
			return params;
		}

	};

	return InlineHubClient;

}));