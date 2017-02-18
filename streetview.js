	
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

      function initialize() {
	  
	  				var parameter = "lon";
					var parameter2 = "lat";
					
					//llamada a las funciones para captar las variables pasadas desde el objeto padre
					var longitud = getParameter(parameter);
					var latitud = getParameter(parameter2);
					
					
        var panorama = new google.maps.StreetViewPanorama(
            document.getElementById('street-view'),
            {
              position: {lat: Number(latitud), lng: Number(longitud)},
              pov: {heading: 165, pitch: 0},
              zoom: 1
            });
      }