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
    $pageName = $_POST['page'];
    if (! $pageName) {
        die('No Page Name specified!');
    }
    $stream = fopen('pages/'.$pageName.'.txt', "w");
    $text = trim($_POST['data']);
    if  (get_magic_quotes_gpc()) {
        $text = stripslashes($text);
    }
    fwrite($stream, $text);
    fclose($stream);
    $redirect = $_SERVER['HTTP_REFERER'];
    if (! ($temp = strpos($redirect, '?')) === FALSE) {
        $redirect = substr($redirect, 0, $temp);
    }
    echo header('Location: '.$redirect.'?pageName='.urlencode($pageName));

?>
