define([ 'dejavu/Interface' ], function(Interface) {

	'use strict';

	var Hub = Interface.declare({

		$name : 'Hub',

		$constants : {
			CHANNEL_DEFAULT : 'powwow.channel.default'
		},

		send : function(address, message, replyHandler) {
		},

		publish : function(address, message) {
		},

		registerHandler : function(address, handler) {
		},

		unregisterHandler : function(subscription) {
		}

	});

	return Hub;

});