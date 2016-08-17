/**
* NowCOAST loopable class for Radar
*
*/

/*global qx*/

/*global ol*/

/*global mobileedd*/
qx.Class.define("mobileedd.MoreLayers",
{
  extend : qx.core.Object,
  type : "singleton",
  properties : {
    opacity : {
      init : 0.7
    }
  },
  construct : function()
  {
    var me = this;
    me.base(arguments);
    me.bus = qx.event.message.Bus.getInstance();
    me.mapObject = mobileedd.page.Map.getInstance();
    me.map = me.mapObject.getMap();
    me.layers = {

    };

    // Timer
    me.timer = new qx.event.Timer(0);
    var refreshRate = 5 * 60;
    me.timer.addListener("interval", function(e)
    {
      me.timer.setInterval(1000 * refreshRate);
      Object.keys(me.layers).forEach(function(obj) {
        if (this.layers[obj].getVisible()) {
          //this.layers[obj].getSource().refresh();//.updateParams({"refresh": new Date.now()});
          this.layers[obj].getSource().updateParams( {
            "refresh" : new Date()
          })
        }
      }, this)
    }, this);
    me.timer.start();
  },
  members : {
    /**
    * Add a new radar Layer
    */
    addRestLayer : function(name, source, layer, time)
    {
      var me = this;
      var time_range = time + ',' + time;
      if (typeof me.map == "undefined") {
        return;
      }
      if (typeof this.layers[name] !== "undefined") {
        if (this.layers[name].getVisible())
        {
          this.layers[name].setVisible(false);
          return;
        } else
        {
          this.layers[name].setVisible(true);
          return;
        }
      }
      me.layers[name] = new ol.layer.Tile(
      {
        name : name,
        source : new ol.source.TileWMS(
        {
          params :
          {
            'LAYERS' : layer,  //'show:3',
            'F' : 'image',
            'FORMAT' : 'PNG8',
            'TRANSPARENT' : 'true',
            'BBOXSR' : '3857',
            'IMAGESR' : '3857',
            'SIZE' : '256,256',
            'DPI' : 90,
            'time' : time_range
          },
          url : source  //'https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/radar_meteo_imagery_nexrad_time/MapServer/export'
        })
      });
      me.map.addLayer(me.layers[name]);

      //me.layers[time].setVisible(false);
      me.layers[name].setOpacity(me.getOpacity());

      // Silly way to get Vector Layer on top...
      var statesLayer = me.mapObject.getLayerByName("U.S. States");
      me.map.removeLayer(statesLayer);
      me.map.getLayers().setAt(me.map.getLayers().getArray().length, statesLayer);
    }
  }
});
