/*
 * Copyright (c) 2013 - General Electric - Confidential - All Rights Reserved
 * 
 * Author: Christopher Baker <christopher.baker2@ge.com>
 *  
 */

var stream = require("binary-stream");

const BROADCAST_ADDRESS = 0xff;

function extend (destination, source) {
    var result = { };
    
    for (var key in source) {
        if (source[key] != undefined) {
            result[key] = source[key];
        }
    }
    
    for (var key in destination) {
        if (destination[key] != undefined) {
            result[key] = destination[key];
        }
    }
    
    return result;
}

exports.plugin = function (bus, configuration, callback) {
    var send = bus.send;
    
    bus.send = function (message) {
        send(extend(message, {
            source: configuration.address,
            destination: BROADCAST_ADDRESS,
            data: []
        }));
    };
    
    callback(bus);
};

