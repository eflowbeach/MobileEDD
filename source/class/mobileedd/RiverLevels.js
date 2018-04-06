/**
*  Rivers - https://preview.weather.gov/edd/resource/edd/rfc/getAhpsData.php?datadefine=both%7Cmajor%7Cmoderate%7Cminor%7Caction&left=-95.6542258262616&right=-79.74602270126027&top=44.9330348029024&bottom=37.85676929732233
*
*/

/*global qx*/

/*global ol*/

/*global mobileedd*/
qx.Class.define("mobileedd.RiverLevels",
{
  extend : qx.core.Object,
  type : "singleton",
  properties : {
    lastCall : {
      init : new Date()
    }
  },
  construct : function()
  {
    var me = this;
    me.base(arguments);
    this.c = mobileedd.config.Config.getInstance();
    me.bus = qx.event.message.Bus.getInstance();
    me.mapObject = mobileedd.page.Map.getInstance();
    me.map = me.mapObject.getMap();

    // Timer
    me.timer = new qx.event.Timer(0);
    var refreshRate = 5 * 60;
    me.timer.addListener("interval", function(e)
    {
      me.timer.setInterval(1000 * refreshRate);
      me.riverRequest.send();
    }, this);
  },
  members : {
    /**
    * Add a new radar Layer
    */
    addLayer : function()
    {
      var me = this;
      me.vectorSource = new ol.source.Vector((
      {
        projection : 'EPSG:3857',
        loader : function(extent, resolution, projection)
        {
          var riverObject = mobileedd.RiverLevels.getInstance();
          var extent = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
          var datadefine = "both|major|moderate|minor|action";
          if (resolution < 1500) {
            datadefine = 'both|major|moderate|minor|action|normal|old|no_flooding'
          }
          riverObject.riverRequest.setRequestData(
          {
            "datadefine" : datadefine,
            "left" : extent[0],
            "right" : extent[2],
            "top" : extent[3],
            "bottom" : extent[1]
          });

          // BBOX strategy behaves strangely in OL3 - put a time constraint on the frequency of calls allowed
          if (new Date().getTime() - riverObject.getLastCall() > 5000)
          {
            riverObject.riverRequest.send();
            riverObject.setLastCall(new Date());
          }
        },
        strategy : ol.loadingstrategy.bbox
      }));
      me.riverLevelsLayer = new ol.layer.Vector(
      {
        name : "River Levels",
        source : me.vectorSource,
        style : function(feature, resolution)
        {
          var color = feature.get('color');
          var radius = 14;
          if (typeof feature.get('observed') !== "undefined" && feature.get('observed') != "") {
            radius = 6;
          }
          var label = '';
          var contrast = getContrast50(color);
          var textStroke = new ol.style.Stroke(
          {
            color : contrast,
            width : 5
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
            stroke : new ol.style.Stroke(
            {
              color : color,
              width : 5
            }),
            text : new ol.style.Text(
            {
              font : '20px Calibri,sans-serif',
              text : label,
              fill : textFill,
              stroke : textStroke
            })
          })];
        }
      });
      me.map.addLayer(me.riverLevelsLayer);

      // River Request
      me.riverRequest = new qx.io.request.Jsonp();
      var url = me.mapObject.getJsonpRoot() + "rfc/getAhpsData.php";

      //https://preview.weather.gov/edd/resource/edd/rfc/getAhpsData.php?datadefine=both%7Cmajor%7Cmoderate%7Cminor%7Caction&left=-95.6542258262616&right=-79.74602270126027&top=44.9330348029024&bottom=37.85676929732233
      me.riverRequest.setRequestData(
      {
        "datadefine" : "both|major|moderate|minor|action",
        "left" : -95.6542258262616,
        "right" : -79.74602270126027,
        "top" : 44.9330348029024,
        "bottom" : 37.85676929732233
      });
      me.riverRequest.setUrl(url);
      me.riverRequest.setCallbackParam('callback');
      me.riverRequest.addListener("statusError", function(e) {
        console.log('Failed river request.')
      })
      me.riverRequest.addListener("success", function(e)
      {
        var data = e.getTarget().getResponse();
        var features = new ol.format.GeoJSON().readFeatures(data, {
          featureProjection : 'EPSG:3857'
        });
        if (me.riverLevelsLayer.getSource() !== null) {
          me.riverLevelsLayer.getSource().clear();
        }
        me.vectorSource.addFeatures(features);
      }, this);
    }
  }
});
