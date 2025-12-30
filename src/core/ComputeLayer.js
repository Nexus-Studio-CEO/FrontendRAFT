/**
 * FrontendRAFT - Compute Layer
 * 
 * Web Workers management for parallel computation (inspired by CSOP compute)
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

export class ComputeLayer {
  constructor() {
    this.workers = [];
    this.numWorkers = navigator.hardwareConcurrency || 4;
    this.taskQueue = [];
    this.activeTaskId = 0;
  }

  async init() {
    const workerCode = `
      self.onmessage = function(e) {
        const { taskId, fn, args } = e.data;
        
        try {
          const func = new Function('args', fn);
          const result = func(args);
          self.postMessage({ taskId, result, error: null });
        } catch (error) {
          self.postMessage({ taskId, result: null, error: error.message });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    for (let i = 0; i < this.numWorkers; i++) {
      const worker = new Worker(workerUrl);
      this.workers.push({
        worker,
        busy: false,
        tasksCompleted: 0
      });
    }

    return this.workers.length;
  }

  async execute(fn, args) {
    if (this.workers.length === 0) {
      await this.init();
    }

    const taskId = ++this.activeTaskId;

    return new Promise((resolve, reject) => {
      const task = {
        taskId,
        fn: typeof fn === 'function' ? fn.toString() : fn,
        args,
        resolve,
        reject
      };

      const availableWorker = this.workers.find(w => !w.busy);

      if (availableWorker) {
        this._executeTask(availableWorker, task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  _executeTask(workerObj, task) {
    workerObj.busy = true;

    const messageHandler = (e) => {
      const { taskId, result, error } = e.data;

      if (taskId === task.taskId) {
        workerObj.worker.removeEventListener('message', messageHandler);
        workerObj.busy = false;
        workerObj.tasksCompleted++;

        if (error) {
          task.reject(new Error(error));
        } else {
          task.resolve(result);
        }

        if (this.taskQueue.length > 0) {
          const nextTask = this.taskQueue.shift();
          this._executeTask(workerObj, nextTask);
        }
      }
    };

    workerObj.worker.addEventListener('message', messageHandler);
    workerObj.worker.postMessage({
      taskId: task.taskId,
      fn: task.fn,
      args: task.args
    });
  }

  async batch(tasks) {
    if (this.workers.length === 0) {
      await this.init();
    }

    const promises = tasks.map(task => 
      this.execute(task.fn, task.args)
    );

    const results = await Promise.allSettled(promises);

    return {
      completed: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results: results.map(r => ({
        status: r.status,
        result: r.status === 'fulfilled' ? r.value : null,
        error: r.status === 'rejected' ? r.reason.message : null
      }))
    };
  }

  getStats() {
    return {
      numWorkers: this.numWorkers,
      queuedTasks: this.taskQueue.length,
      workers: this.workers.map((w, i) => ({
        id: i,
        busy: w.busy,
        tasksCompleted: w.tasksCompleted
      }))
    };
  }

  async terminate() {
    for (const workerObj of this.workers) {
      workerObj.worker.terminate();
    }
    this.workers = [];
    this.taskQueue = [];
  }
}