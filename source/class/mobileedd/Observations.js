/**
Access to the new Mesowest API
*/
qx.Class.define("mobileedd.Observations",
{
  extend : qx.core.Object,
  type : "singleton",
  construct : function()
  {
    var me = this;
    me.base(arguments);
    me.bus = qx.event.message.Bus.getInstance();
    this.c = mobileedd.config.Config.getInstance();
    me.mapObject = mobileedd.page.Map.getInstance();
    me.map = me.mapObject.getMap();

    // Get appropriate Library
    var req = new qx.bom.request.Script();
    req.onload = function()
    {
      // Set up the service
      me.setupobservationRequest();

      // Timer
      me.timer = new qx.event.Timer(0);
      var refreshRate = 10;
      me.timer.addListener("interval", function(e)
      {
        me.timer.setInterval(1000 * refreshRate);
        me.getUpdatedServiceUrl();
        me.observationReq.send();
      });

      // Start the auto-refresh timer
      me.timer.start();
      me.map.getView().on('change:resolution', function(evt)
      {
        me.getUpdatedServiceUrl();
        me.observationReq.send();
      });
    }.bind(this);
    req.open("GET", "resource/mobileedd/libs/geojsonlibs.js");
    req.send();
    var req = new qx.bom.request.Script();
    req.open("GET", "resource/mobileedd/libs/flot/flot-combo.js");
    req.send();
  },
  members :
  {
    addLayer : function()
    {
      var me = this;
      me.observationLayer = new ol.layer.Vector(
      {
        name : "Observations",
        source : null,
        style : function(feature, resolution)
        {
          // console.log(feature);
          var anchor = [36, 36];
          var image = '';
          var service_type = "OBSERVATIONS";
          var set_name = '_value_1';
          var value_type = 'value';
          var data = feature.get(service_type);
          var t = data["air_temp" + set_name];
          var td = data["dew_point_temperature" + set_name];
          if (typeof td === "undefined") {
            var td = data.dew_point_temperature_value_1d;
          }
          var ws = data["wind_speed" + set_name];
          var wd = data["wind_direction" + set_name];
          var wg = data["wind_gust" + set_name];
          var rh = data["relative_humidity" + set_name];
          var cig = data["ceiling" + set_name];
          var vsby = data["visibility" + set_name];
          var wh = data["wave_height" + set_name];
          var wp = data["peak_wind_speed" + set_name];
          var imageUrl = 'http://preview.weather.gov/edd/resource/edd/MappingFramework/js/stationmodel/stationmodel.php?';
          imageUrl += (t !== undefined ? '&T=' + Math.round(t[value_type]) : '');
          imageUrl += (td !== undefined ? '&TD=' + Math.round(td[value_type]) : '');
          imageUrl += (ws !== undefined ? '&FF=' + Math.round(ws[value_type]) : '');
          imageUrl += (wd !== undefined ? '&DD=' + Math.round(wd[value_type]) : '');
          imageUrl += (wg !== undefined && wg[value_type] > 15 ? '&FFGUST=' + Math.round(wg[value_type]) : '');
          imageUrl += (wp !== undefined && wp[value_type] > 15 ? '&PEAK=' + Math.round(wp[value_type]) : '');
          imageUrl += (wh !== undefined ? '&WH=' + Math.round(wh[value_type]) : '');
          imageUrl += '&FFu=mph&FFGUSTu=mph';
          imageUrl += '&size=1';  // + me.met_scale_slider.getValue() / 10;
          return [new ol.style.Style( {
            image : new ol.style.Icon(
            {
              anchor : anchor,
              anchorXUnits : 'pixels',
              anchorYUnits : 'pixels',
              src : imageUrl,
              size : [72, 72]

              //scale : 1  //0.75
            })
          })]
        }
      });
      me.map.addLayer(me.observationLayer);
    },
    setupobservationRequest : function()
    {
      var me = this;
      me.observationReq = new qx.io.request.Jsonp();
      me.getUpdatedServiceUrl();
      me.observationReq.setCallbackParam("callback");
      me.observationReq.setCache(false);
      me.observationReq.addListener("readyStateChange", function(e)
      {
        // me.statusIcon.setIcon("edd/images/ajax-loader_16px.gif");
      });
      me.observationReq.addListener("success", function(e)
      {
        var geoJSON = e.getTarget().getResponse();
        var data = GeoJSON.parse(geoJSON.STATION, {
          Point : ['LATITUDE', 'LONGITUDE']
        })
        var features = new ol.format.GeoJSON().readFeatures(data, {
          featureProjection : 'EPSG:3857'
        });
        var vectorSource = new ol.source.Vector((
        {
          projection : 'EPSG:3857',
          features : features  //,

          // loader : function(extent, resolution, projection)

          // {

          //   // console.log(extent, resolution, projection)

          //   var observationObject = mobileedd.Observations.getInstance();

          // // observationObject.timer.restartWith(1000);

          //   //observationObject.observationReq.send();

          // },

          // strategy : ol.loadingstrategy.bbox
        }));
        if (typeof me.observationLayer == "undefined")
        {
          me.timer.stop();
          console.log('could not find layer so stopping timer.');
          return;
        }
        if (me.observationLayer.getSource() !== null) {
          me.observationLayer.getSource().clear();
        }
        me.observationLayer.setSource(vectorSource);
        me.timer.restart();
      });
      me.observationReq.addListener("fail", function(e) {
        console.log('MesoWest Observations request failed...')
      });
    },

    /**
    Get the updated service url
    */
    getUpdatedServiceUrl : function()
    {
      var me = this;

      // Service
      var label = '';  //me.field_select_box.getSelection()[0].getLabel();
      if (label == "Precipitation Accumulation") {
        me.serviceUrlField = me.c.getSecure() + "//api.mesowest.net/v2/stations/precipitation?";
      } else {
        me.serviceUrlField = me.c.getSecure() + "//api.mesowest.net/v2/stations/latest?";
      }
      var extent = me.map.getView().calculateExtent(me.map.getSize())
      var bboxArray = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');

      // Fix extent for Mesowest API
      if (Number(bboxArray[0]) < -180) {
        bboxArray[0] = Number(bboxArray[0]) + 360;
      }
      if (Number(bboxArray[2]) < -180) {
        bboxArray[2] = Number(bboxArray[2]) + 360;
      }
      if (Number(bboxArray[0]) > 180) {
        bboxArray[0] = Number(bboxArray[0]) - 360;
      }
      if (Number(bboxArray[2]) > 180) {
        bboxArray[2] = Number(bboxArray[2]) - 360;
      }

      // bbox
      me.serviceUrlField += "&bbox=" + bboxArray.toString();

      // Get rid of any trailing comma in networks
      me.serviceUrlField += "&network=1,14,96";
      me.serviceUrlField += "&within=60";

      // Shows any sites that contain at least one of the fields
      me.serviceUrlField += "&varoperator=or";  // and

      // Active
      me.serviceUrlField += "&status=active";

      // Output format
      me.serviceUrlField += "&output=json";

      // Units
      me.serviceUrlField += "&units=temp|F,";
      me.serviceUrlField += "speed|mph,";
      me.serviceUrlField += "precip|in,";
      me.serviceUrlField += "pres|mb,";
      me.serviceUrlField += "height|ft,";
      me.serviceUrlField += "alti|inhg";

      // Token
      me.serviceUrlField += "&token=" + mobileedd.config.Config.getInstance().getMesowestToken();
      me.observationReq.setUrl(me.serviceUrlField);
    }
  }
});
