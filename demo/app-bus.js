define(function(require) {

	var msgs, exchangeDispatcher, unicastDispatcher, bus;

	msgs = require('msgs/channels/exchange');

	exchangeDispatcher = require('msgs/channels/dispatchers/exchange');

	unicastDispatcher = require('msgs/channels/dispatchers/unicast');

	hubBus = msgs.bus();

	clientBus1 = hubBus.bus();
	clientBus2 = hubBus.bus();
	clientBus3 = hubBus.bus();

	var listener = {
		handle : function(message) {
			console.debug('listener: ' + JSON.stringify(message));
		}
	}
	var listener1 = {
		handle : function(message) {
			console.debug('listener1: ' + JSON.stringify(message));
		}
	}
	var listener2 = {
		handle : function(message) {
			console.debug('listener2: ' + JSON.stringify(message));
		}
	}
	var listener3 = {
		handle : function(message) {
			console.debug('listener3: ' + JSON.stringify(message));
		}
	}

	hubBus.topicExchangeChannel('outbound');

	clientBus1.subscribe('outbound!greeting.#', listener1);
	clientBus2.subscribe('outbound!greeting.en.*', listener2);
	clientBus3.subscribe('outbound!#.fr.#', listener3);
	
	clientBus2.unsubscribe('outbound', listener2);
	
	hubBus.send('outbound!greeting.en.us', 'hello');
	// clientBus1.send('outbound!greeting', 'client1');
	// clientBus2.send('outbound!greeting', 'client2');
});