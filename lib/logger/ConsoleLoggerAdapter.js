import BaseLoggerAdapter from './BaseLoggerAdapter';

/**
 * A simple adapter to console.log and console.error
 *
 * All log level simply call console.log, except for error, which uses
 * console.error
 */
export default class ConsoleLoggerAdapter extends BaseLoggerAdapter {
	/**
	 * Logs a message with the "trace" log level
	 *
	 * @param {String} message
	 */
	trace(message) {
		console.log(this.prefixMessage(message));
	}

	/**
	 * Logs a message with the "debug" log level
	 *
	 * @param {String} message
	 */
	debug(message) {
		console.log(this.prefixMessage(message));
	}

	/**
	 * Logs a message with the "info" log level
	 *
	 * @param {String} message
	 */
	info(message) {
		console.log(this.prefixMessage(message));
	}

	/**
	 * Logs a message with the "warn" log level
	 *
	 * @param {String} message
	 */
	warn(message) {
		console.log(this.prefixMessage(message));
	}

	/**
	 * Logs a message with the "error" log level
	 *
	 * @param {String} message
	 */
	error(message) {
		console.error(this.prefixMessage(message));
	}
}
