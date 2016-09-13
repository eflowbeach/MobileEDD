/**
Access to the new Mesowest API
*/
qx.Class.define("mobileedd.Observations",
{
  extend : qx.core.Object,
  properties :
  {
    displayField :
    {
      init : "Temperature",
      apply : "redraw"
    },
    period :
    {
      init : "1",
      apply : "redraw"
    },
    networks : {
      init : "1,14,96"
    },
    extent : {
      init : ''
    }
  },
  type : "singleton",
  construct : function()
  {
    var me = this;
    me.base(arguments);
    me.bus = qx.event.message.Bus.getInstance();
    this.c = mobileedd.config.Config.getInstance();
    me.mapObject = mobileedd.page.Map.getInstance();
    me.map = me.mapObject.getMap();
    
    // Load GeoJSON libs
    var req = new qx.bom.request.Script();
    req.onload = function()
    {
      var graph_domain = [-30, 120];
      me.scale_x = d3.scaleLinear().domain(graph_domain).range([0, 1]);
      var breakpoints = [me.scale_x(-10), me.scale_x(15), me.scale_x(32), me.scale_x(45), me.scale_x(60), me.scale_x(70), me.scale_x(80), me.scale_x(90), me.scale_x(100), me.scale_x(110)];
      var curve = ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'];
      me.threshold_x = d3.scaleThreshold().domain(breakpoints).range(curve.reverse());

      // Get the default field from url if exists
      me.setDisplayField(me.c.getObDisplayedField());
    }
    req.open("GET", "resource/mobileedd/libs/d3.min.js");
    req.send();

    // Get appropriate Library
    var req = new qx.bom.request.Script();
    req.onload = function()
    {
      // Set up the service
      me.setupobservationRequest();

      // Timer
      var refreshRate = 60;
      me.timer = new qx.event.Timer(1000);  //1000 * refreshRate);//0);
      me.timer.addListener("interval", function(e)
      {
        me.timer.setInterval(1000 * refreshRate);
        me.getUpdatedServiceUrl();
        me.observationReq.send();
      });

      // Start the auto-refresh timer
      me.timer.start();
      
      // Set up a listener for map move.
      me.map.getView().on('change:resolution', function(evt) {
        if (typeof me.observationLayer !== "undefined" && me.observationLayer.getVisible())
        {
          if (evt.target.get('resolution') < 1500) {
            me.setNetworks('');
          } else {
            me.setNetworks('1,14,96');
          }
          me.getUpdatedServiceUrl();
          me.observationReq.send();
        }
      });
    }.bind(this);
    req.open("GET", "resource/mobileedd/libs/geojsonlibs.js");
    req.send();
    
    // Load plotting libraries
    if (typeof (jQuery) === "undefined" || typeof (jQuery.plot) === "undefined")
        {
          var req = new qx.bom.request.Script();
          req.open("GET", "resource/mobileedd/libs/flot/flot-combo.js");
          req.send();
        }
  },
  members :
  {
    redraw : function(value, old)
    {
      var me = this;
      if (me.getDisplayField() == "Temperature" || me.getDisplayField() == "Dew Point")
      {
        var graph_domain = [-30, 120];
        me.scale_x = d3.scaleLinear().domain(graph_domain).range([0, 1]);
        var breakpoints = [me.scale_x(-10), me.scale_x(15), me.scale_x(32), me.scale_x(45), me.scale_x(60), me.scale_x(70), me.scale_x(80), me.scale_x(90), me.scale_x(100), me.scale_x(110)];
        var curve = ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'];
        me.threshold_x = d3.scaleThreshold().domain(breakpoints).range(curve.reverse());
      } else if (me.getDisplayField() == "RH")
      {
        var graph_domain = [0, 100];
        me.scale_x = d3.scaleLinear().domain(graph_domain).range([0, 1]);
        var breakpoints = [me.scale_x(15), me.scale_x(25), me.scale_x(40), me.scale_x(50), me.scale_x(80), me.scale_x(90), me.scale_x(95)];
        var curve = ['#d73027', '#fc8d59', '#fee08b', '#ffffbf', '#d9ef8b', '#91cf60', '#1a9850'];
        me.threshold_x = d3.scaleThreshold().domain(breakpoints).range(curve);
      } else if (me.getDisplayField() == "Wind Speed" || me.getDisplayField() == "Wind Gust")
      {
        var graph_domain = [0, 120];
        me.scale_x = d3.scaleLinear().domain(graph_domain).range([0, 1]);
        var breakpoints = [me.scale_x(15), me.scale_x(25), me.scale_x(40), me.scale_x(50), me.scale_x(60), me.scale_x(74), me.scale_x(90)];
        var curve = ['#f1eef6', '#d4b9da', '#c994c7', '#df65b0', '#e7298a', '#ce1256', '#91003f'];
        me.threshold_x = d3.scaleThreshold().domain(breakpoints).range(curve);
      } else if (me.getDisplayField() == "Wave Height" || me.getDisplayField() == "Primary Swell")
      {
        var graph_domain = [0, 50];
        me.scale_x = d3.scaleLinear().domain(graph_domain).range([0, 1]);
        var breakpoints = [me.scale_x(3), me.scale_x(5), me.scale_x(7), me.scale_x(10), me.scale_x(15), me.scale_x(20), me.scale_x(30)];
        var curve = ['#eff3ff', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594'];
        me.threshold_x = d3.scaleThreshold().domain(breakpoints).range(curve);
      } else if (me.getDisplayField() == "Visibility")
      {
        var graph_domain = [0, 10];
        me.scale_x = d3.scaleLinear().domain(graph_domain).range([0, 1]);
        var breakpoints = [me.scale_x(0.25), me.scale_x(0.5), me.scale_x(1), me.scale_x(3), me.scale_x(5), me.scale_x(6), me.scale_x(7)];
        var curve = ['#fef0d9', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#990000'];
        me.threshold_x = d3.scaleThreshold().domain(breakpoints).range(curve.reverse());
      } else if (me.getDisplayField() == "Precipitation")
      {
        var graph_domain = [0, 15];
        me.scale_x = d3.scaleLinear().domain(graph_domain).range([0, 1]);
        var breakpoints = [me.scale_x(0.1), me.scale_x(0.25), me.scale_x(0.5), me.scale_x(1), me.scale_x(2), me.scale_x(3), me.scale_x(4)];
        var curve = ['#edf8e9', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#005a32'];
        me.threshold_x = d3.scaleThreshold().domain(breakpoints).range(curve);
        me.getUpdatedServiceUrl();

        // me.observationReq.send();
      }





      if (value != "Observations" && old == "Observations")
      {
        me.getUpdatedServiceUrl();
        me.observationReq.send();
      }
      if (value == "Observations" && !old == "Observations")
      {
        me.getUpdatedServiceUrl();
        me.observationReq.send();
      }
      if (typeof (this.observationLayer) !== "undefined" && this.observationLayer.getSource() != null) {
        this.observationLayer.getSource().dispatchEvent('change');
      }
    },
    /**
     * Add the observation layer
     * */
    addLayer : function()
    {
      var me = this;
      me.observationLayer = new ol.layer.Vector(
      {
        name : "Observations",
        source : null,
        style : function(feature, resolution)
        {
          var anchor = [36, 36];
          var image = '';
          var service_type = "OBSERVATIONS";
          var set_name = '_value_1';
          var value_type = 'value';
          var features = feature.get('features');
          var maxPrecip = 0;
          var traceFlag = false;
          for (var i = 0; i < features.length; i++)
          {
            var data = features[i].get(service_type);
            var t = data["air_temp" + set_name];
            var td = data["dew_point_temperature" + set_name];
            if (typeof td === "undefined") {
              var td = data.dew_point_temperature_value_1d;
            }
            var rh = data["relative_humidity" + set_name];
            var ws = data["wind_speed" + set_name];
            var wd = data["wind_direction" + set_name];
            var wg = data["wind_gust" + set_name];
            var rh = data["relative_humidity" + set_name];
            var cig = data["ceiling" + set_name];
            var vsby = data["visibility" + set_name];
            var wh = data["wave_height" + set_name];
            var ps = data["primary_swell_wave_height" + set_name];
            var wp = data["peak_wind_speed" + set_name];
            var precip = data["total_precip_value_1"];

            // "Temperature", "Dew Point", "RH", "Wind Speed", "Wind Gust", "Precipitation"]);
            if (me.getDisplayField() == "Temperature") {
              var label = (t !== undefined ? '' + Math.round(t[value_type]) : '');
            } else if (me.getDisplayField() == "Dew Point") {
              var label = (td !== undefined ? '' + Math.round(td[value_type]) : '');
            } else if (me.getDisplayField() == "RH") {
              var label = (rh !== undefined ? '' + Math.round(rh[value_type]) : '');
            } else if (me.getDisplayField() == "Heat Index") {
              var label = (t !== undefined && rh !== undefined ? '' + Math.round(heatIndex(t[value_type], rh[value_type])) : '');
            } else if (me.getDisplayField() == "Wind Speed") {
              var label = (ws !== undefined ? '' + Math.round(ws[value_type]) : '');
            } else if (me.getDisplayField() == "Wave Height") {
              var label = (wh !== undefined ? '' + Math.round(wh[value_type]) : '');
            } else if (me.getDisplayField() == "Primary Swell") {
              var label = (ps !== undefined ? '' + Math.round(ps[value_type]) : '');
            } else if (me.getDisplayField() == "Visibility") {
              var label = (vsby !== undefined ? '' + Math.round(vsby[value_type]) : '');
            } else if (me.getDisplayField() == "Wind Gust") {
              var label = (wg !== undefined ? '' + Math.round(wg[value_type]) : '');
            } else if (me.getDisplayField() == "Precipitation")
            {
              if (precip !== undefined)
              {
                if (precip == "T 0")
                {
                  value = 0;
                  traceFlag = true;
                }
                if (precip > maxPrecip) {
                  maxPrecip = precip;
                }
              }
              var label = maxPrecip.toFixed(2);

              //? '' + Number(precip).toFixed(2) : '');
            } else
            {
              // Ob
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
                })
              })]
            }









            if (label == '' && i != features.length - 1) {
              continue;
            }
          }
          var radius = 6;
          if (label == '') {
            var color = '#797979';
          } else if (me.getDisplayField() == "Precipitation" && (label == '0.00' || label == '0')) {
            var color = '#7B7B7B';
          } else {
            var color = me.threshold_x(me.scale_x(label));
          }

          var contrast = getContrast50(color);
          if (me.getDisplayField() == "Precipitation" && (label == '0.00' || label == '0'))
          {
            var contrast = 'black';
            if (traceFlag) {
              label = "T";
            }
          }
          var textStroke = new ol.style.Stroke(
          {
            color : contrast,
            width : 3
          });
          var textFill = new ol.style.Fill( {
            color : color
          });
          return [new ol.style.Style(
          {
            image : new ol.style.Circle(
            {
              fill : new ol.style.Fill( {
                color : color
              }),
              stroke : new ol.style.Stroke(
              {
                color : 'black',
                width : 2
              }),
              radius : radius
            }),
            text : new ol.style.Text(
            {
              font : '20px Calibri,sans-serif',
              text : label,
              fill : textFill,
              stroke : textStroke,
              offsetY : -20
            })
          })];
        }
      });
      me.map.addLayer(me.observationLayer);
    },

    /**
     * Set up the observation request
     * */
    setupobservationRequest : function()
    {
      var me = this;
      me.observationReq = new qx.io.request.Jsonp();
      me.getUpdatedServiceUrl();
      me.observationReq.setCallbackParam("callback");
      me.observationReq.setCache(false);
      me.observationReq.addListener("readyStateChange", function(e) {
        me.mapObject.obBusyIndicator.setVisibility('visible');
      });
      me.vectorSource = new ol.source.Vector((
      {
        projection : 'EPSG:3857',
        strategy : ol.loadingstrategy.bbox,
        loader : function(extent, resolution, projection)
        {
          if (me.getExtent() != extent.toString())
          {
            // if (typeof me.observationLayer !== "undefined" && me.observationLayer.getVisible())

            // {

            //   if (resolution < 1500) {

            //     me.setNetworks('');

            //   } else {

            //     me.setNetworks('1,14,96');

            //   }
            me.getUpdatedServiceUrl();
            me.observationReq.send();

            // }
          }
          me.setExtent(extent.toString());
        }
      }));

      // Cluster strategy
      me.clusterSource = new ol.source.Cluster(
      {
        distance : 30,
        projection : 'EPSG:3857',
        source : me.vectorSource
      });
      me.observationReq.addListener("success", function(e)
      {
        me.mapObject.obBusyIndicator.setVisibility('excluded');
        var geoJSON = e.getTarget().getResponse();
        var data = GeoJSON.parse(geoJSON.STATION, {
          Point : ['LATITUDE', 'LONGITUDE']
        })
        var features = new ol.format.GeoJSON().readFeatures(data, {
          featureProjection : 'EPSG:3857'
        });
        if (typeof me.observationLayer == "undefined")
        {
          me.timer.stop();
          console.log('could not find layer so stopping timer.');
          return;
        }
        if (me.observationLayer.getSource() !== null) {
          me.vectorSource.clear();
        }
        me.vectorSource.addFeatures(features);
        me.observationLayer.setSource(me.clusterSource);
        me.timer.restart();

        // Silly way to get Vector Layer on top...
        var observationLayer = me.mapObject.getLayerByName('Observations');
        me.map.removeLayer(observationLayer);
        me.map.getLayers().setAt(me.map.getLayers().getArray().length, observationLayer);
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
      var label = me.getDisplayField();  //me.field_select_box.getSelection()[0].getLabel();
      if (label == "Precipitation") {
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
      if (me.getNetworks() != '') {
        me.serviceUrlField += "&network=" + me.getNetworks();
      }
      if (label == "Precipitation")
      {
        me.serviceUrlField += "&start=" + new moment().subtract(me.getPeriod(), "hours").utc().format('YYYYMMDDHHmm');
        me.serviceUrlField += "&end=" + new moment().utc().format('YYYYMMDDHHmm');
      } else
      {
        me.serviceUrlField += "&within=90";
      }

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
