var CodeVisualizer = function () {
    this.initializeAsync = function (codeStore, graphParentName) {
        var trueWidth = window.innerWidth / 2,
            trueHeight = 500,
            width = trueWidth / 2,
            height = trueHeight / 2,
            graph = codeStore.getGraphs().visualGraph;

        var force = d3.layout.force()
            .linkDistance(30)
            .linkStrength(2)
            .size([width, height]);

        var svg = d3.select("#" + graphParentName).append("svg")
            .attr("width", width * 2)
            .attr("height", height * 2);

        svg
            .append("defs")
            .append("marker")
            .attr("id", "TriangleSelected")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", "12")
            .attr("refY", "5")
            .attr("class", "link marker selected")
            .attr("markerUnits", "strokeWidth")
            .attr("markerWidth", "4")
            .attr("markerHeight", "3")
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z");

        svg.select("defs")
            .append("marker")
            .attr("id", "TriangleUnselected")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", "12")
            .attr("refY", "5")
            .attr("class", "link marker unselected")
            .attr("markerUnits", "strokeWidth")
            .attr("markerWidth", "4")
            .attr("markerHeight", "3")
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z");

        svg = svg.append("g")
        .attr("transform", "scale(2)");

        var d3Graph = graph.getD3Graph(),
            nodes = d3Graph.nodes.slice(),
            links = [],
            bilinks = [];

        d3Graph.links.forEach(function (link) {
            var s = link.source,
                t = link.target,
                i = {}; // intermediate node
            nodes.push(i);
            links.push({ source: s, target: i }, { source: i, target: t });
            bilinks.push([s, i, t]);
        });

        force
            .nodes(nodes)
            .links(links)
            .start();

        var link = svg.selectAll(".link")
            .data(bilinks)
            .enter().append("path")
            .attr("class", "link unselected");

        var node = svg.selectAll(".node")
            .data(d3Graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(force.drag);

        node.append("circle");

        node.append("title")
            .text(function (d3Node) { return d3Node.data.data.name; });

        node.append("text")
            .attr("dx", -12)
            .attr("dy", "1.35em");

        function onTick() {
            link.attr("d", function (d) {
                return "M" + d[0].x + "," + d[0].y +
                    "S" + d[1].x + "," + d[1].y +
                    " " + d[2].x + "," + d[2].y;
            });
            node.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

            node.selectAll("text")
                .attr("class", function (d3Node) { return d3Node.data.data.selected ? "selected" : "unselected"; })
                .text(function (d3Node) { return /*d3Node.data.data.selected ? */ d3Node.data.data.name /*: ""*/; });

            node.selectAll("circle")
                .attr("class", function (d3Node) { return d3Node.data.data.selected ? "selected" : "unselected"; })
                .attr("r", function (d3Node) { return d3Node.data.data.selected ? "6" : "3"; })
                .style("fill", function (d3Node) { return d3Node.data.data.group ? "red" : "blue"; });

            link
                .attr("class", function (d3Nodes) {
                    return d3Nodes[0].data.data.selected && d3Nodes[d3Nodes.length - 1].data.data.selected ? "link selected" : "link unselected";
                });
        }

        codeStore.getGraphs().selectedSolution.addEventListener("indexChanged", function () {
            codeStore.getGraphs().visualGraph.getNodes().forEach(function (node) {
                node.data.selected = false;
            });
            codeStore.getGraphs().solutions.getAt(codeStore.getGraphs().selectedSolution.getIndex()).getNodes().forEach(function (node) {
                node.data.visualNode.data.selected = true;
            });
            onTick();
        });

        force.on("tick", onTick);
    };
};