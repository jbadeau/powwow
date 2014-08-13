(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Class' ], factory);
	}
	else {
		root.powwow.hub.error.FramePhishError = factory(root.dejavu.Class);
	}
}(this, function(Class) {

	'use strict';

	var FramePhishError = Class.declare({

		$name : 'FramePhishError',

		$extends : Error,

		name : 'FramePhishError'

	});

	return FramePhishError;

}));