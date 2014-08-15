define([ 'dejavu/Class', '../HubClient' ], function(Class, HubClient) {

	'use strict';

	var InlineHubClient = Class.declare({

		$name : 'InlineHubClient',

		$implements : HubClient,

		parameters : null,

		container : null,

		initialize : function(params) {
			this.container = params.InlineHubClient.container;
		},

		/*
		 * ---------------------------------------------------------------------
		 * powwow.hub.HubClient
		 * ---------------------------------------------------------------------
		 */

		/**
		 * @see {powwow.hub.HubClient#connect}
		 */
		connect : function() {
			return new Promise(function(resolve, reject) {
				try {
					this.container.connect(this);
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
			return this.container.disconnect(this);
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

		subscribe : function(topic, onData, scope, onComplete, subscriberData) {
			return this.container.subscribe(topic, onData, scope, onComplete, subscriberData);
		},

		publish : function(topic, data) {
			this.container.publish(topic, data);
		},

		unsubscribe : function(subscriptionID, onComplete, scope) {
			this.container.unsubscribe(subscriptionID, onComplete, scope);
		},

		isConnected : function() {
			return this.container.isConnected();
		},

		getScope : function() {
			return scope;
		},

		getSubscriberData : function(subID) {
			return this.container.getSubscriberData(subID);
		},

		getSubscriberScope : function(subID) {
			return this.container.getSubscriberScope(subID);
		}

	});

	return InlineHubClient;

});