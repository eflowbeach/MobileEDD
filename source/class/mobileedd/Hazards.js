/**
*  Hazards
*/

/*global qx*/

/*global ol*/

/*global mobileedd*/
qx.Class.define("mobileedd.Hazards",
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
    me.hazardRequestTimer = new qx.event.Timer(0);
    me.hazardRequestTimer.addListener("interval", function(e)
    {
      me.hazardRequestTimer.setInterval(1000 * 20);
      if (me.mapObject.getReady()) {
        me.hazardRequest.send();
      }
    });
    this.sigMap =
    {
      "Warning" : "W",
      "Watch" : "A",
      "Advisory" : "Y",
      "Statement" : "S"
    }
    this.hazardMap =
    {
      "Air Stagnation" : "AS",
      "Areal Flood" : "FA",
      "Ashfall" : "AF",
      "Avalanche" : "AV",
      "Beach Hazards" : "BH",
      "Blizzard" : "BZ",
      "Blowing Dust" : "DU",
      "Blowing Snow" : "BS",
      "Brisk Wind" : "BW",
      "Coastal Flood" : "CF",
      "Dense Fog" : "FG",
      "Dense Smoke" : "SM",
      "Dust Storm" : "DS",
      "Excessive Heat" : "EH",
      "Extreme Cold" : "EC",
      "Extreme Wind" : "EW",
      "Fire Weather" : "FW",
      "Flash Flood" : "FF",
      "Flood" : "FL",
      "Freeze" : "FZ",
      "Freezing Fog" : "ZF",
      "Freezing Rain" : "ZR",
      "Freezing Spray" : "UP",
      "Frost" : "FR",
      "Gale" : "GL",
      "Hard Freeze" : "HZ",
      "Hazardous Seas" : "SE",
      "Heat" : "HT",
      "Heavy Sleet" : "HP",
      "Heavy Snow" : "HS",
      "High Surf" : "SU",
      "High Wind" : "HW",
      "Hurricane" : "HU",
      "Hurricane Force Wind" : "HF",
      "Hydrologic" : "HY",
      "Ice Accretion" : "UP",
      "Ice Storm" : "IS",
      "Inland Hurricane" : "HI",
      "Inland Hurricane Wind" : "HI",
      "Inland Tropical Storm" : "TI",
      "Lake Effect Snow" : "LE",
      "Lake Effect Snow and " : "LB",
      "Lake Wind" : "LW",
      "Lakeshore Flood" : "LS",
      "Low Water" : "LO",
      "Marine" : "MA",
      "Marine Dense Fog" : "MF",
      "Radiological Hazard" : "RH",
      "Red Flag" : "FW",
      "Rip Current" : "RP",
      "Severe Thunderstorm" : "SV",
      "Sleet" : "IP",
      "Small Craft" : "SC",
      "Small Craft for Hazardous Seas" : "SW",
      "Small Craft for Rough Bar" : "RB",
      "Small Craft for Winds" : "SI",
      "Snow" : "SN",
      "Snow and Blowing Snow" : "SB",
      "Storm" : "SR",
      "Tornado" : "TO",
      "Tropical Storm" : "TR",
      "Tsunami" : "TS",
      "Typhoon" : "TY",
      "Volcanic Ashfall" : "AF",
      "Volcano" : "VO",
      "Wind" : "WI",
      "Wind Chill" : "WC",
      "Winter Storm" : "WS",
      "Winter Weather" : "WW"
    };
  },
  members :
  {
    /**
      Add a hazards layer ...
      */
    addHazardsLayer : function()
    {
      var me = this;
      me.hazardVectorSource = new ol.source.Vector(( {
        projection : 'EPSG:3857'
      }));
      me.hazardLayer = new ol.layer.Vector(
      {
        name : "Hazards",
        source : me.hazardVectorSource,
        style : function(feature, resolution)
        {
          var color;
          var fg = 'white';
          var label = '';

          // Better colors for short-fused warnings
          if (me.hazardMap[feature.get('phenomenon')] == "SV" && feature.get('significance') == "Warning")
          {
            color = '#FFF000';
            fg = 'black';
          } else if (me.hazardMap[feature.get('phenomenon')] == "TO" && feature.get('significance') == "Warning") {
            color = '#FF0000';
          } else if (me.hazardMap[feature.get('phenomenon')] == "FF" && feature.get('significance') == "Warning") {
            color = '#0AF330';
          } else if (me.hazardMap[feature.get('phenomenon')] == "MA" && feature.get('significance') == "Warning") {
            color = '#29E8EF';
          } else {
            color = feature.get('color');
          }



          // WWA
          if (me.mapObject.getWwaList() != null) {
            if (!new qx.data.Array(me.mapObject.getWwaList()).contains(feature.get('significance'))) {
              return null;
            }
          }

          // Type
          if (me.mapObject.getSingularHazardArray() != null) {
            if (!me.mapObject.getSingularHazardArray().contains(feature.get('phenomenon'))) {
              return null;
            }
          }

          // Show the hazard text
          if (me.mapObject.showHazardLabel.getValue())
          {
            // if (me.mapObject.longfuseButton.getValue()) {
            label = feature.get('phenomenon') + '\n' + feature.get('significance');

            // } else {

            //   var key = Object.keys(me.hazardMap).filter(function(key) {

            //     return me.hazardMap[key] === feature.get('phenomenon')

            //   })[0];

            //   label = key + '\n' + 'Warning';

            // }
          }
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
      me.map.addLayer(me.hazardLayer);

      // Hazard Request
      me.hazardRequest = new qx.io.request.Jsonp();
      var url = me.mapObject.getJsonpRoot() + "hazards/getShortFusedHazards.php";

      // if (me.mapObject.longfuseButton.getValue()) {
      url += "?all=true";

      // }
      me.hazardRequest.setUrl(url);
      me.hazardRequest.setCallbackParam('callback');
      me.hazardRequest.addListener("success", function(e)
      {
        var data = e.getTarget().getResponse();
        
        // Trick OL3 since Geojson has CRS defined
        data.crs.type = 'name';
        data.crs.properties.name = 'EPSG:4326';
        
        var features = new ol.format.GeoJSON().readFeatures(data, {
          featureProjection : 'EPSG:3857'
        }
        );
        me.hazardVectorSource.clear();
        me.hazardVectorSource.addFeatures(features);
        me.checkWwaAtLocation();
      }, this);

      // Cycle header every 3 seconds if there are hazards
      me.cycleWwaTimer = new qx.event.Timer(3000);
      me.cycleCount = 0;
      me.cycleWwaTimer.addListener("interval", function(e)
      {
        try
        {
          var feature = me.hazardsAtMyPosition[me.cycleCount];
          var htype = feature.get('warn_type');
          var hsig = 'Warning';
          if (typeof htype == "undefined")
          {
            htype = feature.get('phenomenon');
            hsig = feature.get('significance');
          }
          qx.bom.Selector.query('.navigationbar>h1')[0].innerHTML = htype + ' ' + hsig;
          var color = "#646464";
          if (hsig == "Warning") {
            color = "#dc2d2d"
          } else if (hsig == "Watch") {
            color = "#ffa500"
          } else if (hsig == "Advisory") {
            color = "#ffeb00"
          } else if (hsig == "Statement") {
            color = "#A67C45"
          }



        }catch (e) {
          qx.bom.Selector.query('.navigationbar>h1')[0].innerHTML = me.hazardsAtMyPosition[me.cycleCount];
        }
        qx.bom.element.Style.setCss(qx.bom.Selector.query('.navigationbar')[0], 'background-image: linear-gradient(' + color + ',#383838)');
        me.cycleCount++;
        if (me.cycleCount >= me.hazardsAtMyPosition.length) {
          me.cycleCount = 0;
        }
      });
    },
    checkWwaAtLocation : function(features)
    {
      var me = this;
      var myPosition = me.mapObject.getMyPosition();
      if (myPosition != null)
      {
        me.hazardsAtMyPosition = me.hazardVectorSource.getFeaturesAtCoordinate(myPosition);
        me.hazardsAtMyPosition.push("for " + me.mapObject.getMyPositionName());
        if (me.hazardsAtMyPosition.length >= 2) {
          me.cycleWwaTimer.start();
        } else {
          me.cycleWwaTimer.stop();

          // Reset to original
          qx.bom.element.Style.setCss(qx.bom.Selector.query('.navigationbar')[0], 'background-image: linear-gradient(#646464,#383838)');
          qx.bom.Selector.query('.navigationbar>h1')[0].innerHTML = 'NWS Mobile EDD';
        }
      }
    }
  }
});
