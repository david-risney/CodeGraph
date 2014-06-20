var promiseJoinWithProgress = function (promiseFns, options) {
    "use strict";

    var deferral = new Deferral(),
        promises = promiseFns.map(function (promiseFn) { return promiseFn(); }),
        joinedPromises = WinJS.Promise.join(promises),
	completedCount = 0,
	logCompletion = function () {
            if (options.console) {
                options.console.log("Join " + completedCount + " of " + promises.length + " done.");
            }
        };

    joinedPromises.then(function (success) {
        deferral.resolve(success);
    }, function (failure) {
        deferral.reject(failure);
    });

    promises.forEach(function (promise) {
        promise.then(
            function () { ++completedCount; logCompletion(); },
            function () { ++completedCount; logCompletion(); },
            function (progress) { deferral.notify(progress); });
    });

    return deferral.promise;
};
