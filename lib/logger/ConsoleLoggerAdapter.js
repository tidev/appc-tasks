import BaseLoggerAdapter from './BaseLoggerAdapter';

export default class ConsoleLoggerAdapter extends BaseLoggerAdapter {
	trace(message) {
		console.log(this.prefixMessage(message));
	}

	debug(message) {
		console.log(this.prefixMessage(message));
	}

	info(message) {
		console.log(this.prefixMessage(message));
	}

	warn(message) {
		console.log(this.prefixMessage(message));
	}

	error(message) {
		console.error(this.prefixMessage(message));
	}
}
