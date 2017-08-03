import { expect } from 'chai';
import { BaseFileTask } from '../lib';
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
		it('should initialize properties', () => {
			expect(task._name).to.be.equal('testTask');
			expect(task._inputFiles).to.be.a('set').that.is.empty;
			expect(task._outputFiles).to.be.a('set').that.is.empty;

			mockFs({
				'file1.txt': '',
				'outputs': {

				}
			});
			let inputFiles = [path.join('input', 'file1.txt')];
			task = new TestFileTask({
				inputFiles: inputFiles
			});
			expect(task._inputFiles.size).to.be.equal(1);
			expect(task._inputFiles).to.be.a('set').that.has.all.keys(inputFiles);
			expect(task._outputFiles).to.be.a('set').that.is.empty;
			expect(task._registeredOutputPaths).to.be.a('set').that.is.empty;
			mockFs.restore();

			task = new TestFileTask();
			expect(task._inputFiles).to.be.a('set').that.is.empty;
			expect(task._outputFiles).to.be.a('set').that.is.empty;
			expect(task._registeredOutputPaths).to.be.a('set').that.is.empty;
		});
	});

	describe('properties', () => {
		it('should get and set input files', () => {
			let inputFiles = [
				path.join('input', 'file1.txt'),
				path.join('input', 'file12.txt')
			];
			task.inputFiles = inputFiles;
			expect(task._inputFiles).to.be.a('set').that.has.all.keys(inputFiles);
			expect(task.inputFiles).to.be.a('set').that.has.all.keys(inputFiles);
		});

		it('should get output files', () => {
			let outputFiles = [path.join('output', 'generated.data')];
			task._outputFiles = new Set(outputFiles);
			expect(task.outputFiles).to.be.a('set').that.has.all.keys(outputFiles);
		});
	});

	describe('addInputFile', () => {
		it('should throw error if file does not exist', () => {
			let inputFile = path.join('inputs', 'foo.txt');
			expect(() => {
				task.addInputFile(inputFile);
			}).to.throw(Error, `Input file ${inputFile} does not exist.`);
		});

		it('should add file to input files set', () => {
			let inputFile = path.join('input', 'file1.txt');
			task.addInputFile(inputFile);
			expect(task.inputFiles).to.include(inputFile);
		});

		it('should not add the same file twice to the set', () => {
			let inputFile = path.join('input', 'file1.txt');
			task.addInputFile(inputFile);
			expect(task.inputFiles.size).to.be.equal(1);
			expect(task.inputFiles).to.include(inputFile);
			task.addInputFile(inputFile);
			expect(task.inputFiles.size).to.be.equal(1);
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
			expect(task.inputFiles.size).to.be.equal(3);
			expect(task.inputFiles).to.be.a('set').that.has.all.keys(expectedInputFiles);
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
			expect(task.outputFiles.size).to.be.equal(1);
			expect(task.outputFiles).be.a('set').that.includes(outputFile);
		});

		it('should not add the same file twice to the set', () => {
			let outputFile = path.join('output', 'generated.data');
			task.addOutputFile(outputFile);
			expect(task.outputFiles.size).to.be.equal(1);
			expect(task.outputFiles).to.include(outputFile);
			task.addOutputFile(outputFile);
			expect(task.outputFiles.size).to.be.equal(1);
			expect(task.outputFiles).to.include(outputFile);
		});
	});

	describe('addOutputDirectory', () => {
		it('should silently fail if directory does not exist', () => {
			let outputDirectory = '_output';
			task.addOutputDirectory(outputDirectory);
			expect(task.outputFiles).to.be.empty;
		});

		it('should recursively add all files', () => {
			let outputDirectory = 'output';
			let expectedOutputFiles = [
				path.join('output', 'generated.data'),
				path.join('output', 'sub', 'other.data')
			];
			task.addOutputDirectory(outputDirectory);
			expect(task.outputFiles.size).to.be.equal(2);
			expect(task.outputFiles).to.be.a('set').that.has.all.keys(expectedOutputFiles);
		});
	});

	describe('registerOutputPath', () => {
		it('should add path to the set of registered output paths', () => {
			let outputPath = 'output';
			task.registerOutputPath(outputPath);
			expect(task._registeredOutputPaths.size).to.be.equal(1);
			expect(task._registeredOutputPaths).to.be.a('set').that.includes(outputPath);
		});
	});

	describe('afterTaskAction', () => {
		it('should not add files of no output paths registered', () => {
			task.afterTaskAction();
			expect(task.outputFiles).to.be.empty;
		});

		it('should add files if output paths registered', () => {
			task.registerOutputPath('output');
			task.afterTaskAction();
			let expectedOutputFiles = [
				path.join('output', 'generated.data'),
				path.join('output', 'sub', 'other.data')
			];
			expect(task.outputFiles.size).to.be.equal(2);
			expect(task.outputFiles).to.be.a('set').that.has.all.keys(expectedOutputFiles);

			task = new TestFileTask();
			let outputFile = path.join('output', 'generated.data');
			task.registerOutputPath(outputFile);
			task.afterTaskAction();
			expect(task.outputFiles.size).to.be.equal(1);
			expect(task.outputFiles).to.be.a('set').that.includes(outputFile);
		});
	});
});
