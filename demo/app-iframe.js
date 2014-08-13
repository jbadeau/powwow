define([ 'powwow/hub/iframe/IframeHubClient' ], function(IframeHubClient) {

	var hubClient = new IframeHubClient({
		HubClient : {
			onSecurityAlert : function(source, alertType) {
			}
		}
	});

	hubClient.connect()
	.then(function(hubClient) {
		console.info('hubClient ' + hubClient + ' successfully connected');
	}, function(error) {
		error.info('hubClient ' + hubClient + ' failed to connect', error);
	});

});
