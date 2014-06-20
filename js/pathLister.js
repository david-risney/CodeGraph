var PathLister = (function () {
    "use strict";

    var codeStore,
        itemTemplate = function (itemPromise) {
            var deferral = new Deferral();

            setTimeout(function () {
                itemPromise.then(function (item) {
                    deferral.resolve(objectToHtml({
                        div: { className: "full-width" }, c: [{
                            h2: {},
                            s: { display: "inline-block" },
                            c: [
                                { span: {}, t: (item.index ? item.index : 0) + 1 }
                            ]
                        }, {
                            div: {},
                            s: { display: "inline-block" },
                            c: [{ div: {}, t: item.data.getFirstNode().data.name }, { div: {}, t: "to" }, { div: {}, t: item.data.getLastNode().data.name }]
                        }]
                    }));
                }, function (error) {
                    deferral.reject(error);
                });
            }, 0);

            return deferral.promise;
        };

    WinJS.Namespace.define("WinJSGlobalPathLister", {
        itemTemplate: itemTemplate
    });
    WinJS.Utilities.markSupportedForProcessing(WinJSGlobalPathLister.itemTemplate);

    return function () {
        this.initializeAsync = function (codeStoreIn, listParentName) {
            codeStore = codeStoreIn;
            var element = document.getElementById(listParentName);

            element.winControl.addEventListener("pageselected", function () {
                codeStore.getGraphs().selectedSolution.setIndex(element.winControl.currentPage);
            });
        };
    };
}());
