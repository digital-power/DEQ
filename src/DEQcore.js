/*! @preserve Digital Event Queue - 2.0.0 core - https://github.com/digital-power/DEQ */
if(typeof(DigitalEventQueue)!=="function") {
    window.DigitalEventQueue = function DigitalEventQueue(name, previous_commands) {
        "use strict";
    
        // if queue already exists, return existing queue
        if(DigitalEventQueue.queue[name]) return DigitalEventQueue.queue[name];
    
        /** public methods **/
        var DEQ = DigitalEventQueue.queue[name] = this;
        DEQ.version     = "2.0.0 core";
        DEQ.name        = name;
        DEQ.listeners   = [];
        DEQ.events      = [];
        DEQ.history     = [];
        DEQ.global      = {};
    
        // Override push functionality to execute the correct command
        DEQ.push = function(args) {
            DEQ.history.push(args);
            if (isObject(args) && args.command) {
    
                switch(args.command) {
                    case "ADD EVENT":
                        addEvent(args);
                        break;
    
                    case "ADD LISTENER":
                        addListener(args);
                        break;
    
                    case "GLOBAL DATA":
                        addGlobalData(args);
                        break;
    
                    default:
                        logError("push", "unknown command: " + args.command, {input: args});
                }
            } else {
                logError("push", "invalid input", {input: args});
            }
        };
    
        /** private methods **/
        var isObject = function(obj) {
            return Object.prototype.toString.call(obj) == "[object Object]";
        };
    
        // mergeObj: recursively merge multiple objects
        var mergeObj = function() {
            var dst = {};
            var args = [].splice.call(arguments, 0);    // convert function arguments to an Array
                
            args.forEach(function(src) {
                if (isObject(src)) {
                    Object.keys(src).forEach(function(key) {
                        // If an object (by key) is present in both the destination and source, don't overwrite, but merge the objects.
                        if (isObject(dst[key]) && isObject(src[key])) {
                            dst[key] = mergeObj(dst[key], src[key]);
                        } else {
                            dst[key] = deepCopy(src[key]);
                        } 
                    });
                }
            });
    
            return dst;
        };
    
        /*
        * Create a deepcopy of the input
        * Currently works for objects, arrays, booleans, strings and numbers.
        * @param src {Object|Array|Boolean|String|Number} the input
        * @return {mixed} returns a deepCopy
        */
        var deepCopy = function(src) {
    
            if (isObject(src)) {
                return copyObj(src);
            } else if (Array.isArray(src)){
                var out = [];
                src.forEach(function(item) {
                    out.push(deepCopy(item));
                });
                return out;
            }
            return src;
        };
    
        // copyObj: returns a copy of an object (opposed to a reference to an object)
        var copyObj = function(obj) {
            return mergeObj(obj);
        };
    
        // logError: adds a descriptive error event to the event queue
        var logError = function(errorType, errorMsg, errorObj, errorEvent, errorListener) {
            errorObj = errorObj || {};
            DEQ.push({
                command : "ADD EVENT",
                name    : "deq error",
                data    : {
                            deq_error_type      : errorType,
                            deq_error_message   : errorMsg,
                            deq_error_obj       : errorObj,
                            deq_error_event     : errorEvent,
                            deq_error_listener  : errorListener
                }
            });
        };
    
        // callEventCallback: publish an event to a specific listener
        var callEventCallback = function(event_name, event_data, listener_callback, listener_name) {
            try {
                listener_callback.call(listener_callback, event_name, copyObj(event_data), DEQ);
            } catch (e) {
                if (event_name != "deq error") {
                    logError("listener", "listener (" + listener_name + ") failed on '" + event_name, e, event_name, listener_name);
                }
            }
        };
    
        // Check if an event matches the matchEvent of a listener and invoke the handler if so.
        var checkAndExecuteEventMatch = function(eventRef, listenerRef) {
            try {
                // Helper variables
                var event = {
                    name : eventRef[0],
                    data : eventRef[1]
                };
    
                var listener = {
                    name        : listenerRef[0],
                    matchEvent  : listenerRef[1],
                    handler     : listenerRef[2]
                };
    
                // Create a regex to check
                var match_regex = new RegExp("^" + listener.matchEvent + "$", "i"); // Note: case insensitive
    
                // Check for a match, and exlude matches on 'deq error' with '.*' to prevent infinite loops
                // Check for a match, and exlude matches on 'deq error' with '.*' to prevent infinite loops
                if ( event.name.match(match_regex) && !( event.name.match(/^deq error$/i) && listener.matchEvent == ".*") ) {
                    callEventCallback(event.name, event.data, listener.handler, listener.name);
                }
            } catch (e) {
                logError("checkAndExecuteEventMatch", e.message, {event:eventRef, listener:listenerRef, error:e});
            }
        };
    
        // addListener: register a listener and, if needed, publish all former events to this listener
        // addListener: function(listener_name, callback, event_name, include_history) {
        var addListener = function(args) {
            // Test input
            if ( isObject(args) && typeof args.handler == "function" && typeof args.matchEvent == "string" ) {
                args.name = args.name || "unnamed listener"; // Set default name
    
                // Format listener as an Array
                var listener = [args.name, args.matchEvent, args.handler];
    
                // Add listener to the listeners Array
                DEQ.listeners.push(listener);
    
                // If the listener should be triggered for events that already have occurred (true by default)
                if (!args.skipHistory) {
                    // Run through event history
                    DEQ.events.forEach(function(event){
                        checkAndExecuteEventMatch(event, listener);
                    });
                }
    
            } else {
                logError("add listener", "invalid input", {input: args});
            }
        };
    
        // addEvent: add an event to the queue
        // addEvent: function(event_name, event_data) {
        var addEvent = function(args) {
            if (typeof args.name == "string" && (typeof args.data == "undefined" || isObject(args.data)) ) {
                try {
                    // merge event name/timestamp object, with event data object, with global data object
                    var data = mergeObj(    DEQ.global,
                                            args.data,
                                            {
                                                deq_event       : args.name,
                                                deq_event_ts    : new Date().getTime()
                                            });
    
                    // Format listener as an Array
                    var event = [args.name, data];
    
                    // Add the event to the event history
                    DEQ.events.push(event);
    
                    // Run through event listeners
                    DEQ.listeners.forEach(function(listener){
                        checkAndExecuteEventMatch(event, listener);
                    });
    
                } catch (e) {
                    logError("add event", "invalid event object", e, args.name);
                }
            } else {
                logError("add event", "invalid input", {input: args});
            }
        };
    
        // Add/Append global data to the queue
        var addGlobalData = function(args){
            if(isObject(args.data)) {
                DEQ.global = mergeObj(DEQ.global, args.data);
            }
        };
        
        /** Process commands that were added prior to the current initialisation **/
        if (Object.getPrototypeOf(DEQ).constructor === DigitalEventQueue) {
            if (Array.isArray(previous_commands)) {
                previous_commands.forEach(function(command) {
                    DEQ.push(command);
                });
            }
        }
    }
    DigitalEventQueue.prototype = []; // inherit from Array
    DigitalEventQueue.prototype.constructor = DigitalEventQueue; // point constructor to DigitalEventQueue instead of Array
    DigitalEventQueue.queue = {}; // storage of queues that have been created
}
