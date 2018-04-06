/* ************************************************************************

   Copyright: 2016

   License: MIT

   Authors: Jonathan Wolfe

************************************************************************ */

/*global qx*/

/*global ol*/

/*global mobileedd*/

/**
 */
qx.Class.define("mobileedd.page.Forecast",
{
  extend : qx.ui.mobile.page.NavigationPage,
  type : 'singleton',
  properties : {
    plotLength :
    {
      init : 168,
      apply : "redrawPlots"
    }
  },
  construct : function()
  {
    this.base(arguments);
    this.c = mobileedd.config.Config.getInstance();
    this.bus = qx.event.message.Bus.getInstance();
    this.setTitle("Forecast");
    this.setShowBackButton(true);
    this.setBackButtonText("Back");
  },
  members :
  {
    redrawPlots : function()
    {
      var me = this;
      var newEndTime = new moment().add(me.getPlotLength(), 'hours');
      var plots = [me.tplot, me.pplot, me.qplot, me.wplot, me.waveplot, me.rhplot];
      plots.forEach(function(obj)
      {
        obj.getOptions().xaxes[0].max = newEndTime;
        obj.setupGrid();
        obj.draw();
      })
    },

    // overridden
    _initialize : function()
    {
      var me = this;
      this.base(arguments);

      // Busy indicator
      var busyIndicator = new qx.ui.mobile.dialog.BusyIndicator("Please wait...");
      this.busyPopup = new qx.ui.mobile.dialog.Popup(busyIndicator);

      /**
      * Plot Period
      * */
      var container = new qx.ui.mobile.container.Composite();
      container.setLayout(new qx.ui.mobile.layout.HBox().set( {
        alignX : "center"
      }));
      var label = new qx.ui.mobile.basic.Label("Plot Period (Days)&nbsp;");
      label.addCssClass("menuLabels");
      container.add(label, {
        flex : 0.1
      });

      // ANCHORED MENU POPUP
      var showAnchorMenuButton = new qx.ui.mobile.form.Button("7");
      showAnchorMenuButton.addListener("tap", function(e) {
        this.__anchorMenu.show();
      }, this);
      var anchorMenuModel = new qx.data.Array(["1", "2", "3", "4", "5", "6", "7", "8"]);
      this.__anchorMenu = new qx.ui.mobile.dialog.Menu(anchorMenuModel, showAnchorMenuButton);
      this.__anchorMenu.setTitle("Days");
      this.__anchorMenu.addListener("changeSelection", function(e)
      {
        me.setPlotLength(e.getData().item * 24);
        showAnchorMenuButton.setValue(e.getData().item);
      }, this);
      container.add(showAnchorMenuButton);

      // setTimeout(function() {

      // },2000)
      this.getContent().add(container);
      this.embedHtml = new qx.ui.mobile.embed.Html();
      this.getContent().add(this.embedHtml);

      // NDFD request
      me.ndfdReq = new qx.io.request.Jsonp();
      me.ndfdReq.setCallbackParam("callback");
      me.ndfdReq.setCache(false);
      me.ndfdReq.addListener("success", function(e)
      {
        var response = e.getTarget().getResponse();

        // console.log(typeof ($) == "undefined", typeof ($.plot) == "undefined");
        if (typeof (jQuery) === "undefined" || typeof (jQuery.plot) === "undefined")
        {
          var req = new qx.bom.request.Script();
          req.onload = function()
          {
            console.log('loading Flot');
            me.plotData(response);
          };
          req.open("GET", "resource/mobileedd/libs/flot/flot-combo.js");
          req.send();
        } else
        {
          me.plotData(response);
        }
      })

      // Text request
      me.fxReq = new qx.io.request.Jsonp();
      me.fxReq.setCallbackParam("callback");
      me.fxReq.setCache(false);
      me.fxReq.addListener("success", function(e)
      {
        var response = e.getTarget().getResponse();

        //var html = '';
        var html = '<div id="ftgraph" class="demo-placeholder"></div>';
        html += '<div id="fwindgraph" class="demo-placeholder"></div>';
        html += '<div id="fprecipgraph" class="demo-placeholder"></div>';
        html += '<div id="fqpf" class="demo-placeholder"></div>';
        html += '<div id="fwavegraph" class="demo-placeholder"></div>';
        html += '<div id="rhgraph" class="demo-placeholder"></div>';
        html += '<hr>';
        var forecastFor = "<b>Forecast for:</b> " + response.location.areaDescription + "<font style=\"padding-left:10px;\">(Elevation: </font>" + response.location.elevation + " ft.)<br>";

        //me.resultsWindow.setCaption("NWS Forecast for " + response.location.areaDescription + " (Elevation: " + response.location.elevation + " ft.) " + "Lat: " + response.location.latitude + " Lon: " + response.location.longitude);
        var dformat = "h:mm a ddd, MMM, YYYY";
        try {
          var createdAt = "<b>Created at:</b> " + new moment(response.creationDate).format(dformat) + "<br>";
        }catch (e) {
          var createdAt = "<b>Created at:</b> " + new moment(response.creationDate.split('--')[0]).format(dformat) + "<br>";
        }
        var issuedBy = "<b>Issued by:</b> " + '<a target="_blank"  href="' + response.credit + '">' + response.productionCenter + '</a><br><br>';
        html += forecastFor;
        html += createdAt;
        html += issuedBy;
        me.hazardObjectForFlot = {

        };
        response.data.hazardUrl.forEach(function(obj, index)
        {
          // Remove extra junk (For Hazardous Seas, for Winds, For Rough Bar) which isn't contained in the warning link...
          var url = obj.replace(/\+For\+Hazardous\+Seas/g, "").replace(/\+For\+Winds/g, "").replace(/\+For\+Rough\+Bar/g, "").replace(/\&amp\;/g, "&");
          html += '<a target="_blank" href="' + url + '">' + response.data.hazard[index] + "</a><br>";

          //me.hazardObjectForFlot[response.data.hazard[index]] = url;
        })
        html += '<table id="fxtext" style="border-collapse:collapse; margin-top:14px;">';
        response.time.startPeriodName.forEach(function(obj, index) {
          if (obj.toLowerCase().indexOf("night") !== -1) {  //index % 2 ==0){
            html += "<tr style=\"border: 1px solid rgb(180, 180, 180);\"><td bgcolor=\"#ffffff\" style=\"padding-left: 6px; padding-right:10px;\"><b>" + obj + "</b></td><td bgcolor=\"#ffffff\">" + response.data.text[index] + "</td></tr>";
          } else {
            html += "<tr style=\"border: 1px solid rgb(180, 180, 180);\"><td bgcolor=\"#B0E5F0\" style=\"padding-left: 6px;padding-right:10px;\"><b>" + obj + "</b></td><td bgcolor=\"#D7F1FF\">" + response.data.text[index] + "</td></tr>";
          }
        })
        html += '</table>';
        me.embedHtml.setHtml(html);
      });

      // Request for forecast
      this.bus.subscribe("edd.forecast", function(e)
      {
        this.busyPopup.show();
        var ll = e.getData();

        // NDFD forecast
        var mercatorLL = ol.proj.transform(ll, 'EPSG:4326', 'EPSG:3857');
        var region = mobileedd.page.Map.getInstance().getNdfdRegion(mercatorLL);
        var url = "https://preview.weather.gov/edd/resource/edd/ndfd/getNdfdMeteogramData.php?lat=" + mercatorLL[1] + '&lon=' + mercatorLL[0] + '&region=' + region;
        me.ndfdReq.setUrl(url);
        me.ndfdReq.send();

        /**
         * Text Forecast
         * */
        var textUrl = "https://forecast.weather.gov/MapClick.php?lat=" + ll[1] + "&lon=" + ll[0] + "&FcstType=json";
        me.fxReq.setUrl(textUrl);
        me.fxReq.send();
      }, this);
    },

    /**
     * Plot the data
     * */
    plotData : function(response)
    {
      var me = this;
      console.log(response);
      if (response == null)
      {
        me.embedHtml.setHtml('Error');
        this.busyPopup.hide();
        return;
      }

      // Check to see if we need to include a freezing line
      var cold = false;
      response.t.forEach(function(obj) {
        if (obj[1] <= 40) {
          cold = true;
        }
      })
      var axisFormat = "ha ddd<br>(M/D)";
      var temperatureData = [
      {
        label : "Temperature",
        data : response.t,
        color : 'red',
        lines :
        {
          show : true,
          lineWidth : 4
        }
      },
      {
        label : "Dew Point",
        data : response.td,
        color : 'green',
        lines :
        {
          show : true,
          lineWidth : 4
        }
      }];
      if (cold) {
        temperatureData.push(
        {
          label : "32 &deg;F / Freezing",
          data : [[response.t[0][0], 32], [response.t[response.t.length - 1][0], 32]],
          color : "#5890C4",
          dashes : {
            show : true
          },
          lines :
          {
            show : false,
            lineWidth : 4
          },
          units : "&deg;F",
          grid : {
            backgroundColor : {
              colors : ["#F8E6BC", "#FFFFFF"]
            }
          }
        });
      }
      me.tplot = $.plot("#ftgraph", temperatureData,
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
          position : 'ne'
        },
        xaxis :
        {
          mode : "time",

          // min: response.t[0][0],
          max : new moment().add(me.getPlotLength(), 'hours'),  //response.t[response.t.length-1][0],
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
          axisLabel : 'Temperature, \xB0F',
          tickFormatter : function(val, axis) {
            return val.toFixed(0);
          }
        }]
      });

      // Wind
      me.wplot = $.plot("#fwindgraph", [
      {
        label : "Wind Speed",
        data : response.windspd,
        color : 'purple',
        lines :
        {
          show : true,
          lineWidth : 4
        }
      },
      {
        label : "Wind Gust",
        data : response.windgust,
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
          position : 'ne'
        },
        xaxis :
        {
          mode : "time",
          max : new moment().add(me.getPlotLength(), 'hours'),
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
          axisLabel : 'Wind, mph',
          tickFormatter : function(val, axis) {
            return val.toFixed(0);
          }
        }]
      });

      // QPF
      me.qplot = $.plot("#fqpf", [
      {
        label : "Liquid Precipitation",
        data : response.qpf,
        color : '#057100',
        bars :
        {
          show : true,
          barWidth : 3600 * 1000 * 6  // * 0.25 * 0.05
        }
      },
      {
        label : "Snow",
        data : response.snowamt,
        color : 'blue',
        bars :
        {
          show : true,
          barWidth : 3600 * 1000 * 6  // * 0.25 * 0.05
        }
      },
      {
        label : "Ice",
        data : response.iceaccum,
        color : '#E117E3',
        bars :
        {
          show : true,
          barWidth : 3600 * 1000 * 6  // * 0.25 * 0.05
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
          position : 'ne'
        },
        xaxis :
        {
          mode : "time",
          min : response.t[0][0],

          //max : response.t[response.t.length - 1][0],
          max : new moment().add(me.getPlotLength(), 'hours'),
          axisLabel : 'Local Time',
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
          position : 'left',
          axisLabel : 'Precipitation, in.',
          tickFormatter : function(val, axis) {
            return val.toFixed(2);
          }
        }]
      });

      // Precip
      me.pplot = $.plot("#fprecipgraph", [
      {
        label : "Chance of Precipitation, %",
        data : response.pop12,
        color : '#057100',
        lines :
        {
          show : true,
          fill : true,
          lineWidth : 4

          //barWidth : 3600 * 1000 * 12// * 0.25 * 0.05
        }
      }],
      {
        units : '%',
        grid : {
          backgroundColor : {
            colors : ["#F8E6BC", "#FFFFFF"]
          }
        },
        legend :
        {
          show : true,
          position : 'ne'
        },
        xaxis :
        {
          mode : "time",
          max : new moment().add(me.getPlotLength(), 'hours'),
          tickFormatter : function(val, axis) {
            return new moment(val).format(axisFormat);
          }
        },
        axisLabels : {
          show : true
        },
        yaxes : [
        {
          max : 100,
          min : 0,
          position : 'left',
          axisLabel : 'Chance of Precipitation, %',
          tickFormatter : function(val, axis) {
            return val.toFixed(0);
          }
        }]
      });

      // RH
      me.rhplot = $.plot("#rhgraph", [
      {
        label : "Relative Humidity",
        data : response.rh,
        color : 'brown',
        lines :
        {
          show : true,
          lineWidth : 4
        }
      },
      {
        label : "Sky",
        data : response.windgust,
        color : 'gray',
        lines :
        {
          show : true,
          lineWidth : 4
        }
      }],
      {
        units : '%',
        grid : {
          backgroundColor : {
            colors : ["#F8E6BC", "#FFFFFF"]
          }
        },
        legend :
        {
          show : true,
          position : 'ne'
        },
        xaxis :
        {
          mode : "time",
          max : new moment().add(me.getPlotLength(), 'hours'),
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
          max : 100,
          position : 'left',
          axisLabel : 'RH and Sky, %',
          tickFormatter : function(val, axis) {
            return val.toFixed(0);
          }
        }]
      });

      // Marine
      var marine = false;
      response.waveheight.forEach(function(obj) {
        if (obj[1] != null) {
          marine = true;
        }
      })
      if (marine) {
        $('#fwavegraph').show();
      } else {
        $('#fwavegraph').hide();
      }
      me.waveplot = $.plot("#fwavegraph", [
      {
        label : "Wave Height",
        data : response.waveheight,
        color : 'blue',
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
          position : 'ne'
        },
        xaxis :
        {
          mode : "time",
          max : new moment().add(me.getPlotLength(), 'hours'),
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
      this.busyPopup.hide();
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
