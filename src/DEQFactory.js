try {
    var DigitalEventQueue = require("./DigitalEventQueueWithPersist");
} catch (e) {
    var DigitalEventQueue = require("./DigitalEventQueue");
}

/***
 * DEQ factory is a singleton factory that has two methods, being DEQFactory.get and DEQFactory.getAll
 * See the description below (in the public interface section) for more information regarding those methods.
 ***/
var DEQFactory =
    typeof DEQFactory == "object"
        ? DEQFactory
        : (function() {
            /***
               * DEQ Factory logic
               */

            /*** Start factory code ***/
            var publicInterface = {};
            var _queueList = {};

            /**
               * Return a queue identified by name name.
               * If this queue does not yet exists, one is created on the fly.
               *
               * @param name The name to identify the queue. This name can be used to get the same queue from multiple locations.
               * @param {Array} [arrayRef] an option array that might already contain commands that needs to be added to the queue already
               * @returns {DigitalEventQueue}
               */
            publicInterface.get = function(name, arrayRef) {
                if (!_queueList.hasOwnProperty(name)) {
                    // Create a new instance for this name if not already exists
                    _queueList[name] = new DigitalEventQueue(name, arrayRef);
                } else if (typeof arrayRef != "undefined") {
                    // If arrayRef contains any commands, push them in bulk.
                    _queueList[name].pushBulk(arrayRef);
                }

                // Return the queue identified by name
                return _queueList[name];
            };

            /**
               * Get a list of all known digitaleventqueues that are initialized.
               *
               * @returns {Object} an object containing key-value pairs of name and an instance of the DigitalEventQueue.
               */
            publicInterface.getAll = function() {
                return _queueList;
            };

            // Return the public interface of DEQFactory
            return publicInterface;
        })();

module.exports = DEQFactory;
