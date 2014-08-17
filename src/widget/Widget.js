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

	Widget.prototype = {

		onLoad : function() {
		},

		onUnload : function() {
		},

		publish : function() {
		},

		subscribe : function() {
		},

		unsubscribe : function() {
		}

	};

	return Widget;

}));