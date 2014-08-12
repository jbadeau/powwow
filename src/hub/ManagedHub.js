(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ './Hub' ], factory);
	}
	else {
		root.ManagedHub = factory(root.Hub);
	}
}(this, function(Hub) {

	'use strict';

	/**
	 * Create a new ManagedHub instance
	 *
	 * @constructor
	 *
	 * This constructor automatically sets the ManagedHub's state to CONNECTED.
	 *
	 * @param {Object}
	 *            params Parameters used to instantiate the ManagedHub. Once the
	 *            constructor is called, the params object belongs exclusively
	 *            to the ManagedHub. The caller MUST not modify it.
	 *
	 * The params object may contain the following properties:
	 *
	 * @param {Function}
	 *            params.onPublish Callback function that is invoked whenever a
	 *            data value published by a Container is about to be delivered
	 *            to some (possibly the same) Container. This callback function
	 *            implements a security policy; it returns true if the delivery
	 *            of the data is permitted and false if permission is denied.
	 * @param {Function}
	 *            params.onSubscribe Called whenever a Container tries to
	 *            subscribe on behalf of its client. This callback function
	 *            implements a security policy; it returns true if the
	 *            subscription is permitted and false if permission is denied.
	 * @param {Function}
	 *            [params.onUnsubscribe] Called whenever a Container
	 *            unsubscribes on behalf of its client. Unlike the other
	 *            callbacks, onUnsubscribe is intended only for informative
	 *            purposes, and is not used to implement a security policy.
	 * @param {Object}
	 *            [params.scope] Whenever one of the ManagedHub's callback
	 *            functions is called, references to the JavaScript "this"
	 *            keyword in the callback function refer to this scope object If
	 *            no scope is provided, default is window.
	 * @param {Function}
	 *            [params.log] Optional logger function. Would be used to log to
	 *            console.log or equivalent.
	 *
	 * @throws {ManagedHub.error.BadParameters}
	 *             if any of the required parameters are missing
	 */
	function ManagedHub(params) {
		if (!params || !params.onPublish || !params.onSubscribe)
			throw new Error(ManagedHub.error.BadParameters);

		this._p = params;
		this._onUnsubscribe = params.onUnsubscribe ? params.onUnsubscribe : null;
		this._scope = params.scope || window;

		if (params.log) {
			var that = this;
			this._log = function(msg) {
				try {
					params.log.call(that._scope, "ManagedHub: " + msg);
				}
				catch (e) {
					console.error(e);
				}
			};
		}
		else {
			this._log = function() {
			};
		}

		this._subscriptions = {
			c : {},
			s : null
		};
		this._containers = {};

		// Sequence # used to create IDs that are unique within this hub
		this._seq = 0;

		this._active = true;

		this._isPublishing = false;
		this._pubQ = [];
	}

	/**
	 * Error
	 *
	 * Standard Error names used when the standard functions need to throw
	 * Errors.
	 */
	ManagedHub.error = {

		/**
		 * // Either a required argument is missing or an invalid argument was //
		 * provided
		 */
		BadParameters : "powwow.hub.Error.BadParameters",

		/**
		 * The specified hub has been disconnected and cannot perform the
		 * requested operation:
		 */
		Disconnected : "powwow.hub.Error.Disconnected",

		/**
		 * Container with specified ID already exists:
		 */
		Duplicate : "powwow.hub.Error.Duplicate",

		/**
		 * The specified ManagedHub has no such Container (or it has been
		 * removed)
		 */
		NoContainer : "powwow.hub.Error.NoContainer",

		/**
		 * The specified ManagedHub or Container has no such subscription
		 */
		NoSubscription : "powwow.hub.Error.NoSubscription",

		/**
		 * Permission denied by manager's security policy
		 */
		NotAllowed : "powwow.hub.Error.NotAllowed",

		/**
		 * Wrong communications protocol identifier provided by Container or
		 * HubClient
		 */
		WrongProtocol : "powwow.hub.Error.WrongProtocol",

		/**
		 * A 'tunnelURI' param was specified, but current browser does not
		 * support security features
		 */
		IncompatBrowser : "powwow.hub.Error.IncompatBrowser"
	};

	/**
	 * SecurityAlert
	 *
	 * Standard codes used when attempted security violations are detected.
	 * Unlike Errors, these codes are not thrown as exceptions but rather passed
	 * into the SecurityAlertHandler function registered with the Hub instance.
	 */
	ManagedHub.securityAlert = {

		/**
		 * Container did not load (possible frame phishing attack)
		 */
		LoadTimeout : "powwow.hub.SecurityAlert.LoadTimeout",

		/**
		 * Hub suspects a frame phishing attack against the specified container
		 */
		FramePhish : "powwow.hub.SecurityAlert.FramePhish",

		/**
		 * Hub detected a message forgery that purports to come to a specified
		 * container.
		 */
		ForgedMsg : "powwow.hub.SecurityAlert.ForgedMsg"

	};

	ManagedHub.prototype = {

		/**
		 * Subscribe to a topic on behalf of a Container. Called only by
		 * Container implementations, NOT by manager applications.
		 *
		 * This function: 1. Checks with the ManagedHub's onSubscribe security
		 * policy to determine whether this Container is allowed to subscribe to
		 * this topic. 2. If the subscribe operation is permitted, subscribes to
		 * the topic and returns the ManagedHub's subscription ID for this
		 * subscription. 3. If the subscribe operation is not permitted, throws
		 * ManagedHub.error.NotAllowed.
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
		 * @throws {ManagedHub.error.Disconnected}
		 *             if this.isConnected() returns false
		 * @throws {ManagedHub.error.NotAllowed}
		 *             if subscription request is denied by the onSubscribe
		 *             security policy
		 * @throws {ManagedHub.error.BadParameters}
		 *             if one of the parameters, e.g. the topic, is invalid
		 */
		subscribeForClient : function(container, topic, containerSubID) {
			this._assertConn();
			// check subscribe permission
			if (this._invokeOnSubscribe(topic, container)) {
				// return ManagedHub's subscriptionID for this subscription
				return this._subscribe(topic, this._sendToClient, this, {
					c : container,
					sid : containerSubID
				});
			}
			throw new Error(ManagedHub.error.NotAllowed);
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
		 * @throws {ManagedHub.error.NoSubscription}
		 *             if subscriptionID does not refer to a valid subscription
		 */
		unsubscribeForClient : function(container, managerSubID) {
			this._unsubscribe(managerSubID);
			this._invokeOnUnsubscribe(container, managerSubID);
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
		 * @throws {ManagedHub.error.Disconnected}
		 *             if this.isConnected() returns false
		 * @throws {ManagedHub.error.BadParameters}
		 *             if one of the parameters, e.g. the topic, is invalid
		 */
		publishForClient : function(container, topic, data) {
			this._assertConn();
			this._publish(topic, data, container);
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
			this._active = false;
			for ( var c in this._containers) {
				this.removeContainer(this._containers[c]);
			}
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
			var container = this._containers[containerId];
			return container ? container : null;
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
			var res = [];
			for ( var c in this._containers) {
				res.push(this._containers[c]);
			}
			return res;
		},

		/**
		 * Add a container to this ManagedHub.
		 *
		 * This function should only be called by a Container constructor.
		 *
		 * @param {OpenAjax.hub.Container}
		 *            container A Container to be added to this ManagedHub
		 *
		 * @throws {ManagedHub.error.Duplicate}
		 *             if there is already a Container in this ManagedHub whose
		 *             clientId is the same as that of container
		 * @throws {ManagedHub.error.Disconnected}
		 *             if this.isConnected() returns false
		 */
		addContainer : function(container) {
			this._assertConn();
			var containerId = container.getClientID();
			if (this._containers[containerId]) {
				throw new Error(ManagedHub.error.Duplicate);
			}
			this._containers[containerId] = container;
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
		 * @throws {ManagedHub.error.NoContainer}
		 *             if no such container is found
		 */
		removeContainer : function(container) {
			var containerId = container.getClientID();
			if (!this._containers[containerId]) {
				throw new Error(ManagedHub.error.NoContainer);
			}
			container.remove();
			delete this._containers[containerId];
		},

		/** * OpenAjax.hub.Hub interface implementation ** */

		/**
		 * Subscribe to a topic.
		 *
		 * This implementation of Hub.subscribe is synchronous. When subscribe
		 * is called:
		 *
		 * 1. The ManagedHub's onSubscribe callback is invoked. The container
		 * parameter is null, because the manager application, rather than a
		 * container, is subscribing. 2. If onSubscribe returns true, then the
		 * subscription is created. 3. The onComplete callback is invoked. 4.
		 * Then this function returns.
		 *
		 * @param {String}
		 *            topic A valid topic string. MAY include wildcards.
		 * @param {Function}
		 *            onData Callback function that is invoked whenever an event
		 *            is published on the topic
		 * @param {Object}
		 *            [scope] When onData callback or onComplete callback is
		 *            invoked, the JavaScript "this" keyword refers to this
		 *            scope object. If no scope is provided, default is window.
		 * @param {Function}
		 *            [onComplete] Invoked to tell the client application
		 *            whether the subscribe operation succeeded or failed.
		 * @param {*}
		 *            [subscriberData] Client application provides this data,
		 *            which is handed back to the client application in the
		 *            subscriberData parameter of the onData and onComplete
		 *            callback functions.
		 *
		 * @returns subscriptionID Identifier representing the subscription.
		 *          This identifier is an arbitrary ID string that is unique
		 *          within this Hub instance
		 * @type {String}
		 *
		 * @throws {ManagedHub.error.Disconnected}
		 *             if this Hub instance is not in CONNECTED state
		 * @throws {ManagedHub.error.BadParameters}
		 *             if the topic is invalid (e.g. contains an empty token)
		 */
		subscribe : function(topic, onData, scope, onComplete, subscriberData) {
			this._assertConn();
			this._assertSubTopic(topic);
			if (!onData) {
				throw new Error(ManagedHub.error.BadParameters);
			}

			scope = scope || window;

			// check subscribe permission
			if (!this._invokeOnSubscribe(topic, null)) {
				this._invokeOnComplete(onComplete, scope, null, false, ManagedHub.error.NotAllowed);
				return;
			}

			// on publish event, check publish permissions
			var that = this;
			function publishCB(topic, data, sd, pcont) {
				if (that._invokeOnPublish(topic, data, pcont, null)) {
					try {
						onData.call(scope, topic, data, subscriberData);
					}
					catch (e) {
						OpenAjax.hub._debugger();
						that._log("caught error from onData callback to Hub.subscribe(): " + e.message);
					}
				}
			}
			var subID = this._subscribe(topic, publishCB, scope, subscriberData);
			this._invokeOnComplete(onComplete, scope, subID, true);
			return subID;
		},

		/**
		 * Publish an event on a topic
		 *
		 * This implementation of Hub.publish is synchronous. When publish is
		 * called:
		 *
		 * 1. The target subscriptions are identified. 2. For each target
		 * subscription, the ManagedHub's onPublish callback is invoked. Data is
		 * only delivered to a target subscription if the onPublish callback
		 * returns true. The pcont parameter of the onPublish callback is null.
		 * This is because the ManagedHub, rather than a container, is
		 * publishing the data.
		 *
		 * @param {String}
		 *            topic A valid topic string. MUST NOT include wildcards.
		 * @param {*}
		 *            data Valid publishable data. To be portable across
		 *            different Container implementations, this value SHOULD be
		 *            serializable as JSON.
		 *
		 * @throws {ManagedHub.error.Disconnected}
		 *             if this Hub instance is not in CONNECTED state
		 * @throws {ManagedHub.error.BadParameters}
		 *             if the topic cannot be published (e.g. contains wildcards
		 *             or empty tokens) or if the data cannot be published (e.g.
		 *             cannot be serialized as JSON)
		 */
		publish : function(topic, data) {
			this._assertConn();
			this._assertPubTopic(topic);
			this._publish(topic, data, null);
		},

		/**
		 * Unsubscribe from a subscription
		 *
		 * This implementation of Hub.unsubscribe is synchronous. When
		 * unsubscribe is called:
		 *
		 * 1. The subscription is destroyed. 2. The ManagedHub's onUnsubscribe
		 * callback is invoked, if there is one. 3. The onComplete callback is
		 * invoked. 4. Then this function returns.
		 *
		 * @param {String}
		 *            subscriptionID A subscriptionID returned by
		 *            Hub.subscribe()
		 * @param {Function}
		 *            [onComplete] Callback function invoked when unsubscribe
		 *            completes
		 * @param {Object}
		 *            [scope] When onComplete callback function is invoked, the
		 *            JavaScript "this" keyword refers to this scope object. If
		 *            no scope is provided, default is window.
		 *
		 * @throws {ManagedHub.error.Disconnected}
		 *             if this Hub instance is not in CONNECTED state
		 * @throws {ManagedHub.error.NoSubscription}
		 *             if no such subscription is found
		 */
		unsubscribe : function(subscriptionID, onComplete, scope) {
			this._assertConn();
			if (!subscriptionID) {
				throw new Error(ManagedHub.error.BadParameters);
			}
			this._unsubscribe(subscriptionID);
			this._invokeOnUnsubscribe(null, subscriptionID);
			this._invokeOnComplete(onComplete, scope, subscriptionID, true);
		},

		/**
		 * Returns true if disconnect() has NOT been called on this ManagedHub,
		 * else returns false
		 *
		 * @returns Boolean
		 * @type {Boolean}
		 */
		isConnected : function() {
			return this._active;
		},

		/**
		 * Returns the scope associated with this Hub instance and which will be
		 * used with callback functions.
		 *
		 * This function can be called even if the Hub is not in a CONNECTED
		 * state.
		 *
		 * @returns scope object
		 * @type {Object}
		 */
		getScope : function() {
			return this._scope;
		},

		/**
		 * Returns the subscriberData parameter that was provided when
		 * Hub.subscribe was called.
		 *
		 * @param subscriberID
		 *            The subscriberID of a subscription
		 *
		 * @returns subscriberData
		 * @type {*}
		 *
		 * @throws {ManagedHub.error.Disconnected}
		 *             if this Hub instance is not in CONNECTED state
		 * @throws {ManagedHub.error.NoSubscription}
		 *             if there is no such subscription
		 */
		getSubscriberData : function(subscriberID) {
			this._assertConn();
			var path = subscriberID.split(".");
			var sid = path.pop();
			var sub = this._getSubscriptionObject(this._subscriptions, path, 0, sid);
			if (sub)
				return sub.data;
			throw new Error(ManagedHub.error.NoSubscription);
		},

		/**
		 * Returns the scope associated with a specified subscription. This
		 * scope will be used when invoking the 'onData' callback supplied to
		 * Hub.subscribe().
		 *
		 * @param subscriberID
		 *            The subscriberID of a subscription
		 *
		 * @returns scope
		 * @type {*}
		 *
		 * @throws {ManagedHub.error.Disconnected}
		 *             if this Hub instance is not in CONNECTED state
		 * @throws {ManagedHub.error.NoSubscription}
		 *             if there is no such subscription
		 */
		getSubscriberScope : function(subscriberID) {
			this._assertConn();
			var path = subscriberID.split(".");
			var sid = path.pop();
			var sub = this._getSubscriptionObject(this._subscriptions, path, 0, sid);
			if (sub)
				return sub.scope;
			throw new Error(ManagedHub.error.NoSubscription);
		},

		/**
		 * Returns the params object associated with this Hub instance. Allows
		 * mix-in code to access parameters passed into constructor that created
		 * this Hub instance.
		 *
		 * @returns params the params object associated with this Hub instance
		 * @type {Object}
		 */
		getParameters : function() {
			return this._p;
		},

		/* PRIVATE FUNCTIONS */

		/**
		 * Send a message to a container's client. This is an OAH subscriber's
		 * data callback. It is private to ManagedHub and serves as an adapter
		 * between the OAH 1.0 API and Container.sendToClient.
		 *
		 * @param {String}
		 *            topic Topic on which data was published
		 * @param {Object}
		 *            data Data to be delivered to the client
		 * @param {Object}
		 *            sd Object containing properties c: container to which data
		 *            must be sent sid: subscription ID within that container
		 * @param {Object}
		 *            pcont Publishing container, or null if this data was
		 *            published by the manager
		 */
		_sendToClient : function(topic, data, sd, pcont) {
			if (!this.isConnected()) {
				return;
			}
			if (this._invokeOnPublish(topic, data, pcont, sd.c)) {
				sd.c.sendToClient(topic, data, sd.sid);
			}
		},

		_assertConn : function() {
			if (!this.isConnected()) {
				throw new Error(ManagedHub.error.Disconnected);
			}
		},

		_assertPubTopic : function(topic) {
			if (!topic || topic === "" || (topic.indexOf("*") != -1) || (topic.indexOf("..") != -1) || (topic.charAt(0) == ".") || (topic.charAt(topic.length - 1) == ".")) {
				throw new Error(ManagedHub.error.BadParameters);
			}
		},

		_assertSubTopic : function(topic) {
			if (!topic) {
				throw new Error(ManagedHub.error.BadParameters);
			}
			var path = topic.split(".");
			var len = path.length;
			for (var i = 0; i < len; i++) {
				var p = path[i];
				if ((p === "") || ((p.indexOf("*") != -1) && (p != "*") && (p != "**"))) {
					throw new Error(ManagedHub.error.BadParameters);
				}
				if ((p == "**") && (i < len - 1)) {
					throw new Error(ManagedHub.error.BadParameters);
				}
			}
		},

		_invokeOnComplete : function(func, scope, item, success, errorCode) {
			if (func) { // onComplete is optional
				try {
					scope = scope || window;
					func.call(scope, item, success, errorCode);
				}
				catch (e) {
					OpenAjax.hub._debugger();
					this._log("caught error from onComplete callback: " + e.message);
				}
			}
		},

		_invokeOnPublish : function(topic, data, pcont, scont) {
			try {
				return this._p.onPublish.call(this._scope, topic, data, pcont, scont);
			}
			catch (e) {
				OpenAjax.hub._debugger();
				this._log("caught error from onPublish callback to constructor: " + e.message);
			}
			return false;
		},

		_invokeOnSubscribe : function(topic, container) {
			try {
				return this._p.onSubscribe.call(this._scope, topic, container);
			}
			catch (e) {
				OpenAjax.hub._debugger();
				this._log("caught error from onSubscribe callback to constructor: " + e.message);
			}
			return false;
		},

		_invokeOnUnsubscribe : function(container, managerSubID) {
			if (this._onUnsubscribe) {
				var topic = managerSubID.slice(0, managerSubID.lastIndexOf("."));
				try {
					this._onUnsubscribe.call(this._scope, topic, container);
				}
				catch (e) {
					OpenAjax.hub._debugger();
					this._log("caught error from onUnsubscribe callback to constructor: " + e.message);
				}
			}
		},

		_subscribe : function(topic, onData, scope, subscriberData) {
			var handle = topic + "." + this._seq;
			var sub = {
				scope : scope,
				cb : onData,
				data : subscriberData,
				sid : this._seq++
			};
			var path = topic.split(".");
			this._recursiveSubscribe(this._subscriptions, path, 0, sub);
			return handle;
		},

		_recursiveSubscribe : function(tree, path, index, sub) {
			var token = path[index];
			if (index == path.length) {
				sub.next = tree.s;
				tree.s = sub;
			}
			else {
				if (typeof tree.c == "undefined") {
					tree.c = {};
				}
				if (typeof tree.c[token] == "undefined") {
					tree.c[token] = {
						c : {},
						s : null
					};
					this._recursiveSubscribe(tree.c[token], path, index + 1, sub);
				}
				else {
					this._recursiveSubscribe(tree.c[token], path, index + 1, sub);
				}
			}
		},

		_publish : function(topic, data, pcont) {
			// if we are currently handling a publish event, then queue this
			// request
			// and handle later, one by one
			if (this._isPublishing) {
				this._pubQ.push({
					t : topic,
					d : data,
					p : pcont
				});
				return;
			}

			this._safePublish(topic, data, pcont);

			while (this._pubQ.length > 0) {
				var pub = this._pubQ.shift();
				this._safePublish(pub.t, pub.d, pub.p);
			}
		},

		_safePublish : function(topic, data, pcont) {
			this._isPublishing = true;
			var path = topic.split(".");
			this._recursivePublish(this._subscriptions, path, 0, topic, data, pcont);
			this._isPublishing = false;
		},

		_recursivePublish : function(tree, path, index, name, msg, pcont) {
			if (typeof tree != "undefined") {
				var node;
				if (index == path.length) {
					node = tree;
				}
				else {
					this._recursivePublish(tree.c[path[index]], path, index + 1, name, msg, pcont);
					this._recursivePublish(tree.c["*"], path, index + 1, name, msg, pcont);
					node = tree.c["**"];
				}
				if (typeof node != "undefined") {
					var sub = node.s;
					while (sub) {
						var sc = sub.scope;
						var cb = sub.cb;
						var d = sub.data;
						if (typeof cb == "string") {
							// get a function object
							cb = sc[cb];
						}
						cb.call(sc, name, msg, d, pcont);
						sub = sub.next;
					}
				}
			}
		},

		_unsubscribe : function(subscriptionID) {
			var path = subscriptionID.split(".");
			var sid = path.pop();
			if (!this._recursiveUnsubscribe(this._subscriptions, path, 0, sid)) {
				throw new Error(ManagedHub.error.NoSubscription);
			}
		},

		/**
		 * @returns 'true' if properly unsubscribed; 'false' otherwise
		 */
		_recursiveUnsubscribe : function(tree, path, index, sid) {
			if (typeof tree == "undefined") {
				return false;
			}

			if (index < path.length) {
				var childNode = tree.c[path[index]];
				if (!childNode) {
					return false;
				}
				this._recursiveUnsubscribe(childNode, path, index + 1, sid);
				if (!childNode.s) {
					for ( var x in childNode.c) {
						return true;
					}
					delete tree.c[path[index]];
				}
			}
			else {
				var sub = tree.s;
				var sub_prev = null;
				var found = false;
				while (sub) {
					if (sid == sub.sid) {
						found = true;
						if (sub == tree.s) {
							tree.s = sub.next;
						}
						else {
							sub_prev.next = sub.next;
						}
						break;
					}
					sub_prev = sub;
					sub = sub.next;
				}
				if (!found) {
					return false;
				}
			}

			return true;
		},

		_getSubscriptionObject : function(tree, path, index, sid) {
			if (typeof tree != "undefined") {
				if (index < path.length) {
					var childNode = tree.c[path[index]];
					return this._getSubscriptionObject(childNode, path, index + 1, sid);
				}

				var sub = tree.s;
				while (sub) {
					if (sid == sub.sid) {
						return sub;
					}
					sub = sub.next;
				}
			}
			return null;
		}

	};

	return ManagedHub;

}));