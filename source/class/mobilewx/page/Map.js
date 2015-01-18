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
  construct : function()
  {
    this.base(arguments);
    this.setTitle("Map");
  },
  members :
  {
    _mapUri : "http://openlayers.org/en/v3.1.1/build/ol.js",

    // overridden
    _initialize : function()
    {
      var me = this;
      this.base(arguments);
      this._loadMapLibrary();

      // Drawer
      var drawer = new qx.ui.mobile.container.Drawer();
      drawer.setOrientation("right");
      drawer.setTapOffset(100);

      // Radar Container
      var composite = new qx.ui.mobile.container.Composite();
      composite.setLayout(new qx.ui.mobile.layout.HBox());
      var button = new qx.ui.mobile.form.ToggleButton(false, "YES", "NO");
      var firstLoad = true;
      button.addListener("changeValue", function(e) {
        if (e.getData()) {
          if (firstLoad)
          {
            me.addRadarLayer();
            firstLoad = false;
          } else
          {
            me.setOpacity('Radar Layer', 0.9);
          }
        } else {
          me.setOpacity('Radar Layer', 0.0);
        }
      })
      var radarLabel = new qx.ui.mobile.basic.Label("Radar: ")
      radarLabel.addCssClass("menuLabels");
      composite.add(radarLabel, {
        flex : 1
      });
      composite.add(button);
      drawer.add(composite);

      // Hazards Container
      var composite = new qx.ui.mobile.container.Composite();
      composite.setLayout(new qx.ui.mobile.layout.HBox());
      var hazardsLabel = new qx.ui.mobile.basic.Label("Hazards: ");
      composite.add(hazardsLabel, {
        flex : 1
      });
      hazardsLabel.addCssClass("menuLabels");
      var button = new qx.ui.mobile.form.ToggleButton(false, "YES", "NO");
      button.addListener("changeValue", function(e) {
        me.addHazardsLayer();
      })
      composite.add(button);
      drawer.add(composite);

      // Options Button
      var fxButton = new qx.ui.mobile.navigationbar.Button("Options");
      fxButton.addListener("tap", function(e) {
        drawer.show();
      }, this);
      this.getRightContainer().add(fxButton);
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
            source : new ol.source.MapQuest( {
              layer : 'sat'
            })
          })],
          view : new ol.View(
          {
            center : ol.proj.transform([-99, 40], 'EPSG:4326', 'EPSG:3857'),
            zoom : 4
          })
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
      }.bind(this);
      req.open("GET", this._mapUri);
      req.send();
    },

    /**
    Add a radar layer ...
    */
    addRadarLayer : function()
    {
      var me = this;
      var tms_layer = new ol.layer.Tile(
      {
        name : 'Radar Layer',
        source : new ol.source.XYZ( {
          //url : 'http://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png'
          url : 'http://ridgewms.srh.noaa.gov/tc/tc.py/1.0.0/N0Q_0/{z}/{x}/{y}.png'
        }),
        opacity : 0.4
      });
      me.map.addLayer(tms_layer);
    },

    /**
      Add a radar layer ...
      */
    addHazardsLayer : function()
    {
      var me = this;
      var selectSingleClick = new ol.interaction.Select();
      me.map.addInteraction(selectSingleClick);
      var hazards = new ol.layer.Vector(
      {
        title : 'Hazards',
        source : new ol.source.GeoJSON(
        {
          url : '/mwp/data/iris/allhazard.geojson',
          projection : 'EPSG:3857'
        }),
        style : function(feature, resolution)
        {
          var textStroke = new ol.style.Stroke(
          {
            color : '#fff',
            width : 3
          });
          var textFill = new ol.style.Fill( {
            color : '#000'
          });
          return [new ol.style.Style(
          {
            stroke : new ol.style.Stroke(
            {
              color : feature.get('color'),  //'red',
              width : 2
            }),

            //            fill : new ol.style.Fill(

            //            {

            //              color : feature.get('color'),

            //              opacity : 0.2

            //            }),
            text : new ol.style.Text(
            {
              font : '12px Calibri,sans-serif',
              text : feature.get('phenomenon'),
              fill : textFill,
              stroke : textStroke
            })
          })]
        }
      });
      me.map.addLayer(hazards);
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
