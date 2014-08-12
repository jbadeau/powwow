/**************************************************************
Copyright 2006-2009 OpenAjax Alliance

Licensed under the Apache License, Version 2.0 (the "License"); 
you may not use this file except in compliance with the License. 
You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software 
distributed under the License is distributed on an "AS IS" BASIS, 
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
See the License for the specific language governing permissions and 
limitations under the License.
*****************************************************************/

/* Cross-browser XMLHttpRequest utility */

xhrGet = function(url, onComplete, onError) {
	var activeX = "ActiveXObject" in window;

	var xhr = ((typeof XMLHttpRequest == "undefined" || !location.href.indexOf("file:")) && activeX) ?
		new ActiveXObject("Msxml2.XMLHTTP") : new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (!xhr.status || xhr.status == 200) {
				try {
					onComplete(xhr.responseText);
				} catch(e) {
					onError(e);
				}
			} else {
				onError(new Error("Unable to load " + url + " status:" + xhr.status));
			}
		}
	};
	xhr.open("GET", url, true);
	try {
		xhr.send(null);
	} catch(e) {
		onError(e);
	}
};
