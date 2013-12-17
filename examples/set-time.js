/*
 * Copyright (c) 2013 - General Electric - Confidential - All Rights Reserved
 * 
 * Author: Christopher Baker <christopher.baker2@ge.com>
 *
 * This application will read the current time from an appliance and show it to
 * the user. It will prompt the user to change the time on the appliance. If no
 * time is entered, it will default to the current time on the computer.
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

