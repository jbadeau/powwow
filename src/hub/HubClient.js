(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Interface' ], factory);
	}
	else {
		root.powwow.hub.HubClient = factory(root.dejavu.Interface);
	}
}(this, function(Interface) {

	'use strict';

	var HubClient = Interface.declare({

		$name : 'HubClient',

		connect : function() {
		},

		disconnect : function() {
		},

		getPartnerOrigin : function() {
		},

		getClientID : function() {
		}

	});

	return HubClient;

}));