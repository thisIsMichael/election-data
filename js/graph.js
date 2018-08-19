var w = 600;
var h = 1200;
var graphId = 0001; // have this so we can identify between dif graphs if we have multiple on page in future

var name = d3.select(".const-name");

var svg = d3.select("#svg-container")
    .append("svg")
    .attr("width", w)
    .attr("height", h);


var zoom = d3.zoom()
    //.translate([w / 2, h / 2])
    //.scale(initialScale)
    //.scaleExtent([initialScale, 8 * initialScale])
    .on("zoom", zoomed);

svg
    .call(zoom);
   // .call(zoom.event);
    

var initialScale = 1800 * 2;

var projection = d3.geoAlbers()
.center([-2, 56.4])
.rotate([4.4, 0])
.parallels([50, 60])
.scale(initialScale)
.translate([w / 4, h / 4]);
/*.translate([w/2, h/2])
.scale([500]);*/

var path = d3.geoPath(projection);

function zoomed() {
    d3.select(".constituencies")
        .attr("transform", d3.event.transform);

    d3.select(".constituencyborder")
        .attr("transform", d3.event.transform);
}


var getPartyColour = function(partyAbbrev) {
    switch (partyAbbrev) {
        case "Lab":
            return "#FF1744";
        case "Con":
            return "2979FF";
        case "LD":
            return "#FFC400";
        case "UKIP":
            return "#D500F9";
        case "PC":
            return "#1DE9B6";
        case "SNP":
            return "#FFEA00";
        case "Green":
            return "#00E676";
        default:
            //other?
            return "#BDBDBD";
    }
}

var getPartyColourOfConstituency = function(constituencyId) {
    var party = "";

    party =  constituencyData[constituencyId]["winner"];

    if (party == "") {
        console.log("sdgs");
    }

    return getPartyColour(party);
}

d3.csv("csv/ge2015.csv").then(function(data) {

    constituencies = [];
    constituencyData = {};

    for (var i = 0; i< data.length; i++) {
        var constituencyName = data[i]["constituency_name"];

        if (constituencies.includes(constituencyName)) {
            // add this result
            constituencyData[data[i]["ons_id"]]["results"].push(
                { 
                    "party": data[i]["party_abbreviation"],
                    "voteShare": parseFloat(data[i]["share"])
                });

        } else {
            // add constituency

            constituencies.push(constituencyName);

            constituencyData[data[i]["ons_id"]] = {
                "name": constituencyName,
                "id": data[i]["ons_id"],
                "winner": data[i]["party_abbreviation"],
                "results": [{ 
                    "party": data[i]["party_abbreviation"],
                    "voteShare": parseFloat(data[i]["share"])
                }]
            };
        }
        
    }

    d3.json("geojson/uk-constituencies-topojson.json").then(function(data){
        var x = true;

        //var ps = topojson.presimplify(data);

        //var simplified = topojson.simplify(ps);
    
        var geojson = topojson.feature(data, data.objects["uk-constituencies"]);
    
        var getConstituencyDomId = function(constituencyId) {
            return "constituency" + constituencyId + "-graphId-" + graphId;
        }
    
        svg.append("g")
            .attr("class", "constituencies")            
            .selectAll("path")
            .data(geojson.features)
            .enter().append("path")
            .attr("d", path)
            .attr("id", function(d) { return getConstituencyDomId(d.properties.pcon17cd) })
            .style("fill", function(d) { return getPartyColourOfConstituency(d.properties.pcon17cd)})
            .on("mouseover", function(d){
                svg.select("#" + getConstituencyDomId(d.properties.pcon17cd))
                    .style("opacity", 0.5);
                d3.select(".const-name")
                    .text(d.properties.pcon17nm);
            })
            .on("mouseout", function(d){
                svg.select("#" + getConstituencyDomId(d.properties.pcon17cd))
                    .style("opacity", 1);
                    d3.select(".const-name")
                    .text("");
            })
            .on("click", function(d){
                showResultAsBar(d.properties.pcon17cd);
            });
            
      /*
        svg.append("path")
            .attr("class", "constituencyBorder")
            .attr("d", path(topojson.mesh(data, data.objects["uk-constituencies"], function(a, b) { return a !== b; })));*/
    });


});

var barsH = 300;
var barsW = 400;
var padding = 20;
var paddingBetweenBars = 10;


var barChartSvg = d3.select("#svg-container")
    .append("svg")
    .attr("id", "bars")
    .attr("width", barsW)
    .attr("height", barsH);

var scale = d3.scaleLinear()
    .domain([0,1])
    .range([0, barsH - padding]);

var showResultAsBar = function(constituencyId) {
    var results = constituencyData[constituencyId]["results"];

    var individualBarWidth = (barsW / results.length) - paddingBetweenBars;

    var getXOffset = function(d, i) {
        return (individualBarWidth + paddingBetweenBars) * i;
    };

    var getBarHeight = function(d) { return scale(d.voteShare); }

    var getYOffset = function(d) { return barsH - getBarHeight(d); };

    barChartSvg.selectAll("rect")
        .remove();

    barChartSvg.selectAll("rect")
        .data(results)
        .enter()
        .append("rect")
        .attr("height", getBarHeight)
        .attr("width", individualBarWidth)
        .attr("x", getXOffset)
        .attr("y", getYOffset)
        .style("fill", function(d) { return getPartyColour(d.party)});
}




