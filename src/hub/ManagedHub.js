define([ 'dejavu/Class', './Hub', './Errors' ], function(Class, Hub, Errors) {

	'use strict';

	var ManagedHub = Class.declare({

		$name : 'ManagedHub',

		$implements : Hub,

		/**
		 * Create a new ManagedHub instance
		 * 
		 * @constructor
		 * 
		 * This constructor automatically sets the ManagedHub's state to
		 * CONNECTED.
		 * 
		 * @param {Object}
		 *            params Parameters used to instantiate the ManagedHub. Once
		 *            the constructor is called, the params object belongs
		 *            exclusively to the ManagedHub. The caller MUST not modify
		 *            it.
		 * 
		 * The params object may contain the following properties:
		 * 
		 * @param {Function}
		 *            params.onPublish Callback function that is invoked
		 *            whenever a data value published by a Container is about to
		 *            be delivered to some (possibly the same) Container. This
		 *            callback function implements a security policy; it returns
		 *            true if the delivery of the data is permitted and false if
		 *            permission is denied.
		 * @param {Function}
		 *            params.onSubscribe Called whenever a Container tries to
		 *            subscribe on behalf of its client. This callback function
		 *            implements a security policy; it returns true if the
		 *            subscription is permitted and false if permission is
		 *            denied.
		 * @param {Function}
		 *            [params.onUnsubscribe] Called whenever a Container
		 *            unsubscribes on behalf of its client. Unlike the other
		 *            callbacks, onUnsubscribe is intended only for informative
		 *            purposes, and is not used to implement a security policy.
		 * @param {Object}
		 *            [params.scope] Whenever one of the ManagedHub's callback
		 *            functions is called, references to the JavaScript "this"
		 *            keyword in the callback function refer to this scope
		 *            object If no scope is provided, default is window.
		 * @param {Function}
		 *            [params.log] Optional logger function. Would be used to
		 *            log to console.log or equivalent.
		 * 
		 * @throws {OpenAjax.hub.Error.BadParameters}
		 *             if any of the required parameters are missing
		 */
		initialize : function(params) {
			if (!params) {
				throw new Error(Errors.BAD_PARAMETERS);
			}
			if (!params.onPublish) {
				throw new Error(Errors.BAD_PARAMETERS);
			}
			if (!params.onSubscribe) {
				throw new Error(Errors.BAD_PARAMETERS);
			}
		},

		/**
		 * Subscribe to a topic on behalf of a Container. Called only by
		 * Container implementations, NOT by manager applications.
		 * 
		 * This function: 1. Checks with the ManagedHub's onSubscribe security
		 * policy to determine whether this Container is allowed to subscribe to
		 * this topic. 2. If the subscribe operation is permitted, subscribes to
		 * the topic and returns the ManagedHub's subscription ID for this
		 * subscription. 3. If the subscribe operation is not permitted, throws
		 * OpenAjax.hub.Error.NotAllowed.
		 * 
		 * When data is published on the topic, the ManagedHub's onPublish
		 * security policy will be invoked to ensure that this Container is
		 * permitted to receive the published data. If the Container is allowed
		 * to receive the data, then the Container's sendToClient function will
		 * be invoked.
		 * 
		 * When a Container needs to create a subscription on behalf of its
		 * client, the Container MUST use this function to create the
		 * subscription.
		 * 
		 * @param {OpenAjax.hub.Container}
		 *            container A Container
		 * @param {String}
		 *            topic A valid topic
		 * @param {String}
		 *            containerSubID Arbitrary string ID that the Container uses
		 *            to represent the subscription. Must be unique within the
		 *            context of the Container
		 * 
		 * @returns managerSubID Arbitrary string ID that this ManagedHub uses
		 *          to represent the subscription. Will be unique within the
		 *          context of this ManagedHub
		 * @type {String}
		 * 
		 * @throws {OpenAjax.hub.Error.Disconnected}
		 *             if this.isConnected() returns false
		 * @throws {OpenAjax.hub.Error.NotAllowed}
		 *             if subscription request is denied by the onSubscribe
		 *             security policy
		 * @throws {OpenAjax.hub.Error.BadParameters}
		 *             if one of the parameters, e.g. the topic, is invalid
		 */
		subscribeForClient : function(container, topic, containerSubID) {
		},

		/**
		 * Unsubscribe from a subscription on behalf of a Container. Called only
		 * by Container implementations, NOT by manager application code.
		 * 
		 * This function: 1. Destroys the specified subscription 2. Calls the
		 * ManagedHub's onUnsubscribe callback function
		 * 
		 * This function can be called even if the ManagedHub is not in a
		 * CONNECTED state.
		 * 
		 * @param {OpenAjax.hub.Container}
		 *            container container instance that is unsubscribing
		 * @param {String}
		 *            managerSubID opaque ID of a subscription, returned by
		 *            previous call to subscribeForClient()
		 * 
		 * @throws {OpenAjax.hub.Error.NoSubscription}
		 *             if subscriptionID does not refer to a valid subscription
		 */
		unsubscribeForClient : function(container, managerSubID) {
		},

		/**
		 * Publish data on a topic on behalf of a Container. Called only by
		 * Container implementations, NOT by manager application code.
		 * 
		 * @param {OpenAjax.hub.Container}
		 *            container Container on whose behalf data should be
		 *            published
		 * @param {String}
		 *            topic Valid topic string. Must NOT contain wildcards.
		 * @param {*}
		 *            data Valid publishable data. To be portable across
		 *            different Container implementations, this value SHOULD be
		 *            serializable as JSON.
		 * 
		 * @throws {OpenAjax.hub.Error.Disconnected}
		 *             if this.isConnected() returns false
		 * @throws {OpenAjax.hub.Error.BadParameters}
		 *             if one of the parameters, e.g. the topic, is invalid
		 */
		publishForClient : function(container, topic, data) {
		},

		/**
		 * Destroy this ManagedHub
		 * 
		 * 1. Sets state to DISCONNECTED. All subsequent attempts to add
		 * containers, publish or subscribe will throw the Disconnected error.
		 * We will continue to allow "cleanup" operations such as
		 * removeContainer and unsubscribe, as well as read-only operations such
		 * as isConnected 2. Remove all Containers associated with this
		 * ManagedHub
		 */
		disconnect : function() {
		},

		/**
		 * Get a container belonging to this ManagedHub by its clientID, or null
		 * if this ManagedHub has no such container
		 * 
		 * This function can be called even if the ManagedHub is not in a
		 * CONNECTED state.
		 * 
		 * @param {String}
		 *            containerId Arbitrary string ID associated with the
		 *            container
		 * 
		 * @returns container associated with given ID
		 * @type {OpenAjax.hub.Container}
		 */
		getContainer : function(containerId) {
		},

		/**
		 * Returns an array listing all containers belonging to this ManagedHub.
		 * The order of the Containers in this array is arbitrary.
		 * 
		 * This function can be called even if the ManagedHub is not in a
		 * CONNECTED state.
		 * 
		 * @returns container array
		 * @type {OpenAjax.hub.Container[]}
		 */
		listContainers : function() {
		},

		/**
		 * Add a container to this ManagedHub.
		 * 
		 * This function should only be called by a Container constructor.
		 * 
		 * @param {OpenAjax.hub.Container}
		 *            container A Container to be added to this ManagedHub
		 * 
		 * @throws {OpenAjax.hub.Error.Duplicate}
		 *             if there is already a Container in this ManagedHub whose
		 *             clientId is the same as that of container
		 * @throws {OpenAjax.hub.Error.Disconnected}
		 *             if this.isConnected() returns false
		 */
		addContainer : function(container) {
		},

		/**
		 * Remove a container from this ManagedHub immediately
		 * 
		 * This function can be called even if the ManagedHub is not in a
		 * CONNECTED state.
		 * 
		 * @param {OpenAjax.hub.Container}
		 *            container A Container to be removed from this ManagedHub
		 * 
		 * @throws {OpenAjax.hub.Error.NoContainer}
		 *             if no such container is found
		 */
		removeContainer : function(container) {
		},

		/**
		 * @see {powwow.hub.Hub#subscribe}
		 */
		subscribe : function(topic, onData, scope, onComplete, subscriberData) {
		},

		/**
		 * @see {powwow.hub.Hub#publish}
		 */
		publish : function(topic, data) {
		},

		/**
		 * @see {powwow.hub.Hub#unsubscribe}
		 */
		unsubscribe : function(subscriptionID, onComplete, scope) {
		},

		/**
		 * @see {powwow.hub.Hub#isConnected}
		 */
		isConnected : function() {
		},

		/**
		 * @see {powwow.hub.Hub#getScope}
		 */
		getScope : function() {
		},

		/**
		 * @see {powwow.hub.Hub#getSubscriberData}
		 */
		getSubscriberData : function(subscriptionID) {
		},

		/**
		 * @see {powwow.hub.Hub#getSubscriberScope}
		 */
		getSubscriberScope : function(subscriberID) {
		},

		/**
		 * @see {powwow.hub.Hub#getParameters}
		 */
		getParameters : function() {
		}

	});

	return ManagedHub;

});