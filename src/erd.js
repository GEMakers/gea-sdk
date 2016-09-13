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

var stream = require("binary-stream");

const COMMAND_ERD_READ = 0xf0;
const COMMAND_ERD_WRITE = 0xf1;
const COMMAND_ERD_SUBSCRIBE = 0xf2;
const COMMAND_ERD_SUBSCRIBE_LIST = 0xf3;
const COMMAND_ERD_UNSUBSCRIBE = 0xf4;
const COMMAND_ERD_PUBLISH = 0xf5;
const COMMAND_ERD_PUBLISH_ACKNOWLEDGMENT = 0xf5;

exports.plugin = function (bus, configuration, callback) {
    bus.on("message", function (message) {
        if (message.command == COMMAND_ERD_READ) {
            var reader = new stream.Reader(message.data, stream.BIG_ENDIAN);
            var count = reader.readUInt8();

            if (message.data.length == count * 2 + 1) {
                for (var i = 0; i < count; i++) {
                    var erd = reader.readUInt16();

                    function readResponse (data) {
                        if (data == undefined) {
                            bus.send({
                                command: COMMAND_ERD_READ,
                                data: [ 0 ],
                                source: configuration.address,
                                destination: message.source
                            });
                        }
                        else {
                            var writer = new stream.Writer(data.length + 4, stream.BIG_ENDIAN);
                            writer.writeUInt8(1);
                            writer.writeUInt16(erd);
                            writer.writeUInt8(data.length);
                            writer.writeBytes(data);

                            bus.send({
                                command: COMMAND_ERD_READ,
                                data: writer.toArray(),
                                source: configuration.address,
                                destination: message.source
                            });

                            delete writer;
                        }
                    }

                    bus.emit("read", {
                        erd: erd,
                        source: message.source,
                        destination: message.destination
                    }, readResponse);
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

                    function writeResponse (error) {
                        if (error) {
                            bus.send({
                                command: COMMAND_ERD_WRITE,
                                data: [ 0 ],
                                source: configuration.address,
                                destination: message.source
                            });
                        }
                        else {
                            var writer = new stream.Writer(3, stream.BIG_ENDIAN);
                            writer.writeUInt8(1);
                            writer.writeUInt16(erd);

                            bus.send({
                                command: COMMAND_ERD_WRITE,
                                data: writer.toArray(),
                                source: configuration.address,
                                destination: message.source
                            });

                            delete writer;
                        }
                    }

                    bus.emit("write", {
                        erd: erd,
                        data: data,
                        source: message.source,
                        destination: message.destination
                    }, writeResponse);
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
        else if (message.command == COMMAND_ERD_SUBSCRIBE_LIST) {
            var reader = new stream.Reader(message.data, stream.BIG_ENDIAN);

            function sendResponse (data) {
               if (data == undefined) {
                  bus.send({
                     command: COMMAND_ERD_SUBSCRIBE_LIST,
                     data: [ 0 ],
                     source: configuration.address,
                     destination: message.source
                  });
               }
               else {
                  bus.send({
                     command: COMMAND_ERD_SUBSCRIBE_LIST,
                     data: data,
                     source: configuration.address,
                     destination: message.source
                  });
               }
            }

            if (message.data.length == 1) {
                /* ignore subscribe list response */
            }
            else {
               bus.emit("subscribeList", {
                  source: message.source,
                  destination: message.destination
               }, sendResponse);
            }

            delete reader;
        }
        else if (message.command == COMMAND_ERD_UNSUBSCRIBE) {
            var reader = new stream.Reader(message.data, stream.BIG_ENDIAN);
            var count = reader.readUInt8();

            if (message.data.length == 1) {
                /* ignore unsubscribe response */
            }
            else {
                for (var i = 0; i < count; i++) {
                    var erd = reader.readUInt16();

                    bus.emit("unsubscribe", {
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

            bus.send({
                command: COMMAND_ERD_PUBLISH_ACKNOWLEDGMENT,
                data: null,
                source: configuration.address,
                destination: message.source
            });

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
