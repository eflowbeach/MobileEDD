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
      Object.keys(me.layers).forEach(function(obj) {
        if (this.layers[obj].getVisible())
        {
          if (obj == "Lightning") {
            me.ltgReq.send();
          }
          if (obj.indexOf("QPE") !== -1) {
            me.qpeReq.send();
          }

          // Don't update travel, but update others
          if (obj != "Travel Hazard Forecast") {
            if (this.layers[obj].getSource() != null) {
              if (this.layers[obj] instanceof ol.layer.Tile) {
                this.layers[obj].getSource().setTileLoadFunction(this.layers[obj].getSource().getTileLoadFunction())
              } else if (this.layers[obj] instanceof ol.layer.Vector)
              {
                // do nothing
              } else
              {
                this.layers[obj].getSource().updateParams( {
                  "refresh" : new Date().getTime()
                })
              }

            }
          }
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
      Object.keys(me.layers).forEach(function(obj) {
        try {
          if (bool) {
            me.html[obj].setVisibility('visible');
          } else {
            me.html[obj].setVisibility('excluded');
          }
        }catch (e)
        {
          //not defined
        }
      })
      if (bool) {
        me.mapObject.dynamicLegendScrollContainer.addCssClass('white');
      } else {
        me.mapObject.dynamicLegendScrollContainer.removeCssClass('white');
      }
      me.mapObject.qpeContainer.setVisibility('excluded');
    },

    /**
     * Add Storm Reports
     * */
    addStormReports : function()
    {
      var me = this;
      var sr = me.mapObject.getLayerByName("Storm Reports");

      // Add the layer if it doesn't exist
      if (sr == null)
      {
        var srObject = mobileedd.StormReports.getInstance();
        srObject.addLayer();
        srObject.timer.start();

        // Add layer to more layers Object
        me.layers["Storm Reports"] = srObject.srLayer;
      } else
      {
        var srObject = mobileedd.StormReports.getInstance();
        if (sr.getVisible())
        {
          sr.setVisible(false);
          srObject.timer.stop();
        } else
        {
          sr.setVisible(true);
          srObject.timer.start();
        }
      }
    },

    /**
       * Add Travel Hazard Legend
       * */
    addTravelHazardLegend : function()
    {
      var me = this;
      var legend = [
      {
        color : "#ff6cff",
        label : "Extreme Hazards - Blizzard, Ice Storm, High Wind Warnings.",  // Flooding doesn't show up in NDFD as of 6/19/2014
        shape : "box"
      },
      {
        color : "#ff0000",
        label : "Winter and Areal Flood Warnings. Max Wind Gusts >= 50 mph.",
        shape : "box"
      },
      {
        color : "orange",
        label : "Winter, Wind, Areal Flood and Dense Fog Advisories. Max Wind Gusts >= 40 mph.  Temperatures <= -20 \xBAF.",
        shape : "box"
      },
      {
        color : "yellow",
        label : "Sub-Advisory Snow, Sleet, Freezing Rain, or Fog. Max Wind Gusts >= 30 mph.",
        shape : "box"
      },
      {
        color : "#4486b8",
        label : "Rain or Drizzle. Temperatures <= 32 \xBAF.",
        shape : "box"
      },
      {
        color : "#7bb043",
        label : "No Forecasted Weather Hazards",
        shape : "box"
      },
      {
        color : "#bdbdbd",
        label : "Missing or Invalid Forecast Data",
        shape : "box"
      }];
      var layerName = "Travel Hazard Forecast";
      var subtitle = '';
      me.html[layerName] = new mobileedd.LegendCreator(layerName, legend, subtitle);

      // Add layer to more layers Object
      me.layers[layerName] = mobileedd.TravelHazards.getInstance().thLayer;
      me.mapObject.dynamicLegendContainer.add(me.html[layerName]);
      me.mapObject.dynamicLegendScrollContainer.addCssClass('white');
    },
    addBoundary : function(layerName, wmslayer, group)
    {
      var me = this;
      var layer = me.mapObject.getLayerByName(layerName);

      // Add the layer if it doesn't exist
      if (layer == null)
      {
        var borderlayer = new ol.layer.Tile(
        {
          name : layerName,
          opacity : 0.7,
          source : new ol.source.TileWMS(
          {
            url : 'https://digital.weather.gov/wms.php',
            params :
            {
              'LAYERS' : wmslayer,
              'FORMAT' : "image/png",
              'TRANSPARENT' : "TRUE",
              'TRANSITIONEFFECT' : "resize",
              'VERSION' : "1.3.0",

              //'VT' : me.getValidTime(),  //"2016-10-02T00:00",
              'EXCEPTIONS' : "INIMAGE",
              'SERVICE' : "WMS",
              'REQUEST' : "GetMap",
              'STYLES' : "",
              'REGION' : "conus",
              'CRS' : "EPSG:3857",
              'WIDTH' : '512',
              'HEIGHT' : '512'
            }
          })
        });
        me.layers[layerName] = borderlayer;
        me.layers[layerName].group = group;
        me.mapObject.map.addLayer(borderlayer);
      } else
      {
        if (layer.getVisible()) {
          layer.setVisible(false);
        } else {
          layer.setVisible(true);
        }
      }
    },

    /**
     * Add Borders and Labels
     * */
    addBordersAndLabels : function(layerName, group)
    {
      var me = this;
      var layer = me.mapObject.getLayerByName(layerName);

      // Add the layer if it doesn't exist
      if (layer == null)
      {
        if (layerName == "High Density Cities") {
          var newLayer = new ol.layer.Tile(
          {
            name : layerName,
            source : new ol.source.Stamen( {
              layer : 'toner-labels'
            })
          });
        } else if (layerName == "Low Density Cities") {
          var newLayer = new ol.layer.Tile(
          {
            name : layerName,
            source : new ol.source.Stamen( {
              layer : 'terrain-labels'
            })
          });
        }

        // Add layer to more layers Object
        me.layers[layerName] = newLayer;
        me.layers[layerName].group = group;
        me.mapObject.map.addLayer(newLayer);
      } else
      {
        if (layer.getVisible()) {
          layer.setVisible(false);
        } else {
          layer.setVisible(true);
        }
      }
    },

    /**
    * Add River Levels
    * */
    addRiverLevels : function()
    {
      var me = this;
      var layerName = "River Levels";
      var riverLevels = me.mapObject.getLayerByName(layerName);

      // Add the layer if it doesn't exist
      if (riverLevels == null)
      {
        var riverLevelsObject = mobileedd.RiverLevels.getInstance();
        riverLevelsObject.addLayer();
        riverLevelsObject.timer.start();

        // Add layer to more layers Object
        me.layers[layerName] = riverLevelsObject.riverLevelsLayer;

        // Add a legend
        var legend = [
        {
          color : "#FF00FF",
          label : "Major Flood",
          shape : "circle",
          radius : 7
        },
        {
          color : "#FF0033",
          label : "Moderate Flood",
          shape : "circle",
          radius : 7
        },
        {
          color : "#FF9900",
          label : "Flood Stage",
          shape : "circle",
          radius : 7
        },
        {
          color : "#FFFF00",
          label : "Action Stage",
          shape : "circle",
          radius : 7
        },
        {
          color : "#00DC00",
          label : "Normal",
          shape : "circle",
          radius : 7
        },
        {
          color : "#000000",
          label : "Old Observation",
          shape : "circle",
          radius : 7
        }];
        var subtitle = '*Note: Inner circles show observed height while outer circles show forecasted height.<br>';
        me.html[layerName] = new mobileedd.LegendCreator(layerName, legend, subtitle);
        me.mapObject.dynamicLegendContainer.add(me.html[layerName]);
      } else
      {
        var riverLevelsObject = mobileedd.RiverLevels.getInstance();
        if (riverLevels.getVisible())
        {
          riverLevels.setVisible(false);
          riverLevelsObject.timer.stop();
          me.html[layerName].setVisibility('excluded');
        } else
        {
          riverLevels.setVisible(true);
          riverLevelsObject.timer.start();
          me.html[layerName].setVisibility('visible');
          me.mapObject.dynamicLegendScrollContainer.addCssClass('white');
        }
      }
    },

    /**
    * Add a new radar Layer
    */
    addRestLayer : function(params)
    {
      var me = this;
      var name = params.name;
      var source = params.source;
      var layer = params.layer;
      var time = params.time;
      var group = params.group;
      var opacity = params.opacity;

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
      if (typeof time == "undefined") {
        time = new Date().getTime();
      } else {
        time = new moment().add(time.replace('h', ''), 'hours').toDate().getTime();
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
            'FORMAT' : (name == "Observations") ? 'PNG32' : 'PNG8',
            'TRANSPARENT' : 'true',
            'BBOXSR' : '3857',
            'IMAGESR' : '3857',
            'SIZE' : '256,256',

            // 'DPI' : 90,
            'time' : time_range
          },
          url : source
        })
      });
      me.map.addLayer(me.layers[name]);
      me.layers[name].setOpacity((typeof opacity == "undefined") ? me.getOpacity() : opacity);
      me.layers[name].group = group;

      // State border on top
      me.mapObject.putVectorLayerOnTop("U.S. States");

      /**
       * Generate the Legend
       */

      // For lightning ignore
      if (name == "Lightning")
      {
        me.html[name] = new qx.ui.mobile.embed.Html('');
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
        var layersToShow = new qx.data.Array(layer.split(':')[1].split(','))
        if (typeof (data.layers) != "undefined") {
          data.layers.forEach(function(obj, index) {
            // if lyr_id is just show or blank: they are requesting all of the layers
            if (layersToShow.contains(obj.layerId + '') || layersToShow.toArray()[0] == "" || layer == "show:")
            {
              if (typeof (obj.layerName) !== "undefined") {
                if (obj.layerName == "Image") {
                  html += '<b>' + name + '</b><br>';
                } else {
                  html += '<b>' + obj.layerName + '</b><br>';
                }
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
        var timeRequest = new qx.io.request.Jsonp(source.replace('export', layer.split(':')[1]) + "?f=json&returnUpdates=true", "GET", "application/json");
        timeRequest.setCache(false);
        timeRequest.addListenerOnce("success", function(e)
        {
          //debugger;
          try
          {
            var timeExtent = e.getTarget().getResponse().timeExtent;
            var timeRange = '<br>Valid:<br>' + new moment(timeExtent[0]).format('h:mm a ddd M/DD/YYYY') + ' to<br> ' + new moment(timeExtent[1]).format('h:mm a ddd M/DD/YYYY');
            var title = html.split('<br>')[0];
            var combineHtml = title + timeRange + html.split(title)[1];
          }catch (e) {
            //Problem with time response
            combineHtml = html;
          }
          me.html[name] = new qx.ui.mobile.embed.Html(combineHtml);
          me.mapObject.dynamicLegendScrollContainer.addCssClass('white');
          me.mapObject.dynamicLegendContainer.add(me.html[name]);
        }, this);
        timeRequest.send();
      }, this);
      me.reqArcGIS.send();
    }
  }
});
