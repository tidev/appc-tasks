import { ConsoleLoggerAdapter } from '../lib/logger';
import { expect } from 'chai';
import stdMocks from 'std-mocks';

describe('ConsoleLoggerAdapter', () => {
	describe('trace, debug, info, warn, error', () => {
		it('should prefix message and passthrough to console', () => {
			let taskName = 'passthroughTest';
			let logger = new ConsoleLoggerAdapter(taskName);
			stdMocks.use();
			logger.trace('trace');
			logger.debug('debug');
			logger.info('info');
			logger.warn('warn');
			logger.error('error');
			stdMocks.restore();
			var output = stdMocks.flush();
			expect(output.stdout).to.be.deep.equal([
				'passthroughTest: trace\n',
				'passthroughTest: debug\n',
				'passthroughTest: info\n',
				'passthroughTest: warn\n'
			]);
			expect(output.stderr).to.be.deep.equal(['passthroughTest: error\n']);
		});
	});
});
