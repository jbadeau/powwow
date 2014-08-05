<?php
/*******************************************************************************
 * upload_and_validate.php
 *
 * PHP utility used by the _InteropFestValidator widget. Accepts an uploaded
 * file (.xml or .zip). If a single XML file is uploaded, it validates that file.
 * If a .zip file is loaded, it validates all files that have the string
 * "oam.xml" as the last characters of the filename. 
 *
 * Once the validations are performed, this file sends down some
 * JavaScript logic that targets a hidden IFRAME in the widget.
 * This JavaScript logic pushes the validation messages into a particular
 * DIV within the _InteropFestValidator widget.
 *
 * Copyright 2006-2009 OpenAjax Alliance
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not 
 * use this file except in compliance with the License. You may obtain a copy 
 * of the License at http://www.apache.org/licenses/LICENSE-2.0 . Unless 
 * required by applicable law or agreed to in writing, software distributed 
 * under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR 
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 *
 ******************************************************************************/

$return_message = "";
$debug_string = "";  // Not used in production.

/*---------------------------------------------------------------------
	If PHP is running on a Windows machine, special things need to happen
-----------------------------------------------------------------------*/

$windows = "windows";
$windowslen = strlen($windows);
$oam_dot_xml = "oam.xml";

if ( array_key_exists('OS', $_ENV) && strncasecmp($_ENV['OS'],$windows,$windowslen) == 0 ) {
	$windows_os = true;
} else {
	$windows_os = false;
}

/*---------------------------------------------------------------------
	Initializations
-----------------------------------------------------------------------*/

$site_root = $_SERVER["DOCUMENT_ROOT"];
$upload_dir = $site_root.'/samples/uploads/';
$basename = basename( $_FILES['myfile']['name']);
$target_path = $upload_dir.$basename;
$current_dir = dirname(__FILE__);
$current_dir = str_replace('\\','/',$current_dir);
$jing_jar = $current_dir."/jing-20030619/bin/jing.jar";
$schema_file = $site_root."/schema/OpenAjaxMetadata/1.0/OpenAjaxMetadata.rnc";

/*---------------------------------------------------------------------
	Need to provide a different path to "java" program for localhost vs www.openajax.org
-----------------------------------------------------------------------*/

if (strcasecmp($_SERVER['SERVER_ADDR'],"127.0.0.1") == 0) {
	$java_cmd = "java";
} else {
	$java_cmd = "/usr/local/jdk/bin/java";
}

/*---------------------------------------------------------------------
	get_trailing_characters($filename, $nchars)
		Return the last N letters of a filename (i.e., ".zip", ".xml" or "oam.xml")
-----------------------------------------------------------------------*/
function get_trailing_characters($filename, $nchars) {
	$filename_len = strlen($filename);
	$extension = substr($filename,$filename_len - $nchars, $nchars);
	$extension = strtolower($extension);
	return $extension;
}

/*---------------------------------------------------------------------
	validate_xml_file($filename)
		Validates an XML file that has been uploaded to the server.
		Returns a string holding the validation message.
		An empty return string indicates successful validation.
-----------------------------------------------------------------------*/
/* Validate the given XML file against the OpenAjax Metadata schema */
function validate_xml_file($filename) {
	global $debug_string, $java_cmd, $jing_jar, $schema_file;
	$command_to_run = $java_cmd." -jar ".$jing_jar." -c ".$schema_file." ".$filename;
	if ($windows_os) {
		/* Not sure why, but PHP requires different logic when running on a Windows server. */
		$WshShell = new COM("WScript.Shell");
		$validation_result = $WshShell->Exec($command_to_run)->StdOut->ReadAll;
	} else {
		$validation_result = shell_exec($command_to_run);
	}
	if ($validation_result == "") {
		$validation_success = true;
		$validation_message = "Validation succeeded.";
	} else {
		$validation_success = false;
		$validation_message = $validation_result;
	}
	$validation_message = str_replace('\\','/',$validation_message);
	return $validation_message;
}

/*---------------------------------------------------------------------
	Main logic for this file
-----------------------------------------------------------------------*/

