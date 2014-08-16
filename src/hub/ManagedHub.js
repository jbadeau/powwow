define([ 'dejavu/Class', 'msgs/channels/exchange', 'msgs/channels/dispatchers/exchange', 'msgs/channels/dispatchers/unicast', './Hub', './Errors', ], function(Class, msgs, exchangeDispatcher, unicastDispatcher, Hub, Errors) {

	'use strict';

	var ManagedHub = Class.declare({

		$name : 'ManagedHub',

		$implements : Hub,

		_parameters : null,

		_containers : null,

		_subscriptionIndex : 0,

		_subscriptions : null,

		_bus : null,

		initialize : function(parameters) {
			this._parameters = parameters;
			this._containers = {};
			this._subscriptions = {};
			this._bus = msgs.bus();
			this._bus.topicExchangeChannel(Hub.CHANNEL_DEFAULT);
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

		publish : function(topic, message) {
			var channelTopic = Hub.CHANNEL_DEFAULT + '!' + topic;
			this._bus.send(channelTopic, message);
		},

		subscribe : function(topic, onMessage, configuration) {
			return new Promise(function(resolve, reject) {
				try {
					var subscriptionId = new String(this._subscriptionIndex++);
					var channelTopic = Hub.CHANNEL_DEFAULT + '!' + topic;
					var handler = {
						handle : onMessage
					};
					this._subscriptions[subscriptionId] = {
						id : subscriptionId,
						channelTopic : channelTopic,
						handler : handler
					};
					this._bus.subscribe(channelTopic, handler);
					resolve(subscriptionId);
				}
				catch (error) {
					reject(error);
				}
			}.bind(this));
		},

		unsubscribe : function(subscription) {
			this._bus.unsubscribe(subscription.channelTopic, subscription.handler);
			delete this.subscriptions[subscription.id];
		},

	/*
	 * ---------------------------------------------------------------------
	 * private
	 * ---------------------------------------------------------------------
	 */

	});

	return ManagedHub;

});