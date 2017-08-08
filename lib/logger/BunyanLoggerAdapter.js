import BaseLoggerAdapter from './BaseLoggerAdapter';

/**
 * Adapter for a {@link https://github.com/trentm/node-bunyan|bunyan} logger
 *
 * Any logger that adheres to the
 * {@link https://github.com/trentm/node-bunyan#log-method-api|bunan log method API}
 * is considered a bunyan logger, so it may be possible to also use other loggers
 * with this adapter.
 */
export default class BunyanLoggerAdapter extends BaseLoggerAdapter {

	/**
	 * Constructs a new adapter for a bunyan logger
	 *
	 * @param {String} taskName Name of the task the logger is used in
	 * @param {Object} logger The acutal bunyan logger instance
	 */
	constructor(taskName, logger) {
		super(taskName);

		if (typeof logger !== 'object' || !this.isBunyanCompatibleLogger(logger)) {
			throw new TypeError('Invalid logger given, only logger instances that support the Bunyan log methods API are supported.');
		}
		this._logger = logger;
	}

	/**
	 * Checks if a logger is compatible with the bunyan log method API
	 *
	 * The check is very simple and only looks for the availability of the five
	 * log level methods (trace, debug, info, warn and error) on the logger
	 * object. It will not check if the methods actually support the different
	 * parameter combinations bunyan uses.
	 *
	 * @param {Object} logger bunyan (or compatible) logger
	 * @return {Boolean} True if the logger has the five log level mehtods, false if not
	 */
	isBunyanCompatibleLogger(logger) {
		let bunyanApiMethods = ['trace', 'debug', 'info', 'warn', 'error'];
		for (let logLevelMethodName of bunyanApiMethods) {
			if (!logger.hasOwnProperty(logLevelMethodName)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Logs a message with bunyan's "trace" log level method
	 *
	 * @see {@link https://github.com/trentm/node-bunyan#log-method-api|bunyan log method API} for supported parameters
	 */
	trace() {
		return this.prefixWithNameAndPassThrough.call(this, 'trace', arguments);
	}

	/**
	 * Logs a message with bunyan's "debug" log level method
	 *
	 * @see {@link https://github.com/trentm/node-bunyan#log-method-api|bunyan log method API} for supported parameters
	 */
	debug() {
		return this.prefixWithNameAndPassThrough.call(this, 'debug', arguments);
	}

	/**
	 * Logs a message with bunyan's "info" log level method
	 *
	 * @see {@link https://github.com/trentm/node-bunyan#log-method-api|bunyan log method API} for supported parameters
	 */
	info() {
		return this.prefixWithNameAndPassThrough.call(this, 'info', arguments);
	}

	/**
	 * Logs a message with bunyan's "warn" log level method
	 *
	 * @see {@link https://github.com/trentm/node-bunyan#log-method-api|bunyan log method API} for supported parameters
	 */
	warn() {
		return this.prefixWithNameAndPassThrough.call(this, 'warn', arguments);
	}

	/**
	 * Logs a message with bunyan's "error" log level method
	 *
	 * @see {@link https://github.com/trentm/node-bunyan#log-method-api|bunyan log method API} for supported parameters
	 */
	error() {
		return this.prefixWithNameAndPassThrough.call(this, 'error', arguments);
	}

	/**
	 * Prefixes a log message with the task name and passes it to the bunyan logger
	 *
	 * @param {String} logLevel Log level the message will be logged with
	 * @param {Object} originalArguments Original arguments the log level method was called with
	 */
	prefixWithNameAndPassThrough(logLevel, originalArguments) {
		let args = Array.from(originalArguments);

		if (args.length === 0) {
			return this._logger[logLevel]();
		}

		if (args[0] instanceof Error) {
			// log.<level>(err, ...);
			if (args.length === 1) {
				args[0].message = this.prefixMessage(args[0].message);
			}  else {
				args[1] = this.prefixMessage(args[1]);
			}
		} else if (typeof args[0] === 'string') {
			// log.<level>(msg, ...)
			args[0] = this.prefixMessage(args[0]);
		} else if (Buffer.isBuffer(args[0])) {
			// log.<level>(buf, ...)
			// Not supported, do nothing
		} else {
			// log.<level>(fields, msg, ...)
			let fields = args[0];
			if (fields && args.length === 1 && fields.err && fields.err instanceof Error) {
				fields.err.message = this.prefixMessage(fields.err.message);
			} else {
				args[1] = this.prefixMessage(args[1]);
			}
		}

		return this._logger[logLevel].apply(this.logger, args);
	}

}
