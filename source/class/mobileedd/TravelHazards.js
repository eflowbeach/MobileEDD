/**
 *
 * Creates a travel forecast colored by weather hazards along the route
 *

   Copyright: 2016

   License: MIT

   Authors: Jonathan Wolfe

************************************************************************ */

/*global qx*/

/*global ol*/

/*global mobileedd*/

/**
 */
qx.Class.define("mobileedd.TravelHazards",
{
  extend : qx.core.Object,
  properties :
  {
    leaveAt : {
      init : new Date()
    },
    avoidTolls : {
      init : false
    },
    startLocation :
    {
      init : null,
      nullable : true
    },
    endLocation :
    {
      init : null,
      nullable : true
    },
    startLocationLL :
    {
      init : null,
      nullable : true
    },
    endLocationLL :
    {
      init : null,
      nullable : true
    },
    waypoint : {
      apply : "_setNewWaypoint"
    },
    route : {
      init : null
    },
    waypointString : {
      init : ''
    }
  },
  type : "singleton",
  construct : function()
  {
    var me = this;
    me.base(arguments);
    this.c = mobileedd.config.Config.getInstance();
    var busyIndicator = new qx.ui.mobile.dialog.BusyIndicator("Please wait...");
    this.busyPopup = new qx.ui.mobile.dialog.Popup(busyIndicator);
    var closeDialogButton1 = new qx.ui.mobile.form.Button("Close");
    this.__popup = new qx.ui.mobile.dialog.Popup(closeDialogButton1);
    this.__popup.setTitle("");
    closeDialogButton1.addListener("tap", function() {
      this.__popup.hide();
    }, this);
    me.mapObject = mobileedd.page.Map.getInstance();
    me.map = me.mapObject.getMap();
    me.bus = qx.event.message.Bus.getInstance();
    me.waypoints = {

    };
    me.addLayer();
    me.directionService = new qx.io.request.Jsonp();
    me.directionService.setCallbackName("renderNarrative");
    me.directionService.setTimeout(10 * 1000);
    var timer = new qx.event.Timer(10 * 1000);
    timer.addListener("interval", function(e)
    {
      this.__popup.setTitle("Request Timed Out. The server may be busy...");
      this.__popup.show();
      timer.stop();
    });
    me.directionService.addListener("timeout", function(e) {
      timer.restart();
    });
    me.geo = new mobileedd.geo.EsriGeo();
  },
  members :
  {
    /**
     * Adds Layer to the map
     */
    addLayer : function()
    {
      var me = this;
      me.lineSource = new ol.source.Vector();
      me.thLayer = new ol.layer.Vector(
      {
        source : me.lineSource,
        name : 'Travel Hazards Segments',
        style : function(feature, resolution)
        {
          var color = 'green';
          if (!feature.get("_DataQuality")) {
            color = "#bdbdbd";
          }
          var wx = feature.get("Weather").toString().toLowerCase();
          var wwa = feature.get("Watches_Warnings_Advisories").toString();
          if (wwa.indexOf("Blizzard Warning") !== -1) {
            color = "#ff6cff";
          } else if (wwa.indexOf("Freezing Rain Warning") !== -1) {
            color = "#ff6cff";
          } else if (wwa.indexOf("Hurricane") !== -1) {
            color = "#ff6cff";
          } else if (wwa.indexOf("Tropical") !== -1) {
            color = "#ff6cff";
          } else if (wwa.indexOf("Flood Warning") !== -1) {
            color = "#ff6cff";
          } else if (wwa.indexOf("Ice Storm Warning") !== -1) {
            color = "#ff6cff";
          } else if (wwa.indexOf("Coastal Flood Warning") !== -1) {
            color = "#ff6cff";
          } else if (wwa.indexOf("Tornado Warning") !== -1) {
            color = "#ff6cff";
          } else if (wwa.indexOf("Severe Thunderstorm Warning") !== -1) {
            color = "#ff6cff";
          } else if (wwa.indexOf("High Wind Warning") !== -1) {
            color = "#ff6cff";
          } else if (wx.indexOf("tornado") !== -1) {
            color = "#ff6cff";
          } else if (wwa.indexOf("Blizzard Watch") !== -1) {
            color = "red";
          } else if (wwa.indexOf("Winter Storm Warning") !== -1) {
            color = "red";
          } else if (wwa.indexOf("Wind Chill Warning") !== -1) {
            color = "red";
          } else if (wwa.indexOf("Snow Warning") !== -1) {
            color = "red";
          } else if (wwa.indexOf("Avalanche Warning") !== -1) {
            color = "red";
          } else if (wwa.indexOf("Freezing Rain Advisory") !== -1 || wwa.indexOf("Freezing Fog Advisory") !== -1) {
            color = "red";
          } else if (wwa.indexOf("Areal Flood Warning") !== -1) {
            color = "red";
          } else if (wwa.indexOf("Red Flag Warning") !== -1) {
            color = "red";
          } else if (wx.indexOf("severe thunderstorms") !== -1) {
            color = "red";
          } else if (feature.get("Max Wind Gust") >= 50) {
            color = "red";
          } else if (wwa.indexOf("Winter Storm Watch") !== -1) {
            color = "orange";
          } else if (wwa.indexOf("Flash Flood Watch") !== -1) {
            color = "orange";
          } else if (feature.get("Temperature") <= -20) {
            color = "orange";
          } else if (wwa.indexOf("Wind Chill Advisory") !== -1) {
            color = "orange";
          } else if (wwa.indexOf("Flood Advisory") !== -1) {
            color = "orange";
          } else if (feature.get("Max Wind Gust") >= 40) {
            color = "orange";
          } else if (wwa.indexOf("Winter Weather Advisory") !== -1) {
            color = "orange";
          } else if (wwa.indexOf("Wind Advisory") !== -1) {
            color = "orange";
          } else if (wx.indexOf("numerous thunderstorms") !== -1 || wx.indexOf("thunderstorms likely") !== -1) {
            color = "orange";
          } else if (wwa.indexOf("Winter Weather") !== -1) {
            color = "orange";
          } else if (wwa.indexOf("Snow Advisory") !== -1) {
            color = "orange";
          } else if (wwa.indexOf("Dense Fog Advisory") !== -1) {
            color = "orange";
          } else if (wx.indexOf("snow") !== -1 || wx.indexOf("freezing") !== -1 || wx.indexOf("ice") !== -1 || wx.indexOf("fog") !== -1 || wx.indexOf("sleet") !== -1 || wx.indexOf("frost") !== -1) {
            color = "yellow";
          } else if (feature.get("Max Wind Gust") >= 30) {
            color = "yellow";
          } else if (wx.indexOf("thunderstorms") !== -1) {
            color = "yellow";
          } else if (feature.get("Temperature") <= 15) {  // Temperature when road salt stops working
            color = "yellow";
          } else if (wx.indexOf("rain") !== -1 || wx.indexOf("drizzle") !== -1) {
            color = "#4486b8";
          } else if (feature.get("Temperature") <= 32) {
            color = "#4486b8";
          } else if (feature.get("Temperature") == "NA") {  // Missing data
            color = "#bdbdbd";
          } else {
            color = "#7bb043";
          }







































          return [new ol.style.Style(
          {
            fill : new ol.style.Fill( {
              color : color
            }),
            stroke : new ol.style.Stroke(
            {
              color : color,
              width : 4
            })
          })]
        }
      });
      me.map.addLayer(me.thLayer);
      me.pointSource = new ol.source.Vector();
      me.pointLayer = new ol.layer.Vector(
      {
        name : "Travel Hazards Points",
        source : me.pointSource,
        style : function(feature, resolution)
        {
          if (feature.get("image") == "origin" || feature.get("image") == "destination" || feature.get("image") == "waypoint")
          {
            if (feature.get("image") == "origin") {
              image = "resource/mobileedd/images/map-marker-icon-green.png";
            } else if (feature.get("image") == "waypoint") {
              image = "resource/mobileedd/images/map-marker-icon-blue.png";
            } else if (feature.get("image") == "destination") {
              image = "resource/mobileedd/images/map-marker-icon.png";
            }


            var textStroke = new ol.style.Stroke(
            {
              color : 'white',
              width : 4
            });
            return [new ol.style.Style(
            {
              image : new ol.style.Icon(
              {
                anchor : [12, 12],
                anchorXUnits : 'pixels',
                anchorYUnits : 'pixels',
                src : image,
                scale : 0.75
              }),
              text : new ol.style.Text(
              {
                font : '20px Calibri,sans-serif',
                text : feature.get("address"),
                fill : textFill,
                stroke : textStroke,
                offsetY : 15
              })
            })]
          }
          var image = "resource/mobileedd/images/grayball.png";
          var anchor = [8, 12];
          if (feature.get("Watches_Warnings_Advisories") != null) {
            if (feature.get("Watches_Warnings_Advisories").indexOf("Wind Warning") !== -1) {
              image = "resource/mobileedd/images/lsr/wind.png";
            }
          }
          if (feature.get("Weather") != null)
          {
            var wx = feature.get("Weather").toLowerCase();
            if (wx.indexOf("freezing") !== -1 || wx.indexOf("frost") !== -1) {
              image = "resource/mobileedd/images/lsr/ice.png";
            } else if (wx.indexOf("snow") !== -1) {
              image = "resource/mobileedd/images/lsr/snow.png";
            } else if (wx.indexOf("sleet") !== -1) {
              image = "resource/mobileedd/images/lsr/sleet.png";
            } else if (wx.indexOf("thunder") !== -1) {
              image = "resource/mobileedd/images/lsr/lightning.png";
            } else if (wx.indexOf("rain") !== -1) {
              image = "resource/mobileedd/images/lsr/heavyrain.png";
            } else if (wx.indexOf("fog") !== -1) {
              image = "resource/mobileedd/images/lsr/fog.png";
            } else if (wx.indexOf("dust") !== -1) {
              image = "resource/mobileedd/images/lsr/dust.png";
            } else if (wx.indexOf("drizzle") !== -1) {
              image = "resource/mobileedd/images/lsr/drizzle.png";
            } else if (wx.indexOf("smoke") !== -1) {
              image = "resource/mobileedd/images/lsr/smoke.png";
            } else {
              if (typeof (feature.get("Max Wind Gust")) !== "undefined" && feature.get("Max Wind Gust") >= 30) {
                image = "resource/mobileedd/images/lsr/wind.png";
              }
            }








            if (image != "resource/mobileedd/images/grayball.png") {
              anchor = [20, 40];
            }
            var t = feature.get("Temperature");
            var label = '';
            if (resolution < 1500)
            {
              label = t + ' °F';
              ;
            }
            var color = '#000000';
            var width = 3;
            if (t < 32)
            {
              color = '#FF0000';
              width = 6;
            } else if (t < 37)
            {
              color = '#0011B8';
              width = 4;
            }

            var contrast = '#FFFFFF';  //getContrast50(color);
            var textStroke = new ol.style.Stroke(
            {
              color : contrast,
              width : width
            });
            var textFill = new ol.style.Fill( {
              color : color
            });
            return [new ol.style.Style(
            {
              image : new ol.style.Icon(
              {
                anchor : anchor,
                anchorXUnits : 'pixels',
                anchorYUnits : 'pixels',
                src : image,
                scale : 0.75
              }),
              text : new ol.style.Text(
              {
                font : '20px Calibri,sans-serif',
                text : label,
                fill : textFill,
                stroke : textStroke,
                offsetY : 15
              })
            })]
          }
        }
      });
      me.map.addLayer(me.pointLayer);
    },

    /**
    Plot Route
    */
    plotRoute : function(response)
    {
      var me = this;
      var error = false;

      // Check for old data
      var oldData = false;
      mobileedd.TravelHazards.getInstance().pointSource.getFeatures().forEach(function(obj) {
        if (typeof obj.get('image') == "undefined") {
          oldData = true;
        }
      })
      if (me.thLayer.getSource() !== null && oldData)
      {
        me.thLayer.getSource().clear();
        me.pointLayer.getSource().clear()
      }

      // Error checking should go here FIXME

      // Get date and time
      var selectionDateTime = me.getLeaveAt();
      var delta = (selectionDateTime - new Date()) / 1000.0;
      var hoursToAdd = Math.ceil(delta / 3600);

      // Don't allow past departure times to minimize confusion
      if (delta < -3600) {
        return;
      }

      // Distance Calculations
      var totalDistanceMiles = response.route.distance;  // In miles
      var lonLatPairs = decompress(response.route.shape.shapePoints, 5);
      var lonLatPlotArray = [];

      /**
       * Algorithm to calculate the optimum amount of points to skip to get 1 hour interval travel times
       *  - Should be an even number otherwise the lat/lons get messed up
       */
      var pointsToSkip = 1000;

      // For short distances cut value in half
      if (totalDistanceMiles < 300) {
        pointsToSkip = 1000 * 0.5;
      }

      // Pair down giant array

      //  * Note: lonLatPairs from Mapquest returns [lat1, lon1, lat2, lon2] - so for lon lat we need 2nd index then first
      lonLatPairs.forEach(function(obj, index) {
        if (index % pointsToSkip == 0 && typeof (index + 1) !== "undefined") {
          lonLatPlotArray.push([lonLatPairs[index + 1], obj]);
        }
      })

      // Ensure destination is added
      lonLatPlotArray.push([lonLatPairs[lonLatPairs.length - 1], lonLatPairs[lonLatPairs.length - 2]]);
      var startLon = lonLatPlotArray[0][0];
      var startLat = lonLatPlotArray[0][1];
      var endLon = lonLatPlotArray[lonLatPlotArray.length - 1][0];
      var endLat = lonLatPlotArray[lonLatPlotArray.length - 1][1];

      // // Waypoints

      // var sleeper = false;

      // var waypointString = "";

      // var minimums = [];

      // me.both.getSelectables().forEach(function(obj) {

      //   if (typeof (obj.getLabel) == "function")

      //   {

      //     var label = obj.getLabel().split('(')[0];

      //     // Found a sleeping/resting waypoint

      //     if (typeof (obj.getLabel().split('(')[1]) !== "undefined")

      //     {

      //       sleeper = true;

      //       var differences = [];

      //       var key = label.trim();  //substring(0, label.length - 1);

      //       var hourString = obj.getLabel().split('(')[1];

      //       var pattern = /(\d+)/g;

      //       try

      //       {

      //         var waypointLat = me.waypoints[key][0];

      //         var waypointLon = me.waypoints[key][1];

      //       }catch (e) {

      //         me.mapObject.addWaypoints(key);

      //       }

      //       // Find the index of waypoints that best match a sleepover

      //       lonLatPlotArray.forEach(function(trackPosition, index)

      //       {

      //         var lat = trackPosition[0];

      //         var lon = trackPosition[1];

      //         // Keep track of total distance

      //         var trackPositionLonLat = new OpenLayers.Geometry.Point(lon, lat);

      //         var waypointPosition = new OpenLayers.Geometry.Point(waypointLon, waypointLat);

      //         var difference = waypointPosition.distanceTo(trackPositionLonLat);

      //         differences.push(difference);

      //       });

      //       // Find the extrema (use a broad sweep to grab general min curve and a short one to grab the local minima

      //       if (differences.length > 500) {

      //         var broadSweep = 14;

      //       } else if (differences.length > 100) {

      //         broadSweep = 7;

      //       } else if (differences.length > 50) {

      //         broadSweep = 4;

      //       } else {

      //         broadSweep = 1;

      //       }

      //       differences.forEach(function(diffobj, index) {

      //         if (index > broadSweep && index < differences.length - 2 - broadSweep) {

      //           if (differences[index - broadSweep] > diffobj && diffobj < differences[index + broadSweep]) {

      //             if (index > 0 && index < differences.length - 2) {

      //               if (differences[index - 1] > diffobj && diffobj < differences[index + 1])

      //               {

      //                 pattern.lastIndex = 0;  // Reset  regex index

      //                 var match = pattern.exec(hourString);

      //                 minimums.push([key, index, match[0]])

      //               }

      //             }

      //           }

      //         }

      //       })

      //     }

      //     waypointString += label + "^";

      //     me.mapObject.addWaypoints(label);

      //   }

      // });
      var displayTime = response.route.time;
      var days = Math.floor(displayTime / 86400);
      var hours = Math.floor(displayTime / 3600) % 24;
      var minutes = Math.floor(displayTime / 60) % 60;
      if (days == 0)
      {
        var tlength = Math.round(response.route.distance) + " mi.<br>" + hours + 'h ' + minutes + 'm';
        var text = new qx.event.message.Message("edd.message");
        text.setData(['<b>This trip:</b><br>' + tlength, 5000]);
        this.bus.dispatch(text);
      } else
      {
        var tlength = Math.round(response.route.distance) + " mi.<br>" + days + 'd ' + hours + 'h ' + minutes + 'm';
        var text = new qx.event.message.Message("edd.message");
        text.setData(['<b>This trip:</b><br>' + tlength, 5000]);
        this.bus.dispatch(text);
      }
      var totaltime_hours = response.route.time / 3600;  // Convert form seconds to hours
      var total_points = lonLatPlotArray;
      var total_segments = total_points / pointsToSkip;
      var distance_per_segment = totalDistanceMiles / total_segments;
      var speed_mph = totalDistanceMiles / totaltime_hours;
      var lines = [];
      var lineindex = 0;
      var lonLatPointsAll = [];

      /**
      * Format length output.
      * @param line {ol.geom.LineString} The line.
      * @return {string} The formatted length.
      */
      var wgs84Sphere = new ol.Sphere(6378137);
      var formatLength = function(line)
      {
        var length;
        var coordinates = line.getCoordinates();
        length = 0;
        var sourceProj = me.map.getView().getProjection();
        for (var i = 0, ii = coordinates.length - 1; i < ii; ++i)
        {
          var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
          var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
          length += wgs84Sphere.haversineDistance(c1, c2);
        }
        return (Math.round(length * 100) / 100);  // m
      };
      var distanceTraveled = 0;
      lonLatPlotArray.forEach(function(obj, index)
      {
        var lon = obj[0];
        var lat = obj[1];
        lonLatPointsAll.push([lon, lat]);
        if (index > 0 && index < lonLatPlotArray.length)
        {
          var geom = new ol.geom.LineString([lonLatPlotArray[index - 1], lonLatPlotArray[index]]).transform('EPSG:4326', 'EPSG:3857');
          distanceTraveled += formatLength(geom) * 0.000621371;  // m to mi
          var feature = new ol.Feature( {
            geometry : geom
          });
          lines.push(feature);

          /**
          * Find times
          */

          // Check waypoint additions by looping through minimums and comparing them with the index
          var waypointAdditions = 0;

          // When the user departed
          var departedAt = new moment(selectionDateTime);

          // Units -> Hours
          var timeTraveled = (distanceTraveled / speed_mph) + waypointAdditions;

          // Find the closest forecast hour to the time at which you arrive at a location. This determines if you want to round up or not.

          // Use departed at time for minute calculation
          var roundHour = (departedAt.clone().add(timeTraveled, 'hours').format('m') < 30) ? 0 : 1;
          var mercatorLL = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
          var region = mobileedd.page.Map.getInstance().getNdfdRegion(mercatorLL);

          //var region = me.dataStore.getNdfdRegionFromPoint(lat, lon);

          // Get the time of arrival at each point by adding the time it takes to arrive at the point

          // based on speed and distance traveled
          var t = departedAt.clone().add(timeTraveled, 'hours');
          var arriveTimeString = t.format("h:mm A ddd, MMM. DD, YYYY");

          // Note the round hour...
          var probeTime = timeTraveled + roundHour;
          var probeTimeString = departedAt.clone().utc().add(probeTime, 'hours').format('YYYY-MM-DDTHH:00');
          lines[lineindex].setProperties(
          {
            probeTime : probeTimeString,
            arriveTime : arriveTimeString,
            region : region
          });
          lineindex++;
        }
      });
      me.lineindex = lineindex;
      this.busyPopup.show();
      lines.forEach(function(obj, index)
      {
        var wktLinePath = new ol.format.WKT().writeFeature(obj);
        var validTime = obj.get('probeTime');
        var arriveTime = obj.get('arriveTime');
        var region = obj.get('region');
        me.getPathData(wktLinePath, validTime, region, index, lines, arriveTime);
      })
    },

    /**
    Make the request and pass the response to the function which adds data to map
    */
    getRoutePoints : function()
    {
      var me = this;
      mobileedd.MoreLayers.getInstance().showLegendVisibilityOfAll(true);
      me.thLayer.setVisible(true);
      me.pointLayer.setVisible(true);
      var start = me.getStartLocationLL();
      var end = me.getEndLocationLL()

      // Date / Time leaving
      var selectionDateTime = me.getLeaveAt();
      var leaveDate = new moment(selectionDateTime).format('MM/DD/YYYY');
      var leaveTime = new moment(selectionDateTime).format('HH:mm');

      // Waypoints
      var waypoints = me.getWaypointString();

      // Add destination point to waypoint string
      waypoints += "&to=" + end;

      // The url
      var url = me.c.getSecure() + "//open.mapquestapi.com/directions/v2/route?key=" + me.c.getMapQuestKey() + "&outFormat=json&routeType=fastest&timeType=2&dateType=0&date=" + leaveDate + "&localTime=" + leaveTime + "&doReverseGeocode=false&enhancedNarrative=false&shapeFormat=cmp&generalize=0&locale=en_US&unit=m&from=" + start + waypoints + "&drivingStyle=2&highwayEfficiency=21.0";
      me.directionService.setUrl(url);
      me.directionService.addListenerOnce("success", function(e)
      {
        me.setRoute(e.getTarget().getResponse());
        me.plotRoute(e.getTarget().getResponse());
        me.mapObject.putVectorLayerOnTop("Travel Hazards Segments");
        me.mapObject.putVectorLayerOnTop("Travel Hazards Points");
      }, this);
      me.directionService.addListenerOnce("error", function(e)
      {
        this.__popup.setTitle("Direction request error.");
        this.__popup.show();
      }, this);

      // Send direction Request
      me.directionService.send();
    },

    /**
    Get the Path data from NDFD and color it based on the returned values
    */
    getPathData : function(wktLinePath, validTime, region, index, lines, arriveTime)
    {
      var me = this;

      // Instantiate request
      var req = new qx.io.request.Jsonp()
      req.setUrl(me.mapObject.getJsonpRoot() + "travelforecast/getNdfdDataPath.php");

      // Set request data. Accepts String, Map or qooxdoo Object.
      req.setRequestData(
      {
        "path" : wktLinePath,
        "validTime" : validTime,
        "region" : region,
        "index" : index
      });
      req.addListenerOnce("fail", function(e)
      {
        this.__popup.setTitle("Forecast retrieval error.");
        this.__popup.show();
        this.busyPopup.hide();
      }, this);
      req.addListenerOnce("success", function(e)
      {
        var response = e.getTarget().getResponse();
        var lineString = e.getTarget().getRequestData().path;
        var validTime = e.getTarget().getRequestData().validTime;
        var lineFeature = new ol.format.WKT().readFeature(e.getTarget().getRequestData().path);

        // Fill variables with response data
        var t = response.t[0];
        var td = response.td[0];
        var apparentt = response.apparentt[0];
        var rh = response.rh[0];
        var ws = response.windspd[0];
        try
        {
          ws.min = kt2mph(ws.min);
          ws.max = kt2mph(ws.max);
          var wg = response.windgust[0];
          wg.max = kt2mph(wg.max);
        }catch (e)
        {
          var text = new qx.event.message.Message("edd.message");
          text.setData(["There appears to be a problem with the database. Please try back later.", 5000]);
          this.bus.dispatch(text);
          return;
        }
        var winddir = new qx.data.Array();
        var pop12 = (typeof (response.pop12) === "undefined") ? "NA" : response.pop12[0];
        var qpf = (typeof (response.qpf) === "undefined") ? "NA" : response.qpf[0];
        var totalqpf = (typeof (response.totalqpf) === "undefined") ? "NA" : response.totalqpf[0];
        var snowamt = (typeof (response.snowamt) === "undefined") ? "NA" : response.snowamt[0];
        var totalsnowamt = (typeof (response.totalsnowamt) === "undefined") ? "NA" : response.totalsnowamt[0];
        var iceaccum = (typeof (response.iceaccum) === "undefined") ? "NA" : response.iceaccum[0];
        var totaliceaccum = (typeof (response.totaliceaccum) === "undefined") ? "NA" : response.totaliceaccum[0];

        // Check validity of data
        var closestTime = (t.num == 0) ? "NA" : new moment(t.qT, "YYYY-MM-DD HH:mm Z").format("h:00 A ddd, MMM. DD, YYYY");
        var tLabel = (t.num == 0) ? "NA" : t.min.toFixed(0) + '-' + t.max.toFixed(0);
        var tdLabel = (td.num == 0) ? "NA" : td.min.toFixed(0) + '-' + td.max.toFixed(0);
        var apparentLabel = (apparentt.num == 0) ? "NA" : apparentt.min.toFixed(0) + '-' + apparentt.max.toFixed(0);
        var rhLabel = (rh.num == 0) ? "NA" : rh.min.toFixed(0) + '-' + rh.max.toFixed(0);
        var wsLabel = (ws.num == 0) ? "NA" : ws.min.toFixed(0) + '-' + ws.max.toFixed(0);
        var wgLabel = (wg.num == 0) ? "NA" : wg.max.toFixed(0);
        var pop12Label = (pop12.num == 0 || pop12 == "NA") ? "NA" : pop12.min.toFixed(0) + '-' + pop12.max.toFixed(0);
        var qpfLabel = (qpf.num == 0 || qpf == "NA") ? "NA" : qpf.min.toFixed(2) + '-' + qpf.max.toFixed(2);
        var totalqpfLabel = (totalqpf.num == 0 || totalqpf == "NA") ? "NA" : totalqpf.min.toFixed(2) + '-' + totalqpf.max.toFixed(2);
        var snowamtLabel = (snowamt.num == 0 || snowamt == "NA") ? "NA" : snowamt.min.toFixed(1) + '-' + snowamt.max.toFixed(1);
        var totalsnowamtLabel = (totalsnowamt.num == 0 || totalsnowamt == "NA") ? "NA" : totalsnowamt.min.toFixed(1) + '-' + totalsnowamt.max.toFixed(1);
        var iceaccumLabel = (iceaccum.num == 0 || iceaccum == "NA") ? "NA" : iceaccum.min.toFixed(2) + '-' + iceaccum.max.toFixed(2);
        var totaliceaccumLabel = (totaliceaccum.num == 0 || totaliceaccum == "NA") ? "NA" : totaliceaccum.min.toFixed(2) + '-' + totaliceaccum.max.toFixed(2);
        var within12Hr = (new moment.utc() - new moment.utc(t.qT, "YYYY-MM-DD HH:mm Z")) / (1000 * 3600 * 12);
        if (within12Hr >= 1) {
          within12Hr = false;
        } else {
          within12Hr = true;
        }

        // Eliminate duplicate directions
        response.winddir.forEach(function(obj)
        {
          var dir = degToCompass(Number(obj));
          if (!winddir.contains(dir)) {
            winddir.push(dir);
          }
        });
        var wwa = new qx.data.Array();
        response.wwa.forEach(function(obj) {
          if (obj != "<None>" && !wwa.contains(obj)) {
            wwa.push(obj);
          }
        })
        wwa = wwa.toString();
        lineFeature.setProperties(
        {
          "Arrive here around" : arriveTime,
          "Forecast Valid" : closestTime,
          "_DataQuality" : within12Hr,
          "Watches_Warnings_Advisories" : wwa,
          "Snow Amount" : snowamtLabel,
          "_Snow Amount" : "\"",
          "Total Snow" : totalsnowamtLabel,
          "_Total Snow" : "\"",
          "Ice Amount" : iceaccumLabel,
          "_Ice Amount" : "\"",
          "Total Ice" : totaliceaccumLabel,
          "_Total Ice" : "\"",
          "Weather" : (response.wx[0] == null || response.wx[0] == "") ? "" : response.wx[0],
          "Temperature" : tLabel,
          "_Temperature" : " \xBAF",
          "Wind Chill" : apparentLabel,
          "_Wind Chill" : " \xBAF",
          "Dew Point" : tdLabel,
          "_Dew Point" : " \xBAF",
          "RH" : rhLabel,
          "_RH" : " %",
          "Wind Speed" : wsLabel,
          "_Wind Speed" : " mph",
          "Max Wind Gust" : wgLabel,
          "_Max Wind Gust" : " mph",
          "Wind Direction" : winddir.toString(),
          "_Wind Direction" : "",
          "Prob. of Precip (12 hour)" : pop12Label,
          "_Prob. of Precip (12 hour)" : "  %",
          "Precipitation" : qpfLabel,
          "_Precipitation" : "\"",
          "Total Precipitation" : totalqpfLabel,
          "_Total Precipitation" : "\""
        });
        if (tLabel == "NA") {
          var pointProperties =
          {
            "Arrive here around" : arriveTime,
            "Forecast Valid" : closestTime,
            "_DataQuality" : within12Hr,
            "Watches_Warnings_Advisories" : wwa,
            "Snow Amount" : snowamtLabel,
            "_Snow Amount" : "\"",
            "Total Snow Amount" : totalsnowamtLabel,
            "_Total Snow Amount" : "\"",
            "Ice Accumulation" : iceaccumLabel,
            "_Ice Accumulation" : "\"",
            "Total Ice Amount" : totaliceaccumLabel,
            "_Total Ice Amount" : "\"",
            "Weather" : (response.wx[0] == null || response.wx[0] == "") ? "" : response.wx[0],
            "Temperature" : tLabel,
            "_Temperature" : " \xBAF",
            "Wind Chill" : apparentLabel,
            "_Wind Chill" : " \xBAF",
            "Dew Point" : tdLabel,
            "_Dew Point" : " \xBAF",
            "RH" : rhLabel,
            "_RH" : " %",
            "Wind Speed" : wsLabel,
            "_Wind Speed" : " mph",
            "Max Wind Gust" : wgLabel,
            "_Max Wind Gust" : " mph",
            "Wind Direction" : winddir.toString(),
            "_Wind Direction" : "",
            "Prob. of Precip (12 hour)" : pop12Label,
            "_Prob. of Precip (12 hour)" : " %",
            "Precipitation" : qpfLabel,
            "_Precipitation" : "\"",
            "Total Precipitation" : totalqpfLabel,
            "_Total Precipitation" : "\""
          };
        } else {
          var pointProperties =
          {
            "Arrive here around" : arriveTime,
            "Forecast Valid" : closestTime,
            "_DataQuality" : within12Hr,
            "Watches_Warnings_Advisories" : wwa,
            "Snow Amount" : (typeof (snowamt.max) == "undefined") ? "NA" : snowamt.max.toFixed(1),
            "_Snow Amount" : "\"",
            "Total Snow Amount" : (typeof (totalsnowamt.max) == "undefined") ? "NA" : totalsnowamt.max.toFixed(1),
            "_Total Snow Amount" : "\"",
            "Ice Amount" : (typeof (iceaccum.max) == "undefined") ? "NA" : iceaccum.max.toFixed(2),
            "_Ice Amount" : "\"",
            "Total Ice Amount" : (typeof (totaliceaccum.max) == "undefined") ? "NA" : totaliceaccum.max.toFixed(2),
            "_Total Ice Amount" : "\"",
            "Weather" : (response.wx[0] == null || response.wx[0] == "") ? "" : response.wx[0],
            "Temperature" : (t.mean < 75) ? t.min.toFixed(0) : t.max.toFixed(0),
            "_Temperature" : " \xBAF",
            "Wind Chill" : apparentLabel,
            "_Wind Chill" : " \xBAF",
            "Dew Point" : td.min.toFixed(0),
            "_Dew Point" : " \xBAF",
            "RH" : rh.mean.toFixed(0),
            "_RH" : " %",
            "Wind Speed" : ws.max.toFixed(0),
            "_Wind Speed" : " mph",
            "Max Wind Gust" : wg.max.toFixed(0),
            "_Max Wind Gust" : " mph",
            "Wind Direction" : winddir.toString(),
            "_Wind Direction" : "",
            "Prob. of Precip (12 hour)" : pop12.max,
            "_Prob. of Precip (12 hour)" : " %",
            "Precipitation" : (typeof (qpf.max) == "undefined") ? "NA" : qpf.max.toFixed(2),
            "_Precipitation" : "\"",
            "Total Precipitation" : (typeof (totalqpf.max) == "undefined") ? "NA" : totalqpf.max.toFixed(2),
            "_Total Precipitation" : "\""
          };
        }
        me.lineSource.addFeature(lineFeature);

        /**
         * Point Values
         * */

        // Get Geometry from LineFeature
        var iconFeature = new ol.Feature( {
          geometry : new ol.geom.Point(lineFeature.getGeometry().getCoordinates()[0])
        });
        iconFeature.setProperties(pointProperties);
        me.pointSource.addFeature(iconFeature);
        var index = e.getTarget().getRequestData().index;

        /**
              Zoom to location after requests come back
              */
        if (index == me.lineindex - 1)
        {
          me.map.getView().fit(me.pointSource.getExtent(), me.map.getSize());
          this.busyPopup.hide();
        }
      }, this);

      // Send request
      req.send();
    }
  }
});
