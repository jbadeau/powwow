define([ 'powwow/hub/inline/InlineHubClient' ], function(InlineHubClient) {

	var hubClient = new InlineHubClient({
		HubClient : {
			onSecurityAlert : function(source, alertType) {
			}
		},
		InlineHubClient : {
			container : inlineContainer
		}

	});

	hubClient.connect()

	.then(function() {
		console.info('hubClient ' + hubClient + ' successfully connected');
	})

	.then(function() {
		return hubClient.subscribe('greeting.#', function(message) {
			console.info(JSON.stringify(message));
			//console.info('received topic ' + topic + ' with published data ' + publisherData + ' and subscriber data ' + subscriberData);
		});
	})

	.then(function(subscription) {
		console.info('sucessfully subscribed to ' + subscription);
	}, function(error) {
		console.error(error)
	});

});