(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Class' ], factory);
	}
	else {
		root.powwow.hub.error.ForgedMessageError = factory(root.dejavu.Class);
	}
}(this, function(Class) {

	'use strict';

	var ForgedMessageError = Class.declare({

		$name : 'ForgedMessageError',

		$extends : Error,

		name : 'ForgedMessageError'

	});

	return ForgedMessageError;

}));