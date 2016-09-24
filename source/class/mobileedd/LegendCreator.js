/**
 * Legend Creator  - Generic way of making legends quickly using an array of objects and specifying if you want circles dashes, etc.
 *
 * Example legend array of objects:
 *
 *    var legend = [
 *           {color:"#000000",label:"dash", shape: "dash", linewidth:2},
 *           {color:"#ffffff",label:"line", shape: "line", linewidth:2},
 *           {color:"#ff0000",label:"small circle", shape: "circle", radius:4},
 *           {color:"#00bdb7",label:"large circle", shape: "circle", radius:7},
 *           {color:"#00bdb7",label:"cross", shape: "cross", size:3},
 *          {color:"#00bdb7",label:"this is a box", shape: "box"},
 *       ]
 */
qx.Class.define("mobileedd.LegendCreator",
{
  extend : qx.ui.mobile.embed.Html,
  construct : function(lyr_name, legendArray, subtitle)
  {
    var me = this;
    me.base(arguments);
    var selector = lyr_name.replace(/ /g, '') + 'legend';
    var html = "<b>" + lyr_name + "</b><br>";
    html += subtitle;
    html += "<table style=\"color:white;\" id=\"" + selector + "\"><tr><th></th></tr></table>";
    me.setHtml(html);
    me.addListenerOnce("appear", function(e) {
      // Load plotting libraries
      if (typeof (jQuery) === "undefined" || typeof (jQuery.plot) === "undefined")
      {
        var req = new qx.bom.request.Script();
        req.open("GET", "resource/mobileedd/libs/flot/flot-combo.js");
        req.onload = function() {
          me.constructTheLegend(selector, legendArray);
        }.bind(this);
        req.send();
      } else
      {
        me.constructTheLegend(selector, legendArray);
      }
    });
  },
  members :
  {
    /**
    *  Update the legend
    * @param lyr_name {String} - The name of the legend
    * @param legendArray {Array} -  Array of objects that dictate what will be shown (labels, boxes or lines, colors, etc.)
    * @param time {String} - The time displayed as a string
    */
    updateTheLegend : function(lyr_name, legendArray)
    {
      var me = this;
      var selector = lyr_name.replace(/ /g, '') + 'legend';
      me.constructTheLegend(selector, legendArray);
    },

    /**
    * Make an HTML5 legend
    * @param selector {String} - the name of the table to select
    * @param legendArray {Array} - Array of objects that dictate what will be shown (labels, boxes or lines, colors, etc.)
    */
    constructTheLegend : function(selector, legendArray)
    {
      var me = this;
      var height = 20;
      var width = 20;
      setTimeout(function(e) {
        for (var i = 0; i < legendArray.length; i++)
        {
          var canvas = $('<canvas />').attr(
          {
            id : "canvas" + i,
            width : width,
            height : height
          });
          var ctx = $(canvas)[0].getContext('2d');
          switch (legendArray[i].shape)
          {
            case "circle":
              var strokeColor = '#000000';
              var fillColor = legendArray[i].color;
              var strokewidth = 1;
              if (typeof (legendArray[i].radius) === "undefined") {
                legendArray[i].radius = 6;
              }
              if (typeof (legendArray[i].fillColor) !== 'undefined') {
                fillColor = legendArray[i].fillColor;
              }
              if (typeof (legendArray[i].strokeColor) !== 'undefined') {
                strokeColor = legendArray[i].strokeColor;
              }
              if (typeof (legendArray[i].strokeWidth) !== 'undefined') {
                strokewidth = legendArray[i].strokeWidth;
              }

              // Stroke
              ctx.beginPath();
              ctx.fillStyle = strokeColor;
              ctx.arc(width / 2, height / 2, legendArray[i].radius + strokewidth, 0, Math.PI * 2, true);
              ctx.closePath();
              ctx.fill();

              // Fill
              ctx.beginPath();
              ctx.arc(width / 2, height / 2, legendArray[i].radius, 0, Math.PI * 2, true);
              ctx.closePath();
              ctx.fillStyle = fillColor;
              ctx.fill();
              break;
            case "line":
              ctx.beginPath();
              ctx.moveTo(0, height / 2);
              ctx.lineTo(width, height / 2);
              ctx.lineWidth = legendArray[i].linewidth;
              ctx.strokeStyle = legendArray[i].color;
              ctx.stroke();
              break;
            case "dash":
              ctx.beginPath();
              ctx.lineWidth = legendArray[i].linewidth;
              ctx.strokeStyle = legendArray[i].color;
              ctx.moveTo(0, height / 2);
              ctx.lineTo(width * .4, height / 2);
              ctx.stroke();
              ctx.moveTo(width * .6, height / 2);
              ctx.lineTo(width, height / 2);
              ctx.stroke();
              break;
            case "cross":
              var x = width / 2;
              var y = height / 2;
              var box = legendArray[i].size;
              ctx.strokeStyle = legendArray[i].color;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(x - box, y - box);
              ctx.lineTo(x + box, y + box);
              ctx.stroke();
              ctx.moveTo(x + box, y - box);
              ctx.lineTo(x - box, y + box);
              ctx.stroke();
              break;
            case "box":
              ctx.fillStyle = legendArray[i].color;
              ctx.fillRect(0, 0, width, height);
              ctx.strokeStyle = 'black';
              ctx.strokeRect(0, 0, width, height);
          }
          $("<tr><td>" + legendArray[i].label + "</td></tr>").appendTo('#' + selector).last('td').prepend(canvas);
        }
      }, 200);
    }
  }
});
