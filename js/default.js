// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    var app = WinJS.Application;

    app.onready = function (args) {
        var codeStore = new CodeStore(),
            codeVisualizer = new CodeVisualizer(),
            pathLister = new PathLister(),
            codeGenerator = new CodeGenerator(),
            controls = new Controls();

        WinJS.UI.processAll().then(function() {
            return codeStore.initializeAsync(["data/ie11.json"]);
        }).then(function () {
            return codeVisualizer.initializeAsync(codeStore, "graph");
        }).then(function () {
            return codeGenerator.initializeAsync(codeStore, "output");
        }).then(function () {
            return controls.initializeAsync(codeStore);
        }).then(function () {
            return pathLister.initializeAsync(codeStore, "pathList");
        }).then(function () {
            hljs.configure({ tabReplace: '    ' });
            hljs.initHighlightingOnLoad();
        });
    };

    app.oncheckpoint = function (args) {
    };

    app.start();
})();
