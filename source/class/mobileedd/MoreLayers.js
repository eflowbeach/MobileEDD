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
    this.c = mobileedd.config.Config.getInstance();
    me.bus = qx.event.message.Bus.getInstance();
    me.mapObject = mobileedd.page.Map.getInstance();
    me.map = me.mapObject.getMap();
    me.layers = {

    };
    me.html = {

    }

    // Use for legends
    var req = new qx.bom.request.Script();
    req.open("GET", "resource/mobileedd/libs/d3.min.js");
    req.send();
    var req = new qx.bom.request.Script();
    req.open("GET", "resource/mobileedd/libs/x2js.js");
    req.send();

    // Set up the query timestamp request

    // Just query 1 hr...it should be close enough
    me.ltgReq = new qx.io.request.Jsonp(me.c.getSecure() + "//nowcoast.noaa.gov/layerinfo?request=timestops&service=sat_meteo_emulated_imagery_lightningstrikedensity_goes_time&layers=3&format=jsonp");

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
  members :
  {
    showLegendVisibilityOfAll : function(bool)
    {
      var me = this;
      Object.keys(me.layers).forEach(function(obj)
      {
        me.html[obj].setVisibility('excluded');  //le(bool);
      })
      if (bool) {
        me.mapObject.dynamicLegendScrollContainer.addCssClass('white');
      } else {
        me.mapObject.dynamicLegendScrollContainer.removeCssClass('white');
      }
    },

    /**
    * Add a new radar Layer
    */
    addRestLayer : function(name, source, layer, time)
    {
      var me = this;

      // A way to get at the timestamp for idp services.

      // var req = new qx.io.request.Xhr();

      // req.setUrl(this.c.getSecure() + '//idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/SPC_wx_outlks/MapServer/WFSServer?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=SPC_wx_outlks:Day_1_Convective_Outlook&SRSNAME=EPSG%3A4326');

      // req.addListener("success", function(e)

      // {

      //   var req = e.getTarget();

      //   var x2js = new X2JS();

      //   // Response parsed according to the server's

      //   // response content type, e.g. JSON

      //   var json = x2js.xml_str2json(req.getResponse());

      //   console.log(new moment.utc(json.FeatureCollection.featureMember[1].Day_1_Convective_Outlook.valid.__text, "YYYYMMDDHHmm").local().format("HHmm a MM/DD/YYYY"));

      // }, this);

      // // Send request

      // req.send();
      if (name == "Lightning")
      {
        me.ltgReq.send();
        me.mapObject.lightningContainer.setVisibility('visible')
      }
      if (name.indexOf("QPE") !== -1)
      {
        var layerValue = layer.split(':')[1];
        me.qpeReq.setUrl(me.c.getSecure() + "//nowcoast.noaa.gov/layerinfo?request=timestops&service=analysis_meteohydro_sfc_qpe_time&layers=" + layerValue + "&format=jsonp")
        me.qpeReq.send();
        me.mapObject.qpeContainer.setVisibility('visible')
      }
      var time_range = time + ',' + time;
      if (typeof me.map == "undefined") {
        return;
      }
      if (typeof this.layers[name] !== "undefined") {
        if (this.layers[name].getVisible())
        {
          me.html[name].setVisibility('excluded');

          // Hide legend if all containers are hidden
          var remove = true;
          Object.keys(me.html).forEach(function(obj) {
            if (me.html[obj].getVisibility() == "visible") {
              remove = false;
            }
          })
          if (remove) {
            me.mapObject.dynamicLegendScrollContainer.removeCssClass('white');
          }
          if (name == "Lightning") {
            me.mapObject.lightningContainer.setVisibility('excluded');
          } else if (name.indexOf("QPE") !== -1) {
            me.mapObject.qpeContainer.setVisibility('excluded');
          }

          this.layers[name].setVisible(false);
          return;
        } else
        {
          me.html[name].setVisibility('visible');

          // Ensure legend is shown
          me.mapObject.dynamicLegendScrollContainer.addCssClass('white');
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
            'LAYERS' : layer,
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
      me.layers[name].setOpacity(me.getOpacity());

      // Silly way to get Vector Layer on top...
      var statesLayer = me.mapObject.getLayerByName("U.S. States");
      me.map.removeLayer(statesLayer);
      me.map.getLayers().setAt(me.map.getLayers().getArray().length, statesLayer);

      // Generate the Legend
      if (name == "Lightning") {
        return;
      }
      me.reqArcGIS = new qx.io.request.Jsonp(source.replace('export', 'legend') + "?f=json", "GET", "application/json");
      me.reqArcGIS.setCache(false);
      me.reqArcGIS.addListenerOnce("success", function(e)
      {
        var response = e.getTarget();
        var data = response.getResponse();
        var html = '';

        // split the layer call apart show:1,2,3 becomes [1,2,3] (qooxdoo array used for contains()
        var test = new qx.data.Array(layer.split(':')[1].split(','))
        if (typeof (data.layers) != "undefined") {
          data.layers.forEach(function(obj, index) {
            // if lyr_id is just show or blank: they are requesting all of the layers
            if (test.contains(obj.layerId + '') || test.toArray()[0] == "" || layer == "show:")
            {
              if (typeof (obj.layerName) !== "undefined") {
                html += '<b>' + obj.layerName + '</b><br>';
              } else {
                html += 'Could not find legend data.<br>';
              }
              if (typeof (obj.legend) !== "undefined") {
                obj.legend.forEach(function(obj2, index2) {
                  html += '<img style="position: relative; top: 8px;" src="data:image/png;base64,' + obj2.imageData + '"/>' + obj2.label.replace('0000001', '') + '<br>';
                });
              }
            }
          });
        } else {
          html += "Layer legend could not be found.";
        }
        me.html[name] = new qx.ui.mobile.embed.Html(html);
        me.mapObject.dynamicLegendScrollContainer.addCssClass('white');
        me.mapObject.dynamicLegendContainer.add(me.html[name]);
      }, this);
      me.reqArcGIS.send();
    }
  }
});
