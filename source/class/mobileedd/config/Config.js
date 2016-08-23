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
    }
  },
  construct : function() {
    var me = this;
  },
  members : {

  }
});
