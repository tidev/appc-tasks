import { BunyanLoggerAdapter } from '../lib/logger';
import { expect } from 'chai';
import sinon from 'sinon';

describe('BunyanLoggerAdapter', () => {
	let bunyanApi = {
		trace: () => {},
		debug: () => {},
		info: () => {},
		warn: () => {},
		error: () => {}
	};

	describe('constructor', () => {
		it('should throw error if logger does not conform to bunyan log API', () => {
			let exceptionMessage = 'Invalid logger given, only logger instances that support the Bunyan log methods API are supported.';
			expect(() => {
				new BunyanLoggerAdapter('constructorTest');
			}).to.throw(TypeError, exceptionMessage);
			expect(() => {
				new BunyanLoggerAdapter('constructorTest', 0);
			}).to.throw(TypeError, exceptionMessage);
			expect(() => {
				new BunyanLoggerAdapter('constructorTest', {
					invalidApi: () => {}
				});
			}).to.throw(TypeError, exceptionMessage);
		});

		it('should set task name and wrapped logger instance', () => {
			let taskName = 'constructorTest';
			let logger = new BunyanLoggerAdapter(taskName, bunyanApi);
			expect(logger._taskName).to.be.equal(taskName);
			expect(logger._logger).to.be.equal(bunyanApi);
		});
	});

	describe('trace, debug, info, war, error', () => {
		it('should passthrough to the underlying bunyan logger', () => {
			let bunyanMock = sinon.mock(bunyanApi);
			bunyanMock.expects('trace').once();
			bunyanMock.expects('debug').once();
			bunyanMock.expects('info').once();
			bunyanMock.expects('warn').once();
			bunyanMock.expects('error').once();
			let bunyanLoggerAdapter = new BunyanLoggerAdapter('test', bunyanApi);
			bunyanLoggerAdapter.trace();
			bunyanLoggerAdapter.debug();
			bunyanLoggerAdapter.info();
			bunyanLoggerAdapter.warn();
			bunyanLoggerAdapter.error();
			bunyanMock.verify();
			bunyanMock.restore();
		});
	});

	describe('prefixWithNameAndPassThrough', () => {
		let logger = null;
		let bunyanMock = null;
		let taskName = 'prefixTest';

		beforeEach(() => {
			bunyanMock = sinon.mock(bunyanApi);
			logger = new BunyanLoggerAdapter(taskName, bunyanApi);
		});

		afterEach(() => {
			logger = null;
		});

		it('should report if log level enabled without arguments', () => {
			bunyanMock.expects('info').once().withExactArgs().returns(true);
			let logLevelEnabled = logger.info();
			expect(logLevelEnabled).to.be.true;
			bunyanMock.verify();
		});

		it('should prefix log.<level>(err, ...)', () => {
			let errorMessage = 'Testing error';
			let error = new Error(errorMessage);
			let prefixedMessage = `${taskName}: ${errorMessage}`;
			bunyanMock.expects('error').once().withExactArgs(error);
			logger.error(error);
			expect(error.message).to.be.equal(prefixedMessage);
			bunyanMock.verify();
		});

		it('should prefix log.<level>(msg, ...)', () => {
			let message = 'Test message %s';
			let additionalArg = '1';
			let prefixedMessage = `${taskName}: ${message}`;
			bunyanMock.expects('trace').once().withExactArgs(prefixedMessage, additionalArg);
			logger.trace(message, additionalArg);
			bunyanMock.verify();
		});

		it('should prefix log.<level>(fields, msg, ...)', () => {
			let message = 'Test log with fields';
			let fields = {
				foo: 'bar'
			};
			let prefixedMessage = `${taskName}: ${message}`;
			bunyanMock.expects('debug').once().withExactArgs(fields, prefixedMessage);
			logger.debug(fields, message);
			bunyanMock.verify();
		});

		it('should prefix log.<level>(fields, msg, ...) with fields.err', () => {
			let message = 'Testing field.err';
			let error = new Error(message);
			let fields = {
				err: error
			};
			let prefixedMessage = `${taskName}: ${message}`;
			bunyanMock.expects('debug').once().withExactArgs(fields);
			logger.debug(fields);
			expect(error.message).to.be.equal(prefixedMessage);
			bunyanMock.verify();
		});
	});
});
