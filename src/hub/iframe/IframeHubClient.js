(function(root, factory) {
	if (typeof define === 'function' && define.amd) {

		define([ '../HubClient' ], factory);
	}
	else {
		root.IframeHubClient = factory(root.HubClient);
	}
}(this, function(HubClient) {

	function IframeHubClient() {
	}

	IframeHubClient.prototype = {};

	return IframeHubClient;

}));