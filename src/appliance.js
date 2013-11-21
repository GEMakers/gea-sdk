/*
 * Copyright (c) 2013 - General Electric - Confidential - All Rights Reserved
 * 
 * Author: Christopher Baker <christopher.baker2@ge.com>
 *  
 */

var util = require("util");
var events = require("events");

const COMMAND_VERSION = 0x01;
const DISCOVERY_INTERVAL = 60000;

function Appliance (bus, message) {
    this.address = message.source;
    this.version = message.data;
    
    function isResponse (response) {
        return response.source == message.source &&
            response.destination == message.destination;
    }
    
    this.send = function (command, data) {
        bus.send({
            command: command,
            data: data,
            source: message.destination,
            destination: message.source
        });
    };
    
    this.read = function (erd, callback) {
        if (callback) {
            function handle (response) {
                if (isResponse(response) && response.erd == erd) {
                    callback(response.data);
                }
                else {
                    bus.once("read-response", handle);
                }
            }
            
            bus.once("read-response", handle);
        }
    
        bus.read({
            erd: erd,
            source: message.destination,
            destination: message.source
        });
    };
    
    this.write = function (erd, data, callback) {
        if (callback) {
            function handle (response) {
                if (isResponse(response) && response.erd == erd) {
                    callback(response.data);
                }
                else {
                    bus.once("write-response", handle);
                }
            }
            
            bus.once("write-response", handle);
        }
    
        bus.write({
            erd: erd,
            data: data,
            source: message.destination,
            destination: message.source
        });
    };
    
    this.subscribe = function (erd, callback) {
        if (callback) {
            function handle (response) {
                if (isResponse(response) && response.erd == erd) {
                    callback(response.data);
                }
            }
            
            bus.on("publish", handle);
        }
    
        bus.subscribe({
            erd: erd,
            source: message.destination,
            destination: message.source
        });
    };
    
    this.publish = function (erd, data) {
        bus.publish({
            erd: erd,
            data: data,
            source: message.destination,
            destination: message.source
        });
    };
}

util.inherits(Appliance, events.EventEmitter);

exports.plugin = function (bus, configuration, callback) {
    var appliances = [];
    
    bus.on("message", function (message) {
        if (message.command == COMMAND_VERSION && message.data.length > 0) {
            if (appliances[message.source]) {
                /* we already have the appliance in the list */
            }
            else {
                var appliance = new Appliance(bus, message);
                appliances[message.source] = appliance;
                bus.emit("appliance", appliance);
            }
        }
    });
    
    function discover() {
        bus.send({
            command: COMMAND_VERSION
        });
    }
    
    setInterval(discover, DISCOVERY_INTERVAL);
    discover();
    
    callback(bus);
};

