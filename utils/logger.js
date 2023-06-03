"use strict";

const LogLevel = {
	Silly: { text: "silly", ordinal: 0 },
	Debug: { text: "debug", ordinal: 1 },
	Info: { text: "info", ordinal: 2 },
	Warn: { text: "warn", ordinal: 3 },
	Error: { text: "error", ordinal: 4 }
};

class Logger {
	/**
	 * @param {{text: string, ordinal:number}} level
	 */
	constructor(level = LogLevel.Info) {
		/** Verbosity of the log output */
		this.level = level;
	}

	/**
	 * @param {*} args
	 * @param {{text: string, ordinal:number}} level
	 */
	log(level, ...args) {
		if (level.ordinal >= this.level.ordinal) {
			console.log(level.text.toUpperCase() + ": ", ...args);
		}
	}

	/**
	 * log message with silly level
	 * @param {*} args
	 */
	silly(...args) {
		this.log(LogLevel.Silly, ...args);
	}

	/**
	 * log message with debug level
	 * @param {*} args
	 */
	debug(...args) {
		this.log(LogLevel.Debug, ...args);
	}

	/**
	 * log message with info level (default output level for all adapters)
	 * @param {*} args
	 */
	info(...args) {
		this.log(LogLevel.Info, ...args);
	}

	/**
	 * log message with warning severity
	 * @param {*} args
	 */
	warn(...args) {
		this.log(LogLevel.Warn, ...args);
	}

	/**
	 * log message with error severity
	 * @param {*} args
	 */
	error(...args) {
		this.log(LogLevel.Error, ...args);
	}
}

module.exports = {
	Logger, LogLevel
};