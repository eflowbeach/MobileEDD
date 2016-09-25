/* ************************************************************************

   Copyright: 2016

   License: MIT

   Authors: Jonathan Wolfe

************************************************************************ */

/*global qx*/

/**
 */
qx.Class.define("mobileedd.page.NationalWaterModel",
{
  extend : qx.ui.mobile.page.NavigationPage,
  properties : {
    stationLabel : {
      init : ''
    }
  },
  type : 'singleton',
  construct : function()
  {
    this.base(arguments);
    this.c = mobileedd.config.Config.getInstance();
    this.bus = qx.event.message.Bus.getInstance();
    this.setTitle("Streamflow");
    this.setShowBackButton(true);
    this.setBackButtonText("Back");
  },
  members :
  {
    // overridden
    _initialize : function()
    {
      this.base(arguments);

      // Stream name
      this.labelStream = new qx.ui.mobile.basic.Label("");
      this.labelStream.addCssClass("graphTitle");
      qx.bom.element.Style.setCss(this.labelStream.getContainerElement(), 'color:#0309ff;');
      this.getContent().add(this.labelStream);

      // Short
      this.labelShort = new qx.ui.mobile.basic.Label("Short Range");
      this.labelShort.addCssClass("graphTitle");
      this.getContent().add(this.labelShort);
      this.embedHtmlShort = new qx.ui.mobile.embed.Html();
      var html = '<div id="sfsgraph" class="demo-placeholder"></div>';
      this.embedHtmlShort.setHtml(html);
      this.getContent().add(this.embedHtmlShort);

      // Medium
      this.labelMedium = new qx.ui.mobile.basic.Label("Medium Range");
      this.labelMedium.addCssClass("graphTitle");
      this.getContent().add(this.labelMedium);
      this.embedHtmlMedium = new qx.ui.mobile.embed.Html();
      var html = '<div id="sfmgraph" class="demo-placeholder"></div>';
      this.embedHtmlMedium.setHtml(html);
      this.getContent().add(this.embedHtmlMedium);

      // Long
      this.labelLong = new qx.ui.mobile.basic.Label("Long Range");
      this.labelLong.addCssClass("graphTitle");
      this.getContent().add(this.labelLong);
      this.embedHtmlLong = new qx.ui.mobile.embed.Html();
      var html = '<div id="sflgraph" class="demo-placeholder"></div>';
      this.embedHtmlLong.setHtml(html);
      this.getContent().add(this.embedHtmlLong);
      this.bus.subscribe("edd.streamflow", function(e)
      {
        var stid = e.getData()[0];
        this.setStationLabel(e.getData()[1].replace('NWM - ', 'National Water Model<br>'));
        var req = new qx.io.request.Xhr("resource/mobileedd/data/getStreamflow.php?id=" + stid + '&type=short_range');
        req.setParser("json");
        req.addListener("success", function(e)
        {
          var response = e.getTarget().getResponse();
          this.labelStream.setValue(this.getStationLabel());

          // build plot object
          var data = [];
          response[0].data.forEach(function(obj) {
            data.push([new moment(obj["forecast-time"]).unix() * 1000, obj.value]);
          })
          var axisFormat = "ha ddd<br>(M/D)";

          // Streamflow
          $.plot("#sfsgraph", [
          {
            label : "Streamflow",
            data : data,
            color : 'purple',
            lines : {
              show : true
            },
            points : {
              show : true
            }
          }],
          {
            grid : {
              backgroundColor : {
                colors : ["#F8E6BC", "#FFFFFF"]
              }
            },
            units : 'mph',
            legend :
            {
              show : true,
              position : 'ne'
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
              axisLabel : 'Streamflow, cfs',
              tickFormatter : function(val, axis) {
                return val.toFixed(0);
              }
            }]
          });
        }, this);

        // Send request
        req.send();

        /**
         * Medium
         * */

        // http://mapservice.nohrsc.noaa.gov:8080/0.2/forecasts/short_range/streamflow?station_id=19292810
        var req = new qx.io.request.Xhr("resource/mobileedd/data/getStreamflow.php?id=" + stid + '&type=medium_range');
        req.setParser("json");
        req.addListener("success", function(e)
        {
          var response = e.getTarget().getResponse();

          // build plot object
          var data = [];
          response[0].data.forEach(function(obj) {
            data.push([new moment(obj["forecast-time"]).unix() * 1000, obj.value]);
          })
          var axisFormat = "ha ddd<br>(M/D)";

          // Streamflow
          $.plot("#sfmgraph", [
          {
            label : "Streamflow",
            data : data,
            color : 'purple',
            lines : {
              show : true
            }
          }],
          {
            grid : {
              backgroundColor : {
                colors : ["#F8E6BC", "#FFFFFF"]
              }
            },
            units : 'mph',
            legend :
            {
              show : true,
              position : 'ne'
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
              axisLabel : 'Streamflow, cfs',
              tickFormatter : function(val, axis) {
                return val.toFixed(0);
              }
            }]
          });
        }, this);

        // Send request
        req.send();

        /**
         * Long Range
         * */

        // http://mapservice.nohrsc.noaa.gov:8080/0.2/forecasts/short_range/streamflow?station_id=19292810
        var req = new qx.io.request.Xhr("resource/mobileedd/data/getStreamflow.php?id=" + stid + '&type=long_range');
        req.setParser("json");
        req.addListener("success", function(e)
        {
          var response = e.getTarget().getResponse();

          // build plot object
          var data = [];
          response[0].data.forEach(function(obj) {
            data.push([new moment(obj["forecast-time"]).unix() * 1000, obj.value]);
          })
          var axisFormat = "ha ddd<br>(M/D)";

          // Streamflow
          $.plot("#sflgraph", [
          {
            label : "Streamflow",
            data : data,
            color : 'purple',
            lines : {
              show : true
            }
          }],
          {
            grid : {
              backgroundColor : {
                colors : ["#F8E6BC", "#FFFFFF"]
              }
            },
            units : 'mph',
            legend :
            {
              show : true,
              position : 'ne'
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
              axisLabel : 'Streamflow, cfs',
              tickFormatter : function(val, axis) {
                return val.toFixed(0);
              }
            }]
          });
        }, this);

        // Send request
        req.send();
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
