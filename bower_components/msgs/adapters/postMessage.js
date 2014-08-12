(function (define) {
	'use strict';

	define(function (require) {

		var msgs = require('..');

		msgs.prototype.inboundPostMessageAdapter = function inboundPostMessageAdapter(win, opts) {
			window.addEventListener('message', this.inboundAdapter(opts.output, function (event) {
				return event.data;
			}));
		};

		msgs.prototype.outboundPostMessageAdapter = msgs.utils.optionalName(function outboundPostMessageAdapter(name, win, targetOrgin, opts) {
			return this.outboundAdapter(name, function (payload) {
				win.postMessage(payload, targetOrgin);
			}, opts);
		});

		msgs.prototype.postMessageGateway = function postMessageGateway(win, targetOrgin, opts) {
			if (opts.output) {
				this.outboundPostMessageAdapter(win, targetOrgin, opts);
			}
			if (opts.input) {
				this.inboundPostMessageAdapter(win, opts);
			}
		};

		return msgs;

	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
