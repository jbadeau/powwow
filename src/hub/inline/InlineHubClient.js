(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Class', '../HubClient' ], factory);
	}
	else {
		root.powwow.hub.inline.InlineHubClient = factory(root.dejavu.Class, root.powwow.hub.HubClient);
	}
}(this, function(Class, HubClient) {

	'use strict';

	var InlineHubClient = Class.declare({

		$name : 'InlineHubClient',

		$implements : HubClient,

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
		},

		/** ****************************************************************** */
		/** HubClient interface methods */
		/** ****************************************************************** */

		connect : function(onComplete, scope) {
		},

		disconnect : function(onComplete, scope) {
		},

		getPartnerOrigin : function() {
		},

		getClientID : function() {
		}

	});

	return InlineHubClient;

}));