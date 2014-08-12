(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	}
	else {
		root.Container = factory();
	}
}(this, function() {

	'use strict';

	function Container() {
	}

	Container.prototype = {};

	return Container;

}));