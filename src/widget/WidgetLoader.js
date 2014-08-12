(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ '../hub/Hub', './iframe/IframeWidget', './inline/InlineWidget' ], factory);
	}
	else {
		root.WidgetLoader = factory(root.Hub, root.IframeWidget, root.InlineWidget);
	}
}(this, function(Hub, IframeWidget, InlineWidget) {

	function WidgetLoader() {
	}

	WidgetLoader.prototype = {};

	return WidgetLoader;

}));