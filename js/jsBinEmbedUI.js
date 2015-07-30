var JsBinEmbedUI = (function (codeStore, appState) {
    var currentSolution;

    function postData(url, map) {
        var form = document.createElement("form");
        form.setAttribute("class", "displayNone");
        form.setAttribute("method", "POST");
        form.setAttribute("target", "playground");
        form.setAttribute("action", url);

        Object.keys(map).map(function (propertyName) {
            var value = map[propertyName];
            var input = document.createElement("textarea");
            input.setAttribute("name", propertyName);
            input.textContent = value;
            return input;
        }).forEach(function (input) {
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        form.parentElement.removeChild(form);
    }

    function postDataJsBin(js) {
        postData("http://jsbin.com/?output,html,js", {
            html: "<!doctype html><html><head><title>code page</title></head><body></body></html>", 
            javascript: js,
        });
    }

    function postDataFiddle(js) {
        postData("http://jsfiddle.net/api/post/library/pure/", {
            html: "",
            css: "", 
            js: js,
            wrap: "d"
        });
    }

    function update() {
        var newSolution = appState.solutionList.get(appState.selectedSolution.getIndex());
        if (newSolution != currentSolution) {
            var js = codeStore.pathToCode(newSolution);
            postDataFiddle(js);
            currentSolution = newSolution;
        }
    }

    this.initializeAsync = function () {
        appState.solutionList.addEventListener("sizeChanged", update);
        appState.selectedSolution.addEventListener("indexChanged", update);

        update();
    };
});
