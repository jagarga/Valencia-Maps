
<?php

	$lon = $_REQUEST['lon'];
	$lat = $_REQUEST['lat'];

class import
{
	public function domNodeToArray(DOMNode $node){
	

	

			$ret = '';
			if($node->hasAttributes()){
				$ret = array();
				//foreach($node->attributes as $attr){ $ret["attributes"][utf8_decode($attr->nodeName)] = utf8_decode((string)$attr->nodeValue); }
				foreach($node->attributes as $attr){ $ret["attributes"][$attr->nodeName] = (string)$attr->nodeValue; }
			} // end condition
			if($node->hasChildNodes()){
				if(
					$node->firstChild === $node->lastChild 
					&& (
						$node->firstChild->nodeType === XML_TEXT_NODE 
						|| $node->firstChild->nodeType === XML_CDATA_SECTION_NODE 
						|| $node->firstChild->nodeType === 0 
					)
				){
					// Node contains nothing but a text node, return its value
					//$ret["value"] = trim(utf8_decode((string)$node->nodeValue));
					$ret["value"] = trim(((string)$node->nodeValue));
				}
				else{
					// Otherwise, do recursion
					if(!is_array($ret)){ $ret = array(); }
					foreach($node->childNodes as $child){
						if($child->nodeType !== XML_TEXT_NODE){
							// If there's more than one node with this node name on the
							// current level, create an array
							//if(isset($ret[utf8_decode($child->nodeName)])){
							if(isset($ret[$child->nodeName])){
								//if(!is_array($ret[utf8_decode($child->nodeName)]) || !isset($ret[utf8_decode($child->nodeName)][0])){
								if(!is_array($ret[($child->nodeName)]) || !isset($ret[($child->nodeName)][0])){
									//$tmp = $ret[utf8_decode($child->nodeName)];
									//$ret[utf8_decode($child->nodeName)] = array();
									//$ret[utf8_decode($child->nodeName)][] = $tmp;
									$tmp = $ret[($child->nodeName)];
									$ret[($child->nodeName)] = array();
									$ret[($child->nodeName)][] = $tmp;
								}
								//$ret[utf8_decode($child->nodeName)][] = $this->domNodeToArray($child);
								$ret[($child->nodeName)][] = $this->domNodeToArray($child);
							}
							else{
								// echo($child->nodeName.":".$child->firstChild->nodeType."<br />");
								//$ret[utf8_decode($child->nodeName)][] = $this->domNodeToArray($child);
								$ret[($child->nodeName)][] = $this->domNodeToArray($child);
							}
						}
						else{
							// echo("D2<br />");
						}
					}
				}
			}
			return $ret;
	}
}

//$filepath='http://api.worldweatheronline.com/free/v1/weather.ashx?key=yh3vubp3ks7bphd4znqwx387&q=48.85,2.35&num_of_days=1&format=xml';
$filepath='http://api.worldweatheronline.com/free/v1/weather.ashx?key=yh3vubp3ks7bphd4znqwx387&q='.$lat.','.$lon.'&num_of_days=5&format=xml';


$importacion = new import();

$reader = new XMLReader();
$reader->open($filepath);

$elemento = 'data';

while($reader->read()){

			// echo("nodeType: ".$reader->nodeType." (".$reader->localName.")<br />");
			switch($reader->nodeType){
				case XMLReader::ELEMENT:
					if($reader->localName != null){
						$xmlProperty = new DOMDocument();
						$xmlProperty->preserveWhiteSpace = false;
						$xmlProperty->loadXML($reader->readOuterXML());
						foreach($xmlProperty->getElementsByTagName($elemento) as $node){
						

						
						
								$tmpArrayProperty = $importacion->domNodeToArray($node);
								
								
								//probando
								//$this->uploading_property($tmpArrayProperty, $user, $importarFotos);
							
							
							
							//}
							//$tmpArrayProperty = $this->domNodeToArray($node);
							//else{/*break;*/}
							// echo("tmpArrayProperty:<pre>"); print_r($tmpArrayProperty); echo("</pre>");
							// $propiedades[$x] = $tmpArrayProperty;
							$x++;
						}
					}
				break;
	}
}			
//echo("tmpArrayProperty:<pre>"); print_r($tmpArrayProperty); echo("</pre>");

