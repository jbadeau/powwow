SETUP
-----

1. Check out the 'gadgets', 'hub20' and 'repository' code and place on your
server.

2. Inside the 'hub20' directory, run "ant release" to build the Hub release.

NOTE: The code expects these directories to live alongside eachother,
for example:
	.../www/gadgets/samples/mashup/index.html
	.../www/gadgets/...
	.../www/hub20/release/all/OpenAjaxManagedHub-all.js
	.../www/hub20/...
	.../www/repository/install.php
	.../www/repository/...

3. If desired, set up a repository using the directions in
repository/README.txt.

4. Load .../gadgets/samples/mashup/index.html (depending on where you have
installed the files).