/* Check extension. Only .xml and .zip are allowed. */
$extension = get_trailing_characters($basename, 4);
if (strlen($basename) > 4 && ($extension == '.xml' || $extension == '.zip')) {

	if(@move_uploaded_file($_FILES['myfile']['tmp_name'], $target_path)) {
		$upload_success = true;
		$upload_message = "File upload succeeded. File has been uploaded to: ".$target_path;
	} else {
		$upload_success = false;
		$upload_message = "File upload failed.";
	}

	$return_message .= $upload_message."\n";
	if ($upload_success) {

		/* A single XML file has been uploaded. Validate it. */
		if ($extension == '.xml') {
			$return_message .= validate_xml_file($target_path);

		/* A ZIP file has been uploaded. Validate all of the XML files
			whose filenames end with the correct suffix ("oam.xml"). */
		} else if ($extension == '.zip') {
			if (($zip = zip_open($target_path))) {

				while (($zip_entry = zip_read($zip))) {
					$zip_entry_path = zip_entry_name($zip_entry);
					$zip_entry_basename = basename($zip_entry_path);
					// Pull off last N characters to see if they match "oam.xml"
					$zip_entry_extension = get_trailing_characters($zip_entry_path, strlen($oam_dot_xml));

					if ($zip_entry_extension == $oam_dot_xml) {
						$zip_entry_target_path = $upload_dir.$zip_entry_basename;
						if ((zip_entry_open($zip, $zip_entry))) {
							$zip_entry_filesize = zip_entry_filesize($zip_entry);
							$zip_entry_contents = zip_entry_read($zip_entry, $zip_entry_filesize);
							if (($zip_entry_fp = fopen($zip_entry_target_path, 'w'))) {
								fwrite($zip_entry_fp, $zip_entry_contents);
								fclose($zip_entry_fp);
								$return_message .= validate_xml_file($zip_entry_target_path);
							} else {
								$return_message = "Logic error in widget. Cannot write to upload area.\n";
							}
							zip_entry_close($zip_entry);
						} else {
							$return_message = "Logic error in widget. Cannot open file from ZIP.\n";
						} 
					}
				}
			}
		} else {
			$return_message = "Logic error in widget. Unexpected extension.\n";
		}
	}
} else {
	$return_message = "Invalid file name. File name must have a .xml or .zip extension.\n";
}

/*---------------------------------------------------------------------
	A bunch of logic to munge the $return_message to make it
	suitable for a JavaScript assignment statement.
	(JavaScript is very touchy about what it will accept.)
-----------------------------------------------------------------------*/

// JavaScript innerHTML assignment has problems with lots of different characters. 
// White list filter out any  characters we don't expect.
// Temporarily replace newlines with @@CR@@ and/or @@LF@@.
$temp_message = $return_message;
$return_message = "";
for ($i=0;$i<strlen($temp_message);$i++){
	$num = ord($temp_message[$i]);
	if ($temp_message[$i] == "'") {
		$return_message .= "\\'";
	} else if ($num == 10) {
		$return_message .= "@LF@";
	} else if ($num == 13) {
		$return_message .= "@CR@";
	} else if ($num >= 32 && $num <= 126) {
		$return_message .= chr($num);
	}
}

// Replace $site_root so that we don't tell the world about
// the full UNIX directory path of the OpenAjax site on the Kattare server
$return_message = str_replace($site_root,"http://www.openajax.org",$return_message);

// XSS protection
$return_message = htmlspecialchars($return_message);

// Turn @@CR@@ and/or @@LF@@ into <br> elements
$return_message = str_replace('@CR@@LF@','<br />',$return_message);
$return_message = str_replace('@LF@','<br />',$return_message);
$return_message = str_replace('@CR@','<br />',$return_message);
$return_message = nl2br($debug_string).$return_message;

/*---------------------------------------------------------------------
	Echo the $return_message so that it will appear as the content of 
	the (normally hidden) iframe. This helps greatly during debugging,
	when it is a very good idea to make the iframe visible.
	(PHP errors, if any, will appear in that iframe.)
-----------------------------------------------------------------------*/

echo "<p>".$debug_string.$return_message."</p>\n";
?>

<!-- ---------------------------------------------------------------------
	The following JavaScript is sent into the hidden iframe.
	The logic below navigates to its parent window (the _InteropFestValidator widget)
	and stuffs the value of $return_message into the DIV whose ID
	is "upload_status".
----------------------------------------------------------------------- -->

<script language="javascript" type="text/javascript">
	return_message = '<?php echo $return_message;?>';
	parent_window = window.parent;
	parent_document = parent_window.document;
	upload_element = parent_document.getElementById("upload_status");
	upload_element.innerHTML = return_message;
</script>   
