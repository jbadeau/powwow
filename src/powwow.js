(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	}
	else if (typeof exports === 'object') {
		module.exports = factory();
	}
	else {
		root.powwow = factory();
	}
}(this, function() {
	var powwow = {};
	return powwow;
}));