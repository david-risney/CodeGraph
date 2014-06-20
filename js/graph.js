var Graph = function () {
    "use strict";

    var nodes = [],
        links = [],
        nodeToIndex = new Map(),
        that = this,
        Link = function (inNode, outNode, cost, data) {
            // The link points from (out of) the outNode and to (into) the inNode.
            this.inNode = inNode;
            this.outNode = outNode;
            this.cost = cost !== undefined ? cost : 1;
            this.data = data;
        },
        Node = function (id, data) {
            var nLinks = [],
                thisNode = this;
            this.addLink = function (link) {
                nLinks.push(link);
            };
            // Links that point into this node.
            this.getInLinks = function () {
                return nLinks.filter(function (link) { return link.inNode === thisNode; });
            };
            // Links that leave out of this node.
            this.getOutLinks = function () {
                return nLinks.filter(function (link) { return link.outNode === thisNode; });
            };
            this.data = data;
            this.id = id;
        };

    this.getNodes = function () { return nodes; };
    this.getLinks = function () { return links; };

    this.getNodeById = function (id) { return nodes[nodeToIndex.get(id)]; };
    this.getNodeByIdx = function (idx) { return nodes[idx]; };
    this.getNodeIdx = function (node) { return nodeToIndex.get(node.id); };

    this.addNode = function (id, data) {
        var node = nodeToIndex.has(id) ? nodes[nodeToIndex.get(id)] : undefined;
        if (!node) {
            node = new Node(id, data);
            nodes.push(node);
            nodeToIndex.set(node.id, nodes.length - 1);
        }
        return node;
    };

    this.addLinkByNode = function (inNode, outNode, cost, data) {
        if (!inNode || !outNode) {
            throw new Error("Unable to add link between unknown nodes.");
        }
        var link = new Link(inNode, outNode, cost, data);
        inNode.addLink(link);
        outNode.addLink(link);
        links.push(link);
        return link;
    };

    this.addLinkByNodeId = function (inNodeId, outNodeId, cost, data) {
        var inNode = that.getNodeById(inNodeId),
            outNode = that.getNodeById(outNodeId);
        return that.addLinkByNode(inNode, outNode, cost, data);
    };

    this.addLinkByNodeIdx = function (inNodeIdx, outNodeIdx, cost, data) {
        var inNode = that.getNodeById(inNodeIdx),
            outNode = that.getNodeById(outNodeIdx);
        return that.addLinkByNode(inNode, outNode, cost, data);
    };

    this.getD3Graph = function () {
        var d3Nodes = nodes.map(function (node, index) {
                return {
                    id: node.id,
                    index: index,
                    data: node
                };
            }),
            d3Links = links.map(function (link) {
                var inIdx = that.getNodeIdx(link.inNode),
                    outIdx = that.getNodeIdx(link.outNode);
                return {
                    source: d3Nodes[outIdx],
                    target: d3Nodes[inIdx],
                    data: link
                };
            });

        return {
            nodes: d3Nodes,
            links: d3Links
        };
    };

};

