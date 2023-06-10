"use strict";

const fs = require("fs");
const iopackage = require("../io-package.json");
const log = require("./logger");

const state_file = "states.json";
const plugin_state_prefix = "x.y.";

const mqtt = require("mqtt");

class AdapterOptions {
}

class State {
	/**
	 * @param {*} val
	 * @param {boolean} ack
	 */
	constructor(val, ack) {
		// val: StateValue;
		this.val = val;
		// ack: boolean;
		this.ack = ack;
	}
}

class ExtendedState extends State {
	/**
	 * @param {*} val
	 * @param {boolean} ack
	 * @param {*} common
	 */
	constructor(val, ack, common = undefined) {
		super(val, ack);
		this.common = common;
	}
}

class Adapter {

	/**
	 * @param {AdapterOptions} _options
	 */
	constructor(_options) {
		try {
			const data = fs.readFileSync("config.json");
			const additionalConfig = JSON.parse(data.toString());
			this.config = { ...iopackage.native, ...additionalConfig};
		} catch (err) {
			console.log("Could not find config file 'config.json'. Copy and adapt 'config.json.template'.");
			process.exit();
		}
		this.log = new log.Logger(log.LogLevel[this.config.logLevel]);
		this.supportsFeature = undefined;

		this.vacuums = {};

		try {
			const data = fs.readFileSync(state_file);
			this.states = JSON.parse(data.toString());
		} catch (err) {
			this.states = {};
		}
		// resend all on restart
		for (const id in this.states) {
			this.states[id].ack = false;
		}

		this.subscribedStates = [];
		this.client = mqtt.connect(this.config.mqtt_host, {
			username: this.config.mqtt_user,
			password: this.config.mqtt_password,
			keepalive: 30
		});
		this.client.on("error", (result) => {
			this.log.error("MQTT connection error: " + result);
		});
		this.client.on("connect", () => {
			this.log.info("MQTT connected");
		});
		this.client.on("reconnect", () => {
			this.log.warn("MQTT connection reconnect.");
			this.client.on("message", this.onMessage.bind(this));
			for (const topic in this.subscribedStates) {
				this.client.subscribe(topic);
			}
		});
	}

	/**
	 * @param {string} id
	 * @returns {any}
	 */
	getState(id) {
		let val = this.states[id];
		if (val && val.val === undefined) {
			val = undefined;
		}
		return val;
	}

	/**
	 * @param {string} id
	 * @returns {Promise<State | undefined>}
	 */
	getStateAsync(id) {
		return new Promise((resolve) => { resolve(this.getState(id)); });
	}

	/**
	 * @param {string} id
	 * @param {State | boolean} state
	 * @returns {Promise<any>}
	 */
	setStateAsync(id, state) {
		if (id.startsWith(plugin_state_prefix)) {
			id = id.substring(plugin_state_prefix.length);
		}
		if (typeof (state) === "boolean") {
			state = new State(state, true);
		}
		let changed = true;
		if (!this.states[id]) {
			this.states[id] = state;
		} else {
			changed = this.states[id].val !== state.val || this.states[id].ack !== state.ack;
			this.states[id].val = state.val;
			this.states[id].ack = state.ack;
		}
		if (changed && id.startsWith("Devices.")) {
			const idParts = id.split(".");
			const duid = idParts[1];
			const folder = idParts[2];
			const command = idParts[3];
			if (folder !== "commands" && folder != "reset_consumables" && folder != "map" && folder != "firmwareFeatures"
				&& command != "Records" && command != "msg_seq" && command != "msg_ver") {
				idParts[0] = this.config.topic;
				idParts[1] = this.vacuums[duid].name.split(" ").join("_").toLowerCase();
				const topic = idParts.join("/");
				let val = state.val?.toString();
				if (command === "carpet_mode") {
					val = "[" + val + "]";
				}
				if (this.states[id].common?.states) {
					const newVal = this.states[id].common.states[val];
					if (newVal) {
						val = newVal;
					}
				}
				this.log.debug("MQTT:", topic, state.val, val);
				this.client.publish(topic, val);
			}
		}
		return new Promise((resolve) => { resolve(state); });
	}

	/**
	 * @param {string} stateName
	 * @returns {Promise<void>}
	 */
	deleteStateAsync(stateName) {
		this.states[stateName] = undefined;
		return new Promise((resolve) => { resolve(); });
	}

