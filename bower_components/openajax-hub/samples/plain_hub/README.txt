This demo shows the Hub 2.0 with the iframe container and manager callbacks.  Each child widget runs in a separate domain, which provides security through the browser's same-domain policy.  Only communication using the iframe container is allowed.

To run this demo:
1) Place 'hub20' directory at the top level of your local HTTP server, such that http://localhost/hub20/samples/plain_hub/index.html is a valid path.  (Note: the demo is not actually run from that path)
2) Create virtual hosts that point to the parent directory of 'hub20'.  The necessary virtual hosts are:
	mashup.foo.bar.com
	c0.foo.bar.com
	c1.foo.bar.com
	c2.foo.bar.com
	c3.foo.bar.com
	c4.foo.bar.com
	c5.foo.bar.com
3) Run the demo from http://mashup.foo.bar.com/hub20/samples/plain_hub/index.html.