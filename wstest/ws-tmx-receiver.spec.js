define(['lib/WsTestBase', 'lib/PassFail'],function(WsTestBase, Test) {
    'use strict';

    describe('websocket [TMX RECEIVER]', function() {
        beforeEach(function(done){
            WsTestBase.beforeEach(done,'ws://' + window.oc.host + '/[TMX END POINT]');
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

        // Report (presumably correctly), as false
        new Test('[METHOD] is accepted', function(done, PF) {
            PF.start();
            var id = getNextRequestId(),
                method = '[METHOD]';

            WsTestBase.send({request:
            {
                method: method,
                reqID: id,
                parameters: {
                }
            }}, PF);
            WsTestBase.validate({
                method: method,
                reqID: id,
                errorCode: 0
            },[],function() { PF.pass(done);}, PF)
        });

        // Report (presumably correctly), as false
        new Test('Telematics events are received', function(done, PF) {
            PF.start();
            var id = getNextRequestId(),
                method = '[METHOD]';

            WsTestBase.send({request:
            {
                method: method,
                reqID: id,
                parameters: {
                }
            }}, PF);
            WsTestBase.listen(function(response) {
                PF.log("Listen Response: "+ response);
                var r ;
                try {
                    r = JSON.parse(response);
                }
                catch(e) {
                    console.error("Failed to parse Listen Response ",e);
                    PF.fail("Failed to parse Listen Response");
                }
                if(r && r.event) {
                    r = r.event;
                    PF.expectValue(r.eventName, "[SOME EVENT]", "Expected to receive [SOME EVENT]");
                    PF.expectType(r.signals, "object", "Signals must be sent as an object type");
                    PF.expectValue(r.signals.length, undefined, "Signals must not be an array");
                    var count = 0;
                    for (var p in r.signals) {
                        if(r.signals.hasOwnProperty(p)) {
                            count++;
                        }
                    }
                    PF.fail("Expected at least one signal in set", function() {
                        return count > 0;
                    });
                    PF.pass(done);
                }
            });
        });
    });
});
