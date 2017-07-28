import BaseLoggerAdapter from './BaseLoggerAdapter';

export default class BunyanLoggerAdapter extends BaseLoggerAdapter {

	constructor(taskName, logger) {
		super(taskName);

		if (typeof logger !== 'object' || !this.isBunyanCompatibleLogger(logger)) {
			throw new TypeError('Invalid logger given, only logger instances that support the Bunyan log methods API are supported.');
		}
		this._logger = logger;
	}

	isBunyanCompatibleLogger(logger) {
		let bunyanApiMethods = ['trace', 'debug', 'info', 'warn', 'error'];
		for (let logLevelMethodName of bunyanApiMethods) {
			if (!logger.hasOwnProperty(logLevelMethodName)) {
				return false;
			}
		}

		return true;
	}

	trace() {
		return this.prefixWithNameAndPassThrough.call(this, 'trace', arguments);
	}

	debug() {
		return this.prefixWithNameAndPassThrough.call(this, 'debug', arguments);
	}

	info() {
		return this.prefixWithNameAndPassThrough.call(this, 'info', arguments);
	}

	warn() {
		return this.prefixWithNameAndPassThrough.call(this, 'warn', arguments);
	}

	error() {
		return this.prefixWithNameAndPassThrough.call(this, 'error', arguments);
	}

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

	prefixMessage(message) {
		return `${this._taskName}: ${message}`;
	}

}
