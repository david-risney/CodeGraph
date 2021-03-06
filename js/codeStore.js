﻿// Owns parsing API data, constructing a graph of that data, and turning that
// paths into useful info.
var CodeStore = (function () {
    "use strict";

    var eventTarget = new EventTarget(this, ["inputDataChanged"]),
        inputData,
        visualGraphState,
        dataGraphState,
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
        clearInputData = function () {
            inputData = {};
            visualGraphState = new Graph();
            dataGraphState = new Graph();
        },
        validateInputData = function (data) {
            function validateBase(file, id, condition, msg) { 
                if (!condition) {
                    console.error("inputData validation failure " + file + ", " + id + ": " + msg);
                }
            }
            data.functions.forEach(function (func) {
                var validate = validateBase.bind(null, data.id, func.id);

                validate(func.id && func.id.length > 0, "Missing id");
                validate(func.names.length > 0, "Missing name");
                validate(func.cost === undefined || func.cost >= 0, "Cost must not be negative");
                validate(func.templates.length > 0, "Missing template");
                func.templates.forEach(function (template) {
                    validate(template.code && template.code.length > 0, "Missing code");
                    validate(template.code.indexOf("$next") >= 0, "Missing $next in code.");
                });
            });
        },
        addInputData = function (data) {
            validateInputData(data);
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

                    dataFunctionNode = dataGraphState.addNode(nodeId, { name: nodeName, doc: fnDef.doc, data: template, group: 1, visualNode: undefined });

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
        clearInputData();
        return WinJS.Promise.join(uris.map(function (uri) {
            return WinJS.xhr({ url: uri, responseType: "text" }).then(function (xhr) {
                addInputData(JSON.parse(xhr.responseText));
            });
        })).then(function () {
            return processDataAsync(inputData);
        }).then(function () {
            eventTarget.dispatchInputDataChangedEvent(this);
        });
    };

    this.getGraphs = function () {
        return {
            visualGraph: visualGraphState,
            dataGraph: dataGraphState,
        };
    };

    this.pathToCode = function (path) {
        var code = "$next",
            clone = function (obj) { return JSON.parse(JSON.stringify(obj)); },
            existingVariables = [],
            frames = path ? path.getNodes().filter(function (node) { return node.data.data.code; }).map(function (node) { return node.data.data; }) : [],
            firstFrame = { code: "", "in": [], out: [] },
            secondFrame = frames.length ? frames[0] : null,
            lastFrame = { code: "// ...", "in": [], out: [] };

        if (secondFrame) {
            firstFrame.out = secondFrame.in;
            firstFrame.code = firstFrame.out.map(function (outVariable) {
                return "var $" + outVariable.name + " = null; // Your variable here.";
            }).join("\n") + "\n$next";
            frames = [firstFrame].concat(frames).concat([lastFrame]);
        }

        frames.forEach(function (data) {
            var codeFilled = data.code,
                replacements = [],
                newVariables = [],
                indent = "";

            data.in.map(function (inVariable) {
                var filteredExistingVariables = existingVariables.filter(function (existingVariable) {
                    return existingVariable.type === inVariable.type;
                });
                var existingVariable = filteredExistingVariables[filteredExistingVariables.length - 1];
                replacements.push({ oldName: inVariable.name, newName: existingVariable.newName });
            });
            newVariables = clone(data.out).map(function (newVariable) {
                newVariable.newName = replacements.filter(function(entry) { return entry.oldName === newVariable.name; }).map(function(entry) { return entry.newName })[0] || newVariable.name;
                return newVariable;
            });
            data.out.map(function (outVariable) {
                var existingReplacement = replacements.filter(function (entry) { return entry.oldName === outVariable.name; })[0];
                replacements.push(existingReplacement || { oldName: outVariable.name, newName: outVariable.name });
            });
            existingVariables = existingVariables.concat(newVariables);

            codeFilled = replacements.sort(function (left, right) { return right.oldName.length - left.oldName.length; }).
                reduce(function (codeFilled, entry) { return codeFilled.replace("$" + entry.oldName, entry.newName); }, codeFilled);

            indent = /\n(\t*)\$next/.exec(code);
            indent = (indent && indent[1]) || "";

            codeFilled = codeFilled.split("\n").map(function (line, idx) { return idx === 0 ? line : indent + line; }).join("\n");
            code = code.replace("$next", codeFilled);
        });
        code = code.replace(/\t/g, "    ");
        return code;
    };
});
