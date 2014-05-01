var Controls = function () {
    var startNodeId = null,
        endNodeId = null,
        codeStore,
        validMethodsAndTypes = [],
        validMethodsAndTypesElement,
        sourceNameElement,
        destinationNameElement,
        nameToIds = function (name) {
            var result = null,
                normalize = function (str) {
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
                endNodeText = destinationNameElement.value;

            codeStore.getGraphs().solutions.splice(0, codeStore.getGraphs().solutions.length);
            codeStore.getGraphs().visualGraph.getNodes().forEach(function (node) {
                node.data.selected = false;
            });

            if (startNodeText && startNodeText.length && endNodeText && endNodeText.length) {
                startNodeIds = nameToIds(startNodeText);
                endNodeIds = nameToIds(endNodeText);

                if (startNodeIds && startNodeIds.length && endNodeIds && endNodeIds.length) {
                    var idToNode = codeStore.getGraphs().dataGraph.getNodeById.bind(codeStore.getGraphs().dataGraph);

                    //codeStore.getGraphs().dataGraph.findShortestPathAsync(startNodeIds.map(idToNode)[0], endNodeIds.map(idToNode)[0]).then(
                    codeStore.getGraphs().dataGraph.findShortestPathsAsync(
                        startNodeIds.map(idToNode).filter(function (node) { return node; }),
                        endNodeIds.map(idToNode).filter(function (node) { return node; })).
                        then(
                            function (solutions) {
                                solutions.forEach(function (solution) {
                                    codeStore.getGraphs().solutions.push(solution);
                                });
                            });
                }
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
                }
                else {
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
    };
};