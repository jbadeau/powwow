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

	hubClient.connect().then(function(hubClient) {
		console.info('hubClient ' + hubClient + ' successfully connected');
		return hubClient;
	})

	.then(function(hubClient) {
		return hubClient.subscribe('org.example.topics.textmessage', function onData(topic, publisherData, subscriberData) {
			console.info('received topic ' + topic + ' with published data ' + publisherData + ' and subscriber data ' + subscriberData);
		});
	})

	.then(function(subscription) {
		console.info('sucessfully subscribed to ' + subscription);
	}, function(error) {
		console.error(error)
	});

});