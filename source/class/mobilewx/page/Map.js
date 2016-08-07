/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/**
 */
qx.Class.define("mobilewx.page.Map",
{
  extend : qx.ui.mobile.page.NavigationPage,
  type : "singleton",
  properties :
  {
    jsonpRoot : {
      //init: "https://dev.nids.noaa.gov/~jwolfe/edd/edd/source/resource/edd/"
      init : "http://preview.weather.gov/edd/resource/edd/"
    },
    mapUri : {
      //init: "resource/mobilewx/ol-debug.js"
      init : "resource/mobilewx/ol.js"
    }
  },
  construct : function()
  {
    this.base(arguments);
    this.setTitle("Mobile EDD");
    this.bus = qx.event.message.Bus.getInstance();
  },
  members :
  {
    // overridden
    _initialize : function()
    {
      var me = this;
      this.base(arguments);
      this._loadMapLibrary();

      // Drawer
      var drawer = new qx.ui.mobile.container.Drawer();
      drawer.setOrientation("right");
      drawer.setTapOffset(0);

      /**
       * Radar Container
       */
      var composite = new qx.ui.mobile.container.Composite();
      composite.setLayout(new qx.ui.mobile.layout.HBox());
      me.radarToggleButton = new qx.ui.mobile.form.ToggleButton(false, "On", "Off");
      me.radarToggleButton.addListener("changeValue", function(e)
      {
        var radarClass = mobilewx.Radar.getInstance();
        if (e.getData()) {
          radarClass.start();
        } else {
          me.loopControl.setValue(false);
          radarClass.stop();
        }
        radarClass.toggleVisibility(e.getData());
      })
      var radarLabel = new qx.ui.mobile.basic.Label("Radar: ")
      radarLabel.addCssClass("menuLabels");
      composite.add(radarLabel, {
        flex : 1
      });
      composite.add(me.radarToggleButton);
      drawer.add(composite);

      /**
       * Radar Loop Timer
       * - Add a listener for the timer. This switches frames on the map
       */
      me.loopTimer = new qx.event.Timer(500);
      me.loopTimer.addListener("interval", function(e)
      {
        if (!me.loopControl.getValue()) {
          me.loopTimer.stop();
        }
        var currentIndex = me.radarLoopSlider.getValue();

        // Delay on last frame
        if (currentIndex == me.radarLoopSlider.getMaximum())
        {
          me.loopTimer.stop();
          setTimeout(function() {
            // If it stops during the delay be sure to stop it again and don't show a new frame
            if (!me.loopControl.getValue()) {
              me.loopTimer.stop();
            } else {
              me.radarLoopSlider.setValue(me.radarLoopSlider.getMinimum());
              me.loopTimer.start();
            }
          }, 1000);
        } else
        {
          me.radarLoopSlider.setValue(me.radarLoopSlider.getValue() + 1);
        }
      });

      /**
       * Loop Container
       */
      var composite = new qx.ui.mobile.container.Composite();
      composite.setLayout(new qx.ui.mobile.layout.HBox());
      me.loopControl = new qx.ui.mobile.form.ToggleButton(false, "On", "Off");
      me.loopControl.addListener("changeValue", function(e)
      {
        var bool = e.getData();
        if (bool)
        {
          me.loopTimer.start();
          me.radarToggleButton.setValue(true);
        } else
        {
          me.loopTimer.stop();
        }
      })
      var loopLabel = new qx.ui.mobile.basic.Label("Loop Radar: ")
      loopLabel.addCssClass("loopLabel");
      composite.add(loopLabel, {
        flex : 1
      });
      composite.add(me.loopControl);
      drawer.add(composite);

      // Radar Loop Slider
      var composite = new qx.ui.mobile.container.Composite();
      composite.setLayout(new qx.ui.mobile.layout.HBox());
      me.radarLoopSlider = new qx.ui.mobile.form.Slider().set(
      {
        minimum : 0,
        maximum : 4,
        step : 1
      });
      me.radarLoopSlider.addListener("changeValue", function(e)
      {
        var radarMrms = mobilewx.Radar.getInstance();
        radarMrms.setSliderIndex(e.getData());
      }, this);
      composite.add(me.radarLoopSlider, {
        flex : 1
      });
      drawer.add(composite);

      /**
       * Radar Time Label
       */
      var composite = new qx.ui.mobile.container.Composite();
      me.radarTimeLabel = new qx.ui.mobile.basic.Label();
      composite.setLayout(new qx.ui.mobile.layout.HBox().set( {
        alignX : "center"
      }));
      composite.add(me.radarTimeLabel);
      me.radarTimeLabel.addCssClass("timeLabel");
      drawer.add(composite);

      /**
      * Hazards Container
      */
      var composite = new qx.ui.mobile.container.Composite();
      composite.setLayout(new qx.ui.mobile.layout.HBox());
      var hazardsLabel = new qx.ui.mobile.basic.Label("Hazards: ");
      composite.add(hazardsLabel, {
        flex : 1
      });
      hazardsLabel.addCssClass("menuLabels");
      me.hazardRequestTimer = new qx.event.Timer(0);  //1000 * 60);
      me.hazardRequestTimer.addListener("interval", function(e)
      {
        me.hazardRequestTimer.setInterval(1000 * 20);
        me.hazardRequest.send();
      })
      me.hazardToggleButton = new qx.ui.mobile.form.ToggleButton(false, "On", "Off");
      me.hazardToggleButton.addListener("changeValue", function(e)
      {
        if (typeof me.hazardLayer == "undefined") {
          me.addHazardsLayer();
        }
        me.hazardLayer.setVisible(e.getData());
        if (e.getData()) {
          me.hazardRequestTimer.start();
        } else {
          me.hazardRequestTimer.stop();
        }
      }, this)
      composite.add(me.hazardToggleButton);
      drawer.add(composite);

      /**
       * Background
       * */
      var bgButton = new qx.ui.mobile.form.Button("Background Map");
      bgButton.addListener("tap", function(e)
      {
        var options = [me.terrain, me.lite, me.natgeo, me.esridark];
        var option_names = [];
        options.forEach(function(obj) {
          option_names.push(obj.get('name'));
        })

        //mobilewx.page.Map.getInstance().terrain.get('name')]
        var model = new qx.data.Array(option_names);
        var menu = new qx.ui.mobile.dialog.Menu(model);
        menu.show();
        menu.addListener("changeSelection", function(evt)
        {
          var selectedIndex = evt.getData().index;
          var selectedItem = evt.getData().item;
          var layers = me.map.getLayers();

          // Remove current layer
          options.forEach(function(obj) {
            if (obj.get('name') == layers.getArray()[0].get('name'))
            {
              // Remove the reference too
              if (obj.get('name') == "ESRI Gray") {
                //me.map.removeLayer(me.esridark_reference);
                me.esridark_reference.setVisible(false);
              }
              me.map.removeLayer(obj);
            }
          })
          options.forEach(function(obj)
          {
            // Add the reference too
            if (obj.get('name') == selectedItem) {
              layers.insertAt(0, obj);
            }
            if (selectedItem == "ESRI Gray") {
              me.esridark_reference.setVisible(true);
            }
          })
          drawer.hide();
        }, this);
      }, this);
      drawer.add(bgButton);

      /**
      * Close
      * */
      var closeButton = new qx.ui.mobile.form.Button("Close");
      closeButton.addListener("tap", function(e) {
        drawer.hide();
      }, this);
      drawer.add(closeButton, {
        flex : 1
      });

      // Menu Button
      var menuButton = new qx.ui.mobile.navigationbar.Button("Menu");
      menuButton.addListener("tap", function(e) {
        drawer.show();
      }, this);
      this.getRightContainer().add(menuButton);

      // Radar Time
      var weekday = new Array(7);
      weekday[0] = "Sun";
      weekday[1] = "Mon";
      weekday[2] = "Tue";
      weekday[3] = "Wed";
      weekday[4] = "Thu";
      weekday[5] = "Fri";
      weekday[6] = "Sat";
      me.bus.subscribe("edd.view.radar.time", function(e)
      {
        var myDate = e.getData();
        var dateString = me.formatDate(myDate) + ' ' + weekday[myDate.getDay()] + ' ' + myDate.getMonth() + '/' + myDate.getDate() + '/' + myDate.getFullYear();
        me.radarTimeLabel.setValue('<b>' + dateString + '</b>');
        me.descriptionLabel.setValue('<b>Radar - ' + dateString + '</b>');
      }, this)

      // Wait a second before looping

      // setTimeout(function() {

      //   try{

      // me.setUrlParams();

      //   }catch(e){

      //     // not ready yet

      //   }

      // }, 100);
    },
    setUrlParams : function()
    {
      var bool = this.getURLParameter('lr') == "T" ? true : false;
      this.loopControl.setValue(bool);
    },

    /**
     * Format the Radar Date
     */
    formatDate : function(date)
    {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;  // the hour '0' should be '12'
      minutes = minutes < 10 ? '0' + minutes : minutes;
      var strTime = hours + ':' + minutes + ' ' + ampm;
      return strTime;
    },

    // overridden
    _createScrollContainer : function()
    {
      // MapContainer
      var layout = new qx.ui.mobile.layout.VBox().set(
      {
        alignX : "center",
        alignY : "middle"
      });
      var mapContainer = new qx.ui.mobile.container.Composite(layout);
      mapContainer.setId("map");
      mapContainer.addCssClass("map");
      return mapContainer;
    },

    // overridden
    _createContent : function()
    {
      var me = this;

      // Disable menu for Windows Phone 8.
      if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
        return null;
      }
      var menuContainer = new qx.ui.mobile.container.Composite();
      menuContainer.setId("mapMenu");

      // // LABEL
      me.descriptionLabel = new qx.ui.mobile.basic.Label("");

      //me.descriptionLabel.addCssClass("osmMapLabel");

      // // TOGGLE BUTTON

      // var toggleNavigationButton = new qx.ui.mobile.form.ToggleButton(true, "ON", "OFF");

      // // SHOW MY POSITION BUTTON

      // this._showMyPositionButton = new qx.ui.mobile.form.Button("Find me!");

      // this._showMyPositionButton.addListener("tap", this._getGeoPosition, this);

      // // Button is disabled when Geolocation is not available.

      // this._showMyPositionButton.setEnabled(this._geolocationEnabled);

      // toggleNavigationButton.addListener("changeValue", function()

      // {

      //   var newNavBarState = !this.isNavigationBarHidden();

      //   this.setNavigationBarHidden(newNavBarState);

      //   this.show();

      // }, this);

      // var groupPosition = new qx.ui.mobile.form.Group([this._showMyPositionButton], false);

      // var groupFullScreen = new qx.ui.mobile.form.Group([descriptionLabel, toggleNavigationButton], true);

      // this._showMyPositionButton.addCssClass("map-shadow");

      // groupFullScreen.addCssClass("map-shadow");

      // menuContainer.add(groupFullScreen);

      // menuContainer.add(groupPosition);
      menuContainer.add(me.descriptionLabel);
      return menuContainer;
    },

    /**
     * Loads JavaScript library which is needed for the map.
     */
    _loadMapLibrary : function()
    {
      var me = this;
      var req = new qx.bom.request.Script();
      req.onload = function()
      {
        // Background Maps
        me.terrain = new ol.layer.Tile(
        {
          name : "Stamen Terrain",
          source : new ol.source.Stamen( {
            layer : 'terrain'
          })
        });
        me.lite = new ol.layer.Tile(
        {
          name : "Stamen Lite",
          source : new ol.source.Stamen( {
            layer : 'toner-lite'
          })
        })
        var attribution = new ol.Attribution( {
          html : 'Tiles &copy; <a href="http://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer">ArcGIS</a>'
        });
        me.natgeo = new ol.layer.Tile(
        {
          name : "ESRI Nat Geo",
          source : new ol.source.XYZ(
          {
            attributions : [attribution],
            url : 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}'
          })
        })
        var attribution = new ol.Attribution( {
          html : 'Tiles &copy; <a href="http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer">ArcGIS</a>'
        });
        me.esridark = new ol.layer.Tile(
        {
          name : "ESRI Gray",
          source : new ol.source.XYZ(
          {
            attributions : [attribution],
            url : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
          })
        })
        var attribution = new ol.Attribution( {
          html : 'Tiles &copy; <a href="http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer">ArcGIS</a>'
        });
        me.esridark_reference = new ol.layer.Tile(
        {
          name : "ESRI Gray Reference",
          source : new ol.source.XYZ( {
            url : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
          })
        })
        me.map = new ol.Map(
        {
          target : 'map',
          controls : ol.control.defaults().extend([new ol.control.ScaleLine()]),
          layers : [me.esridark, me.esridark_reference],
          view : new ol.View( {
            zoom : 8
          })
        });
        me.map.on("click", function(e)
        {
          var hazards = [];
          me.map.forEachFeatureAtPixel(e.pixel, function(feature, layer) {
            if (layer.get('name') == "Hazards") {
              hazards.push(feature);
            }
          })
          me.handleHazardClick(hazards);
        })
        var proj1 = ol.proj.get("EPSG:3857");
        var geolocation = new ol.Geolocation(
        {
          projection : proj1,
          tracking : true
        });

        // Handle geolocation error.
        geolocation.once('error', function(error)
        {
          var defaultView = new ol.View(
          {
            center : ol.proj.transform([-99, 40], 'EPSG:4326', 'EPSG:3857'),
            zoom : 4
          })
          me.map.setView(defaultView);
        });
        geolocation.once('change', function(evt)
        {
          me.map.getView().setCenter(geolocation.getPosition());

          // add Icon
          var iconFeature = new ol.Feature( {
            geometry : new ol.geom.Point(geolocation.getPosition())
          });
          var iconStyle = new ol.style.Style( {
            image : new ol.style.Icon(
            {
              anchor : [12, 24],
              anchorXUnits : 'pixels',
              anchorYUnits : 'pixels',
              src : 'resource/mobilewx/images/map-marker-icon.png'
            })
          });
          iconFeature.setStyle(iconStyle);
          var vectorSource = new ol.source.Vector( {
            features : [iconFeature]
          });
          var vectorLayer = new ol.layer.Vector(
          {
            name : "Marker",
            source : vectorSource
          });
          me.map.addLayer(vectorLayer);
        });
        var deviceOrientation = new ol.DeviceOrientation();

        // tilt the map
        deviceOrientation.on(['change:beta', 'change:gamma'], function(event)
        {
          var center = view.getCenter();
          var resolution = view.getResolution();
          var beta = event.target.getBeta() || 0;
          var gamma = event.target.getGamma() || 0;
          center[0] -= resolution * gamma * 25;
          center[1] += resolution * beta * 25;
          view.setCenter(view.constrainCenter(center));
        });
        me.radarToggleButton.setValue(true);
        me.hazardToggleButton.setValue(true);
        var styleArray = [new ol.style.Style( {
          stroke : new ol.style.Stroke(
          {
            color : '#717171',
            width : 4
          })
        })];
        var vector = new ol.layer.Vector(
        {
          name : "U.S. States",
          source : new ol.source.Vector(
          {
            url : 'resource/mobilewx/data/us-states.json',
            format : new ol.format.TopoJSON()
          }),
          style : function(feature, resolution) {
            return feature.getId() !== undefined ? styleArray : null;
          }
        });
        me.map.addLayer(vector);

        // Add state overlay

        //me.addStatesLayer();
      }.bind(this);
      req.open("GET", this.getMapUri());
      req.send();
    },

    /**
      Add a state  layer ...
      */
    addStatesLayer : function()
    {
      var me = this;
      var tms_layer = new ol.layer.Tile(
      {
        name : 'US States',
        source : new ol.source.XYZ( {
          url : 'http://ridgewms.srh.noaa.gov/c/tc.py/1.0.0/state/{z}/{x}/{y}.png'
        }),
        opacity : 0.8
      });
      me.map.addLayer(tms_layer);
    },

    /**
     * Handle the hazard click
     */
    handleHazardClick : function(hazardArray)
    {
      var me = this;
      var hazards = [];
      hazardArray.forEach(function(obj) {
        hazards.push(obj.get('warn_type') + ' - #' + obj.get('etn'));
      })
      var model = new qx.data.Array(hazards);
      var menu = new qx.ui.mobile.dialog.Menu(model);
      if (hazards.length > 0) {
        menu.show();
      }
      menu.addListener("changeSelection", function(evt)
      {
        // var selectedIndex = evt.getData().index;
        var selectedItem = evt.getData().item;
        var hsplit = selectedItem.split(' - ');
        var htype = hsplit[0];
        var hetn = hsplit[1].replace('#', '');
        hazardArray.forEach(function(feature) {
          if (feature.get('warn_type') == htype && feature.get('etn') == hetn)
          {
            console.log(feature);
            var url = me.getJsonpRoot() + 'getWarningText.php';
            url += '?year=' + new Date(feature.get('end') * 1000).getFullYear();
            url += '&wfo=' + feature.get('office').substr(1, 4);
            url += '&phenomena=' + feature.get('phenomenon');
            url += '&eventid=' + feature.get('etn');
            url += '&significance=W';
            var hazardTextRequest = new qx.io.request.Jsonp();
            hazardTextRequest.setUrl(url);
            hazardTextRequest.setCallbackParam('callback');
            hazardTextRequest.addListenerOnce("success", function(e)
            {
              qx.core.Init.getApplication().getRouting().executeGet("/hazardtext");
              var text = new qx.event.message.Message("edd.hazard");
              text.setData(e.getTarget().getResponse().data[0].report);
              me.bus.dispatch(text);
              this.__busyPopup.hide();
            }, this);
            hazardTextRequest.send();
            var busyIndicator = new qx.ui.mobile.dialog.BusyIndicator("Please wait...");
            this.__busyPopup = new qx.ui.mobile.dialog.Popup(busyIndicator);
            this.__busyPopup.show();
          }
        })
      }, this);
    },

    /**
      Add a hazards layer ...
      */
    addHazardsLayer : function()
    {
      var me = this;
      var geoJSONFormat = new ol.format.GeoJSON();
      me.hazardLayer = new ol.layer.Vector(
      {
        name : "Hazards",
        source : null,  // vectorSource,
        style : function(feature, resolution)
        {
          var color;
          var fg = 'white';
          var label = '';
          if (feature.get('phenomenon') == "SV")
          {
            color = 'yellow';
            fg = 'black';
          } else if (feature.get('phenomenon') == "TO") {
            color = 'red';
          } else if (feature.get('phenomenon') == "FF") {
            color = 'green';
          } else if (feature.get('phenomenon') == "MA") {
            color = 'orange';
          } else {
            color = feature.get('color');
          }



          var textStroke = new ol.style.Stroke(
          {
            color : color,
            width : 5
          });
          var textFill = new ol.style.Fill( {
            color : fg
          });
          return [new ol.style.Style(
          {
            stroke : new ol.style.Stroke(
            {
              color : color,
              width : 5
            }),
            text : new ol.style.Text(
            {
              font : '28px Calibri,sans-serif',
              text : label,
              fill : textFill,
              stroke : textStroke
            })
          })]
        }
      });
      me.map.addLayer(me.hazardLayer);

      // Hazard Request
      me.hazardRequest = new qx.io.request.Jsonp();
      me.hazardRequest.setUrl(me.getJsonpRoot() + "hazards/getShortFusedHazards.php");
      me.hazardRequest.setCallbackParam('callback');
      me.hazardRequest.addListener("success", function(e)
      {
        var data = e.getTarget().getResponse();
        var features = new ol.format.GeoJSON().readFeatures(data, {
          featureProjection : 'EPSG:3857'
        });
        var vectorSource = new ol.source.Vector((
        {
          projection : 'EPSG:3857',
          features : features
        }));
        if (me.hazardLayer.getSource() !== null) {
          me.hazardLayer.getSource().clear();
        }
        me.hazardLayer.setSource(vectorSource);
      }, this);
    },

    /**
     * Get the map
     */
    getMap : function() {
      return this.map;
    },

    /**
     * Get a layer by name
     */
    getLayerByName : function(name)
    {
      var me = this;
      var match = null;
      me.map.getLayers().getArray().forEach(function(obj) {
        // console.log(obj.get('name'), name);
        if (obj.get('name') == name) {
          match = obj;
        };
      })
      return match;
    },

    /**
    Set opacity of a layer by name
    */
    setOpacity : function(name, opacity)
    {
      var me = this;
      me.map.getLayers().forEach(function(layer) {
        if (layer.get('name') == name) {
          layer.setOpacity(opacity);
        }
      });
    },

    // From: http://stackoverflow.com/questions/11582512/how-to-get-url-parameters-with-javascript/11582513#11582513
    getURLParameter : function(name) {
      return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
    }
  }
});
