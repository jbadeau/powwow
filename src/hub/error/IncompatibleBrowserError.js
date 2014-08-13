(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Class' ], factory);
	}
	else {
		root.powwow.hub.error.IncompatibleBrowserError = factory(root.dejavu.Class);
	}
}(this, function(Class) {

	'use strict';

	var IncompatibleBrowserError = Class.declare({

		$name : 'IncompatibleBrowserError',

		$extends : Error,

		name : 'IncompatibleBrowserError'

	});

	return IncompatibleBrowserError;

}));