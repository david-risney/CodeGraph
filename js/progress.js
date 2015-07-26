var Progress = (function () {
    "use strict";

    function getProgressElement() { 
        return document.getElementsByTagName("progress")[0];
    }

    function arrayFrom(arrayLike) {
        var array = [];
        for (var idx = 0; idx < arrayLike.length; ++idx) {
            array.push(arrayLike[idx]);
        }
        return array;
    }

    var Progress = {};

    Progress.show = function (show) { getProgressElement().style.opacity = show ? 1 : 0; };
    Progress.initializeComplete = function () {
        arrayFrom(document.getElementsByClassName("waitForInitialized")).forEach(function (element) {
            element.style.opacity = "inherit";
        });

        Progress.show(false);
    };

    return Progress;
}());
