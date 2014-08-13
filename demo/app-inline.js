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

	hubClient.connect(function(hubClient, success, error) {
		if (success) {
		}
	});

});