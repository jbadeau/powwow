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

// XXX TODO Really should secure entire mashupapp with session tokens
// XXX TODO handl multipart/form-data POST

function isValidURL($url)
{
	/* From http://stackoverflow.com/questions/161738/what-is-the-best-regular-expression-to-check-if-a-string-is-a-valid-url#161749,
		Creative Commons license: http://creativecommons.org/licenses/by-sa/3.0/  */

	return preg_match('/^(https?):\/\/(?#											protocol
						)(([a-z0-9$_\.\+!\*\'\(\),;\?&=-]|%[0-9a-f]{2})+(?#         username
						)(:([a-z0-9$_\.\+!\*\'\(\),;\?&=-]|%[0-9a-f]{2})+)?(?#      password
						)@)?(?#                                                     auth requires @
						)((([a-z0-9][a-z0-9-]*[a-z0-9]\.)*(?#                       domain segments AND
						)[a-z]{2}[a-z0-9-]*[a-z0-9](?#                              top level domain OR
						)|(\d|[1-9]\d|1\d{2}|2[0-4][0-9]|25[0-5]\.){3}(?#
							)(\d|[1-9]\d|1\d{2}|2[0-4][0-9]|25[0-5])(?#             IP address
						))(:\d+)?(?#                                                port
						))(((\/+([a-z0-9$_\.\+!\*\'\(\),;:@&=-]|%[0-9a-f]{2})*)*(?# path
						)(\?([a-z0-9$_\.\+!\*\'\(\),;:@&=-]|%[0-9a-f]{2})*)(?#      query string
						)?)?)?(?#                                                   path and query string optional
						)(#([a-z0-9$_\.\+!\*\'\(\),;:@&=-]|%[0-9a-f]{2})*)?(?#      fragment
						)$/i', $url);
}


if ( isset( $_GET['oawu'] ) ) {
    $url = urldecode( $_GET['oawu'] );

	// Security check: make sure the URL is valid
	if(!isValidURL($url)){
		echo 'invalid url: '.$url;
		exit();
	}
    
    // GET request
    if ( $_SERVER['REQUEST_METHOD'] == 'GET' ) {
        $ct = isset( $_SERVER['CONTENT_TYPE'] ) ? $_SERVER['CONTENT_TYPE'] : 'text/plain';
        header( 'Content-Type: ' . $ct );
        $contents = @file_get_contents( $url );
        foreach( $http_response_header as $hdr ) {
            header( $hdr );
        }
        echo $contents;
    }
    
    // POST request
    else if ( $_SERVER['REQUEST_METHOD'] == 'POST' ) {
        $ct = isset( $_SERVER['CONTENT_TYPE'] ) ? $_SERVER['CONTENT_TYPE'] : 'application/x-www-form-urlencoded';
        $rawdata = file_get_contents('php://input');
        $headers = 'Content-Type: ' . $ct . PHP_EOL. 'Content-Length: ' . strlen( $rawdata ) . PHP_EOL;
        $options = array('method'=>'POST',
                         'header' => $headers,
                         'content' => $rawdata);
        $context = stream_context_create( array('http'=>$options) );
        echo file_get_contents( $url, false, $context );
    }
}
?>