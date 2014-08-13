(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Class' ], factory);
	}
	else {
		root.powwow.hub.error.NotAllowedError = factory(root.dejavu.Class);
	}
}(this, function(Class) {

	'use strict';

	var NotAllowedError = Class.declare({

		$name : 'NotAllowedError',

		$extends : Error,

		name : 'NotAllowedError'

	});

	return NotAllowedError;

}));