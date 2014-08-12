(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	}
	else {
		root.HubClient = factory();
	}
}(this, function() {

	function HubClient() {
	}

	HubClient.prototype = {};

	return HubClient;

}));