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
  construct : function()
  {
    this.base(arguments);
    this.setTitle("Mobile EDD");
  },
  members :
  {
    //_mapUri : "resource/mobilewx/ol-debug.js",  
    _mapUri : "resource/mobilewx/ol.js",

    // overridden
    _initialize : function()
    {
      var me = this;
      this.base(arguments);
      this._loadMapLibrary();
      me.bus = qx.event.message.Bus.getInstance();

      // Drawer
      var drawer = new qx.ui.mobile.container.Drawer();
      drawer.setOrientation("right");
      drawer.setTapOffset(100);

      // Radar Container
      var composite = new qx.ui.mobile.container.Composite();
      composite.setLayout(new qx.ui.mobile.layout.HBox());
      me.radarToggleButton = new qx.ui.mobile.form.ToggleButton(false, "On", "Off");
      me.radarToggleButton.addListener("changeValue", function(e)
      {
        //me.addRadarLayer();
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

      // Loop Timer

      // Add a listener for the timer. This switches frames on the map
      me.loopTimer = new qx.event.Timer(500);
      me.loopTimer.addListener("interval", function(e)
      {
        if (!me.loopControl.getValue()) {
          me.loopTimer.stop();
        }

        //me.loopTimer.setInterval(500);
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

      // Loop Container
      var composite = new qx.ui.mobile.container.Composite();
      composite.setLayout(new qx.ui.mobile.layout.HBox());
      me.loopControl = new qx.ui.mobile.form.ToggleButton(false, "On", "Off");
      me.loopControl.addListener("changeValue", function(e)
      {
        var bool = e.getData();
        if (bool) {
          me.loopTimer.start();
          me.radarToggleButton.setValue(true);
        } else {
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

      // Slider
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
        radarMrms.setSliderIndex(e.getData());  // + (radarMrms.getFrames() - 1));

        // console.log(e.getData());
      }, this);
      composite.add(me.radarLoopSlider, {
        flex : 1
      });
      drawer.add(composite);

      // Radar Time
      var composite = new qx.ui.mobile.container.Composite();
      me.radarTimeLabel = new qx.ui.mobile.basic.Label();
      composite.setLayout(new qx.ui.mobile.layout.HBox().set( {
        alignX : "center"
      }));
      composite.add(me.radarTimeLabel);
      me.radarTimeLabel.addCssClass("timeLabel");
      drawer.add(composite);

      // Hazards Container
      var composite = new qx.ui.mobile.container.Composite();
      composite.setLayout(new qx.ui.mobile.layout.HBox());
      var hazardsLabel = new qx.ui.mobile.basic.Label("Hazards: ");
      composite.add(hazardsLabel, {
        flex : 1
      });
      hazardsLabel.addCssClass("menuLabels");
      me.hazardToggleButton = new qx.ui.mobile.form.ToggleButton(false, "On", "Off");
      me.hazardToggleButton.addListener("changeValue", function(e)
      {
        if (typeof me.hazardLayer == "undefined") {
          me.addHazardsLayer();
        }
        me.hazardLayer.setVisible(e.getData());
      }, this)
      composite.add(me.hazardToggleButton);
      drawer.add(composite);

      // Options Button
      var fxButton = new qx.ui.mobile.navigationbar.Button("Menu");
      fxButton.addListener("tap", function(e) {
        drawer.show();
      }, this);
      this.getRightContainer().add(fxButton);
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
      }, this)
    },
    formatDate : function(date)
    {  // This is to display 12 hour format like you asked
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

    /**
     * Loads JavaScript library which is needed for the map.
     */
    _loadMapLibrary : function()
    {
      var me = this;
      var req = new qx.bom.request.Script();
      req.onload = function()
      {
        me.map = new ol.Map(
        {
          target : 'map',
          controls : ol.control.defaults().extend([new ol.control.ScaleLine()]),
          layers : [new ol.layer.Tile( {
            source : new ol.source.Stamen( {
              layer : 'terrain'
            })
          }), new ol.layer.Tile( {
            source : new ol.source.Stamen( {
              layer : 'terrain-labels'
            })
          })],
          view : new ol.View( {
            //   center : ol.proj.transform([-99, 40], 'EPSG:4326', 'EPSG:3857'),
            zoom : 8
          })
        });
        
        me.map.on("click", function(e) {
    me.map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
       console.log(feature,layer);
    })
})
        
        var proj1 = ol.proj.get("EPSG:3857");
        var geolocation = new ol.Geolocation(
        {
          projection : proj1,
          tracking : true
        });
        geolocation.once('change', function(evt) {
          me.map.getView().setCenter(geolocation.getPosition());
          
          // add Icon
          var iconFeature = new ol.Feature({
        geometry: new ol.geom.Point(geolocation.getPosition())
       
      });

      var iconStyle = new ol.style.Style({
        image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
          anchor: [12,24],
          anchorXUnits: 'pixels',
          anchorYUnits: 'pixels',
          src: 'resource/mobilewx/images/map-marker-icon.png'//'http://openlayers.org/en/v3.17.1/examples/data/icon.png'
        }))
      });

      iconFeature.setStyle(iconStyle);

      var vectorSource = new ol.source.Vector({
        features: [iconFeature]
      });

      var vectorLayer = new ol.layer.Vector({
        source: vectorSource
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

        //me.addHazardsLayer();
        me.radarToggleButton.setValue(true);
        me.hazardToggleButton.setValue(true);
        var styleArray = [new ol.style.Style( {
          // fill: new ol.style.Fill({

          //   color: 'rgba(255, 255, 255, 0.6)'

          // }),

          // text : new ol.style.Text(

          //   {

          //     //font : '28px Calibri,sans-serif',

          //     text : 'Hi',//label,

          //     //fill : textFill,

          //     //stroke : textStroke

          //   }),
          stroke : new ol.style.Stroke(
          {
            color : '#717171',
            width : 3
          })
        })];
        var vector = new ol.layer.Vector(
        {
          source : new ol.source.Vector(
          {
            url : 'resource/mobilewx/data/us-states.json',
            format : new ol.format.TopoJSON()
          }),
          style : function(feature, resolution) {
            // don't want to render the full world polygon, which repeats all countries
            return feature.getId() !== undefined ? styleArray : null;
          }
        });
        me.map.addLayer(vector);

        // Add state overlay

        //me.addStatesLayer();
      }.bind(this);
      req.open("GET", this._mapUri);
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
      Add a hazards layer ...
      */
    addHazardsLayer : function()
    {
      var me = this;
      var geoJSONFormat = new ol.format.GeoJSON();
      me.hazardLayer = new ol.layer.Vector(
      {
        source : null,  // vectorSource,
        style : function(feature, resolution)
        {
          var color;
          var fg = 'white';

          //var label = feature.get('warn_type');// + "\nWarning";
          var label = '';  //feature.get('phenomenon');
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

            //            fill : new ol.style.Fill(

            //            {

            //              color : feature.get('color'),

            //              opacity : 0.2

            //            }),
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
      var req = new qx.io.request.Jsonp();
      req.setUrl("https://dev.nids.noaa.gov/~jwolfe/edd/edd/source/resource/edd/hazards/getShortFusedHazards.php");
      req.setCallbackName('test');
      req.setCallbackParam('callback');
      req.addListener("success", function(e)
      {
        var req = e.getTarget();

        // JSON response
        var data = req.getResponse();
        var features = new ol.format.GeoJSON().readFeatures(data, {
          featureProjection : 'EPSG:3857'
        });
        var vectorSource = new ol.source.Vector((
        {
          projection : 'EPSG:3857',
          features : features
        }));
        me.hazardLayer.setSource(vectorSource);
      }, this);
      req.send();
    },
    getMap : function() {
      return this.map;
    },

    /**
    Get a layer by name
    */
    setOpacity : function(name, opacity)
    {
      var me = this;
      me.map.getLayers().forEach(function(layer) {
        if (layer.get('name') == name) {
          layer.setOpacity(opacity);
        }
      });
    }
  }
});
