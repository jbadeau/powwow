This sample simulates loading a widget that must first be authenticated.  In an actual scenario, when the mashup app requests the widget URL, the server would respond with a login page instead.  Once authenticated, the login page would load the requested widget URL.

The code here loads the login page and instantiates a HubClient, which connects to the parent container in the mashup app.  Once the user authenticates, the login page then creates its own managed hub and loads the final widget page in an iframe.  The login page takes care of marshalling events between the mashup app and the widget code.

To run this demo:
1) Place 'hub20' directory at the top level of your local HTTP server, such that http://localhost/hub20/samples/login_with_intermediate_hub/index.html is a valid path.  (Note: the demo is not actually run from that path)
2) Create virtual hosts that point to the parent directory of 'hub20'.  The necessary virtual hosts are:
	mashup.foo.bar.com
	c1.foo.bar.com
3) Run the demo from http://mashup.foo.bar.com/hub20/samples/login_with_intermediate_hub/index.html.