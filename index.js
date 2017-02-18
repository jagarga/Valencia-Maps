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
    'GeoExt.Action',
    'GeoExt.form.Panel',
    'GeoExt.OverviewMap',
    'GeoExt.tree.Panel',
    'Ext.tree.plugin.TreeViewDragDrop',
    'GeoExt.tree.OverlayLayerContainer',
    'GeoExt.tree.BaseLayerContainer',
    'GeoExt.data.LayerTreeModel',
    'GeoExt.container.WmsLegend',
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

//Variables para el calculo de rutas
var latorigen, lonorigen, latdestino, londestino;
var distancia = ' '; //variable para almacenar la distancia de la ruta

//Variable para el radiobutton de elegir origen o destino
var radio = 3;

//Variable de geometrias para el selector de capas
var geometria;

//Store para guardar las indicaciones de la ruta
var storeindicaciones = Ext.create('Ext.data.Store', {
    storeId: 'indicacionesStore',
    fields: ['icon', 'indicaciones', 'distancia'],

    proxy: {
        type: 'memory',
        reader: {
            type: 'json',
            rootProperty: 'items'
        }
    }

});


//ESTILOS
//Estilo para la capa de ruta
var ruta_style = OpenLayers.Util.applyDefaults({
    strokeWidth: 3,
    strokeColor: "#2B0FCB",
    fillOpacity: 0,
    title: 'Ruta'
}, OpenLayers.Feature.Vector.style['default']);

//Estilo para la capa de buffer
var buffer_style = OpenLayers.Util.applyDefaults({
    strokeWidth: 2,
    strokeColor: "#E81B1B",
	fillColor: "#E81B1B",
    fillOpacity: 0.2,
    title: 'Ruta'
}, OpenLayers.Feature.Vector.style['default']);

//Estilo para la capa de bounding box
var bb_style = OpenLayers.Util.applyDefaults({
    strokeWidth: 2,
    strokeColor: "#FFFF00",
	fillColor: "#FFFF00",
    fillOpacity: 0.2,
    title: 'Ruta'
}, OpenLayers.Feature.Vector.style['default']);

//Estilo para la capa de interseccion
var intersect_style = OpenLayers.Util.applyDefaults({
    strokeWidth: 2,
    strokeColor: "#00FF00",
	fillColor: "#00FF00",
    fillOpacity: 0.2,
    title: 'Ruta'
}, OpenLayers.Feature.Vector.style['default']);

//Estilo para la capa de diferencia
var diferencia_style = OpenLayers.Util.applyDefaults({
    strokeWidth: 2,
    strokeColor: "#FE2EF7",
	fillColor: "#FE2EF7",
    fillOpacity: 0.2,
    title: 'Ruta'
}, OpenLayers.Feature.Vector.style['default']);

//Estilo para la capa de union
var union_style = OpenLayers.Util.applyDefaults({
    strokeWidth: 2,
    strokeColor: "#848484",
	fillColor: "#848484",
    fillOpacity: 0.2,
    title: 'Ruta'
}, OpenLayers.Feature.Vector.style['default']);

//Estilo para la capa de puntos turisticos
			var turismo_style = OpenLayers.Util.applyDefaults({
                externalGraphic: "img/turismo2.png",
                graphicWidth: 17,
                graphicHeight: 17,
                graphicYOffset: -26,
                graphicOpacity: 1
            }, OpenLayers.Feature.Vector.style['default']);



