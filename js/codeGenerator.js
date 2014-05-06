var CodeGenerator = function () {
    var parent,
        codeStore;

    function refresh(path) {
        var code = "$next",
            lastInput,
            clone = function(obj) { return JSON.parse(JSON.stringify(obj)); },
            existingVariables = [],
            frames = path ? path.getNodes().filter(function (node) { return node.data.data.code; }).map(function (node) { return node.data.data; }) : [],
            firstFrame = { code: "", "in": [], out: [] },
            secondFrame = frames.length ? frames[0] : null,
            lastFrame = { code: "// ...", "in": [], out: [] };

        if (secondFrame) {
            firstFrame.out = secondFrame.in;
            firstFrame.code = firstFrame.out.map(function (outVariable) {
                return "var $" + outVariable.name + " = null; // Your variable here.";
            }).join("\n") + "\n$next";
            frames = [firstFrame].concat(frames).concat([lastFrame]);
        }
                
        frames.forEach(function (data) {
            var codeFilled = data.code,
                replacements = [],
                newVariables = [],
                indent = "";

            data.in.map(function (inVariable) {
                var existingVariable = existingVariables.filter(function (existingVariable) {
                    return existingVariable.type === inVariable.type;
                })[0];
                replacements.push({ oldName: inVariable.name, newName: existingVariable.name });
            });
            newVariables = clone(data.out).map(function (newVariable) {
                newVariable.newName = newVariable.name;
                return newVariable;
            });
            data.out.map(function (outVariable) {
                var existingReplacement = replacements.filter(function (entry) { return entry.oldName === outVariable.name; })[0];
                replacements.push(existingReplacement || { oldName: outVariable.name, newName: outVariable.name });
            });
            existingVariables = existingVariables.concat(newVariables);

            codeFilled = replacements.sort(function (left, right) { return right.oldName.length - left.oldName.length; }).
                reduce(function (codeFilled, entry) { return codeFilled.replace("$" + entry.oldName, entry.newName); }, codeFilled);
                    
            indent = /\n(\t*)\$next/.exec(code);
            indent = (indent && indent[1]) || "";
                    
            codeFilled = codeFilled.split("\n").map(function (line, idx) { return idx === 0 ? line : indent + line; }).join("\n");
            code = code.replace("$next", codeFilled);
        });
        code = code.replace(/\t/g, "    ");

        parent.innerHTML = "";
        parent.appendChild(ObjectToHtml({ pre: {}, c: [{ code: {}, t: code }] }));
        hljs.highlightBlock(parent);
    }

    this.initializeAsync = function (codeStoreIn, listParentName) {
        codeStore = codeStoreIn;
        parent = document.getElementById(listParentName);
        codeStore.getGraphs().selectedSolution.addEventListener("indexChanged", function () {
            var index = codeStore.getGraphs().selectedSolution.getIndex(),
                solution;
            if (index < codeStore.getGraphs().solutions.length && index >= 0) {
                solution = codeStore.getGraphs().solutions.getAt(index);
            }
            refresh(solution);
        });
    };
};