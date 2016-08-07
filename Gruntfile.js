// requires
var util = require('util');
var qx = require("../mwp/trunk/libs/qooxdoo-4.1-sdk/tool/grunt");

// grunt
module.exports = function(grunt) {
  var config = {

    generator_config: {
      let: {
      }
    },

    common: {
      "APPLICATION" : "mobileedd",
      "QOOXDOO_PATH" : "../mwp/trunk/libs/qooxdoo-4.1-sdk",
      "LOCALES": ["en"],
      "QXTHEME": "mobileedd.theme.Theme"
    }

    /*
    myTask: {
      options: {},
      myTarget: {
        options: {}
      }
    }
    */
  };

  var mergedConf = qx.config.mergeConfig(config);
  // console.log(util.inspect(mergedConf, false, null));
  grunt.initConfig(mergedConf);

  qx.task.registerTasks(grunt);

  // grunt.loadNpmTasks('grunt-my-plugin');
};
