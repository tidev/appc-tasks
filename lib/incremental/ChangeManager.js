import fs from 'fs-extra';
import { FileMonitor, SmartState } from 'file-state-monitor';
import path from 'path';

const INPUTS_STATE_FILENAME = 'inputs.state';
const OUTPUTS_STATE_FILENAME = 'outputs.state';

/**
 * Manages the state for a set of input and output files using file monitors
 *
 * Used by IncrementalTask to detect the set of changed files.
 */
export default class ChangeManager {

	/**
	 * Constructs a new change manager
	 */
	constructor() {
		this._inputs = new FileMonitor(SmartState);
		this._outputs = new FileMonitor(SmartState);
	}

	/**
	 * Loads the existing state data from the given path
	 *
	 * @param {string} statePath Full path to the directory containing state data
	 * @return {boolean} True if both input and output states were loaded, false if not
	 */
	load(statePath) {
		let inputsStatePathAndFilename = path.join(statePath, INPUTS_STATE_FILENAME);
		let outputsStatePathAndFilename = path.join(statePath, OUTPUTS_STATE_FILENAME);
		if (!fs.existsSync(inputsStatePathAndFilename) || !fs.existsSync(outputsStatePathAndFilename)) {
			return false;
		}
		return this._inputs.load(inputsStatePathAndFilename) && this._outputs.load(outputsStatePathAndFilename);
	}

	/**
	 * Writes the current state data into state files in the given path
	 *
	 * @param {string} statePath Full path to the directory where the state data should be storeds
	 */
	write(statePath) {
		fs.ensureDirSync(statePath);

		this._inputs.write(path.join(statePath, INPUTS_STATE_FILENAME));
		this._outputs.write(path.join(statePath, OUTPUTS_STATE_FILENAME));
	}

	/**
	 * Deletes all files inside the given state directory, but does not remove the
	 * directory itself
	 *
	 * @param {String} statePath Full path to the state files directory
	 */
	delete(statePath) {
		fs.emptyDirSync(statePath);
	}

	/**
	 * Add the given path to the inputs file monitor
	 *
	 * @param {String} pathToMonitor Full path to file or directory to be monitored
	 */
	monitorInputPath(pathToMonitor) {
		this._inputs.monitorPath(pathToMonitor);
	}

	/**
	 * Add the given path to the outputs file monitor
	 *
	 * @param {String} pathToMonitor Full path to file or directory to be monitored
	 */
	monitorOutputPath(pathToMonitor) {
		this._outputs.monitorPath(pathToMonitor);
	}

	/**
	 * Convenience method to check wether any input or output file changed
	 *
	 * @return {Boolean} True if any file has changed, false if not
	 */
	hasChanges() {
		return this.getChangedInputFiles().size > 0 || this.getChangedOutputFiles().size > 0;
	}

	/**
	 * Gets all changed files from the inputs monitor
	 *
	 * @return {Map.<string, string>}
	 */
	getChangedInputFiles() {
		return this._inputs.getChangedFiles();
	}

	/**
	 * Gets all changed files from the outputs monitor
	 *
	 * @return {Map.<string, string>}
	 */
	getChangedOutputFiles() {
		return this._outputs.getChangedFiles();
	}

	/**
	 * Updates the states for output files with all files under the given paths
	 *
	 * @param {Array.<string>} paths [description]
	 */
	updateOutputFiles(paths) {
		this._outputs.update(paths);
	}

}
