define(function() {
    'use strict'

    var PF = function(title, itfunc) {
        var self = this;
        self.testTitle = title;
        self.testStarted = undefined;
        self.logItems=[];
        self.summaryIssued = false;
        it(title, function(done) {
            self.specDone = done;
            itfunc(done, self);
        });
    };
    PF.skipTest = function(because, title, itfunc) {
        console.warn("* Test '"+title+"' will be skipped: "+because);
        xit(title, function(done){
            itfunc(done, title);
        })
    };
    PF.prototype.start = function(timeout) {
        var self = this;
        if(!timeout) {
            timeout = jasmine.DEFAULT_TIMEOUT_INTERVAL - 250;
        }
        this.specTimeoutHdl = setTimeout(function() {
            self.fail("Test not to end in timeout after "+timeout+"ms");
            self.specDone();
        }, timeout);

        console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        this.testStarted = new Date().getTime();
        console.warn("Started Test: '"+this.testTitle+"'  "+timestamp());
    };

    PF.prototype.pass = function(done, successMessage)
    {
        if(!this.summaryIssed) {
            successMessage = successMessage || "";
            this.logPrint();
            console.log("** TEST PASSED: '" + this.testTitle + "' ** " + successMessage);
            if (this.testStarted) {
                var elapsed = new Date().getTime() - this.testStarted;
                console.log("Execution time: " + elapsed + "ms");
            }
            console.log("=================================================================");
            console.log("");
            this.summaryIssued = true;
            clearTimeout(this.specTimeoutHdl);
        }
        expect("Expectations").toBeDefined();
        done();
    };

    PF.prototype.fail = function(errorMessage, test) {
        var failed = false;
        if (typeof test === "function") {
            failed = !test();
        }
        else failed = true;
        if (failed) {
            if(!this.summaryIssued) {
                this.logPrint();
                console.error("** TEST FAILED: '" + this.testTitle + "' ** " + errorMessage);
                if (this.testStarted) {
                    var elapsed = new Date().getTime() - this.testStarted;
                    console.log("Execution time: " + elapsed + "ms");
                }
                console.log("=================================================================");
                console.log("");
                this.summaryIssued = true;
                clearTimeout(this.specTimeoutHdl);
            }
            expect(errorMessage).toBe(true);
        }
    };

    PF.prototype.expectExists = function(testValue, because) {
        if(typeof testValue === "undefined") {
            this.fail("Expected "+testValue+" to be defined");
        }
    };

    PF.prototype.expectValue = function(testValue, expectedValue, because) {
        if (testValue !== expectedValue) {
            this.fail("Expected " + testValue + " to be " + expectedValue + ": " + because);
        }
    };

    PF.prototype.expectType = function(testValue, expectedType, because) {
        if (typeof testValue !== expectedType) {
            this.fail("Expected " + typeof testValue + " to be " + expectedType + ": " + because);
        }
    };

    PF.prototype.log = function() {
        this.logItems.push(Array.prototype.slice.call(arguments));
    };

    PF.prototype.logPrint = function() {
        var item;
        while(item = this.logItems.shift()) {
            var i;
            var m = "    ";
            while(i = item.shift()) {
                m += i.toString()+" ";
                if(typeof i === "object") {
                    console.log(i);
                }
            }
            console.log(m);
        }
    };

    function timestamp() {
        var now = new Date();
        var y = now.getFullYear();
        var m = now.getMonth()+1;
        var d = now.getDate();
        var h = now.getHours();
        var n = now.getMinutes();
        var s = now.getSeconds();
        var ms = now.getMilliseconds();
        if(m<10) m = "0"+m;
        if(d<10) d = "0"+d;
        if(h<10) h = "0"+h;
        if(n<10) n = "0"+n;
        if(s<10) s = "0"+s;
        while((""+ms).length < 3) {
            ms="0"+ms;
        }
        var ts = y+"-"+m+"-"+d+" "+h+":"+n+":"+s+"."+ms;
        return ts;
    }

    return PF;
});