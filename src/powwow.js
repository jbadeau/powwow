(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	}
	else if (typeof exports === 'object') {
		module.exports = factory();
	}
	else {
		root.returnExports = factory();
	}
}(this, function() {
	var powwow = {
		VERSION : '0.1.0'
	};
	return powwow;
}));