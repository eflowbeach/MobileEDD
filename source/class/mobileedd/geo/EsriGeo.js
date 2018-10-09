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
      me.reverseGeocodeReq.setUrl("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=" + lon + "," + lat + "&distance=2000&outSR=&f=pjson");
      me.reverseGeocodeReq.send();
    },

    /**
    Feed geo request an address get back a lat / lon
    */
    geoRequest : function(address)
    {
      var me = this;
      me.geoReq.setUrl("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find?text=" + address + "&f=pjson");
      me.geoReq.send();
    }
  }
});
