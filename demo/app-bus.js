define(function(require) {
	
	var msgs = require('msgs');
	
	var bus = msgs.bus();
	
	var clientBus1 = msgs.bus();
	
	var clientBus2 = msgs.bus();
	
	var inbound = bus.channel('inbound');

	var outbound = bus.channel('outbound');
	
	var listener1 = {
		handle : function(message) {
			alert(1);
			console.debug(message);
		}
	};

	var listener2 = {
			handle : function(message) {
				alert(1);
				console.debug(message);
			}
		};
	
	clientBus1.subscribe(outbound, listener1);
	clientBus2.subscribe(outbound, listener2);
	
	bus.send(outbound, 'hello world');
	
});