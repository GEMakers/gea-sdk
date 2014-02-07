/*
 * This application will show detailed information about an appliance.
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

