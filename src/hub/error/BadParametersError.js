(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Class' ], factory);
	}
	else {
		root.powwow.hub.error.BadParametersError = factory(root.dejavu.Class);
	}
}(this, function(Class) {

	'use strict';

	var BadParametersError = Class.declare({

		$name : 'BadParametersError',

		$extends : Error,

		name : 'BadParametersError'

	});

	return BadParametersError;

}));