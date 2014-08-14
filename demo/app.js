define([ 'powwow/hub/ManagedHub', 'powwow/hub/inline/InlineContainer', 'powwow/hub/iframe/IframeContainer' ], function(ManagedHub, InlineContainer, IframeContainer) {

	var managedHub = new ManagedHub({
		onPublish : function(topic, data, publishContainer, subscribeContainer) {
			return true;
		},
		onSubscribe : function(topic, container) {
			return true;
		},
		onUnsubscribe : function(topic, container) {
			return true;
		},
		onSecurityAlert : function onMHSecurityAlert(source, alertType) {
		}
	});

	var mashupNode = document.getElementById("mashup");

	// inline container

	var inlineContainerNode = document.createElement("div");

	mashupNode.appendChild(inlineContainerNode);

	window.inlineContainer = new InlineContainer(managedHub, "inlineClient", {
		Container : {
			onConnect : function(container) {
			},
			onDisconnect : function(container) {
			},
			onSecurityAlert : function onMHSecurityAlert(source, alertType) {
			}
		},
		InlineContainer : {
			parent : inlineContainerNode,
			uri : "/powwow/demo/index-inline.html",
		}
	});
	
	inlineContainer.init();

	// iframe container

	/*
	var iframeContainerNode = document.createElement("div");

	mashupNode.appendChild(iframeContainerNode);

	window.iframeContainer = new IframeContainer(managedHub, "iframeClient", {
		Container : {
			onConnect : function(container) {
			},
			onDisconnect : function(container) {
			},
			onSecurityAlert : function onMHSecurityAlert(source, alertType) {
			}
		},
		IframeContainer : {
			parent : iframeContainerNode,
			iframeAttrs : {
				style : {
					border : "black solid 1px"
				}
			},
			uri : "/powwow/demo/index-iframe.html",
		}
	});
	*/
	
	// publish
	setInterval(function() {
		managedHub.publish('greeting.en.us', {
			"foo" : "bar"
		});
	}, 5000);

});
