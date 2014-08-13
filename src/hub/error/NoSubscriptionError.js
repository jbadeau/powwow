(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Class' ], factory);
	}
	else {
		root.powwow.hub.error.NoSubscriptionError = factory(root.dejavu.Class);
	}
}(this, function(Class) {

	'use strict';

	var NoSubscriptionError = Class.declare({

		$name : 'NoSubscriptionError',

		$extends : Error,

		name : 'NoSubscriptionError'

	});

	return NoSubscriptionError;

}));