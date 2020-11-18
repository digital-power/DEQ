# Changelog

## v1.4.0

**GLOBAL DATA Command**

Added Support in DEQ core for GLOBAL DATA command
renamed auto-appended variable 'event' to 'deq_event' (**BREAKING CHANGE**)
renamed auto-appended variable 'event_timestamp_deq' to 'deq_event_ts' (**BREAKING CHANGE**)

## v1.3.6

**Github and IP migration**

Migrated repository from bitbucket to github
Migrated IP from Insite Properties BV (Adversitement) to Digital-Power

## v1.3.5

**Update cookie SameSite attribute**

Set SameSite cookie attribute to Lax for all cookies written by Persist interface.

## v1.3.4

**Replaced compiler**

Replaced Google Closure Compiler with UglifyJS in Webpack build.

## v1.3.3

**Update cookie lifetime**

Updated default cookie lifetime to 2 years.

## v1.3.2

**Update dependencies**

Updated vulnerable dependencies and replaced PhantomJS test runner with headless Chrome.

## v1.3.1

**Fix issue in defer functionality**

A bug in defer was preventing this functionality to set a cookie with a correct
name. This is now fixed.

## v1.3.0

**Introduction of defer and persist**

Version 1.3.0 introduces the defer and persist functionality. For this the the
structure of the package has been changed, such that it creates a chain: index >
DEQFactory > DigitalEventQueueWithPersist > PersistInterface or, if you do not
want to use the Persist features: index > DEQFactory > DigitalEventQueue.

## v1.2.1

**Replublish on NPM**

As a republish on NPM was needed, this version number is just to keep in line
with the NPM package version number.

## v1.2.0

**Enhance eventMatching mechanism**

The eventMatching mechanism is enhanced where this is now a special method. Also
the eventMatch on `.*` will now not match the special event `DEQ error` any
longer as a precaution against creating infinite recursion.

## v1.1.2

**Introduce history of events as property of the DEQ**

As an additional information source to be used in debugging, we now introduced a
history property in the DEQ object that stores all the commands that are pushed
to the DigitalEventQueue. This property `history` is an array in which all the
commands are pushed just before they are evaluated.

## v1.1.1

**Introduction of a reference to the DEQ instance as third parameter for the
handler function**

The callback function now receives a reference to the DEQ instance as a third
parameter. This might be useful in some usecases where the callback function
needs more information about the current queue status. This is more reliable
then directly using a reference to the window scoped variable, as it may be the
case that the handler is called just before the creating of the DEQ object is
finished. Using this reference for the DEQ queue is in such situations safe to
use.

## v1.1.0

**Introduction of new syntax for parameters in the push method**

The syntax of how commands are being pushed is updated, such that now it takes
an object with the command and the arguments as key-value pairs. This should:

* make the syntax more easily readable,
* gives the developer the freedom to put the arguments in the order he/she
  prefers,
* makes it easier to work with optional arguments,
* and allows easier future extensions of functionality, where arguments can more
  easily be added.

Also in this update the _commands_ are now case insensitive, e.g. `command: "add
event"` will function the equally to `command: "ADD EVENT"`. \*(Personal
preference is the uppercase variant)