echo("<div style='text-align: center;'>

<table border='1'>
<tr>
<td style='padding:3px; background-color:#F5D0A9;'>Hoy</td>
<td style='padding:3px; background-color:#F5D0A9;'>Hora de observacion</td>
<td style='padding:3px; background-color:#F5D0A9;'>Descripcion</td>
<td style='padding:3px; background-color:#F5D0A9;'>Temperatura</td>
<td style='padding:3px; background-color:#F5D0A9;'>Precipitacion</td>
<td style='padding:3px; background-color:#F5D0A9;'>Viento</td>
<td style='padding:3px; background-color:#F5D0A9;'>Humedad</td>
<td style='padding:3px; background-color:#F5D0A9;'>Nubosidad</td>
</tr>
<tr>
<td style='padding:3px; background-color:#F5D0A9;'><img src='".$tmpArrayProperty['current_condition'][0]['weatherIconUrl'][0]['value']."' ></td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['current_condition'][0]['observation_time'][0]['value']." </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['current_condition'][0]['weatherDesc'][0]['value']." </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['current_condition'][0]['temp_C'][0]['value']."&#8451 </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['current_condition'][0]['precipMM'][0]['value']."mm </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['current_condition'][0]['windspeedKmph'][0]['value']." Km/h </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['current_condition'][0]['humidity'][0]['value']."% </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['current_condition'][0]['cloudcover'][0]['value']."% </td>
</tr>
</table>

<br/>

<table border='1'>
<tr>
<td style='padding:3px; background-color:#F5D0A9;'>Pronostico</td>
<td style='padding:3px; background-color:#F5D0A9;'>Fecha</td>
<td style='padding:3px; background-color:#F5D0A9;'>Descripcion</td>
<td style='padding:3px; background-color:#F5D0A9;'>Temperatura minima</td>
<td style='padding:3px; background-color:#F5D0A9;'>Temperatura maxima</td>
<td style='padding:3px; background-color:#F5D0A9;'>Precipitacion</td>
<td style='padding:3px; background-color:#F5D0A9;'>Viento</td>
</tr>

<tr>
<td style='padding:3px; background-color:#F5D0A9;'><img src='".$tmpArrayProperty['weather'][1]['weatherIconUrl'][0]['value']."' ></td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][1]['date'][0]['value']." </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][1]['weatherDesc'][0]['value']." </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][1]['tempMinC'][0]['value']."&#8451 </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][1]['tempMaxC'][0]['value']."&#8451 </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][1]['precipMM'][0]['value']."mm </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][1]['windspeedKmph'][0]['value']." Km/h </td>
</tr>

<tr>
<td style='padding:3px; background-color:#F5D0A9;'><img src='".$tmpArrayProperty['weather'][2]['weatherIconUrl'][0]['value']."' ></td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][2]['date'][0]['value']." </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][2]['weatherDesc'][0]['value']." </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][2]['tempMinC'][0]['value']."&#8451 </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][2]['tempMaxC'][0]['value']."&#8451 </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][2]['precipMM'][0]['value']."mm </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][2]['windspeedKmph'][0]['value']." Km/h </td>
</tr>

<tr>
<td style='padding:3px; background-color:#F5D0A9;'><img src='".$tmpArrayProperty['weather'][2]['weatherIconUrl'][0]['value']."' ></td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][3]['date'][0]['value']." </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][3]['weatherDesc'][0]['value']." </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][3]['tempMinC'][0]['value']."&#8451 </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][3]['tempMaxC'][0]['value']."&#8451 </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][3]['precipMM'][0]['value']."mm </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][3]['windspeedKmph'][0]['value']." Km/h </td>
</tr>

<tr>
<td style='padding:3px; background-color:#F5D0A9;'><img src='".$tmpArrayProperty['weather'][2]['weatherIconUrl'][0]['value']."' ></td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][4]['date'][0]['value']." </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][4]['weatherDesc'][0]['value']." </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][4]['tempMinC'][0]['value']."&#8451 </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][4]['tempMaxC'][0]['value']."&#8451 </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][4]['precipMM'][0]['value']."mm </td>
<td style='padding:3px; background-color:#F5D0A9;'>".$tmpArrayProperty['weather'][4]['windspeedKmph'][0]['value']." Km/h </td>
</tr>

</table>

</div>




");
 ?>