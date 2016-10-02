qx.Class.define("mobileedd.config.Config",
{
  extend : qx.core.Object,
  type : "singleton",
  properties :
  {
    secure : {
      init : "https:"
    },
    mesowestToken : {
      init : "a13f6d0a32c842e6815c377e77a64e99"
    },
    mapQuestKey : {
      init : "6hcuidlVtrh41AFzsdKyGxUfuuzz1LAu"
    },
    mapQuestKeyBackup : {
      init : "6hcuidlVtrh41AFzsdKyGxUfuuzz1LAu"
    },
    obDisplayedField : {
      init : "Temperature"
    },
    travelActive : {
      init : false
    },
    ndfdRegions : {
      init :
      {
        "U.S. Lower 48" : "conus",
        "Alaska" : "alaska",
        "Hawaii" : "hawaii",
        "Guam" : "guam",
        "Puerto Rico" : "puertori",
        "Northern Hemisphere" : "nhemi",
        "North Pacific Ocean" : "npacocn",
        "Oceanic" : "oceanic"
      }
    },
    ndfdFields : {
      init :
      {
        "Amount of Precip (in)" : "qpf",
        "Wind Chill/Heat Index (ºF)" : "apparentt",
        "Convective Outlook" : "convoutlook",
        "Damaging T-storm Wind Prob.(%)" : "windprob",
        "Dew Point (ºF)" : "td",
        "Extreme Hail Prob.(%)" : "xtrmhailprob",
        "Extreme T-Storm Wind Prob. (%)" : "xtrmwindprob",
        "Extreme Tornado Prob. (%)" : "xtrmtornprob",
        "Hail Probability (%)" : "hailprob",
        "Hazards" : "wwa",
        "Ice Accumulation (in)" : "iceaccum",
        "Maximum Humidity (%)" : "maxrh",
        "Maximum Temperature (ºF)" : "maxt",
        "Minimum Humidity (%)" : "minrh",
        "Minimum Temperature (ºF)" : "mint",
        "Prob. of Precipitation - 12 hour (%)" : "pop12",
        "Precipitation Potential Index (%)" : "ppi",
        "Relative Humidity (%)" : "rh",
        "SPC - Critical Fire Weather" : "probfirewx24",
        "SPC - Prob. Dry Lightning (%)" : "probdrylightning24",
        "Sky Cover (%)" : "sky",
        "Snow Amount (in)" : "snowamt",
        "Temperature (ºF)" : "t",
        "Tornado Probability (%)" : "tornadoprob",
        "Total New Ice (in)" : "totaliceaccum",
        "Total New Precip (in)" : "totalqpf",
        "Total New Snow (in)" : "totalsnowamt",
        "Total Prob. Extreme T-Storms (%)" : "totalxtrmprob",
        "Total Prob. Severe T-Storms (%)" : "totalsvrprob",

        // "Tropical Cyclone Flooding Rain Threat" : "tcrain",

        // "Tropical Cyclone Storm Surge Threat" : "tcsurge",

        // "Tropical Cyclone Tornado Threat" : "tctornado",

        // "Tropical Cyclone Wind Threat" : "tcwind",
        "Wave Height (ft)" : "waveheight",
        "Weather" : "wx",

        // "Wind >34kts (Cumulative Prob.)" : "probwindspd34c",

        // "Wind >34kts (Incremental Prob.)" : "probwindspd34i",

        // "Wind >50kts (Cumulative Prob.)" : "probwindspd50c",

        // "Wind >50kts (Incremental Prob.)" : "probwindspd50i",

        // "Wind >64kts (Cumulative Prob.)" : "probwindspd64c",

        // "Wind >64kts (Incremental Prob.)" : "probwindspd64i",
        "Wind Gust (Kts)" : "windgust",
        "Wind Gust (MPH)" : "windgust",
        "Wind Speed (Kts)" : "windspd",
        "Wind Speed (MPH)" : "windspd"
      }
    }
  },
  construct : function() {
    var me = this;
  },
  members : {

  }
});
