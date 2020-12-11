# DEQ Instructions #

*Instructions for the previous v1.x versions of the DEQ library can be found here: [DEQ-instructions-v1.x.md](https://github.com/digital-power/DEQ/blob/master/doc/DEQ-instructions-v1.x.md).*

## Create an Event Queue ##

After the DEQ library has loaded, a queue can be created using `new DigitalEventQueue(name, queue)`.

The contructor method has two parameters:
- name: a name for the queue
- queue: a reference to the existing queue object (optional and can be null)

Example:
```
window.deq = new DigitalEventQueue("My Event Queue", window.digitalEventQueue);
```

## Commands ##

You interact with a queue by 'pushing' commands (e.g. registering events and listeners):
```
deq.push( <command> );
```

The following commands are available:
1. [ADD EVENT](#ADD-EVENT)
1. [ADD LISTENER](#ADD-LISTENER)
1. [PERSIST DATA](#PERSIST-DATA)
1. [DEFER DATA](#DEFER-DATA)


Commands are formatted as JSON objects with a `command` property to specify the command:
```
window.deq = window.deq || [];
deq.push({
    command:    'ADD EVENT',
    name:       'pageview',
    data:       { 'page_name' : 'homepage' }
});
```
It is **strongly advised** to conditionally define a queue before pushing **any** command (see first line in the code example above). The conditional definition of a queue allows commands to be pushed before the queue is initialized as a DigitalEventQueue. This feature, in combination with listeners also being  called for events added to a queue before the listener solves most timing issues/dependencies that other datalayer frameworks experience.

## ADD EVENT ##

The `ADD EVENT` command is used to push/notify the system an event happened. An optional data-object can be included with the event.

### Properties ###

| Key | Description | Allowed values | Example values |
|:----|:------------|:---------------|:---------------|
| command | command name | 'ADD EVENT' | 'ADD EVENT' |
| name | event name | \<string\> | 'pageview' |
| _data_ | _optional_ data object that will be send to the listeners | \<object\> | { page_name : 'homepage' }  |

Example:
```
window.deq = window.deq || [];
deq.push({
    command:    'ADD EVENT',
    name:       'pageview',
    data:       { 'page_name' : 'homepage' }
});
```
It is **strongly advised** to conditionally define a queue before pushing **any** command (see first line in the code example above).

## ADD LISTENER ##

The `ADD LISTENER` command is used to register a listener with a callback function that will be called everytime an event that matches the (regex) string in the matchEvent property occurs.

### Properties ###

| Key | Description | Allowed values | Example values |
|:----|:------------|:------------|:------------|
| command | command name | 'ADD LISTENER'  | 'ADD LISTENER' |
| matchEvent | condition that defines for which events this listener gets called; uses RegEx: /^**matchEvent**$/i | \<string\> | '.*', 'pageview' |
| handler | callback function with three args: event \<string\>, data \<object\>, queue \<DigitalEventQueue\> | \<function\> | function(event,data,queue){ ... } |
| _name_ | _optional_ name for a listener to facilitate debugging and error logging | \<string\> | 'My Awesome Listener' |
| _skipHistory_ | _optional_ flag to stop this listener from getting called for events that were added before this listener | \<boolean\> | true |

_Events with the reserved name `deq error` will not match listeners with matchEvent `.*` to prevent infinite loops from occurring._

### Example usage ###
```
window.deq = window.deq || [];
deq.push({
    command:    'ADD LISTENER',
    name:       'Console log pageviews',
    matchEvent: 'pageview',
    handler:    function(event,data,queue) { console.log("event", event, "\ntriggered by", queue, "\nwith data:", data) }
});
```
It is **strongly advised** to conditionally define a queue before pushing **any** command (see first line in the code example above). 

## PERSIST DATA ##

The `PERSIST DATA` command is used to persist data for a specified amount of time for a specified set of events. When a matching event occurs, the data from that event is extended with the persisted data. In case of duplicate properties the event property overwrites the persisted property (e.g. obj.myVar = "persisted value" and obj.myVar = "event value", then obj.myVar will equal to "event value"). If no duration is specified within the command object, then the data is by default persisted for the current page (i.e. until the page unloads).

When the 'PERSIST DATA' command is used with the default duration 'PAGELOAD', no cookies are created. When a different duration is specified, a cookie is created for each variable in the data object. The lifetime/expiration of these cookies will equal the duration specified in the command. All cookies set through the 'PERSIST DATA' command start with `deq_persist`.


### Properties ###

| Key | Description | Allowed values | Example values |
|:----|:------------|:---------------|:---------------|
| command | command name | 'PERSIST DATA'  | 'PERSIST DATA' |
| data | the data object holding the data you want to add to the data that is to be persisted | \<object\> | { user_id : 1234 } 
| matchEvent | condition that defines to which events this data gets deferred to; uses RegEx: /^**matchEvent**$/i | \<string\> | 'pageview' |
| _duration_ | _optional_  duration: \<int\> for seconds, 'SESSION' for browser session, 'PAGELOAD' for current page | \<int\>, 'SESSION', 'PAGELOAD' (default)| 111600 |
  

### Example usage ###

The following code example will add a property `user_id` with value `123` to all `pageview` events within the browser session. 

```
window.deq = window.deq || [];
deq.push({
    command:    'PERSIST DATA',
    data:       { 'user_id' : 123 }, 
    matchEvent: 'pageview',
    duration:   'SESSION'
});
```
It is **strongly advised** to conditionally define a queue before pushing **any** command (see first line in the code example above).

## DEFER DATA ##

The `DEFER DATA` command is used to pass data to the next occurrance of an event matching the specified condition. Note that a 'DEFER DATA' command expires when a browser session ends. When the 'DEFER DATA' command is used, a cookie called `deq_defer` is set with the default lifetime of a session.

### Properties ###

| Key | Description | Allowed values | Example values |
|:----|:------------|:---------------|:---------------|
| command | command name | 'DEFER DATA'  | 'DEFER DATA' |
| data | an object with variables that will be added to the data of a future event | \<object\> | { previous_page_name : "homepage" } |
| matchEvent | condition that defines to which events this data gets deferred to; uses RegEx: /^**matchEvent**$/i | \<string\> | 'pageview' |

### Example usage ###

The following code example will add a property `previous_page_name` with value `homepage` to the next `pageview` event (that happens within a browser session!). 

```
window.deq = window.deq || [];
deq.push({
    command:    'DEFER DATA',
    data:       { 'previous_page_name' : 'homepage' }, 
    matchEvent: 'pageview'
});
```
It is **strongly advised** to conditionally define a queue before pushing **any** command (see first line in the code example above). 
