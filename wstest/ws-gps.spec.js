define(['lib/WsTestBase', 'lib/PassFail'],function(WsTestBase, Test) {
    'use strict';

    // An implementation will use *one* of these choices for latitude and longitude reporting accuracy.
    // Assumed most common is the 32 bit container (_4B)

    var GpsLatitude_2B_ocid=1;          // 180th of a degree	0	360
    var GpsLongitude_2B_ocid=2;         // 180th of a degree	0	360
    var GpsLatitude_4B_ocid=3;		    // millionths of a degree	0	360		0.000001	6
    var GpsLongitude_4B_ocid=4;         // millionths of a degree	0	360		0.000001	6
    var GpsLatitude_3B_ocid=5;          // thousandths of a degree	0	360		0.001	3
    var GpsLongitude_3B_ocid=6;         // thousandths of a degree	0	360		0.001	3

    var GpsAltitude_2B_ocid=621;        // meter, -1024, 7168
    var GpsDirection_4B_ocid=613;       // millionths of a degree	0	360		0.000001	6

    var VehicleSpeed_ocid=908;          // the ocid used by this profile for VehicleSpeed (GPS speed)

    // Comment in/out these values according to what you need to test.
    var OCID = {
        GpsLatitude:    GpsLatitude_4B_ocid,
        GpsLongitude:   GpsLongitude_4B_ocid,
        GpsAltitude:    GpsAltitude_2B_ocid,
        GpsDirection:   GpsDirection_4B_ocid,
        //GpsPositionAccuracy: undefined,
        //GpsAltitudeAccuracy: undefined,
        VehicleSpeed:   VehicleSpeed_ocid
    };

    // Values will be tested if they are presented.  However, a stock Xeno implementation may present zero values
    // for a registered but unfilled signal.
    // Use the 'allowZero' flag to adjust expectations for the tested implementation.
    // If false, it will treat signals that report as zero as an error condition, which means that the
    // test will fail if implementation is otherwise working and values tested are naturally zero when run (e.g. speed).
    // If true, then zero is allowed.  This means the test may pass if a signal is simply unimplemented in a stock xeno build.
    var allowZero = true;


    describe('websocket GPS signals', function() {
        beforeEach(function(done){
            WsTestBase.beforeEach(done,'ws://' + window.oc.host + '/tmx-receiver');
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
        new Test('GPS Related signals are seen', function(done, PF) {
            PF.start();
            var id = getNextRequestId(),
                method = 'StartPush',
                ocidSet = [],
                timeoutHdl,
                seen = {},
                pass = 0;

            var success;
            var testSuccess = function(log) {
                for(var i=0; i<ocidSet.length; i++) {
                    var ocid = ocidSet[i];
                    if(seen[ocid] !== true) {
                        success = false;
                        if(log !== false) {
                            console.error("OCID " + ocid + " not seen on pass " + pass + " of signals");
                        }
                        else break;
                    }
                }
            };

            // make the set of signals to push
            for(var n in OCID) {
                if(OCID.hasOwnProperty(n)) {
                    if(OCID[n]) {
                        ocidSet.push(OCID[n]);
                        console.log("Looking for OCID "+n+" ("+OCID[n]+")");
                    }

                }
            }

            WsTestBase.send({request:
            {
                method: method,
                reqID: id,
                parameters: {
                    signals: ocidSet
                }
            }}, PF);
            WsTestBase.listen(function(response) {
                PF.log("Listen Response: "+ response);
                var r;
                try {
                    r = JSON.parse(response);
                }
                catch(e) {
                    console.error("Failed to parse Listen Response ",e);
                    PF.fail("Failed to parse Listen Response");
                }
                if(r && r.event) {
                    r = r.event;
                    pass++;
                    PF.expectValue(r.eventName, "SignalEvent", "Tmx Level Error: Expected to receive SignalEvent");
                    PF.expectType(r.signals, "object", "Tmx Level Error: Signals must be sent as an object type");
                    PF.expectValue(r.signals.length, undefined, "Tmx Level Error: Signals must not be an array");
                    var count = 0;
                    for (var p in r.signals) {
                        if(r.signals.hasOwnProperty(p)) {
                            count++;
                            console.log("OCID "+p+" seen");
                            if(!allowZero) {
                                seen[p] = r.signals[p] !== 0;
                            } else {
                                seen[p] = true;
                            }

                        }
                    }
                    PF.fail("Tmx Level Error: Expected at least one signal in set", function() {
                        return count > 0;
                    });

                    // Test for the OCID set named.  Call PF.pass(done) only if we've seen them all
                    // otherwise, we'll keep getting these requests until we do
                    // We can use the default timeout or else set our own
                    success = true;
                    testSuccess();
                    if(success) {
                        clearTimeout(timeoutHdl);
                        PF.pass(done);
                    }
                }
            });
            // Set a timeout to report failure to see signals
            timeoutHdl = setTimeout(function() {
                    testSuccess(false);
                    if(!success) {
                        var msg = "Expected signals not seen";
                        if (!allowZero) msg += " or reported a zero value (see configuration of test)";
                        PF.fail(msg);
                    }
                }, 3000);
        });
    });
});
