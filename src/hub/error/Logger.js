(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Interface' ], factory);
	}
	else {
		root.powwow.hub.error.Logger = factory(root.dejavu.Interface);
	}
}(this, function(Class) {

	'use strict';

	var Logger = Interface.declare({

		$name : 'Logger',

	});

	return Logger;

}));