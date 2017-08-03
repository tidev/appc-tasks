# appc-tasks

[![Travis Build Status](https://travis-ci.org/appcelerator/appc-tasks.svg?branch=master)](https://travis-ci.org/appcelerator/appc-tasks)
[![Appveyor Build status](https://ci.appveyor.com/api/projects/status/p5gakno7oj276abs?svg=true)](https://ci.appveyor.com/project/appcelerator/appc-tasks)
[![Coverage Status](https://coveralls.io/repos/github/appcelerator/appc-tasks/badge.svg?branch=master)](https://coveralls.io/github/appcelerator/appc-tasks?branch=master)
[![Dependencies](https://david-dm.org/appcelerator/appc-tasks.svg)](https://david-dm.org/appcelerator/appc-tasks)

> Extendable base interface for file based build tasks

## Introduction

This module provides a base interface for defining custom tasks. It is used within the Titanium SDK and Hyperloop build pipelines but is designed to be usable in any other project as well.

## Getting started

Install via npm

```bash
npm i appc-tasks -S
```

and create your own tasks using the provided base implementation

```javascript
import { BaseTask } from 'appc-tasks';

class MyTask extends BaseTask {
  runTaskAction() {
    // Implement task logic here
  }
}

let task = new MyTask({name: 'myTask'});
task.run().then(() => {
  console.log('Task completed');
}).catch(err => {
  console.log(`Task failed with error: ${err}`);
});
```

### The base task

All tasks extend from the `BaseTask` class which defines the interface how tasks are being run. New tasks that extends from the `BaseTask` need to override `runTaskAction` and define their task action there. To  customize the behavior a task, you can also implement the `beforeTaskAction` and `afterTaskAction` methods which will automatically be called by the task's `run` method. Here you can do any pre- or post-processing that might be required for every a instance of that specific task. In addition a task instance can be assigned a `preTaskRun` and `postTaskRun` function, which is intended to further customize single instances of your task.

```javascript
import { BaseTask } from 'appc-tasks';

class CustomTask extends BaseTask {
  beforeTaskAction() {
    this.logger.debug('beforeTaskAction');
  }

  runTaskAction() {
    this.logger.debug('runTaskAction');
  }

  afterTaskAction() {
    this.logger.debug('afterTaskAction');
  }
}

let task = new CustomTask({
  name: 'customTask';
});
taskInstance.preTaskRun = () => {
  task.logger.debug('preTaskRun');
}
taskInstance.postTaskRun = () => {
  task.logger.info('postTaskRun');
}
taskInstance.run();
// log output:
// customTask: preTaskRun
// customTask: beforeTaskAction
// customTask: runTaskAction
// customTask: afterTaskAction
// customTask: postTaskRun
```

All of the above methods are executed in a `.then` chain, allowing you to perform async operations by returning a `Promise`.

The base constructor can receive two options, a required `name` and and an optional `logger`. If you don't provide a logger, a default logger using `console.log` will be created. In the event that you want to provide your own logger, it has to be compatible to bunyan's [log method API](https://github.com/trentm/node-bunyan#log-method-api). A task will wrap the logger in an adapter, which will prefix every log message with the task name for better readability log messages.

### File based tasks

The `BaseFileTask` extends the `BaseTask` with the concept of input and output files. Tasks that implement this interface can use that to describe which input files they require and which output files they will produce.

```javascript
import { BaseFileTask } from 'appc-tasks';

class FileTask extends BaseFileTask {

  constructor(taskInfo) {
    super(taskInfo);

    this._sourceDirectory = null;
    this._outputDirectory = null;
  }

  get sourceDirectory() {
    return this._sourceDirectory;
  }

  set sourceDirectory(sourceDirectory) {
    this._sourceDirectory = sourceDirectory;
    this.addInputDirectory(this.sourceDirectory);
  }

  get outputDirectory() {
    return this._outputDirectory;
  }

  set outputDirectory(outputPath) {
    this._outputDirectory = outputPath;
    this.registerOutputPath(this.outputDirectory);
  }

  runTaskAction() {
    // this.inputFiles contains every file under the source directory
    for (let inputFile of this.inputFiles) {
      // process your input files and write them to outputDirectory
    }
  }
}

let task = new FileTask({
  name: 'fileTask'
});
task.sourceDirectory = '/path/to/some/sources';
task.outputDirectory = '/path/to/output';
task.run();
```

In the above example, adding of input files is masked behind setting a property for a cleaner API. You can also pass `inputFiles` directly  via the constructor options if you know your set of input files beforehand, or manually call the `addInputFile` and `addInputDirectory` methods.

Similar to the input files, you can also define output files and directories. Do so by calling `registerOutputPath`, which will register the path so the task knows where to search for generated output files. The `BaseFileTask.afterTaskAction` implementation will recursively scan your registered output paths and add all found files to the `outputFiles` property after the task finished its `runTaskAction`.

> ⚠️ Do not call `addOutputFile` or `addOutputDirectory` yourself, the `afterTaskAction` will do this for your using the registered output paths.

> ✅ Handle the setting of inout and output files or directories behind a property setter for a clean API in your task.

### Incremental file tasks

The `IncrementalFileTask` further extends the `BaseFileTask` with the ability to run full and incremental task actions, depending on wether input or output files changed. There are a few slight changes when creating a custom incremental task.

```javascript
import { IncrementalFileTask } from 'appc-tasks';

class MySmartTask extends IncrementalFileTask {
  get incrementalOutputs() {
    return [this.outputDirectory];
  }

  doFullTaskRun() {
    // Implement your full task run action here
  }

  doIncrementalTaskRun(changedFiles) {
    // Implement your incremental task run action here
  }
}

let task = new MySmartTask({
  name: 'incrementalTask',
  incrementalDirectory: '/incremental/mytask'
});
task.addInputDirectory('/input/path');
task.outputDirectory = '/output/path';
task.run();
```

When instantiating an incremental task the constructor requires a `incrementalDirectory` to be passed via the options object. This directory will hold all the state data that is used to determine changed files and any other data your task might require to perform incremental.

The `incrementalOutputs` getter is used to define the output files and directories that will be checked to see if a anything changed and trigger a full run. This has to be an Array of paths you are free to set as you seem fit for your task.

Instead of overriding `runTaskAction` like in the previous examples, incremental tasks need to override `doFullTaskRun` and `doIncrementalTaskRun` to define the its logic. `runTaskAction` already handles the detection of file changes and triggers either a full or incremental task run. The rules for this are:

* No incremental data: full task run
* Output files changed: full task run
* Input files changed: incremental task run
* Nothing changed: skip task run

The `changedFiles` in `doIncrementalTaskRun` will be a `Map` with the full path to the file as the key, and either the string `created`, `changed` or `delated` as the value.

## What's next?

- [ ] Ability to organize tasks into some sort of Project and define dependencies between those tasks. The project then manages the execution of all tasks, taking care of execution order as well as passing input and output data from and to the individual tasks.
- [ ] Make use of ES7 decorators to mark properties as inputs and outputs
