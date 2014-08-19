(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Interface' ], factory);
	}
	else {
		root.powwow.hub.ErrorMessages = factory(root.dejavu.Interface);
	}
}(this, function(Interface) {

	'use strict';

	var Errors = Interface.declare({

		$name : 'Errors',

		$constants : {

			/**
			 * Either a required argument is missing or an invalid argument was
			 * provided.
			 */
			BAD_PARAMETERS : "BAD_PARAMETERS",

			/**
			 * The specified hub has been disconnected and cannot perform the
			 * requested operation.
			 */
			DISCONNECTED : "DISCONNECTED",

			/**
			 * Container with specified ID already exists.
			 */
			DUPLICATE : "DUPLICATE",

			/**
			 * The specified ManagedHub has no such Container (or it has been
			 * removed).
			 */
			NO_CONTAINER : "NO_CONTAINER",

			/**
			 * The specified ManagedHub or Container has no such subscription.
			 */
			NO_SUBSCRIPTION : "NO_SUBSCRIPTION",

			/**
			 * Permission denied by manager's security policy.
			 */
			NOT_ALLOWED : "NOT_ALLOWED",

			/**
			 * Wrong communications protocol identifier provided by Container or
			 * HubClient.
			 */
			WRONG_PROTOCOL : "WRONG_PROTOCOL",

			/**
			 * A 'tunnelURI' param was specified, but current browser does not
			 * support security features.
			 */
			INCOMPATIBLE_BROWSER : "INCOMPATIBLE_BROWSER"

		}

	});

	return Errors;

}));