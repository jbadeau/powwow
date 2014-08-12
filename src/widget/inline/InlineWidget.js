(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ '../Widget' ], factory);
	}
	else {
		root.InlineWidget = factory(root.Widget);
	}
}(this, function(Widget) {

	function InlineWidget() {
	}

	InlineWidget.prototype = {};

	return InlineWidget;

}));