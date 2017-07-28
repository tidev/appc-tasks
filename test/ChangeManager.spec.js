import { expect } from 'chai';
import ChangeManager from '../lib/incremental/ChangeManager';
import { FileMonitor } from 'file-state-monitor';
import fs from 'fs';
import mock from 'mock-fs';
import sinon from 'sinon';

let changeManager = null;

describe('ChangeManager', () => {
	beforeEach(() => {
		changeManager = new ChangeManager();
		mock({
			'states': {
				'inputs.state': JSON.stringify({

				}),
				'outputs.state': {

				}
			},
			'inputs': {
				'input1.txt': 'input'
			},
			'outputs': {
				'output1.txt': 'output'
			}
		});
	});

	afterEach(() => {
		changeManager = null;
		mock.restore();
	});

	describe('constructor', () => {
		it('should create FileMonitor instances', () => {
			expect(changeManager._inputs).to.be.an.instanceof(FileMonitor);
			expect(changeManager._outputs).to.be.an.instanceof(FileMonitor);
		});
	});

	describe('load', () => {
		it('should not load state for non-existing files', () => {
			let loaded = changeManager.load('/does/not/exist');
			expect(loaded).to.be.false;
		});

		it('should load state for inputs and outputs', () => {
			let loadStub = sinon.stub(FileMonitor.prototype, 'load');
			loadStub.returns(true);
			let loaded = changeManager.load('states');
			expect(loaded).to.be.true;
			expect(loadStub.callCount).to.be.equal(2);
			loadStub.restore();
		});
	});

	describe('write', () => {
		it('should write states back to disk', () => {
			let writeStub = sinon.stub(FileMonitor.prototype, 'write');
			changeManager.write('states');
			expect(writeStub.callCount).to.be.equal(2);
			expect(writeStub.firstCall.calledWith('states/inputs.state')).to.be.true;
			expect(writeStub.secondCall.calledWith('states/outputs.state')).to.be.true;
			writeStub.restore();
		});
	});

	describe('delete', () => {
		it('should empty state directory', () => {
			expect(fs.readdirSync('states').length).to.be.equal(2);
			changeManager.delete('states');
			expect(fs.readdirSync('states').length).to.be.equal(0);
		});
	});

	describe('monitorInputPath', () => {
		it('should start monitoring path using the inputs file monitor', () => {
			let monitorPathSpy = sinon.spy(FileMonitor.prototype, 'monitorPath');
			changeManager.monitorInputPath('inputs');
			expect(monitorPathSpy.calledWith('inputs')).to.be.true;
			monitorPathSpy.restore();
		});
	});

	describe('monitorOutputPath', () => {
		it('should start monitoring path using the outputs file monitor', () => {
			let monitorPathSpy = sinon.spy(FileMonitor.prototype, 'monitorPath');
			changeManager.monitorOutputPath('outputs');
			expect(monitorPathSpy.calledWith('outputs')).to.be.true;
			monitorPathSpy.restore();
		});
	});

	describe('hasChanges', () => {
		it('should return wether inputs or outputs monitors have changed files', () => {
			let getChangedFilesStub = sinon.stub(FileMonitor.prototype, 'getChangedFiles');
			// Only input files changed
			getChangedFilesStub.onCall(0).returns({size: 1});
			expect(changeManager.hasChanges()).to.be.true;

			// Only output files changed
			getChangedFilesStub.onCall(1).returns({size: 0});
			getChangedFilesStub.onCall(2).returns({size: 1});
			expect(changeManager.hasChanges()).to.be.true;

			// No file changes
			getChangedFilesStub.onCall(3).returns({size: 0});
			getChangedFilesStub.onCall(4).returns({size: 0});
			expect(changeManager.hasChanges()).to.be.false;

			getChangedFilesStub.restore();
		});
	});

	describe('updateOutputFiles', () => {
		it('should update the monitored files on the outputs monitor', () => {
			let updateStub = sinon.stub(FileMonitor.prototype, 'update');
			let updatePaths = ['outputs'];
			changeManager.updateOutputFiles(updatePaths);
			expect(updateStub.calledWith(updatePaths)).to.be.true;
			updateStub.restore();
		});
	});
});
