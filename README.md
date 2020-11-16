# DEQ README #

## Introduction ##

The Digital Event Queue (DEQ) is a javascript prototype/object that is designed as a generic event-driven datalayer that
is typically applied in the digital analytics/marketing domain. It provides a layer of abstraction between the front-end
of web-applications and vendor specific datalayers for solutions such as Google Tag Manager, Adobe Launch, and Tealium iQ.

A DEQ instance behaves as a simple message queue where events and event listeners/callbacks can be registered. The syntax
for these actions (commands) follow .push() method of Array objects. This feature allows for an asynchronous registration
of events and listeners solving common timing and dependency issues of standard vendor specific datalayer implementations.

## API/Syntax Documentation ##

The DEQ API/Syntax is documented here: [https://github.com/digital-power/DEQ/blob/master/doc/DEQ-instructions.md](https://github.com/digital-power/DEQ/blob/master/doc/DEQ-instructions.md).

## Installation instructions

This project has been setup as a NPM package. Therefore "building" a minified version of the Queue can be done by using 
the command ``npm run build`` in your console, which will create an output file in the *dist* folder.

By default the persist plugin is added to the package, though if you have no intent of using this, we advice to disable
(remove) the DigitalEventQueueWithPersist.js file.

## Changelog ##

See [changelog](https://github.com/digital-power/DEQ/blob/master/changelog.md) for a full list of changes.

## Contributors ##

The current version of DEQ is the result of efforts from the following contributors.

* Koen Crommentuijn <koen.crommentuijn@digital-power.com>
* Wouter Stolk <wouter.stolk@digital-power.com>
* Martijn Schoenmakers

## License / Copyright
Licensed under the [GNU Lesser General Public License v3.0](https://github.com/digital-power/DEQ/blob/master/LICENSE)

[Copyright (c) 2016-2020: Digital Power B.V.](https://github.com/digital-power/DEQ/blob/master/notice.txt), All rights reserved.