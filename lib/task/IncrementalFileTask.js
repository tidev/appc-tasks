import BaseFileTask from './BaseFileTask';
import ChangeManager from '../incremental/ChangeManager';
import fs from 'fs-extra';

/**
 * File based task that is aware of the state of its input and output files and
 * can perform an incremental task run
 */
export default class IncrementalFileTask extends BaseFileTask {

	/**
	 * Constructs a new incremental file task
	 *
	 * @param {Object} taskInfo Task info object with configuration options
	 * @param {String} taskInfo.incrementalDirectory Full path to the incremental data directory
	 */
	constructor(taskInfo) {
		super(taskInfo);

		if (!taskInfo.incrementalDirectory || typeof taskInfo.incrementalDirectory !== 'string') {
			throw new TypeError('Incremental tasks need an incrementalDirectory specified');
		}
		this._incrementalDirectory = taskInfo.incrementalDirectory;
		fs.ensureDirSync(this.incrementalDirectory);
	}

	/**
	 * Gets the directory where any incremental data will be stored
	 *
	 * @return {String} Full path to the incremental data directory
	 */
	get incrementalDirectory() {
		return this._incrementalDirectory;
	}

	/**
	 * List of directories or files that this task generates
	 *
	 * Each path will passed to {@link #ChangeManager#monitorOutputPath|ChangeManager.monitorOutputPath}
	 * to determine if the output files of a task have changed.
	 *
	 * @return {Array.<String>}
	 */
	get incrementalOutputs() {
		return [];
	}

	/**
	 * Checks for changed states of input and output files and starts either a full
	 * or incremental task run
	 *
	 * The rules for this are as follows:
	 * <ul>
	 *   <li>No incremental data: full task run</li>
	 *   <li>Output files changed: full task run</li>
	 *   <li>Input files changed: incremental task run</li>
	 *   <li>Nothing changed: skip task run</li>
	 * </ul>
	 *
	 * @return {Promise}
	 */
	runTaskAction() {
		let changeManager = new ChangeManager();
		let fullBuild = !changeManager.load(this.incrementalDirectory);

		this.inputFiles.forEach(inputPath => {
			changeManager.monitorInputPath(inputPath);
		});

		this.incrementalOutputs.forEach(outputPath => {
			changeManager.monitorOutputPath(outputPath);
		});

		let changedInputFiles = changeManager.getChangedInputFiles();
		let changedOutputFiles = changeManager.getChangedOutputFiles();
		let runPromise;
		if (fullBuild) {
			this.logger.trace('No incremental data, do full task run');
			runPromise = this.doFullTaskRun();
		} else if (changedOutputFiles.size > 0) {
			this.logger.trace('Output files changed, do full task run');
			runPromise = this.doFullTaskRun();
		} else if (changedInputFiles.size > 0) {
			this.logger.trace('Input files changed, do incremental task run');
			runPromise = this.doIncrementalTaskRun(changedInputFiles);
		} else {
			this.logger.trace('Nothing changed, skip task run');
			runPromise = this.loadResultAndSkip();
		}

		return runPromise.then(taskResult => {
			changeManager.updateOutputFiles(this.incrementalOutputs);
			changeManager.write(this.incrementalDirectory);

			return taskResult;
		}).catch((reason) => {
			changeManager.delete(this.incrementalDirectory);
			throw new Error(reason);
		});
	}

	/**
	 * Override to define the action on a full task run
	 *
	 * @return {Promise}
	 */
	doFullTaskRun() {
		throw new Error('No full task action implemented, override doFullTaskRun');
	}

	/**
	 * Override to define the action on an incremental task run
	 *
	 * @param {Map.<String, String>} changedFiles Map of changed files and their state (created, changed, deleted)
	 * @return {Promise}
	 */
	// eslint-disable-next-line no-unused-vars
	doIncrementalTaskRun(changedFiles) {
		throw new Error('No incremental task action implemented, override doIncrementalTaskRun');
	}

	/**
	 * Loads the result of the last task run and skips it
	 *
	 * If no input or output files changed a task will be skipped. Override this if
	 * you need to load some JS value into your task after completion. Does nothing
	 * by default.
	 *
	 * @return {Promise}
	 */
	loadResultAndSkip() {
		return Promise.resolve();
	}

}
