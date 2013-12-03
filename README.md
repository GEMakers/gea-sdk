# GE Appliance Software Development Kit

This node.js package provides a framework for communicating with General Electric appliances.
There are three distinct APIs available for communicating to an appliance.
Each API offers a unique level of abstraction to suit as many different technical levels as possible.

## Installation
To install this package using the node.js package manager, issue the following commands:

```
npm install git+https://github.com/GEMakers/gea-sdk.git
```

## API
Below is the documentation for each of the functions provided by this package, as well as a few examples showing how to use them.

### *gea.configure(configuration)*
This function will configure settings for an application using the SDK.
An application object is returned that may be used to bind to the bus.
The *configuration* object has the following fields:
- address (the default source address for outgoing messages sent from the application)
- version (the version of the application, *defaults to undefined*)

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});
```

### *application.plugin(plugin)*
This function will load the *plugin* as an extension to the application.

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// load the plugin to gain access to refrigerator functions
app.plugin(require("gea-plugin-refrigerator"));
```

### *application.bind(adapter, callback)*
This function will use the *adapter* to bind to an address on the bus.
The *callback* will be called for each instance of the bus that was found.

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {
    console.log("bind was successful");
});
```

### *bus.send(message)*
This function will send a message to an endpoint on the *bus*.
The *message* object has the following fields:
- command (the command identifier of the message)
- data (the command payload represented as an array of bytes, *defaults to []*)
- destination (the address to send the message to, *defaults to broadcast address 0xff*)
- source (the address that is sending the message, *defaults to configuration address*)

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {

    // send a message
    bus.send({
        command: 0x01,
        data: [ 1, 2, 3, 4 ],
        source: 0xcb,
        destination: 0xff
    });
});
```

### *bus.on("message", callback)*
This event is emitted when a message is received on the *bus*.
The *message* object has the following fields:
- command (the command identifier of the message)
- data (the command payload represented as an array of bytes)
- destination (the address to send the message to)
- source (the address that is sending the message)

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {

    // listen for messages on the bus
    bus.on("message", function (message) {
        console.log("message:", message);
    });
});
```

### *bus.read(erd)*
This function will read an Entity Reference Designator (ERD) from an endpoint on the *bus*.
The *erd* object has the following fields:
- erd (the ERD identifier)
- destination (the address that owns the ERD, *defaults to broadcast address 0xff*)
- source (the address that is requesting the ERD read, *defaults to configuration address*)

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {

    // read an ERD
    bus.read({
        erd: 0x5100,
        source: 0xcb,
        destination: 0x80
    });
});
```

### *bus.on("read-response", callback)*
This event is emitted when the response to a read request is received on the *bus*.
The *erd* object has the following fields:
- erd (the ERD identifier)
- data (the ERD data represented as an array of bytes)
- destination (the address that requested the ERD read)
- source (the address that responded to the ERD read request)

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {

    // listen for read responses for an ERD
    bus.on("read-response", function (erd) {
        console.log("read response:", erd);
    });
});
```

### *bus.write(erd)*
This function will write an Entity Reference Designator (ERD) from an endpoint on the *bus*.
The *erd* object has the following fields:
- erd (the ERD identifier)
- data (the ERD data represented as an array of bytes, *defaults to []*)
- destination (the address that owns the ERD, *defaults to broadcast address 0xff*)
- source (the address that is requesting the ERD write, *defaults to configuration address*)

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {

    // write an ERD
    bus.write({
        source: 0xcb,
        destination: 0x80,
        erd: 0x5100,
        data: [0x12, 0x01, 0x5e, 0x01, 0x00,
               0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
    });
});
```

### *bus.on("write-response", callback)*
This event is emitted when the response to a write request is received on the *bus*.
The *erd* object has the following fields:
- erd (the ERD identifier)
- destination (the address that requested the ERD read)
- source (the address that responded to the ERD read request)

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {

    // listen for write responses for an ERD
    bus.on("write-response", function (erd) {
        console.log("write response:", erd);
    });
});
```

### *bus.subscribe(erd)*
This function will subscribe to changes for an Entity Reference Designator (ERD) from an endpoint on the *bus*.
The *erd* object has the following fields:
- erd (the ERD identifier)
- destination (the address that owns the ERD, *defaults to broadcast address 0xff*)
- source (the address that is requesting the ERD subscription, *defaults to configuration address*)

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {

    // write an ERD
    bus.write({
        source: 0xcb,
        destination: 0x80,
        erd: 0x5100,
        data: [0x12, 0x01, 0x5e, 0x01, 0x00,
               0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
    });
});
```

