# DEQ README #

Instructions for using the Digital Event Queue are located here: **[doc/DEQ-instructions.md](https://github.com/digital-power/DEQ/blob/master/doc/DEQ-instructions.md)**.

## Introduction ##

The Digital Event Queue (DEQ) is a javascript prototype/object that is designed as a generic **event-driven datalayer** that
is typically applied in the digital analytics/marketing domain. It provides a layer of abstraction between the front-end
of web-applications and vendor specific datalayers for solutions such as Google Tag Manager, Adobe Launch, and Tealium iQ.

A DEQ instance behaves as a simple message queue where events and event listeners/callbacks can be registered. The syntax
for these actions (commands) follow .push() method of Array objects. This feature allows for an asynchronous registration
of events and listeners solving common timing and dependency issues of standard vendor specific datalayer implementations.

## Changelog ##

See [changelog](https://github.com/digital-power/DEQ/blob/master/changelog.md) for a full list of changes.

## Supported Browsers ##

The DEQ library is written in JavaScript ECMAScript Version 5 and supports all major browsers.

| Chrome  | Edge   | FireFox | IE      | Safari  |
| ------- | ------ | ------- | ------- | ------- |
| 5+      | 12+    | 4+      | 9+      | 5+      |

## Contributors ##

The current version of DEQ is the result of efforts from the following contributors.

* Koen Crommentuijn <koen.crommentuijn@digital-power.com>
* Wouter Stolk <wouter.stolk@digital-power.com>
* Martijn Schoenmakers

## Copyright ##

[DEQ Copyright notice](https://github.com/digital-power/DEQ/blob/master/doc/DEQ-copyright-notice.md)
