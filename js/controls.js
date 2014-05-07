var Controls = function () {
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
                idToNode;

            codeStore.getGraphs().solutions.splice(0, codeStore.getGraphs().solutions.length);
            codeStore.getGraphs().visualGraph.getNodes().forEach(function (node) {
                node.data.selected = false;
            });

            if (startNodeText && startNodeText.length && endNodeText && endNodeText.length) {
                startNodeIds = nameToIds(startNodeText);
                endNodeIds = nameToIds(endNodeText);

                if (startNodeIds && startNodeIds.length && endNodeIds && endNodeIds.length) {
                    idToNode = codeStore.getGraphs().dataGraph.getNodeById.bind(codeStore.getGraphs().dataGraph);
                    writeUrlState();

                    codeStore.getGraphs().dataGraph.findShortestPathsAsync(
                        startNodeIds.map(idToNode).filter(function (node) { return node; }),
                        endNodeIds.map(idToNode).filter(function (node) { return node; })
                    ).then(function (solutions) {
                        solutions.forEach(function (solution) {
                            codeStore.getGraphs().solutions.push(solution);
                        });
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