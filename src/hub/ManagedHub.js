define([ 'dejavu/Class', 'msgs/channels/exchange', 'msgs/channels/dispatchers/exchange', 'msgs/channels/dispatchers/unicast', './Hub', './Errors', ], function(Class, msgs, exchangeDispatcher, unicastDispatcher, Hub, Errors) {

	'use strict';

	var ManagedHub = Class.declare({

		$name : 'ManagedHub',

		$implements : Hub,

		_parameters : null,

		_containers : null,

		_subscriptions : null,

		_bus : null,

		initialize : function(parameters) {
			this._parameters = parameters;
			this._containers = {};
			this._subscriptions = {};
			this._bus = msgs.bus();
			this._bus.topicExchangeChannel(this.CHANNEL_DEFAULT);
		},
		disconnect : function() {
			var containerId;
			for (containerId in this._containers) {
				this.removeContainer(this._containers[containerId]);
			}
		},

		getContainer : function(containerId) {
			var container = this._containers[containerId];
			return container ? container : null;
		},

		addContainer : function(container) {
			var containerId = container.getClientID();
			if (this._containers[containerId]) {
				throw new Error(Errors.DUPLICATE);
			}
			this._containers[containerId] = container;
		},

		removeContainer : function(container) {
			var containerId = container.getClientID();
			if (!this._containers[containerId]) {
				throw new Error(Errors.NO_CONTAINER);
			}
			container.remove();
			delete this._containers[containerId];
		},

		newBus : function() {
			return this._bus.bus();
		},

		/*
		 * ---------------------------------------------------------------------
		 * powwow.hub.Hub
		 * ---------------------------------------------------------------------
		 */

		send : function(address, message, replyHandler) {
		},

		publish : function(address, message) {
		},

		registerHandler : function(address, handler) {
		},

		unregisterHandler : function(subscription) {
		},

		/*
		 * ---------------------------------------------------------------------
		 * private
		 * ---------------------------------------------------------------------
		 */

	});

	return ManagedHub;

});