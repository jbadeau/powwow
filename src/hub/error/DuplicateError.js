(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Class' ], factory);
	}
	else {
		root.powwow.hub.error.DuplicateError = factory(root.dejavu.Class);
	}
}(this, function(Class) {

	'use strict';

	var DuplicateError = Class.declare({

		$name : 'DuplicateError',

		$extends : Error,

		name : 'DuplicateError'

	});

	return DuplicateError;

}));