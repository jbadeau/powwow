(function(root, factory) {
	if (typeof define === 'function' && define.amd) {

		define([ '../HubClient' ], factory);
	}
	else {
		root.IframeHubClient = factory(root.HubClient);
	}
}(this, function(HubClient) {

	'use strict';

	/**
	 * Create a new IframeHubClient.
	 *
	 * @constructor
	 * @extends OpenAjax.hub.HubClient
	 *
	 * @param {Object}
	 *            params Once the constructor is called, the params object
	 *            belongs to the HubClient. The caller MUST not modify it. The
	 *            following are the pre-defined properties on params:
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
	 * @param {Boolean}
	 *            [params.IframeHubClient.requireParentVerifiable] Set to true
	 *            in order to require that this IframeHubClient use a transport
	 *            that can verify the parent Container's identity.
	 * @param {Function}
	 *            [params.IframeHubClient.seed] A function that returns a string
	 *            that will be used to seed the pseudo-random number generator,
	 *            which is used to create the security tokens. An implementation
	 *            of IframeHubClient may choose to ignore this value.
	 * @param {Number}
	 *            [params.IframeHubClient.tokenLength] Length of the security
	 *            tokens used when transmitting messages. If not specified,
	 *            defaults to 6. An implementation of IframeHubClient may choose
	 *            to ignore this value.
	 *
	 * @throws {OpenAjax.hub.Error.BadParameters}
	 *             if any of the required parameters is missing, or if a
	 *             parameter value is invalid in some way.
	 */
	function IframeHubClient(params) {
		if (!params || !params.HubClient || !params.HubClient.onSecurityAlert) {
			throw new Error(OpenAjax.hub.Error.BadParameters);
		}

		var client = this;
		var scope = params.HubClient.scope || window;
		var connected = false;
		var subs = {};
		var subIndex = 0;
		var clientID;
		// var securityToken; // XXX still need "securityToken"?

		if (params.HubClient.log) {
			var log = function(msg) {
				try {
					params.HubClient.log.call(scope, "IframeHubClient::" + clientID + ": " + msg);
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

		this._init();
	}

	IframeHubClient.prototype = {

		_init : function() {
			var urlParams = OpenAjax.gadgets.util.getUrlParameters();
			if (!urlParams.parent) {
				// The RMR transport does not require a valid relay file, but
				// does need a URL
				// in the parent's domain. The URL does not need to point to
				// valid file, so just
				// point to 'robots.txt' file. See RMR transport code for more
				// info.
				var parent = urlParams.oahParent + "/robots.txt";
				OpenAjax.gadgets.rpc.setupReceiver("..", parent);
			}

			if (params.IframeHubClient && params.IframeHubClient.requireParentVerifiable && OpenAjax.gadgets.rpc.getReceiverOrigin("..") === null) {
				// If user set 'requireParentVerifiable' to true but RPC
				// transport does not
				// support this, throw error.
				OpenAjax.gadgets.rpc.removeReceiver("..");
				throw new Error(OpenAjax.hub.Error.IncompatBrowser);
			}

			OpenAjax.hub.IframeContainer._rpcRouter.add("..", this);
			// XXX The RPC layer initializes immediately on load, in the child
			// (IframeHubClient). So it is too
// late here to specify a security token for the RPC layer. At the moment, only
// the NIX
// transport requires a child token (IFPC [aka FIM] is not supported).
// securityToken = generateSecurityToken( params, scope, log );

			clientID = OpenAjax.gadgets.rpc.RPC_ID;
			if (urlParams.oahId) {
				clientID = clientID.substring(0, clientID.lastIndexOf('_'));
			}
		},

		/** * HubClient interface ** */

		connect : function(onComplete, scope) {
			if (connected) {
				throw new Error(OpenAjax.hub.Error.Duplicate);
			}

			// connect acknowledgement
			function callback(result) {
				if (result) {
					connected = true;
					if (onComplete) {
						try {
							onComplete.call(scope || window, client, true);
						}
						catch (e) {
							OpenAjax.hub._debugger();
							log("caught error from onComplete callback to connect(): " + e.message);
						}
					}
				}
			}
			OpenAjax.gadgets.rpc.call("..", "openajax.pubsub", callback, "con");
		},

		disconnect : function(onComplete, scope) {
			if (!connected) {
				throw new Error(OpenAjax.hub.Error.Disconnected);
			}

			connected = false;

			// disconnect acknowledgement
			var callback = null;
			if (onComplete) {
				callback = function(result) {
					try {
						onComplete.call(scope || window, client, true);
					}
					catch (e) {
						OpenAjax.hub._debugger();
						log("caught error from onComplete callback to disconnect(): " + e.message);
					}
				};
			}
			OpenAjax.gadgets.rpc.call("..", "openajax.pubsub", callback, "dis");
		},

		getPartnerOrigin : function() {
			if (connected) {
				var origin = OpenAjax.gadgets.rpc.getReceiverOrigin("..");
				if (origin) {
					// remove port if present
					return (/^([a-zA-Z]+:\/\/[^:]+).*/.exec(origin)[1]);
				}
			}
			return null;
		},

		getClientID : function() {
			return clientID;
		},

		/** * Hub interface ** */

		subscribe : function(topic, onData, scope, onComplete, subscriberData) {
			assertConn();
			assertSubTopic(topic);
			if (!onData) {
				throw new Error(OpenAjax.hub.Error.BadParameters);
			}

			scope = scope || window;
			var subID = "" + subIndex++;
			subs[subID] = {
				cb : onData,
				sc : scope,
				d : subscriberData
			};

			// subscribe acknowledgement
			function callback(result) {
				if (result !== '') { // error
					delete subs[subID];
				}
				if (onComplete) {
					try {
						onComplete.call(scope, subID, result === "", result);
					}
					catch (e) {
						OpenAjax.hub._debugger();
						log("caught error from onComplete callback to subscribe(): " + e.message);
					}
				}
			}
			OpenAjax.gadgets.rpc.call("..", "openajax.pubsub", callback, "sub", topic, subID);

			return subID;
		},

		publish : function(topic, data) {
			assertConn();
			assertPubTopic(topic);
			OpenAjax.gadgets.rpc.call("..", "openajax.pubsub", null, "pub", topic, data);
		},

		unsubscribe : function(subscriptionID, onComplete, scope) {
			assertConn();
			if (!subscriptionID) {
				throw new Error(OpenAjax.hub.Error.BadParameters);
			}

			// if no such subscriptionID, or in process of unsubscribing given
			// ID, throw error
			if (!subs[subscriptionID] || subs[subscriptionID].uns) {
				throw new Error(OpenAjax.hub.Error.NoSubscription);
			}

			// unsubscribe in progress
			subs[subscriptionID].uns = true;

			// unsubscribe acknowledgement
			function callback(result) {
				delete subs[subscriptionID];
				if (onComplete) {
					try {
						onComplete.call(scope || window, subscriptionID, true);
					}
					catch (e) {
						OpenAjax.hub._debugger();
						log("caught error from onComplete callback to unsubscribe(): " + e.message);
					}
				}
			}
			OpenAjax.gadgets.rpc.call("..", "openajax.pubsub", callback, "uns", null, subscriptionID);
		},

		isConnected : function() {
			return connected;
		},

		getScope : function() {
			return scope;
		},

		getSubscriberData : function(subscriptionID) {
			assertConn();
			if (subs[subscriptionID]) {
				return subs[subscriptionID].d;
			}
			throw new Error(OpenAjax.hub.Error.NoSubscription);
		},

		getSubscriberScope : function(subscriptionID) {
			assertConn();
			if (subs[subscriptionID]) {
				return subs[subscriptionID].sc;
			}
			throw new Error(OpenAjax.hub.Error.NoSubscription);
		},

		getParameters : function() {
			return params;
		},

		/** * private functions ** */

		_handleIncomingRPC : function(command, topic, data, subscriptionID) {
			if (command === "pub") {
				// if subscription exists and we are not in process of
				// unsubscribing...
				if (subs[subscriptionID] && !subs[subscriptionID].uns) {
					try {
						subs[subscriptionID].cb.call(subs[subscriptionID].sc, topic, data, subs[subscriptionID].d);
					}
					catch (e) {
						OpenAjax.hub._debugger();
						log("caught error from onData callback to subscribe(): " + e.message);
					}
				}
			}
			// else if command === "cmd"...

			// First time this function is called, topic should be "con". This
			// is the 2nd stage of the
			// connection process. Simply need to return "true" in order to send
			// an acknowledgement
			// back to container. See finishConnect() in the container object.
			if (topic === "con") {
				return true;
			}
			return false;
		},

		_assertConn : function() {
			if (!connected) {
				throw new Error(OpenAjax.hub.Error.Disconnected);
			}
		},

		assertSubTopic : function(topic) {
			if (!topic) {
				throw new Error(OpenAjax.hub.Error.BadParameters);
			}
			var path = topic.split(".");
			var len = path.length;
			for (var i = 0; i < len; i++) {
				var p = path[i];
				if ((p === "") || ((p.indexOf("*") != -1) && (p != "*") && (p != "**"))) {
					throw new Error(OpenAjax.hub.Error.BadParameters);
				}
				if ((p == "**") && (i < len - 1)) {
					throw new Error(OpenAjax.hub.Error.BadParameters);
				}
			}
		},

		assertPubTopic : function(topic) {
			if (!topic || topic === "" || (topic.indexOf("*") != -1) || (topic.indexOf("..") != -1) || (topic.charAt(0) == ".") || (topic.charAt(topic.length - 1) == ".")) {
				throw new Error(OpenAjax.hub.Error.BadParameters);
			}
		}

	};

	return IframeHubClient;

}));