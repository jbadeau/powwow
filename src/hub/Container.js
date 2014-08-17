(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'dejavu/Interface' ], factory);
	}
	else {
		root.powwow.hub.Container = factory(root.dejavu.Interface);
	}
}(this, function(Interface) {

	'use strict';

	var Container = Interface.declare({

		$name : 'Container',

		sendToClient : function(topic, data, containerSubscriptionId) {
		},

		remove : function() {
		},

		isConnected : function() {
		},

		getClientID : function() {
		},

		getPartnerOrigin : function() {
		},

		getParameters : function() {
		},

		getHub : function() {
		}

	});

	return Container;

}));