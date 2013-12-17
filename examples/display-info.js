/*
 * Copyright (c) 2013 - General Electric - Confidential - All Rights Reserved
 * 
 * Author: Christopher Baker <christopher.baker2@ge.com>
 *
 * This application will display detailed information about your appliance.
 *
 */

var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

var app = gea.configure({
    address: 0xcb
});

app.bind(adapter, function (bus) {
    bus.once("appliance", function (appliance) {
        appliance.applianceType.read(function (applianceType) {
            appliance.modelNumber.read(function (modelNumber) {
                appliance.serialNumber.read(function (serialNumber) {
                    console.log("type:", applianceType);
                    console.log("version:", appliance.version.join("."));
                    console.log("model:", modelNumber.trim());
                    console.log("serial:", serialNumber.trim());
                });
            });
        });
    });
});

