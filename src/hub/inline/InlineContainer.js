(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ '../Container' ], factory);
	}
	else {
		root.InlineContainer = factory(root.Container);
	}
}(this, function(Container) {

	'use strict';

	function InlineContainer(hub, clientID, params) {
		if (!hub || !clientID || !params || !params.Container || !params.Container.onSecurityAlert) {
			throw new Error(OpenAjax.hub.Error.BadParameters);
		}

		var cbScope = params.Container.scope || window;
		var connected = false;
		var subs = [];
		var subIndex = 0;
		var client = null;

		if (params.Container.log) {
			var log = function(msg) {
				try {
					params.Container.log.call(cbScope, "InlineContainer::" + clientID + ": " + msg);
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

		this._init = function() {
			hub.addContainer(this);
		};
	}

	InlineContainer.prototype = {

		getHub : function() {
			return hub;
		},

		sendToClient : function(topic, data, subscriptionID) {
			if (connected) {
				var sub = subs[subscriptionID];
				try {
					sub.cb.call(sub.sc, topic, data, sub.d);
				}
				catch (e) {
					OpenAjax.hub._debugger();
					client._log("caught error from onData callback to HubClient.subscribe(): " + e.message);
				}
			}
		},

		remove : function() {
			if (connected) {
				finishDisconnect();
			}
		},

		isConnected : function() {
			return connected;
		},

		getClientID : function() {
			return clientID;
		},

		getPartnerOrigin : function() {
			if (connected) {
				return window.location.protocol + "//" + window.location.hostname;
			}
			return null;
		},

		getParameters : function() {
			return params;
		}

	};

	return InlineContainer;

}));