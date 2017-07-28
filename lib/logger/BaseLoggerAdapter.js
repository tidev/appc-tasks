export default class BaseLoggerAdapter {

	constructor(taskName) {
		this._taskName = taskName;
	}

	prefixMessage(message) {
		return `${this._taskName}: ${message}`;
	}

}
