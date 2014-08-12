(function(root, factory) {
	if (typeof define === 'function' && define.amd) {

		define([ '../HubClient' ], factory);
	}
	else {
		root.InlineHubClient = factory(root.HubClient);
	}
}(this, function(HubClient) {

	function InlineHubClient() {
	}

	InlineHubClient.prototype = {};

	return InlineHubClient;

}));