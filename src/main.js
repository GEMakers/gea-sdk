/*
 * Copyright (c) 2013 - General Electric - Confidential - All Rights Reserved
 * 
 * Author: Christopher Baker <christopher.baker2@ge.com>
 *  
 */

var stream = require("binary-stream");

const BROADCAST_ADDRESS = 0xff;
                
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

function create(bus, configuration, callback) {
    bus.wait = function(message, timeout, callback) {
        var timer = setTimeout(function() {
            timer = null;
            callback(new Error("The timeout has been reached"));
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
    
    var send = bus.send;
    
    bus.send = function (message, timeout, callback) {
        message = extend(message, {
            source: configuration.address,
            destination: BROADCAST_ADDRESS,
            data: []
        });
        
        send(message);
        
        if (callback) {
            bus.wait({
                source: message.destination,
                command: message.command
            }, timeout, callback);
        }
    };
    
    callback(bus);
}

exports.version = "0.0.0";

exports.configure = function (configuration) {
    configuration.bind = function (adapter, callback) {
        adapter.bind(configuration, function (bus) {
            create(bus, configuration, callback);
        });
    };
    
    return configuration;
};

