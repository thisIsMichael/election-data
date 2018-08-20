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
                    "partyFullName": data[i]["party_name"],
                    "candidate": data[i]["firstname"] + " " + data[i]["surname"],
                    "voteShare": parseFloat(data[i]["share"]),
                    "change": data[i]["change"]
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
                    .transition()
                    .duration(100)
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
var padding = 40;
var paddingBetweenBars = 10;

var getActualDrawingSize = function(size) { return size - (padding * 2)};


var barChartSvg = d3.select("#svg-container")
    .append("svg")
    .attr("id", "bars")
    .attr("width", barsW)
    .attr("height", barsH);

var yScale = d3.scaleLinear()
    .domain([0,1])
    .range([getActualDrawingSize(barsH), 0]);

var yAxisGen = d3.axisLeft(yScale).tickFormat(d3.format(".0%"));

barChartSvg.append("g")
    .attr("class", "y-axis")
    //.attr("x", 20)
    .attr("transform", "translate(" + padding + "," + padding + ")")
    .call(yAxisGen);

var showResultAsBar = function(constituencyId) {

    barChartSvg.select(".title").remove();
    
    var title = barChartSvg.append("text")
        .text(constituencyData[constituencyId]["name"])
        .attr("class", "title");

    title.attr("x", (barsW - title.node().getComputedTextLength()) / 2)
        .attr("y", padding / 2);

    var results = constituencyData[constituencyId]["results"];

    var individualBarWidth = ((getActualDrawingSize(barsW) - paddingBetweenBars) / results.length) - paddingBetweenBars;

    var getXOffset = function(d, i) {
        return ((individualBarWidth + paddingBetweenBars) * i) + padding + paddingBetweenBars;
    };

    var getBarHeight = function(d) { return getActualDrawingSize(barsH) - yScale(d.voteShare); }

    var abbreviateName = function(name) {
        var split = name.trim().split(" ");

        var abbrev = "";

        for (var i = 0; i < split.length; i++) {
            abbrev += split[i][0];
        }

        return abbrev;
    }

    var axisNames = [""];

    var getUniqueNameForAxis = function(name) {
        // if name contains a space, then abbreviate
        if (name.includes(" ")) {
            name = abbreviateName(name);
        }

        if (axisNames.includes(name)) {
            return getUniqueNameForAxis(name + "#");
        } else {
            return name;
        }
    }

    var axisPositions = [padding];

    for (var i = 0; i < results.length; i++) {
        var partyName = results[i]["party"];

        axisNames.push(getUniqueNameForAxis(partyName));

        axisPositions.push(getXOffset(null, i) + (individualBarWidth / 2));
    }

    axisNames.push("");
    axisPositions.push(padding + getActualDrawingSize(barsW));

    

    

    var xScale = d3.scaleOrdinal()
        .domain(axisNames)
        .range(axisPositions);
        //.padding(0.1);
        //.paddingInner(0.1)
        //.paddingOuter(0.025);

        //console.log("step:"+xScale.step());
        //console.log("bandwidth:" + xScale.bandwidth());

    var xAxisGen = d3.axisBottom(xScale).tickFormat(function(d, i) { return d.replace("#", "");});

    var getYOffset = function(d) { return barsH - getBarHeight(d) - padding; };
/*
    var yScale = d3.scaleLinear()
        .domain([0, 1]) // input 
        .range([barsH, 0]); // output */

    // y axis

    barChartSvg.select(".x-axis").remove();

    var xAxis = barChartSvg.append("g")
        .call(xAxisGen)
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + (barsH-padding) + ")");

    barChartSvg.selectAll("rect")
        .remove();

    barChartSvg.selectAll("rect")
        .data(results)
        .enter()
        .append("rect")
        .attr("width", individualBarWidth)
        .attr("x", getXOffset)
        .attr("y", barsH - padding)
        .style("fill", function(d) { return getPartyColour(d.party)})
        .transition()
        .attr("height", getBarHeight)
        .attr("y", getYOffset);
}




