var Controls = function (console) {
    "use strict";

    var codeStore,
        validMethodsAndTypes = [],
        validMethodsAndTypesElement,
        sourceNameElement,
        destinationNameElement,
        writeUrlState = function () {
            var selectedIndex = codeStore.getGraphs().selectedSolution.getIndex(),
                query;
            if (selectedIndex < 0) {
                selectedIndex = 0;
            }

            query = "?from=" + encodeURIComponent(sourceNameElement.value) +
                "&to=" + encodeURIComponent(destinationNameElement.value);

            if (query !== document.location.search) {
                history.pushState(null, null, query);
            }
        },
        nameToIds = function (name) {
            var normalize = function (str) {
                    return str.toLowerCase().trim();
                },
                normalizedName = normalize(name),
                entries = validMethodsAndTypes.filter(function (entry) {
                    return -1 !== normalize(entry.name).indexOf(normalizedName);
                }).sort(function (left, right) { return left.name.length - right.name.length; });

            return entries.map(function (entry) { return entry.node.id; });
        },
        normalizeNameControls = function () {
            var startNodeText = sourceNameElement.value,
                endNodeText = destinationNameElement.value,
                startNodeIds,
                endNodeIds,
                idToNode,
		idToName;

            codeStore.getGraphs().solutions.splice(0, codeStore.getGraphs().solutions.length);
            codeStore.getGraphs().visualGraph.getNodes().forEach(function (node) {
                node.data.selected = false;
            });

            idToNode = codeStore.getGraphs().dataGraph.getNodeById.bind(codeStore.getGraphs().dataGraph);
	    idToName = function(id) {
                return codeStore.getGraphs().dataGraph.getNodeById(id).data.name;
            };
	    if (startNodeText && startNodeText.length) {
                startNodeIds = nameToIds(startNodeText).filter(idToNode);
                sourceNameElement.value = idToName(startNodeIds[0]);
	    }

	    if (endNodeText && endNodeText.length) {
                endNodeIds = nameToIds(endNodeText).filter(idToNode);
		destinationNameElement.value = idToName(endNodeIds[0]);
	    }

            if (startNodeIds.length && endNodeIds.length) {
		console && console.log("NameToIds: " + startNodeText + " -> " + startNodeIds.join(", "));
		console && console.log("NameToIds: " + endNodeText + " -> " + endNodeIds.join(", "));

                if (startNodeIds && startNodeIds.length && endNodeIds && endNodeIds.length) {
                    Progress.show(true);
                    writeUrlState();

                    Graph.findShortestPathsAsync(
                        [idToNode(startNodeIds[0])],
                        [idToNode(endNodeIds[0])],
			{ console: console, maxPaths: 25 }
                    ).then(function (solutions) {
                        var graphSolutions = codeStore.getGraphs().solutions;

                        graphSolutions.dataSource.beginEdits();
                        solutions.forEach(function (solution) {
                            graphSolutions.dataSource.insertAtEnd(null, solution);
                        });
                        graphSolutions.dataSource.endEdits();
                        Progress.show(false);
                    }, function(error) {
                        Progress.show(false);
                    }, function(solution) {
                        var graphSolutions = codeStore.getGraphs().solutions;

                        graphSolutions.dataSource.beginEdits();
                        graphSolutions.dataSource.insertAtEnd(null, solution);
                        graphSolutions.dataSource.endEdits();
		    });
                }
            }
        },
        readUrlState = function () {
            var params;
            try {
                if (document.location && document.location.search) {
                    params = document.location.search.substr(1).split("&").map(function (param) { return param.split("="); });
                    params.forEach(function (param) {
                        switch (param[0].toLowerCase()) {
                        case "from":
                            sourceNameElement.value = decodeURIComponent(param[1]);
                            break;
                        case "to":
                            destinationNameElement.value = decodeURIComponent(param[1]);
                            break;
                        }
                    });
                    normalizeNameControls();
                }
            } catch (e) {
                console.error("Unable to process URI query property: " + e);
            }
        };

    this.initializeAsync = function (codeStoreIn) {
        codeStore = codeStoreIn;

        sourceNameElement = document.getElementById("source");
        destinationNameElement = document.getElementById("destination");

        sourceNameElement.onblur = normalizeNameControls;
        destinationNameElement.onblur = normalizeNameControls;

        validMethodsAndTypesElement = document.getElementById("validMethodsAndTypes");

        validMethodsAndTypes = codeStore.getGraphs().visualGraph.getNodes().
            map(function (node) {
                var state = [];
                if (node.data.data && node.data.data.names && node.data.data.names.length) {
                    state = node.data.data.names.map(function (name) {
                        return {
                            name: name,
                            node: node
                        };
                    });
                } else {
                    state = [{ name: node.data.name, node: node }];
                }
                return state;
            }).
            reduce(function (all, next) { return all.concat(next); }, []);

        validMethodsAndTypes.
            map(function (entry) {
                var option = document.createElement("option");
                option.setAttribute("value", entry.name);
                option.setAttribute("data-nodeid", entry.node.id);
                return option;
            }).
            forEach(function (option) {
                validMethodsAndTypesElement.appendChild(option);
            });

        readUrlState();
        window.addEventListener("popstate", function () {
            readUrlState();
        });
        codeStore.getGraphs().selectedSolution.addEventListener("indexChanged", function () {
            writeUrlState();
        });
    };
};
