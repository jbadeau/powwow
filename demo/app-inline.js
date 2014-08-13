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
	.then(function(hubClient) {
		console.info('hubClient ' + hubClient + ' successfully connected');
	}, function(error) {
		error.info('hubClient ' + hubClient + ' failed to connect', error);
	});

});