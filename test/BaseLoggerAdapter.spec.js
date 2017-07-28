import { ConsoleLoggerAdapter } from '../lib/logger';
import { expect } from 'chai';

describe('ConsoleLoggerAdapter', () => {
	describe('constructor', () => {
		it('should set task name', () => {
			let taskName = 'constructorTest';
			let logger = new ConsoleLoggerAdapter(taskName);
			expect(logger._taskName).to.be.equal(taskName);
		});
	});
});
