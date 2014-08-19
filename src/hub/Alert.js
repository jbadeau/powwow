(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Interface' ], factory);
	}
	else {
		root.powwow.hub.ErrorMessages = factory(root.dejavu.Interface);
	}
}(this, function(Interface) {

	'use strict';

	var Alerts = Interface.declare({

		$name : 'Alerts',

		$constants : {

			/**
			 * Container did not load (possible frame phishing attack).
			 */
			LOAD_TIMEOUT : "LOAD_TIMEOUT",

			/**
			 * Hub suspects a frame phishing attack against the specified
			 * container.
			 */
			FRAME_PHISH : "FRAME_PHISH",

			/**
			 * Hub detected a message forgery that purports to come to a
			 * specified container.
			 */
			FORGED_MESSAGE : "FORGED_MESSAGE"

		}

	});

	return Alerts;

}));