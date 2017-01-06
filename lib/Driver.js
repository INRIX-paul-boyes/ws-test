var fs = require('fs');
var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');

var By = webdriver.By;

webdriver.WebDriver.prototype.saveScreenshot = function(filename) {
    return driver.takeScreenshot().then(function(data) {
        fs.writeFile(filename, data.replace(/^data:image\/png;base64,/,''), 'base64', function(err) {
            if(err) throw err;
        });
    })
};
var Driver = function(){
    var capability = webdriver.Capabilities.chrome();
    var options = new chrome.Options();
    options.addArguments("test-type");
    var driver = new webdriver.Builder().
        withCapabilities(capability).
        setChromeOptions(options).
        build();

    this.home = function(){
        driver.get('http://localhost:4242/ui/index.html');
        var loadPromise = driver.wait(function() {
            return driver.getTitle().then(function(title) {
                return title.indexOf("OCC -") === 0;
            });
        }, 5000).then(function(){
                return this.injectFunctions();
            }.bind(this));
        return loadPromise;
    };

    this.get = function(appId){
        driver.get('http://localhost:4242/ui/index.html#/app/'+appId);
        var loadPromise = driver.wait(function() {
            return driver.getTitle().then(function(title) {
                return title === ('OCC - '+appId);
            });
        }, 5000).then(function(){
                return driver.switchTo().frame(0);
            }).then(function(){
                return this.injectFunctions();
            }.bind(this));
        return loadPromise;
    };
    this.injectFunctions = function(){
        driver.executeScript('window.simulateKeyEvent = ' + simulateKeyEvent.toString());
        return this.sleep(1000);
    };
    this.sleep = function(timeout){
        return driver.wait(function(){
            var d = webdriver.promise.defer();
            setTimeout(function(){
                d.fulfill(true);
            },timeout);
            return d.promise;
        });
    };
    this._getDriver = function(){
        // get the raw driver -- probably as a last resort
        // we want to abstract things out and do things on a high level instead
        return driver;
    };
    this.getActiveElement = function(){
        return driver.switchTo().activeElement();
    };
    this.joystickUp = function(){
        simulateKey(driver, 87);
        return this.sleep(500);
    };
    this.joystickRight = function(){
        simulateKey(driver, 68);
        return this.sleep(500);
    };
    this.joystickDown = function(){
        simulateKey(driver, 83);
        return this.sleep(500);
    };
    this.joystickLeft = function(){
        simulateKey(driver, 65);
        return this.sleep(500);
    };
    this.getElementById = function(id){
        return driver.findElement(By.id(id));
    };
    this.fire = function(){
        simulateKey(driver, 13);
        return this.sleep(500);
    };
    this.quit = function(){
        return driver.quit();
    };

};

function simulateKey(driver, key){
    return driver.executeScript('simulateKeyEvent('+key+');');
}

function simulateKeyEvent (k) {
    var keydownEvent = document.createEvent('KeyboardEvent');
    Object.defineProperty(keydownEvent, 'keyCode', {
        get : function() {
            return this.keyCodeVal;
        }
    });
    Object.defineProperty(keydownEvent, 'which', {
        get : function() {
            return this.keyCodeVal;
        }
    });
    if (keydownEvent.initKeyboardEvent) {
        keydownEvent.initKeyboardEvent("keydown", true, true, document.defaultView, false, false, false, false, k, k);
    } else {
        keydownEvent.initKeyEvent("keydown", true, true, document.defaultView, false, false, false, false, k, 0);
    }
    keydownEvent.keyCodeVal = k;

    var keyupEvent = document.createEvent('KeyboardEvent');
    Object.defineProperty(keyupEvent, 'keyCode', {
        get : function() {
            return this.keyCodeVal;
        }
    });
    Object.defineProperty(keyupEvent, 'which', {
        get : function() {
            return this.keyCodeVal;
        }
    });
    if (keyupEvent.initKeyboardEvent) {
        keyupEvent.initKeyboardEvent("keyup", true, true, document.defaultView, false, false, false, false, k, k);
    } else {
        keyupEvent.initKeyEvent("keyup", true, true, document.defaultView, false, false, false, false, k, 0);
    }
    keyupEvent.keyCodeVal = k;

    document.dispatchEvent(keydownEvent);
    document.dispatchEvent(keyupEvent);
}

exports = module.exports = Driver;
