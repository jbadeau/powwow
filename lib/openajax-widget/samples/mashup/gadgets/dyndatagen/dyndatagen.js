/*******************************************************************************
 * dyndatagen.js
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

dyndatagen = function() {};

/*************************************************************************************************
 * hitch() function. Returns a function that will execute in the given scope
 *************************************************************************************************/
dyndatagen.prototype.hitch = function(scope, method) {
    return function() { return method.apply(scope, arguments || []); }
}

/*************************************************************************************************
 * Initialization function.
 * Initializes a list of fake companies and their initial stock prices.
 *************************************************************************************************/
dyndatagen.prototype.onLoad = function() {

	this.running = false;

	this.corplist = [];
	this.add("STRA", "Strawberry Computers", 100);
	this.add("TITA", "Titan Power", 100);
	this.add("EBEL", "East Bay Electric", 100);
	this.add("MOOP", "Venetian Executive Search", 100);
	this.add("HLSY", "Hall Systems", 100);
	this.add("ULSO", "Ultisoft Systems", 100);
	this.add("LATR", "Lattern Circuits", 100);
	this.add("YSAM", "West Pecos Inc", 100);

	// Launch data generation logic when event is received.
	this.pause_resume();
}

/*************************************************************************************************
 * Add and initialize a new fake company to the list of watched companies.
 *************************************************************************************************/
dyndatagen.prototype.add = function(tickerName, corpName, startPrice) {
	// Only add this company if not already in the list
	if (!this.corplist[tickerName]) {
		this.corplist.push({ tName: tickerName, cName: corpName, price: startPrice });
	}
}

/*************************************************************************************************
 * Manage the pause/resume button.
 *************************************************************************************************/
dyndatagen.prototype.pause_resume = function() {

	if (!this.running) {
		this.randomizerInterval = setInterval(this.hitch(this, this.newStockQuote), 500);  /* Previously 150 */
		this.running = true;
		var elem = document.getElementById("pause_resume");
		elem.setAttribute("value", "Pause");
	} else {
		clearInterval(this.randomizerInterval);
		this.running = false;
		clearInterval(this.resultsUpdateInterval);
		var elem = document.getElementById("pause_resume");
		elem.setAttribute("value", "Resume");
	}
}

/*************************************************************************************************
 * Pick a random company.
 *************************************************************************************************/
dyndatagen.prototype.getRandomCorp = function() {
	var len = this.corplist.length;
	var i = Math.floor(Math.random() * len);
	if (i >= len) {
		i = len-1;
	}
	return i;
}

/*************************************************************************************************
 * Picks a random company, computes a random price, and then:shows two ways to pass messages
 * to other widgets:
 * (1) update a property whose XML metadata specifies publish="true"
 * (2) publish a topic using hubConnection.publish(...)
 *************************************************************************************************/
dyndatagen.prototype.newStockQuote = function() {
	var inflation = 1.01;
	var i = this.getRandomCorp();
	var stock = this.corplist[i];
	var oldprice = stock.price;
	var oldprice_div10 = oldprice / 10;
	var oldprice_div20 = oldprice / 20;
	var price = oldprice + (Math.random() * oldprice_div10 * inflation) - oldprice_div20;
	stock.price = price;

	var set_highlow = false;
	if (stock.high == null || price > stock.high) {
		set_highlow = true;
		stock.high = price;
	}
	if (stock.low == null || price < stock.low) {
		set_highlow = true;
		stock.low = price;
	}

	// Demonstrate message passing technique #1: update a shared property
	if (set_highlow) {
		this.OpenAjax.setPropertyValue('highlow', { tName:stock.tName, high:stock.high, low:stock.low });
	}

	// Demonstrate message passing technique #2: publish a topic using the Hub APIs
	this.OpenAjax.hub.publish("org.openajax.2008InteropFest.dyndata.newstockprice", stock);
}
