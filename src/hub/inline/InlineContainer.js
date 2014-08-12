(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ '../Container' ], factory);
	}
	else {
		root.InlineContainer = factory(root.Container);
	}
}(this, function(Container) {

	'use strict';

	function InlineContainer() {
	}

	InlineContainer.prototype = {};

	return InlineContainer;

}));