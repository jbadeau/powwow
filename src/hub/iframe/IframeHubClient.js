(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Class', '../HubClient' ], factory);
	}
	else {
		root.powwow.iframe.IframeHubClient = factory(root.dejavu.Class, root.powwow.hub.HubClient);
	}
}(this, function(Class, HubClient) {

	'use strict';

	var IframeHubClient = Class.declare({

		$name : 'IframeHubClient',

		$implements : HubClient,

		/**
		 * Create a new IframeHubClient.
		 *
		 * @constructor
		 *
		 * @param {Object}
		 *            params Once the constructor is called, the params object
		 *            belongs to the HubClient. The caller MUST not modify it.
		 *            The following are the pre-defined properties on params:
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
		 * @param {Function}
		 *            [params.IframeHubClient.seed] A function that returns a
		 *            string that will be used to seed the pseudo-random number
		 *            generator, which is used to create the security tokens. An
		 *            implementation of IframeHubClient may choose to ignore
		 *            this value.
		 * @param {Number}
		 *            [params.IframeHubClient.tokenLength] Length of the
		 *            security tokens used when transmitting messages. If not
		 *            specified, defaults to 6. An implementation of
		 *            IframeHubClient may choose to ignore this value.
		 *
		 * @throws {OpenAjax.hub.Error.BadParameters}
		 *             if any of the required parameters is missing, or if a
		 *             parameter value is invalid in some way.
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

	return IframeHubClient;

}));