Ext.application({
    name: 'Principal',
	    // create a reference in Ext.application so we can access it from multiple functions
    splashscreen: {},
 
    // SPASHSCREEN DE INICIO
    init: function() {
        splashscreen = Ext.getBody().mask('<IMG SRC="img/logo2.png" WIDTH=550 HEIGHT=150 > <br> <center> <IMG SRC="img/world.gif" WIDTH=280 HEIGHT=280 > </center>', 'splashscreen');
        splashscreen.addCls('splashscreen');
    },
 

    launch: function() {

            // SPASHSCREEN DE INICIO
            var task = new Ext.util.DelayedTask(function() {
                
                splashscreen.fadeOut({
                    duration: 3000,
                    remove:true
                });
                
                splashscreen.next().fadeOut({
                    duration: 3000,
                    remove:true,
                    listeners: {
                        afteranimate: function() {
                            // Set the body as unmasked after the animation
                            Ext.getBody().unmask();
                        }
                    }
                });
            });

            task.delay(3000);



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

        var map = new OpenLayers.Map('map', options); //cremos el mapa asignandole las opciones
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
                this.handlerOptions = OpenLayers.Util.extend({}, this.defaultHandlerOptions);
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
                window.open("streetview.html?lat=" + latclick + "&lon=" + lonclick, '_blank', 'location=yes,height=500,width=500,scrollbars=yes,status=yes'); //abrimos ventana google street view
                //click.deactivate(); //desactivamos el evento una vez usado
                // alert("You clicked near " + lonlatclick.lat + " N, " + lonlatclick.lon + " E");
            }

        });

        var click = new OpenLayers.Control.Click();
        map.addControl(click);
        //click.activate();
        //click.deactivate();



        //evento click para seleccionar manualmente el origen y destino de la ruta
        OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
            defaultHandlerOptions: {
                'single': true,
                'double': false,
                'pixelTolerance': 0,
                'stopSingle': false,
                'stopDouble': false
            },

            initialize: function(options) {
                this.handlerOptions = OpenLayers.Util.extend({}, this.defaultHandlerOptions);
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
                var ll = new OpenLayers.LonLat(lonclick, latclick).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());

                if (radio == 1) {

                    //pasamos las coordenadas a las variables del origen para el calculo de rutas
                    latorigen = latclick;
                    lonorigen = lonclick;

                    //Añadimos el marcador de origen
                    if (map.getLayersByName("Origen").length === 0) { //si la capa no existe la creamos
                        var markerorigen = new OpenLayers.Layer.Markers("Origen");
                        markerorigen.id = "Origen";
                        map.addLayer(markerorigen);
                    }
                    if (map.getLayer('Origen')) {
                        map.getLayer('Origen').clearMarkers(); //borramos los marcadores anteriores
                    }
                    //Añadimos el marcador a la capa
                    var size = new OpenLayers.Size(21, 25);
                    var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
                    var icon = new OpenLayers.Icon('img/ol_icons/start.png', size, offset);
                    var markerslayer = map.getLayer('Origen');
                    markerslayer.addMarker(new OpenLayers.Marker(ll, icon));



                }

                if (radio == 2) {

                    //pasamos las coordenadas a las variables del destino para el calculo de rutas
                    latdestino = latclick;
                    londestino = lonclick;

                    //Añadimos el marcador de destino
                    if (map.getLayersByName("Destino").length === 0) { //si la capa no existe la creamos
                        var markerdestino = new OpenLayers.Layer.Markers("Destino");
                        markerdestino.id = "Destino";
                        map.addLayer(markerdestino);
                    }
                    if (map.getLayer('Destino')) {
                        map.getLayer('Destino').clearMarkers(); //borramos los marcadores anteriores
                    }
                    //Añadimos el marcador a la capa
                    var size = new OpenLayers.Size(21, 25);
                    var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
                    var icon = new OpenLayers.Icon('img/ol_icons/stop.png', size, offset);
                    var markerslayer2 = map.getLayer('Destino');
                    markerslayer2.addMarker(new OpenLayers.Marker(ll, icon));


                }


                //alert("You clicked near " + lonlatclick.lat + " N, " + lonlatclick.lon + " E");
            }

        });

        var click2 = new OpenLayers.Control.Click();
        map.addControl(click2);
        //click2.activate();
        //click2.deactivate();




        //creamos y añadimos las capas base

        var osm = new OpenLayers.Layer.OSM("OpenStreetMap");


        //Capa de OSM en blanco y negro		
        var OSMtoner = new OpenLayers.Layer.XYZ(
            "OpenStreetMap (Toner)",
            "http://tile.stamen.com/toner/${z}/${x}/${y}.png", {
                sphericalMercator: true,
                wrapDateLine: true,
            }
        );


        var vector = new OpenLayers.Layer.Vector("Vector");
        var ruta = new OpenLayers.Layer.Vector("Ruta", {
            style: ruta_style
        });
        map.addLayers([osm, OSMtoner, vector]);



        //Insercion de las capas de google

        var physical = new OpenLayers.Layer.Google(
            "Google Physical", {
                type: google.maps.MapTypeId.TERRAIN
            }, {
                isBaseLayer: false
            }
        );
        var streets = new OpenLayers.Layer.Google(
            "Google Streets"
        );
        var hybrid = new OpenLayers.Layer.Google(
            "Google Hybrid", {
                type: google.maps.MapTypeId.HYBRID
            }
        );
        var satellite = new OpenLayers.Layer.Google(
            "Google Satellite", {
                type: google.maps.MapTypeId.SATELLITE
            }
        );
		
		map.addLayers([physical, streets, hybrid, satellite]);

			//CARGAMOS NUESTRA CAPA PUNTOS TURISTICOS DEL SERVIDOR MAPCENTIA
				
			var puntos_turisticos = new geocloud.geoJsonStore({
				db: "jagarga",
				name: "Puntos turísticos",
				sql: "SELECT gid, the_geom AS wkt, identifica from puntos_turi2",
			});
			
        	puntos = puntos_turisticos.layer;
			puntos_turisticos.load();
			
			puntos.style = turismo_style;
			puntos.title= "Puntos turisticos";

			map.addLayer(puntos);
		
        	//Control para activar el evento click sobre la capa de puntos turisticos
			var selectFeature = new OpenLayers.Control.SelectFeature(puntos,  {onSelect: onFeatureSelect});
            map.addControl(selectFeature);
            selectFeature.activate();
			
			function onFeatureSelect(feature) {
                 selectedFeature = feature;
				 var punto = feature.data.identifica;
				 var turis = 1;  //variable para en la funcion muestrapuntos saber hay que asignarle los puntos de ruta o no
				 //alert (feature.data.identifica);
				 muestrapuntos(punto, turis, map);
				 //alert(feature.geometry.getBounds().getCenterLonLat().transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326")));
			}


        //centramos el mapa en la ciudad de valencia
        if (!map.getCenter()) {

            map.setCenter(new OpenLayers.LonLat(-42000, 4789000), 13);
        }

        //WMS cartografia base del IGN			   
        var wmsignbase = new OpenLayers.Layer.WMS("Cartografia base del IGN",
            "http://www.ign.es/wms-inspire/ign-base?", {
                layers: 'IGNBaseTodo',
                projection: 'EPSG:4230'
            });
        map.addLayer(wmsignbase);

        Ext.define('capasmodel', {
            extend: 'Ext.data.Model',
            fields: [{
                type: 'string',
                name: 'name'
            }, ]
        });


        //Variables para el select de capas de analisis
        var capas = map.getLayersByClass("OpenLayers.Layer.Vector");
        var capasmodel = '[';

        for (i = 0; i < capas.length; i++) {

            capasmodel = capasmodel + '{"name":"' + capas[i].name + '"},'

        }
        capasmodel = capasmodel + ']'

        capasmodel = eval(capasmodel);


        var capastore = Ext.create('Ext.data.Store', {
            model: 'capasmodel',
            data: capasmodel
        });


        //BARRA DE HERRAMIENTAS
        var ctrl, toolbarItems = [],
            action, actions = {};

        // ZoomToMaxExtent control, a "button" control
        action = Ext.create('GeoExt.Action', {
            control: new OpenLayers.Control.ZoomToMaxExtent(),
            map: map,
            //text: "max extent",
            iconCls: 'button_zommmax',
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
            iconCls: 'button_nav',
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
            iconCls: 'button_draw',
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
            iconCls: 'button_drawline',
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
            iconCls: 'button_select',
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
            iconCls: 'button_previous',
            control: ctrl.previous,
            disabled: true,
            tooltip: "previous in history"
        });
        actions["previous"] = action;
        toolbarItems.push(Ext.create('Ext.button.Button', action));

        action = Ext.create('GeoExt.Action', {
            //text: "next",
            iconCls: 'button_next',
            control: ctrl.next,
            disabled: true,
            tooltip: "next in history"
        });
        actions["next"] = action;
        toolbarItems.push(Ext.create('Ext.button.Button', action));

        //funcion para hacer zoom a valencia que se le añade a la barra de herramientas
        toolbarItems.push(Ext.create('Ext.button.Button', {
            iconCls: 'button_center',
            tooltip: "Zoom to Valencia",
            handler: function() {
                map.setCenter(new OpenLayers.LonLat(-42000, 4789000), 13)
            },

        }));


        //funcion que abre google street view
        toolbarItems.push(Ext.create('Ext.button.Button', {

            iconCls: 'button_streetview',
            tooltip: "Google street view",
            /*handler: function(){
                        
                        $("*").css('cursor',"url('img/streetcursor.cur'), auto");  //cambiamos el cursos por el icono de street view
						click.activate();
						//window.open("streetview.html?lat=" + latclick + "&lon=" + lonclick , '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
						//this.disabled=true; 
                    }, */
            listeners: { //escuchador de eventos
                click: function() {
                    $("#gx_mappanel-1022-body").css('cursor', "url('img/streetcursor.cur'), auto"); //cambiamos el cursos por el icono de street view
                    click.activate();
                },
                blur: function() { //evento cuando nos vamos de este boton
                    $("#gx_mappanel-1022-body").css('cursor', "default"); //devolvemos el cursor a su estado original
                    click.deactivate();
                }
            }


        }));

        //funcion para buscar por coordenada
        toolbarItems.push(Ext.create('Ext.button.Button', {

            iconCls: 'button_coordinate',
            tooltip: "Go to specific coordinate",
            handler: function() {

                Ext.create('Ext.window.Window', {
                    title: 'Go to coordinates',
                    closable: true,
                    closeAction: 'hide',
                    width: 180,
                    minWidth: 80,
                    height: 145,
                    animCollapse: false,
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
                            xtype: 'textfield',
                            fieldLabel: 'Latitud',
                            id: 'latcoord',
                            width: 150,
                            padding: 4,
                        }, {
                            xtype: 'textfield',
                            fieldLabel: 'Longitud',
                            id: 'loncoord',
                            width: 150,
                            padding: 4,
                        }, {
                            xtype: 'button',
                            text: 'Buscar',
                            handler: function() {
                                latcoord = Ext.getCmp('latcoord').getValue();
                                loncoord = Ext.getCmp('loncoord').getValue();
                                buscaposicion(loncoord, latcoord, map); //llamamos aesta la funcion que pasandole el mapa y la coordenada nos centra sobre esta coordenada

                                this.up('window').destroy(); //cerramos la ventana
                                //this.up('window').close(); //cerramos la ventana
                            },
                            padding: 4,
                        }, ],
                    }]
                }).show();
            },

        }));

		//funcion para hacer mostrar el tiempo
        toolbarItems.push(Ext.create('Ext.button.Button', {
            iconCls: 'button_clima',
            tooltip: "Ver el tiempo",
            handler: function() {
                
				   var bounds = map.getExtent();
   var coords = bounds.getCenterLonLat();
   coords.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"))

   var lon = coords.lon;
   var lat = coords.lat;
   //alert (lon + " " + lat);
   
   //window.showModalDialog("eltiempo.html?lat=39.474&lon=-0.376","","dialogwidth: 500; dialogheight: 300; resizable: yes; center: off");
   window.open("eltiempo.html?lat=" + lat + "&lon=" + lon ,"","width=700, height=600, resizable=no, center=on");
				
            },

        }));
		
        //buscador geocoder de google
        toolbarItems.push("-");
        toolbarItems.push(Ext.create('Ext.form.field.Text', {
            id: 'textgeocode',
            value: 'Buscar direccion'
        }));
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
                    }, */
                    {
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
            //width: 280,
			plugins: 'responsive',
            responsiveConfig: {
				'width < 700': {
width: 230,
                 },
                 'width >= 700': {
width: 280,
                },
				},
            split: true,
            collapsible: true,
            //collapseMode: "mini",
            autoScroll: false,
            store: store,
            rootVisible: false,
            lines: false,
            tbar: [{
                    text: "Cargar WMS",


                    handler: function() { //funcion para que el usuario carge capas WMS externas


                        Ext.create('Ext.window.Window', {
                            title: 'Cargar servicio WMS',
                            closable: true,
                            //closeAction: 'hide',
                            width: 400,
                            minWidth: 80,
                            height: 105,
                            animCollapse: false,
                            border: false,
                            modal: true,

                            items: [{
                                xtype: 'form',
                                reference: 'wmsForm',
                                items: [{
                                    xtype: 'textfield',
                                    fieldLabel: 'URL del WMS',
                                    id: 'wms',
                                    value: "http://www.ign.es/wms-inspire/ign-base",
                                    width: 350,
                                    padding: 2,
                                }, {
                                    xtype: 'button',
                                    text: 'Consultar',
                                    handler: function() {

                                        var w = window.open('wms.html?wms=' + Ext.getCmp('wms').getValue() + ' ', '_blank', 'toolbar=0,location=0,directories=0, status=0,menubar=0,scrollbars=0,resizable=0,width=500,height=500,top=0,left=0');
                                        //w.focus();


                                        this.up('window').destroy(); //cerramos la ventana
                                        //this.up('window').close(); //cerramos la ventana
                                    },
                                    padding: 4,
                                }, ],
                            }]
                        }).show();


                        window.AddWMS = function(capas, wms) { //funcion llamada desde la ventana de wms capabilities que añade las capas seleccionadas al visor

                                for (var i = 0; i < capas.length; i++) {

                                    map.addLayer(new OpenLayers.Layer.WMS("WMS del usuario",
                                        wms, {
                                            layers: capas[i],
                                            projection: 'EPSG:4230'
                                        }));
                                    this.up('window').destroy(); //cerramos la ventana

                                }
                            }

                    },

                },
                /*{
                               text: "Cargar GeoJSON",
                               handler: function() {
                                   //mappanel.map.addLayer(layer);
                               }
                           }*/
            ],

            fbar: [{

                xtype: 'gx_overviewmap',
				plugins: 'responsive',
			responsiveConfig: {
                landscape: {
                height: 200,
                width: 250
                },
                portrait: {
                height: 0,
                width: 0
                },
				'height < 400 && wide': {
                height: 0,
                width: 0
                 },
                 'height >= 400 &&wide': {
                 height: 200,
                width: 250
                },
            },


            }],

        });




        //PANEL LATERAL DERECHO
        var formPanel = Ext.create('GeoExt.form.Panel', {
            //hidden : false,
            title: 'Herramientas',
            //responsive design
            plugins: 'responsive',
            layout: 'fit',
            resizable: 'true',
            responsiveConfig: {
                landscape: {
                    region: 'east'
                },
                portrait: {
                    region: 'north'
                },
				'height < 400 && wide': {
hidden : true,
                 },
                 'height >= 400 && wide': {
hidden : false,
                },
            },
            collapsed: true,
            collapsible: true, // make collapsible

            /* protocol: new OpenLayers.Protocol.WFS({
                 url: "http://publicus.opengeo.org/geoserver/wfs",
                 featureType: "tasmania_roads",
                 featureNS: "http://www.openplans.org/topp" 
             }),*/
            items: [{

                    xtype: "tabpanel",
                    id: "tabpanel",
                    width: 350,
					plugins: 'responsive',
            responsiveConfig: {
				'width < 700': {
width: 300,
                 },
                 'width >= 700': {
width: 350,
                },
            },
                    // height: 350,
                    //autoHeight: true,
                    autowidth: true,
                    activeTab: 0,
                    items: [{
                            title: 'Calculo de rutas',
                            bodyPadding: 0,
                            //xtype: "tabpanel",
							layout: 'accordion',
                            id: 'acordeon',
                            defaults: {
                                // applied to each contained panel
                                bodyStyle: 'padding:15px'
                            },
                            layoutConfig: {
                                // layout-specific configs go here
                                titleCollapse: false,
                                animate: true,
                                activeOnTop: true,
                            },
                            items: [{
                                    title: 'Por direccion',
                                    id: 'pordireccion',
                                    items: [

                                        {
                                            xtype: 'textfield',
                                            fieldLabel: 'ORIGEN',
                                            id: 'origen',
                                            value: "Calle PIO 9",
                                            width: 250,
                                            padding: 2,
                                            listeners: { //escuchador de eventos
                                                blur: function() { //evento cuando nos vamos de este boton

                                                    var directionorigen = Ext.getCmp('origen').getValue();
                                                    var geocoder = new google.maps.Geocoder();
                                                    //var address = document.getElementById('q-adress').value;
                                                    var address = directionorigen;
                                                    geocoder.geocode({
                                                        'address': address
                                                    }, function(results, status) {
                                                        if (status == google.maps.GeocoderStatus.OK) {

                                                            var coords = results[0].geometry.location;
                                                            var lat = results[0].geometry.location.lat();
                                                            var lng = results[0].geometry.location.lng();

                                                            var ll2 = new OpenLayers.LonLat(lng, lat);
                                                            //le asignamos las coordenadas a las variables para el calculo de la ruta
                                                            latorigen = ll2.lat;
                                                            lonorigen = ll2.lon;

                                                            var ll = new OpenLayers.LonLat(lng, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());

                                                            //Añadimos el marcador	
                                                            if (map.getLayersByName("Origen").length === 0) { //si la capa no existe la creamos
                                                                var markerorigen = new OpenLayers.Layer.Markers("Origen");
                                                                markerorigen.id = "Origen";
                                                                map.addLayer(markerorigen);
                                                            }
                                                            if (map.getLayer('Origen')) {
                                                                map.getLayer('Origen').clearMarkers(); //borramos los marcadores anteriores
                                                            }
                                                            //Añadimos el marcador a la capa
                                                            var size = new OpenLayers.Size(21, 25);
                                                            var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
                                                            var icon = new OpenLayers.Icon('img/ol_icons/start.png', size, offset);
                                                            var markerslayer = map.getLayer('Origen');
                                                            markerslayer.addMarker(new OpenLayers.Marker(ll, icon));

                                                            map.setCenter(ll, 16);


                                                        } else {
                                                            alert('Geocode was not successful for the following reason: ' + status);
                                                        }
                                                    });


                                                }
                                            }
                                        },{
                                            xtype: 'textfield',
                                            fieldLabel: 'DESTINO',
                                            id: 'destino',
                                            value: "Plaza Benimaclet",
                                            width: 250,
                                            padding: 2,
                                            listeners: { //escuchador de eventos
                                            /*    blur: function() { //evento cuando nos vamos de este boton

                                                    var directiondestino = Ext.getCmp('destino').getValue();
                                                    var geocoder = new google.maps.Geocoder();
                                                    //var address = document.getElementById('q-adress').value;
                                                    var address = directiondestino;
                                                    geocoder.geocode({
                                                        'address': address
                                                    }, function(results, status) {
                                                        if (status == google.maps.GeocoderStatus.OK) {

                                                            var coords = results[0].geometry.location;
                                                            var lat = results[0].geometry.location.lat();
                                                            var lng = results[0].geometry.location.lng();

                                                            var ll2 = new OpenLayers.LonLat(lng, lat);
                                                            //le asignamos las coordenadas a las variables para el calculo de la ruta
                                                            latdestino = ll2.lat;
                                                            londestino = ll2.lon;
                                                            var ll = new OpenLayers.LonLat(lng, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());

                                                            //Añadimos el marcador
                                                            if (map.getLayersByName("Origen").length === 0) { //si la capa no existe la creamos
                                                                var markerorigen = new OpenLayers.Layer.Markers("Origen");
                                                                markerorigen.id = "Origen";
                                                                map.addLayer(markerorigen);
                                                            }
                                                            if (map.getLayer('Origen')) {
                                                                map.getLayer('Origen').clearMarkers(); //borramos los marcadores anteriores
                                                            }
                                                            //Añadimos el marcador a la capa
                                                            var size = new OpenLayers.Size(21, 25);
                                                            var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
                                                            var icon = new OpenLayers.Icon('img/ol_icons/start.png', size, offset);
                                                            var markerslayer = map.getLayer('Origen');
                                                            markerslayer.addMarker(new OpenLayers.Marker(ll, icon));

                                                            map.setCenter(ll, 16);


                                                            //Añadimos el marcador	
                                                            if (map.getLayersByName("Destino").length === 0) { //si la capa no existe la creamos
                                                                var markerdestino = new OpenLayers.Layer.Markers("Destino");
                                                                markerdestino.id = "Destino";
                                                                map.addLayer(markerdestino);
                                                            }
                                                            if (map.getLayer('Destino')) {
                                                                map.getLayer('Destino').clearMarkers(); //borramos los marcadores anteriores
                                                            }
                                                            //Añadimos el marcador a la capa
                                                            var size = new OpenLayers.Size(21, 25);
                                                            var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
                                                            var icon = new OpenLayers.Icon('img/ol_icons/stop.png', size, offset);
                                                            var markerslayer2 = map.getLayer('Destino');
                                                            markerslayer2.addMarker(new OpenLayers.Marker(ll, icon));

                                                            map.setCenter(ll, 16);


                                                        } else {
                                                            alert('Geocode was not successful for the following reason: ' + status);
                                                        }
                                                    });

                                                } */
                                            }
                                        },{
                                            xtype: 'button',
                                            text: '<div style="color: Black">Establecer direcciones</div>',
                                            height: 25,
                                            margin: "15 2 4 2",
                                            //escuchador de eventos para cuando pulsamos el raton o pasamos por encima el raton
                                            listeners: {
                                                //evento on click
                                                click: function() {

												    var directionorigen = Ext.getCmp('origen').getValue();
                                                    var geocoder = new google.maps.Geocoder();
                                                    //var address = document.getElementById('q-adress').value;
                                                    var address = directionorigen;
                                                    geocoder.geocode({
                                                        'address': address
                                                    }, function(results, status) {
                                                        if (status == google.maps.GeocoderStatus.OK) {

                                                            var coords = results[0].geometry.location;
                                                            var lat = results[0].geometry.location.lat();
                                                            var lng = results[0].geometry.location.lng();

                                                            var ll2 = new OpenLayers.LonLat(lng, lat);
                                                            //le asignamos las coordenadas a las variables para el calculo de la ruta
                                                            latorigen = ll2.lat;
                                                            lonorigen = ll2.lon;

                                                            var ll = new OpenLayers.LonLat(lng, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());

                                                            //Añadimos el marcador	
                                                            if (map.getLayersByName("Origen").length === 0) { //si la capa no existe la creamos
                                                                var markerorigen = new OpenLayers.Layer.Markers("Origen");
                                                                markerorigen.id = "Origen";
                                                                map.addLayer(markerorigen);
                                                            }
                                                            if (map.getLayer('Origen')) {
                                                                map.getLayer('Origen').clearMarkers(); //borramos los marcadores anteriores
                                                            }
                                                            //Añadimos el marcador a la capa
                                                            var size = new OpenLayers.Size(21, 25);
                                                            var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
                                                            var icon = new OpenLayers.Icon('img/ol_icons/start.png', size, offset);
                                                            var markerslayer = map.getLayer('Origen');
                                                            markerslayer.addMarker(new OpenLayers.Marker(ll, icon));

                                                            map.setCenter(ll, 16);


                                                        } else {
                                                            alert('Geocode was not successful for the following reason: ' + status);
                                                        }
                                                    });
												
												
												    var directiondestino = Ext.getCmp('destino').getValue();
                                                    var geocoder = new google.maps.Geocoder();
                                                    //var address = document.getElementById('q-adress').value;
                                                    var address = directiondestino;
                                                    geocoder.geocode({
                                                        'address': address
                                                    }, function(results, status) {
                                                        if (status == google.maps.GeocoderStatus.OK) {

                                                            var coords = results[0].geometry.location;
                                                            var lat = results[0].geometry.location.lat();
                                                            var lng = results[0].geometry.location.lng();

                                                            var ll2 = new OpenLayers.LonLat(lng, lat);
                                                            //le asignamos las coordenadas a las variables para el calculo de la ruta
                                                            latdestino = ll2.lat;
                                                            londestino = ll2.lon;
                                                            var ll = new OpenLayers.LonLat(lng, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());


                                                            //Añadimos el marcador	
                                                            if (map.getLayersByName("Destino").length === 0) { //si la capa no existe la creamos
                                                                var markerdestino = new OpenLayers.Layer.Markers("Destino");
                                                                markerdestino.id = "Destino";
                                                                map.addLayer(markerdestino);
                                                            }
                                                            if (map.getLayer('Destino')) {
                                                                map.getLayer('Destino').clearMarkers(); //borramos los marcadores anteriores
                                                            }
                                                            //Añadimos el marcador a la capa
                                                            var size = new OpenLayers.Size(21, 25);
                                                            var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
                                                            var icon = new OpenLayers.Icon('img/ol_icons/stop.png', size, offset);
                                                            var markerslayer2 = map.getLayer('Destino');
                                                            markerslayer2.addMarker(new OpenLayers.Marker(ll, icon));

                                                            map.setCenter(ll, 16);


                                                        } else {
                                                            alert('Geocode was not successful for the following reason: ' + status);
                                                        }
                                                    });

                                                },
                                            }


                                        }

                                    ]
                                },



                                {
                                    title: 'Por coordenadas',
                                    items: [

                                        {
                                            xtype: 'textfield',
                                            fieldLabel: 'Latitud origen',
                                            id: 'origen1',
                                            value: "39.45",
                                            width: 160,
                                            // padding: 2,
                                            margin: "10 2 4 2",
                                            listeners: { //escuchador de eventos

                                            }
                                        }, , {
                                            xtype: 'textfield',
                                            fieldLabel: 'Longitud origen',
                                            id: 'origen2',
                                            value: "-0.40",
                                            width: 160,
                                            padding: 2,
                                            listeners: { //escuchador de eventos

                                            }
                                        }, {
                                            xtype: 'textfield',
                                            fieldLabel: 'Latitud destino',
                                            id: 'destino1',
                                            value: "39.47",
                                            width: 160,
                                            //padding: 2,
                                            margin: "30 2 4 2",
                                            listeners: { //escuchador de eventos

                                            }
                                        }, {
                                            xtype: 'textfield',
                                            fieldLabel: 'Longitud destino',
                                            id: 'destino2',
                                            value: "-0.34",
                                            width: 160,
                                            padding: 2,
                                            listeners: { //escuchador de eventos

                                            }
                                        }, {
                                            xtype: 'button',
                                            text: '<div style="color: Black">Establecer coordenadas</div>',
                                            height: 25,
                                            margin: "15 2 4 2",
                                            //escuchador de eventos para cuando pulsamos el raton o pasamos por encima el raton
                                            listeners: {
                                                //evento on click
                                                click: function() {

                                                    //Cojemos las coordenadas de los textbox
                                                    latorigen = Ext.getCmp('origen1').getValue();
                                                    lonorigen = Ext.getCmp('origen2').getValue();
                                                    latdestino = Ext.getCmp('destino1').getValue();
                                                    londestino = Ext.getCmp('destino2').getValue();

                                                    var ll = new OpenLayers.LonLat(lonorigen, latorigen).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
                                                    var ll2 = new OpenLayers.LonLat(londestino, latdestino).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());


                                                    //Añadimos el marcador de origen
                                                    if (map.getLayersByName("Origen").length === 0) { //si la capa no existe la creamos
                                                        var markerorigen = new OpenLayers.Layer.Markers("Origen");
                                                        markerorigen.id = "Origen";
                                                        map.addLayer(markerorigen);
                                                    }
                                                    if (map.getLayer('Origen')) {
                                                        map.getLayer('Origen').clearMarkers(); //borramos los marcadores anteriores
                                                    }
                                                    //Añadimos el marcador a la capa
                                                    var size = new OpenLayers.Size(21, 25);
                                                    var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
                                                    var icon = new OpenLayers.Icon('img/ol_icons/start.png', size, offset);
                                                    var markerslayer = map.getLayer('Origen');
                                                    markerslayer.addMarker(new OpenLayers.Marker(ll, icon));


                                                    //Añadimos el marcador de destino
                                                    if (map.getLayersByName("Destino").length === 0) { //si la capa no existe la creamos
                                                        var markerdestino = new OpenLayers.Layer.Markers("Destino");
                                                        markerdestino.id = "Destino";
                                                        map.addLayer(markerdestino);
                                                    }
                                                    if (map.getLayer('Destino')) {
                                                        map.getLayer('Destino').clearMarkers(); //borramos los marcadores anteriores
                                                    }
                                                    //Añadimos el marcador a la capa
                                                    var size = new OpenLayers.Size(21, 25);
                                                    var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
                                                    var icon = new OpenLayers.Icon('img/ol_icons/stop.png', size, offset);
                                                    var markerslayer2 = map.getLayer('Destino');
                                                    markerslayer2.addMarker(new OpenLayers.Marker(ll2, icon));

                                                },
                                            }


                                        }

                                    ]


                                }, {
                                    title: 'Por posicion en el mapa',
                                    items: [{
                                        xtype: 'radiogroup',
                                        id: 'radio',
                                        //fieldLabel: 'Single Column',
                                        // Put all controls in a single column with width 100%
                                        columns: 1,
                                        items: [{
                                            boxLabel: 'Elige punto de salida',
                                            inputValue: '1',
                                            name: 'cb'
                                        }, {
                                            boxLabel: 'Elige punto de llegada',
                                            inputValue: '2',
                                            name: 'cb'
                                        }, {
                                            boxLabel: 'Por defecto',
                                            inputValue: '3',
                                            name: 'cb',
                                            checked: true
                                        }],
                                        listeners: {
                                            change: function(obj, value) {

                                                radio = value.cb;

                                                if (radio == 1) {

                                                    $("#gx_mappanel-1022-body").css('cursor', "url('img/start.cur'),auto"); //cambiamos el cursos por el icono de street view
                                                    click2.activate(); //activamos el control de click que dependiendo del valor del radio permitira elegir el punto de origen o destino
                                                }

                                                if (radio == 2) {

                                                    $("#gx_mappanel-1022-body").css('cursor', "url('img/stop.cur'), auto"); //cambiamos el cursos por el icono de street view
                                                    click2.activate(); //activamos el control de click que dependiendo del valor del radio permitira elegir el punto de origen o destino

                                                }

                                                if (radio == 3) {

                                                    $("#gx_mappanel-1022-body").css('cursor', "default"); //devolvemos el cursor a su estado original
                                                    click2.deactivate(); //desactivamos el control de click que dependiendo del valor del radio permitira elegir el punto de origen o destino
                                                }


                                                //alert(value.cb);
                                            }
                                        }

                                    }]
                                }, {
                                    title: 'Indicaciones',
                                    id: 'indicaciones',
                                    hidden: false,
                                    autoScroll: true,
                                    items: [

                                        Ext.create('Ext.grid.Panel', {
                                            //title: 'Indicaciones',
                                            id: 'gridindicaciones',
                                            autowidth: true,
                                            autoheight: true,
                                            bufferedRenderer: false,
                                            store: Ext.data.StoreManager.lookup('indicacionesStore'),
                                            columns: [{
                                                text: '',
                                                dataIndex: 'icon',
                                                sortable: false,
                                                renderer: function(value) {
                                                    return '<img src="img/ol_icons/' + value + '.png" />';
                                                },
                                                flex: 11 / 100
                                            }, {
                                                text: 'Indicaciones',
                                                dataIndex: 'indicaciones',
                                                sortable: false,
                                                flex: 67 / 100
                                            }, {
                                                text: 'Distancia',
                                                dataIndex: 'distancia',
                                                sortable: false,
                                                flex: 19 / 100
                                            }],
                                            listeners: {

                                            }


                                            //renderTo: Ext.getBody()
                                        })


                                    ]




                                },
                            ],
                            fbar: {
                                //style: { background:'#08088A', marginTop: '0px' , borderWidth:'0px'},
                                items: [{
                                        xtype: 'label',
                                        id: 'distancia',
                                        text: '',
                                    },


                                    { //boton para el ejecutar el calculo de ruta
                                        xtype: 'button',
                                        text: '<div style="color: Black">Calcular ruta</div>',
                                        height: 25,
                                        //escuchador de eventos para cuando pulsamos el raton o pasamos por encima el raton
                                        listeners: {
                                            //evento on click
                                            click: function() {

                                                //Mensaje de alerta a mostrar si no se han definido los puntos de origen y destino
                                                if (latorigen === undefined || latorigen === null || latdestino === undefined || latdestino === null || lonorigen === undefined || lonorigen === null || londestino === undefined || londestino === null) {
                                                    Ext.MessageBox.show({
                                                        title: 'Error',
                                                        msg: 'Introduce los puntos de ruta',
                                                        buttons: Ext.MessageBox.OK,
                                                        icon: Ext.Msg.ERROR
                                                    });

                                                } else {
                                                    $("#gx_mappanel-1021-body").css('cursor', "default"); //devolvemos el cursor a su estado original
                                                    distancia = calculoruta(map, ruta, latorigen, lonorigen, latdestino, londestino, storeindicaciones) //Metodo que devuelve la ruta calculada en forma de capa y las indicaciones de la ruta
                                                }
                                            },
                                        }

                                    }
                                ]
                            }
                        }, {
                            title: 'Analisis',
                            bodyPadding: 0,
                            layout: 'accordion',
                            id: 'acordeon2',
                            defaults: {
                                // applied to each contained panel
                                bodyStyle: 'padding:15px'
                            },
                            listeners: {
                                //evento on click
                                show: function() {
                                    geometria = 'todas';
                                    combocapas(map, geometria);
                                }

                            },
                            layoutConfig: {
                                // layout-specific configs go here
                                titleCollapse: false,
                                animate: true,
                                activeOnTop: true
                            },
                            items: [{
                                    title: 'Area de influencia',
                                    id: 'buffer',
                                    listeners: {
                                        //evento on click
                                        show: function() {
                                            geometria = 'todas';
                                            combocapas(map, geometria);
                                        },

                                        expand: function() {
                                            geometria = 'lineas';
                                            combocapas(map, geometria);
                                        }

                                    },
                                    items: [

                                        { //Selector del metodo de ruta

                                            xtype: 'combo',
                                            fieldLabel: 'Capa',
                                            id: 'selectcapas',
                                            displayField: 'name',
                                            width: 210,
                                            store: capastore,
                                            queryMode: 'local',
                                            typeAhead: true
                                        }, {
                                            xtype: 'textfield',
                                            fieldLabel: 'Distancia en metros',
                                            id: 'buffer_dist',
                                            value: "100",
                                            width: 210,
                                        }, {
                                            xtype: 'button',
                                            text: '<div style="color: Black">Calcular Area de influencia</div>',
                                            height: 25,
                                            margin: "15 2 4 2",
                                            //escuchador de eventos para cuando pulsamos el raton o pasamos por encima el raton
                                            listeners: {
                                                //evento on click
                                                click: function() {

                                                    var nombrecapa = Ext.getCmp('selectcapas').getValue(); //Obtenemos el nombre de la capa seleccionada
                                                    var bufferdist = Ext.getCmp('buffer_dist').getValue(); //Obtenemos la distancia
                                                    var capa = map.getLayersByName(nombrecapa) //Obtenemos la capa con ese nombre
                                                    if (capa[0].features.length > 0) { //comprobamos que hay al menos un feature para no procesar ninguna capa vacia
                                                        var capabuffer = serialize(capa[0].features); //Pasamos esa capa a GeoJSON
                                                        var obj = JSON.parse(capabuffer);
                                                        //alert(obj.features[0]);

                                                        var buffer = turf.buffer(obj.features[0], bufferdist, 'meters');

                                                        var layername = "AOI_" + nombrecapa;
                                                        var buffer_layer = new OpenLayers.Layer.Vector(layername, {
                                                            style: buffer_style
                                                        });
                                                        map.addLayer(buffer_layer);
                                                        deserialize(map, buffer, buffer_layer);

                                                    } else {

                                                        Ext.MessageBox.show({
                                                            title: 'Error',
                                                            msg: 'La capa no tiene registros',
                                                            buttons: Ext.MessageBox.OK,
                                                            icon: Ext.Msg.ERROR
                                                        });

                                                    }
                                                    geometria = 'todas';
                                                    combocapas(map, geometria);




                                                },
                                            }


                                        }
                                    ]
                                }, {
                                    title: 'Mediciones',
                                    id: 'mediciones',
                                    items: [

                                        { //Selector del metodo de ruta

                                            xtype: 'combo',
                                            fieldLabel: 'Capas',
                                            id: 'selectcapas2',
                                            displayField: 'name',
                                            width: 320,
                                            labelWidth: 80,
                                            store: capastore,
                                            queryMode: 'local',
                                            typeAhead: true
                                        }, {
                                            xtype: 'button',
                                            text: '<div style="color: Black">Calcular Area</div>',
                                            height: 25,
                                            margin: "15 2 4 2",
                                            //escuchador de eventos para cuando pulsamos el raton o pasamos por encima el raton
                                            listeners: {
                                                //evento on click
                                                click: function() {

                                                    var nombrecapa = Ext.getCmp('selectcapas2').getValue(); //Obtenemos el nombre de la capa seleccionada
                                                    var capa = map.getLayersByName(nombrecapa) //Obtenemos la capa con ese nombre

                                                    if (capa[0].features.length > 0) { //comprobamos que hay al menos un feature para no procesar ninguna capa vacia

                                                        var capabuffer = serialize(capa[0].features); //Pasamos esa capa a GeoJSON
                                                        var obj = JSON.parse(capabuffer);
                                                        //alert(obj.features[0]);

                                                        var area = turf.area(obj.features[0]);
                                                        if (area == 0) { //la capa seleccionada no es una capa poligonal

                                                            Ext.MessageBox.show({
                                                                title: 'Error',
                                                                msg: 'Selecciona una capa poligonal',
                                                                buttons: Ext.MessageBox.OK,
                                                                icon: Ext.Msg.ERROR
                                                            });
                                                        } else {

                                                            Ext.MessageBox.show({
                                                                title: 'Area',
                                                                msg: 'El area es de ' + area.toFixed(2) + ' metros cuadrados',
                                                                buttons: Ext.MessageBox.OK,
                                                                icon: Ext.Msg.INFO
                                                            });
                                                        }
                                                    } else {

                                                        Ext.MessageBox.show({
                                                            title: 'Error',
                                                            msg: 'La capa no tiene registros',
                                                            buttons: Ext.MessageBox.OK,
                                                            icon: Ext.Msg.ERROR
                                                        });

                                                    }



                                                },
                                            }


                                        }, {
                                            xtype: 'menuseparator',
                                            width: '100%',
                                        }, {
                                            xtype: 'button',
                                            text: '<div style="color: Black">Calcular longitud</div>',
                                            height: 25,
                                            margin: "15 2 4 2",
                                            //escuchador de eventos para cuando pulsamos el raton o pasamos por encima el raton
                                            listeners: {
                                                //evento on click
                                                click: function() {

                                                    var nombrecapa = Ext.getCmp('selectcapas2').getValue(); //Obtenemos el nombre de la capa seleccionada
                                                    var capa = map.getLayersByName(nombrecapa) //Obtenemos la capa con ese nombre

                                                    if (capa[0].features.length > 0) { //comprobamos que hay al menos un feature para no procesar ninguna capa vacia

                                                        var capabuffer = serialize(capa[0].features); //Pasamos esa capa a GeoJSON
                                                        var obj = JSON.parse(capabuffer);
                                                        //alert(obj.features[0]);

                                                        var longitud = turf.lineDistance(obj.features[0], 'kilometers');

                                                        if (longitud == 0) {

                                                            Ext.MessageBox.show({
                                                                title: 'Error',
                                                                msg: 'Selecciona una capa de lineal',
                                                                buttons: Ext.MessageBox.OK,
                                                                icon: Ext.Msg.ERROR
                                                            });

                                                        } else {

                                                            Ext.MessageBox.show({
                                                                title: 'Longitud',
                                                                msg: 'La longitud es de ' + (longitud * 1000).toFixed(2) + ' metros',
                                                                buttons: Ext.MessageBox.OK,
                                                                icon: Ext.Msg.INFO
                                                            });
                                                        }
                                                    } else {

                                                        Ext.MessageBox.show({
                                                            title: 'Error',
                                                            msg: 'La capa no tiene registros',
                                                            buttons: Ext.MessageBox.OK,
                                                            icon: Ext.Msg.ERROR
                                                        });

                                                    }



                                                },
                                            }


                                        }, {
                                            xtype: 'menuseparator',
                                            width: '100%',
                                        }, {
                                            xtype: 'button',
                                            text: '<div style="color: Black">Calcular centroide</div>',
                                            height: 25,
                                            margin: "15 2 4 2",
                                            //escuchador de eventos para cuando pulsamos el raton o pasamos por encima el raton
                                            listeners: {
                                                //evento on click
                                                click: function() {

                                                    var nombrecapa = Ext.getCmp('selectcapas2').getValue(); //Obtenemos el nombre de la capa seleccionada
                                                    var capa = map.getLayersByName(nombrecapa); //Obtenemos la capa con ese nombre
                                                    if (capa[0].features.length > 0) { //comprobamos que hay al menos un feature para no procesar ninguna capa vacia
                                                        var capabuffer = serialize(capa[0].features); //Pasamos esa capa a GeoJSON
                                                        var obj = JSON.parse(capabuffer);
                                                        //alert(obj.features[0]);

                                                        var centroide = turf.centroid(obj.features[0]);

                                                        var layername = "Centroide_" + nombrecapa;
                                                        var centroide_layer = new OpenLayers.Layer.Vector(layername, {
                                                            style: buffer_style
                                                        });
                                                        map.addLayer(centroide_layer);
                                                        deserialize(map, centroide, centroide_layer);

                                                    } else {

                                                        Ext.MessageBox.show({
                                                            title: 'Error',
                                                            msg: 'La capa no tiene registros',
                                                            buttons: Ext.MessageBox.OK,
                                                            icon: Ext.Msg.ERROR
                                                        });

                                                    }
                                                    geometria = 'todas';
                                                    combocapas(map, geometria);




                                                },
                                            }


                                        }, {
                                            xtype: 'menuseparator',
                                            width: '100%',
                                        }, {
                                            xtype: 'button',
                                            text: '<div style="color: Black">Calcular BoundingBox</div>',
                                            height: 25,
                                            margin: "15 2 4 2",
                                            //escuchador de eventos para cuando pulsamos el raton o pasamos por encima el raton
                                            listeners: {
                                                //evento on click
                                                click: function() {

                                                    var nombrecapabb = Ext.getCmp('selectcapas2').getValue(); //Obtenemos el nombre de la capa seleccionada
                                                    var capabb = map.getLayersByName(nombrecapabb); //Obtenemos la capa con ese nombre
                                                    if (capabb[0].features.length > 0) { //comprobamos que hay al menos un feature para no procesar ninguna capa vacia
                                                        var capabufferbb = serialize(capabb[0].features); //Pasamos esa capa a GeoJSON
                                                        var obj = JSON.parse(capabufferbb);
                                                        //alert(obj.features[0]);


                                                        var bbox = turf.extent(obj);

                                                        var bboxPolygon = turf.bboxPolygon(bbox);

                                                        var resultFeatures = obj.features.concat(bboxPolygon);
                                                        var result = {
                                                            "type": "FeatureCollection",
                                                            "features": resultFeatures
                                                        };


                                                        var layernamebb = "Cobertura_" + nombrecapabb;
                                                        var bb_layer = new OpenLayers.Layer.Vector(layernamebb, {
                                                            style: bb_style
                                                        });
                                                        map.addLayer(bb_layer);
                                                        deserialize(map, result, bb_layer);

                                                    } else {

                                                        Ext.MessageBox.show({
                                                            title: 'Error',
                                                            msg: 'La capa no tiene registros',
                                                            buttons: Ext.MessageBox.OK,
                                                            icon: Ext.Msg.ERROR
                                                        });

                                                    }
                                                    geometria = 'todas';
                                                    combocapas(map, geometria);




                                                },
                                            }


                                        }



                                    ],
                                    listeners: {
                                        //evento on click
                                        expand: function() {
                                            geometria = 'lineas';
                                            combocapas(map, geometria);
                                        }

                                    },
                                },{
                                    title: 'Intersección',
                                    id: 'interseccion',
                                    items: [

                                        { 

                                            xtype: 'combo',
                                            fieldLabel: 'Capa 1',
                                            id: 'selectcapas3',
                                            displayField: 'name',
                                            width: 320,
                                            store: capastore,
                                            queryMode: 'local',
                                            typeAhead: true
                                        },{ 

                                            xtype: 'combo',
                                            fieldLabel: 'Capa 2',
                                            id: 'selectcapas4',
                                            displayField: 'name',
                                            width: 320,
                                            store: capastore,
                                            queryMode: 'local',
                                            typeAhead: true
                                        },{
                                            xtype: 'button',
                                            text: '<div style="color: Black">Calcular intersección</div>',
                                            height: 25,
                                            margin: "15 2 4 2",
                                            //escuchador de eventos para cuando pulsamos el raton o pasamos por encima el raton
                                            listeners: {
                                                //evento on click
                                                click: function() {

                                                    var nombrecapain = Ext.getCmp('selectcapas3').getValue(); //Obtenemos el nombre de la capa seleccionada
													var nombrecapain2 = Ext.getCmp('selectcapas4').getValue(); //Obtenemos el nombre de la capa seleccionada
                                                    var capain = map.getLayersByName(nombrecapain) //Obtenemos la capa con ese nombre
													var capain2 = map.getLayersByName(nombrecapain2) //Obtenemos la capa con ese nombre
                                                    if (capain[0].features.length > 0 || capa2in[0].features.length > 0) { //comprobamos que hay al menos un feature para no procesar ninguna capa vacia
                                                        var capabufferin = serialize(capain[0].features); //Pasamos esa capa a GeoJSON
                                                        var objin = JSON.parse(capabufferin);
                                                        var capabufferin2 = serialize(capain2[0].features); //Pasamos esa capa a GeoJSON
                                                        var objin2 = JSON.parse(capabufferin2);

                                                        var intersect = turf.intersect(objin.features[0], objin2.features[0]);

                                                        var layername = "Intersección_" + nombrecapain + "_" + nombrecapain2 ;
                                                        var intersect_layer = new OpenLayers.Layer.Vector(layername, {
                                                            style: intersect_style
                                                        });
                                                        map.addLayer(intersect_layer);
                                                        deserialize(map, intersect, intersect_layer);

                                                    } else {

                                                        Ext.MessageBox.show({
                                                            title: 'Error',
                                                            msg: 'La capa no tiene registros',
                                                            buttons: Ext.MessageBox.OK,
                                                            icon: Ext.Msg.ERROR
                                                        });

                                                    }
                                                    geometria = 'todas';
                                                    combocapas(map, geometria);




                                                },
                                            }


                                        }
                                    ],
									listeners: {
    
                                        expand: function() {
                                            geometria = 'todas';
                                            combocapas(map, geometria);
                                        }

                                    },
                                },{
                                    title: 'Diferencia',
                                    id: 'diferencia',
                                    items: [

                                        { 

                                            xtype: 'combo',
                                            fieldLabel: 'Capa Base',
                                            id: 'selectcapas5',
                                            displayField: 'name',
                                            width: 320,
                                            store: capastore,
                                            queryMode: 'local',
                                            typeAhead: true
                                        },{ 

                                            xtype: 'combo',
                                            fieldLabel: 'Capa de recorte',
                                            id: 'selectcapas6',
                                            displayField: 'name',
                                            width: 320,
                                            store: capastore,
                                            queryMode: 'local',
                                            typeAhead: true
                                        },{
                                            xtype: 'button',
                                            text: '<div style="color: Black">Calcular diferencia</div>',
                                            height: 25,
                                            margin: "15 2 4 2",
                                            //escuchador de eventos para cuando pulsamos el raton o pasamos por encima el raton
                                            listeners: {
                                                //evento on click
                                                click: function() {

                                                    var nombrecapadf = Ext.getCmp('selectcapas5').getValue(); //Obtenemos el nombre de la capa seleccionada
													var nombrecapadf2 = Ext.getCmp('selectcapas6').getValue(); //Obtenemos el nombre de la capa seleccionada
                                                    var capadf = map.getLayersByName(nombrecapadf) //Obtenemos la capa con ese nombre
													var capadf2 = map.getLayersByName(nombrecapadf2) //Obtenemos la capa con ese nombre
                                                    if (capadf[0].features.length > 0 || capadf2[0].features.length > 0) { //comprobamos que hay al menos un feature para no procesar ninguna capa vacia
                                                        var capadf = serialize(capadf[0].features); //Pasamos esa capa a GeoJSON
                                                        var objdf = JSON.parse(capadf);
                                                        var capadf2 = serialize(capadf2[0].features); //Pasamos esa capa a GeoJSON
                                                        var objdf2 = JSON.parse(capadf2);

                                                        var diferencia = turf.erase(objdf.features[0], objdf2.features[0]);

                                                        var layername = "Diferencia_" + nombrecapadf + "_" + nombrecapadf2 ;
                                                        var diferencia_layer = new OpenLayers.Layer.Vector(layername, {
                                                            style: diferencia_style
                                                        });
                                                        map.addLayer(diferencia_layer);
                                                        deserialize(map, diferencia, diferencia_layer);

                                                    } else {

                                                        Ext.MessageBox.show({
                                                            title: 'Error',
                                                            msg: 'La capa no tiene registros',
                                                            buttons: Ext.MessageBox.OK,
                                                            icon: Ext.Msg.ERROR
                                                        });

                                                    }
                                                    geometria = 'todas';
                                                    combocapas(map, geometria);




                                                },
                                            }


                                        }
                                    ],
									listeners: {
    
                                        expand: function() {
                                            geometria = 'todas';
                                            combocapas(map, geometria);
                                        }

                                    },
                                },{
                                    title: 'Union',
                                    id: 'union',
                                    items: [

                                        { 

                                            xtype: 'combo',
                                            fieldLabel: 'Capa 1',
                                            id: 'selectcapas7',
                                            displayField: 'name',
                                            width: 320,
                                            store: capastore,
                                            queryMode: 'local',
                                            typeAhead: true
                                        },{ 

                                            xtype: 'combo',
                                            fieldLabel: 'Capa 2',
                                            id: 'selectcapas8',
                                            displayField: 'name',
                                            width: 320,
                                            store: capastore,
                                            queryMode: 'local',
                                            typeAhead: true
                                        },{
                                            xtype: 'button',
                                            text: '<div style="color: Black">Calcular unión</div>',
                                            height: 25,
                                            margin: "15 2 4 2",
                                            //escuchador de eventos para cuando pulsamos el raton o pasamos por encima el raton
                                            listeners: {
                                                //evento on click
                                                click: function() {

                                                    var nombrecapa3 = Ext.getCmp('selectcapas7').getValue(); //Obtenemos el nombre de la capa seleccionada
													var nombrecapa4 = Ext.getCmp('selectcapas8').getValue(); //Obtenemos el nombre de la capa seleccionada
                                                    var capa3 = map.getLayersByName(nombrecapa3) //Obtenemos la capa con ese nombre
													var capa4 = map.getLayersByName(nombrecapa4) //Obtenemos la capa con ese nombre
                                                    if (capa3[0].features.length > 0 || capa4[0].features.length > 0) { //comprobamos que hay al menos un feature para no procesar ninguna capa vacia
                                                        var capabuffer3 = serialize(capa3[0].features); //Pasamos esa capa a GeoJSON
                                                        var obj = JSON.parse(capabuffer3);
                                                        var capabuffer4 = serialize(capa4[0].features); //Pasamos esa capa a GeoJSON
                                                        var obj2 = JSON.parse(capabuffer4);

                                                        var union = turf.union(obj.features[0], obj2.features[0]);

                                                        var layername = "Union_" + nombrecapa3 + "_" + nombrecapa4 ;
                                                        var union_layer = new OpenLayers.Layer.Vector(layername, {
                                                            style: union_style
                                                        });
                                                        map.addLayer(union_layer);
                                                        deserialize(map, union, union_layer);

                                                    } else {

                                                        Ext.MessageBox.show({
                                                            title: 'Error',
                                                            msg: 'La capa no tiene registros',
                                                            buttons: Ext.MessageBox.OK,
                                                            icon: Ext.Msg.ERROR
                                                        });

                                                    }
                                                    geometria = 'todas';
                                                    combocapas(map, geometria);




                                                },
                                            }


                                        }
                                    ],
									listeners: {
    
                                        expand: function() {
                                            geometria = 'todas';
                                            combocapas(map, geometria);
                                        }

                                    },
                                }


                            ]
                        },

                    ],


                },
                /* {
//minimapa de localizacion
                    xtype: 'gx_overviewmap',
					height: 300,
					width: 300
                } */

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
            id: 'menu',
            //hidden : false,
            //title: 'MENU PRINCIPAL',
            /*bodyStyle:{
                 background:'#08088A'
               },  */
            height: 63,
            //responsive design
            plugins: 'responsive',
            responsiveConfig: {
                landscape: {
                    region: 'north'
                },
                portrait: {
                    region: 'north'
                }
            },
            tbar: {
                style: {
                    background: '#08088A',
                    marginTop: '0px',
                    borderWidth: '0px'
                },
                items: [

                    {
                        xtype: 'image',
                        id: 'logo',
                        src: 'img/logo1.png',
                        height: 60,
                        width: 245
                    }, { xtype: 'tbfill' },{
                        xtype: 'button',
						cls: 'botonacercade',
                        text: '<div style="color: white; font-weight: bold;">Acerca De</div>',
                        height: 60,
						  listeners: {
                            //evento on click
                            click: function() {

                                acercade();
                            }
							}

                    }

                    /*{
                        xtype: 'button',
                        text: '<div style="color: white">My Button</div>',
                        height: 60,
                        //escuchador de eventos para cuando pulsamos el raton o pasamos por encima el raton
                        listeners: {
                            //evento on click
                            click: function() {

                                this.setText('I was clicked!');
                            },
                            //evento cuando pasamos el raton por encima
                            mouseover: function() {

                                this.setText('<div style="color: Black">My Button</div>');
                                this.setStyle({
                                    'background': '#08088A',
                                    'border-color': '#08088A'
                                });

                            },
                            //evento cuando no pasamos el raton por encima
                            mouseout: function() {

                                this.setText('<div style="color: White">My Button</div>');
                                this.setStyle({
                                    'background': '#08088A',
                                    'border-color': '#08088A'
                                });

                            }

                        }

                    }, {
                        xtype: 'tbspacer',
                        width: 50

                    }, {
                        xtype: 'button',
                        text: 'Large2',
                        height: 60

                    }*/
                ]
            }

        });

        //ELEMENTO PRINCIPAL
        //Elemento principal donde se añaden todos los items de la aplicación
        Ext.create('Ext.container.Viewport', {
            layout: 'border',
            //style: {borderColor:'#08088A', borderStyle:'solid', borderWidth:'0px'},
            items: [menu, formPanel, tree, mappanel],
            /*tbar: Ext.create('Ext.Toolbar', {
            items: toolbarItems
            }) */
        });
    }
});