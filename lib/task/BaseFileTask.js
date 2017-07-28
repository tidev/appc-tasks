import fs from 'fs-extra';
import path from 'path';
import BaseTask from './BaseTask';

/**
 * Defines the base interface for all other file based tasks
 */
export default class BaseFileTask extends BaseTask {

	/**
	 * Constructs a new file based task
	 *
	 * @param {[type]} taskInfo
	 * @return {[type]} [description]
	 */
	constructor(taskInfo) {
		super(taskInfo);

		this._inputFiles = taskInfo.inputFiles || [];
		this._outputFiles = [];
		this._outputDirectory = null;
		if (typeof taskInfo.outputDirectory === 'string') {
			this.outputDirectory = taskInfo.outputDirectory;
		}
	}

	/**
	 * Gets the complete list of input files
	 *
	 * @return {Array.<string>} Array with full path to input files
	 */
	get inputFiles() {
		return this._inputFiles;
	}

	/**
	 * Sets the input files for this task.
	 *
	 * This will overwrite any existing input files this task already has. Use
	 * addInputFile or addInputDirectory to add new files to the existing ones.
	 *
	 * @param {Array.<string>} inputFiles Array of full paths to input files
	 */
	set inputFiles(inputFiles) {
		this._inputFiles = inputFiles;
	}

	/**
	 * Gets all output files that the task produced
	 *
	 * @return {Array.<String>}
	 */
	get outputFiles() {
		return this._outputFiles;
	}

	/**
	 * Gets the output directory this task uses
	 *
	 * @return {String} Output directory where the task will write to
	 */
	get outputDirectory() {
		return this._outputDirectory;
	}

	/**
	 * Sets the directory where this task will produce any generated output files
	 *
	 * Setting this will recursively create the directory and reset the list of
	 * output files.
	 *
	 * @param {String} outputPath Full path of the output directory
	 */
	set outputDirectory(outputPath) {
		if (this.state >= BaseTask.TASK_STATE_RUNNING) {
			throw new Error('Cannot change a task\'s output directory after it was started.');
		}

		fs.ensureDirSync(outputPath);
		this._outputFiles = [];
		this._outputDirectory = outputPath;
	}

	/**
	 * Adds a new file to this task's input files
	 *
	 * @param {String} pathAndFilename Full path of the file to add
	 */
	addInputFile(pathAndFilename) {
		if (!fs.existsSync(pathAndFilename)) {
			throw new Error(`Input file ${pathAndFilename} does not exist.`);
		}

		if (this.inputFiles.indexOf(pathAndFilename) === -1) {
			this.inputFiles.push(pathAndFilename);
		}
	}

	/**
	 * Adds all files under the given path to this task's input files
	 *
	 * @param {String} inputPath Full path of the directory to add
	 */
	addInputDirectory(inputPath) {
		if (!fs.existsSync(inputPath)) {
			return;
		}

		for (let entryName of fs.readdirSync(inputPath)) {
			let fullPath = path.join(inputPath, entryName);
			let stats = fs.lstatSync(fullPath);
			if (stats.isDirectory()) {
				this.addInputDirectory(fullPath);
			} else if (stats.isFile()) {
				this.addInputFile(fullPath);
			}
		}
	}

	/**
	 * Adds a new file to this task's output files
	 *
	 * @param {String} pathAndFilename Full path of the file to add
	 */
	addOutputFile(pathAndFilename) {
		if (!fs.existsSync(pathAndFilename)) {
			throw new Error(`Output file ${pathAndFilename} does not exist.`);
		}

		if (this.outputFiles.indexOf(pathAndFilename) === -1) {
			this.outputFiles.push(pathAndFilename);
		}
	}

	/**
	 * Will run after the task's action method and call to updateOutputFiles if
	 * the task has a output directory set.
	 *
	 * @return {Promise}
	 */
	afterTaskAction() {
		if (this.outputDirectory !== null) {
			this.updateOutputFiles();
		}
		return Promise.resolve();
	}

	/**
	 * Updates the task's input files by scanning the defined output directory for
	 * all files it now contains
	 */
	updateOutputFiles() {
		if (this.outputDirectory === null) {
			return;
		}

		let addOutputFilesFromDirectory = (outputDirectory) => {
			for (let entryName of fs.readdirSync(outputDirectory)) {
				let fullPath = path.join(outputDirectory, entryName);
				let stats = fs.lstatSync(fullPath);
				if (stats.isDirectory()) {
					addOutputFilesFromDirectory(fullPath);
				} else if (stats.isFile()) {
					this.addOutputFile(fullPath);
				}
			}
		};

		this._outputFiles = [];
		addOutputFilesFromDirectory(this.outputDirectory);
	}

}
