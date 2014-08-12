This demonstrates a mashup app that loads an iframe container using the Hub 2.0.  The application loads a container at a give location, but the client redirects to a new location.  The client at the new location then establishes the connection to the web application.

To run this demo:
1) Place 'hub20' directory at the top level of your local HTTP server, such that http://localhost/hub20/samples/redirection/index.html is a valid path.  (Note: the demo is not actually run from that path)
2) Create virtual hosts that point to the parent directory of 'hub20'.  The necessary virtual hosts are:
	mashup.foo.bar.com
	c0.foo.bar.com
	c1.foo.bar.com
	c2.foo.bar.com
	c3.foo.bar.com
	c4.foo.bar.com
	c5.foo.bar.com
3) Run the demo from http://mashup.foo.bar.com/hub20/samples/redirection/index.html.