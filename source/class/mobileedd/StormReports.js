/**
*  Storm Reports - http://preview.weather.gov/edd/resource/mobileedd/getLSR.php?sts=201609131215&ets=201609131615
*
*/

/*global qx*/

/*global ol*/

/*global mobileedd*/
qx.Class.define("mobileedd.StormReports",
{
  extend : qx.core.Object,
  type : "singleton",
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
      me.srRequest.send();
    }, this);
  },
  members : {
    /**
    * Add a new radar Layer
    */
    addLayer : function()
    {
      var me = this;
      var layername = "Storm Reports";
      me.srLayer = new ol.layer.Vector(
      {
        name : layername,
        source : null,
        style : function(feature, resolution)
        {
          var color = 'white';  //feature.get('color');
          var radius = 14;
          var label = feature.get('magnitude');  //'test';
          var contrast = 'black';  //getContrast50(color);
          var textStroke = new ol.style.Stroke(
          {
            color : contrast,
            width : 5
          });
          var textFill = new ol.style.Fill( {
            color : color
          });
          var icon;
          switch (feature.get('typetext'))
          {
            case 'EXCESSIVE HEAT':
              icon = "resource/mobileedd/images/lsr/hot.png";
              break;
            case 'COASTAL FLOOD':
              icon = "resource/mobileedd/images/lsr/flood.png";
              break;
            case 'EXTREME COLD':
              icon = "resource/mobileedd/images/lsr/cold.png";
              break;
            case 'EXTR WIND CHILL':
              icon = "resource/mobileedd/images/lsr/cold.png";
              break;
            case 'FREEZE':
              icon = "resource/mobileedd/images/lsr/cold.png";
              break;
            case 'ICE STORM':
              icon = "resource/mobileedd/images/lsr/ice.png";
              break;
            case 'FREEZING RAIN':
              icon = "resource/mobileedd/images/lsr/ice.png";
              break;
            case 'FREEZING DRIZZLE':
              icon = "resource/mobileedd/images/lsr/ice.png";
              break;
            case 'DUST STORM':
              icon = "resource/mobileedd/images/lsr/dust.png";
              break;
            case 'SNOW':
              icon = "resource/mobileedd/images/lsr/snow.png";
              break;
            case 'BLOWING SNOW':
              icon = "resource/mobileedd/images/lsr/snow.png";
              break;
            case 'HEAVY SNOW':
              icon = "resource/mobileedd/images/lsr/snow.png";
              break;
            case 'HIGH SURF':
              icon = "resource/mobileedd/images/lsr/wave.png";
              break;
            case 'BLIZZARD':
              icon = "resource/mobileedd/images/lsr/blizzard.png";
              break;
            case 'HAIL':
              icon = "resource/mobileedd/images/lsr/hail.png";
              break;
            case 'SLEET':
              icon = "resource/mobileedd/images/lsr/sleet.png";
              break;
            case 'HEAVY SLEET':
              icon = "resource/mobileedd/images/lsr/sleet.png";
              break;
            case 'NON-TSTM WND DMG':
              icon = "resource/mobileedd/images/lsr/winddamage.png";
              break;
            case 'TSTM WND DMG':
              icon = "resource/mobileedd/images/lsr/winddamage.png";
              break;
            case 'HIGH SUST WINDS':
              icon = "resource/mobileedd/images/lsr/wind.png";
              break;
            case 'TSTM WND GST':
              icon = "resource/mobileedd/images/lsr/wind.png";
              break;
            case 'NON-TSTM WND GST':
              icon = "resource/mobileedd/images/lsr/wind.png";
              break;
            case 'MARINE TSTM WIND':
              icon = "resource/mobileedd/images/lsr/winddamage.png";
              break;
            case 'FLASH FLOOD':
              icon = "resource/mobileedd/images/lsr/flood.png";
              break;
            case 'FLOOD':
              icon = "resource/mobileedd/images/lsr/flood.png";
              break;
            case 'HEAVY RAIN':
              icon = "resource/mobileedd/images/lsr/heavyrain.png";
              break;
            case 'TORNADO':
              icon = "resource/mobileedd/images/lsr/tornado.png";
              break;
            case 'WATER SPOUT':
              icon = "resource/mobileedd/images/lsr/tornado.png";
              break;
            case 'FUNNEL CLOUD':
              icon = "resource/mobileedd/images/lsr/funnelcloud.png";
              break;
            case 'DENSE FOG':
              icon = "resource/mobileedd/images/lsr/fog.png";
              break;
            case 'HIGH ASTR TIDES':
              icon = "resource/mobileedd/images/lsr/flood.png";
              break;
            case 'WILDFIRE':
              icon = "resource/mobileedd/images/lsr/fire.png";
              break;
            case 'LIGHTNING':
              icon = "resource/mobileedd/images/lsr/lightning.gif";
              break;
            case 'DOWNBURST':
              icon = "resource/mobileedd/images/lsr/downburst.png";
              break;
            case 'AVALANCHE':
              icon = "resource/mobileedd/images/lsr/avalanche.gif";
              break;
            default:
              icon = "resource/mobileedd/images/lsr/other.png";
              break;
          }
          var anchor = [20, 20];
          return [new ol.style.Style(
          {
            image : new ol.style.Icon(
            {
              anchor : anchor,
              anchorXUnits : 'pixels',
              anchorYUnits : 'pixels',
              src : icon,
              scale : 0.75
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
              stroke : textStroke,
              offsetX : 30
            })
          })];
        }
      });
      me.map.addLayer(me.srLayer);

      // Silly way to get Vector Layer on top...
      me.mapObject.putVectorLayerOnTop(layername);

      // Hazard Request
      me.srRequest = new qx.io.request.Jsonp();
      var url = me.mapObject.getJsonpRoot() + "getLSR.php";
      me.srRequest.setRequestData(
      {
        "sts" : new moment().utc().subtract(3, 'hours').format('YYYYMMDDHHMM'),
        "ets" : new moment().utc().format('YYYYMMDDHHMM')
      });
      me.srRequest.setUrl(url);
      me.srRequest.setCallbackParam('callback');
      me.srRequest.addListener("statusError", function(e) {
        console.log('Failed storm report request.')
      })
      me.srRequest.addListener("success", function(e)
      {
        var data = e.getTarget().getResponse();
        var features = new ol.format.GeoJSON().readFeatures(data, {
          featureProjection : 'EPSG:3857'
        });
        var vectorSource = new ol.source.Vector((
        {
          projection : 'EPSG:3857',
          features : features
        }));
        if (me.srLayer.getSource() !== null) {
          me.srLayer.getSource().clear();
        }
        me.srLayer.setSource(vectorSource);
      }, this);
    }
  }
});
