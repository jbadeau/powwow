(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ '../Widget' ], factory);
	}
	else {
		root.IframeWidget = factory(root.Widget);
	}
}(this, function(Widget) {

	function IframeWidget() {
	}

	IframeWidget.prototype = {};

	return IframeWidget;

}));