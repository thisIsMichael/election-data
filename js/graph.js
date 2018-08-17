var w = 300;
var h = 800;

var svg = d3.select("body")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

var projection = d3.geoAlbers()
.center([-2, 56.4])
.rotate([4.4, 0])
.parallels([50, 60])
.scale(1200 * 2)
.translate([w / 4, h / 4]);
/*.translate([w/2, h/2])
.scale([500]);*/

var path = d3.geoPath(projection);
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

d3.csv("csv/ge2015.csv", function(data) {

    var constituencies = [];
    var constituencyData = [];

    for (var i = 0; i< data.length; i++) {
        var constituencyName = data[i]["constituency_name"];

        if (constituencies.includes(constituencyName)) {
            continue;
        } else {
            constituencies.append(constituencyName);
        }

        constituencyData.append(new {
            "name": constituencyName,
            "winner": data[i]["party_abbreviation"]
        })
        
    }

});


d3.json("geojson/uk-constituencies-topojson.json", function(data){
    var x = true;

    var geojson = topojson.feature(data, data.objects["uk-constituencies"]);

    

    svg.append("g")
        .attr("class", "states")
        .selectAll("path")
        .data(topojson.feature(data, data.objects["uk-constituencies"]).features)
        .enter().append("path")
        .attr("d", path);
  
    svg.append("path")
        .attr("class", "state-borders")
        .attr("d", path(topojson.mesh(data, data.objects["uk-constituencies"], function(a, b) { return a !== b; })));
});