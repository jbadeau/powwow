define([ 'dejavu/Class', '../HubClient' ], function(Class, HubClient) {

	'use strict';

	var InlineHubClient = Class.declare({

		$name : 'InlineHubClient',

		$implements : HubClient,

		_parameters : null,

		_container : null,

		initialize : function(parameters) {
			this._parameters = parameters;
			this._container = parameters.InlineHubClient.container;
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
			return new Promise(function(resolve, reject) {
				try {
					this._container.connect(this);
					resolve();
				}
				catch (error) {
					reject(error);
				}
			}.bind(this));
		},

		/**
		 * @see {powwow.hub.HubClient#connect}
		 */
		disconnect : function() {
			return this._container.disconnect(this);
		},

		/**
		 * @see {powwow.hub.HubClient#getPartnerOrigin}
		 */
		getPartnerOrigin : function() {
		},

		/**
		 * @see {powwow.hub.HubClient#getClientID}
		 */
		getClientID : function() {
		},

		/*
		 * ---------------------------------------------------------------------
		 * powwow.hub.Hub
		 * ---------------------------------------------------------------------
		 */

		publish : function(topic, message) {
		},

		subscribe : function(topic, onMessage, configuration) {
			return this._container.subscribe(topic, onMessage, configuration);
		},

		unsubscribe : function(subscription) {
			return this._container.unsubscribe(unsubscribe);
		},

		isConnected : function() {
			return this._container.isConnected();
		}

	});

	return InlineHubClient;

});