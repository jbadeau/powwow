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
dojo.declare("GoogleMap", null,
{
      constructor: function(id, wrapper) {
         this.id = id;
         this.wrapper = wrapper;
         
         //Detecting user agent to special case iPhone
         this.inIPhone = (navigator.platform === 'iPod') || (navigator.platform === 'iPhone');
     },

     onLoad: function() {
            //enable the blocking div if in the iphone
            if( this.inIPhone ){
                var blockerElt = dojo.byId( 'blocker' );
                blockerElt.style.display = "block";
            }
            
            if ((typeof GBrowserIsCompatible != 'undefined') && GBrowserIsCompatible()) {
                map = new GMap2( dojo.byId( 'map' ) );
                map.mapLargeControl = new GLargeMapControl();
                map.mapSmallControl = new GSmallMapControl();
                map.mapControl = map.mapSmallControl;
                map.controlType = new GMapTypeControl();
                map.addControl(map.mapControl);
                map.addControl(map.controlType);
                this.map = map;
                // if (typeof OpenAjax != 'undefined' && typeof OpenAjax.hub != 'undefined') {
                //     OpenAjax.hub.subscribe('geospatial.DDD', dojo.hitch(this, this._onPointAvailable));
                //     OpenAjax.hub.subscribe('[geospatial.DDD]', dojo.hitch(this, this._onPointAvailable));
                // }
                //this.foo();
                
                //init map with the coords in the props
                this.onCoordsChange( this.wrapper.getPropertyValue( "coords" ) );
		        
		        //init map with the zoom in the props
                this.onZoomChange( this.wrapper.getPropertyValue( "zoom" ) );
            }
        },

		onAddressChange: function( value ) {
		      this.geocode( value );
		},
	 
		geocode: function (address) {			
			var geocoder = new GClientGeocoder();
			var themap = this;
			geocoder.getLatLng(address,
			    function(point) {
			            if (!point) {
			              alert(address + " not found");
			            } else {
			              this.map.setCenter(point, this.map.zoomLevel);
			              var marker = new GMarker(point);
			              this.map.addOverlay(marker);
			              marker.openInfoWindowHtml(address);
						  GEvent.addListener(marker,
								'click',
								function(){ 
									if (themap.map) { 
										themap.map.closeInfoWindow();
										this.openInfoWindowHtml(address);
										// this.map._onMarkerClick(this);
									} 
								});
			            }
			    }
			);	
		},
		
        foo:function() {
            
            var point = new GLatLng(30.501107, -97.758384);
            this.map.setCenter(point, this.map.zoomLevel);
            var marker = new GMarker(point);
            marker.map = this;
            this.map.addOverlay(marker);
            GEvent.addListener(marker,
                               'click',                               
                               function(){ if (this.map) { this.map._onMarkerClick(this);} });
            var point = new GLatLng(29.501107, -97.758384);                  
            var marker = new GMarker(point);
            this.map.addOverlay(marker);
            marker.map = this;
            GEvent.addListener(marker,
                               'click',
                               function(){ if (this.map) { this.map._onMarkerClick(this);} });

        },
        
        // _onPointAvailable: function(name, data) {
        //     if (typeof data == 'string') {
        //         var temp = data.split(',');
        //         var point = new GLatLng(temp[0], temp[1]);
        //         this.map.setCenter(point);
        //     } else if (data.length > 0) {
        //         for (var i = 0; i < data.length; i++) {
        //             var temp = data[i].split(',');
        //             var point = new GLatLng(temp[0], temp[1]);
        //             this.map.setCenter(point, this.map.zoomLevel);
        //             var marker = new GMarker(point);
        //             marker.map = this;
        //             this.map.addOverlay(marker);
        //             GEvent.addListener(marker,
        //                                'click',
        //                                function(){ if (this.map) { this.map._onMarkerClick(this);} });
        //         }
        //     }
        // 
        // },
        
        _onMarkerClick: function(marker) {
            if (OpenAjax.hub) {
                var point = marker.getLatLng();
                if  (point) {
                    OpenAjax.hub.publish(OpenAjax.hub.LOCATION, point.lat() + "," + point.lng());
                }
            }
        },
        
        /*
         * Property change handler
         * @param {GadgetProperty} prop Property 
         */
        onCoordsChange: function( value ){

        	var temp = value.split(',');
               if( temp.length >= 2 ){
	            var point = new GLatLng(temp[0], temp[1]);
	            this.map.setCenter(point);
	        }
        
        },
        
        /*
         * Property change handler
         * @param {GadgetProperty} prop Property 
         */
        onZoomChange: function( value ){
        
        	temp = parseInt( value );
            if( temp !== NaN ){
	            this.map.setZoom(temp);
	        }
        
        },
        
        /*
         * This hook allows the widget to shoe the native Google Map of the iphone
         */
        broadcastAddress: function( link ){
            var addr = this.wrapper.getPropertyValue("address");
            if( addr !== '' && confirm("Do you want to launch the Google Maps application?") ){
                link.href = "http://maps.google.com/maps?q="+addr;
                return true;
            }
            else{
                return false;
            }
        }
})
