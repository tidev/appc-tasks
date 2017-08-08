/**
 * The base logger adapter used by all other implementations
 *
 * A logger adapter is used to allow a task to work with several logging modules.
 * Currently this only includes bunyan loggers and a default logger using
 * console.log.
 *
 * A logger adapter needs to expose the five log levels trace, debug, info, warn
 * and error. The default impementations in this base adapter are all noops, so
 * only override the ones your logger actually supports.
 */
export default class BaseLoggerAdapter {

	/**
	 * Constructs a new logger adapter
	 *
	 * @param {String} taskName Name of the task the logger adapter is used in
	 */
	constructor(taskName) {
		this._taskName = taskName;
	}

	/**
	 * Logs a message with the "trace" log level
	 */
	trace() {

	}

	/**
	 * Logs a message with the "debug" log level
	 */
	debug() {

	}

	/**
	 * Logs a message with the "info" log level
	 */
	info() {

	}

	/**
	 * Logs a message with the "warning" log level
	 */
	warn() {

	}

	/**
	 * Logs a message with the "error" log level
	 */
	error() {

	}

	/**
	 * Prefixes a log message with the task name
	 *
	 * @param {String} message The original message that should be prefixed
	 * @return {String} Prefixed message in the format ${taskName}: ${message}
	 */
	prefixMessage(message) {
		return `${this._taskName}: ${message}`;
	}

}
