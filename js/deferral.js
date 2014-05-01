var Deferral = function () {
    var resolve,
        reject,
        notify,
        promise = new WinJS.Promise(function (resolveIn, rejectIn, notifyIn) {
            resolve = resolveIn;
            reject = rejectIn;
            notify = notifyIn;
        });

    this.resolve = resolve;
    this.reject = reject;
    this.notify = notify;
    this.promise = promise;
};