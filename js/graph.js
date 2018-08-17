var w = 300;
var h = 800;

var svg = d3.select("body")
    .append("svg");

svg.attr({
        width: w,
        height: h
    });


var projection = d3.geo.albers();
/*.translate([w/2, h/2])
.scale([500]);*/

var path = d3.geo.path(projection);
/*
d3.json("geojson/uk-constituencies.json").then(function(json){
    console.log("data loaded");

    svg.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr({
            d: path,
            "fill": "gray"
        })
});*/


d3.json("geojson/uk-constituencies.json", function(data){
    var x = true;

    svg.selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
        .attr({
            d: path,
            "fill": "gray"
        })
});