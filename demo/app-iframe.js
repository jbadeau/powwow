define([ 'powwow/hub/iframe/IframeHubClient' ], function(IframeHubClient) {

	var hubClient = new IframeHubClient({
		HubClient : {
			onSecurityAlert : function(source, alertType) {
			}
		}
	});

	hubClient.connect(function(hubClient, success, error) {
		if (success) {
		}
	});

});
