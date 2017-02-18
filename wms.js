/**
 * Copyright (c) 2008-2010 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */
/** api: example[wms-capabilities]
 *  WMS Capabilities Store
 *  ----------------------
 *  Create layer records from WMS capabilities documents.
 */
GeoExt.data.YahooWMSCapabilitiesReader = Ext.extend(GeoExt.data.WMSCapabilitiesReader, {  //Extension para usar el servicio de Yahoo para usar su proxy
    readRecords: function(data){
        data = data.results.toString();
        return GeoExt.data.YahooWMSCapabilitiesReader.superclass.readRecords.call(this, data);
    }
});

var store;
var items = [];
var capas = [];


Ext.onReady(function(){


    //create a YQL URL
	var wms = getParameter('wms');  //recibimos el wms pasado como entrada
	var wmsUrl2 = "?service=WMS&version=1.3.0&request=GetCapabilities";
    var wmsUrl = encodeURIComponent(wms + wmsUrl2);
    var url = "http://query.yahooapis.com/v1/public/yql?q=select * from xml where url='";
    url += wmsUrl + "'"; 
	/*var wmsUrl = encodeURIComponent("http://wms.magrama.es/wms/wms.aspx?service=WMS&version=1.3.0&request=GetCapabilities");
	var url =  "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D'" + wmsUrl + "'";*/
	
   
	// var url = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D'http%3A%2F%2Fwms.magrama.es%2Fwms%2Fwms.aspx%3Fservice%3DWMS%26version%3D1.3.0%26request%3DGetCapabilities'"
  
	
    // Creacion del store para guardar los datos	
    store = new Ext.data.Store({
        reader: new GeoExt.data.YahooWMSCapabilitiesReader(),
        proxy: new Ext.data.ScriptTagProxy({
            url: url,
            disableCaching: false,
            method: "GET"
        })
    });
    // load the store with records derived from the doc at the above url
    store.load();
    

	
	    var viewport = new Ext.Viewport({
            layout: 'border',
			//style: {borderColor:'#08088A', borderStyle:'solid', borderWidth:'0px'},
            items: [{
			xtype: "grid",
			id: 'grid',
            title: "Cargador WMS",
            store: store,
	    	ref: "capsGrid", // makes the grid available as app.capsGrid
		    region:'center',
            columns: [{
                header: "Title",
                dataIndex: "title",
                sortable: true
            }, {
                header: "Name",
                dataIndex: "name",
                sortable: true
            }, {
                header: "Queryable",
                dataIndex: "queryable",
                sortable: true,
                width: 70
            }, {
                name: "as",
				id: "description",
                header: "Description",
                dataIndex: "abstract"
            }],
            autoExpandColumn: "description",
            height: 300,
            width: 650,
	    	bbar: [{
  	      text: "Cargar las capas seleccionadas en el mapa",
	
       	  handler: function() {  //funcion para extraer los datos seleccionados

		  
       	     viewport.capsGrid.getSelectionModel().each(function(record) {  //funcion a realizar para cada registro seleccionado
          	   /*var clone = record.clone();
           	   clone.getLayer().mergeNewParams({
                	    format: "image/png",
        	            transparent: true
            	    });*/
                   capas.push(record.data.name);
				   //alert ( record.data.name);

   	           });
			   
			//añadimos la variable con las capas a añadir a una sessionStorage para pasarselo a la ventana original
			//sessionStorage.setItem("capas", "caca"); 
			//var wms = "http://www.ign.es/wms-inspire/ign-base?";
			parent.window.opener.AddWMS(capas,wms);
            window.close();
			

    }
    }] ,

        listeners: {
            //rowdblclick: mapPreview
        }


			}]
			/*tbar: Ext.create('Ext.Toolbar', {
            items: toolbarItems
            }) */
        });
	


    
    /*function mapPreview(grid, index){
        var record = grid.getStore().getAt(index);
        var layer = record.getLayer().clone();
        
        var win = new Ext.Window({
            title: "Preview: " + record.get("title"),
            width: 512,
            height: 256,
            layout: "fit",
            items: [{
                xtype: "gx_mappanel",
                layers: [layer],
                extent: record.get("llbbox")
            }]
        });
        win.show(); 
    } */




	
		});

