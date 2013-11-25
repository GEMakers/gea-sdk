/*
 * Copyright (c) 2013 - General Electric - Confidential - All Rights Reserved
 * 
 * Author: Christopher Baker <christopher.baker2@ge.com>
 *  
 */

var util = require("util");
var events = require("events");
var stream = require("binary-stream");

const MAX_ERD_LENGTH = 128;
const COMMAND_VERSION = 0x01;
const DISCOVERY_INTERVAL = 60000;

function Appliance (bus, versionResponse) {
    var self = this;
    
    this.address = versionResponse.source;
    this.version = versionResponse.data;
    
    function isResponse (response) {
        return response.source == versionResponse.source &&
            response.destination == versionResponse.destination;
    }
    
    bus.on("message", function (message) {
        if (versionResponse.source == message.source) {
            self.emit("message", message);
        }
    });
    
    this.send = function (command, data) {
        bus.send({
            command: command,
            data: data,
            source: versionResponse.destination,
            destination: versionResponse.source
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
            source: versionResponse.destination,
            destination: versionResponse.source
        });
    };
    
    this.write = function (erd, data, callback) {
        if (callback) {
            function handle (response) {
                if (isResponse(response) && response.erd == erd) {
                    callback();
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
            source: versionResponse.destination,
            destination: versionResponse.source
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
            source: versionResponse.destination,
            destination: versionResponse.source
        });
    };
    
    this.publish = function (erd, data) {
        bus.publish({
            erd: erd,
            data: data,
            source: versionResponse.destination,
            destination: versionResponse.source
        });
    };
    
    this.erd = function (type) {
        function read(reader, item, value) {
            var split = item.split(":");
            var name = split[0];
            var value_type = split[1];
            
            value[name] = reader["read" + value_type]();
        }
        
        function write(writer, item, value) {
            var split = item.split(":");
            var name = split[0];
            var value_type = split[1];
            var value_default = split[2];
            
            if (value[name] == undefined) {
                writer["write" + value_type](value_default);
            }
            else {
                writer["write" + value_type](value[name]);
            }
        }
    
        if (util.isArray(type.format)) {
            type.serialize = function (value, callback) {
                var writer = new stream.Writer(MAX_ERD_LENGTH, type.endian);
                
                for (var i = 0; i < type.format.length; i++) {
                    write(writer, type.format[i], value);
                }
                
                callback(writer.toArray());
                delete writer;
            };
            
            type.deserialize = function (data, callback) {
                var reader = new stream.Reader(data, type.endian);
                var value = { };
                
                for (var i = 0; i < type.format.length; i++) {
                    read(reader, type.format[i], value);
                }
                
                callback(value);
                delete reader;
            };
        }
        else {
            type.serialize = function (value, callback) {
                var writer = new stream.Writer(MAX_ERD_LENGTH, type.endian);
                writer["write" + type.format](value);
                callback(writer.toArray());
                delete writer;
            };
            
            type.deserialize = function (data, callback) {
                var reader = new stream.Reader(data, type.endian);
                var value = reader["read" + type.format]();
                callback(value);
                delete reader;
            };
        }
        
        type.read = function (callback) {
            self.read(type.erd, function (data) {
                type.deserialize(data, callback);
            });
        };
        
        type.write = function (value, callback) {
            type.serialize(value, function (data) {
                self.write(type.erd, data, callback);
            });
        };
        
        type.subscribe = function (callback) {
            self.subscribe(type.erd, function (data) {
                type.deserialize(data, callback);
            });
        };
        
        return type;
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

