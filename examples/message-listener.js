/*
 * Copyright (c) 2013 - General Electric - Confidential - All Rights Reserved
 * 
 * Author: Christopher Baker <christopher.baker2@ge.com>
 *  
 */

var gea = require("gea-sdk");
var adapter = require("gea-adapter-udp");

var app = gea.configure({
    address: 0x80,
    version: [ 0, 0, 0, 1 ]
});

app.bind(adapter, function (bus) {
    bus.on("error", function (error) {
        console.error(error);
    });
    
    bus.on("message", function (message) {
        console.log(message);
    });
    
    bus.send({ command: 1 });
});

