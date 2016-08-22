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

    // Set up the query timestamp request

    // Just query 1 hr...it should be close enough
    me.ltgReq = new qx.io.request.Jsonp("https://nowcoast.noaa.gov/layerinfo?request=timestops&service=sat_meteo_emulated_imagery_lightningstrikedensity_goes_time&layers=3&format=jsonp");

    // Request Succeeded
    me.ltgReq.addListener("success", function(e)
    {
      var response = e.getTarget().getResponse();

      // Get last frame
      var serverRadarTimes = response.layers[0].timeStops;
      me.mapObject.lightningLegendLabel.setValue('<b>Lightning - ' + new moment(serverRadarTimes.slice(-1)[0]).format('h:mm a ddd M/DD/YYYY</b>'));
    }, this);

    // Set up the query timestamp request
    me.qpeReq = new qx.io.request.Jsonp();

    // Request Succeeded
    me.qpeReq.addListener("success", function(e)
    {
      var response = e.getTarget().getResponse();

      // Get last frame
      var serverRadarTimes = response.layers[0].timeStops;
      me.mapObject.qpeLegendLabel.setValue('<b>QPE - ' + new moment(serverRadarTimes.slice(-1)[0]).format('h:mm a ddd M/DD/YYYY</b>'));
    }, this);

    // Timer
    me.timer = new qx.event.Timer(0);
    var refreshRate = 5 * 60;
    me.timer.addListener("interval", function(e)
    {
      me.timer.setInterval(1000 * refreshRate);
      Object.keys(me.layers).forEach(function(obj)
      {
        console.log(obj);
        if (this.layers[obj].getVisible())
        {
          if (obj == "Lightning") {
            me.ltgReq.send();
          }
          if (obj.indexOf("QPE") !== -1) {
            me.qpeReq.send();
          }
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
      if (name == "Lightning")
      {
        me.ltgReq.send();
        me.mapObject.lightningContainer.setVisibility('visible')
      }
      if (name.indexOf("QPE") !== -1)
      {
        var layerValue = layer.split(':')[1];
        me.qpeReq.setUrl("https://nowcoast.noaa.gov/layerinfo?request=timestops&service=analysis_meteohydro_sfc_qpe_time&layers=" + layerValue + "&format=jsonp")
        me.qpeReq.send();
        me.mapObject.qpeContainer.setVisibility('visible')
      }
      console.log(name, source, layer, time);
      var time_range = time + ',' + time;
      if (typeof me.map == "undefined") {
        return;
      }
      if (typeof this.layers[name] !== "undefined") {
        if (this.layers[name].getVisible())
        {
          if (name == "Lightning") {
            me.mapObject.lightningContainer.setVisibility('excluded');
          } else if (name.indexOf("QPE") !== -1) {
            me.mapObject.qpeContainer.setVisibility('excluded');
          }

          this.layers[name].setVisible(false);
          return;
        } else
        {
          if (name == "Lightning") {
            me.mapObject.lightningContainer.setVisibility('visible');
          } else if (name.indexOf("QPE") !== -1) {
            me.mapObject.qpeContainer.setVisibility('visible');
          }

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
          url : source
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
