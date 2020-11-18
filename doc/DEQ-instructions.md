# DEQ Event Queue Creation & Commands #

## Event Queue creation ##

An event queue is created using the DEQFactory.get method. This method takes two parameters; a name and a reference to the DEQ object that is created. The DEQFactory.get method returns the newly created event queue.

Example of creating a global event queue digitalEventQueue with name "My Event Queue":
```
window.digitalEventQueue = DEQFactory.get("My Event Queue", window.digitalEventQueue);
```

**NOTE** An event queue can only be created after the DEQ library has loaded. Events and listerners can be registered at any time, even before the library has loaded.

If a second event queue is created with the same name (first parameter), then a reference is returned to the same queue.

Example:
```
window.Queue1 = DEQFactory.get("My Event Queue", window.Queue1);
window.Queue2 = DEQFactory.get("My Event Queue", window.Queue2);

// result: Queue1 and Queue2 will reference the same event queue.
```


## Commands ##

1. [ADD EVENT](#ADD-EVENT)
1. [ADD LISTENER](#ADD-LISTENER)
1. [GLOBAL DATA](#GLOBAL-DATA)
1. [PERSIST DATA](#PERSIST-DATA)
1. [DEFER DATA](#DEFER-DATA)

## Introduction / usage ##
Commands (e.g. events pushing, listener registration) are being "pushed" into the queue.
The commands are formatted as an JSON object which can contain various parameters to be used for the command.
Therefore one property, having key `command`, is mandatory to be included in the object. 
Commands that are pushed are hence in the format:
`
{
    command: <command>, 
    argument1: <argument 1>, 
    argument2: <argument 2>,
    ...
 }
`

As a concrete example: 
```
{ 
  command:  'ADD EVENT', 
  name:     'pageview', 
  data:     { 'page_name' : 'homepage' }
}
```

**NOTE** _The value of the command-property can be considered a constant. Therefore we use uppercasing for the commands in our 
naming convention. 
Although the current version of DEQ uses a case-insensitive match for commands, this might be changed in the future. 
Hence we stronly advice to use upper-casing for the command names._ 

**NOTE** _For users of the former `adv_event` queue, please note that with using DEQ the `.on`-method for registering event handlers is replaced by a command `ADD LISTENER` that is now to be pushed to the queue._  

Below you will find a list of the current accepted commands including the a description of the arguments that can/should be used for the various commands.
 
## ADD EVENT ##

The `ADD EVENT` command is used to push/notify the system an event happened. 
An optional data-object can be included in the event.


### Arguments / Keys ###

| Property key          | Allowed type | Description                                                                | Example                       | Notes                                             |
| --------------------- | ------------ | -------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------- |
| command               | 'ADD EVENT'  | the name of the command                                                    | 'ADD EVENT'                   |                                                   |
| name                  | string       | the name of the event                                                      | 'pageview'                    | Characters allowed: a-z A-Z 0-9 and whitespace    |
| data _[optional]_     | JSON-object  | a data object holding all properties that will be send to the listeners    | { 'page_name' : 'homepage' }  |                                                   |

### Example usage ###
```
window.digitalEventQueue = window.digitalEventQueue || [];
digitalEventQueue.push({
    command:    'ADD EVENT',
    name:       'pageview',
    data:       { 'page_name' : 'homepage' }
});
```

## ADD LISTENER ##

The `ADD LISTENER` command is used to register a listener with a callback function that will be called everytime an 
event that matches the (regex) string in the matchEvent property occurs.

### Arguments / Keys ###

| Property key              | Allowed type    | Description                                                                                                                                                                                                                             | Example                                                                                   | Notes                                                                                                     |
| ------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| command                   | 'ADD LISTENER'  | the name of the command                                                                                                                                                                                                                 | 'ADD LISTENER'                                                                            |                                                                                                           |
| matchEvent                | string          | a string (that will be parsed as a regex) to select the events this listener should listen for.                                                                                                                                         | '.*'                                                                                      | Note that matching is done using new RegEx('/^'+value+'$/i). Also see note below about matching DEQ error |
| handler                   | function        | a callback function that accepts three arguments, being (in order) the name of the event triggered {string}, the accompanying data {JSON-object} and a reference to the queue instance that triggered the callback {DigitalEventQueue}  | function(n,d,q){console.log('event:',n,'data', d, 'triggered on digitaleventqueue', q);}  |                                                                                                           |
| name _[optional]_         | string          | a human readable identifier to elaborate in debugging and error logging                                                                                                                                                                 | 'Console log all event'                                                                   | Characters allowed: a-z A-Z 0-9 and whitespace                                                            |
| skipHistory _[optional]_  | boolean         | a boolean to denote if the callback function should not be called for the matching events that have already been pushed within page-load before the listener was registered.                                                            | false                                                                                     | Default value false                                                                                       |

**NOTE** _Please be aware that the special events with name `DEQ error` will not be matching listeners with matchEvent `.*` as a precaution against creating infinite loops._

### Example usage ###
```
window.digitalEventQueue = window.digitalEventQueue || [];
digitalEventQueue.push({
    command:    'ADD LISTENER',
    name:       'Console log pageviews',
    matchEvent: 'pageview',
    handler:    function(event,data,queue) { console.log("event", event, "\ntriggered by", queue, "\nwith data:", data) }
});
```

## GLOBAL DATA ##

The `GLOBAL DATA` command is used to append data to the data-object of each event added to the queue.

### Arguments / Keys ###

| Property key          | Allowed type    | Description                                                                                                                                                                                                                               | Example               | Notes                                                             |
| --------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------- |
| command               | 'GLOBAL DATA'   | the name of the command                                                                                                                                                                                                                   | 'PERSIST DATA'        |                                                                   |
| data                  | json-object     | the data object holding the data you want to add to the data that is to be persisted                                                                                                                                                      | { user_id : 1234 }    |                                                                   |


### Example usage ###

The following code example will add a property `user_id` with value `123` to all events added to the queue 

```
window.digitalEventQueue = window.digitalEventQueue || [];
digitalEventQueue.push({
    command:    'GLOBAL DATA',
    data:       { 'user_id' : 123 }
});
```

## PERSIST DATA ##

The `PERSIST DATA` command is used to persist data for a specified amount of time for a specified set of events.
When a matching event occurs, the data from that event should be extended with the persisted data.
In case of conflicting data, i.e. the event has a value for the same property as where persisted data for exists, the 
value from the event should be the one that is used above the value of the persisted data. 

### Arguments / Keys ###

| Property key          | Allowed type    | Description                                                                                                                                                                                                                               | Example               | Notes                                                             |
| --------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------- |
| command               | 'PERSIST DATA'  | the name of the command                                                                                                                                                                                                                   | 'PERSIST DATA'        |                                                                   |
| data                  | json-object     | the data object holding the data you want to add to the data that is to be persisted                                                                                                                                                      | { user_id : 1234 }    |                                                                   |
| matchEvent            | string          | a string (that will be parsed as a regex) to select the events this persisted data should be appended to                                                                                                                                  | "pageview"            | note that matching is done using new RegEx('/^'+event_name+'$/i)  |
| duration _[optional]_ | integer, string | the number of seconds this data should be persisted. Special values are "SESSION" and "PAGELOAD" (case-sensitive) which will persist the data respectively for the browser session or for the page-load (being until the next navigation  | 111600                | default value is "PAGELOAD"                                       |
| renew _[optional]_    | boolean         | if this boolean is true, every time an event occurs, the lifetime of this data is prolonged with the value of lifetime                                                                                                                    | true                  | default value false. Only works when lifetime is set in seconds.  |       

### Example usage ###

The following code example will add a property `user_id` with value `123` to all `pageview` events within the browser session. 

```
window.digitalEventQueue = window.digitalEventQueue || [];
digitalEventQueue.push({
    command:    'PERSIST DATA',
    data:       { 'user_id' : 123 }, 
    matchEvent: 'pageview',
    duration:   'SESSION'
});
```

## DEFER DATA ##

The `DEFER DATA` command is used to persist data *only up and until the next occurrence* of an event that matches the event_name parameter within a browser session. 
After the data is added once, on the next occurrence of an event that matches event_name the data will not be added again (unless it is actively deferred again). 

### Arguments / Keys ###

| Property key  | Allowed type  | Description                                                                                               | Example                                                                                   | Notes                                                             |
| ------------- | ------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| command       | 'DEFER DATA'  | the name of the command                                                                                   | 'DEFER DATA'        |                                                                     |                                                                   |
| data          | json-object   | the data object holding the data you want to add to the data that is to be persisted                      | { page_previous_page_name : "home", page_previous_page_url: "http://www.example.org/" }   |                                                                   |
| matchEvent    | string        | a string (that will be parsed as a regex) to select the events this persisted data should be appended to  | "pageview"                                                                                | note that matching is done using new RegEx('/^'+event_name+'$/i)  |

### Example usage ###

The following code example will add a property `page_previous_page_name` with value `homepage` to the next `pageview` event (that happens within a browser session!). 

```
window.digitalEventQueue = window.digitalEventQueue || [];
digitalEventQueue.push({
    command:    'DEFER DATA',
    data:       { 'page_previous_page_name' : 'homepage' }, 
    matchEvent: 'pageview'
});
```
