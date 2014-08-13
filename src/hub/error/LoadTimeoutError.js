(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Class' ], factory);
	}
	else {
		root.powwow.hub.error.DisconnectedError = factory(root.dejavu.Class);
	}
}(this, function(Class) {

	'use strict';

	var DisconnectedError = Class.declare({

		$name : 'DisconnectedError',

		$extends : Error,

		name : 'DisconnectedError'

	});

	return DisconnectedError;

}));