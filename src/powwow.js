(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ './hub/Hub', './hub/HubClient', './hub/Container', './hub/iframe/IframeContainer', './hub/iframe/IframeHubClient', './hub/inline/InlineContainer', './hub/inline/InlineHubClient', './widget/Widget', './widget/iframe/IframeWidget', './widget/inline/InlineWidget', './widget/WidgetLoader' ], factory);
	}
	else {
		root.powwow = factory(root.Hub, root.HubClient, root.Container, root.IframeContainer, root.IframeHubClient, root.InlineContainer, root.InlineHubClient, root.Widget, root.IframeWidget, root.InlineWidget, root.WidgetLoader);
	}
}(this, function(Hub, HubClient, Container, IframeContainer, IframeHubClient, InlineContainer, InlineHubClient, Widget, IframeWidget, InlineWidget, WidgetLoader) {

	'use strict';

	var powwow = {};

	powwow.VERSION = "0.1.0";

	// hub
	powwow.hub = {};
	powwow.hub.HubClient = HubClient;
	powwow.hub.Container = Container;
	powwow.hub.iframe = {};
	powwow.hub.iframe.IframeContainer = IframeContainer;
	powwow.hub.iframe.IframeHubClient = IframeHubClient;
	powwow.hub.inline = {};
	powwow.hub.inline.InlineContainer = InlineContainer;
	powwow.hub.inline.InlineHubClient = InlineHubClient;
	powwow.hub.Hub = Hub;

	// widget
	powwow.widget = {};
	powwow.widget.Widget = Widget;
	powwow.widget.iframe = {};
	powwow.widget.iframe.IframeWidget = IframeWidget;
	powwow.widget.inline = {};
	powwow.widget.inline.InlineWidget = InlineWidget;
	powwow.widget.WidgetLoader = WidgetLoader;

	return powwow;

}));