	/**
	 * @param {string} pattern
	 */
	subscribeStates(pattern) {
		const idParts = pattern.split(".");
		const duid = idParts[1];
		idParts[0] = this.config.topic;
		idParts[1] = this.vacuums[duid].name.split(" ").join("_").toLowerCase();
		idParts[3] = "#";
		const topic = idParts.join("/");
		this.log.debug("MQTT subscribe:", topic);
		this.client.subscribe(topic);
		this.subscribedStates.push(topic);
	}

	/**
	 * @param {string} id
	 * @param {*} obj
	 * @returns {Promise<any>}
	 */
	setObjectAsync(id, obj) {
		return this.setObjectNotExistsAsync(id, obj);
	}

	/**
	 * @param {string} id
	 * @param {*} obj
	 * @returns {Promise<any>}
	 */
	setObjectNotExistsAsync(id, obj) {
		if (obj.type === "state") {
			if (!this.states[id]) {
				this.states[id] = new ExtendedState(obj.common.def, false, obj.common);
			} else {
				this.states[id].common = obj.common;
			}
		}
		return new Promise((resolve) => { resolve(true); });
	}

	/**
	 * @param {(...args: any) => void} callback
	 * @param {number} ms
	 * @param  {...any} args
	 * @returns {NodeJS.Timeout}
	 */
	setTimeout(callback, ms, ...args) {
		return setTimeout(callback, ms, ...args);
	}

	/**
	 * @param {NodeJS.Timeout} timeoutId
	 */
	clearTimeout(timeoutId) {
		clearTimeout(timeoutId);
	}

	/**
	 * @param {(...args: any) => void} callback
	 * @param {number} ms
	 * @param  {...any} args
	 * @returns {NodeJS.Timer}
	 */
	setInterval(callback, ms, ...args) {
		return setInterval(callback, ms, ...args);
	}

	/**
	 * @param {NodeJS.Timer} intervalId
	 */
	clearInterval(intervalId) {
		clearInterval(intervalId);
	}

	/**
	 * @param {string} topic
	 * @param {Buffer} message
	 */
	async onMessage(topic, message) {
		const idParts = topic.split("/");
		const name = idParts[1];
		idParts[0] = "Devices";
		for (const duid in this.vacuums) {
			const vacuum = this.vacuums[duid].name.split(" ").join("_").toLowerCase();
			if (vacuum === name) {
				idParts[1] = duid;
				break;
			}
		}
		const id = idParts.join(".");
		let valString = message.toString();
		for (const state in this.states[id].common.states) {
			const altState = this.states[id].common.states[state];
			if (valString === altState) {
				valString = state;
				break;
			}
		}
		const val = JSON.parse(valString);
		this.states[id].val = val;
		this.log.debug("MQTT:", id, message.toString(), valString);
		await this.stateChangeHandler(plugin_state_prefix + id, this.states[id]);
	}

	onExit() {
		this.log.info("EXIT");
		const data = JSON.stringify(this.states, null, 2);
		fs.writeFileSync(state_file, data);
	}

	/**
	 * @param {string} event
	 * @param {*} handler
	 * @returns {Adapter}
	 */
	on(event, handler) {
		if (event === "ready") {
			this.setTimeout(handler, 1000);
		}
		else if (event === "unload") {
			process.stdin.resume(); //so the program will not close instantly
			const callback = this.onExit.bind(this);
			process.on("exit", handler.bind(null, callback));
			const exitHandler = function () {
				process.exit();
			};
			const exceptionHandler = function (error) {
				console.log(error);
				process.exit();
			};
			process.on("SIGINT", exitHandler);
			process.on("SIGUSR1", exitHandler);
			process.on("SIGUSR2", exitHandler);
			process.on("uncaughtException", exceptionHandler);
		}
		else if (event === "stateChange") {
			this.stateChangeHandler = handler;
			this.client.on("message", this.onMessage.bind(this));
		}
		return this;
	}

	/**
	 * @param {string} _name
	 * @returns {null}
	 */
	getPluginInstance(_name) {
		return null;
	}

	restart() {
		// TODO: not yet implemented, let systemd do the restart for now
		process.exit();
	}
}

module.exports = {
	Adapter, AdapterOptions, State
};
