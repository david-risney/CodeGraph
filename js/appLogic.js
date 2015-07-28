var AppLogic = (function (codeStore, appState) {
    function getBestMatchingNode(name) {
        name = name.toLowerCase();
        var result;

        if (name.length > 0 && codeStore.getGraphs().dataGraph) {
            var allMatches = codeStore.getGraphs().dataGraph.getNodes().filter(function (node) {
                return node.data.name.toLowerCase().indexOf(name) >= 0;
            });
            // If there's one with an exact match, choose that.
            result = allMatches.filter(function (node) {
                return node.data.name.toLowerCase() === name;
            })[0];
            // Otherwise, the user wasn't very specific. Just pick one.
            if (!result) {
                result = allMatches[0];
            }
        }
        return result;
    }

    appState.pathRequirements.addEventListener("changed", updateSolutions);
    codeStore.addEventListener("inputDataChanged", updateSolutions);
    
    function updateSolutions() {
        nodeRequirements = ["UserInput"].concat(appState.pathRequirements.get()).concat(["UserOutput"]).map(function (partialName) {
            return getBestMatchingNode(partialName);
        }).filter(function (node) {
            return node;
        });

        if (nodeRequirements.length >= 4) {
            Progress.show(true);
            appState.solutionList.clear();
            Graph.findShortestPathsWithRequiredNodesAsync(nodeRequirements, { maxPaths: 50 }).then(
                function () { Progress.show(false); },
                function (error) { 
                    Progress.show(false); 
                    document.getElementById("error").textContent = "Error " + error.message;
                },
                function (path) {
                    appState.solutionList.push(path);
                });
        }
    }

    appState.targetList.addEventListener("changed", function () {
        Progress.show(true);
        codeStore.initializeAsync(appState.targetList.get()).then(function () {
            Progress.show(false);
        }, function (error) {
            Progress.show(false);
            document.getElementById("error").textContent = "Error " + error.message;
        });
    });
});
