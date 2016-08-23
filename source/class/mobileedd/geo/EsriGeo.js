/**
A class that extends the default SelectBox with the pre Qx 4.0 ability to use the mousewheel to scroll the selections.
*/
qx.Class.define("mobileedd.geo.EsriGeo",
{
  extend : qx.core.Object,
  properties : {

  },
  construct : function()
  {
    var me = this;
    me.base(arguments);
    this.c = mobileedd.config.Config.getInstance();

    // Geocode
    me.geoReq = new qx.io.request.Jsonp();

    // Reverse Geocode
    me.reverseGeocodeReq = new qx.io.request.Jsonp();
  },
  members :
  {
    /**
    Feed geo request a lat / lon get back an address
    */
    reverseGeoRequest : function(lat, lon)
    {
      var me = this;
      me.reverseGeocodeReq.setUrl(me.c.getSecure() + "//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=" + lon + "," + lat + "&distance=2000&outSR=&f=pjson");
      me.reverseGeocodeReq.send();
    },

    /**
    Feed geo request an address get back a lat / lon
    */
    geoRequest : function(address)
    {
      var me = this;
      me.geoReq.setUrl(me.c.getSecure() + "//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find?text=" + address + "&f=pjson");
      me.geoReq.send();
    },

    /**
    Map an address
    */
    showAddress : function(address)
    {
      var me = this;
      me.mapObject = edd.view.Map.getInstance();
      me.map = me.mapObject.getMap();
      me.markersLayer = me.map.getLayersByName("Search Marker")[0];
      me.geoReq.addListenerOnce("success", function(e)
      {
        var response = e.getTarget().getResponse();
        if (response.locations.length == 0) {
          qxnws.ui.notification.Manager.getInstance().postError("Could not find feature.");
        } else {
          var respLon = response.locations[0].feature.geometry.x;
          var respLat = response.locations[0].feature.geometry.y;
          me.markersLayer.clearMarkers();
          var lonlat = new OpenLayers.LonLat(respLon, respLat).transform(geographicProj, mercatorProj);
          me.map.setCenter(lonlat);  //, 7);
          var feature = new OpenLayers.Feature(me.markersLayer, lonlat);
          var size = new OpenLayers.Size(24, 24);
          var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
          feature.data.icon = new OpenLayers.Icon("resource/edd/images/placemarkers/red-pin-jon.png", size, offset);
          var marker = feature.createMarker();
          me.markersLayer.addMarker(marker);
        }
      });
      me.geoRequest(address);
    }
  }
});
