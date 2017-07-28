import BaseLoggerAdapter from '../lib/logger/BaseLoggerAdapter';
import { expect } from 'chai';

describe('BaseLoggerAdapter', () => {
	describe('constructor', () => {
		it('should set task name', () => {
			let taskName = 'constructorTest';
			let logger = new BaseLoggerAdapter(taskName);
			expect(logger._taskName).to.be.equal(taskName);
		});
	});

	describe('prefixMessage', () => {
		it('should prefix message with task name', () => {
			let taskName = 'prefixTest';
			let message = 'Prefix this!';
			let logger = new BaseLoggerAdapter(taskName);
			expect(logger.prefixMessage(message)).to.be.equal(`${taskName}: ${message}`);
		});
	});
});
