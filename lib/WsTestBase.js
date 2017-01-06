define(function() {
    'use strict';
    var connection;
    var listener;

    /**
     * Jasmine doesn't have a "fail" method, this is a work-around
     * @type {{toNotComeTrue: Function}}
     */
    var failMatcher = {
        toNotComeTrue : function(){
            return {
                compare : function(actual) {
                    return {
                        pass : false,
                        message : actual
                    }
                }
            }
        }
    };

    /**
     * Helper to fail a test -- because "expect(errorMessage).toNotComeTrue();" is a weird thing to say
     * @param errorMessage {String} Error message to send to Test Runner
     */
    var fail = function(errorMessage){
        expect(errorMessage).toNotComeTrue();
    };

    /**
     * Helper to prepare the request to send to server
     * @param request {Object} request to send to server
     */
    var send = function(request, PF){
        var request = typeof request === 'object' ? JSON.stringify(request) : request;
        if(PF) {
            PF.log("SENT: ", request);
        } else {
            console.log("SENT: ", request);
        }
        try{
            connection.send(request)
        }catch(e){
            if(PF) {
                PF.fail("failed to send");
            }
            fail("failed to send");
        }
    };

    /**
     * Helper to send binary.  Object is sent literally.
     * @param request {Object} request to send to server
     */
    var sendRaw = function(object, PF){
        if(PF) {
            PF.log("SENT RAW: ", object);
        } else {
            console.log("SENT RAW: ", object);
        }
        try{
            connection.send(object)
        }catch(e){
            if(PF) {
                PF.fail("failed to send");
            }
            fail("failed to send");
        }
    };

    /**
     * Validate that the server sent back a response and the appropriate events
     * @param expectedResponse {Object} The response the server must send back for our request
     * @param expectedEvents [Array] The events the server must send back
     * @param done [Function] Method to end test
     * @param strict [Boolean] (optional) If 'truthy', it indicates that no additional items in the response are allowed
     */
    var validate = function(expectedResponse, expectedEvents, done, PF, strict){

        // set listener for connection.onmessage
        listener = function(data) {
            var passed;
            if(PF) {
                PF.log("RECEIVED:", data);
            } else {
                console.log("RECEIVED:", data);
            }

            var serverResponse;
            try {
                serverResponse = JSON.parse(data);
            }
            catch(e) {
                console.error("Failed to parse data ",e);
                if(PF) {
                    PF.fail("Failed to parse data");
                }
            }
            var actualEvent = serverResponse && serverResponse.event;
            // we're looking at an event
            if(actualEvent && actualEvent.eventName) {
                // loop through our expected event to see if something matches
                expectedEvents.forEach(function(expectedEvent, index, expectedEvents){
                    // something matched, do validation
                    passed = (expectedEvent.eventName === actualEvent.eventName);
                    if(expectedEvent.eventName === actualEvent.eventName) {
                        if(strict) {
                            passed = (expectedEvent === actualEvent);
                            expect(expectedEvent).toEqual(actualEvent);
                        } else {
                            // match items named in expectedEvent to those of actualEvent.
                            // the actualEvent object may contain additional properties in non-strict mode.
                            for(var p in expectedEvent) {
                                if(expectedEvent.hasOwnProperty(p)) {
                                    if(actualEvent.hasOwnProperty(p)) {
                                        if(passed) {
                                            passed = (expectedEvent[p] === actualEvent[p]);
                                        }
                                        expect(expectedEvent[p]).toEqual(actualEvent[p]);
                                    }
                                }
                            }
                        }
                        // validation passed, remove expected event
                        expectedEvents.splice(index, 1);
                        // all events and the expected response is resolved
                        if(expectedEvents.length===0 && expectedResponse===null) {
                            // passed all tests
                            done(passed);
                        }
                    }
                });
            }

            var actualResponse = serverResponse && serverResponse.response;
            // we're looking at a response
            if(actualResponse) {
                var passed = true;
                // validate the response
                if(strict) {
                    passed = (expectedResponse === actualResponse);
                    expect(expectedResponse).toEqual(actualResponse);
                } else {
                    // match items named in expectedEvent to those of actualEvent.
                    // the actualEvent object may contain additional properties in non-strict mode.
                    for(var p in expectedResponse) {
                        if(expectedResponse.hasOwnProperty(p)) {
                            if(actualResponse.hasOwnProperty(p)) {
                                if(passed) {
                                    passed = (expectedResponse[p] === actualResponse[p]);
                                }
                                expect(expectedResponse[p]).toEqual(actualResponse[p]);
                            }
                        }
                    }
                }
                // validation passed -- marked as null so the events test know this is done
                expectedResponse = null;
                // looks like there's no more events tests
                if(expectedEvents.length===0) {
                    // passed all tests
                    done(passed);
                }
            }
        };
    };
    var listen = function(callback){
        console.log(callback);
        listener = callback;
    };

    return {
        beforeEach : function(done, url) {
            // register the 'fail' method
            jasmine.addMatchers(failMatcher);

            // connect to websocket
            connection = new WebSocket(url);
            //connection.binaryType = "arraybuffer";
            connection.onmessage = function(e) {
                if(typeof listener === 'function'){
                    listener(e.data);
                }
            }.bind(this);

            connection.onerror = function() {
                fail('Connection has unexpectedly errored');
                done();
            }.bind(this);
            // resolve beforeEach when connection is opened
            connection.onopen = function() {
                done();
            }.bind(this);
        },
        afterEach : function(){
            // done with test, close connection
            if(connection) {
                listener = null;
                connection.close();
            }
        },
        send : send,
        sendRaw: sendRaw,
        validate : validate,
        listen : listen
    }
});