### *bus.on("publish", callback)*
This event is emitted when an Entity Reference Designator (ERD) is published on the *bus*.
The *erd* object has the following fields:
- erd (the ERD identifier)
- data (the ERD data represented as an array of bytes)
- destination (the address that subscribed to the ERD)
- source (the address that published the ERD)

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {

    // listen for publishes for an ERD
    bus.on("publish", function (erd) {
        console.log("publish:", erd);
    });
});
```

### *bus.publish(erd)*
This function will publish changes for an Entity Reference Designator (ERD) to an endpoint on the *bus*.
The *erd* object has the following fields:
- erd (the ERD identifier)
- data (the ERD data represented as an array of bytes, *defaults to []*)
- destination (the address to publish to, *defaults to broadcast address 0xff*)
- source (the address that owns the ERD, *defaults to configuration address*)

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0x80,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {

    // publish an ERD
    bus.publish({
        source: 0x80,
        destination: 0xbf,
        erd: 0x5100,
        data: [0x12, 0x01, 0x5e, 0x01, 0x00,
               0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
    });
});
```

### *bus.on("subscribe", callback)*
This event is emitted when an endpoint requests to subscribe to an Entity Reference Designator (ERD) on the *bus*.
The *erd* object has the following fields:
- erd (the ERD identifier)
- destination (the address that subscribed to the ERD)
- source (the address that published the ERD)

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {

    // listen for publishes for an ERD
    bus.on("subscribe", function (erd) {
        console.log("subscribe request:", erd);
    });
});
```

### *bus.on("read", callback)*
This event is emitted when an endpoint requests to read an Entity Reference Designator (ERD) on the *bus*.
The *erd* object has the following fields:
- erd (the ERD identifier)
- destination (the address that subscribed to the ERD)
- source (the address that published the ERD)

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {

    // listen for reads for an ERD
    bus.on("read", function (erd, callback) {
        console.log("read request:", erd);
        // callback(); // uncomment this to return an error
        // callback([0, 0, 0, 0]); // uncomment this to return with data
    });
});
```

### *bus.on("write", callback)*
This event is emitted when an endpoint requests to write an Entity Reference Designator (ERD) on the *bus*.
The *erd* object has the following fields:
- erd (the ERD identifier)
- data (the ERD data represented as an array of bytes)
- destination (the address that subscribed to the ERD)
- source (the address that published the ERD)

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {

    // listen for writes for an ERD
    bus.on("write", function (erd, callback) {
        console.log("write request:", erd);
        // callback(new Error("An error occurred")); uncomment this to return an error
        // callback(); // uncomment this to return with success
    });
});
```

### *bus.on("appliance", callback)*
This event is emitted whenever an appliance has been discovered on the bus.
For each appliance that is discovered, the callback is called with the appliance object as an argument.

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {
    bus.on("appliance", function (appliance) {
        console.log("address:", appliance.address);
        console.log("version:", appliance.version.join("."));
    });
});
```

### *appliance.send(command, data, callback)*
This function will send a command to the *appliance*.
The *command* argument is the command identifier.
The *data* argument is the command payload represented as an array of bytes.
The optional *callback* argument is a function to be called when a response is received.

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {
    bus.on("appliance", function (appliance) {

        // send a command to the appliance
        appliance.send(0x01, [], function (data) {
            console.log("response:", data);
        });
    });
});
```

### *appliance.on("message", callback)*
This event is emitted when a message is received from the *appliance*.
The *message* object has the following fields:
- command (the command identifier of the message)
- data (the command payload represented as an array of bytes)
- destination (the address to send the message to)
- source (the address that is sending the message)

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {
    bus.on("appliance", function (appliance) {

        // listen for messages from the appliance
        appliance.on("message", function (message) {
            console.log("message:", message);
        });
    });
});
```

### *appliance.read(erd, callback)*
This function will read an Entity Reference Designator (ERD) owned by the *appliance*.
The *erd* argument is the ERD identifier.
The optional *callback* argument is a function to be called when a response is received.

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {
    bus.on("appliance", function (appliance) {

        // read an ERD from the appliance
        appliance.read(0x5100, function (data) {
            console.log("response:", data);
        });
    });
});
```

### *appliance.write(erd, data, callback)*
This function will write an Entity Reference Designator (ERD) owned by the *appliance*.
The *erd* argument is the ERD identifier.
The *data* argument is the ERD data represented as an array of bytes.
The optional *callback* argument is a function to be called when a response is received.

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {
    bus.on("appliance", function (appliance) {

        // write an ERD owned by the appliance
        appliance.write(0x5100, [0x12, 0x01, 0x5e, 0x01, 0x00,
           0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    });
});
```

### *appliance.subscribe(erd, callback)*
This function will subscribe to changes for an Entity Reference Designator (ERD) owned by the *appliance*.
The *erd* argument is the ERD identifier.
The optional *callback* argument is a function to be called when a publish is received.

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xcb,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {
    bus.on("appliance", function (appliance) {

        // subscribe to changes for an ERD owned by the appliance
        appliance.subscribe(0x5100, function (data) {
            console.log("value changed:", data);
        });
    });
});
```

### *appliance.publish(erd, data)*
This function will publish an Entity Reference Designator (ERD) owned by the *appliance*.
The *erd* argument is the ERD identifier.
The *data* argument is the ERD data represented as an array of bytes.

``` javascript
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0x80,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {
    bus.on("appliance", function (appliance) {

        // publish an ERD owned by the appliance
        appliance.publish(0x5100, [0x12, 0x01, 0x5e, 0x01, 0x00,
           0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    });
});
```
