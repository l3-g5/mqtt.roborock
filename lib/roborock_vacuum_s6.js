"use strict";

// Roborock S6

const {roborock_vacuum_s5} = require("./roborock_vacuum_s5");

class roborock_vacuum_s6 extends roborock_vacuum_s5 {
	constructor(adapter) {
		super();
		this.adapter = adapter;

		//states
		this.states.carpet_mode = {
			'[{"enable":0, "stall_time": 10, "current_low": 400, "current_high": 500, "current_integral": 450}]': "off",
			'[{"enable":1, "stall_time": 10, "current_low": 400, "current_high": 500, "current_integral": 450}]': "on"
		};

		this.setup.deviceStatus.carpet_mode = {
			"type": "string",
			"name":"Carpet Boost",
			"states": this.states["carpet_mode"],
			"write": false
		};
	}
}

module.exports = {
	roborock_vacuum_s6: roborock_vacuum_s6,
	extended_robot: roborock_vacuum_s6
};