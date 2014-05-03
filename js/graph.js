var Graph = function () {
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
            var links = [],
                that = this;
            this.addLink = function (link) {
                links.push(link);
            };
            // Links that point into this node.
            this.getInLinks = function () {
                return links.filter(function (link) { return link.inNode === that; });
            };
            // Links that leave out of this node.
            this.getOutLinks = function () {
                return links.filter(function (link) { return link.outNode === that; });
            };
            this.data = data;
            this.id = id;
        },
        Path = function (firstNode) {
            var links = [];
            console.assert(firstNode);
            this.clone = function () {
                var cloned = new Path(firstNode);
                links.forEach(function (link) { cloned.pushLink(link); });
                return cloned;
            };
            this.pushLink = function (link) {
                links.push(link);
            };
            this.hasLink = function (link) {
                return links.some(function (testLink) { return testLink === link; });
            };
            this.getLinks = function () { return links; };
            this.getNodes = function () { return [firstNode].concat(links.map(function (link) { return link.inNode; })); };
            this.getTotalScore = function () {
                return links.reduce(function (total, link) { return total + link.score ? link.score : 0; }, 0);
            };
            this.getFirstNode = function () {
                return firstNode;
            };
            this.getLastNode = function () {
                return links.length ? links[links.length - 1].inNode : firstNode;
            };
        },
        SortedPathList = function () {
            var paths = [];
            this.add = function (path) {
                paths.push(path);
                paths = paths.sort(function (pathLeft, pathRight) { return -(pathLeft.getTotalScore() - pathRight.getTotalScore()); });
                return path;
            };
            this.isEmpty = function () { return !paths.length; };
            this.removeNext = function () {
                return paths.pop();
            };
        },
        findPathsInternalAsync = function (PathsContainerCtor, nodeStart, isEndNode, options) {
            var paths = new PathsContainerCtor(),
                solutions = [],
                deferral = new Deferral(),
                findPathsInternalLoopAsync = function () {
                    var currentPath = paths.removeNext();

                    if (isEndNode(currentPath.getLastNode())) {
                        solutions.push(currentPath);
                        deferral.notify(currentPath);
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
                        setTimeout(findPathsInternalLoopAsync, 0);
                    }
                    else {
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

    this.findShortestPathAsync = function (startNode, endNode) {
        return findPathsInternalAsync(SortedPathList, startNode, function (node) { return node === endNode; }, { maxPaths: 1 });
    };

    this.findShortestPathsAsync = function (startNodes, endNodes) {
        return PromiseJoinWithProgress(product(startNodes, endNodes).map(function (args) {
            return function () {
                return findPathsInternalAsync(SortedPathList, args[0], function (node) { return node === args[1]; });
            };
        })).then(function (arrOfArrOfSolution) {
            return arrOfArrOfSolution.reduce(function (total, next) { return total.concat(next); }, []);
        });
    };
};
