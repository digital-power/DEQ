/*! @preserve Digital Event Queue - 2.0.0 - https://github.com/digital-power/DEQ */
if(typeof(DigitalEventQueue)!=="function") {
    window.DigitalEventQueue = function DigitalEventQueue(name, previous_commands) {
        "use strict";
    
        // if queue already exists, return existing queue
        if(DigitalEventQueue.queue[name]) return DigitalEventQueue.queue[name];
    
        /** public methods **/
        
        var DEQ = DigitalEventQueue.queue[name] = this;
        DEQ.version     = "2.0.0";
        DEQ.name        = name;
        DEQ.listeners   = [];
        DEQ.events      = [];
        DEQ.history     = [];
        DEQ.defer       = [];
        DEQ.persist     = [];
    
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
                       
                    case "PERSIST DATA":
                        addPersistData(args);
                        break;

                    case "DEFER DATA":
                        addDeferData(args);
                        break;                        
    
                    default:
                        logError("push", "unknown command: " + args.command, {input: args});
                }
            } else {
                logError("push", "invalid input", {input: args});
            }
        };
        
        // Overwrite unshift functionality to function as push
        DEQ.unshift = DEQ.push;
    
        /** private methods **/

        // setCookie: Set Cookie on mainDomain (cLifetime = expiration value in seconds)
        var setCookie = function(cName, cVal, cLifetime) {
            
            // Deduct main domain from document.location.hostname
            var splitDomain = document.location.hostname.split(".");
            var domainLevels = splitDomain.length;
            var mainDomainArr = [splitDomain[domainLevels-1]];                                  // start with 1st level domain (e.g. localhost)
            if(domainLevels > 1) {
                mainDomainArr.unshift(splitDomain[domainLevels-2]);                             // add 2nd level, if a dot is present in the hostname (e.g. domain.com)
                if(splitDomain[domainLevels-2]=="com" || splitDomain[domainLevels-2]=="co") {
                    mainDomainArr.unshift(splitDomain[domainLevels-3]);                         // add 3rd level if 2nd level equals 'com' or 'co' (e.g. domain.co.uk, domain.com.au)
                }
            }
            var mainDomain = mainDomainArr.join(".");
            
            var cExpires = "";
            if (cLifetime) {
                cLifetime = Number(cLifetime);
                var b = new Date();
                b.setSeconds(b.getSeconds() + cLifetime);
                cExpires = ";expires=" + b.toUTCString();
            }
            document.cookie = cName + "=" + encodeURIComponent(cVal) + cExpires + ";path=/;domain=." + mainDomain + ";SameSite=Lax";
        }

        // getCookie: Get cookie by name
        var getCookie = function(cName) {
            var b;
            return (b = document.cookie.match("(^|;)\\s*" + cName + "\\s*=\\s*([^;]+)")) ? decodeURIComponent(b.pop()) : null;
        }        
        
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
    
        // deepCopy: create a deepCopy an object, array, boolean, string or number
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
    
        // addListener: register a listener and publish all former events to this listener (if required)
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
        var addEvent = function(args) {
            if (typeof args.name == "string" && (typeof args.data == "undefined" || isObject(args.data)) ) {
                try {
                    
                    // Init data object for persisted data (persist & defer)
                    var persistData = {};

                    // Add persist variables to persistData that match the current queue and event (args.name)
                    DEQ.persist.forEach(function(item) {
                        var condition = new RegExp("^" + item.e + "$", "i");
                        if(DEQ.name==item.q && args.name.match(condition)) {
                            persistData[item.k] = item.v;
                        }
                    });
                    
                    // Add defer variables to persistData that match the current queue and event (args.name)
                    var unmatched = [];
                    DEQ.defer.forEach(function(item) {
                        var condition = new RegExp("^" + item.e + "$", "i");
                        if(DEQ.name==item.q && args.name.match(condition)) {
                            persistData = mergeObj(persistData,item.d);         // matched defer items should be merged to persistData and removed from the defer array and cookie
                        } else {
                            unmatched.push(item);                               // unmatched defer items should remain in the defer array and cookie
                        }
                    });
                    
                    // Update the defer array and cookie if there are mutations
                    if(DEQ.defer.length !== unmatched.length) {
                        DEQ.defer = unmatched;
                        setCookie("deq_defer",JSON.stringify(DEQ.defer))
                    }
                    
                    // Merge event name/timestamp object, with event data object, with persisted data
                    var data = mergeObj(    persistData,
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
    
        // addPersistData: persist variables (args.data[keys]) for args.duration, which will be merged with eventData if an event matches (args.matchEvent)
        var addPersistData = function(args) {
            
            var duration        = args.duration || "PAGELOAD";              // default to PAGELOAD
            var data            = args.data;
            var deqNameSimple   = DEQ.name.toLowerCase().replace(" ","_");
            
            if(duration=="SESSION") {
                duration = 0;
            }
            
            Object.keys(data).forEach(function(key) {
                
                var persistObj = {
                    e : args.matchEvent,
                    k : key,
                    v : data[key],
                    q : DEQ.name,
                }
                
                if(duration!="PAGELOAD") {
                    var cookieName = "deq_persist-" + key + "-" + deqNameSimple;
                    setCookie(cookieName, JSON.stringify(persistObj), duration);
                }
                
                DEQ.persist.push(persistObj);
            });
        };
        
        // addPersistData: defer data (args.data) which will be merged with eventData if an event matches (args.matchEvent)
        var addDeferData = function(args) {
            
            var deferObj = {
                e : args.matchEvent,
                d : args.data,
                q : DEQ.name,
            }            
            
            DEQ.defer.push(deferObj);
            setCookie("deq_defer",JSON.stringify(DEQ.defer))
        };
        
        /** INITIALISATION **/
        
        // Initialse defer array from deq_defer cookie
        try {
            var deferArray  = JSON.parse(getCookie("deq_defer"));
            if(Array.isArray(deferArray)){
                DEQ.defer = deferArray;
            }
        }
        catch(e){}
        
        // Initialse persist array from deq_persist_* cookies
        try{
            document.cookie.split(";").forEach(function(item) {
                var cName = item.trim().split("=")[0];
                if(cName.indexOf("deq_persist")==0) {
                    DEQ.persist.push(JSON.parse(getCookie(cName)));
                }
            });
        }
        catch(e) {}
        
        // Process commands that were added prior to the current initialisation
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
