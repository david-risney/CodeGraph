var History = (function (appState) {
    function parseQuery(paramsString) {
        if (paramsString[0] === "?" || paramsString[1] === "#") {
            paramsString = paramsString.substr(1);
        }

        return paramsString.split("&").map(function (nameValueString) {
            return nameValueString.split("=");
        }).map(function (nameValuePair) {
            nameValuePair[1] = nameValuePair[1].split(",").map(decodeURIComponent);
            return nameValuePair;
        }).reduce(function (collection, next) {
            collection[next[0]] = next[1];
            return collection;
        }, { });
    }

    function constructQuery(params, prefix) {
        function stringify(value) {
            var string = value.toString();
            if (value.length > 0 && value.map) {
                string = value.map(encodeURIComponent).join(",");
            }
            return string;
        }

        var paramsString = Object.keys(params).map(function (keyName) {
            return [encodeURIComponent(keyName), stringify(params[keyName])].join("=");
        }).join("&");

        if (prefix) {
            paramsString = prefix + paramsString;
        }
        return paramsString;
    }

    function applyParamsToState(paramsString) {
        var params = parseQuery(paramsString);
        if (params.hasOwnProperty("index")) {
            appState.selectedSolution.setIndex(parseInt(params.index[0]));
        }

        if (params.hasOwnProperty("q")) {
            appState.pathRequirements.set(params.q);
        }
        else if (params.hasOwnProperty("from") && params.hasOwnProperty("to")) {
            appState.pathRequirements.set(params.from.concat(params.to));
        }

        if (params.hasOwnProperty("t")) {
            appState.targetList.set(params.t);
        }
    }

    function currentStateToParamsString() {
        var params = { };
        var index = appState.selectedSolution.getIndex();
        var requiredNodes = appState.pathRequirements.get();
        var targetList = appState.targetList.get();

        if (index > 0) {
            params.index = index;
        }
        if (requiredNodes.length > 0) {
            params.q = requiredNodes;
        }
        if (targetList.length !== 1) { // Need a better more generic way of telling if we have the default value and so don't want to serialize something out.
            params.t = targetList;
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

    appState.targetList.addEventListener("changed", function () {
        pushState();
    });
});
