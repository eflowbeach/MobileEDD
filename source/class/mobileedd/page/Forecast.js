/* ************************************************************************

   Copyright:

   License:

   Authors:
me.imageurl = me.c.getSecure() + "//www.weather.gov/images/crh/impact/" + f.office + "_" + wtype + "_" + eventid + "_" + f.end + ".png";
************************************************************************ */

/*global qx*/

/**
 */
qx.Class.define("mobileedd.page.Forecast",
{
  extend : qx.ui.mobile.page.NavigationPage,
  type : 'singleton',
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
    // overridden
    _initialize : function()
    {
      var me = this;
      this.base(arguments);
      this.label = new qx.ui.mobile.basic.Label("Forecast");
      this.getContent().add(this.label);
      this.bus.subscribe("edd.forecast", function(e)
      {
        var ll = e.getData();

        //var url = me.c.getSecure() + "://forecast.weather.gov/MapClick.php?lat=" + ll[1] + "&lon=" + ll[1] + "&FcstType=json";
        var url = "http://forecast.weather.gov/MapClick.php?lat=" + ll[1] + "&lon=" + ll[0] + "&FcstType=json";
        var fxReq = new qx.io.request.Jsonp(url);
        fxReq.setCallbackParam("callback");
        fxReq.setCache(false);
        fxReq.addListener("success", function(e)
        {
          var response = e.getTarget().getResponse();
          var html = '';
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
            html += "<a href=\"javascript:;\" class=\"oldtime\" onclick='var win = new qx.ui.window.Window(\"" + response.data.hazard[index] + "\"); win.open();win.setMinWidth(800);win.setMinHeight(700);win.setLayout(new qx.ui.layout.VBox());var frame_point = new qx.ui.embed.ThemedIframe();frame_point.setSource(\"" + url + "\");win.setLayout(new qx.ui.layout.VBox());win.add(frame_point,{flex:1});'>" + response.data.hazard[index] + "</a><br>";
            me.hazardObjectForFlot[response.data.hazard[index]] = url;
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
          me.label.setValue(html);
        });
        fxReq.send();
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
