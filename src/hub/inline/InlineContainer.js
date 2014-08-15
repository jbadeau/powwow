(function(global) {

	define([ 'dejavu/Class', '../Container', '../Errors' ], function(Class, Container, Errors) {

		'use strict';

		var InlineContainer = Class.declare({

			$name : 'InlineContainer',

			$implements : Container,

			_hub : null,

			_clientId : null,

			_parameters : null,

			_connected : false,

			_client : null,

			_subscriptionIndex : null,

			_subscriptions : null,

			_bus : null,

			initialize : function(hub, clientId, parameters) {
				this._hub = hub;
				this._clientId = clientId;
				this._parameters = parameters;
				this._subscriptionIndex = 0;
				this._subscriptions = [];
				this._bus = this._hub.createChildBus();
			},

			/*
			 * ---------------------------------------------------------------------
			 * powwow.hub.Container
			 * ---------------------------------------------------------------------
			 */

			sendToClient : function(topic, data, subscriptionID) {
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
			connect : function(hubClient) {
			},

			/**
			 * @see {powwow.hub.HubClient#disconnect}
			 */
			disconnect : function(hubClient) {
			},

			/*
			 * ---------------------------------------------------------------------
			 * powwow.hub.Hub
			 * ---------------------------------------------------------------------
			 */

			subscribe : function(topic, onData, scope, onComplete, subscriberData) {
			},

			publish : function(topic, data) {
			},

			unsubscribe : function(subscriptionID, onComplete, scope) {
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
					var link = global.document.createElement('link');
					link.rel = 'import';
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

			addContent : function() {
				return new Promise(function(resolve, reject) {
					try {
						var link = global.document.querySelector('link[rel="import"]');
						var template = link.import.querySelector('template');
						var clone = document.importNode(template.content, true);
						var shadow = this.getParameters().InlineContainer.parent.createShadowRoot();
						shadow.appendChild(clone);
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