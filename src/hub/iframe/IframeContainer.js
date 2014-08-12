(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ '../Container' ], factory);
	}
	else {
		root.IframeContainer = factory(root.Container);
	}
}(this, function(Container) {

	'use strict';

	function IframeContainer() {
	}

	IframeContainer.prototype = {};

	return IframeContainer;

}));