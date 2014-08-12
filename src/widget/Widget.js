(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	}
	else {
		root.Widget = factory();
	}
}(this, function() {

	'use strict';

	function Widget() {
	}

	Widget.prototype = {};

	return Widget;

}));