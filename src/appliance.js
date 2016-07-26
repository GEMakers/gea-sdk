/*
 * Copyright (c) 2014 General Electric
 *  
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *  
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
 * 
 */

var util = require("util");
var events = require("events");
var stream = require("binary-stream");

const MAX_SERIALIZED_LENGTH = 128;
const COMMAND_POLL_INTERVAL = 200;

const COMMAND_VERSION = 0x01;
const DISCOVERY_INTERVAL = 1000;

function arrayEquals (a, b) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] != b[i]) return false;
    }
    
    return a.length == b.length;
}

function Item (type) {
    function parse (item) {
        var name, type, size, default_value;
        var split = item.split(":");
        
        if (split.length == 1) {
            // type@size
            split = split[0].split("@");
            type = split[0];
            size = split[1];
        }
        else {
            // name:type@size:default
            name = split[0];
            default_value = split[2];
            split = split[1].split("@");
            type = split[0];
            size = split[1];
        }
        
        return {
            name: name,
            type: type,
            size: size,
            default: default_value
        };
    }

    function read (reader, item, value) {
        var i = parse(item);
        value[i.name] = reader["read" + i.type](i.size);
    }
    
    function write (writer, item, value) {
        var i = parse(item);
        
        if (value[i.name] == undefined) {
            writer["write" + i.type](i.default);
        }
        else {
            writer["write" + i.type](value[i.name]);
        }
    }

    if (util.isArray(type.format)) {
        this.serialize = function (value, callback) {
            var writer = new stream.Writer(MAX_SERIALIZED_LENGTH, type.endian);
            
            for (var i = 0; i < type.format.length; i++) {
                write(writer, type.format[i], value);
            }
            
            callback(writer.toArray());
            delete writer;
        };
        
        this.deserialize = function (data, callback) {
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
        this.serialize = function (value, callback) {
            var i = parse(type.format);
            var writer = new stream.Writer(MAX_SERIALIZED_LENGTH, type.endian);
            writer["write" + i.type](value);
            callback(writer.toArray());
            delete writer;
        };
        
        this.deserialize = function (data, callback) {
            var i = parse(type.format);
            var reader = new stream.Reader(data, type.endian);
            var value = reader["read" + i.type](i.size);
            callback(value);
            delete reader;
        };
    }
}

util.inherits(Item, events.EventEmitter);

function Endpoint (bus, source, destination) {
    var self = this;
    this.address = destination;
    
    function isResponse (response) {
        return response.source == destination &&
            response.destination == source;
    }
    
    function isNotFiltered (message) {
        return message.destination == source ||
            message.destination == destination;
    }
    
    bus.on("message", function (message) {
        if (isNotFiltered(message)) {
            self.emit("message", message);
        }
    });
    
    bus.on("read", function (message, callback) {
        if (isNotFiltered(message)) {
            self.emit("read", message, callback);
        }
    });
    
    bus.on("write", function (message, callback) {
        if (isNotFiltered(message)) {
            self.emit("write", message, callback);
        }
    });
    
    this.send = function (command, data, callback) {
        if (callback) {
            function handle (response) {
                if (isResponse(response) && response.command == command) {
                    callback(response.data);
                }
                else {
                    bus.once("message", handle);
                }
            }
            
            bus.once("message", handle);
        }
        
        bus.send({
            command: command,
            data: data,
            source: source,
            destination: destination
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
            source: source,
            destination: destination
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
            source: source,
            destination: destination
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
            source: source,
            destination: destination
        });
    };
    
    this.publish = function (erd, data) {
        bus.publish({
            erd: erd,
            data: data,
            source: source,
            destination: destination
        });
    };
    
    this.item = function (type) {
        return new Item(type);
    };
    
    this.command = function (type) {
        var item = this.item(type);
        
        if (type.readCommand == undefined) type.readCommand = type.command;
        if (type.writeCommand == undefined) type.writeCommand = type.command;
        if (type.readData == undefined) type.readData = [];
        
        item.read = function (callback) {
            self.send(type.readCommand, type.readData, function (data) {
                item.deserialize(data, callback);
            });
        };
        
        item.write = function (value, callback) {
            item.serialize(value, function (data) {
                self.send(type.writeCommand, data, callback);
            });
        };
        
        item.subscribe = function (callback) {
            var state = [];
            
            function update () {
                self.send(type.readCommand, type.readData, function (data) {
                    if (!arrayEquals(state, data)) {
                        state = data;
                        item.deserialize(data, callback);
                    }
                });
            }
            
            setInterval(update, COMMAND_POLL_INTERVAL);
        };
        
        self.on("message", function (message) {
            if (message.command == type.readCommand &&
                arrayEquals(message.data, type.readData)) {
                
                item.emit("read", function (value) {
                    if (value == undefined) {
                        /* there is no error handling for commands */
                    }
                    else {
                        item.serialize(value, function (data) {
                            bus.send({
                                command: type.readCommand,
                                data: data,
                                source: destination,
                                destination: message.source
                            });
                        });
                    }
                });
            }
            else if (message.command == type.writeCommand) {
                item.deserialize(message.data, function (value) {
                    item.emit("write", value, function (error) {
                        /* there is error handling for commands */
                    });
                });
            }
        });
        
        return item;
    };
    
    this.erd = function (type) {
        var item = this.item(type);
    
        item.read = function (callback) {
            self.read(type.erd, function (data) {
                item.deserialize(data, callback);
            });
        };
        
        item.write = function (value, callback) {
            item.serialize(value, function (data) {
                self.write(type.erd, data, callback);
            });
        };
        
        item.subscribe = function (callback) {
            self.subscribe(type.erd, function (data) {
                item.deserialize(data, callback);
            });
        };
        
        self.on("read", function (request, callback) {
            if (request.erd == type.erd) {
                item.emit("read", function (value) {
                    item.serialize(value, callback);
                });
            }
        });
        
        self.on("write", function (request, callback) {
            if (request.erd == type.erd) {
                item.deserialize(request.data, function (value) {
                    item.emit("write", value, callback);
                });
            }
        });
        
        return item;
    };
}

util.inherits(Endpoint, events.EventEmitter);

function Appliance (bus, source, destination, version) {
    var endpoint = new Endpoint(bus, source, destination);
    endpoint.version = version;
    
    endpoint.modelNumber = endpoint.erd({
        erd: 0x0001,
        format: "Ascii"
    });
    
    endpoint.serialNumber = endpoint.erd({
        erd: 0x002,
        format: "Ascii"
    });
    
    endpoint.remoteEnable = endpoint.erd({
        erd: 0x003,
        format: "UInt8"
    });
    
    endpoint.userInterfaceLock = endpoint.erd({
        erd: 0x004,
        format: "UInt8"
    });
    
    endpoint.clockTime = endpoint.erd({
        erd: 0x005,
        format: [
            "hours:UInt8",
            "minutes:UInt8",
            "seconds:UInt8",
        ]
    });
    
    endpoint.clockFormat = endpoint.erd({
        erd: 0x006,
        format: "UInt8"
    });
    
    endpoint.temperatureDisplayUnits = endpoint.erd({
        erd: 0x007,
        format: "UInt8"
    });
    
    endpoint.applianceType = endpoint.erd({
        erd: 0x008,
        format: "UInt8"
    });
    
    endpoint.sabbathMode = endpoint.erd({
        erd: 0x009,
        format: "UInt8"
    });
    
    endpoint.soundLevel = endpoint.erd({
        erd: 0x00a,
        format: "UInt8"
    });
    
    return endpoint;
}

exports.plugin = function (bus, configuration, callback) {
    var appliances = [];
    var discoveryTimer = null;
    
    bus.on("message", function (message) {
        if (message.command == COMMAND_VERSION) {
            if (message.data.length == 0) {
                if (configuration.version) {
                    bus.send({
                        command: COMMAND_VERSION,
                        data: configuration.version,
                        source: configuration.address,
                        destination: message.source
                    });
                }
            }
            else {
                if (appliances[message.source]) {
                    /* we already have the appliance in the list */
                }
                else {
                    var appliance = new Appliance(bus,
                        message.destination, message.source, message.data);
                        
                    appliances[message.source] = appliance;
                    bus.emit("appliance", appliance);
                }
            }
        }
    });
    
    bus.endpoint = function (source, destination) {
        return new Endpoint(bus, source, destination);
    };
    
    bus.create = function (name, callback) {
        callback(bus.endpoint(configuration.address));
    };
    
    bus.startDiscovery = function () {
       if (discoveryTimer == null) {
          discoveryTimer = setInterval(function () {
             bus.send({ command: COMMAND_VERSION });
          }, DISCOVERY_INTERVAL);
       }
    };
    bus.stopDiscovery = function () {
       if (discoveryTimer != null) {
         clearInterval(discoveryTimer);
         discoveryTimer = null;
       }
    };
    discoveryTimer = setInterval(function () {
       bus.send({ command: COMMAND_VERSION });
    }, DISCOVERY_INTERVAL);
    
    callback(bus);
};
