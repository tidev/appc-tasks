import { BaseTask } from '../lib';
import { BunyanLoggerAdapter, ConsoleLoggerAdapter } from '../lib/logger';
import { default as chai, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import stdMocks from 'std-mocks';

chai.use(chaiAsPromised);

let noopBunyanLogger = {
	trace: () => {},
	debug: () => {},
	info: () => {},
	warn: () => {},
	error: () => {},
};
class TestBaseTask extends BaseTask {
	constructor(taskInfo) {
		super(Object.assign({
			name: 'testTask',
			logger: noopBunyanLogger
		}, taskInfo));
	}
	runTaskAction() {
		return Promise.resolve();
	}
}
let task = null;

describe('BaseTask', () => {
	beforeEach(() => {
		task = new TestBaseTask();
	});

	afterEach(() => {
		task = null;
	});

	describe('constructor', () => {
		it('should throw error if task info parameter is not an object or has no valid name', () => {
			let expectedErrorMessage = 'The task constructor needs a task info object with at least a name specified.';
			expect(() => {
				new BaseTask();
			}).to.throw(TypeError, expectedErrorMessage);
			expect(() => {
				new BaseTask('test');
			}).to.throw(TypeError, expectedErrorMessage);
			expect(() => {
				new BaseTask({otherStuff: 'foo'});
			}).to.throw(TypeError, expectedErrorMessage);
			expect(() => {
				new BaseTask({name: 2});
			}).to.throw(TypeError, expectedErrorMessage);
		});

		it('should initialize properties from task info', () => {
			let taskName = 'unitTest';
			stdMocks.use();
			task = new BaseTask({name: taskName});
			stdMocks.restore();
			stdMocks.flush();
			expect(task._name).to.be.equal(taskName);
			expect(task._logger).to.be.an.instanceof(ConsoleLoggerAdapter);
			expect(task._preTaskRun).to.be.null;
			expect(task._postTaskRun).to.be.null;
			expect(task._state).to.be.equal(BaseTask.TASK_STATE_CREATED);
		});

		it('should create BunyanLoggerAdapter if task info contains logger', () => {
			task = new BaseTask({name: 'bunyanLikeLogger', logger: noopBunyanLogger});
			expect(task._logger).to.be.an.instanceof(BunyanLoggerAdapter);
		});
	});

	describe('properties', () => {
		it('get name() should return task name', () => {
			expect(task.name).to.be.equal('testTask');
		});

		it('get state() should return current state', () => {
			expect(task.state).to.be.equal(BaseTask.TASK_STATE_CREATED);
		});

		it('set state() should set state and log state change', () => {
			let expectedLogMessages = [
				'stateLogTest: Setting initial task state to "created"\n',
				'stateLogTest: Changing task state from "created" to "running"\n',
				'stateLogTest: Changing task state from "running" to "finished"\n'
			];
			stdMocks.use();
			task = new BaseTask({name: 'stateLogTest'});
			task.state = BaseTask.TASK_STATE_RUNNING;
			task.state = BaseTask.TASK_STATE_FINISHED;
			stdMocks.restore();
			let output = stdMocks.flush();
			expect(output.stdout).to.be.deep.equal(expectedLogMessages);
		});

		it('get logger() should return logger', () => {
			expect(task.logger).to.be.an.instanceof(BunyanLoggerAdapter);
		});

		it ('get preTaskRun() should return function', () => {
			let testFunction = function () {};
			expect(task.preTaskRun).to.be.null;
			task._preTaskRun = testFunction;
			expect(task.preTaskRun).to.be.a('function');
			expect(task.preTaskRun).to.be.equal(testFunction);
		});

		it ('set preTaskRun() should throw error if no valid function given', () => {
			let expectedErrorMessage = 'You can only assign a function to a task\'s preTaskRun property';
			expect(() => {
				task.preTaskRun = {};
			}).to.throw(TypeError, expectedErrorMessage);
			expect(() => {
				task.preTaskRun = 'invalid';
			}).to.throw(TypeError, expectedErrorMessage);
		});

		it ('set preTaskRun() should set function', () => {
			let testFunction = function () {};
			task.preTaskRun = testFunction;
			expect(task._preTaskRun).to.be.a('function');
			expect(task._preTaskRun).to.be.equal(testFunction);
		});

		it ('get postTaskRun() should return function', () => {
			let testFunction = function () {};
			expect(task.postTaskRun).to.be.null;
			task._postTaskRun = testFunction;
			expect(task.postTaskRun).to.be.a('function');
			expect(task.postTaskRun).to.be.equal(testFunction);
		});

		it ('set postTaskRun() should throw error if no valid function given', () => {
			let expectedErrorMessage = 'You can only assign a function to a task\'s postTaskRun property';
			expect(() => {
				task.postTaskRun = {};
			}).to.throw(TypeError, expectedErrorMessage);
			expect(() => {
				task.postTaskRun = 'invalid';
			}).to.throw(TypeError, expectedErrorMessage);
		});

		it ('set postTaskRun() should set function', () => {
			let testFunction = function () {};
			task.postTaskRun = testFunction;
			expect(task._postTaskRun).to.be.a('function');
			expect(task._postTaskRun).to.be.equal(testFunction);
		});
	});

	describe('run', () => {
		it('should call preTaskRun function if set', () => {
			let preTaskRunSpy = sinon.spy();
			task.preTaskRun = preTaskRunSpy;
			let runPromise = task.run();
			expect(runPromise).to.be.an.instanceof(Promise);
			expect(runPromise).to.be.fulfilled;
			return runPromise.then(() => {
				expect(preTaskRunSpy.calledWith(task)).to.be.true;
			});
		});

		it('should call beforeTaskAction', () => {
			let beforeTaskActionSpy = sinon.spy(task, 'beforeTaskAction');
			let runPromise = task.run();
			expect(runPromise).to.be.an.instanceof(Promise);
			expect(runPromise).to.eventually.be.fulfilled;
			return runPromise.then(() => {
				expect(beforeTaskActionSpy.called).to.be.true;
				expect(beforeTaskActionSpy.firstCall.returnValue).to.be.an.instanceof(Promise);
			});
		});

		it('should call runTaskAction', () => {
			let runTaskActionSpy = sinon.spy(task, 'runTaskAction');
			let runPromise = task.run();

			expect(runPromise).to.be.an.instanceof(Promise);
			expect(runPromise).to.be.fulfilled;
			return runPromise.then(() => {
				expect(runTaskActionSpy.called).to.be.true;
			});
		});

		it('should call afterTaskAction', () => {
			let afterTaskActionSpy = sinon.spy(task, 'afterTaskAction');
			let runPromise = task.run();
			expect(runPromise).to.be.an.instanceof(Promise);
			expect(runPromise).to.eventually.be.fulfilled;
			return runPromise.then(() => {
				expect(afterTaskActionSpy.called).to.be.true;
				expect(afterTaskActionSpy.firstCall.returnValue).to.be.an.instanceof(Promise);
			});
		});

		it('should call postTaskRun function of set', () => {
			let postTaskRunSpy = sinon.spy();
			task.postTaskRun = postTaskRunSpy;
			let runTaskActionSpy = sinon.spy(task, 'runTaskAction');
			let runPromise = task.run();
			expect(runPromise).to.be.an.instanceof(Promise);
			expect(runPromise).to.be.fulfilled;
			return runPromise.then(() => {
				expect(postTaskRunSpy.calledWith(task)).to.be.true;
				expect(runTaskActionSpy.called).to.be.true;
			});
		});
	});

	describe('formatElapsedTime', () => {
		it('should format process.hrtime to string', () => {
			let elapsedTime = [1, 1.732 * 1000000];
			let expectedTimeString = '1s 1.732ms';
			expect(task.formatElapsedTime(elapsedTime)).to.be.equal(expectedTimeString);
		});
	});
});
