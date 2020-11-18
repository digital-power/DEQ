/**
 @preserve Digital Event Queue.
 Copyright (c) 2016-2020: Digital Power B.V., All rights reserved.
 Licensed under the GNU Lesser General Public License v3.0:
 https://github.com/digital-power/DEQ/blob/master/LICENSE
 **/

/** DEQ Lib core **/
DigitalEventQueue.prototype = []; // inherit from Array
DigitalEventQueue.prototype.constructor = DigitalEventQueue; // point constructor to DigitalEventQueue instead of Array
function DigitalEventQueue(name, previous_commands) {
    var DEQ = this;
    DEQ["version"]      = "1.4.0 core";
    DEQ["name"]         = name;
    DEQ["listeners"]    = [];
    DEQ["events"]       = [];
    DEQ["history"]      = [];
    DEQ["global"]       = {};

    DEQ.__private = {};
    DEQ.__private.lib = {
        // mergeObj: recursively merge multiple objects (based on Paul Spaulding http://stackoverflow.com/a/16178864). 
        // Customized to support Objects with Arrays
        mergeObj: function() {
            var dst = {},
                src,
                p,
                args = [].splice.call(arguments, 0);

            while (args.length > 0) {
                src = args.splice(0, 1)[0];
                if (Object.prototype.toString.call(src) == "[object Object]") {
                    for (p in src) {
                        if (src.hasOwnProperty(p)) {
                            if (Object.prototype.toString.call(src[p]) == "[object Object]") {
                                dst[p] = DEQ.__private.lib.mergeObj(dst[p]||{}, src[p]);
                            } else {
                                dst[p] = DEQ.__private.lib.deepCopy(src[p]);
                            }
                        }
                    }
                }
            }
            return dst;
        },

        /**
         * Create a deepcopy of the input
         * Currently works for objects, arrays, booleans, strings and numbers.
         * @param src {Object|Array|Boolean|String|Number} the input
         * @return {mixed} returns a deepCopy
         */
        deepCopy: function(src) {
            switch (Object.prototype.toString.call(src)) {

                case "[object Object]":
                    return DEQ.__private.lib.copyObj(src);
            
                case "[object Array]":
                    var out = [];
                    for (var i = 0, j=src.length; i<j; i++) {
                        out[i] = DEQ.__private.lib.deepCopy(src[i]);
                    }
                    return out;
            
                default:
                    return src;
            }
        },

        // copyObj: returns a copy of an object that does not reference to the object copied from. Circular references in objects are not allowed.
        copyObj: function(obj) {
            return DEQ.__private.lib.mergeObj({}, obj);
        },

        // logError: adds a descriptive error event to the event queue
        logError: function(errorType, errorMsg, errorObj) {
            var eventObj = {};
            eventObj["deq_error_type"] = errorType;
            eventObj["deq_error_message"] = errorMsg;
            if (typeof errorObj == "object") {
                if (errorObj["fileName"] && errorObj["lineNumber"])
                    eventObj["deq_error_location"] =
                        errorObj["fileName"] +
                        " (" +
                        errorObj["lineNumber"] +
                        ")";
                if (errorObj["name"] && errorObj["message"])
                    eventObj["deq_error_details"] =
                        errorObj["name"] + ": " + errorObj["message"];
                if (errorObj["stack"])
                    eventObj["deq_error_stack"] = errorObj["stack"].toString();
                if (errorObj["deq_listener"])
                    eventObj["deq_error_listener"] = errorObj["deq_listener"];
                if (errorObj["deq_event"])
                    eventObj["deq_error_event"] = errorObj["deq_event"];
            }
            DEQ.push({
                command: "ADD EVENT",
                name: "deq error",
                data: eventObj
            });
        },

        // callEventCallback: publish an event to a specific listener
        callEventCallback: function(
            event_name,
            event_data,
            listener_callback,
            listener_name
        ) {
            try {
                var event_data_copy = DEQ.__private.lib.copyObj(event_data);
                listener_callback.call(
                    listener_callback,
                    event_name,
                    event_data_copy,
                    DEQ
                );
            } catch (e) {
                if (event_name != "deq error") {
                    e.deq_listener = listener_name;
                    e.deq_event = event_name;
                    DEQ.__private.lib.logError(
                        "listener",
                        "listener (" +
                            listener_name +
                            ") failed on '" +
                            event_name,
                        e
                    );
                }
            }
        },

        // Check if event on eventIndex matches the matchEvent of listener on listenerIndex and invoke the handler if so.
        checkAndExecuteEventMatch: function(eventIndex, listenerIndex) {
            try {
                // Get and check for listener and event
                var listenerRef = DEQ["listeners"][listenerIndex],
                    eventRef = DEQ["events"][eventIndex];

                // Check for correct references
                if (
                    !(
                        Array.isArray(listenerRef) &&
                        listenerRef.length >= 3
                    )
                ) {
                    throw new Error(
                        "Invalid reference to listeners[" +
                            listenerIndex +
                            "] in checkAndExecuteEventMatch"
                    );
                } else if (
                    !(
                        Array.isArray(eventRef) &&
                        eventRef.length >= 2
                    )
                ) {
                    throw new Error(
                        "Invalid reference to events[" +
                            eventIndex +
                            "] in checkAndExecuteEventMatch"
                    );
                }

                // Helper variables
                var event = {
                        name: eventRef[0],
                        data: eventRef[1]
                    },
                    listener = {
                        name: listenerRef[0],
                        matchEvent: listenerRef[1],
                        handler: listenerRef[2]
                    };

                // Create a regex to check
                var match_regex = new RegExp(
                    "^" + listener.matchEvent + "$",
                    "i"
                ); // Note: case insensitive

                // Check for a match
                if (
                    event.name.match(match_regex) && // Check for a match
                    !(
                        event.name.match(/^deq error$/i) &&
                        listener.matchEvent == ".*"
                    )
                ) {
                    // Exclude matches on .* with deq error
                    DEQ.__private.lib.callEventCallback(
                        event.name,
                        event.data,
                        listener.handler,
                        listener.name
                    );
                }
            } catch (e) {
                DEQ.__private.lib.logError(
                    "checkAndExecuteEventMatch",
                    e.message,
                    e
                );
            }
        },

        // addListener: register a listener and, if needed, publish all former events to this listener
        // addListener: function(listener_name, callback, event_name, include_history) {
        addListener: function(args) {
            // Test input
            if (
                typeof args == "object" &&
                typeof args["handler"] == "function" &&
                typeof args["matchEvent"] == "string"
            ) {
                args["name"] = args["name"] || "unnamed listener"; // Set default name

                // Add event listener and get it's index
                var listenerIndex = DEQ["listeners"].push([
                    args["name"],
                    args["matchEvent"],
                    args["handler"]
                ]);
                listenerIndex--; // Update index to be a referrer to the listener itself.

                // If listener should also trigger for events that already occurred (true by default)
                if (!args["skipHistory"]) {
                    // Run through event history
                    for (
                        var eventIndex = 0, len = DEQ["events"].length;
                        eventIndex < len;
                        eventIndex++
                    ) {
                        DEQ.__private.lib.checkAndExecuteEventMatch(
                            eventIndex,
                            listenerIndex
                        );
                    }
                }
            } else {
                DEQ.__private.lib.logError("add listener", "invalid input", {
                    deq_listener: args["name"]
                });
            }
        },

        // addEvent: add an event to the queue
        // addEvent: function(event_name, event_data) {
        addEvent: function(args) {
            if (
                typeof args["name"] == "string" &&
                (typeof args["data"] == "undefined" ||
                    typeof args["data"] == "object")
            ) {
                var event_data_copy;
                // copy event object in event_data, if copy action fails report error and drop event
                try {
                    event_data_copy = DEQ.__private.lib.mergeObj(DEQ["global"],args["data"]);
                } catch (e) {
                    e.deq_event = args["name"];
                    DEQ.__private.lib.logError(
                        "add event",
                        "invalid event object",
                        e
                    );
                    return false;
                }

                // add event name to event data object
                event_data_copy["deq_event"] = args["name"];
                // add browser timestamp to event data object
                event_data_copy["deq_event_ts"] = new Date().getTime();

                // store a copy of the event in the event history
                var eventIndex = DEQ["events"].push([
                    args["name"],
                    event_data_copy
                ]);
                eventIndex--; // Update index to be a referrer to the event itself.

                // Run through event listeners
                for (
                    var listenerIndex = 0, len = DEQ["listeners"].length;
                    listenerIndex < len;
                    listenerIndex++
                ) {
                    DEQ.__private.lib.checkAndExecuteEventMatch(
                        eventIndex,
                        listenerIndex
                    );
                }
            } else {
                var errorObj = {};
                if (typeof args["name"] == "string")
                    errorObj.deq_event = args["name"];
                DEQ.__private.lib.logError(
                    "add event",
                    "invalid input",
                    errorObj
                );
            }
        },
        
        // Add/Append global data to the queue
        addGlobalData : function(args){
            if(typeof args["data"] == "object") {
                DEQ["global"] = DEQ.__private.lib.mergeObj(DEQ["global"],args["data"]);
            }
        }
    };

    // Map commands to private functions
    DEQ.__private.commandMapping = {
        "ADD EVENT": DEQ.__private.lib.addEvent,
        "ADD LISTENER": DEQ.__private.lib.addListener,
        "GLOBAL DATA": DEQ.__private.lib.addGlobalData
    };

    // Override push functionality to execute the correct command
    DEQ.push = function(args) {
        DEQ["history"].push(args);
        if (typeof args == "object" && typeof args["command"] == "string") {
            var command = args["command"].toUpperCase(),
                command_copy = DEQ.__private.lib.copyObj(args);

            if (DEQ.__private.commandMapping.hasOwnProperty(command)) {
                DEQ.__private.commandMapping[command].call(this, command_copy);
            } else {
                DEQ.__private.lib.logError(
                    "push",
                    "command '" + command + "' is unknown"
                );
            }
        } else {
            DEQ.__private.lib.logError(
                "push",
                "invalid input: use .push({command:'#command#',#param1#:'param1_value',...})"
            );
        }
    };

    /**
     * Pushes a bulk of commands at once.
     * Be carefull with this function, as:
     *  * it changes the input array in-place, such that the list is empty afterwards;
     *  * the order in which commands are pushed from different "temporary queues" may matter e.g. when listeners have the include_history option set to false!
     *
     *  In most casus should only be used internally for initialization.
     *
     * @param {Array} commands should be an Array consisting of "commands". After running the function the array will be empty.
     */
    DEQ.pushBulk = function(commands) {
        // Process events from bulk
        if (Array.isArray(commands)) {
            while (commands.length > 0) {
                DEQ.push(commands.shift());
            }
        }
    };

    // Init
    if (Object.getPrototypeOf(DEQ).constructor === DigitalEventQueue) {
        // Process commands that were added in the arrayRef already
        DEQ.pushBulk(previous_commands);
    }
}

module.exports = DigitalEventQueue;