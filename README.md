# Example WebSocket test runner


The purpose of this example is to share an approach used for adapting
a common JavaScript test harness (Jasmine) into a reporting structure
that is more suited to the asynchronous nature of a typical WebSocket API
scenario one finds in many scenarios, including automotive, IoT, and other
domains.

This project code base represents an example of using browser-based tests
against a WebSocket hosted service such as those represented in the
INRIX/OpenCar WebSocket API.

The tests themselves are not particularly important.  These happen to be
simplified versions of some of the many tests that are run against an
OpenCar *Xeno* service integration.  These tests (with the exception of
last one), will run against the publicly available OpenCar SDK, making
it easy to see how these tests work, both pass and fail, with minimal
set up.

From there, adapting to other scenarios is a matter of extending the tests
 and/or adapting the support code to suit the API expectations of a
 service layer that may be different than that of the OpenCar WSAPI
 exposed through its *Xeno* services.

## Organization of this document
 - Setting up
    - Setting up using OpenCar SDK
    - Setting up against OpenCar integration target
    - Usage in other contexts

 - The test runner
    - WebSocket support
    - PassFail support

 - Caveats and shortcomings

 - The tests
    - Echo test
    - OpenCar Telematics API and GPS tests
    - *Example* test (skipped)


---

## Setting up

The Git repository is published as the `ws-test` root directory that
the files are structured against.  To run the tests, the local server
must be able to serve these files over http protocol, as well as having
WebSocket endpoints available as required for each of the tested
interfaces.

#### Setting up using *OpenCar SDK*

The easiest way to check out these tests in action is to use the INRIX *OpenCar SDK*
 as the host integration.

- Obtain the latest OpenCar SDK from http://insidetrack.opencar.com. (SDK version 2.3 or higher recommended for best results)
- Copy (or link) the `ws-test` directory (*this directory*) into your
local OpenCar folder (~/OpenCar)
- Open your Chrome browser and point it to http://localhost:4242/ui/user/wstest/

#### Setting up using an integration target

These steps are only relevant if you are an approved INRIX/OpenCar partner who
is working with OpenCar integration materials.  The information here however
may be informative for other contexts wishing to adapt to these tests, however.

If you are interested in becoming a qualified INRIX/OpenCar partner, please
contact Paul Boyes <Paul.Boyes@inrix.com> for more information.


Create your *Xeno* integration server according to the specifications of
the *OpenCar Integrator's Guide* and/or by using a *Xeno Evaluation Kit*
instance, and configure it to either serve from a root that contains the
`ws-test` directory, or point it at the `ws-test` directory itself.

*Note this can also be done using the `opencar` command of a standard SDK
release*

e.g.

    opencar run -u /full/path/to/ws-test/

And then run the tests by pointing to

http://localhost:4242/ui/index.html

(or http://localhost:4242/ui/ws-test/index.html if you have placed the ws-test
directory within your own service root)

(Note the tests are not expected to pass when pointed in this way
in a normal SDK installation, as the supporting files for the services
will not be available.  Follow the steps for SDK setup for successful
execution in a standard SDK release.)


#### Usage in other contexts

Of course, in a context that is not based on OpenCar technologies, you
may need to make other adjustments.

Modifications of this basic structure should allow other configurations
such as serving the html / javascript portions of tests from one server,
or possibly under file:// protocol,
while using a different host address for WebSocket access

Such code modifications are left to the imagination and efforts of the
reader, however.
No specific advice or predictions on these types of changes is made available.