(function () {
    "use strict";
    var Path = function (firstNode) {
            var pLinks = [];
            console.assert(firstNode);
            this.clone = function () {
                var cloned = new Path(firstNode);
                pLinks.forEach(function (link) { cloned.pushLink(link); });
                return cloned;
            };
            this.pushLink = function (link) {
                pLinks.push(link);
            };
            this.hasLink = function (link) {
                return pLinks.some(function (testLink) { return testLink === link; });
            };
            this.getLinks = function () { return pLinks; };
            this.getNodes = function () { return [firstNode].concat(pLinks.map(function (link) { return link.inNode; })); };
            this.getTotalCost = function () {
                return pLinks.reduce(function (total, link) { return total + (link.cost || 0); }, 0);
            };
            this.getFirstNode = function () {
                return firstNode;
            };
            this.getLastNode = function () {
                return pLinks.length ? pLinks[pLinks.length - 1].inNode : firstNode;
            };
        },
        SortedPathList = function () {
            var paths = [];
            this.add = function (path) {
                paths.push(path);
                paths = paths.sort(function (pathLeft, pathRight) { return -(pathLeft.getTotalCost() - pathRight.getTotalCost()); });
                return path;
            };
            this.isEmpty = function () { return !paths.length; };
            this.removeNext = function () {
                return paths.pop();
            };
	    this.length = function() { return paths.length; }
        },
        findPathsInternalAsync = function (PathsContainerCtor, nodeStart, isEndNode, options) {
            var console = options.console,
	        paths = new PathsContainerCtor(),
                solutions = [],
                deferral = new Deferral(),
                findPathsInternalLoopAsync = function () {
                    var currentPath = paths.removeNext();

                    if (isEndNode(currentPath.getLastNode())) {
                        solutions.push(currentPath);
                        deferral.notify(currentPath);
			console && console.log("Solutions found " + solutions.length);
                    }

                    (options.followLinksBackwards ?
                            currentPath.getLastNode().getInLinks() :
                            currentPath.getLastNode().getOutLinks()).filter(function (link) {
                                return !currentPath.hasLink(link);
                            }).forEach(function (link) {
                                var nextPath = currentPath.clone();
                                nextPath.pushLink(link);
                                paths.add(nextPath);
                            });

                    if (!paths.isEmpty() && solutions.length < options.maxPaths) {
                        if (paths.length() >= 100 && (paths.length() % 20) === 0) {
			   console && console.log("Paths " + paths.length() + ", Solns " + solutions.length);
			}
                        setTimeout(findPathsInternalLoopAsync, 0);
                    } else {
                        console && console.log("Completed with " + solutions.length + " solutions.");
                        deferral.resolve(solutions);
                    }
                };

            options = options || {};
            options.maxPaths = options.maxPaths || Infinity;
            options.followLinksBackwards = options.followLinksBackwards || false;

            paths.add(new Path(nodeStart));

            setTimeout(findPathsInternalLoopAsync, 0);

            return deferral.promise;
        },
        product = function (ar1, ar2) {
            return ar1.map(function (entry1) {
                return ar2.map(function (entry2) {
                    return [entry1, entry2];
                });
            }).reduce(function (total, next) { return total.concat(next); }, []);
        },
        initPromise = new AsyncReentrancyGuard.LazyPromise(function () {
            if (typeof Worker !== "undefined" && typeof ProxyPort !== "undefined") {
                return ProxyPort.createProxyWorkerAsync([
                    "../lib/js/es5-shim.js",
                    "../lib/js/es6-shim.js",
                    "../lib/winjs/js/base.js",
                    "../js/asyncReentrancyGuard.js",
                    "../js/graph.js?worker"
                ], { proxyPortUri: "js/proxyPort.js", get: "$.Graph" });
            }
            else {
                console.warn("Web workers or ProxyPort unavailable. Unable to run graph on its own thread.");
                return WinJS.Promise.wrap({ root: Graph });
            }
        });

    Graph.findShortestPathAsyncLocal = function (startNode, endNode, options) {
        return findPathsInternalAsync(SortedPathList, startNode, function (node) { return node === endNode; }, { maxPaths: 1, console: options.console });
    };
    Graph.findShortestPathAsync = function (startNode, endNode, options) {
        return initPromise.settleAsync().then(function (result) {
            return result.root.findShortestPathAsyncLocal(startNode, endNode, options);
        });
    };

    Graph.findShortestPathsAsyncLocal = function (startNodes, endNodes, options) {
        var deferral = new Deferral();
        promiseJoinWithProgress(product(startNodes, endNodes).map(function (args, index) {
            return function () {
                var newConsole = options.console ? { log: function (message) { options.console.log(index + " (" + args[0].data.name + " -> " + args[1].data.name + "): " + message); } } : null;

                return findPathsInternalAsync(SortedPathList, args[0], function (node) { return node === args[1]; }, { maxPaths: options.maxPaths, console: newConsole });
            };
        }), { console: console }).then(
	function (arrOfArrOfSolution) {
            deferral.resolve(arrOfArrOfSolution.reduce(function (total, next) { return total.concat(next); }, []));
        }, 
	function (error) { deferral.reject(error); },
	function (progress) { deferral.notify(progress); });

	return deferral.promise;
    };
    Graph.findShortestPathsAsync = function (startNodes, endNodes, options) {
        return initPromise.settleAsync().then(function (result) {
            return result.root.findShortestPathsAsyncLocal(startNodes, endNodes, options);
        });
    };
}());
