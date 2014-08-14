define([ 'msgs/channels/exchange', 'msgs/channels/dispatchers/exchange', 'msgs/channels/dispatchers/unicast' ], function(msgs, exchangeDispatcher, unicastDispatcher) {

	var hubBus = msgs.bus();

	hubBus.topicExchangeChannel('outbound');
	
	var clientBus1 = hubBus.bus();
	var clientBus2 = hubBus.bus();
	var clientBus3 = hubBus.bus();

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

	clientBus1.subscribe('outbound!greeting.#', listener1);
	clientBus2.subscribe('outbound!greeting.en.*', listener2);
	clientBus3.subscribe('outbound!#.fr.#', listener3);

	hubBus.send('outbound!greeting.en.us', 'hello');

});