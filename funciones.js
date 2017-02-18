	        // Obtiene la direccion usando el Geocoder de Google Maps
	        function codeAddress(direction, map) {
	            var geocoder = new google.maps.Geocoder();
	            //var address = document.getElementById('q-adress').value;
	            var address = direction;
	            geocoder.geocode({
	                'address': address
	            }, function(results, status) {
	                if (status == google.maps.GeocoderStatus.OK) {

	                    var coords = results[0].geometry.location;
	                    var lat = results[0].geometry.location.lat();
	                    var lng = results[0].geometry.location.lng();

	                    var ll2 = new OpenLayers.LonLat(lng, lat);
	                    var ll = new OpenLayers.LonLat(lng, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());

	                    map.setCenter(ll, 16);


	                } else {
	                    alert('Geocode was not successful for the following reason: ' + status);
	                }
	            });
	        }

	        //posicionarnos sobre una coordenada introducida por el usuario
	        function buscaposicion(lat, lon, map) {

	            var lat2 = lon.replace(",", "."); //remplazamos comas por puntos
	            var lon2 = lat.replace(",", ".");
	            var ll = new OpenLayers.LonLat(lon2, lat2).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
	            //alert(ll);

	            //Añadimos marcador sobre el punto

	            if (map.getLayersByName("Marcadores").length === 0) { //si la capa no existe la creamos
	                var markers = new OpenLayers.Layer.Markers("Marcadores");
	                markers.id = "Marcadores";
	                map.addLayer(markers);
	            } else {

	            }
	            //Añadimos el marcador a la capa
	            var size = new OpenLayers.Size(21, 25);
	            var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
	            var icon = new OpenLayers.Icon('img/ol_icons/marker.png', size, offset);
	            var markerslayer = map.getLayer('Marcadores');
	            markerslayer.addMarker(new OpenLayers.Marker(ll, icon));


	            map.setCenter((ll), 16);

	        }

	        //función que devuelve el parametro pasado por la url desde el objeto padre
	        function getParameter(parameter) {

	            // Obtiene la cadena completa de URL
	            var url = location.href;
	            /* Obtiene la posicion donde se encuentra el signo ?, ahi es donde empiezan los parametros */
	            var index = url.indexOf("?");
	            /* Obtiene la posicion donde termina el nombre del parametro e inicia el signo = */
	            index = url.indexOf(parameter, index) + parameter.length;
	            /* Verifica que efectivamente el valor en la posicion actuales el signo = */
	            if (url.charAt(index) == "=") {
	                // Obtiene el valor del parametro
	                var result = url.indexOf("&", index);
	                if (result == -1) {
	                    result = url.length;
	                };
	                // Despliega el valor del parametro
	                var resultado = url.substring(index + 1, result);
	                return resultado;
	                //alert(resultado);
	            }

	        }


	        //Funcion que calcula una ruta a traves del servicio OSRM
	        function calculoruta2(map, ruta, latorigen, lonorigen, latdestino, londestino) {


	            if (ruta) { //vaciamos la capa por si ya se ha mostrado alguna ruta

	                ruta.removeFeatures(ruta.features);
	            }


	            $(function() //Primero realizamos una peticion ajax al servicio 
	                {

	                    $.getJSON("https://router.project-osrm.org/viaroute?loc=" + latorigen + "," + lonorigen + "&loc=" + latdestino + "," + londestino + "&compression=false&instructions=true")
	                        .done(function(data, textStatus, jqXHR) {

	                            //Construimos un wkt linestring a partir de parte de los resultados
	                            var wkt = 'LINESTRING (';
	                            var aux;
	                            var valores = data.route_geometry;


	                            for (var i in valores) {

	                                aux = valores[i];
	                                var res = aux.toString().split(",");
	                                aux = res[1] + ' ' + res[0]
	                                wkt = wkt + aux;


	                                if (i != (valores.length - 1)) {

	                                    wkt = wkt + ',';

	                                }

	                            }

	                            wkt = wkt + ')';
	                            //alert (wkt);

	                            //Ahora leemos el wkt en una variable wkt de openlayers, transformamos al sistema de referencia del mapa y añadimos los registros a la capa ruta del mapa
	                            var readwkt = new OpenLayers.Format.WKT();
	                            var features = readwkt.read(wkt);
	                            features.geometry.transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
	                            var bounds;
	                            if (features) {
	                                if (features.constructor != Array) {
	                                    features = [features];
	                                }
	                                for (var i = 0; i < features.length; ++i) {
	                                    if (!bounds) {
	                                        bounds = features[i].geometry.getBounds();
	                                    } else {
	                                        bounds.extend(features[i].geometry.getBounds());
	                                    }

	                                }

	                                ruta.addFeatures(features);
	                                map.addLayer(ruta);
	                                map.zoomToExtent(bounds);
													
									
	                            } else {}




	                        })

	                    .fail(function(jqXHR, textStatus, errorThrown) {
	                        if (console && console.log) {
	                            console.log("Something failed: " + textStatus);
	                        }
	                    });

						
	                });




	        }



	        //Funcion que calcula una ruta a traves del servicio OSRM
	        function calculoruta(map, ruta, latorigen, lonorigen, latdestino, londestino, indicacionestore) {

			var formats;
	            var indicaciones = []; //string para guardar las indicaciones  

	            if (ruta) { //vaciamos la capa por si ya se ha mostrado alguna ruta

	                ruta.removeFeatures(ruta.features);
	            }
	            //http://router.project-osrm.org/route/v1/driving/-0.40,39.45;-0.36,39.49?geometries=polyline&steps=true					 

	            $(function() //Primero realizamos una peticion ajax al servicio 
	                {

	                    //$.getJSON( "http://192.168.1.138:5000/route/v1/driving/" + lonorigen + "," + latorigen + ";" + londestino + "," + latdestino + "?geometries=geojson&steps=true")
	                    $.getJSON("https://router.project-osrm.org/route/v1/driving/" + lonorigen + "," + latorigen + ";" + londestino + "," + latdestino + "?geometries=geojson&steps=true")
	                        .done(function(data, textStatus, jqXHR) {

	                            //Construimos un wkt linestring a partir de parte de los resultados
	                            var wkt = 'LINESTRING (';
	                            var aux;
	                            var data2 = ''; //variable para guardar los datos de indicaciones a mostrar
	                            var valores = data.routes[0].legs[0].steps;
								
								var distancia = 'Distancia total: ' + ((data.routes[0].distance)/1000).toFixed(2) + ' kilometros';  //Obtenemos la distancia
								Ext.getCmp('distancia').setText(distancia);
								

	                            for (i = 0; i < valores.length; i++) {


	                                //Creamos un wkt con las geometrias de la ruta 
	                                aux = valores[i];
	                                var res = aux.geometry.coordinates.toString().split(",");;
	                                //alert(res);

	                                var aux2 = ' ';

	                                for (j = 0; j < res.length; j = j + 2) {
	                                    if (j != (res.length - 2)) {
	                                        aux2 = aux2 + res[j] + ' ' + res[j + 1] + ',';
	                                    } else {
	                                        aux2 = aux2 + res[j] + ' ' + res[j + 1] + ' ';
	                                    }
	                                }

	                                //alert(aux2);
	                                wkt = wkt + aux2;


	                                if (i != (valores.length - 1)) {

	                                    wkt = wkt + ',';

	                                }



	                                //Ahora obtenermos las indicaciones
	                                if (i == 0 || i == (valores.length - 1) || (aux.maneuver.type == 'new name')) {

	                                    var aux3 = aux.maneuver.type + ' ' + aux.name;
	                                    aux3 = traducir(aux3);
	                                    var imagen; //variable para almacenar el icono de la direccion
	                                    indicaciones.push(aux3); //traducimos los textos

	                                } else if ((aux.maneuver.type == 'roundabout') || (aux.maneuver.type == 'rotary') || (aux.maneuver.type == 'roundabout turn')) {

	                                    var aux3 = aux.maneuver.type + ' coge la ' + aux.maneuver.exit + ' salida ' + aux.maneuver.modifier + ' ' + aux.name;
	                                    aux3 = traducir(aux3);
	                                    indicaciones.push(aux3);

	                                } else {

	                                    var aux3 = aux.maneuver.type + ' ' + aux.maneuver.modifier + ' ' + aux.name;
	                                    aux3 = traducir(aux3);
	                                    indicaciones.push(aux3);

	                                }

	                                //creamos el icono dependiendo de la direccion
	                                if (aux3.includes("recto") == true) {

	                                    imagen = 'recto';

	                                } else if (aux3.includes("izquierda") == true) {

	                                    imagen = 'izquierda';

	                                } else if (aux3.includes("derecha") == true) {

	                                    imagen = 'derecha';

	                                } else if (aux3.includes("sentido") == true) {

	                                    imagen = 'vuelta';

	                                } else if (aux3.includes("Salida") == true) {

	                                    imagen = 'start_mini';

	                                } else if (aux3.includes("llegado") == true) {

	                                    imagen = 'stop_mini';

	                                } else {

	                                    imagen = 'recto';

	                                }

	                                //Construimos el store de indicaciones
	                                if (i == 0) {

	                                    data2 = '[["' + imagen + '","' + aux3 + '","' + ((aux.distance) / 1000).toFixed(2) + ' km"]';

	                                } else {
	                                    data2 = data2 + ',["' + imagen + '","' + aux3 + '","' + ((aux.distance) / 1000).toFixed(2) + ' km"]';

	                                }

	                            }

	                            // this is the line that swaps out the elements
	                            data2 = data2 + ']';
	                            data2 = eval(data2);
	                            indicacionestore.loadData(data2, false); //cargamos los datos sobre el store original de indicaciones


	                            wkt = wkt + ')';
	                            //alert (indicaciones);

	                            //Ahora leemos el wkt en una variable wkt de openlayers, transformamos al sistema de referencia del mapa y añadimos los registros a la capa ruta del mapa
	                            var readwkt = new OpenLayers.Format.WKT();
	                            var features = readwkt.read(wkt);
	                            features.geometry.transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
	                            var bounds;
	                            if (features) {
	                                if (features.constructor != Array) {
	                                    features = [features];
	                                }
	                                for (var i = 0; i < features.length; ++i) {
	                                    if (!bounds) {
	                                        bounds = features[i].geometry.getBounds();
	                                    } else {
	                                        bounds.extend(features[i].geometry.getBounds());
	                                    }

	                                }

	                                ruta.addFeatures(features);
	                                map.addLayer(ruta);
									           
									
	                                map.zoomToExtent(bounds);
	                            } else {}

	                            Ext.getCmp('indicaciones').toggleCollapse(true); //mostramos el panel de indicaciones al usuario

	                        })

	                    .fail(function(jqXHR, textStatus, errorThrown) {
	                        if (console && console.log) {
	                            console.log("Something failed: " + textStatus);
	                        }
	                    });

	                });
	        }



	        function traducir(indicaciones) { //funcion para traducir las indicaciones de las rutas

	            //Traducciones maniobras
	            indicaciones = indicaciones.replaceAll('turn', 'Gira');
	            indicaciones = indicaciones.replaceAll('new name', 'El nombre de la calle cambia a');
	            indicaciones = indicaciones.replaceAll('depart', 'Salida de');
	            indicaciones = indicaciones.replaceAll('arrive', 'Ha llegado a');
	            indicaciones = indicaciones.replaceAll('merge', 'Incorporate');
	            indicaciones = indicaciones.replaceAll('on ramp', 'Subir la rampa');
	            indicaciones = indicaciones.replaceAll('off ramp', 'Bajar la rampa');
	            indicaciones = indicaciones.replaceAll('fork', 'Situate');
	            indicaciones = indicaciones.replaceAll('end of road', 'Final de carretera');
	            indicaciones = indicaciones.replaceAll('continue', 'Continua');
	            indicaciones = indicaciones.replaceAll('roundabout', 'En la rotonda');
	            indicaciones = indicaciones.replaceAll('rotary', 'En la rotonda');
	            indicaciones = indicaciones.replaceAll('roundabout turn', 'En la rotonda');
	            indicaciones = indicaciones.replaceAll('notification', 'Cambio');

	            //Traducciones modificaciones
	            indicaciones = indicaciones.replaceAll('uturn', 'realiza un cambio de sentido por');
	            indicaciones = indicaciones.replaceAll('sharp right', 'bruscamente a la derecha por');
	            indicaciones = indicaciones.replaceAll('slight right', 'ligeramente a la derecha por');
	            indicaciones = indicaciones.replaceAll('straight', 'recto por');
	            indicaciones = indicaciones.replaceAll('slight left', 'ligeramente a la izquierda por');
	            indicaciones = indicaciones.replaceAll('sharp left', 'bruscamente a la izquierda por');
	            indicaciones = indicaciones.replaceAll('left', 'a la izquierda por');
	            indicaciones = indicaciones.replaceAll('right', 'a la derecha por');

	            //salidas de las rotondas
	            indicaciones = indicaciones.replaceAll('1', 'primera');
	            indicaciones = indicaciones.replaceAll('2', 'segunda');
	            indicaciones = indicaciones.replaceAll('3', 'tercera');
	            indicaciones = indicaciones.replaceAll('4', 'cuarta');
	            indicaciones = indicaciones.replaceAll('5', 'quinta');
	            indicaciones = indicaciones.replaceAll('6', 'sexta');
	            indicaciones = indicaciones.replaceAll('7', 'septima');
	            indicaciones = indicaciones.replaceAll('8', 'octava');
	            indicaciones = indicaciones.replaceAll('9', 'novena');
	            indicaciones = indicaciones.replaceAll('10', 'decima');


	            return indicaciones;

	        }
			
		

