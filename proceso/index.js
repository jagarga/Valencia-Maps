/*
 * Copyright (c) 2008-2015 The Open Source Geospatial Foundation
 * 
 * Published under the BSD license.
 * See https://github.com/geoext/geoext2/blob/master/license.txt for the full
 * text of the license.
 */

Ext.require([
    'Ext.container.Viewport',
    'Ext.window.MessageBox',
	'Ext.tab.*',
    'GeoExt.panel.Map',
    'GeoExt.Action' ,
	'GeoExt.form.Panel' ,
	'GeoExt.OverviewMap' ,
	'GeoExt.tree.Panel',
    'Ext.tree.plugin.TreeViewDragDrop',
	'GeoExt.tree.OverlayLayerContainer',
    'GeoExt.tree.BaseLayerContainer',
    'GeoExt.data.LayerTreeModel',
    'GeoExt.tree.View',
    'GeoExt.tree.Column',
	'GeoExt.data.reader.WmsCapabilities',
    'GeoExt.data.WmsCapabilitiesLayerStore',
]);


var formPanel, tree;

//variables globales para almacenar la posicion del raton en el evento onclick
var latclick;
var lonclick;

//variables para guardar las coordenadas a buscar
var latcoord;
var loncoord;

Ext.application({
    name: 'Principal',
    launch: function(){

	
	
	
	    //CREACION Y CONFIGURACION DEL MAPA OPENLAYERS
		
		    var options = {
				
                    projection: new OpenLayers.Projection("EPSG:900913"),

                    displayProjection: new OpenLayers.Projection("EPSG:4326"),

                    units: "degrees",

                    numZoomLevels: 22,

                    maxResolution: 156543.0339,
					
					allOverlays: false,
					
					fallThrough: true,

                    maxExtent: new OpenLayers.Bounds(-20037508, -20037508,

                                                     20037508, 20037508.34)

                };
		
        var map = new OpenLayers.Map('map', options);  //cremos el mapa asignandole las opciones
		//añadimos controles basicos de openlayers al mapa
        map.addControl(new OpenLayers.Control.LayerSwitcher());
		map.addControl(new OpenLayers.Control.MousePosition());
		
		
		//evento click para capturar la coordenada (necesita ser activado para usarse)
		OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {                
                defaultHandlerOptions: {
                    'single': true,
                    'double': false,
                    'pixelTolerance': 0,
                    'stopSingle': false,
                    'stopDouble': false
                },

                initialize: function(options) {
                    this.handlerOptions = OpenLayers.Util.extend(
                        {}, this.defaultHandlerOptions
                    );
                    OpenLayers.Control.prototype.initialize.apply(
                        this, arguments
                    ); 
                    this.handler = new OpenLayers.Handler.Click(
                        this, {
                            'click': this.trigger
                        }, this.handlerOptions
                    );
                }, 

				//captura la coordenada del click y abre google street view
                trigger: function(e) {
				
                    var lonlatclick = map.getLonLatFromPixel(e.xy);
					var coords = lonlatclick.transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
					latclick = coords.lat;
					lonclick = coords.lon;
					window.open("streetview.html?lat=" + latclick + "&lon=" + lonclick , '_blank', 'location=yes,height=500,width=500,scrollbars=yes,status=yes'); //abrimos ventana google street view
					//click.deactivate(); //desactivamos el evento una vez usado
                   // alert("You clicked near " + lonlatclick.lat + " N, " + lonlatclick.lon + " E");
                }

            });
			
		var click = new OpenLayers.Control.Click();
        map.addControl(click);
        //click.activate();
		//click.deactivate();
		
		
		//creamos y añadimos las capas base

		var osm = new OpenLayers.Layer.OSM("OpenStreetMap");
		

		//Capa de OSM en blanco y negro		
        var OSMtoner = new OpenLayers.Layer.XYZ(
              "OpenStreetMap (Toner)",
              "http://tile.stamen.com/toner/${z}/${x}/${y}.png",
              {
                sphericalMercator: true,
                wrapDateLine: true,
              }
         );


        var vector = new OpenLayers.Layer.Vector("vector");
        map.addLayers([osm, OSMtoner, vector]);
		

		
						//Insercion de las capas de google
				
				   var physical = new OpenLayers.Layer.Google(
 				     "Google Physical",
   				   {type: google.maps.MapTypeId.TERRAIN},
				    { isBaseLayer: false}
 				   );
 				   var streets = new OpenLayers.Layer.Google(
 				     "Google Streets"
 				   );
 				   var hybrid = new OpenLayers.Layer.Google(
  				    "Google Hybrid",
  				    {type: google.maps.MapTypeId.HYBRID}
  				   );
 				   var satellite = new OpenLayers.Layer.Google(
  				    "Google Satellite",
  				    {type: google.maps.MapTypeId.SATELLITE}
 				   );
 
 				   map.addLayers([physical, streets, hybrid, satellite]);
        
		
		//centramos el mapa en la ciudad de valencia
        if(!map.getCenter()){

				map.setCenter(new OpenLayers.LonLat(-42000, 4789000), 13);	
		}
		
				//WMS cartografia base del IGN			   
               var wmsignbase = new OpenLayers.Layer.WMS( "Cartografia base del IGN",
               "http://www.ign.es/wms-inspire/ign-base?",
               {layers: 'IGNBaseTodo', projection: 'EPSG:4230'} );
               map.addLayer(wmsignbase);

		
		
		
		//BARRA DE HERRAMIENTAS
        var ctrl, toolbarItems = [], action, actions = {};
        
        // ZoomToMaxExtent control, a "button" control
        action = Ext.create('GeoExt.Action', {
            control: new OpenLayers.Control.ZoomToMaxExtent(),
            map: map,
            //text: "max extent",
			iconCls : 'button_zommmax',
            tooltip: "zoom to max extent"
        });
        actions["max_extent"] = action;
        toolbarItems.push(Ext.create('Ext.button.Button', action));
        toolbarItems.push("-");
        
        // Navigation control and DrawFeature controls
        // in the same toggle group
        action = Ext.create('GeoExt.Action', {
            //text: "nav",
            control: new OpenLayers.Control.Navigation(),
            map: map,
            // button options
			iconCls : 'button_nav',
            toggleGroup: "draw",
            allowDepress: false,
            pressed: true,
            tooltip: "navigate",
            // check item options
            group: "draw",
            checked: true
        });
        actions["nav"] = action;
        toolbarItems.push(Ext.create('Ext.button.Button', action));
        
        action = Ext.create('GeoExt.Action', {
            //text: "draw poly",
            control: new OpenLayers.Control.DrawFeature(vector, OpenLayers.Handler.Polygon),
            map: map,
            // button options
			iconCls : 'button_draw',
            toggleGroup: "draw",
            allowDepress: false,
            tooltip: "draw polygon",
            // check item options
            group: "draw"
        });
        actions["draw_poly"] = action;
        toolbarItems.push(Ext.create('Ext.button.Button', action));
        
        action = Ext.create('GeoExt.Action', {
            //text: "draw line",
            control: new OpenLayers.Control.DrawFeature(vector, OpenLayers.Handler.Path),
            map: map,
            // button options
			iconCls : 'button_drawline',
            toggleGroup: "draw",
            allowDepress: false,
            tooltip: "draw line",
            // check item options
            group: "draw"
        });
        actions["draw_line"] = action;
        toolbarItems.push(Ext.create('Ext.button.Button', action));
        toolbarItems.push("-");
        
        // SelectFeature control, a "toggle" control
        action = Ext.create('GeoExt.Action', {
            //text: "select",
            control: new OpenLayers.Control.SelectFeature(vector, {
                type: OpenLayers.Control.TYPE_TOGGLE,
                hover: true
            }),
            map: map,
            // button options
			iconCls : 'button_select',
            enableToggle: true,
            tooltip: "select feature"
        });
        actions["select"] = action;
        toolbarItems.push(Ext.create('Ext.button.Button', action));
        toolbarItems.push("-");
        
        // Navigation history - two "button" controls
        ctrl = new OpenLayers.Control.NavigationHistory();
        map.addControl(ctrl);
        
        action = Ext.create('GeoExt.Action', {
            //text: "previous",
			iconCls : 'button_previous',
            control: ctrl.previous,
            disabled: true,
            tooltip: "previous in history"
        });
        actions["previous"] = action;
        toolbarItems.push(Ext.create('Ext.button.Button', action));
        
        action = Ext.create('GeoExt.Action', {
            //text: "next",
			iconCls : 'button_next',
            control: ctrl.next,
            disabled: true,
            tooltip: "next in history"
        });
        actions["next"] = action;
		toolbarItems.push(Ext.create('Ext.button.Button', action));
		
		//funcion para hacer zoom a valencia que se le añade a la barra de herramientas
        toolbarItems.push(Ext.create('Ext.button.Button', {
		iconCls : 'button_center',
		tooltip: "Zoom to Valencia",
		handler: function(){
                        map.setCenter(new OpenLayers.LonLat(-42000, 4789000), 13) },
		
		}));


		//funcion que abre google street view
		toolbarItems.push(Ext.create('Ext.button.Button', {
		
		 iconCls : 'button_streetview', 
		 tooltip: "Google street view",
		 /*handler: function(){
                        
                        $("*").css('cursor',"url('img/streetcursor.cur'), auto");  //cambiamos el cursos por el icono de street view
						click.activate();
						//window.open("streetview.html?lat=" + latclick + "&lon=" + lonclick , '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
						//this.disabled=true; 
                    }, */
	    listeners: {  //escuchador de eventos
   	    	     click: function() {
  	    	            $("*").css('cursor',"url('img/streetcursor.cur'), auto");  //cambiamos el cursos por el icono de street view
						click.activate();
  	    	     },
		    	 blur: function() {  //evento cuando nos vamos de este boton
   	    				$("*").css('cursor',"default");  //devolvemos el cursor a su estado original
						click.deactivate();
   	    	     }
	    }
		
		
                }
				));
				
	    		//funcion que abre google street view
		toolbarItems.push(Ext.create('Ext.button.Button', {
		
		 iconCls : 'button_coordinate', 
		 tooltip: "Go to specific coordinate",
		 handler: function(){
                        
 Ext.create('Ext.window.Window', {
                title: 'Go to coordinates',
                closable: true,
                closeAction: 'hide',
                width: 180,
                minWidth: 80,
                height: 145,
                animCollapse:false,
                border: false,
                modal: true,
                layout: {
                    type: 'border',
                    padding: 5
                },
   items: [{
       xtype: 'form',
	   reference: 'coordinateForm',
       items: [{
           xtype      : 'textfield',
           fieldLabel : 'Latitud',
		   id:          'latcoord',
           width      : 150,
		   padding: 4,
        },{
           xtype      : 'textfield',
           fieldLabel : 'Longitud',
		   id:          'loncoord',
           width      : 150,
		   padding: 4,
        },{
           xtype      : 'button',
           text       : 'Buscar',
		       handler: function() {
			      latcoord = Ext.getCmp('latcoord').getValue();
			      loncoord = Ext.getCmp('loncoord').getValue();
			      coordinateFormSubmit(latcoord,loncoord, map); //llamamos aesta la funcion que pasandole el mapa y la coordenada nos centra sobre esta coordenada

			      this.up('window').destroy(); //cerramos la ventana
			     //this.up('window').close(); //cerramos la ventana
                 },
		     padding: 4,
           },
		   ],
       }]
            }).show();
                    }, 
		
                }
				));
		
		//buscador geocoder de google
		toolbarItems.push("-");
		toolbarItems.push(Ext.create('Ext.form.field.Text', { id: 'textgeocode' }));
		toolbarItems.push(Ext.create('Ext.button.Button', {
            text: 'Buscar',
            handler: function() {
                //alert($('#textgeocode-inputEl').val());
				var direction = $('#textgeocode-inputEl').val();
				codeAddress(direction, map);
            }
          	}));
		
		
		//para añadir una barra de herramientas
		/* toolbarItems.push(Ext.create('Ext.Toolbar', {
                items: [
                    {text: 'add/remove', handler: actions["max_extent"]},
                    {text: 'movetop/bottom', handler: null },
                    {text: 'togglevis', handler: null},
                    {text: 'hide/show', handler: null},
                    {text: 'legendurl', handler: null}
                ]
            })); 
        toolbarItems.push("->");  */
        
        // Reuse the GeoExt.Action objects created above
        // as menu items
		//Barra de menu
        /* toolbarItems.push({
            text: "menu",
            menu: Ext.create('Ext.menu.Menu', {
                items: [
                    // ZoomToMaxExtent
                    Ext.create('Ext.button.Button', actions["max_extent"]),
                    // Nav
                    Ext.create('Ext.menu.CheckItem', actions["nav"]),
                    // Draw poly
                    Ext.create('Ext.menu.CheckItem', actions["draw_poly"]),
                    // Draw line
                    Ext.create('Ext.menu.CheckItem', actions["draw_line"]),
                    // Select control
                    Ext.create('Ext.menu.CheckItem', actions["select"]),
                    // Navigation history control
                    Ext.create('Ext.button.Button', actions["previous"]), 
                    Ext.create('Ext.button.Button', actions["next"])
                ]
            })
        });   */
        
		
		//Elemento mapa
        var mappanel = Ext.create('GeoExt.panel.Map', {
            //title: 'Using GeoExt.Action instances in various places',
			region: 'center',
            map: map,
            extent: '-22,34,42,64',
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'top',
                items: toolbarItems
            }] 
        });
		
		
		
		
		
		//PANEL IZQUIERDO CON EL GESTOR DE CAPAS Y EL MINIMAPA
        var store = Ext.create('Ext.data.TreeStore', {
            model: 'GeoExt.data.LayerTreeModel',
            root: {
                expanded: true,
                children: [
                    /*{
                        plugins: [{
                            ptype: 'gx_layercontainer',
                            store: mappanel.layers
                        }],
                        expanded: true
                    }, */ {
                        plugins: ['gx_baselayercontainer'],
                        expanded: true,
						iconCls: 'baselayer_icon',
                        text: "Base Maps"
                    }, {
                        plugins: ['gx_overlaylayercontainer'],
                        expanded: true,
						text: "Overlays",
						iconCls: 'overlay_icon',
                    }
                ]
            }
        });

		// create the tree with the configuration from above
		
		

        tree = Ext.create('GeoExt.tree.Panel', {
            border: true,
            region: "west",
            title: "Capas",
            width: 280,
            split: true,
            collapsible: true,
            //collapseMode: "mini",
            autoScroll: false,
            store: store,
            rootVisible: false,
            lines: false,
            tbar: [{
                text: "Cargar WMS",

					
				handler: function(){  //funcion para que el usuario carge capas WMS externas
				
				
				 Ext.create('Ext.window.Window', {
                title: 'Cargar servicio WMS',
                closable: true,
                closeAction: 'hide',
                width: 420,
                minWidth: 80,
                height: 105,
                animCollapse:false,
                border: false,
                modal: true,

   items: [{
       xtype: 'form',
	   reference: 'wmsForm',
       items: [{
           xtype      : 'textfield',
           fieldLabel : 'URL del servicio WMS',
		   id:          'wms',
		   value : "http://www.ign.es/wms-inspire/ign-base",
           width      : 350,
		   padding: 2,
        },{
           xtype      : 'button',
           text       : 'Consultar',
		       handler: function() {

			   		  var w = window.open('wms.html ','_blank','toolbar=0,location=0,directories=0, status=0,menubar=0,scrollbars=0,resizable=0,width=500,height=500,top=0,left=0');
					  //w.focus();


			     this.up('window').destroy(); //cerramos la ventana
			     //this.up('window').close(); //cerramos la ventana
                 },
		     padding: 4,
           },
		   ],
       }]
            }).show();
				
				
					window.AddWMS = function(capas, wms) {  //funcion llamada desde la ventana de wms capabilities que añade las capas seleccionadas al visor
                        
						for	(var i = 0; i < capas.length; i++) {
						
                          map.addLayer(new OpenLayers.Layer.WMS( "WMS del usuario",
                            wms,
                            {layers: capas[i], projection: 'EPSG:4230'} ));
						    this.up('window').destroy(); //cerramos la ventana
						
						}
                      }
				/*
				      var w = window.open('wms.html ','_blank','toolbar=0,location=0,directories=0, status=0,menubar=0,scrollbars=0,resizable=0,width=500,height=500,top=0,left=0');
					  //w.focus();
					  window.AddWMS = function(capas, wms) {  //funcion llamada desde la ventana de wms capabilities que añade las capas seleccionadas al visor
                        
						for	(var i = 0; i < capas.length; i++) {
						
                          map.addLayer(new OpenLayers.Layer.WMS( "WMS del usuario",
                            wms,
                            {layers: capas[i], projection: 'EPSG:4230'} ));
						//alert(capas);   
						
						}
                      }    */

                    },
            
            }, {
                text: "Cargar GeoJSON",
                handler: function() {
                    //mappanel.map.addLayer(layer);
                }
            }],
			fbar: [{
			
			        xtype: 'gx_overviewmap',
					height: 200,
					width: 250
			
			}],

        });
			
		//PANEL LATERAL DERECHO
        var formPanel = Ext.create('GeoExt.form.Panel', {
	        //hidden : false,
	        title: 'Herramientas',
			//responsive design
			plugins: 'responsive',
			responsiveConfig: {
                landscape: {
                        region:'east'
                },
                portrait: {
                        region:'north'
                }
            },
			collapsed: true,
	        collapsible: true,   // make collapsible

           /* protocol: new OpenLayers.Protocol.WFS({
                url: "http://publicus.opengeo.org/geoserver/wfs",
                featureType: "tasmania_roads",
                featureNS: "http://www.openplans.org/topp" 
            }),*/
            items: [{
			
	xtype: "tabpanel",
    width: 300,
    height: 350,
	//autoHeight: true,
	autowidth: true,
    activeTab: 0,
    items: [
        {
            title: 'Localizacion',
            bodyPadding: 10,
            html : 'A simple tab',
			items: [{
                xtype: "textfield",
                name: "name__ilike",
                value: "mont"
            }, {
                xtype: "textfield",
                name: "elevation__ge",
                value: "2000"
            },
			]
        },
        {
             title: 'Analisis',
            items: [{

			}]
        }, 
		
    ],
		
			} , 
			  {
//minimapa de localizacion
                    xtype: 'gx_overviewmap',
					height: 300,
					width: 300
                }
		
			],
            /*listeners: {
        actioncomplete: function(form, action) {
            // this listener triggers when the search request
            // is complete, the OpenLayers.Protocol.Response
            // resulting from the request is available
            // in "action.response"
                }
            } */
        });
        /*formPanel.add({
            xtype: 'toolbar',
            items: [{
                text: "Search",
                handler: function() {
                    this.search();
                },
                scope: formPanel
            }]
        }); */
		
		
		
		//MENU PRINCIPAL
        var menu = Ext.create('GeoExt.form.Panel', {
		    id:'menu' ,
	        //hidden : false,
	        //title: 'MENU PRINCIPAL',
			/*bodyStyle:{
                 background:'#08088A'
               },  */
			height: 60 ,
			//responsive design
			plugins: 'responsive',
			responsiveConfig: {
                landscape: {
                        region:'north'
                },
                portrait: {
                        region:'north'
                }
            },
			tbar: {
			  style: { background:'#08088A', marginTop: '0px' , borderWidth:'0px'},
			  items: [
			  {
                    xtype: 'button',
                    text: '<div style="color: white">My Button</div>',
					height: 60 ,
					//escuchador de eventos para cuando pulsamos el raton o pasamos por encima el raton
					listeners: {
    				     //evento on click
						 click: function() {

      				         this.setText('I was clicked!');
      				     },
						 //evento cuando pasamos el raton por encima
      				     mouseover: function() {

							  this.setText('<div style="color: Black">My Button</div>');
							  this.setStyle({'background':'#08088A', 'border-color':'#08088A'});

       				     },
						//evento cuando no pasamos el raton por encima
						 mouseout:  function() {
 
							  this.setText('<div style="color: White">My Button</div>');
							  this.setStyle({'background':'#08088A', 'border-color':'#08088A'});

       				     }
						
   				    }

                },
			  {
                    xtype: 'tbspacer', 
					width: 50

                },
			  {
                    xtype: 'button',
                    text: 'Large2',
					height: 60

                }			  		
			  ]
			}

			});

		//ELEMENTO PRINCIPAL
        //Elemento principal donde se añaden todos los items de la aplicación
        Ext.create('Ext.container.Viewport', {
            layout: 'border',
			//style: {borderColor:'#08088A', borderStyle:'solid', borderWidth:'0px'},
            items: [ menu, formPanel , tree, mappanel],
			/*tbar: Ext.create('Ext.Toolbar', {
            items: toolbarItems
            }) */
        });
    }
});
