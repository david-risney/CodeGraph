(function () {
    "use strict";

    var app = WinJS.Application;

    app.onready = function () {
        var codeStore = new CodeStore(),
            appState = new AppState(),
            appLogic = new AppLogic(codeStore, appState),
            pathListerUI = new PathListerUI(appState),
            pathRequirementsUI = new PathRequirementsUI(codeStore, appState),
            jsBinEmbedUI = new JsBinEmbedUI(codeStore, appState),
            history = new History(appState);

        WinJS.UI.processAll().then(function () {
            history.restoreStateFromCurrentLocation();

            return codeStore.initializeAsync(appState.targetList.get());
        }).then(function () {
            return pathRequirementsUI.initializeAsync();
        }).then(function () {
            return pathListerUI.initializeAsync();
        }).then(function () {
            return jsBinEmbedUI.initializeAsync();
        }).then(function () {
            Progress.initializeComplete();
        }, function (error) {
            document.getElementById("error").textContent = "Error loading: " + error;
        });
    };

    app.start();
}());
