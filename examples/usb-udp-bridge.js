/*
 * Copyright (c) 2013 - General Electric - Confidential - All Rights Reserved
 * 
 * Author: Christopher Baker <christopher.baker2@ge.com>
 *  
 */

var gea = require("gea-sdk");
var usb = require("gea-adapter-usb");
var udp = require("gea-adapter-udp");

var app = gea.configure({
    address: 0xbb,
    version: [ 0, 0, 0, 1 ]
});

app.bind(usb, function (usb_bus) {
    app.bind(udp, function (udp_bus) {
        usb_bus.on("error", function (error) {
            console.error("usb:", error);
        });
        
        udp_bus.on("error", function (error) {
            console.error("udp:", error);
        });
        
        usb_bus.on("message", function (message) {
            console.log("usb:", message);
            udp_bus.send(message);
        });
        
        udp_bus.on("message", function (message) {
            console.log("udp:", message);
            usb_bus.send(message);
        });
        
        usb_bus.send({ command: 1 });
    });
});

