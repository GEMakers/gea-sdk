/*
 * Copyright (c) 2013 - General Electric - Confidential - All Rights Reserved
 * 
 * Author: Christopher Baker <christopher.baker2@ge.com>
 *  
 */

var stream = require("binary-stream");

const COMMAND_ERD_READ = 0xf0;
const COMMAND_ERD_WRITE = 0xf1;
const COMMAND_ERD_SUBSCRIBE = 0xf2;
const COMMAND_ERD_PUBLISH = 0xf5;

exports.plugin = function (bus, configuration, callback) {
    bus.on("message", function (message) {
        if (message.command == COMMAND_ERD_READ) {
            var reader = new stream.Reader(message.data, stream.BIG_ENDIAN);
            var count = reader.readUInt8();
            
            if (message.data.length == count * 2 + 1) {
                for (var i = 0; i < count; i++) {
                    var erd = reader.readUInt16();
           
                    bus.emit("read", {
                        erd: erd,
                        source: message.source,
                        destination: message.destination
                    });
                }
            }
            else {
                for (var i = 0; i < count; i++) {
                    var erd = reader.readUInt16();
                    var data = reader.readBytes(reader.readUInt8());
           
                    bus.emit("read-response", {
                        erd: erd,
                        data: data,
                        source: message.source,
                        destination: message.destination
                    });
                }
            }
            
            delete reader;
        }
        else if (message.command == COMMAND_ERD_WRITE) {        
            var reader = new stream.Reader(message.data, stream.BIG_ENDIAN);
            var count = reader.readUInt8();

            if (message.data.length == 1 + 2 * count) {
                for (var i = 0; i < count; i++) {
                    var erd = reader.readUInt16();
                    
                    bus.emit("write-response", {
                        erd: erd,
                        source: message.source,
                        destination: message.destination
                    });
                }
            }
            else {
                for (var i = 0; i < count; i++) {
                    var erd = reader.readUInt16();
                    var data = reader.readBytes(reader.readUInt8());
           
                    self.emit("write", {
                        erd: erd,
                        data: data,
                        source: message.source,
                        destination: message.destination
                    });
                }
            }
            
            delete reader;
        }
        else if (message.command == COMMAND_ERD_SUBSCRIBE) {
            var reader = new stream.Reader(message.data, stream.BIG_ENDIAN);
            var count = reader.readUInt8();
           
            if (message.data.length == 1) {
                /* ignore subscribe response */
            }
            else {
                for (var i = 0; i < count; i++) {
                    var erd = reader.readUInt16();
                    var time = reader.readUInt8();
           
                    bus.emit("subscribe", {
                        erd: erd,
                        source: message.source,
                        destination: message.destination
                    });
                }
            }
            
            delete reader;
        }
        else if (message.command == COMMAND_ERD_PUBLISH) {
            var reader = new stream.Reader(message.data, stream.BIG_ENDIAN);
           
            if (message.data.length == 0) {
                /* ignore publish response */
            }
            else {
                var count = reader.readUInt8();
           
                for (var i = 0; i < count; i++) {
                    var erd = reader.readUInt16();
                    var data = reader.readBytes(reader.readUInt8());
           
                    bus.emit("publish", {
                        erd: erd,
                        data: data,
                        source: message.source,
                        destination: message.destination
                    });
                }
            }
            
            delete reader;
        }
    });

    bus.read = function (erd) {
        var writer = new stream.Writer(3, stream.BIG_ENDIAN);
        writer.writeUInt8(1);
        writer.writeUInt16(erd.erd);
        
        bus.send({
            command: COMMAND_ERD_READ,
            source: erd.source,
            destination: erd.destination,
            data: writer.toArray()
        });
        
        delete writer;
    };
    
    bus.write = function (erd) {
        var writer = new stream.Writer(4 + erd.data.length, stream.BIG_ENDIAN);
        writer.writeUInt8(1);
        writer.writeUInt16(erd.erd);
        writer.writeUInt8(erd.data.length);
        writer.writeBytes(erd.data);
        
        bus.send({
            command: COMMAND_ERD_WRITE,
            source: erd.source,
            destination: erd.destination,
            data: writer.toArray()
        });
        
        delete writer;
    };
    
    bus.publish = function (erd) {    
        var writer = new stream.Writer(4 + erd.data.length, stream.BIG_ENDIAN);
        writer.writeUInt8(1);
        writer.writeUInt16(erd.erd);
        writer.writeUInt8(erd.data.length);
        writer.writeBytes(erd.data);
    
        bus.send({
            command: COMMAND_ERD_PUBLISH,
            data: writer.toArray(),
            source: erd.source,
            destination: erd.destination
        });
        
        delete writer;
    };
    
    bus.subscribe = function (erd) {
        var writer = new stream.Writer(4, stream.BIG_ENDIAN);
        writer.writeUInt8(1);
        writer.writeUInt16(erd.erd);
        writer.writeUInt8(0);
    
        bus.send({
            command: COMMAND_ERD_SUBSCRIBE,
            data: writer.toArray(),
            source: erd.source,
            destination: erd.destination
        }, callback);
        
        delete writer;
    };
    
    callback(bus);
};

