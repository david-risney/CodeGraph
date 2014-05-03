var PromiseJoinWithProgress = function (promiseFns) {
    var deferral = new Deferral(),
        promises = promiseFns.map(function (promiseFn) { return promiseFn(); }),
        joinedPromises = WinJS.Promise.join(promises);

    joinedPromises.then(function (success) {
        deferral.resolve(success);
    }, function (failure) {
        deferral.reject(failure);
    });

    promises.forEach(function (promise) {
        promise.then(undefined, undefined, function (progress) { deferral.notify(progress); });
    });

    return deferral.promise;
};