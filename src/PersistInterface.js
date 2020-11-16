/**
 * Persist
 *
 * For persist you have two interfacing methods:
 * addProperties ( { data, matchEvent, duration, renew } )
 * getProperties( { matchEvent } ) --> return an object of all properties that should be returned for that matching event.
 *
 * @constructor
 */

function PersistInterface(storePostfix) {
    this.LASTING_COOKIE_LIFETIME = 2 * 365 * 24 * 60 * 60; // Cookie lifetime of 2 years
    this.storePostFix = "deq_pers_" + storePostfix;

    // region Helper functions
    // mergeObj: recursively merge multiple objects (Paul Spaulding http://stackoverflow.com/a/16178864)
    function mergeObj() {
        var dst = {},
            src,
            p,
            args = [].splice.call(arguments, 0);

        while (args.length > 0) {
            src = args.splice(0, 1)[0];
            if (Object.prototype.toString.call(src) == "[object Object]") {
                for (p in src) {
                    if (src.hasOwnProperty(p)) {
                        if (
                            Object.prototype.toString.call(src[p]) ==
                            "[object Object]"
                        ) {
                            dst[p] = mergeObj(dst[p] || {}, src[p]);
                        } else {
                            dst[p] = src[p];
                        }
                    }
                }
            }
        }
        return dst;
    }

    // copyObj: returns a copy of an object that does not reference to the object copied from. Circular references in objects are not allowed.
    function copyObj(obj) {
        // return JSON.parse(JSON.stringify(obj || {}));
        return mergeObj({}, obj);
    }

    /***
     * Set cookie on top level domain
     *
     * @param d cookie name
     * @param e cookie value
     * @param a expiration value in seconds
     * @param o the domain on which to set this cookie
     * @param p the path on which the cookie to set
     * @param b leave undefined - used internally
     * @param c leave undefined - used internally
     */
    function setCookie(d, e, a, o, p, b, c) {
        c = "";
        if (a) {
            a = Number(a);
            b = new Date();
            b.setSeconds(b.getSeconds() + a);
            c = ";expires=" + b.toUTCString();
        }
        var domain = "";
        o = o || getTopLevelDomain();
        if (o.indexOf(".") > 0) {
            domain = ";domain=." + o;
        }
        if (!p) {
            p = "/";
        }
        document.cookie =
            d + "=" + encodeURIComponent(e) + c + ";path=" + p + domain + ";SameSite=Lax";
    }

    /***
     * Read value from cookie
     * @param a should contain the name of the cookie
     * @param b leave undefined - used internally
     * @returns {*} returns cookie value as string or null if cookie not found
     */
    function getCookie(a, b) {
        return (b = document.cookie.match("(^|;)\\s*" + a + "\\s*=\\s*([^;]+)"))
            ? decodeURIComponent(b.pop())
            : null;
    }

    function getTopLevelDomain(host) {
        host = host || document.location.hostname;
        var splitDomain = host.split(".");
        var topDomain = splitDomain[splitDomain.length - 1]; // support for single level domains e.g. localhost
        if (splitDomain.length > 1) {
            var secondLevel = splitDomain[splitDomain.length - 2]; // support for regular domains e.g. domain.de / domain.nl
            topDomain = secondLevel + "." + topDomain;
            if (secondLevel === "com" || secondLevel === "co") {
                // support for double top level domains e.g. domain.co.uk, domain.com.au
                topDomain =
                    splitDomain[splitDomain.length - 3] + "." + topDomain;
            }
        }
        return topDomain;
    }

    // endregion

    // region PersistStore object

    function DEQPersistStore(cookieName, cookieLifetime) {
        this.storage = {};
        this.COOKIE_NAME = cookieName;
        this.COOKIE_LIFETIME = cookieLifetime;
    }
    DEQPersistStore.prototype = {
        loadPropertiesFromBackend: function() {
            var loaded = getCookie(this.COOKIE_NAME);
            if (loaded != null) {
                this.storage = JSON.parse(loaded);
            }
        },

        checkAndUpdateExpiryAttributes: function() {
            var now = Date.now();
            var curEvents = Object.keys(this.storage);
            // Travel through all eventMatches and all data keys within those.
            for (var i = 0, j = curEvents.length; i < j; i++) {
                var curEvent = this.storage[curEvents[i]];
                var curDataKeys = Object.keys(curEvent["dataAttributes"]);
                for (var k = 0, l = curDataKeys.length; k < l; k++) {
                    var curDataAttribute =
                        curEvent["dataAttributes"][curDataKeys[k]];
                    if (
                        !isNaN(curDataAttribute["expiry"]) &&
                        parseInt(curDataAttribute["expiry"]) < now
                    ) {
                        this.remove(curDataKeys[k], curEvents[i]);
                    } else if (
                        curDataAttribute["renew"] &&
                        !isNaN(curDataAttribute["renew"])
                    ) {
                        // Update
                        curDataAttribute["expiry"] = this.determineExpiry({
                            duration: curDataAttribute["renew"]
                        });
                    }
                }
            }
        },

        loadProperties: function() {
            this.loadPropertiesFromBackend();
            this.checkAndUpdateExpiryAttributes();
        },

        saveProperties: function() {
            setCookie(
                this.COOKIE_NAME,
                JSON.stringify(this.storage),
                this.COOKIE_LIFETIME
            );
        },

        addProperties: function(args) {
            // Only use matchEvent and data
            var current = this.storage[args["matchEvent"]] || {
                data: {},
                dataAttributes: {}
            };

            var dataKeys = Object.keys(args["data"]);
            for (var i = 0, j = dataKeys.length; i < j; i++) {
                var curKey = dataKeys[i];
                // Store the data
                current["data"][curKey] = args["data"][curKey];
                // Store the data attributes
                current["dataAttributes"][curKey] = {
                    expiry: this.determineExpiry(args),
                    renew:
                        args["renew"] && !isNaN(args["duration"])
                            ? args["duration"]
                            : false
                };
            }

            this.storage[args["matchEvent"]] = current;
        },

        getProperties: function(args) {
            if (
                !(
                    args.hasOwnProperty("matchEvent") &&
                    typeof args["matchEvent"] == "string"
                )
            )
                throw new Error("Invalid input for matchEvent property");

            // Return all properties that match matchEvent
            var result = {};

            var eventChecks = Object.keys(this.storage);
            for (var i = 0, j = eventChecks.length; i < j; i++) {
                var eventRegex = new RegExp("^" + eventChecks[i] + "$", "i"); // Note: case insensitive
                if (args["matchEvent"].match(eventRegex)) {
                    result = mergeObj(
                        result,
                        this.storage[eventChecks[i]]["data"]
                    );
                }
            }

            return result;
        },

        findEventMatchForKey: function(key) {
            var eventMatches = Object.keys(this.storage);

            for (var i = 0, j = eventMatches.length; i < j; i++) {
                if (this.storage[eventMatches[i]]["data"].hasOwnProperty(key))
                    return eventMatches[i];
            }
        },

        remove: function(key, specificEventMatch) {
            // Search for key in all eventMatches
            var curEventMatch =
                specificEventMatch || this.findEventMatchForKey(key);
            while (curEventMatch) {
                delete this.storage[curEventMatch]["data"][key];
                delete this.storage[curEventMatch]["dataAttributes"][key];
                curEventMatch = specificEventMatch
                    ? false
                    : this.findEventMatchForKey(key); // If no specific eventMatch was given, check for next eventMatch.
            }
        },

        determineExpiry: function(args) {
            if (args["duration"]) {
                var d = new Date();
                return isNaN(args["duration"])
                    ? args["duration"]
                    : d.setSeconds(d.getSeconds() + parseInt(args["duration"]));
            }
            return args["duration"];
        }
    };

    function MemoryStore() {
        this.backendStorage = {};
    }
    MemoryStore.prototype = new DEQPersistStore();
    MemoryStore.prototype.constructor = MemoryStore;
    MemoryStore.prototype.loadPropertiesFromBackend = function() {
        this.storage = copyObj(this.backendStorage);
    };
    MemoryStore.prototype.saveProperties = function() {
        this.backendStorage = copyObj(this.storage);
    };

    // function SessionStore(storageName) {
    //     this.STORAGE_NAME = storageName || 'deq_pers_s';
    // }
    // SessionStore.prototype = new DEQPersistStore;
    // SessionStore.prototype.constructor = SessionStore;
    // SessionStore.prototype.saveProperties = function () {
    //     window.sessionStorage.setItem(this.STORAGE_NAME,JSON.stringify(this.storage));
    // };
    // SessionStore.prototype.loadPropertiesFromBackend = function () {
    //     var string = window.sessionStorage.getItem(this.STORAGE_NAME);
    //     if (string) {
    //         this.storage = JSON.parse(string);
    //     }
    // };
    //
    // function LocalStore(storageName) {
    //     this.STORAGE_NAME = storageName || 'deq_pers_l';
    // }
    // LocalStore.prototype = new DEQPersistStore;
    // LocalStore.prototype.constructor = LocalStore;
    // LocalStore.prototype.saveProperties = function () {
    //     window.localStorage.setItem(this.STORAGE_NAME,JSON.stringify(this.storage));
    // };
    // LocalStore.prototype.loadPropertiesFromBackend = function () {
    //     var string = window.localStorage.getItem(this.STORAGE_NAME);
    //     if (string) {
    //         this.storage = JSON.parse(string);
    //     }
    // };

    function DeferStore(storageName) {
        this.STORAGE_NAME = storageName || "deq_defer";
        DEQPersistStore.call(this, storageName);
    }
    DeferStore.prototype = new DEQPersistStore();
    DeferStore.prototype.constructor = DeferStore;
    // DeferStore.prototype.saveProperties = function () {
    //     window.sessionStorage.setItem(this.STORAGE_NAME,JSON.stringify(this.storage));
    // };
    // DeferStore.prototype.loadPropertiesFromBackend = function () {
    //     var string = window.sessionStorage.getItem(this.STORAGE_NAME);
    //     if (string) {
    //         this.storage = JSON.parse(string);
    //     }
    // };
    DeferStore.prototype.getProperties = function(args) {
        if (
            !(
                args.hasOwnProperty("matchEvent") &&
                typeof args["matchEvent"] == "string"
            )
        )
            throw new Error("Invalid input for matchEvent property");

        // Return all properties that match matchEvent
        var result = {};

        var eventChecks = Object.keys(this.storage);
        for (var i = 0, j = eventChecks.length; i < j; i++) {
            var eventRegex = new RegExp("^" + eventChecks[i] + "$", "i"); // Note: case insensitive
            if (args["matchEvent"].match(eventRegex)) {
                var data = this.storage[eventChecks[i]]["data"];
                result = mergeObj(result, data);
                // For Defer, all matches should be removed from the store.
                var curDataKeys = Object.keys(data);
                for (var k = 0, l = curDataKeys.length; k < l; k++) {
                    this.remove(curDataKeys[k], eventChecks[i]);
                }
            }
        }
        return result;
    };

    // endregion

    // region PersistInterface logic

    var PERSIST = this;
    // Init stores
    PERSIST.myPageloadStorage = new MemoryStore();
    // PERSIST.mySessionStorage = (window && window.sessionStorage)    ? new SessionStore(this.storePostFix+'_s')  : new DEQPersistStore(this.storePostFix+'_s');
    PERSIST.mySessionStorage = new DEQPersistStore(this.storePostFix + "_s");
    // PERSIST.myLastingStorage = (window && window.localStorage)      ? new LocalStore(this.storePostFix+'_l')    : new DEQPersistStore(this.storePostFix+'_l', this.LASTING_COOKIE_LIFETIME);
    PERSIST.myLastingStorage = new DEQPersistStore(
        this.storePostFix + "_l",
        this.LASTING_COOKIE_LIFETIME
    );
    PERSIST.myDeferStorage = new DeferStore(this.storePostFix + "_d");

    /** New functions **/

    /**
     * Make sure all stores are refreshed.
     */
    PERSIST.loadStores = function() {
        PERSIST.myLastingStorage.loadProperties();
        PERSIST.mySessionStorage.loadProperties();
        PERSIST.myPageloadStorage.loadProperties();
        PERSIST.myDeferStorage.loadProperties();
    };

    /**
     * Make sure the current state of the store is saved in the cookie
     */
    PERSIST.saveStores = function() {
        PERSIST.myLastingStorage.saveProperties();
        PERSIST.mySessionStorage.saveProperties();
        PERSIST.myPageloadStorage.saveProperties();
        PERSIST.myDeferStorage.saveProperties();
    };

    /**
     * Return the storage to use based on the value of duration
     * @param duration
     * @returns {PersistStore}
     */
    PERSIST.getStorageForDuration = function(duration) {
        if (duration === "DEFER") return PERSIST.myDeferStorage;
        if (duration === "PAGELOAD") return PERSIST.myPageloadStorage;
        if (duration === "SESSION") return PERSIST.mySessionStorage;
        duration = parseInt(duration);
        if (!isNaN(duration)) return PERSIST.myLastingStorage;

        // Fallback to default session storage.
        return PERSIST.mySessionStorage;
    };

    /**
     * Delete a property with a specific key from the store it is currently stored in.
     * @param key
     */
    PERSIST.deletePropertyWithKey = function(key) {
        // var oldRef = getRef(key);
        // if (oldRef) oldRef.remove(key);

        // Try to delete for each store
        PERSIST.myPageloadStorage.remove(key);
        PERSIST.mySessionStorage.remove(key);
        PERSIST.myLastingStorage.remove(key);
        PERSIST.myDeferStorage.remove(key);
    };

    /**
     * Delete all properties that are in the data object, independent on the store it is stored in.
     * @param data
     */
    PERSIST.deleteProperties = function(data) {
        var keys = Object.keys(data);
        for (var i = 0, j = keys.length; i < j; i++) {
            PERSIST.deletePropertyWithKey(keys[i]);
        }
    };

    /**
     * Add a set of properties to the correct persist storage
     *
     * @param args {object} Should contain three or four properties:
     * @param args.data {object} containing the data to persist
     * @param args.matchEvent {string} containing the event to match for returning these properties
     * @param args.duration {int|string} contains the value how long to persist
     * @param args.renew {boolean} [optional] contains a boolean that determines of an integer duration should be renewed everytime the cookie is touched.
     */
    PERSIST.addProperties = function(args) {
        // Input check
        if (!(args.hasOwnProperty("data") && typeof args["data"] == "object"))
            throw new Error("Invalid input for data property");
        if (
            !(
                args.hasOwnProperty("matchEvent") &&
                typeof args["matchEvent"] == "string"
            )
        )
            throw new Error("Invalid input for matchEvent property");
        //if (!(args.hasOwnProperty('duration') && (typeof(args['duration']) == 'number') || typeof(args['duration']) == 'string')) throw new Error('Invalid input for data property'); // Duration is optional
        // no check for renew

        // Make sure all stores are up to date
        PERSIST.loadStores();

        // Remove any existing value, this has to be done one by one, since we do not know what storage this value was stored in.
        PERSIST.deleteProperties(args.data);

        // Get the store and forward the data to the correct store.
        var store = PERSIST.getStorageForDuration(args.duration);
        store.addProperties(args);

        // Finally save the new states of the stores. All stores, since variables might also be deleted. (TODO: if we want to make this smarter, each store should decide for themselfes if it is changed between a call for load and save)
        PERSIST.saveStores();
    };

    /**
     * Return all the persisted properties that match the event matchEvent
     *
     * @param args {object} Should contain three or four properties:
     * @param args.matchEvent {string} containing the event to match for returning these properties
     */
    PERSIST.getProperties = function(args) {
        // Input check
        if (
            !(
                args.hasOwnProperty("matchEvent") &&
                typeof args["matchEvent"] == "string"
            )
        )
            throw new Error("Invalid input for matchEvent property");

        // Make sure all stores are up to date
        PERSIST.loadStores();

        // Get the three results
        var fromPageLoadStore = PERSIST.myPageloadStorage.getProperties(args);
        var fromSessionStore = PERSIST.mySessionStorage.getProperties(args);
        var fromLastingStore = PERSIST.myLastingStorage.getProperties(args);
        var fromDeferStore = PERSIST.myDeferStorage.getProperties(args);

        // Update the stored data, where expired data may have been updated.
        PERSIST.saveStores();

        return mergeObj(
            fromLastingStore,
            fromSessionStore,
            fromPageLoadStore,
            fromDeferStore
        );
    };

    // endregion
}

module.exports = PersistInterface;

// TODO: add clearAll
// TODO: add getRawStorage
