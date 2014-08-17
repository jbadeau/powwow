define([ 'powwow/hub/inline/InlineHubClient' ], function(InlineHubClient) {

	var subscriptions = {};

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
			for(var subscriptionId in subscriptions) {
				hubClient.unsubscribe(subscriptions[subscriptionId]);
			}
		});
	})

	.then(function(subscription) {
		subscriptions[subscription.id] = subscription;
		console.info('sucessfully subscribed to ' + JSON.stringify(subscription));
	}, function(error) {
		console.error(error)
	});

});