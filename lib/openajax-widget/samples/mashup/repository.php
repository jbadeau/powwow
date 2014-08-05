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

class RepositorySearch
{
  protected $_opensearchurl;

  public function __construct($url) {
    $this->_opensearchurl = $url;
  }

  public function search($terms="") {
    $osdoc = simplexml_load_file($this->_opensearchurl);

    // some quick validation
    if ($osdoc === false || $osdoc->getName() != "OpenSearchDescription") {
      return false;
    }

    $osdoc->registerXPathNamespace("os", "http://a9.com/-/spec/opensearch/1.1/");
    $osdoc->registerXPathNamespace("catalog", "http://www.ibm.com/opensearch/1.0");

    // TODO: what about capitalization?
    $osurl = $osdoc->Url[0]["template"];

    if (!$osurl) {
      return false;
    }

    // TODO: doing gadgets only for now
    $roles = $osdoc->xpath("//os:Query[@role='gadget']");
    if (count($roles) == 0) {
      // no gadget role
      return false;
    }

    // no longer need the opensearch doc in memory
    $osdoc = null;

    // get the role value
    $attr = $roles[0]->attributes("http://www.ibm.com/opensearch/1.0");
    $role = $attr["searchType"];

    // opensearch replacements
    $osurl = str_replace("{catalog:searchType}", $role, $osurl);
    $osurl = str_replace("{searchTerms}", $terms, $osurl);

    // optional items
    $osurl = str_replace("{startIndex?}", "0", $osurl);
    $osurl = str_replace("{startIndex}", "0", $osurl);

    $osurl = str_replace("{count?}", "", $osurl);
    $osurl = str_replace("{count}", "", $osurl);

    $osurl = str_replace("{catalog:sortBy?}", "", $osurl);
    $osurl = str_replace("{catalog:sortBy}", "", $osurl);

    $osurl = str_replace("{catalog:sortOrder?}", "", $osurl);
    $osurl = str_replace("{catalog:sortOrder}", "", $osurl);

    // load the feed
    $feed = simplexml_load_file($osurl);
    $feed->registerXPathNamespace("catalog", "http://www.ibm.com/opensearch/1.0");

    // some quick validation
    if ($feed === false || $feed->getName() != "feed") {
      return false;
    }

    $result = array();
    foreach ($feed->entry as $entry) {
      $url = $entry->xpath(".//catalog:downloadMetadataUrl");
      // have to append the version to make the key unique, repositories may
      // have more than one version of a widget
      $version = $entry->xpath(".//catalog:version");
      $version = (string)$version[0];
      if (strlen($version)) {
        $version = ' v'.$version;
      } else {
        $version = '';
      }
      $result[((string)$entry->title).$version] = (string) $url[0];
    }

    return $result;
  }
}

?>
