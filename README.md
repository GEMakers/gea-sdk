# GE Appliance Software Development Kit

This node.js package provides a framework for communicating with General Electric appliances.
There are three distinct APIs available for communicating to an appliance.
Each API offers a unique level of abstraction to suit as many different technical levels as possible.

## Command API
This is the lowest level of the API and provides no abstraction in the communication layer.
At this level, all communication is handled by sending GEA commands between endpoints.
This is identical to the internal appliance communication.
There are only two operations for this API: sending a message, and receiving a message.

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {
    bus.on("error", function (error) {
        console.error("error:", error);
    });
    
    bus.on("message", function (message) {
        console.log("received a message:", message);
    });
    
    // send a message
    bus.send({
        destination: 0x80,
        command: 0xf1,
        data: [0x01, 0x51, 0x00, 0x0d,
               0x12, 0x01, 0x5e, 0x01, 0x00,
               0x00, 0x00, 0x00, 0x00, 0x00,0x00, 0x00, 0x00]
    });
});
```

## ERD API
This is the middle level of the API and provides limited abstraction in the communication layer.
At this level, all communication is handled by requesting an Entity Reference Designator (ERD).
An ERD is a single piece of data (such as a temperature or a door status) that can be manipulated independently.
There are four operations available for each ERD in this API: read, write, publish, and subscribe.

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {
    bus.on("read", function (erd) {
        console.log("received a read request:", erd);
    });
    
    bus.on("write", function (erd) {
        console.log("received a write request:", erd);
    });
    
    bus.on("subscribe", function (erd) {
        console.log("received a subscribe request:", erd);
    });
    
    bus.on("publish", function (erd) {
        console.log("received a publish:", erd);
    });
    
    // read the value of an ERD
    bus.read({
        destination: 0x80,
        erd: 0x5100
    });
    
    // write the value of an ERD
    bus.write({
        destination: 0x80,
        erd: 0x5100,
        data: [ 0x12, 0x01, 0x5e, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,0x00, 0x00, 0x00 ]
    });
    
    // subscribe to changes for an ERD
    bus.subscribe({
        destination: 0x80,
        erd: 0x5100
    });
    
    // publish an updated value for an ERD
    bus.publish({
        destination: 0x80,
        erd: 0x5100,
        data: [ 0x12, 0x01, 0x5e, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,0x00, 0x00, 0x00 ]
    });
});
```

## Appliance API
This is the highest level of the API and provides complete abstraction from the communication layer.
At this level, all communication is handled by the framework.
Events are emitted when appliances are discovered and appliances are provided as objects.
The functions for each appliance is provided by an SDK plugin and may vary in abstraction.

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

var app = gea.configure({
    address: 0xcb
});

// load the range plugin
app.plugin(require("gea-plugin-range"));

app.bind(adapter, function (bus) {
    // wait for a range to be discovered
    bus.on("range", function (range) {
        console.log("range version:", range.version);
        
        // listen for changes to remote enable button
        range.on("remoteEnable", function (value) {
            console.log("remote control is " + (value > 0 ? "enabled" : "disabled"));
        });
        
        // listen for key press events
        range.on("keyPress", function (value) {
            console.log("the last key pressed was " + value);
        });
        
        // start a cook mode
        range.upperOven.cook({
            mode: 18,
            cookTemperature: 350,
            cookHours: 1,
            cookMinutes: 0
        });
    });
});

```
