/*
 * Copyright (c) 2013 - General Electric - Confidential - All Rights Reserved
 * 
 * Author: Christopher Baker <christopher.baker2@ge.com>
 *  
 */

var util = require("util");
var events = require("events");

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

function Bus(configuration, bus) {
    var self = this;
    
    bus.on("error", function (error) {
        self.emit("error", error);
    });
    
    bus.on("message", function (message) {
        self.emit("message", message);
    });
    
    this.send = function (message) {
        return bus.send(extend(message, {
            source: configuration.address,
            destination: BROADCAST_ADDRESS,
            data: []
        }));
    };
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

