(function(global) {

	define([ 'dejavu/Class', '../Container', '../Hub', '../HubClient', '../Errors' ], function(Class, Container, Hub, HubClient, Errors) {

		'use strict';

		var InlineContainer = Class.declare({

			$name : 'InlineContainer',

			$implements : [ Container, Hub, HubClient ],

			_hub : null,

			_clientId : null,

			_parameters : null,

			_connected : false,

			_client : null,

			_subscriptionIndex : 0,

			_subscriptions : null,

			_bus : null,

			initialize : function(hub, clientId, parameters) {
				this._hub = hub;
				this._clientId = clientId;
				this._parameters = parameters;
				this._subscriptions = {};
				this._bus = this._hub.newBus();
			},

			/*
			 * ---------------------------------------------------------------------
			 * powwow.hub.Container
			 * ---------------------------------------------------------------------
			 */

			init : function() {
				this._hub.addContainer(this);
				return this._importClientContent()

				.then(this._appendClientContent.bind(this));
			},

			sendToClient : function(topic, data, subscriptionId) {
			},

			remove : function() {
			},

			isConnected : function() {
				return this._connected;
			},

			getClientID : function() {
				return this._clientId;
			},

			getPartnerOrigin : function() {
			},

			getParameters : function() {
				return this._parameters;
			},

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
			connect : function(client) {
				this._connected = true;
				this._client = client;
			},

			/**
			 * @see {powwow.hub.HubClient#disconnect}
			 */
			disconnect : function() {
			},

			/*
			 * ---------------------------------------------------------------------
			 * powwow.hub.Hub
			 * ---------------------------------------------------------------------
			 */

			publish : function(topic, message) {
				var channelTopic = Hub.CHANNEL_DEFAULT + '!' + topic;
				this._bus.send(channelTopic, message);
			},

			subscribe : function(topic, onMessage, configuration) {
				return new Promise(function(resolve, reject) {
					try {
						var subscriptionId = new String(this._subscriptionIndex++);
						var channelTopic = Hub.CHANNEL_DEFAULT + '!' + topic;
						var handler = {
							handle : onMessage
						};
						this._subscriptions[subscriptionId] = {
							id : subscriptionId,
							channelTopic : channelTopic,
							handler : handler
						};
						this._bus.subscribe(channelTopic, handler);
						resolve(subscriptionId);
					}
					catch (error) {
						reject(error);
					}
				}.bind(this));
			},

			unsubscribe : function(subscription) {
				this._bus.unsubscribe(subscription.channelTopic, subscription.handler);
				delete this.subscriptions[subscription.id];
			},

			/*
			 * ---------------------------------------------------------------------
			 * private
			 * ---------------------------------------------------------------------
			 */

			_importClientContent : function() {
				return new Promise(function(resolve, reject) {
					var link = global.document.createElement('link');
					link.rel = 'import';
					link.id = this._clientId;
					link.href = this.getParameters().InlineContainer.uri;
					link.onload = function(event) {
						resolve();
					};
					link.onerror = function(error) {
						reject(error);
					};
					global.document.head.appendChild(link);
				}.bind(this));
			},

			_appendClientContent : function() {
				return new Promise(function(resolve, reject) {
					try {
						var templateImport = global.document.querySelector('#' + this._clientId);
						var template = templateImport.import
						var templateNode = template.querySelector('template');
						var shadowNode = this._parameters.InlineContainer.parent.createShadowRoot();
						var templateNodeClone = global.document.importNode(templateNode.content, true);
						shadowNode.appendChild(templateNodeClone);

						// fix for browser not working with scripts in imports
						//var script = global.document.createElement('script');
						//script.src = '/powwow/bower_components/requirejs/require.js';
						//global.document.getElementsByTagName('head')[0].appendChild(script);
						//script = global.document.createElement('script');
						//script.src = '/powwow/demo/main-inline.js';
						//global.document.getElementsByTagName('head')[0].appendChild(script);
					}
					catch (error) {
						reject(error);
					}
				}.bind(this));
			}

		});

		return InlineContainer;

	});

})(this);