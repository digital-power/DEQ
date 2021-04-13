# DEQ Instructions #

*Instructions for the previous v1.x versions of the DEQ library can be found here: [DEQ-instructions-v1.x.md](https://github.com/digital-power/DEQ/blob/master/doc/DEQ-instructions-v1.x.md).*

## Event Queue Creation ##

After the DEQ library has loaded, a queue can be created using `new DigitalEventQueue(name, queue)`.

The contructor method has two parameters:
- name: a name for the queue
- queue: a reference to the existing queue object (optional and can be null)

Example:
```
window.digitalEventQueue = new DigitalEventQueue("My Event Queue", window.digitalEventQueue);
```

## Commands ##

Available commands for a queue:
1. [ADD EVENT](#ADD-EVENT)
1. [ADD LISTENER](#ADD-LISTENER)
1. [GLOBAL DATA](#GLOBAL-DATA)


### Command interface ###
A DEQ queue extends the standard JavaScript Array object, and its `push` method is used to "push" commands to the queue (e.g. registering events and listeners):
```
digitalEventQueue.push( <command> );
```

Commands are formatted as JSON objects with a `command` property to specify the command:
```
{ 
  command:  'ADD EVENT', 
  name:     'pageview', 
  data:     { 'page_name' : 'homepage' }
}
```

It is **strongly advised** to conditionally define a queue before pushing **any** command (see first line below):
```
window.digitalEventQueue = window.digitalEventQueue || [];
digitalEventQueue.push({
    command:    'ADD EVENT',
    name:       'pageview',
    data:       { 'page_name' : 'homepage' }
});
```

The conditional definition of the queue allows commands to be pushed independent of the creation/initialisation of a queue (i.e. before the library is loaded or queue initialised). This independence is one of the main benefits of the Digital Event Queue over other datalayer frameworks.

## ADD EVENT ##

The `ADD EVENT` command is used to push/notify the system an event happened. An optional data-object can be included with the event.

### Properties ###

| Property key          | Allowed type | Description                                                                | Example                       | Notes                                             |
| --------------------- | ------------ | -------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------- |
| command               | 'ADD EVENT'  | the name of the command                                                    | 'ADD EVENT'                   |                                                   |
| name                  | string       | the name of the event                                                      | 'pageview'                    | Characters allowed: a-z A-Z 0-9 and whitespace    |
| data _[optional]_     | JSON-object  | a data object holding all properties that will be send to the listeners    | { 'page_name' : 'homepage' }  |                                                   |

Example:
```
window.digitalEventQueue = window.digitalEventQueue || [];
digitalEventQueue.push({
    command:    'ADD EVENT',
    name:       'pageview',
    data:       { 'page_name' : 'homepage' }
});
```

The conditional definition of the queue (first line in example) is **strongly advised**, see [Command interface](#Command-interface)

## ADD LISTENER ##

The `ADD LISTENER` command is used to register a listener with a callback function that will be called everytime an event that matches the (regex) string in the matchEvent property occurs.

### Properties ###

| Property key              | Allowed type    | Description                                                                                                                                                                                                                             | Example                                                                                   | Notes                                                                                                     |
| ------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| command                   | 'ADD LISTENER'  | the name of the command                                                                                                                                                                                                                 | 'ADD LISTENER'                                                                            |                                                                                                           |
| matchEvent                | string          | a string (that will be parsed as a regex) to select the events this listener should listen for.                                                                                                                                         | '.*'                                                                                      | Note that matching is done using new RegEx('/^'+value+'$/i). Also see note below about matching DEQ error |
| handler                   | function        | a callback function that accepts three arguments, being (in order) the name of the event triggered {string}, the accompanying data {JSON-object} and a reference to the queue instance that triggered the callback {DigitalEventQueue}  | function(n,d,q){console.log('event:',n,'data', d, 'triggered on digitaleventqueue', q);}  |                                                                                                           |
| name _[optional]_         | string          | a human readable identifier to elaborate in debugging and error logging                                                                                                                                                                 | 'Console log all event'                                                                   | Characters allowed: a-z A-Z 0-9 and whitespace                                                            |
| skipHistory _[optional]_  | boolean         | a boolean to denote if the callback function should not be called for the matching events that have already been pushed within page-load before the listener was registered.                                                            | false                                                                                     | Default value false                                                                                       |

_Events with the reserved name `deq error` will not match listeners with matchEvent `.*` to prevent infinite loops from occurring._

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

The conditional definition of the queue (first line in example) is **strongly advised**, see [Command interface](#Command-interface)

## GLOBAL DATA (beta) ##
_this command is in beta, and could change with future updates_

The `GLOBAL DATA` command is used to append data to the data-object of each event added to the queue.


### Properties ###

| Property key          | Allowed type    | Description                                                                                                                                                                                                                               | Example               | Notes                                                             |
| --------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------- |
| command               | 'GLOBAL DATA'   | the name of the command                                                                                                                                                                                                                   | 'GLOBAL DATA'         |                                                                   |
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

The conditional definition of the queue (first line in example) is **strongly advised**, see [Command interface](#Command-interface)
