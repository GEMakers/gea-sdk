/*
 * Copyright (c) 2013 - General Electric - Confidential - All Rights Reserved
 * 
 * Author: Christopher Baker <christopher.baker2@ge.com>
 *  
 */

var util = require("util");
var events = require("events");
var stream = require("binary-stream");

const BROADCAST_ADDRESS = 0xff;
const COMMAND_VERSION = 0x01;
                
function extend(destination, source) {
    var result = { };
    
    for (var key in source) {
        result[key] = source[key];
    }
    
    for (var key in destination) {
        result[key] = destination[key];
    }
    
    return result;
}

function matches(expected, message) {
    for (var key in expected) {
        if (expected[key] != message[key]) {
            return false;
        }
    }
    
    return true;
}

function Bus(configuration, bus) {
    var self = this;
    
    bus.on("error", function (error) {
        self.emit("error", error);
    });
    
    bus.on("message", function (message) {
        if (message.command == COMMAND_VERSION) {
            self.emit("version", message);
        }
    
        self.emit("message", message);
    });
    
    this.wait = function(message, timeout, callback) {
        var timer = setTimeout(function() {
            timer = null;
            callback(new Error("The timeout has been reached while waiting for the message"));
        }, timeout);
        
        function handle(response) {
            if (timer) {
                if (matches(message, response)) {
                    clearTimeout(timer);
                    callback(null, response);
                }
                else {
                    bus.once("message", handle);
                }
            }
        }
        
        bus.once("message", handle);
    };
    
    this.send = function (message, timeout, callback) {
        message = extend(message, {
            source: configuration.address,
            destination: BROADCAST_ADDRESS,
            data: []
        });
        
        bus.send(message);
        
        if (callback) {
            this.wait({
                source: message.destination,
                command: message.command
            }, timeout, callback);
        }
    };
    
    this.send({ command: COMMAND_VERSION });
}

util.inherits(Bus, events.EventEmitter);

exports.version = "0.0.0";

exports.configure = function (configuration) {
    configuration.bind = function (adapter, callback) {
        adapter.bind(configuration, function (bus) {
            callback(new Bus(configuration, bus));
        });
    };
    
    return configuration;
};

