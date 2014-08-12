define([ 'powwow/hub/ManagedHub', 'powwow/hub/iframe/IframeContainer' ], function(ManagedHub, IframeContainer) {

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

	var iframeContainerNode = document.createElement("div");

	mashupNode.appendChild(iframeContainerNode);

	var iframeContainer = new IframeContainer(managedHub, "iframeClient", {
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
			uri : "iframe.html",
		}
	});

});
