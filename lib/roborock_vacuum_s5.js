"use strict";

// Roborock S5

const {roborock_vacuum_s4} = require("./roborock_vacuum_s4");

class roborock_vacuum_s5 extends roborock_vacuum_s4 {
	constructor() {
		super();

		//states
		this.states.mop_mode = {
			"300": "Standard",
			"301": "Deep",
			"303": "Deep+"
		};
		this.states.water_box_mode = {
			"200": "Off",
			"201": "Low",
			"202": "Medium",
			"203": "High",
			"204": "Customize (Auto)",
			"207": "Custom (Levels)"
		};

		// deviceStatus
		this.setup.deviceStatus.mop_mode = {
			"name": "Mop mode",
			"type": "number",
			"states": this.states["mop_mode"],
			"write": false
		};
		this.setup.deviceStatus.water_shortage_status = {
			"name": "Water Shortage Status",
			"type": "number",
			"write": false
		};
		this.setup.deviceStatus.mop_forbidden_enable = {
			"name": "Mop Forbidden Enable",
			"type": "number",
			"write": false
		};
		this.setup.deviceStatus.water_box_carriage_status = {
			"name": "Water Box Carriage Status",
			"type": "number",
			"write": false
		};
		this.setup.deviceStatus.water_box_status = {
			"name": "Water Box Status",
			"type": "number",
			"write": false
		};
		this.setup.deviceStatus.water_box_mode = {
			"type": "number",
			"name":"Amount of water to use",
			"states": this.states["water_box_mode"],
			"write": false
		};

		// commands
		this.setup.commands.set_mop_mode = {
			"type": "number",
			"name":"Mop Route",
			"def":300,
			"states": this.states["mop_mode"],
			"write": true
		};
	}
}

module.exports = {
	roborock_vacuum_s5: roborock_vacuum_s5,
	extended_robot: roborock_vacuum_s5
};