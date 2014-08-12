(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	}
	else {
		root.Hub = factory();
	}
}(this, function() {

	'use strict';

	function Hub() {
	}

	Hub.prototype = {};

	return Hub;

}));