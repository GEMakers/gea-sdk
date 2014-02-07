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

