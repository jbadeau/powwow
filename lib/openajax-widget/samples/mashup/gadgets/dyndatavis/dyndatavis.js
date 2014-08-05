/*******************************************************************************
 * dyndatavis.js
 *
 * Copyright 2006-2008 OpenAjax Alliance
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

/*************************************************************************************************
 * Class constructor
 *************************************************************************************************/
var dyndatavis = function() {};

/*************************************************************************************************
 * Invoked when the widget is added to the canvas.
 *************************************************************************************************/
dyndatavis.prototype.onLoad = function() {
	this.corpArray = [];
	this.corpAssocArray = {};

	// Subscribe to "org.openajax.2008InteropFest.dyndata.newstockprice".
	// Each time a new stock price is received, invoke the callback, which causes 
	// visualization component to update and redraw itself.
	this.OpenAjax.hub.subscribe("org.openajax.2008InteropFest.dyndata.newstockprice", this.newstockpriceCB, this);
}

/*************************************************************************************************
 * Add a new stock to our list of stocks, then resort the list
 *************************************************************************************************/
dyndatavis.prototype.addNewStock = function(tickerName, corpName, price, high, low) {
	var stock = {};
	stock.corpName = corpName;
	stock.price = price;
	stock.high = high;
	stock.low = low;
	this.corpAssocArray[tickerName] = stock;
	this.corpArray.push(tickerName);
	this.corpArray.sort();
}

/*************************************************************************************************
 * Onchange callback for the 'highlow' property.
 *************************************************************************************************/
dyndatavis.prototype.onChangeHighlow = function( event ) {
    var highlow_stock = event.newValue;
	var tickerName = highlow_stock.tName;
	var high = highlow_stock.high;
	var low = highlow_stock.low;
	if (this.corpAssocArray[tickerName] != null) {
		var stock = this.corpAssocArray[tickerName];
		stock.high = high;
		stock.low = low;
		this.refreshView(highlow_stock.tName, null);
	}
}

/*************************************************************************************************
 * Callback for newstockprice event.
 *************************************************************************************************/
dyndatavis.prototype.newstockpriceCB = function( topic, data ) {
	this.newstockprice(data);
}

/*************************************************************************************************
 * This logic keeps track of the most recent stock prices received for each unique stock
 * that has been broadcast since the start of this session.
 *		SampleDataVisComponent.corpArray: array that holds ticker names sorted alphabetically
 *		SampleDataVisComponent.corpAssocArray: assoc. array indexed by ticker name that holds
 *				long company name and latest stock price.
 *************************************************************************************************/
dyndatavis.prototype.newstockprice = function(stockpriceevent) {

	// Event "org.openajax.2008InteropFest.dyndata.newstockprice" passes a payload
	// (called "stockpriceevent" here) which is an object with these properties: 
	//     {tName:<string>, cName:<string>, price:<number>}
	var tickerName = stockpriceevent.tName;
	var corpName = stockpriceevent.cName;
	var price = stockpriceevent.price;

	var delta = null;
	if (this.corpAssocArray[tickerName] == null) {
		// This is the first time we have seen this particular stock.
		// So, add it to corpAssocArray, append it to corpArray, re-sort corpArray.
		this.addNewStock(tickerName, corpName, price, price, price);
	} else {
		delta = price - this.corpAssocArray[tickerName].price;
		this.corpAssocArray[tickerName].price = price;
	}
	this.refreshView(tickerName, delta);
}

/*************************************************************************************************
 * Returns a string which represents the stock price rounded to the nearest 1/8th.
 *************************************************************************************************/
dyndatavis.prototype.nearestEighth = function(price_as_string) {
	// Subtract zero to do a string-to-number conversion
	var price = price_as_string - 0;
	if (!isNaN(price)) {
		var eighths = ["", " 1/8", " 1/4", " 3/8", " 1/2", " 5/8", " 3/4", " 7/8"];
		var whole = Math.floor(price);
		var eighth = Math.floor((price - whole) * 8);
		if (eighth >= 8)
			eighth = 7;
		return whole+eighths[eighth];
	} else {
		return "";
	}
}

/*************************************************************************************************
 * Regenerates the snippet of HTML (an HTML table) that displays the most current list of
 * stock prices. The most recent stock that has been received is given a colored background,
 * green if a gain and red if a loss.
 *************************************************************************************************/
dyndatavis.prototype.refreshView = function(mostRecentTickerName, delta) {
	var s = '\n<table border="1">\n<tbody>\n';
	s += '<tr><th>Company</th><th>Abbr</th><th>Latest</th><th>High</th><th>Low</th></tr>\n';
	for (var jjj = 0; jjj < this.corpArray.length; jjj++) {
		var tickerName = this.corpArray[jjj];
		var stock = this.corpAssocArray[tickerName];
		if (stock.price != null) {
			var price_nearestEighth = this.nearestEighth(stock.price);
			var high_nearestEighth = this.nearestEighth(stock.high);
			var low_nearestEighth = this.nearestEighth(stock.low);
			if (tickerName == mostRecentTickerName && delta != null) {
				if (delta < 0) {
					s += '<tr style="background-color:red">';
				} else if (delta > 0) {
					s += '<tr style="background-color:green">';
				} else {
					s += '<tr>';
				}
			} else {
				s += '<tr>';
			}
			s += '<td>'+stock.corpName+'</td><td>'+tickerName+'</td><td>'+price_nearestEighth+'</td><td>'+high_nearestEighth+'</td><td>'+low_nearestEighth+'</td></tr>\n'; 
		}
	}
	s += '</tbody>\n</table>\n';
	var elem = document.getElementById("DataVis_1");
	elem.innerHTML = s;
}
