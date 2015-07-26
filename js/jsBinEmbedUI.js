var JsBinEmbedUI = (function (codeStore, appState) {
    var currentSolution;

    function postData(map) {
        var form = document.createElement("form");
        form.setAttribute("class", "displayNone");
        form.setAttribute("method", "POST");
        form.setAttribute("target", "playground");
        form.setAttribute("action", "http://jsfiddle.net/api/post/library/pure/");

        Object.keys(map).map(function (propertyName) {
            var value = map[propertyName];
            var input = document.createElement("textarea");
            input.setAttribute("name", propertyName);
            input.textContent = value;
            return input
        }).forEach(function (input) {
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        form.parentElement.removeChild(form);
    }

    function update() {
        var newSolution = appState.solutionList.get(appState.selectedSolution.getIndex());
        if (newSolution != currentSolution) {
            postData({
                html: "", 
                css: "", 
                js: codeStore.pathToCode(newSolution),
                wrap: "d"
            });
            currentSolution = newSolution;
        }
    }

    this.initializeAsync = function () {
        appState.solutionList.addEventListener("sizeChanged", update);
        appState.selectedSolution.addEventListener("indexChanged", update);
    };
});
