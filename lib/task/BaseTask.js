import { BunyanLoggerAdapter, ConsoleLoggerAdapter } from '../logger';

const TASK_STATE_CREATED = 0;
const TASK_STATE_RUNNING = 1;
const TASK_STATE_FINISHED = 2;

const stateNameMap = ['created', 'running', 'finished'];

/**
 * Defines the base interface for all other tasks
 */
export default class BaseTask {

	/**
	 * Constructs a new base task
	 *
	 * @param {Object} taskInfo Task info object with configuration options
	 */
	constructor(taskInfo) {
		if (typeof taskInfo !== 'object' || typeof taskInfo.name !== 'string') {
			throw new TypeError('The task constructor needs a task info object with at least a name specified.');
		}

		this._name = taskInfo.name;
		if (taskInfo.logger) {
			this._logger = new BunyanLoggerAdapter(this._name, taskInfo.logger);
		} else {
			this._logger = new ConsoleLoggerAdapter(this._name);
		}
		this._preTaskRun = null;
		this._postTaskRun = null;

		this.state = BaseTask.TASK_STATE_CREATED;
	}

	static get TASK_STATE_CREATED() {
		return TASK_STATE_CREATED;
	}

	static get TASK_STATE_RUNNING() {
		return TASK_STATE_RUNNING;
	}

	static get TASK_STATE_FINISHED() {
		return TASK_STATE_FINISHED;
	}

	/**
	 * Returns the task's name
	 *
	 * @return {String} Task name
	 */
	get name() {
		return this._name;
	}

	/**
	 * Gets the task's current state
	 *
	 * @return {Number} One of the TASK_STATE_* constants
	 */
	get state() {
		return this._state;
	}

	/**
	 * Sets the state of the task
	 *
	 * This is for internal usage only, do not set it yourself. You have been
	 * warned!
	 *
	 * @param {Number} state One of the TASK_STATE_* constants
	 */
	set state(state) {
		if (this._state === undefined) {
			this.logger.trace(`Setting initial task state to "${stateNameMap[state]}"`);
		} else {
			this.logger.trace(`Changing task state from "${stateNameMap[this._state]}" to "${stateNameMap[state]}"`);
		}
		this._state = state;
	}

	/**
	 * Gets the loger in use by this task
	 *
	 * @return {BaseLoggerAdapter}
	 */
	get logger() {
		return this._logger;
	}

	/**
	 * Gets the user defined function that will be run before the task action
	 *
	 * @return {Function} Function to run before the task action
	 */
	get preTaskRun() {
		return this._preTaskRun;
	}

	/**
	 * Sets a user defined function that will be run before the task action
	 *
	 * The function will be called with the task as its only parameter. It will
	 * be executed in a .then Promise chain so you can return a promise to run
	 * async operations.
	 *
	 * @param {Function} preTaskRun Function to run before the task action
	 */
	set preTaskRun(preTaskRun) {
		if (typeof preTaskRun !== 'function') {
			throw new TypeError('You can only assign a function to a task\'s preTaskRun property');
		}

		this._preTaskRun = preTaskRun;
	}

	/**
	 * Gets the user defined function that will be run after the task action
	 *
	 * @return {Function} Function to run after the task action
	 */
	get postTaskRun() {
		return this._postTaskRun;
	}

	/**
	 * Sets the user defined function that will be run after the task action
	 *
	 * The function will be called with the task as its only parameter. It will
	 * be executed in a .then Promise chain so you can return a promise to run
	 * async operations.
	 *
	 * @param {Function} postTaskRun Function to run after the task action
	 */
	set postTaskRun(postTaskRun) {
		if (typeof postTaskRun !== 'function') {
			throw new TypeError('You can only assign a function to a task\'s postTaskRun property');
		}

		this._postTaskRun = postTaskRun;
	}

	/**
	 * Function that can be defined per task implementation that will be run
	 * before the task action
	 *
	 * @return {Promise}
	 */
	beforeTaskAction() {
		return Promise.resolve();
	}

	/**
	 * Function that can be defined per task implementation that will be run
	 * after the task action
	 *
	 * @return {Promise}
	 */
	afterTaskAction() {
		return Promise.resolve();
	}

	/**
	 * Starts the task excution chain
	 *
	 * @return {Promise}
	 */
	run() {
		this.logger.trace('Starting task');
		this.state = BaseTask.TASK_STATE_RUNNING;
		const startTime = process.hrtime();

		return Promise.resolve()
			.then(() => {
				if (typeof this.preTaskRun === 'function') {
					this.logger.trace('Running pre task run function');
					return this.preTaskRun(this);
				}

				return Promise.resolve();
			})
			.then(this.beforeTaskAction.bind(this))
			.then(this.runTaskAction.bind(this))
			.then(this.afterTaskAction.bind(this))
			.then(() => {
				if (typeof this.postTaskRun === 'function') {
					this.logger.trace('Running post task run function');
					return this.postTaskRun(this);
				}

				return Promise.resolve();
			})
			.then(() => {
				this.state = BaseTask.TASK_STATE_FINISHED;
				const elapsedTIme = process.hrtime(startTime);
				this.logger.trace('Finished task in ' + this.formatElapsedTime(elapsedTIme));
			});
	}

	/**
	 * The task action, needs to be overriden by every task implementation
	 *
	 * @return {Promise}
	 */
	runTaskAction() {
		throw new Error('No task action implemented, override runTaskAction');
	}

	/**
	 * Utility function to format the elapsed time using process.hrtime
	 *
	 * @param {Array.<Number>} elapsedTime Elapsed time
	 * @return {String} Formated time string
	 */
	formatElapsedTime(elapsedTime) {
		let precision = 3;
		var elapsedMilliseconds = elapsedTime[1] / 1000000;
		return elapsedTime[0] + 's ' + elapsedMilliseconds.toFixed(precision) + 'ms';
	}

}
