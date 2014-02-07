/*
 * This application will read the current time from an appliance and show it to
 * the user. It will prompt the user to change the time on the appliance. If no
 * time is entered, it will default to the current time on the computer.
 *
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

var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

var app = gea.configure({
    address: 0xcb
});

function padLeft(value, size, pad) {
    var padded = "" + value;
    
    while (padded.length < size) {
        padded = pad + padded;
    }
    
    return padded;
}

function toString(time) {
    return padLeft(time.hours % 12 || 12, 2, "0") +
        ":" + padLeft(time.minutes, 2, "0") +
        ":" + padLeft(time.seconds, 2, "0");
}

function now() {
    var date = new Date();
    
    return toString({
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds()
    });
}

function parse(time) {
    var parts = time.split(":");
    
    return {
        hours: parseInt(parts[0]),
        minutes: parseInt(parts[1]),
        seconds: parseInt(parts[2])
    };
}

function prompt(question, callback) {
    process.stdin.resume();
    process.stdout.write(question + " ");

    process.stdin.once("data", function(data) {
        callback(data.toString().trim());
    });
}

app.bind(adapter, function (bus) {
    bus.once("appliance", function (appliance) {
        appliance.clockTime.read(function (time) {
            console.log("the current time on your appliance is " + toString(time));
        
            prompt("what time would you like to set? [" + now() + "]", function (time) {
                if (time.length == 0) {
                    time = now();
                }
                
                appliance.clockTime.write(parse(time));
                process.exit();
            });
        });
    });
});

