var CodeStore = (function () {
    "use strict";

    var SelectedValue = function () {
        var eventTarget = new EventTarget(this, ["indexChanged"]),
            selectedIndex = -1;

        this.setIndex = function (newSelectedIndex) {
            selectedIndex = newSelectedIndex;
            eventTarget.dispatchIndexChangedEvent(this);
        };

        this.getIndex = function () {
            return selectedIndex;
        };
    };

    WinJS.Namespace.define("WinJSGlobalCodeStore", {
        bindingList: new WinJS.Binding.List([])
    });

    return function () {
        var inputData = {},
            solutions = WinJSGlobalCodeStore.bindingList,
            selectedSolution = new SelectedValue(),
            visualGraphState = new Graph(),
            dataGraphState = new Graph(),
            toProperties = function (object) {
                var name,
                    properties = [];

                for (name in object) {
                    if (object.hasOwnProperty(name)) {
                        properties.push({ name: name, value: object[name] });
                    }
                }
                return properties;
            },
            addInputData = function (data) {
                inputData[data.id] = data;
            },
            processDataAsync = function (data) {
                var dataProperties = toProperties(data),
                    allFunctions = dataProperties.reduce(function (total, next) { return total.concat(next.value.functions); }, []);

                // Add all functions and input and output types.
                allFunctions.forEach(function (fnDef) {
                    var visualFunctionNode = visualGraphState.addNode(fnDef.id, { name: fnDef.names[0], data: fnDef, group: 1, dataNodes: [] });

                    fnDef.templates.forEach(function (template, idx, templates) {
                        var nodeId = fnDef.id,
                            nodeName = fnDef.names[0],
                            dataFunctionNode;

                        if (templates.length > 1) {
                            nodeId += "-" + idx;
                            nodeName += " (" + idx + ")";
                        }

                        dataFunctionNode = dataGraphState.addNode(nodeId, { name: nodeName, data: template, group: 1, visualNode: undefined });

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
                    var visualFnId = fnDef.id,
                        cost = fnDef.cost !== undefined ? fnDef.cost : 1;

                    fnDef.templates.forEach(function (template, idx, templates) {
                        var dataFnId = fnDef.id + (templates.length > 1 ? "-" + idx : "");

                        template.in.forEach(function (inType) {
                            var dataNode = dataGraphState.addLinkByNodeId(dataFnId, inType.type, cost, { data: undefined, group: 0, visualNode: undefined }),
                                visualNode = visualGraphState.addLinkByNodeId(visualFnId, inType.type, cost, { data: undefined, group: 0, dataNodes: [] });

                            dataNode.data.visualNode = visualNode;
                            visualNode.data.dataNodes.push(dataNode);
                        });
                        template.out.forEach(function (outType) {
                            var dataNode = dataGraphState.addLinkByNodeId(outType.type, dataFnId, cost, { data: undefined, group: 0, visualNode: undefined }),
                                visualNode = visualGraphState.addLinkByNodeId(outType.type, visualFnId, cost, { data: undefined, group: 0, dataNodes: [] });

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
}());
