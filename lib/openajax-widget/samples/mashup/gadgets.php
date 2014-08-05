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
function doScan($directory, &$result)
{
    $files = scandir($directory);
    foreach ($files as $f) {
        if (substr($f, -4, 4) == '.xml') {
            $result[] = $directory.$f;
        } else if (is_dir($directory.'/'.$f) && $f != '.' && $f != '..') {
            doScan($directory.$f.'/', $result);
        }
    }
    
}

function keySortArray($array)
{
    $keys = array_keys($array);
    natcasesort($keys);
    $sortedArray = array();

    foreach ($keys as $currKey) {
        $sortedArray[$currKey] = $array[$currKey];
    }

    return $sortedArray;
}

function getProtocol() {
	return isset($_SERVER['HTTPS']) ? 'https' : 'http';
}

//header('Content-Type: text/json');

require_once('config/config.php');
require_once('repository.php');

$sortArray = array();
if (isset($_GET['repos']) && $_GET['repos'] != "") {
    $repositories = $_GET['repos'];
    $searchTerms = $_GET['terms'];
    foreach ($repositories as $repository) {
        $rs = new RepositorySearch($repository);
        $tempArray = $rs->search($searchTerms);
        foreach ($tempArray as $name => $url) {
            if ( isset($sortArray[$name]) ) {
                $startpos = strpos($url, "://");
                if ($startpos) {
                  $startpos += 3;
                  $endpos = strpos($url, "/", $startpos);
                  $domain = substr($url, $startpos, $endpos-$startpos);
                  $name .= ' : '.$domain;
                  $sortArray[$name] = (string)$url;
                }
            } else {
                $sortArray[$name] = (string)$url;
            }
        }
    }
} else {
    $rs = new RepositorySearch(OAAConfig::REPOSITORY_URL.'oscontroller.php');
    $tempArray = $rs->search();
    foreach ($tempArray as $name => $url) {
        if ( isset($sortArray[$name]) ) {
            $startpos = strpos($url, "://");
            if ($startpos) {
                $startpos += 3;
                $endpos = strpos($url, "/", $startpos);
                $domain = substr($url, $startpos, $endpos-$startpos);
                $name .= ' : '.$domain;
                $sortArray[$name] = (string)$url;
            }
        } else {
            $sortArray[$name] = (string)$url;
        }
    }
    /*
    $files = array();
    include_once('palette.php');
    if ($palette) {
        $result = '[';
        $cnt = 0;
        foreach ($palette as $item) {
            if ($cnt++) {
                $result .= ',';
            }
            $result .= "'$item'";
        }
        $result.= ']';
        echo $result;
        return;
    } 
    doScan('gadgets/', $files);
    $files[]='nomad/editor/editor.xml';
    $files[]='nomad/eventLogger.oam.xml';
//XXX    doScan('nomad/', $files);  // scan 'nomad' for privileged widgets
    $root = getProtocol().'://'.$_SERVER['SERVER_NAME'].dirname($_SERVER['REQUEST_URI']);
    foreach ($files as $f) {
        $url = "$root/$f";
        $startpos = strrpos($f, "/");
        if ($startpos === false) {
          $startpos = 0;
        } else {
          $startpos++;
        }
        $endpos = strrpos($f, ".");
        if ($endpos === false) {
          $endpos = 0;
        }
        if ($startpos && $endpos) {
          $name = substr($f, $startpos, $endpos-$startpos);
          if ( isset( $sortArray[$name] ) ) {
              $startpos = strpos($url, "://");
              if ($startpos) {
                $startpos += 3;
                $endpos = strpos($url, "/", $startpos);
                $domain = substr($url, $startpos, $endpos-$startpos);
                $name .= ' : '.$domain;
                $sortArray[$name] = (string)$url;
              }
          } else {
              $sortArray[$name] = (string)$url;
          }
        }
    }
    */
}


$sortArray = keySortArray($sortArray);
$result = array();
foreach ($sortArray as $key => $value) {
    $result[] = array("name" => (string)$key, "url" => (string)$value);
}

echo json_encode($result);

?>

