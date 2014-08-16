define([ 'dejavu/Interface' ], function(Interface) {

	'use strict';

	var Hub = Interface.declare({

		$name : 'Hub',

		$constants : {
			CHANNEL_DEFAULT : 'powwow.channel.default'
		},

		publish : function(topic, message) {
		},

		subscribe : function(topic, onMessage, configuration) {
		},

		unsubscribe : function(subscription) {
		}

	});

	return Hub;

});