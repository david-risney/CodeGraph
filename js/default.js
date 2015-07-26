(function () {
    "use strict";

    var app = WinJS.Application;

    app.onready = function () {
        var codeStore = new CodeStore(),
            appState = new AppState(codeStore),
            pathListerUI = new PathListerUI(appState),
            pathRequirementsUI = new PathRequirementsUI(codeStore, appState),
            jsBinEmbedUI = new JsBinEmbedUI(codeStore, appState),
            history = new History(appState);

        WinJS.UI.processAll().then(function () {
            return codeStore.initializeAsync(["data/common.json", "data/ie11.json", "data/win8.1-winrtjs.json"]);
        }).then(function () {
            return pathRequirementsUI.initializeAsync();
        }).then(function () {
            return pathListerUI.initializeAsync();
        }).then(function () {
            return jsBinEmbedUI.initializeAsync();
        }).then(function () {
            Progress.initializeComplete();
            history.restoreStateFromCurrentLocation();
        }, function (error) {
            document.getElementById("error").textContent = "Error loading: " + error;
        });
    };

    app.start();
}());
