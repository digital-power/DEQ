var DigitalEventQueue = require("./DigitalEventQueue");

DigitalEventQueueWithPersist.prototype = new DigitalEventQueue();
DigitalEventQueueWithPersist.prototype.constructor = DigitalEventQueueWithPersist;
function DigitalEventQueueWithPersist(name, previous_commands) {
    // Inherit from DigitalEventQueue
    DigitalEventQueue.call(this, name, previous_commands);
    var DEQ = this;
    DEQ.version = DEQ.version.split(" ")[0] + " Persist";

    // Additions ands overrides in here
    var PersistInterface = require("./PersistInterface");
    var persistInterface = new PersistInterface(this.name);

    // Add commands to the commandMapping

    DEQ.__private.lib.persistData = function(args) {
        try {
            persistInterface.addProperties(args);
        } catch (e) {
            DEQ.__private.lib.logError("persist data", e.message, e);
        }
    };

    DEQ.__private.lib.deferData = function(args) {
        try {
            args["duration"] = "DEFER";
            persistInterface.addProperties(args);
        } catch (e) {
            DEQ.__private.lib.logError("defer data", e.message, e);
        }
    };

    DEQ.__private.commandMapping["PERSIST DATA"] =
        DEQ.__private.lib.persistData;
    DEQ.__private.commandMapping["DEFER DATA"] = DEQ.__private.lib.deferData;

    // Overwrite addEvent
    DEQ.__private.lib.addEventOrigin = DEQ.__private.lib.addEvent;
    DEQ.__private.lib.addEvent = function(args) {
        if (!args || args["name"] == "deq error") {
            DEQ.__private.lib.addEventOrigin(args);
        } else {
            // copy event object in event_data, if copy action fails report error and drop event
            try {
                var persistArgs = {};
                persistArgs["matchEvent"] = args["name"];
                args["data"] = DEQ.__private.lib.mergeObj(
                    persistInterface.getProperties(persistArgs),
                    args["data"]
                );
            } catch (e) {
                e.deq_event = args["name"];
                DEQ.__private.lib.logError(
                    "add event",
                    "invalid event object",
                    e
                );
                return false;
            }

            DEQ.__private.lib.addEventOrigin(args);
        }
    };
    DEQ.__private.commandMapping["ADD EVENT"] = DEQ.__private.lib.addEvent;

    // Init
    if (
        Object.getPrototypeOf(DEQ).constructor === DigitalEventQueueWithPersist
    ) {
        // Process commands that were added in the arrayRef already
        DEQ.pushBulk(previous_commands);
    }
}

module.exports = DigitalEventQueueWithPersist;
