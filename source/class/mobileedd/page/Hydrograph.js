/* ************************************************************************

   Copyright:

   License:

   Authors:
me.imageurl = "http://www.weather.gov/images/crh/impact/" + f.office + "_" + wtype + "_" + eventid + "_" + f.end + ".png";
************************************************************************ */

/*global qx*/

/**
 */
qx.Class.define("mobileedd.page.Hydrograph",
{
  extend : qx.ui.mobile.page.NavigationPage,
  type : 'singleton',
  construct : function()
  {
    this.base(arguments);
    this.bus = qx.event.message.Bus.getInstance();
    this.setTitle("Hydrograph");
    this.setShowBackButton(true);
    this.setBackButtonText("Back");
  },
  members :
  {
    // overridden
    _initialize : function()
    {
      this.base(arguments);
      this.label = new qx.ui.mobile.basic.Label("Hydrograph");
      this.getContent().add(this.label);
      this.bus.subscribe("edd.hydrograph", function(e)
      {
        var feature = e.getData();
        function capitaliseFirstLetter(string) {
          return string.charAt(0).toUpperCase() + string.slice(1);
        }
        var html = '';

        /**
        Stages
        */
        if (feature.get('observed').length > 3) {
          if (feature.get('stage') == "major" || feature.get('stage') == "moderate") {
            html += '<br><div style="text-align:center; width:100%;font-size:large;font-weight:bold; color:#FFFFFF; background-color: ' + feature.get('color') + '">Observed Stage: ' + feature.get('observed') + ' (' + capitaliseFirstLetter(feature.get('stage')) + ")</div>";
          } else {
            html += '<br><div style="text-align:center; width:100%;font-size:large;font-weight:bold; background-color: ' + feature.get('color') + '">Observed Stage: ' + feature.get('observed') + ' (' + capitaliseFirstLetter(feature.get('stage')) + ")</div>";
          }
        }
        if (feature.get('forecast').length > 3) {
          if (feature.get('stage') == "major" || feature.get('stage') == "moderate") {
            html += '<br><div style="text-align:center; width:100%;font-size:large;font-weight:bold; color:#FFFFFF; background-color: ' + feature.get('color') + '">Forecast Stage: ' + feature.get('forecast') + ' (' + capitaliseFirstLetter(feature.get('stage')) + ")</div>";
          } else {
            html += '<br><div style="text-align:center; width:100%;font-size:large;font-weight:bold; background-color: ' + feature.get('color') + '">Forecast Stage: ' + feature.get('forecast') + ' (' + capitaliseFirstLetter(feature.get('stage')) + ")</div>";
          }
        }

        /**
        River name/location
        */
        html += '<span style="font-size: 14px;font-weight:bold;">' + feature.get('waterbody') + ' at ' + feature.get('location') + '</span><br>';

        /**
        ID
        */
        html += '<span style="font-size: small;">' + feature.get('id') + '</span>';

        /**
        Date / ob time
        */
        if (typeof (feature.get('obstime')) !== "undefined" && feature.get('obstime') != "")
        {
          // Nasty conversion from UTC string to local time with timezone - moment doesn't support timezones.
          html += '<br><span style="font-size: 12px;"><b>Ob Time (Local):</b> ' + moment.utc(feature.get('obstime'), 'hh:mm Do MMMM, YYYY').local().format("HH:mm a ddd, MMM Do YYYY") + '</span>';
          html += '<br><span style="font-size: 12px;"><b>Ob Time (UTC):</b> ' + moment.utc(feature.get('obstime'), 'hh:mm Do MMMM, YYYY').format("HH:mm[Z] ddd, MMM Do YYYY") + '</span>';
        }

        /**
        Hydrograph
        */
        html += '<img width="100%;" src="http://water.weather.gov/resources/hydrographs/' + feature.get('id').toLowerCase() + '_hg.png"><br>';

        /**
        Table
        */
        html += '<hr><b><table width="100%" cellspacing="0" cellpadding="0" border="0"> ';
        html += '<tr style="color:#CC33FF;"><td nowrap="" scope="col">&nbsp;&nbsp;&nbsp;Major Flood Stage:</td><td scope="col">' + feature.get('major') + '</td></tr> ';
        html += '<tr style="color:#FF0000;"><td nowrap="" scope="col">&nbsp;&nbsp;&nbsp;Moderate Flood Stage:</td><td scope="col">' + feature.get('moderate') + '</td></tr>';
        html += '<tr style="color:#FF9900;"><td nowrap="" scope="col">&nbsp;&nbsp;&nbsp;Flood Stage:</td><td scope="col">' + feature.get('flood') + '</td></tr> ';
        html += '<tr style="color:#CACA2F;" ><td nowrap="" scope="col">&nbsp;&nbsp;&nbsp;Action Stage:</td><td scope="col">' + feature.get('action') + '</td></tr> ';
        html += '</b></table>';
        this.label.setValue(html);  //<img style="width: 100%;" src="http://water.weather.gov/resources/hydrographs/' + feature.getValue('id').toLowerCase() + '_hg.png">');
      }, this);
    },

    // overridden
    _back : function()
    {
      qx.core.Init.getApplication().getRouting().back();
      mobileedd.page.Map.getInstance().map.updateSize();
    }
  }
});