//FUNCION PARA DESPLEGAR LISTADO DE CAPAS DE VECTORES
function combocapas(map, geometria) {


	var capas = map.getLayersByClass("OpenLayers.Layer.Vector");

	
	var capasmodel= '[';

	
	//Recorremos todas las capas seleccinadas y las metemos en el objeto store para ser mostradas en el selector de capas
	for (i = 0; i < capas.length; i++) {
	
	    capasmodel = capasmodel + '{"name":"' +  capas[i].name   + '"},';
	
	}
	capasmodel = capasmodel + ']'
	capasmodel = eval(capasmodel);


	Ext.getCmp('selectcapas').getStore( ).loadData( capasmodel );
								
}			
			
			
			//FUNCIONES PARA PASAR UNA CAPA A FORMATO GeoJSON
        function updateFormats() {  //manejador de formatos para pasar una capa a GeoJSON
            var in_options = {
                'internalProjection': new OpenLayers.Projection("EPSG:900913"),
                'externalProjection': new OpenLayers.Projection("EPSG:4326")
            };   
            var out_options = {
                'internalProjection': new OpenLayers.Projection("EPSG:900913"),
                'externalProjection': new OpenLayers.Projection("EPSG:4326")
            };

            formats = {
              'in': {

                geojson: new OpenLayers.Format.GeoJSON(in_options),

              },
              'out': {

                geojson: new OpenLayers.Format.GeoJSON(out_options),

              }
            };
        }
		
		//funcion para convertir una capa en GeoJSON
		function serialize(vectors) {  
	    	updateFormats();
			var type = 'geojson';
			var pretty = false; //variable para que el json salga formateado o no
            var str = formats['out'][type].write(vectors, pretty);
            str = str.replace(/,/g, ', ');
			
			return str;
            //alert(str);
        }
		
		//funcion para convertir un GeoJSON en una capa
		function deserialize(map, element,vectors) {
            //var element = document.getElementById('text');
            var type = 'geojson';
            var features = formats['in'][type].read(element);
            var bounds;
            if(features) {
                if(features.constructor != Array) {
                    features = [features];
                }
                for(var i=0; i<features.length; ++i) {
                    if (!bounds) {
                        bounds = features[i].geometry.getBounds();
                    } else {
                        bounds.extend(features[i].geometry.getBounds());
                    }

                }
                vectors.addFeatures(features);
                map.zoomToExtent(bounds);
                var plural = (features.length > 1) ? 's' : '';
                //element.value = features.length + ' feature' + plural + ' added';
            } else {
                //element.value = 'Bad input ' + type;
            }
        }

	
    //FUNCION QUE ABRE UNA VENTANA CON LA INFORMACION SOBRE EL VISOR Y SUS AUTORES
   function acercade() {
   
   window.open("acercade.html" ,"","width=700, height=600, resizable=no, center=on");
   
   }
   
   //FUNCIONES PARA SOLICITAR Y CARGAR EL TIEMPO
   			function carga_informacion(){
					
					var parameter = "lon";
					var parameter2 = "lat";
					
					//llamada a las funciones para captar las variables pasadas desde el objeto padre
					var lon = getParameter(parameter);
					var lat = getParameter(parameter2);
					

					$("#datos").load('clima.php?lon=' +lon+ "&lat="+lat);

					//Carga el clima php y devuelve el resultado de la consulta en el id de datos
					//$("#datos").load('clima.php');
					

				
			}
			
			
			//función que devuelve el parametro pasado por la url desde el objeto padre
			function getParameter(parameter){
			
                  // Obtiene la cadena completa de URL
                  var url = location.href;
                  /* Obtiene la posicion donde se encuentra el signo ?, ahi es donde empiezan los parametros */
                  var index = url.indexOf("?");
                  /* Obtiene la posicion donde termina el nombre del parametro e inicia el signo = */
                  index = url.indexOf(parameter,index) + parameter.length;
                  /* Verifica que efectivamente el valor en la posicion actuales el signo = */
                  if (url.charAt(index) == "="){
                  // Obtiene el valor del parametro
                  var result = url.indexOf("&",index);
                  if (result == -1){result=url.length;};
                  // Despliega el valor del parametro
                  var resultado = url.substring(index + 1,result);
				  return resultado;
                  //alert(resultado);
                  }

            } 
	

   //FUNCIONES PARA MOSTRAR BOCADILLOS EN LOS PUNTOS DE INTERES TURISTICO	
	function muestrapuntos(nomPunt, turis ,map){
	
	    var turis = turis; //variable para saber si la funcion origen es la de pinchar sobre el mapa o la de seleccion de puntos

		
			var puntos_turisticos = new geocloud.geoJsonStore({
				db: "jagarga",
				sql: "select punto, latitud, longitud, descrip, descrip2, imagen from puntos_turi2 where identifica= '" + nomPunt + "'",
			});
			
			puntos_turisticos.load();

			puntos_turisticos.onLoad = function(){

			     var lat = puntos_turisticos.layer.features[0].attributes.latitud;
				 var lon = puntos_turisticos.layer.features[0].attributes.longitud;
				 var nombre = puntos_turisticos.layer.features[0].attributes.punto;
				 var descripcion = puntos_turisticos.layer.features[0].attributes.descrip;
				 var descripcion2 = puntos_turisticos.layer.features[0].attributes.descrip2;
				 var imagen = puntos_turisticos.layer.features[0].attributes.imagen;
				 
				 
				 if (descripcion2 == null ) {
				 
				 descripcion = descripcion;
				 //alert (descripcion);
				 
				 } else {
				 
				 descripcion= descripcion + " " + descripcion2;
				 //alert (descripcion + " " + descripcion2);
				 }
				 
				 
				 devuelvepunto (lat, lon, nombre, descripcion, imagen, turis ,map);
				//map.zoomToExtent(route.getDataExtent());
			}
		
		
   }

    function devuelvepunto(lat, lon, nompunt, descripcion, imagen, turis, map){

		
		//map.baseLayer.redraw();
		map.setCenter(new OpenLayers.LonLat(map.getCenter()), 5);  //Se cambia rapidamente el zoom para que se actualizen los iconos de salida y llegada
	

                    var lonLat = new OpenLayers.LonLat(lon, lat);	                
					var coords = lonLat.transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());


		  	// Crear una feature punto
          var punto = new OpenLayers.Geometry.Point(coords.lon,coords.lat);
          var feature= new OpenLayers.Feature.Vector(punto); 
		
		var turis = turis; //variable para aber si la funcion origen es la de pinchar sobre el mapa o la de seleccion de puntos
		
		if (turis == 1) {
		
		var nombre = nompunt;
		popupsturis(punto, nombre, descripcion, imagen, map);
		map.setCenter(lonLat, 18);
			 
		} else {
		
		  	         // Añadir las features a la capa vectorial
			 
			 start.features[0]=feature;
			 var nombre = nompunt;
			 
			 popupsturis(punto, nombre, descripcion, imagen);
			 
             map.setCenter(lonLat, 18);   
		
		}
		
   }
   
  
   	//metodo popups, que nos representa el nombre del punto turistico seleccionado
	function popupsturis(puntoturis, nombre, descripcion, imagen ,map) {
			
	        //Este while borra todos los popups anteriores si existen	
        while( map.popups.length>1 ) {
              map.removePopup(map.popups[0]);
        }
			
         //crea dos popups y los asigna a cada punto			
            var turispopup = new OpenLayers.Popup.FramedCloud(
            "Punto de interés", 
            puntoturis.getBounds().getCenterLonLat(),
            new OpenLayers.Size(30, 30),
            nombre.bold() + "<br />" + descripcion + "<br /> <br />" + "<div align='center'> <IMG id= 'turismo' img border='2' src='img/turismo/" + imagen + "' > </div>" ,
            null, 
            true, 
            null);
            
			turispopup.maxSize = new OpenLayers.Size(500,400);
			map.addPopup(turispopup);
			
			};
		
	        //metodo prototype para cambiar de idioma las indicaciones reemplazando strings
	        String.prototype.replaceAll = function(target, replacement) {
	            return this.split(target).join(replacement);
	        };