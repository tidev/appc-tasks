import { expect } from 'chai';
import { BaseTask, BaseFileTask } from '../lib';
import fs from 'fs';
import mockFs from 'mock-fs';
import path from 'path';

let noopBunyanLogger = {
	trace: () => {},
	debug: () => {},
	info: () => {},
	warn: () => {},
	error: () => {},
};
class TestFileTask extends BaseFileTask {
	constructor(taskInfo) {
		super(Object.assign({
			name: 'testTask',
			logger: noopBunyanLogger
		}, taskInfo));
	}

	runTaskAction() {}
}
let task = null;

describe('BaseFileTask', () => {
	beforeEach(() => {
		mockFs({
			'input': {
				'file1.txt': '1',
				'file2.txt': '2',
				'sub': {
					'file3.txt': '3'
				}
			},
			'output': {
				'generated.data': 'gen',
				'sub': {
					'other.data': 'otherGen'
				}
			}
		});
		task = new TestFileTask();
	});

	afterEach(() => {
		task = null;
		mockFs.restore();
	});

	describe('constructor', () => {
		it('should set input and output files, as well as output directory', () => {
			expect(task._name).to.be.equal('testTask');
			expect(task._inputFiles).to.be.empty;
			expect(task._outputFiles).to.be.empty;
			expect(task._outputDirectory).to.be.null;

			mockFs({
				'file1.txt': '',
				'outputs': {

				}
			});
			let inputFiles = [path.join('input', 'file1.txt')];
			task = new TestFileTask({
				inputFiles: inputFiles,
				outputDirectory: 'outputs',
			});
			expect(task._inputFiles).to.have.lengthOf(1);
			expect(task._inputFiles).to.be.deep.equal(inputFiles);
			expect(task._outputFiles).to.be.empty;
			expect(task._outputDirectory).to.be.equal('outputs');
			mockFs.restore();
		});
	});

	describe('properties', () => {
		it('should get and set array of input files', () => {
			let inputFiles = [
				path.join('input', 'file1.txt'),
				path.join('input', 'file12.txt')
			];
			task.inputFiles = inputFiles;
			expect(task._inputFiles).to.be.deep.equal(inputFiles);
			expect(task.inputFiles).to.be.deep.equal(inputFiles);
		});

		it('should get array of output files', () => {
			let outputFiles = [path.join('output', 'generated.data')];
			task._outputFiles = outputFiles;
			expect(task.outputFiles).to.be.deep.equal(outputFiles);
		});

		it('should get output directory', () => {
			let outputDirectory = 'output';
			task._outputDirectory = outputDirectory;
			expect(task.outputDirectory).to.be.equal(outputDirectory);
		});

		it('should throw setting output directory after state is "running" or higher', () => {
			let outputDirectory = path.join('output', 'subdir');
			task._state = BaseTask.TASK_STATE_RUNNING;
			expect(() => {
				task.outputDirectory = outputDirectory;
			}).to.throw(Error, 'Cannot change a task\'s output directory after it was started.');
		});

		it('should set and create output directory if state is "created"', () => {
			let outputDirectory = path.join('output', 'subdir');
			expect(fs.existsSync(outputDirectory)).to.be.false;
			expect(task.state).to.be.equal(BaseTask.TASK_STATE_CREATED);
			task.outputDirectory = outputDirectory;
			expect(task.outputDirectory).to.be.equal(outputDirectory);
			expect(fs.existsSync(outputDirectory)).to.be.true;
		});
	});

	describe('addInputFile', () => {
		it('should throw error if file does not exist', () => {
			let inputFile = path.join('inputs', 'foo.txt');
			expect(() => {
				task.addInputFile(inputFile);
			}).to.throw(Error, `Input file ${inputFile} does not exist.`);
		});

		it('should add file to input files array', () => {
			let inputFile = path.join('input', 'file1.txt');
			task.addInputFile(inputFile);
			expect(task.inputFiles).to.include(inputFile);
		});
	});

	describe('addInputDirectory', () => {
		it('should silently fail if directory does not exist', () => {
			let inputDirectory = '_input';
			task.addInputDirectory(inputDirectory);
			expect(task.inputFiles).to.be.empty;
		});

		it('should recursively add all files', () => {
			let inputDirectory = 'input';
			let expectedInputFiles = [
				path.join('input', 'file1.txt'),
				path.join('input', 'file2.txt'),
				path.join('input', 'sub', 'file3.txt')
			];
			task.addInputDirectory(inputDirectory);
			expect(task.inputFiles).to.be.deep.equal(expectedInputFiles);
		});
	});

	describe('addOutputFile', () => {
		it('should throw error if file does not exist', () => {
			let outputFile = path.join('output', 'foo.txt');
			expect(() => {
				task.addOutputFile(outputFile);
			}).to.throw(Error, `Output file ${outputFile} does not exist.`);
		});

		it('should add file to output files array', () => {
			let outputFile = path.join('output', 'generated.data');
			task.addOutputFile(outputFile);
			expect(task.outputFiles).to.include(outputFile);
		});
	});

	describe('afterTaskAction', () => {
		it('should not add files of no output directory set', () => {
			task.afterTaskAction();
			expect(task.outputFiles).to.be.empty;
		});

		it('should add files if output directory is set', () => {
			task.outputDirectory = 'output';
			task.afterTaskAction();
			let expectedOutputFiles = [
				path.join('output', 'generated.data'),
				path.join('output', 'sub', 'other.data')
			];
			expect(task.outputFiles).to.be.deep.equal(expectedOutputFiles);
		});
	});
});
