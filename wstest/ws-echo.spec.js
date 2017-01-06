define(['lib/WsTestBase', 'lib/PassFail'],function(WsTestBase, Test) {
    'use strict';

    describe('websocket echo', function() {
        beforeEach(function(done){
            WsTestBase.beforeEach(done,'ws://' + window.oc.host + '/echo');
        });
        afterEach(WsTestBase.afterEach);

        new Test('echo', function(done, PF) {
            PF.start();
            var message = "Hello There";
            WsTestBase.send(message, PF);

            WsTestBase.listen(function(response){
                PF.expectValue(response, message, "Echo should receive what it sends");
                PF.pass(done);
            });
        });

        new Test('echo2', function(done, PF) {
            PF.start();
            var message = "Echo "+Math.floor(Math.random() * 10000);
            WsTestBase.send(message, PF);

            WsTestBase.listen(function(response){
                PF.expectValue(response, message, "Echo should receive what it sends");
                PF.pass(done);
            });
        });

        new Test('echo3', function(done, PF) {
            PF.start();
            var message = new Date().toString();
            WsTestBase.send(message, PF);

            WsTestBase.listen(function(response){
                PF.expectValue(response, message, "Echo should receive what it sends");
                PF.pass(done);
            });
        });

    });
});
