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
    }
  },
  construct : function() {
    var me = this;
  },
  members : {

  }
});
