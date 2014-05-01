var CodeStore = (function () {
    WinJS.Namespace.define("WinJSGlobalCodeStore", {
        bindingList: new WinJS.Binding.List([])
    });

    return function() {
        var inputData = {},
            solutions = WinJSGlobalCodeStore.bindingList,
            selectedSolution = new function SelectedValue() {
                var eventTarget = new EventTarget(this, ["indexChanged"]),
                    selectedIndex = -1;
                this.setIndex = function (newSelectedIndex) {
                    var oldSelectedIndex = selectedIndex;
                    selectedIndex = newSelectedIndex;
                    eventTarget.dispatchIndexChangedEvent(this);
                };
                this.getIndex = function () {
                    return selectedIndex;
                };
            },
            visualGraphState = new Graph(),
            dataGraphState = new Graph(),
            toProperties = function (object) {
                var name,
                    properties = [];
                for (name in object) {
                    properties.push({ name: name, value: object[name] });
                }
                return properties;
            },
            addInputData = function (data) {
                inputData[data.id] = data;
            },
            processDataAsync = function (data) {
                var dataProperties = toProperties(data),
                    allTypes = [],//dataProperties.reduce(function (total, next) { return total.concat(next.value.types); }, []),
                    allFunctions = dataProperties.reduce(function (total, next) { return total.concat(next.value.functions); }, []);

                // Add all types.
                allTypes.forEach(function (typeDef) {
                    var dataNode = dataGraphState.addNode(typeDef.id, { name: typeDef.names[0], data: typeDef, group: 0, visualNode: undefined }),
                        visualNode = visualGraphState.addNode(typeDef.id, { name: typeDef.names[0], data: typeDef, group: 0, dataNodes: [] });

                    dataNode.data.visualNode = visualNode;
                    visualNode.data.dataNodes.push(dataNode);
                });

                // Add all base types and links from type to base type.
                allTypes.forEach(function (typeDef) {
                    if (typeDef.isa) {
                        // Gets nodes for isa if they exist or creates if they don't.
                        var dataNode = dataGraphState.addNode(typeDef.isa, { name: typeDef.isa, data: typeDef, group: 0, visualNode: undefined }),
                            visualNode = visualGraphState.addNode(typeDef.isa, { name: typeDef.isa, data: typeDef, group: 0, dataNodes: [] });

                        dataNode.data.visualNode = visualNode;
                        visualNode.data.dataNodes.push(dataNode);

                        dataNode = dataGraphState.addLinkByNodeId(typeDef.isa, typeDef.id, 1, { data: typeDef, group: 0, visualNode: undefined });
                        visualNode = visualGraphState.addLinkByNodeId(typeDef.isa, typeDef.id, 1, { data: typeDef, group: 0, dataNodes: [] });

                        dataNode.data.visualNode = visualNode;
                        visualNode.data.dataNodes.push(dataNode);
                    }
                });

                // Add all functions and input and output types.
                allFunctions.forEach(function (fnDef) {
                    var visualFunctionNode = visualGraphState.addNode(fnDef.id, { name: fnDef.names[0], data: fnDef, group: 1, dataNodes: [] });

                    fnDef.templates.forEach(function (template, idx) {
                        var dataFunctionNode = dataGraphState.addNode(fnDef.id + "-" + idx, { name: fnDef.names[0] + " (" + idx + ")", data: template, group: 1, visualNode: undefined });

                        dataFunctionNode.data.visualNode = visualFunctionNode;
                        visualFunctionNode.data.dataNodes.push(dataFunctionNode);

                        template.in.concat(template.out).map(function (typeData) {
                            var dataTypeNode = dataGraphState.addNode(typeData.type, { name: typeData.type, data: typeData, group: 0, visualNode: undefined }),
                                visualTypeNode = visualGraphState.addNode(typeData.type, { name: typeData.type, data: typeData, group: 0, dataNodes: [] });
                            dataTypeNode.data.visualNode = visualTypeNode;
                            visualTypeNode.data.dataNodes.push(dataTypeNode);
                        });
                    });
                });

                // Add links between input types and functions and functions and output types.
                allFunctions.forEach(function (fnDef) {
                    var visualFnId = fnDef.id;

                    fnDef.templates.forEach(function (template, idx) {
                        var dataFnId = fnDef.id + "-" + idx;

                        template.in.forEach(function (inType) {
                            var dataNode = dataGraphState.addLinkByNodeId(dataFnId, inType.type, 1, { data: undefined, group: 0, visualNode: undefined }),
                                visualNode = visualGraphState.addLinkByNodeId(visualFnId, inType.type, 1, { data: undefined, group: 0, dataNodes: [] });

                            dataNode.data.visualNode = visualNode;
                            visualNode.data.dataNodes.push(dataNode);
                        });
                        template.out.forEach(function (outType) {
                            var dataNode = dataGraphState.addLinkByNodeId(outType.type, dataFnId, 1, { data: undefined, group: 0, visualNode: undefined }),
                                visualNode = visualGraphState.addLinkByNodeId(outType.type, visualFnId, 1, { data: undefined, group: 0, dataNodes: [] });

                            dataNode.data.visualNode = visualNode;
                            visualNode.data.dataNodes.push(dataNode);
                        });
                    });
                });
            };

        this.initializeAsync = function (uris) {
            return WinJS.Promise.join(uris.map(function (uri) {
                return WinJS.xhr({ url: uri, responseType: "text" }).then(function (xhr) {
                    addInputData(JSON.parse(xhr.responseText));
                });
            })).then(function () {
                return processDataAsync(inputData);
            });
        };

        this.getGraphs = function () {
            return {
                visualGraph: visualGraphState,
                dataGraph: dataGraphState,
                solutions: solutions,
                selectedSolution: selectedSolution
            };
        };
    };
})();