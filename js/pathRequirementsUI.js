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

    this.initializeAsync = function () {
        updateDataList();
        updateInputsCount();
        updateAppDataFromInputs();
    };
});
