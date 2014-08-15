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
				this._bus = this._hub.newBus();
			},

			/*
			 * ---------------------------------------------------------------------
			 * powwow.hub.Container
			 * ---------------------------------------------------------------------
			 */

			init : function() {
				this._hub.addContainer(this);
				return this._importClientContent().then(this._appendClientContent.bind(this));
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
			disconnect : function(client) {
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

			unsubscribe : function(subscriptionId, onComplete, scope) {
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
						var templateNode = template.getElementById('inline');
						var shadowNode = this._parameters.InlineContainer.parent.createShadowRoot();
						var templateNodeClone = global.document.importNode(templateNode.content, true);
						shadowNode.appendChild(templateNodeClone);
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