var AsyncReentrancyGuard = (function (root) {
    "use strict";

    var Promise = {
            wrap: null,
            wrapError: null,
            defer: null
        },
        Q;

    if (typeof root.Q !== "undefined") {
        Promise.defer = root.Q.defer;
        Promise.wrap = root.Q;
        Promise.wrapError = root.Q.reject
    }
    else if (typeof root.WinJS !== "undefined") {
        Promise.defer = function () {
            var resolve,
                reject,
                notify,
                promise = new root.WinJS.Promise(function (resolveIn, rejectIn, notifyIn) {
                    resolve = resolveIn;
                    reject = rejectIn;
                    notify = notifyIn;
                });

            return {
                promise: promise,
                resolve: resolve,
                reject: reject,
                notify: notify
            };
        }
        Promise.wrap = WinJS.Promise.wrap;
        Promise.wrapError = WinJS.Promise.wrapError;
    }
    else if (typeof root.require !== "undefined") {
        Q = require("./q");
        Promise.defer = Q.defer;
        Promise.wrap = Q;
        Promise.wrapError = Q.reject
    }

    var LazyPromise = function (promiseFnIn) {
        if (!this instanceof LazyPromise) {
            throw new TypeError("LazyPromise is a constructor and must be called with new.");
        }

        var defer = Promise.defer(),
            promiseFn,
            settleRequested = false,
            startRequirementsMet = false;

        var checkForStartRequirements = function () {
            if (!startRequirementsMet) {
                if (settleRequested && promiseFn) {
                    startRequirementsMet = true;
                    promiseFn().then(function (result) {
                        defer.resolve(result);
                    },
                    function (error) {
                        defer.reject(error);
                    });
                }
            }
        }

        this.settleAsync = function () {
            settleRequested = true;
            checkForStartRequirements();
            return defer.promise;
        }

        this.setPromiseFunction = function (promiseFnIn) {
            if (promiseFn) {
                throw Error("LazyPromise promise may only be set once.");
            }
            promiseFn = promiseFnIn;
            checkForStartRequirements();
        }

        if (promiseFnIn) {
            this.setPromiseFunction(promiseFnIn);
        }
    }

    var PromiseSerializer = function () {
        if (!this instanceof PromiseSerializer) {
            throw new TypeError("PromiseSerializer is a constructor and must be called with new.");
        }

        var afterLastPromise = Promise.wrap();

        this.startLastAsync = function (promiseFn) {
            var deferral = Promise.defer(),
                currentAfterLastPromise = afterLastPromise;

            afterLastPromise = deferral.promise;

            return currentAfterLastPromise.then(promiseFn).then(function (result) {
                deferral.resolve(result);
                return result;
            }, function (error) {
                deferral.reject(error);
                throw error;
            });
        }
    }

    var PromiseGate = function (ifIdlePromiseFnIn) {
        var currentlySettlingPromise = null,
            ifIdlePromiseFn;

        var startWrappedPromise = function(promiseFn) {
            return promiseFn().then(function (result) {
                currentlySettlingPromise = null;
                return result;
            }, function (error) {
                currentlySettlingPromise = null;
                throw error;
            });
        }

        var defaultFailPromiseFn = function () {
            return Promise.wrapError();
        }

        this.startIfIdleOrGetCurrentAsync = function () {
            if (!currentlySettlingPromise) {
                currentlySettlingPromise = startWrappedPromise(ifIdlePromiseFn);
            }
            return currentlySettlingPromise;
        }

        this.startIfIdleOrFailAsync = function (ifBusyFailPromiseFnIn) {
            var resultPromise,
                ifBusyFailPromiseFn = ifBusyFailPromiseFnIn || defaultFailPromiseFn;

            if (!currentlySettlingPromise) {
                resultPromise = currentlySettlingPromise = startWrappedPromise(ifIdlePromiseFn);
            }
            else {
                resultPromise = ifBusyFailPromiseFn();
            }
            return resultPromise;
        }

        ifIdlePromiseFn = ifIdlePromiseFnIn;
    }

    return {
        LazyPromise: LazyPromise,
        PromiseSerializer: PromiseSerializer,
        PromiseGate: PromiseGate
    };
})(this);