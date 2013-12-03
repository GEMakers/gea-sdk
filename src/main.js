/*
 * Copyright (c) 2013 - General Electric - Confidential - All Rights Reserved
 * 
 * Author: Christopher Baker <christopher.baker2@ge.com>
 *  
 */

var command = require("./command.js");
var erd = require("./erd.js");
var appliance = require("./appliance.js");

exports.configure = function (configuration) {
    configuration.bind = function (adapter, callback) {
        adapter.bind(configuration, callback);
    };
    
    configuration.plugin = function (plugin) {
        var bind = configuration.bind;
        
        configuration.bind = function (adapter, callback) {
            bind(adapter, function (bus) {
                plugin.plugin(bus, configuration, callback);
            });
        };
        
        return configuration;
    };
    
    return configuration.plugin(command).plugin(erd).plugin(appliance);
};


