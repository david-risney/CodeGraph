var PathLister = (function () {
    "use strict";

    var itemTemplate = function (itemPromise) {
        return itemPromise.then(function (item) {
            return objectToHtml({div: { className: "full-width" }, c: [{
                h2: {},
                s: { display: "inline-block" },
                c: [
                    { span: {}, t: item.index},
                    { sup: {}, t: " of " + WinJSGlobalCodeStore.bindingList.length }
                ]
            }, {
                div: {},
                s: { display: "inline-block" },
                c: [{div: {}, t: item.data.getFirstNode().data.name}, {div: {}, t: "to"}, {div: {}, t: item.data.getLastNode().data.name}]
            }, {
                ol: {},
                s: { display: "inline-block" },
                c: item.data.getNodes().map(function (node) {
                    return { li: {}, t: node.data.name };
                })
            }]
                });
        });
    };

    WinJS.Namespace.define("WinJSGlobalPathLister", {
        itemTemplate: itemTemplate
    });
    WinJS.Utilities.markSupportedForProcessing(WinJSGlobalPathLister.itemTemplate);

    return function () {
        this.initializeAsync = function (codeStore, listParentName) {
            var element = document.getElementById(listParentName);

            element.winControl.addEventListener("pageselected", function () {
                codeStore.getGraphs().selectedSolution.setIndex(element.winControl.currentPage);
            });
        };
    };
}());