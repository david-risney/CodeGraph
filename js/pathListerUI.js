// Responsible for updating the documentation list, and handling the next and previous buttons.
var PathListerUI = (function (appState) {
    "use strict";

    var pathListElement,
        solutionCountElement,
        currentSolution;

    function update() {
        if (pathListElement) {
            var newSolution = appState.solutionList.get(appState.selectedSolution.getIndex());
            if (newSolution != currentSolution) {
                pathListElement.innerHTML = "";
                currentSolution = newSolution;
                if (currentSolution) {
                    currentSolution.getNodes().map(function (node) {
                        var li = document.createElement("li");
                        if (node.data.doc) {
                            var a = document.createElement("a");
                            a.setAttribute("href", node.data.doc);
                            a.setAttribute("target", "_blank");
                            li.appendChild(a);

                            a.textContent = node.data.name;
                        } else {
                            li.textContent = node.data.name;
                        }

                        return li;
                    }).forEach(function (nodeElement) {
                        pathListElement.appendChild(nodeElement);
                    });
                }
            }
        }
        if (solutionCountElement) {
            var solutionCount = appState.solutionList.length();
            if (solutionCount > 0 ) {
                solutionCountElement.textContent = (appState.selectedSolution.getIndex() + 1) + " of " + solutionCount;
            } else {
                solutionCountElement.textContent = "";
            }
        }
    }

    function nextButtonHandler() {
        var min = 0,
            max = appState.solutionList.length() - 1,
            index = appState.selectedSolution.getIndex();

        index++;
        if (index > max) {
            index = max;
        }
        if (index < min) {
            index = min;
        }

        appState.selectedSolution.setIndex(index);
    }

    function prevButtonHandler() {
        var min = 0,
            max = appState.solutionList.length() - 1,
            index = appState.selectedSolution.getIndex();

        index--;
        if (index > max) {
            index = max;
        }
        if (index < min) {
            index = min;
        }

        appState.selectedSolution.setIndex(index);
    }

    this.initializeAsync = function () {
        pathListElement = document.getElementById("documentationList");
        solutionCountElement = document.getElementById("solutionCount");

        document.getElementById("nextOutputPath").addEventListener("click", nextButtonHandler);
        document.getElementById("previousOutputPath").addEventListener("click", prevButtonHandler);

        appState.solutionList.addEventListener("sizeChanged", update);
        appState.selectedSolution.addEventListener("indexChanged", update);
    };
});
