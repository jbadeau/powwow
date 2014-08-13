define([ 'dejavu/Class', '../HubClient' ], function(Class, HubClient) {

	'use strict';

	var InlineHubClient = Class.declare({

		$name : 'InlineHubClient',

		$implements : HubClient,

		parameters : null,

		container : null,

		/**
		 * Create a new InlineHubClient.
		 * 
		 * @constructor
		 * 
		 * @param {Object}
		 *            params Parameters used to instantiate the HubClient. Once
		 *            the constructor is called, the params object belongs to
		 *            the HubClient. The caller MUST not modify it. The
		 *            following are the pre-defined properties on params:
		 * @param {Function}
		 *            params.HubClient.onSecurityAlert Called when an attempted
		 *            security breach is thwarted
		 * @param {Object}
		 *            [params.HubClient.scope] Whenever one of the HubClient's
		 *            callback functions is called, references to "this" in the
		 *            callback will refer to the scope object. If not provided,
		 *            the default is window.
		 * @param {Function}
		 *            [params.HubClient.log] Optional logger function. Would be
		 *            used to log to console.log or equivalent.
		 * @param {OpenAjax.hub.InlineContainer}
		 *            params.InlineHubClient.container Specifies the
		 *            InlineContainer to which this HubClient will connect
		 * 
		 * @throws {OpenAjax.hub.Error.BadParameters}
		 *             if any of the required parameters are missing
		 */
		initialize : function(params) {
			if (!params) {
				throw new Error(Errors.BAD_PARAMETERS);
			}
			if (!params.HubClient) {
				throw new Error(Errors.BAD_PARAMETERS);
			}
			if (!params.HubClient.onSecurityAlert) {
				throw new Error(Errors.BAD_PARAMETERS);
			}
			if (!params.InlineHubClient) {
				throw new Error(Errors.BAD_PARAMETERS);
			}
			if (!params.InlineHubClient.container) {
				throw new Error(Errors.BAD_PARAMETERS);
			}

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
			return this.container.connect(this);
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