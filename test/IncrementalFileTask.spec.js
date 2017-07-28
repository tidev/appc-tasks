import { IncrementalFileTask } from '../lib';
import { ChangeManager } from '../lib/incremental';
import { default as chai, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { FileMonitor } from 'file-state-monitor';
import fs from 'fs';
import mockFs from 'mock-fs';
import sinon from 'sinon';

chai.use(chaiAsPromised);

let noopBunyanLogger = {
	trace: () => {},
	debug: () => {},
	info: () => {},
	warn: () => {},
	error: () => {},
};
class TestTask extends IncrementalFileTask {
	constructor(taskInfo) {
		super(Object.assign({
			name: 'testTask',
			logger: noopBunyanLogger,
			incrementalDirectory: 'incremental'
		}, taskInfo));
	}
}
let task = null;
let sandbox = sinon.sandbox.create();

describe('IncrementalFileTask', () => {
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
			},
			'incremental': {
				'dummy.txt': 'Dummy file'
			}
		});
		task = new TestTask();
		sinon.sandbox.create();
	});

	afterEach(() => {
		task = null;
		mockFs.restore();
		sandbox.restore();
	});

	describe('constructor', () => {
		it('should throw if no valid incremental directory specified', () => {
			expect(() => {
				task = new IncrementalFileTask({
					name: 'testTask',
					logger: noopBunyanLogger
				});
			}).to.throw(TypeError, 'Incremental tasks need an incrementalDirectory specified');
			expect(() => {
				task = new TestTask({
					name: 'testTask',
					incrementalDirectory: 2
				});
			}).to.throw(TypeError, 'Incremental tasks need an incrementalDirectory specified');
		});

		it('should set and create incremental directory', () => {
			let incrementalDirectory = 'incremental/sub';
			expect(fs.existsSync(incrementalDirectory)).to.be.false;
			task = new TestTask({
				name: 'testTask',
				incrementalDirectory: 'incremental/sub',
				logger: noopBunyanLogger
			});
			expect(task.incrementalDirectory).to.be.equal(incrementalDirectory);
			expect(fs.existsSync(incrementalDirectory)).to.be.true;
		});
	});

	describe('properties', () => {
		it('get incrementalOutputs() should return empty array as default', () => {
			expect(task.incrementalOutputs).to.be.an('array');
			expect(task.incrementalOutputs).to.be.empty;
		});
	});

	describe('runTaskAction', () => {
		it('should do full task run if previous file state failed to load', () => {
			let fullTaskRunStub = sandbox.stub(task, 'doFullTaskRun');
			fullTaskRunStub.returns(Promise.resolve());
			let promise = task.runTaskAction().then(() => {
				expect(fullTaskRunStub.called).to.be.true;
			});
			expect(promise).to.be.fulfilled;
			return promise;
		});

		it('should do full task run if output files changed', () => {
			sandbox.stub(ChangeManager.prototype, 'load').returns(true);
			sandbox.stub(task, 'incrementalOutputs').get(() => ['output']);
			let fullTaskRunStub = sandbox.stub(task, 'doFullTaskRun');
			fullTaskRunStub.returns(Promise.resolve());
			let promise = task.runTaskAction().then(() => {
				expect(fullTaskRunStub.called).to.be.true;
			});
			return expect(promise).to.be.fulfilled;
		});

		it('should do incremental task run if input files changed', () => {
			sandbox.stub(ChangeManager.prototype, 'load').returns(true);
			let incrementalTaskRunStub = sandbox.stub(task, 'doIncrementalTaskRun');
			incrementalTaskRunStub.returns(Promise.resolve());
			task.addInputDirectory('input');
			let promise = task.runTaskAction().then(() => {
				expect(incrementalTaskRunStub.called).to.be.true;
			});
			return expect(promise).to.be.fulfilled;
		});

		it('should skip task if no files changed', () => {
			sandbox.stub(ChangeManager.prototype, 'load').returns(true);
			let loadResultAndSkipSpy = sandbox.spy(task, 'loadResultAndSkip');
			let promise = task.runTaskAction().then(() => {
				expect(loadResultAndSkipSpy.called).to.be.true;
			});
			return expect(promise).to.be.fulfilled;
		});

		it('should delete incremental directory if task run failed', () => {
			let dummyIncrementalFile = 'incremental/dummy.txt';
			let fullTaskRunStub = sandbox.stub(task, 'doFullTaskRun');
			fullTaskRunStub.returns(Promise.reject('Failed'));
			expect(fs.existsSync(dummyIncrementalFile)).to.be.true;
			let promise = task.runTaskAction().catch((reason) => {
				expect(fullTaskRunStub.called).to.be.true;
				expect(fs.existsSync(dummyIncrementalFile)).to.be.false;
				return Promise.reject(reason);
			});
			return expect(promise).to.be.rejected;
		});
	});
});
