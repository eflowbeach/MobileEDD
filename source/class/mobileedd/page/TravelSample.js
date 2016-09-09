/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/*global qx*/

/**
 */
qx.Class.define("mobileedd.page.TravelSample",
{
  extend : qx.ui.mobile.page.NavigationPage,
  type : 'singleton',
  construct : function()
  {
    this.base(arguments);
    this.c = mobileedd.config.Config.getInstance();
    this.bus = qx.event.message.Bus.getInstance();
    this.setTitle("Travel Hazard Sample");
    this.setShowBackButton(true);
    this.setBackButtonText("Back");
  },
  members :
  {
    // overridden
    _initialize : function()
    {
      this.base(arguments);
      this.label = new qx.ui.mobile.basic.Label("");
      this.getContent().add(this.label);
      this.bus.subscribe("edd.travelsample", function(e)
      {
        var feature = e.getData();
        var name = '<b style="color:red;">';
        if (!feature.get("_DataQuality") && typeof (feature.get("Route Markers")) === "undefined") {
          name += me.caution;
        }
        var wwa = feature.get("Watches_Warnings_Advisories");
        if (typeof (wwa) !== "undefined" && wwa != null && wwa.indexOf("Flood") !== -1) {
          name += "<img style=\"padding-right: 3px;\" src=\"resource/mobileedd/images/lsr/flood.png\">";
        }
        if (typeof (feature.get("Weather")) !== "undefined") {
          feature.get("Weather").toString().split(',').forEach(function(obj)
          {
            var obj = obj.toLowerCase();
            if (obj.indexOf("freezing") !== -1 || obj.indexOf("frost") !== -1) {
              name += "<img style=\"padding-right: 3px;\" src=\"resource/mobileedd/images/lsr/ice.png\">";
            }
            if (obj.indexOf("snow") !== -1) {
              name += "<img style=\"padding-right: 3px;\" src=\"resource/mobileedd/images/lsr/snow.png\">";
            }
            if (obj.indexOf("hail") !== -1) {
              name += "<img style=\"padding-right: 3px;\" src=\"resource/mobileedd/images/lsr/hail.png\">";
            }
            if (obj.indexOf("sleet") !== -1) {
              name += "<img style=\"padding-right: 3px;\" src=\"resource/mobileedd/images/lsr/sleet.png\">";
            }
            if (obj.indexOf("thunder") !== -1) {
              name += "<img style=\"padding-right: 3px;\" src=\"resource/mobileedd/images/lsr/lightning.gif\">";
            }
            if (obj.indexOf("tornado") !== -1) {
              name += "<img style=\"padding-right: 3px;\" src=\"resource/mobileedd/images/lsr/tornado.png\">";
            }
            if (obj.indexOf("rain") !== -1) {
              name += "<img style=\"padding-right: 3px;\" src=\"resource/mobileedd/images/lsr/heavyrain.png\">";
            }
            if (obj.indexOf("drizzle") !== -1) {
              name += "<img style=\"padding-right: 3px;\" src=\"resource/mobileedd/images/lsr/drizzle.png\">";
            }
            if (obj.indexOf("fog") !== -1) {
              name += "<img style=\"padding-right: 3px;\" src=\"resource/mobileedd/images/lsr/fog.png\">";
            }
            if (obj.indexOf("smoke") !== -1) {
              name += "<img style=\"padding-right: 3px;\" src=\"resource/mobileedd/images/lsr/smoke.png\">";
            }
          });
        }
        if (typeof (feature.get("Max Wind Gust")) !== "undefined" && feature.get("Max Wind Gust") >= 30) {
          name += "<img style=\"padding-right: 3px;\" src=\"resource/mobileedd/images/lsr/wind.png\">";
        }
        if (typeof (feature.get("Temperature")) !== "undefined" && feature.get("Temperature") <= 15) {
          name += "<img style=\"padding-right: 3px;\" src=\"resource/mobileedd/images/lsr/cold.png\">";
        }
        if (typeof (wwa) !== "undefined" && wwa != "" && wwa != null && wwa != "<None>" && wwa.indexOf("Red Flag") !== -1) {
          name += "<img style=\"padding-right: 3px;\" src=\"resource/mobileedd/images/lsr/fire.png\">";
        }
        if (typeof (wwa) !== "undefined" && wwa != "" && wwa != null && wwa != "<None>")
        {
          name += "<br><img src=\"resource/mobileedd/images/hazards.png\"&nbsp;>";
          name += wwa;
        }
        name += "</b>";
        name += "<br><i>Worst case values along segment are shown below</i>";
        name += "<hr>";
        name += '<table>';
        for (var key in feature.getProperties())
        {
          if (key == "geometry") {
            continue;
          }
          if (feature.get(key) != "9999" && key.match(/^_/) == null) {
            if (typeof (feature.get("Route Markers")) === "undefined")
            {
              name += '<tr><td style="width: 148px;">';
              var units = (typeof feature.get("_" + key) != "undefined") ? feature.get("_" + key) : "";
              if (key.indexOf("Snow") !== -1) {
                name += "<img style=\"height: 13px;width: 13px;\" src=\"resource/mobileedd/images/snowflake_glow.png\">"
              } else if (key.indexOf("Ice") !== -1) {
                name += "<img style=\"height: 13px;width: 13px;\" src=\"resource/mobileedd/images/ice16.png\">"
              }

              name += this.popupInfoHandler(key, feature, units);
              name += '</td></tr>';
            } else
            {
              if (feature.get(key) == 0) {
                name += "<b>Start of trip</b><br>";
              } else if (feature.get(key) == 1) {
                name += "<b>Waypoint</b><br>";
              }

              if (feature.get(key) == 2) {
                name += "<b>End of trip</b><br>";
              }
            }
          }
        }
        name += '</table>';
        this.label.setValue(name);
      }, this);
    },
    popupInfoHandler : function(key, feature, units)
    {
      var me = this;
      var name = '';

      // Ignore hazards
      if (key == "Watches_Warnings_Advisories")  // && feature.get(key].length > 3)
      {
        //        name += "<font style=\"color:#ff0000;\">";

        //        name += "<b> " + key.replace(/_/g, ' ') + "</b>" + ': ' + feature.get(key) + units + '<br>';

        //        name += "</font>";
      } else if (key == "Wind Direction") {
        // Handle ranges
        if (feature.get(key).indexOf(',') !== -1)
        {
          var rangeArray = feature.get(key).split(',');
          name += "<b> " + key + "</b>" + ':</td><td> ';
          rangeArray.forEach(function(obj) {
            name += "<img src=\"resource/mobileedd/images/wind/" + obj + ".png\">";
          });
          name += '<br>';
        } else
        {
          name += "<b> " + key + "</b>" + ':</td><td>';
          name += "<img src=\"resource/mobileedd/images/wind/" + feature.get(key) + ".png\">";
          name += '<br>';
        }
      } else if (key == "Wind Speed" || key == "Max Wind Gust") {
        // Handle ranges
        if (feature.get(key).indexOf('-') !== -1)
        {
          var rangeArray = feature.get(key).split('-');
          name += "<b> " + key + "</b>" + ':</td><td> ' + feature.get(key) + units + ' (';
          name += Math.round(mph2kt(rangeArray[0])) + '-' + Math.round(mph2kt(rangeArray[1])) + ' KT)<br>';
        } else
        {
          name += "<b> " + key + "</b>" + ':</td><td> ' + feature.get(key) + units + ' (';
          name += Math.round(mph2kt(feature.get(key))) + ' KT)<br>';
        }
      } else {
        name += "<b> " + key.replace(/_/g, ' ') + "</b>" + ':</td><td> ' + feature.get(key) + units + '<br>';
      }


      return name;
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
