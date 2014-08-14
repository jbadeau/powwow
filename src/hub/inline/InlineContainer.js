define([ 'dejavu/Class', '../Container', '../Errors' ], function(Class, Container, Errors) {

	'use strict';

	var InlineContainer = Class.declare({

		$name : 'InlineContainer',

		$implements : Container,

		_hub : null,

		_clientID : null,

		_parameters : null,

		_connected : false,

		_client : null,

		_subscriptionIndex : null,

		_subscriptions : null,

		_bus : null,

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
			if (!hub) {
				throw new Error(Errors.BAD_PARAMETERS);
			}
			if (!clientID) {
				throw new Error(Errors.BAD_PARAMETERS);
			}
			if (!params) {
				throw new Error(Errors.BAD_PARAMETERS);
			}
			if (!params.Container) {
				throw new Error(Errors.BAD_PARAMETERS);
			}
			if (!params.Container.onSecurityAlert) {
				throw new Error(Errors.BAD_PARAMETERS);
			}

			this._hub = hub;
			this._clientID = clientID;
			this._parameters = params;
			this._subscriptionIndex = 0;
			this._subscriptions = [];

			this._bus = this._hub.createChildBus();
		},

		/*
		 * ---------------------------------------------------------------------
		 * powwow.hub.Container
		 * ---------------------------------------------------------------------
		 */

		/**
		 * @see {powwow.hub.Container#sendToClient}
		 */
		sendToClient : function(topic, data, subscriptionID) {
			if (this._connected) {
				var sub = this._subscriptions[subscriptionID];
				sub.cb.call(sub.sc, topic, data, sub.d);
			}
		},

		/**
		 * @see {powwow.hub.Container#remove}
		 */
		remove : function() {
		},

		/**
		 * @see {powwow.hub.Container#isConnected}
		 */
		isConnected : function() {
			return this._connected;
		},

		/**
		 * @see {powwow.hub.Container#getClientID}
		 */
		getClientID : function() {
			return this._clientID;
		},

		/**
		 * @see {powwow.hub.Container#getPartnerOrigin}
		 */
		getPartnerOrigin : function() {
		},

		/**
		 * @see {powwow.hub.Container#getParameters}
		 */
		getParameters : function() {
			return this._parameters;
		},

		/**
		 * @see {powwow.hub.Container#getHub}
		 */
		getHub : function() {
			return this._hub;
		},

		/*
		 * ---------------------------------------------------------------------
		 * powwow.hub.HubClient
		 * ---------------------------------------------------------------------
		 */

		/**
		 * @see {powwow.hub.HubClient#connect}
		 */
		connect : function(hubClient) {
			return new Promise(function(resolve, reject) {
				try {
					if (this._connected) {
						throw new Error(Errors.DUPLICATE);
					}

					this._connected = true;
					this._client = hubClient;

					if (this._parameters.Container.onConnect) {
						this._parameters.Container.onConnect.call(window, this);
					}
					resolve(hubClient);
				}
				catch (error) {
					reject(error);
				}
			}.bind(this));
		},

		/**
		 * @see {powwow.hub.HubClient#disconnect}
		 */
		disconnect : function(hubClient) {
			return new Promise(function(resolve, reject) {
				try {
					if (!this._connected) {
						throw new Error(Errors.DISCONNECTED);
					}

					this.finishDisconnect();

					if (this._parameters.Container.onDisconnect) {
						this._parameters.Container.onDisconnect.call(window, this);
					}

					resolve(hubClient);
				}
				catch (error) {
					reject(error);
				}
			}.bind(this));
		},

		/*
		 * ---------------------------------------------------------------------
		 * powwow.hub.Hub
		 * ---------------------------------------------------------------------
		 */

		/**
		 * @see {powwow.hub.Hub#subscribe}
		 */
		subscribe : function(topic, onData, scope, onComplete, subscriberData) {

			return new Promise(function(resolve, reject) {
				try {
					this.assertConnection();
					if (!onData) {
						throw new Error(Errors.BAD_PARAMETERS);
					}

					var subscriptionID = "" + this._subscriptionIndex++;

					var listener = {
						handle : onData
					};

					this._subscriptions[subscriptionID] = {
						channel : 'TOPIC_EXCHANGE',
						topic : topic,
						handler : listener,
						data : subscriberData
					};

					var channelTopic = 'TOPIC_EXCHANGE!' + topic;
					
					this._bus.subscribe(channelTopic, listener);
					
					resolve(subscriptionID);
				}
				catch (error) {
					reject(error);
				}
			}.bind(this));
		},

		/**
		 * @see {powwow.hub.Hub#publish}
		 */
		publish : function(topic, data) {
			assertConn();
			assertPubTopic(topic);
			hub.publishForClient(this, topic, data);
		},

		/**
		 * @see {powwow.hub.Hub#unsubscribe}
		 */
		unsubscribe : function(subscriptionID, onComplete, scope) {
			assertConn();
			if (typeof subscriptionID === "undefined" || subscriptionID === null) {
				throw new Error(OpenAjax.hub.Error.BadParameters);
			}
			var sub = subs[subscriptionID];
			if (!sub) {
				throw new Error(OpenAjax.hub.Error.NoSubscription);
			}
			hub.unsubscribeForClient(this, sub.h);
			delete subs[subscriptionID];

			invokeOnComplete(onComplete, scope, subscriptionID, true);
		},

		/**
		 * @see {powwow.hub.Hub#getSubscriberData}
		 */
		getSubscriberData : function(subID) {
			assertConn();
			return getSubscription(subID).d;
		},

		/**
		 * @see {powwow.hub.Hub#getSubscriberScope}
		 */
		getSubscriberScope : function(subID) {
			assertConn();
			return getSubscription(subID).sc;
		},

		/*
		 * ---------------------------------------------------------------------
		 * private
		 * ---------------------------------------------------------------------
		 */
		init : function() {
			this._hub.addContainer(this);
			return this.addImport().then(this.addContent.bind(this));
		},

		addImport : function() {
			return new Promise(function(resolve, reject) {
				var link = document.createElement('link');
				link.rel = 'import';
				link.href = this.getParameters().InlineContainer.uri;
				link.onload = function(event) {
					resolve();
				};
				link.onerror = function(error) {
					reject(error);
				};
				// TODO require global document
				document.head.appendChild(link);
			}.bind(this));
		},

		addContent : function() {
			return new Promise(function(resolve, reject) {
				try {
					// TODO require global document
					// use a better link query
					var link = document.querySelector('link[rel="import"]');
					var template = link.import.querySelector('template');
					var clone = document.importNode(template.content, true);
					var shadow = this.getParameters().InlineContainer.parent.createShadowRoot();
					shadow.appendChild(clone);
				}
				catch (error) {
					reject(error);
				}
			}.bind(this));
		},

		assertConnection : function assertConn() {
			if (!this._connected) {
				throw new Error(Errors.DISCONNECTED);
			}
		},

		assertSubTopic : function(topic) {
			if (!topic) {
				throw new Error(Errors.BAD_PARAMETERS);
			}
			var path = topic.split(".");
			var len = path.length;
			for (var i = 0; i < len; i++) {
				var p = path[i];
				if ((p === "") || ((p.indexOf("*") != -1) && (p != "*") && (p != "**"))) {
					throw new Error(Errors.BAD_PARAMETERS);
				}
				if ((p == "**") && (i < len - 1)) {
					throw new Error(Errors.BAD_PARAMETERS);
				}
			}
		}

	});

	return InlineContainer;

});