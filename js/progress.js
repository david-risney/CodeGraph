var Progress = (function () {
    "use strict";

    var Progress = {};

    Progress.show = function (show) { document.getElementsByTagName("progress")[0].style.opacity = show ? 1 : 0; };
    Progress.initializeComplete = function () {
        var idx = 0,
            elements;

        elements = document.getElementsByClassName("waitForInitialized");

        for (idx = 0; idx < elements.length; idx += 1) {
            elements[idx].style.opacity = "inherit";
        }
        Progress.show(false);
    };

    return Progress;
}());