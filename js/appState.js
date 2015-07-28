var AppState = (function (codeStore) {
    function ArrayContainer() {
        var eventTarget = new EventTarget(this, ["changed"]),
            array = [];

        function areStringArraysEqual(arr1, arr2) {
            var equal = arr1.length === arr2.length;
            for (var index = 0; index < arr1.length && equal; ++index) {
                equal = arr1[index] == arr2[index];
            }
            return equal;
        }

        this.set = function (arrayIn) {
            if (!areStringArraysEqual(arrayIn, array)) {
                array = arrayIn;
                eventTarget.dispatchChangedEvent(this);
            }
        };

        this.get = function () {
            return array;
        }
    }

    var selectedSolution = new (function () {
        var eventTarget = new EventTarget(this, ["indexChanged"]),
            selectedIndex = 0;

        this.setIndex = function (newSelectedIndex) {
            newSelectedIndex = parseInt(newSelectedIndex);
            var indexChanged = selectedIndex !== newSelectedIndex;
            if (indexChanged) {
                selectedIndex = newSelectedIndex;
                eventTarget.dispatchIndexChangedEvent(this);
            }
        };

        this.getIndex = function () {
            return selectedIndex;
        };
    })();

    var solutionList = new (function () {
        var eventTarget = new EventTarget(this, ["sizeChanged"]),
            array = [];

        this.get = function (index) {
            return array[index];
        };
        this.length = function () {
            return array.length;
        };
        this.push = function (value) {
            array.push(value);
            eventTarget.dispatchSizeChangedEvent(this);
        };
        this.clear = function () {
            if (array.length > 0) {
                array = [];
                eventTarget.dispatchSizeChangedEvent(this);
            }
        };
    })();

    var pathRequirements = new ArrayContainer();
    var targetList = new ArrayContainer();
    targetList.set(["data/common.json"]);

    this.targetList = targetList;
    this.pathRequirements = pathRequirements;
    this.selectedSolution = selectedSolution;
    this.solutionList = solutionList;
});
