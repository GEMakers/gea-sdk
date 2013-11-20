/*
 * Copyright (c) 2013 - General Electric - Confidential - All Rights Reserved
 * 
 * Author: Christopher Baker <christopher.baker2@ge.com>
 *  
 */

var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 0, 0 ]
});

app.bind(adapter, function (bus) {
    bus.on("version", function (message) {
        console.log(message.source + " v" + message.data.join("."));
    });
});

