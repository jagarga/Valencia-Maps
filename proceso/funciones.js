	        // Get adress value form <input1>
	function codeAddress(direction, map) {
			         var geocoder = new google.maps.Geocoder();
                     //var address = document.getElementById('q-adress').value;
					 var address = direction;
                     geocoder.geocode( { 'address': address}, function(results, status) {
                     if (status == google.maps.GeocoderStatus.OK) {
		  
		  	         var coords = results[0].geometry.location;
			         var lat = results[0].geometry.location.lat();
                     var lng = results[0].geometry.location.lng();
			
	                 var ll = new OpenLayers.LonLat(lng,lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
			         
                     map.setCenter (ll, 16);

          } else {
            alert('Geocode was not successful for the following reason: ' + status);
          }
        });
      }
	  
	  //posicionarnos sobre una coordenada introducida por el usuario
	  function coordinateFormSubmit(lat,lon,map) {
	  
	     var lat2 = lon.replace(",", "."); //remplazamos comas por puntos
		 var lon2 = lat.replace(",", ".");
	     var ll = new OpenLayers.LonLat(lon2,lat2).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
	     //alert(ll);
		 
		 //Añadimos marcador sobre el punto
		 
    if (map.getLayersByName("Marcadores").length === 0) {   //si la capa no existe la creamos
         var markers = new OpenLayers.Layer.Markers( "Marcadores" );
		 markers.id = "Marcadores";
		 map.addLayer(markers);
    } else {
        
    }
	     //Añadimos el marcador a la capa
		 var size = new OpenLayers.Size(21,25);
         var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
         var icon = new OpenLayers.Icon('img/ol_icons/marker.png',size,offset);
		 var markerslayer = map.getLayer('Marcadores');
         markerslayer.addMarker(new OpenLayers.Marker(ll,icon));
		 
		 
	     map.setCenter((ll),16);	
	  
	  }
	  
	  
	 