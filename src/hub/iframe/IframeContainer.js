(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ '../Container' ], factory);
	}
	else {
		root.IframeContainer = factory(root.Container);
	}
}(this, function(Container) {

	'use strict';

	/**
	 * Create a new Iframe Container.
	 *
	 * @constructor
	 * @extends OpenAjax.hub.Container
	 *
	 * IframeContainer implements the Container interface to provide a container
	 * that isolates client components into secure sandboxes by leveraging the
	 * isolation features provided by browser iframes.
	 *
	 * SECURITY
	 *
	 * In order for the connection between the IframeContainer and
	 * IframeHubClient to be fully secure, you must specify a valid 'tunnelURI'.
	 * Note that if you do specify a 'tunnelURI', then only the WPM and NIX
	 * transports are used, covering the following browsers: IE 6+, Firefox 3+,
	 * Safari 4+, Chrome 2+, Opera 9+.
	 *
	 * If no 'tunnelURI' is specified, then some security features are disabled:
	 * the IframeContainer will not report FramePhish errors, and on some
	 * browsers IframeContainer and IframeHubClient will not be able to validate
	 * the identity of their partner (i.e. getPartnerOrigin() will return
	 * 'null'). However, not providing 'tunnelURI' allows the additional use of
	 * the RMR and FE transports -- in addition to the above browsers, the Hub
	 * code will also work on: Firefox 1 & 2, Safari 2 & 3, Chrome 1.
	 *
	 * @param {OpenAjax.hub.ManagedHub}
	 *            hub Managed Hub instance to which this Container belongs
	 * @param {String}
	 *            clientID A string ID that identifies a particular client of a
	 *            Managed Hub. Unique within the context of the ManagedHub.
	 * @param {Object}
	 *            params Parameters used to instantiate the IframeContainer.
	 *            Once the constructor is called, the params object belongs
	 *            exclusively to the IframeContainer. The caller MUST not modify
	 *            it. The following are the pre-defined properties on params:
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
	 * @param {Object}
	 *            params.IframeContainer.parent DOM element that is to be parent
	 *            of iframe
	 * @param {String}
	 *            params.IframeContainer.uri Initial Iframe URI (Container will
	 *            add parameters to this URI)
	 * @param {String}
	 *            [params.IframeContainer.clientRelay] URI of the relay file
	 *            used by the client. Must be from the same origin as
	 *            params.IframeContainer.uri. This value is only used by the
	 *            IFPC transport layer, which is primarily used by IE 6 & 7.
	 *            This value isn't required if you don't need to support those
	 *            browsers.
	 * @param {String}
	 *            [params.IframeContainer.tunnelURI] URI of the tunnel iframe.
	 *            Must be from the same origin as the page which instantiates
	 *            the IframeContainer. If not specified, connection will not be
	 *            fully secure (see SECURITY section).
	 * @param {Object}
	 *            [params.IframeContainer.iframeAttrs] Attributes to add to
	 *            IFRAME DOM entity. For example: { style: { width: "100%",
	 *            height: "100%" }, className: "some_class" }
	 * @param {Number}
	 *            [params.IframeContainer.timeout] Load timeout in milliseconds.
	 *            If not specified, defaults to 15000. If the client at
	 *            params.IframeContainer.uri does not establish a connection
	 *            with this container in the given time, the onSecurityAlert
	 *            callback is called with a LoadTimeout error code.
	 * @param {Function}
	 *            [params.IframeContainer.seed] A function that returns a string
	 *            that will be used to seed the pseudo-random number generator,
	 *            which is used to create the security tokens. An implementation
	 *            of IframeContainer may choose to ignore this value.
	 * @param {Number}
	 *            [params.IframeContainer.tokenLength] Length of the security
	 *            tokens used when transmitting messages. If not specified,
	 *            defaults to 6. An implementation of IframeContainer may choose
	 *            to ignore this value.
	 *
	 * @throws {OpenAjax.hub.Error.BadParameters}
	 *             if required params are not present or null
	 * @throws {OpenAjax.hub.Error.Duplicate}
	 *             if a Container with this clientID already exists in the given
	 *             Managed Hub
	 * @throws {OpenAjax.hub.Error.Disconnected}
	 *             if hub is not connected
	 */
	function IframeContainer(hub, clientID, params) {
		this._assertValidParams(arguments);
		this._hub = hub;
		this._clientID = clientID;
		this._params = params;
		var container = this;
		var scope = params.Container.scope || window;
		var connected = false;
		var subs = {};
		var securityToken;
		var internalID;
		var timeout = params.IframeContainer.timeout || 15000;
		var loadTimer;

		if (params.Container.log) {
			var log = function(msg) {
				try {
					params.Container.log.call(scope, "IframeContainer::" + clientID + ": " + msg);
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

	IframeContainer._rpcRouter = function() {
		var receivers = {};

		function router() {
			var r = receivers[this.f];
			if (r) {
				return r._handleIncomingRPC.apply(r, arguments);
			}
		}

		function onSecurityAlert(receiverId, error) {
			var r = receivers[receiverId];
			if (r) {
				r._onSecurityAlert.call(r, error);
			}
		}

		return {
			add : function(id, receiver) {
				function _add(id, receiver) {
					if (id === "..") {
						if (!receivers[".."]) {
							receivers[".."] = receiver;
						}
						return;
					}

					var newId = id;
					while (document.getElementById(newId)) {
						// a client with the specified ID already exists on this
						// page;
						// create a unique ID
						newId = id + '_' + ((0x7fff * Math.random()) | 0).toString(16);
					}
					;
					receivers[newId] = receiver;
					return newId;
				}

				// when this function is first called, register the RPC service
//				OpenAjax.gadgets.rpc.register("openajax.pubsub", router);
//				OpenAjax.gadgets.rpc.config({
//					securityCallback : onSecurityAlert
//				});
//
//				rpcErrorsToOAA[OpenAjax.gadgets.rpc.SEC_ERROR_LOAD_TIMEOUT] = OpenAjax.hub.SecurityAlert.LoadTimeout;
//				rpcErrorsToOAA[OpenAjax.gadgets.rpc.SEC_ERROR_FRAME_PHISH] = OpenAjax.hub.SecurityAlert.FramePhish;
//				rpcErrorsToOAA[OpenAjax.gadgets.rpc.SEC_ERROR_FORGED_MSG] = OpenAjax.hub.SecurityAlert.ForgedMsg;

				this.add = _add;
				return _add(id, receiver);
			},

			remove : function(id) {
				delete receivers[id];
			}
		};
	}();

	IframeContainer.prototype = {

		_hub : null,

		_clientID : null,

		_params : null,

		_internalID : null,

		_init : function() {
			// add to ManagedHub first, to see if clientID is a duplicate
			this._hub.addContainer(this);

			// Create an "internal" ID, which is guaranteed to be unique within
			// the
			// window, not just within the hub.
			this._internalID = IframeContainer._rpcRouter.add(this._clientID, this);
			// securityToken = generateSecurityToken(params, scope, log);

//			var relay = params.IframeContainer.clientRelay;
//			var transportName = OpenAjax.gadgets.rpc.getRelayChannel();
//			if (params.IframeContainer.tunnelURI) {
//				if (transportName !== "wpm" && transportName !== "ifpc") {
//					throw new Error(OpenAjax.hub.Error.IncompatBrowser);
//				}
//			}
//			else {
//				log("WARNING: Parameter 'IframeContaienr.tunnelURI' not specified. Connection will not be fully secure.");
//				if (transportName === "rmr" && !relay) {
//					relay = OpenAjax.gadgets.rpc.getOrigin(params.IframeContainer.uri) + "/robots.txt";
//				}
//			}

			// Create IFRAME to hold the client
			this._createIframe();

			//OpenAjax.gadgets.rpc.setupReceiver(internalID, relay);

			//startLoadTimer();
		},

		/** * OpenAjax.hub.Container interface ** */

		sendToClient : function(topic, data, subscriptionID) {
			OpenAjax.gadgets.rpc.call(internalID, "openajax.pubsub", null, "pub", topic, data, subscriptionID);
		},

		remove : function() {
			finishDisconnect();
			clearTimeout(loadTimer);
			OpenAjax.gadgets.rpc.removeReceiver(internalID);
			var iframe = document.getElementById(internalID);
			iframe.parentNode.removeChild(iframe);
			OpenAjax.hub.IframeContainer._rpcRouter.remove(internalID);
		},

		isConnected : function() {
			return connected;
		},

		getClientID : function() {
			return this._clientID;
		},

		getPartnerOrigin : function() {
			if (connected) {
				var origin = OpenAjax.gadgets.rpc.getReceiverOrigin(internalID);
				if (origin) {
					// remove port if present
					return (/^([a-zA-Z]+:\/\/[^:]+).*/.exec(origin)[1]);
				}
			}
			return null;
		},

		getParameters : function() {
			return params;
		},

		getHub : function() {
			return hub;
		},

		/** * OpenAjax.hub.IframeContainer interface ** */

		/**
		 * Get the iframe associated with this iframe container
		 *
		 * This function returns the iframe associated with an IframeContainer,
		 * allowing the Manager Application to change its size, styles,
		 * scrollbars, etc.
		 *
		 * CAUTION: The iframe is owned exclusively by the IframeContainer. The
		 * Manager Application MUST NOT destroy the iframe directly. Also, if
		 * the iframe is hidden and disconnected, the Manager Application SHOULD
		 * NOT attempt to make it visible. The Container SHOULD automatically
		 * hide the iframe when it is disconnected; to make it visible would
		 * introduce security risks.
		 *
		 * @returns iframeElement
		 * @type {Object}
		 */
		getIframe : function() {
			return document.getElementById(internalID);
		},

		/** * private functions ** */

		_assertValidParams : function(args) {
			var hub = args[0], clientID = args[1], params = args[2];
			if (!hub || !clientID || !params || !params.Container || !params.Container.onSecurityAlert || !params.IframeContainer || !params.IframeContainer.parent || !params.IframeContainer.uri) {
				throw new Error(OpenAjax.hub.Error.BadParameters);
			}
		},

		_handleIncomingRPC : function(command, topic, data) {
			switch (command) {
			// publish
			// 'data' is topic message
			case "pub":
				hub.publishForClient(container, topic, data);
				break;

			// subscribe
			// 'data' is subscription ID
			case "sub":
				var errCode = ""; // empty string is success
				try {
					subs[data] = hub.subscribeForClient(container, topic, data);
				}
				catch (e) {
					errCode = e.message;
				}
				return errCode;

				// unsubscribe
				// 'data' is subscription ID
			case "uns":
				var handle = subs[data];
				hub.unsubscribeForClient(container, handle);
				delete subs[data];
				return data;

				// connect
			case "con":
				finishConnect();
				return true;

				// disconnect
			case "dis":
				startLoadTimer();
				finishDisconnect();
				if (params.Container.onDisconnect) {
					try {
						params.Container.onDisconnect.call(scope, container);
					}
					catch (e) {
						OpenAjax.hub._debugger();
						log("caught error from onDisconnect callback to constructor: " + e.message);
					}
				}
				return true;
			}
		},

		_onSecurityAlert : function(error) {
			invokeSecurityAlert(rpcErrorsToOAA[error]);
		},

		// The RPC code requires that the 'name' attribute be properly set on
		// the
		// iframe. However, setting the 'name' property on the iframe object
		// returned from 'createElement("iframe")' doesn't work on IE --
		// 'window.name' returns null for the code within the iframe. The
		// workaround is to set the 'innerHTML' of a span to the iframe's HTML
		// code,
		// with 'name' and other attributes properly set.
		_createIframe : function() {
			//var span = document.createElement("span");
			//this._params.IframeContainer.parent.appendChild(span);

			var iframeText = '<iframe id="' + this._internalID + '" name="' + this._internalID + '" src="javascript:\'<html></html>\'"';

			// Add iframe attributes
			var styleText = '';
			var attrs = this._params.IframeContainer.iframeAttrs;
			if (attrs) {
				for ( var attr in attrs) {
					switch (attr) {
					case "style":
						for ( var style in attrs.style) {
							styleText += style + ':' + attrs.style[style] + ';';
						}
						break;
					case "className":
						iframeText += ' class="' + attrs[attr] + '"';
						break;
					default:
						iframeText += ' ' + attr + '="' + attrs[attr] + '"';
					}
				}
			}

			// initially hide IFRAME content, in order to lessen frame phishing
			// impact
			styleText += 'visibility:hidden;';
			iframeText += ' style="' + styleText + '"></iframe>';

			this._params.IframeContainer.parent.innerHTML = iframeText;

//			var tunnelText;
//			if (this._params.IframeContainer.tunnelURI) {
//				tunnelText = "&parent=" + encodeURIComponent(this._params.IframeContainer.tunnelURI) + "&forcesecure=true";
//			}
//			else {
//				tunnelText = "&oahParent=" + encodeURIComponent(OpenAjax.gadgets.rpc.getOrigin(window.location.href));
//			}
//			var idText = "";
//			if (this._internalID !== this._clientID) {
//				idText = "&oahId=" + this._internalID.substring(this._internalID.lastIndexOf('_') + 1);
//			}
			document.getElementById(this._internalID).src = this._params.IframeContainer.uri; //+ "#rpctoken=" + securityToken + tunnelText + idText;
		},

		// If the relay iframe used by RPC has not been loaded yet, then we
		// won't have unload protection
		// at this point. Since we can't detect when the relay iframe has
		// loaded, we use a two stage
		// connection process. First, the child sends a connection msg and the
		// container sends an ack.
		// Then the container sends a connection msg and the child replies with
		// an ack. Since the
		// container can only send a message if the relay iframe has loaded,
		// then we know if we get an
		// ack here that the relay iframe is ready. And we are fully connected.
		_finishConnect : function() {
			// connect acknowledgement
			function callback(result) {
				if (result) {
					connected = true;
					clearTimeout(loadTimer);
					document.getElementById(internalID).style.visibility = "visible";
					if (params.Container.onConnect) {
						try {
							params.Container.onConnect.call(scope, container);
						}
						catch (e) {
							OpenAjax.hub._debugger();
							log("caught error from onConnect callback to constructor: " + e.message);
						}
					}
				}
			}
			OpenAjax.gadgets.rpc.call(internalID, "openajax.pubsub", callback, "cmd", "con");
		},

		_finishDisconnect : function() {
			if (connected) {
				connected = false;
				document.getElementById(internalID).style.visibility = "hidden";

				// unsubscribe from all subs
				for ( var s in subs) {
					hub.unsubscribeForClient(container, subs[s]);
				}
				subs = {};
			}
		},

		_invokeSecurityAlert : function(errorMsg) {
			try {
				params.Container.onSecurityAlert.call(scope, container, errorMsg);
			}
			catch (e) {
				OpenAjax.hub._debugger();
				log("caught error from onSecurityAlert callback to constructor: " + e.message);
			}
		},

		_startLoadTimer : function() {
			loadTimer = setTimeout(function() {
				// alert the security alert callback
				invokeSecurityAlert(OpenAjax.hub.SecurityAlert.LoadTimeout);
				// don't receive any more messages from HubClient
				container._handleIncomingRPC = function() {
				};
			}, timeout);
		}

	};

	return IframeContainer;

}));