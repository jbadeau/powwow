(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Class' ], factory);
	}
	else {
		root.powwow.hub.error.WrongProtocolError = factory(root.dejavu.Class);
	}
}(this, function(Class) {

	'use strict';

	var WrongProtocolError = Class.declare({

		$name : 'WrongProtocolError',

		$extends : Error,

		name : 'WrongProtocolError'

	});

	return WrongProtocolError;

}));