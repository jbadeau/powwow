(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Class' ], factory);
	}
	else {
		root.powwow.hub.error.NoContainerError = factory(root.dejavu.Class);
	}
}(this, function(Class) {

	'use strict';

	var NoContainerError = Class.declare({

		$name : 'NoContainerError',

		$extends : Error,

		name : 'NoContainerError'

	});

	return NoContainerError;

}));