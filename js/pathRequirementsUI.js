// Responsible for the path requirements input text boxes
var PathRequirementsUI = (function (codeStore, appState) {
    function arrayFrom(arrayLike) {
        var array = [];
        for (var index = 0; index < arrayLike.length; ++index) {
            array.push(arrayLike[index]);
        }
        return array;
    }

    function updateDataList() {
        var validMethodsAndTypes = document.getElementById("validMethodsAndTypes");
        validMethodsAndTypes.innerHTML = "";

        codeStore.getGraphs().dataGraph.getNodes().map(function (node) {
            var option = document.createElement("option");
            option.setAttribute("value", node.data.name);
            return option;
        }).forEach(function (nodeElement) {
            validMethodsAndTypes.appendChild(nodeElement);
        });
    }

    function createInput() {
        var newInput = document.getElementById("nodeNameInputTemplate").cloneNode(true);
        newInput.className = "nodeNameInput";
        newInput.addEventListener("blur", function () {
            updateInputsCount();
            updateAppDataFromInputs();
        });
        return newInput;
    }

    function updateAppDataFromInputs() {
        var inputs = arrayFrom(document.getElementsByClassName("nodeNameInput"));
        var paths = inputs.map(function (input) {
            return input.value;
        }).filter(function (value) {
            return value && value.length;
        });

        appState.pathRequirements.set(paths);
    }

    function updateInputsCount() {
        var inputs = arrayFrom(document.getElementsByClassName("nodeNameInput")),
            inputEntries = document.getElementById("inputEntries");

        if (inputs.length == 0 || (inputs[inputs.length - 1].value || "").length > 0) {
            inputEntries.appendChild(createInput());
        }

        while (inputs.length > 2 && 
            (inputs[inputs.length - 1].value || "").length == 0 &&
            (inputs[inputs.length - 2].value || "").length == 0) {

            var remove = inputs[inputs.length - 1];
            remove.parentElement.removeChild(remove);
            inputs = arrayFrom(document.getElementsByClassName("nodeNameInput"));
        }
    }

    appState.pathRequirements.addEventListener("changed", function () {
        var inputs = arrayFrom(document.getElementsByClassName("nodeNameInput")),
            requiredPaths = appState.pathRequirements.get(),
            inputEntries = document.getElementById("inputEntries");

        while (inputs.length < requiredPaths.length + 1) {
            inputEntries.appendChild(createInput());
            inputs = arrayFrom(document.getElementsByClassName("nodeNameInput"));
        }
        while (inputs.length > requiredPaths.length + 1) {
            var remove = inputs[inputs.length - 1];
            remove.parentElement.removeChild(remove);
            inputs = arrayFrom(document.getElementsByClassName("nodeNameInput"));
        }
        for (var index = 0; index <= requiredPaths.length; ++index) {
            inputs[index].value = index < requiredPaths.length ? requiredPaths[index] : "";
        }
    });

    appState.targetList.addEventListener("changed", function () {
        var targets = appState.targetList.get();
        var optionValue = "browser";
        var select = document.getElementById("targetList");

        if (targets.indexOf("data/win8.1-winrtjs.json") >= 0) {
            optionValue = "win81";
        } else if (targets.indexOf("data/ie11.json") >= 0) {
            optionValue = "ie11";
        }
        // else rely on initial default of browser

        arrayFrom(select.querySelector("option")).forEach(function (option) {
            option.selected = (option.getAttribute("value") === optionValue);
        });
    });

    this.initializeAsync = function () {
        updateDataList();
        updateInputsCount();
        updateAppDataFromInputs();

        document.getElementById("targetList").addEventListener("change", function () {
            var select = document.getElementById("targetList");
            var option = arrayFrom(select.querySelector("option")).filter(function (option) {
                return option.selected;
            })[0];
            var targets = ["data/common.json"];

            switch (option.value) {
            default:
            case "browser":
                break;
            case "ie11":
                targets = ["data/common.json", "data/ie11.json"];
                break;
            case "win81":
                targets = ["data/common.json", "data/ie11.json", "data/win8.1-winrtjs.json"];
                break;
            }
            appState.targetList.set(targets);
        });
    };
});
