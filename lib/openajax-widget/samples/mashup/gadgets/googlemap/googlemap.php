<?php
/*
 
        Copyright 2006-2008 OpenAjax Alliance

        Licensed under the Apache License, Version 2.0 (the "License"); 
        you may not use this file except in compliance with the License. 
        You may obtain a copy of the License at
        
                http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software 
        distributed under the License is distributed on an "AS IS" BASIS, 
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
        See the License for the specific language governing permissions and 
        limitations under the License.
*/
    $mashupBase = 'http://www.openajax.org/2008_InteropFest/mashupapp';
    // api key for www.openajax.org
    $apiKey = 'ABQIAAAAnSe0qxpJ_WdvjLS2mqBFbBQGUnDi8np81fgaEaiDR7n-EHXDpRQtfbPeZylU46i0WimZd6X7-DFRsw';
    //$mashupBase = 'http://localhost/OAA';
    // api key for localhost
    //$apiKey = 'ABQIAAAAdNAj7hpRqCdEDr2anW9OPxT2yXp_ZAY8_ufC3CFXhHIE1NvwkxSTwKxZotpBLrFwxOaSX9QX9rQvKQ';
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
   "http://www.w3.org/TR/html4/loose.dtd">

<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>Google Maps</title>
  
  <link href="<?php print $mashupBase; ?>/gadgets/samples/lib/dojo/dojo/resources/dojo.css" rel="stylesheet"/>
  <link href="<?php print $mashupBase; ?>/gadgets/samples/lib/dojo/dijit/themes/tundra/tundra.css" rel="stylesheet"/>
  <script src="<?php print $mashupBase; ?>/gadgets/samples/lib/dojo/dojo/dojo.js"
        djConfig="usePlainJson:true, parseOnLoad: false, isDebug: false"></script>

  <script src="<?php print $mashupBase; ?>/hub11/src/OpenAjax.js"></script>
  <script src="<?php print $mashupBase; ?>/hub11/src/OpenAjax-mashup.js"></script>

  <?php
    $prov = $_GET[ "prov" ];
    if ( $prov == "http://providers.openajax.org/smash" ) {
      print "<script src='{$mashupBase}/hub11/providers/smash/json2.js'></script>\n";
      print "<script src='{$mashupBase}/hub11/providers/smash/smash.js'></script>\n";
    }
    $libs = explode( ",", $_GET[ "libs" ] );
    foreach( $libs as $lib ) {
    	if ( $lib == 'widget.js' ) {	// XXX fix me
		    print "<script src='{$mashupBase}/gadgets/src/widget.js'></script>\n";
		    print "<script src='{$mashupBase}/gadgets/src/widgetURL.js'></script>\n";
    	}
    }    
  ?>

  <script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key=<?php print $apiKey ?>"></script>
  <script src="googlemap.js"></script>

    <script>
        var map = OpenAjax.widget.getWidgetInstance( '<?php print $_GET[ "id" ]; ?>' );

        dojo.addOnLoad( function() {
            map.onLoad();
        });
    </script>
</head>

<body>

    <div id="map" style="width: 400px; height: 400px;">View</div>
	<!--This is a div that is used to block user input to map when in iphone/ipod touch-->
	<a id="blocker" href="http://maps.google.com/maps?q=cupertino" target="_blank"
	    style="display: none; position: absolute; top: 0px; left: 0px; width: 100%; height: 100%;"
	    onclick="return map.broadcastAddress(this);">&nbsp;</a>

</body>
</html>
