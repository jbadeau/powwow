(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	}
	else {
		root.HubClient = factory();
	}
}(this, function() {

	'use strict';

	/**
	 * Create a new HubClient. All HubClient constructors MUST have this
	 * signature.
	 * 
	 * @constructor
	 * 
	 * @param {Object}
	 *            params Parameters used to instantiate the HubClient. Once the
	 *            constructor is called, the params object belongs to the
	 *            HubClient. The caller MUST not modify it. Implementations of
	 *            HubClient may specify additional properties for the params
	 *            object, besides those identified below.
	 * 
	 * @param {Function}
	 *            params.HubClient.onSecurityAlert Called when an attempted
	 *            security breach is thwarted
	 * @param {Object}
	 *            [params.HubClient.scope] Whenever one of the HubClient's
	 *            callback functions is called, references to "this" in the
	 *            callback will refer to the scope object. If not provided, the
	 *            default is window.
	 * @param {Function}
	 *            [params.HubClient.log] Optional logger function. Would be used
	 *            to log to console.log or equivalent.
	 * 
	 * @throws {OpenAjax.hub.Error.BadParameters}
	 *             if any of the required parameters is missing, or if a
	 *             parameter value is invalid in some way.
	 */
	function HubClient(params) {
	}

	HubClient.prototype = {

		/**
		 * Requests a connection to the ManagedHub, via the Container associated
		 * with this HubClient.
		 * 
		 * If the Container accepts the connection request, the HubClient's
		 * state is set to CONNECTED and the HubClient invokes the onComplete
		 * callback function.
		 * 
		 * If the Container refuses the connection request, the HubClient
		 * invokes the onComplete callback function with an error code. The
		 * error code might, for example, indicate that the Container is being
		 * destroyed.
		 * 
		 * In most implementations, this function operates asynchronously, so
		 * the onComplete callback function is the only reliable way to
		 * determine when this function completes and whether it has succeeded
		 * or failed.
		 * 
		 * A client application may call HubClient.disconnect and then call
		 * HubClient.connect.
		 * 
		 * @param {Function}
		 *            [onComplete] Callback function to call when this operation
		 *            completes.
		 * @param {Object}
		 *            [scope] When the onComplete function is invoked, the
		 *            JavaScript "this" keyword refers to this scope object. If
		 *            no scope is provided, default is window.
		 * 
		 * @throws {OpenAjax.hub.Error.Duplicate}
		 *             if the HubClient is already connected
		 */
		connect : function(onComplete, scope) {
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
		 * In most implementations, this function operates asynchronously, so
		 * the onComplete callback function is the only reliable way to
		 * determine when this function completes and whether it has succeeded
		 * or failed.
		 * 
		 * A client application is allowed to call HubClient.disconnect and then
		 * call HubClient.connect.
		 * 
		 * @param {Function}
		 *            [onComplete] Callback function to call when this operation
		 *            completes.
		 * @param {Object}
		 *            [scope] When the onComplete function is invoked, the
		 *            JavaScript "this" keyword refers to the scope object. If
		 *            no scope is provided, default is window.
		 * 
		 * @throws {OpenAjax.hub.Error.Disconnected}
		 *             if the HubClient is already disconnected
		 */
		disconnect : function(onComplete, scope) {
		},

		/**
		 * If DISCONNECTED: Returns null If CONNECTED: Returns the origin
		 * associated with the window containing the Container associated with
		 * this HubClient instance. The origin has the format
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
		 * Returns the client ID of this HubClient
		 * 
		 * @returns clientID
		 * @type {String}
		 */
		getClientID : function() {
		}

	};

	return HubClient;

}));