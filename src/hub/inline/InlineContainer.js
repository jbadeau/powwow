define([ 'dejavu/Class', '../Container' ], function(Class, Container) {

	'use strict';

	var InlineContainer = Class.declare({

		$name : 'InlineContainer',

		$implements : Container,

		hub : null,

		clientID : null,

		parameters : null,

		connected : false,

		/**
		 * Create a new Inline Container.
		 * 
		 * @constructor
		 * 
		 * InlineContainer implements the Container interface to provide a
		 * container that places components within the same browser frame as the
		 * main mashup application. As such, this container does not isolate
		 * client components into secure sandboxes.
		 * 
		 * @param {OpenAjax.hub.ManagedHub}
		 *            hub Managed Hub instance to which this Container belongs
		 * @param {String}
		 *            clientID A string ID that identifies a particular client
		 *            of a Managed Hub. Unique within the context of the
		 *            ManagedHub.
		 * @param {Object}
		 *            params Parameters used to instantiate the InlineContainer.
		 *            Once the constructor is called, the params object belongs
		 *            exclusively to the InlineContainer. The caller MUST not
		 *            modify it. The following are the pre-defined properties on
		 *            params:
		 * @param {Function}
		 *            params.Container.onSecurityAlert Called when an attempted
		 *            security breach is thwarted. Function is defined as
		 *            follows: function(container, securityAlert)
		 * @param {Function}
		 *            [params.Container.onConnect] Called when the client
		 *            connects to the Managed Hub. Function is defined as
		 *            follows: function(container)
		 * @param {Function}
		 *            [params.Container.onDisconnect] Called when the client
		 *            disconnects from the Managed Hub. Function is defined as
		 *            follows: function(container)
		 * @param {Object}
		 *            [params.Container.scope] Whenever one of the Container's
		 *            callback functions is called, references to "this" in the
		 *            callback will refer to the scope object. If no scope is
		 *            provided, default is window.
		 * @param {Function}
		 *            [params.Container.log] Optional logger function. Would be
		 *            used to log to console.log or equivalent.
		 * 
		 * @throws {OpenAjax.hub.Error.BadParameters}
		 *             if required params are not present or null
		 * @throws {OpenAjax.hub.Error.Duplicate}
		 *             if a Container with this clientID already exists in the
		 *             given Managed Hub
		 * @throws {OpenAjax.hub.Error.Disconnected}
		 *             if ManagedHub is not connected
		 */
		initialize : function(hub, clientID, params) {
			if (!hub) {
				throw new Error(Errors.BAD_PARAMETERS);
			}
			if (!clientID) {
				throw new Error(Errors.BAD_PARAMETERS);
			}
			if (!params) {
				throw new Error(Errors.BAD_PARAMETERS);
			}
			if (!params.Container) {
				throw new Error(Errors.BAD_PARAMETERS);
			}
			if (!params.Container.onSecurityAlert) {
				throw new Error(Errors.BAD_PARAMETERS);
			}

			this.hub = hub;
			this.clientID = clientID;
			this.parameters = params;
		},

		/**
		 * @see {powwow.hub.Container#sendToClient}
		 */
		sendToClient : function(topic, data, containerSubscriptionId) {
		},

		/**
		 * @see {powwow.hub.Container#remove}
		 */
		remove : function() {
		},

		/**
		 * @see {powwow.hub.Container#isConnected}
		 */
		isConnected : function() {
			return this.connected;
		},

		/**
		 * @see {powwow.hub.Container#getClientID}
		 */
		getClientID : function() {
			return this.clientID;
		},

		/**
		 * @see {powwow.hub.Container#getPartnerOrigin}
		 */
		getPartnerOrigin : function() {
		},

		/**
		 * @see {powwow.hub.Container#getParameters}
		 */
		getParameters : function() {
			return this.parameters;
		},

		/**
		 * @see {powwow.hub.Container#getHub}
		 */
		getHub : function() {
			return this.hub;
		},

		init : function() {
			this.hub.addContainer(this);
			return this.addImport().then(this.addContent.bind(this));
		},

		addImport : function() {
			return new Promise(function(resolve, reject) {
				var link = document.createElement('link');
				link.rel = 'import';
				link.href = this.getParameters().InlineContainer.uri;
				link.onload = function(event) {
					resolve();
				};
				link.onerror = function(error) {
					reject(error);
				};
				// TODO require global document
				document.head.appendChild(link);
			}.bind(this));
		},

		addContent : function() {
			return new Promise(function(resolve, reject) {
				try {
					// TODO require global document
					// use a better link query
					var link = document.querySelector('link[rel="import"]');
					var template = link.import.querySelector('template');
					var clone = document.importNode(template.content, true);
					var shadow = this.getParameters().InlineContainer.parent.createShadowRoot();
					shadow.appendChild(clone);
				}
				catch (error) {
					reject(error);
				}
			}.bind(this));
		}

	});

	return InlineContainer;

});