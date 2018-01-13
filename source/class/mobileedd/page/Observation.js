/* ************************************************************************

   Copyright: 2016

   License: MIT

   Authors: Jonathan Wolfe

************************************************************************ */

/*global qx*/

/**
 */
qx.Class.define("mobileedd.page.Observation",
{
  extend : qx.ui.mobile.page.NavigationPage,
  type : 'singleton',
  construct : function()
  {
    this.base(arguments);
    this.c = mobileedd.config.Config.getInstance();
    this.bus = qx.event.message.Bus.getInstance();
    this.setTitle("Observation");
    this.setShowBackButton(true);
    this.setBackButtonText("Back");
  },
  members :
  {
    // overridden
    _initialize : function()
    {
      var me = this;
      this.base(arguments);
      this.label = new qx.ui.mobile.basic.Label("Observation");
      this.getContent().add(this.label);
      this.bus.subscribe("edd.observation", function(e)
      {
        var feature = e.getData();
        var service_type = "OBSERVATIONS";
        var set_name = '_value_1';
        var value_type = 'value';

        //http://api.mesowest.net/v2/stations/timeseries?&token=a13f6d0a32c842e6815c377e77a64e99&recent=3600&stid=KCRW&units=temp|f,speed|kts,precip|in,pres|mb,height|ft&nocache=1471975626352&callback=qx.bom.request.Jsonp.qx1471975626352259.callback
        var tsUrl = "http://api.mesowest.net/v2/stations/timeseries?";
        tsUrl += "&token=" + this.c.getMesowestToken();

        // if (start)

        // {

        //   tsUrl += "&start=" + start;

        //   tsUrl += "&end=" + end;

        // } else

        // {
        tsUrl += "&recent=4320";  // + 72003600";

        // }
        tsUrl += "&stid=" + feature.get('STID');  //strSTID;
        tsUrl += "&units=temp|f,speed|kts,precip|in,pres|mb,height|ft";
        tsUrl += "&output=json";
        var tsReq = new qx.io.request.Jsonp(tsUrl);
        tsReq.setCallbackParam("callback");
        tsReq.setCache(false);
        tsReq.addListener("success", function(e)
        {
          var response = e.getTarget().getResponse();
          var ob = response.STATION[0].OBSERVATIONS;  //data.stations[strSTID];
          var aryT = new Array();
          var aryRH = new Array();
          var aryTD = new Array();
          var aryTDD = new Array();
          var aryFF = new Array();
          var aryFFGUST = new Array();
          var aryDD = new Array();
          var aryPCP1H = new Array();
          var aryCLDFRAC = new Array();
          var aryPRESWEA = new Array();
          var arySST = new Array();
          var aryWAVEHT = new Array();
          var aryWAVEPER = new Array();
          var aryPSWHT = new Array();
          var aryPSWPER = new Array();
          var aryPSWDIR = new Array();
          var arySLP = new Array();
          var aryALTSE = new Array();
          var aryVSBY = new Array();
          var aryCIG = new Array();
          var marine = false;
          for (var i = 0; i < ob.date_time.length; i++)
          {
            //var o = ob.data[i];
            var d = new Date(ob.date_time[i]).getTime();

            //var d = ob.D * 1000;
            aryT.push([d, (typeof ob.air_temp_set_1 == "undefined") ? null : ob.air_temp_set_1[i]]);
            aryRH.push([d, (typeof ob.relative_humidity_set_1 == "undefined") ? null : ob.relative_humidity_set_1[i]]);
            aryTD.push([d, (typeof ob.dew_point_temperature_set_1 == "undefined") ? null : ob.dew_point_temperature_set_1[i]]);
            aryTDD.push([d, (typeof ob.dew_point_temperature_set_1d == "undefined") ? null : ob.dew_point_temperature_set_1d[i]]);
            aryFF.push([d, (typeof ob.wind_speed_set_1 == "undefined") ? null : ob.wind_speed_set_1[i]]);
            aryFFGUST.push([d, (typeof ob.wind_gust_set_1 == "undefined" || ob.wind_gust_set_1[i] == 0 ? null : ob.wind_gust_set_1[i])]);
            aryDD.push([d, (typeof ob.wind_direction_set_1 == "undefined") ? null : ob.wind_direction_set_1[i]]);
            aryPCP1H.push([d, (typeof ob.precip_accum_one_hour_set_1 == "undefined" ? null : ob.precip_accum_one_hour_set_1[i])]);
            aryCLDFRAC.push([d, (typeof ob.cloud_layer_1_code_set_1 == "undefined") ? null : ob.cloud_layer_1_code_set_1[i]]);
            aryPRESWEA.push([d, (typeof ob.weather_cond_code_set_1 == "undefined") ? null : ob.weather_cond_code_set_1[i]]);
            arySLP.push([d, (typeof ob.sea_level_pressure_set_1 == "undefined") ? null : ob.sea_level_pressure_set_1[i]]);
            aryALTSE.push([d, (typeof ob.altimeter_set_1 == "undefined") ? null : ob.altimeter_set_1[i]]);
            aryVSBY.push([d, (typeof ob.visibility_set_1 == "undefined") ? null : ob.visibility_set_1[i]]);
            aryCIG.push([d, (typeof ob.ceiling_set_1 == "undefined") ? null : ob.ceiling_set_1[i]]);

            // Ocean
            arySST.push([d, (typeof ob.t_water_temp_set_1 == "undefined") ? null : ob.t_water_temp_set_1[i]]);
            if (typeof ob.wave_height_set_1 != "undefined") {
              marine = true;
            }
            aryWAVEHT.push([d, (typeof ob.wave_height_set_1 == "undefined") ? null : ob.wave_height_set_1[i]]);
            aryWAVEPER.push([d, (typeof ob.wave_period_set_1 == "undefined") ? null : ob.wave_period_set_1[i]]);
            aryPSWHT.push([d, (typeof ob.primary_swell_wave_height_set_1 == "undefined") ? null : ob.primary_swell_wave_height_set_1[i]]);
            aryPSWPER.push([d, (typeof ob.primary_swell_wave_period_set_1 == "undefined") ? null : ob.primary_swell_wave_period_set_1[i]]);
            aryPSWDIR.push([d, (typeof ob.primary_swell_wave_direction_set_1 == "undefined") ? null : ob.primary_swell_wave_direction_set_1[i]]);
          }
          if (marine) {
            $('#wavegraph').show();
          } else {
            $('#wavegraph').hide();
          }
          var axisFormat = "ha ddd<br>(M/D)";
          $.plot("#tgraph", [
          {
            label : "Temperature",
            data : aryT,
            color : 'red',
            lines : {
              show : true
            }
          },
          {
            label : "Dew Point",
            data : aryTDD,
            color : 'green',
            lines : {
              show : true
            }
          }],
          {
            units : '&deg;F',
            grid : {
              backgroundColor : {
                colors : ["#F8E6BC", "#FFFFFF"]
              }
            },
            legend :
            {
              show : true,
              position : 'nw'
            },
            xaxis :
            {
              mode : "time",
              tickFormatter : function(val, axis) {
                return new moment(val).format(axisFormat);
              }
            },
            axisLabels : {
              show : true
            },
            yaxes : [
            {
              position : 'left',
              axisLabel : '\xB0F',
              tickFormatter : function(val, axis) {
                return val.toFixed(0);
              }
            }]
          });

          // Wind
          $.plot("#windgraph", [
          {
            label : "Wind Speed",
            data : aryFF,
            color : 'purple',
            lines : {
              show : true
            }
          },
          {
            label : "Wind Gust",
            data : aryFFGUST,
            color : 'blue',
            points : {
              show : true
            }
          }],
          {
            units : 'mph',
            grid : {
              backgroundColor : {
                colors : ["#F8E6BC", "#FFFFFF"]
              }
            },
            legend :
            {
              show : true,
              position : 'nw'
            },
            xaxis :
            {
              mode : "time",
              tickFormatter : function(val, axis) {
                return new moment(val).format(axisFormat);
              }
            },
            axisLabels : {
              show : true
            },
            yaxes : [
            {
              position : 'left',
              axisLabel : 'mph',
              tickFormatter : function(val, axis) {
                return val.toFixed(0);
              }
            }]
          });
          $.plot("#precipgraph", [
          {
            label : "Precipitation",
            data : aryPCP1H,
            color : '#057100',
            bars :
            {
              show : true,
              barWidth : 3600 * 1000 * 0.25 * 0.05
            }
          }],
          {
            units : 'in',
            grid : {
              backgroundColor : {
                colors : ["#F8E6BC", "#FFFFFF"]
              }
            },
            legend :
            {
              show : true,
              position : 'nw'
            },
            xaxis :
            {
              mode : "time",
              tickFormatter : function(val, axis) {
                return new moment(val).format(axisFormat);
              }
            },
            axisLabels : {
              show : true
            },
            yaxes : [
            {
              position : 'left',
              axisLabel : 'inches',
              tickFormatter : function(val, axis) {
                return val.toFixed(2);
              }
            }]
          });
          $.plot("#visibilitygraph", [
          {
            label : "Visibility",
            data : aryVSBY,
            color : '#000000'  //,

            // points : {

            //   show : true

            // }
          }],
          {
            units : '"',
            grid : {
              backgroundColor : {
                colors : ["#F8E6BC", "#FFFFFF"]
              }
            },
            legend :
            {
              show : true,
              position : 'nw'
            },
            xaxis :
            {
              mode : "time",
              tickFormatter : function(val, axis) {
                return new moment(val).format(axisFormat);
              }
            },
            axisLabels : {
              show : true
            },
            yaxes : [
            {
              min : 0,
              max : 10,
              position : 'left',
              axisLabel : 'miles',
              tickFormatter : function(val, axis) {
                return val.toFixed(1);
              }
            }]
          });
          $.plot("#pressuregraph", [
          {
            label : "Sea Level Pressure",
            data : arySLP,
            color : '#015365',
            points : {
              show : true
            }
          }],
          {
            units : '"',
            grid : {
              backgroundColor : {
                colors : ["#F8E6BC", "#FFFFFF"]
              }
            },
            legend :
            {
              show : true,
              position : 'nw'
            },
            xaxis :
            {
              mode : "time",
              tickFormatter : function(val, axis) {
                return new moment(val).format(axisFormat);
              }
            },
            axisLabels : {
              show : true
            },
            yaxes : [
            {
              position : 'left',
              axisLabel : 'millibars',
              tickFormatter : function(val, axis) {
                return val.toFixed(0);
              }
            }]
          });
          $.plot("#wavegraph", [
          {
            label : "Wave Height",
            data : aryWAVEHT,
            color : '#105F08',
            lines : {
              show : true
            }
          },
          {
            label : "Primary Swell Height",
            data : aryPSWHT,
            color : '#071EA8',
            lines : {
              show : true
            }
          }],
          {
            units : 'ft',
            grid : {
              backgroundColor : {
                colors : ["#F8E6BC", "#FFFFFF"]
              }
            },
            legend :
            {
              show : true,
              position : 'nw'
            },
            xaxis :
            {
              mode : "time",
              tickFormatter : function(val, axis) {
                return new moment(val).format(axisFormat);
              }
            },
            axisLabels : {
              show : true
            },
            yaxes : [
            {
              position : 'left',
              axisLabel : 'feet'
            }]
          });
        });
        tsReq.send();
        var html = '<div id="tgraph" class="demo-placeholder"></div>';
        html += '<div id="windgraph" class="demo-placeholder"></div>';
        html += '<div id="precipgraph" class="demo-placeholder"></div>';
        html += '<div id="pressuregraph" class="demo-placeholder"></div>';
        html += '<div id="visibilitygraph" class="demo-placeholder"></div>';
        html += '<div id="wavegraph" class="demo-placeholder"></div>';
        html += '<hr><table><tr><td><b>Station ID:</b></td><td>' + feature.get('STID') + '</td></tr><tr>';
        var data = feature.get(service_type);

        // Breakable for loop statement to grab ob date from observation

        // Assumes times are the same for each object
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
          if (data[keys[i]].date_time)
          {
            html += "<td><b>Ob time: </b></td><td>";
            var obdatetime = data[keys[i]].date_time;
            html += moment.utc(obdatetime).local().format("h:mm a, ddd. MMM DD, YYYY");
            break;
          } else if (data.ob_end_time_1)
          {
            html += "<td><b>Precipitation Period: </b></td><td>";
            var start = data.ob_start_time_1;
            var end = data.ob_end_time_1;
            var precip = data.total_precip_value_1;
            html += '</td></tr><tr><td><i> Start:</i></td><td>' + moment.utc(start).local().format("h:mm a, ddd. MMM DD, YYYY");
            html += '</td><td></td></tr><tr><td><i> End:</i></td><td>';
            html += moment.utc(end).local().format("h:MM TT Z, ddd. mmm d, yyyy");
            html += '</td><td></td></tr>';
            html += '<tr><td><b>Total Precipitation: </b></td><td>' + precip + '"</td></tr>';
            break;
          }

        }
        html += "</td></tr>";
        if (typeof (data["air_temp" + set_name]) !== "undefined")
        {
          html += "<td><b>Temperature: </b></td><td>" + Math.round(data["air_temp" + set_name][value_type]) + " \xB0F";

          // Heat Index
          if (typeof (data["relative_humidity" + set_name]) !== "undefined" && data["air_temp" + set_name][value_type] >= 80) {
            var hi = heatIndex(data["air_temp" + set_name][value_type], data["relative_humidity" + set_name][value_type]);
          }

          // Wind Chill
          if (typeof (data["wind_speed" + set_name]) !== "undefined") {
            var wc = windChill(data["air_temp" + set_name][value_type], mph2kt(data["wind_speed" + set_name][value_type]));
          }
          if (typeof hi !== "undefined" && hi >= 90 && service_type == "OBSERVATIONS") {
            html += " <font color=\"red\";><b>Heat Index:</b> " + hi  + " \xB0F" + "</font>";
          }
          if (typeof wc !== "undefined" && wc <= 40 && service_type == "OBSERVATIONS") {
            html += " <font color=\"blue\";><b>Wind Chill:</b> " + wc  + " \xB0F" + "</font>";
          }
          html += "</td></tr>";
        }
        if (typeof (data["dew_point_temperature" + set_name]) !== "undefined") {
          html += "<td><b>Dew Point: </b></td><td>" + Math.round(data["dew_point_temperature" + set_name][value_type]) + " \xB0F</td></tr>";
        } else if (typeof (data.dew_point_temperature_value_1d) !== "undefined") {
          html += "<td><b>Dew Point (derived): </b></td><td>" + Math.round(data.dew_point_temperature_value_1d.value) + " \xB0F</td></tr>";
        }

        if (typeof (data["relative_humidity" + set_name]) !== "undefined") {
          html += "<td><b>Relative Humidity: </b></td><td>" + Math.round(data["relative_humidity" + set_name][value_type]) + " %</td></tr>";
        }
        if (typeof (data["wind_direction" + set_name]) !== "undefined")
        {
          html += "<td><b>Wind: </b></td><td>";
          if (typeof (data["wind_speed" + set_name]) !== "undefined" && data["wind_speed" + set_name][value_type] == 0) {
            html += 'calm</td></tr>';
          } else {
            html += degToCompass(data["wind_direction" + set_name][value_type]) + " ";
            if (typeof (data["wind_speed" + set_name]) !== "undefined") {
              html += Math.round(data["wind_speed" + set_name][value_type]);
            }
            if (typeof (data["wind_gust" + set_name]) !== "undefined") {
              html += "G" + Math.round(data["wind_gust" + set_name][value_type]);
            }
            if (typeof (data["peak_wind_speed" + set_name]) !== "undefined") {
              html += " Peak: " + Math.round(data["peak_wind_speed" + set_name][value_type]);
            }
            html += " mph</td></tr>";
          }
        }
        if (typeof (data["visibility" + set_name]) !== "undefined") {
          html += "<td><b>Visibility: </b></td><td>" + data["visibility" + set_name][value_type] + " mi.</td></tr>";
        }
        if (typeof (data["sea_level_pressure" + set_name]) !== "undefined") {
          html += "<td><b>Sea Level Pressure: </b></td><td>" + data["sea_level_pressure" + set_name][value_type] + " mb</td></tr>";
        }
        html += '</table>';
        this.label.setValue(html);
      }, this);
    },

    // overridden
    _back : function()
    {
      qx.core.Init.getApplication().getRouting().back();
      new qx.bom.Selector.query('#hideButton')[0].style.visibility = "visible";
      mobileedd.page.Map.getInstance().map.updateSize();
    }
  }
});
