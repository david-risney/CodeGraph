var AppState = (function (codeStore) {
    var selectedSolution = new (function () {
        this.public = {};
        var eventTarget = new EventTarget(this.public, ["indexChanged"]),
            selectedIndex = 0;

        this.public.setIndex = function (newSelectedIndex) {
            newSelectedIndex = parseInt(newSelectedIndex);
            var indexChanged = selectedIndex !== newSelectedIndex;
            if (indexChanged) {
                selectedIndex = newSelectedIndex;
                eventTarget.dispatchIndexChangedEvent(this.public);
            }
        };

        this.public.getIndex = function () {
            return selectedIndex;
        };
    })();

    var solutionList = new (function () {
        this.public = {};
        var eventTarget = new EventTarget(this.public, ["sizeChanged"]),
            array = [];

        this.public.get = function (index) {
            return array[index];
        };
        this.public.length = function () {
            return array.length;
        };
        this.push = function (value) {
            array.push(value);
            eventTarget.dispatchSizeChangedEvent(this);
        };
        this.clear = function () {
            if (array.length > 0) {
                array = [];
                eventTarget.dispatchSizeChangedEvent(this);
            }
        };
    })();

    var pathRequirements = new (function () {
        this.public = {};
        var eventTarget = new EventTarget(this.public, ["changed"]),
            array = [];

        function areStringArraysEqual(arr1, arr2) {
            var equal = arr1.length === arr2.length;
            for (var index = 0; index < arr1.length && equal; ++index) {
                equal = arr1[index] == arr2[index];
            }
            return equal;
        }

        this.public.set = function (arrayIn) {
            if (!areStringArraysEqual(arrayIn, array)) {
                array = arrayIn;
                eventTarget.dispatchChangedEvent(this);
            }
        };

        this.public.get = function () {
            return array;
        }
    })();

    function getBestMatchingNode(name) {
        name = name.toLowerCase();
        var result;

        if (name.length > 0) {
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

    pathRequirements.public.addEventListener("changed", function () {
        nodeRequirements = ["UserInput"].concat(pathRequirements.public.get()).concat(["UserOutput"]).map(function (partialName) {
            return getBestMatchingNode(partialName);
        }).filter(function (node) {
            return node;
        });
        console.log(nodeRequirements);

        if (nodeRequirements.length >= 4) {
            Progress.show(true);
            solutionList.clear();
            Graph.findShortestPathsWithRequiredNodesAsync(nodeRequirements, { maxPaths: 50 }).then(
                function () { Progress.show(false); },
                function (error) { 
                    Progress.show(false); 
                    document.getElementById("error").textContent = "Error " + error.message;
                },
                function (path) {
                    solutionList.push(path);
                });
        }
    });

    this.pathRequirements = pathRequirements.public;
    this.selectedSolution = selectedSolution.public;
    this.solutionList = solutionList.public;
});
