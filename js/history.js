var History = (function (appState) {
    function parseQuery(paramsString) {
        if (paramsString[0] === "?" || paramsString[1] === "#") {
            paramsString = paramsString.substr(1);
        }

        return paramsString.split("&").map(function (nameValueString) {
            return nameValueString.split("=").map(decodeURIComponent);
        }).reduce(function (collection, next) {
            collection[next[0]] = next[1];
            return collection;
        }, { });
    }

    function constructQuery(params, prefix) {
        var paramsString = Object.keys(params).map(function (keyName) {
            return [keyName, params[keyName]].map(encodeURIComponent).join("=");
        }).join("&");

        if (prefix) {
            paramsString = prefix + paramsString;
        }
        return paramsString;
    }

    function applyParamsToState(paramsString) {
        var params = parseQuery(paramsString);
        if (params.hasOwnProperty("index")) {
            appState.selectedSolution.setIndex(params.index);
        }
        if (params.hasOwnProperty("q")) {
            appState.pathRequirements.set(
                params.q.split(",").map(decodeURIComponent));
        }
    }

    function currentStateToParamsString() {
        var params = { };
        var index = appState.selectedSolution.getIndex();
        var requiredNodes = appState.pathRequirements.get();

        if (index > 0) {
            params.index = "" + index;
        }
        if (requiredNodes.length > 0) {
            params.q = requiredNodes.map(encodeURIComponent).join(",");
        }
        return constructQuery(params);
    }

    this.restoreStateFromCurrentLocation = function () {
        applyParamsToState(location.search);
    };

    window.addEventListener("popstate", function (e) {
        applyParamsToState(location.search);
    });

    function pushState() {
        var paramsString = currentStateToParamsString();
        var uriBase = location.toString();
        var queryIndex = uriBase.indexOf("?");
        if (queryIndex >= 0) {
            uriBase = uriBase.substr(0, queryIndex);
        }
        var newUri = uriBase;
        if (paramsString.length > 0) {
            newUri += "?" + paramsString;
        }
        history.pushState(null, null, newUri);
    }

    appState.pathRequirements.addEventListener("changed", function () {
        pushState();
    });

    appState.selectedSolution.addEventListener("indexChanged", function () {
        pushState();
    });
});