## The test runner
The test runner exhibited here is the result of starting with the common and
standard JavaScript test framework *Jasmine* (https://jasmine.github.io)

Jasmine is good for the unit-test types of API evaluation it is principally
designed for, but is awkward to use for asynchronous service-based
API scenarios, such as the WebSocket APIs used here.  Jasmine also has
no good mechanism for "fail early" handling in which subsequent
test operations are skipped if a predicate test has failed (or,
for that matter, passed early).

Some of these scenarios are addressed with this wrapper through
the `PassFail` class, and supported by the `WsTestBase` handler.

*This test solution is not a complete answer to this problem*.

There are still many issues that a more complete test framework
(perhaps the evolution of this one) should address much more
gracefully, such as a semantically simpler sequence and state
management structure, or even just a per-test timeout mechanism.

See *Caveats* below for more on this.

Sadly, there is no true documentation on this available at this time.
Please refer to the notes below, and also to the code and the examples themselves.

Share your own notes and experiences to this forum so that others can benefit
 from your observations and suggestions also!

---

### Erstwhile quick docs

##### Anatomy of a test spec
A test *spec* has the same meaning here as it does in classic Jasmine use.
This names one or more test suites and the tests within them.

All of the Jasmine capabilities are available, but the `PassFail`
wrapper sets up some different calling points that harness real-time console
logging and rudimentary sequence management.

###### Module dependencies

The test system makes use of `require.js` (http://requirejs.org) to
load dependent modules.  Each test spec file starts out with the following
wrapper declaration:

```
define(['lib/WsTestBase', 'lib/PassFail'],function(WsTestBase, Test) {
    'use strict';


});
```

Here we see we are importing `WsTestBase`, and `PassFail` from the lib folder.
Note also that the `PassFail` object is given the alias `Test` as it will be referred to in the spec file itself.

###### Jasmine setup

Next, we use the standard Jasmine `describe` structure to declare a test suite, and
use the Jasmine `beforeEach` and `afterEach` mechanisms to attach our
WsTestBase object.

```
    describe('websocket echo', function() {
        beforeEach(function(done){
            WsTestBase.beforeEach(done,'ws://' + window.oc.host + '/echo');
        });
        afterEach(WsTestBase.afterEach);
```

Note that n the `beforeEach` block, we specify the WebSocket endpoint that this test applies to (e.g `echo`).

*Note: the `window.oc.host` reference above is specific to the OpenCar context.
You may wish to substitute your own host identifier here if not using an OpenCar set up.*

###### Test declarations

Each test is then constructed within the `describe` scope, just as
  standard Jasmine use would have you create via `it(` statements.

Here, we use the semantics of the `PassFail`
class object rather than using the Jasmine syntax directly.

The `PassFail` (Test) object frames tests up a little differently
 than standard Jasmine:

 - Tests are not started with `it(` declarations directly.  Rather,
 a new test is constructed with a `new Test(` invocation.
 - Like the `it(` method, this accepts a title and a function that is
 passed a `done` callback.  Additionally, the instance of the Test (`PassFail`) object
 is passed along as a second parameter along with `done`.  This `PassFail` instance is
 carried through as a reference to this asynchronous context activity overall.
 By the convention used here, this parameter is named `PF` and is referred to
 throughout.
 - `PF.start()` is called to initiate the actual test, and make connection to
 the advertised websocket.
 - The `WsTestBase.send(...)` and `WsTestBase.listen(...)` methods are used to
 send and receive data via WebSockets at the named connection.
 - Evaluations may be done directly in Jasmine, but better tracking and
 logging is achieved by using the validation methods of the `PF` object as the
 last evaluation in a set.
 These validation methods are:
    - `expectExists(`*testValue*, *because*)
    - `expectValue(`*testValue*, *expectedValue*, *because*)
    - `expectType(`*testTest*, *expectedType*, *because*)

    In each of these, *because* is a explanatory string to explain why this expectation is asserted.
    Execution stops with a "fail" if these assert as false.

A very simple test looks like this:

```
                    new Test('echo', function(done, PF) {
                        PF.start();
                        var message = "Hello There";
                        WsTestBase.send(message, PF);

                        WsTestBase.listen(function(response){
                            PF.expectValue(response, message, "Echo should receive what it sends");
                            PF.pass(done);
                        });
                    });
```

###### Skipping a test

A test may be declared as skipped.  This is akin to the `xit(` feature of Jasmine,
but must be done differently within the `PassFail` framework.

