define(['lib/WsTestBase', 'lib/PassFail'],function(WsTestBase, Test) {
    'use strict';


    // Set this to false to allow sequenced tests to continue even if a stage has an error.
    // With it set to true, the test ends when an error is received.
    var exitOnError = true;

    describe('websocket example', function() {
        beforeEach(function(done){
            WsTestBase.beforeEach(done,'ws://' + window.oc.host + '/example');
        });
        afterEach(WsTestBase.afterEach);

        // Use this just to keep an incremented id easily handy
        var requestId;
        function getNextRequestId() {
            if(!requestId) {
                requestId = Math.floor(Math.random() * 100);
            } else {
                requestId++;
            }
            return ""+requestId;
        }

        // Test a simple message (see README notes on use of skipTest here)
        new Test.skipTest('Not supported by SDK',
            'Basic Test', function(done, PF) {

            PF.start();
            var id = getNextRequestId(),
                method = 'get';

            WsTestBase.send({request:
            {
                method: method,
                reqID: id,
                parameters: {
                	path: "tbd/kdkdkd"
                }
            }}, PF);
            WsTestBase.listen(function(data){
                PF.log("Data received:", data);                
                PF.fail("Data should be defined", function() {
                    return typeof data !== "undefined";
                });
                PF.expectType(data, "string", "data response is JSON string");
                var resp = JSON.parse(data).response;
                PF.expectType(resp, "object", "Response object should be present");
                PF.expectValue(resp.errorCode, 0, "errorCode should be zero");
                PF.pass(done);
            });
        });
    });
});
