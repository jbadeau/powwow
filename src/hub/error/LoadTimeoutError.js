(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Class' ], factory);
	}
	else {
		root.powwow.hub.error.LoadTimeoutError = factory(root.dejavu.Class);
	}
}(this, function(Class) {

	'use strict';

	var LoadTimeoutError = Class.declare({

		$name : 'LoadTimeoutError',

		$extends : Error,

		name : 'LoadTimeoutError'

	});

	return LoadTimeoutError;

}));