An example of this is the */example* test, which is disabled by default here
because it is not supported in the SDK version.  This is declared as such:

```
        new Test.skipTest('Not supported by SDK',
            'Basic Test', function(done, PF) {

            PF.start();
            ...
```

Of course, a test could simply be commented out, but this would not
report it as a skipped test per Jasmine `xit(` norms.

To enable this test, return it to:

```
        new Test(
            'Basic Test', function(done, PF) {
```


## Caveats and shortcomings, wish-list

While the `PassFail` harness does provide some relief from the
shortcomings of using Jasmine directly in such asynchronous sequence contexts,
it does not fully solve all problems.

- As tests become increasingly more complex, the need to
create helper functions, state managers, etc. within the test
structure quickly obfuscates easy reading of the test itself.
This is in part a situation shared with classic Jasmine use,
but the inherently more complex nature of asynchronous coding makes
 this an increasingly common situation.   One wishes for a
  more organized structured solution.

- Jasmine has a one-time configurable page time out, `jasmine.DEFAULT_TIMEOUT_INTERVAL`,
that can be set once per page (the default is about 5 seconds).  Some longer-running
asynchronous scenarios may require this to be set higher.  However, doing so
will mean that any failure may delay this full amount of time before ultimately
reporting a timeout, making full-suite coverage time-consuming in a failing case.
A better timeout mechanism in the wrapper and/or at the Jasmine level itself
would be quite welcome.

- Although the PF structure allows a sequence flow to pass from one scenario
into the next, the code for this becomes nested, with state handling managed at each tier level.
A more structured 'state control' model would improve the readability and maintainability of this type of code.

- The logging used here is adaptable to a more exportable format, and
with only a little modification each test completion can be posted to a
receiving service.  This is valuable in a continuous-integration monitoring
setup.

----

## The tests

A brief description of the tests themselves and some
of the approaches within them.

###### Echo
The echo test is based upon the standard WebSocket echo
(https://www.websocket.org/echo.html) and is included as part of
standard WebSocket suite of OpenCar *Xeno* integrations, including
the SDK.

This simply returns what it has been sent.  It does not
utilize any aspect of the OpenCar WSAPI envelope as part of
its protocol.


###### Telematics API

This test is aimed at the OpenCar `/tmx-receiver` interface.
This interface is described in the *OpenCar Integrator's Guide*, but
for purposes of this example the details are not important.

This simply makes a request to start telematics signaling.
The initial set of all published values is expected to come
forthwith.  This is the extent of this test.  In an actual
setup, additional signals will continue to arrive as telematics
values change (but that is not tested here).

Note the use of `WsTestBase.validate` to insure that we get a
valid acknowledgement to the request first.  The established listener
is used to look for the expected *SignalEvent* message and then
evaluates the results therein.


###### GPS

Another example related to signal information is the GPS
test.  This uses the telematics API structure responsible
for communicating all vehicle signals in the OpenCar system,
and looks specifically for known GPS components.

The test stops short of performing any specific verification of the
values it finds from the GPS signals; it merely ensures that
these signals are published.  However, this illustrates perhaps
a little more completely how one might set up for such a
test.


###### Example

This test was originally designed as a complement to the `Example WebSocket API`
exercise of the `Xeno Evaluation Kit` introduction for qualified
integration partners working with OpenCar for *Xeno* extensions.

In this context, it is marked as a "skipped" test, and
serves as an example of how you may wish to mark your own
tests as "skipped" in a similar way.


#### Feedback and additional info

Please use the forum features of GitHub for comments, suggestions, or
Pull Request proposals on this test framework and/or similar asynchronous
WebSocket sequence testing and logging scenarios.

For more information about the OpenCar product or its use of this type
of test framework in context, please direct inquiries to the
contacts below:

- Paul.Boyes@INRIX.com  (Integration partner relationships)
- Steve.Ohmert@INRIX.com (Technical)



