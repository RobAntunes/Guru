import { Worker } from 'worker_threads';
import * as path from 'path';

export class WorkerPool<T, R> {
  private workers: Worker[] = [];
  private idleWorkers: Worker[] = [];
  private queue: Array<{ data: T; resolve: (r: R) => void; reject: (e: any) => void }> = [];
  private workerScript: string;
  private maxWorkers: number;

  constructor(workerScript: string, maxWorkers: number = 4) {
    this.workerScript = workerScript;
    this.maxWorkers = maxWorkers;
    for (let i = 0; i < maxWorkers; i++) {
      this.addWorker();
    }
  }

  private addWorker() {
    const worker = new Worker(this.workerScript);
    worker.on('message', (result: R) => {
      const job = this.queue.shift();
      if (job) {
        job.resolve(result);
      }
      this.idleWorkers.push(worker);
      this.processQueue();
    });
    worker.on('error', (err) => {
      const job = this.queue.shift();
      if (job) {
        job.reject(err);
      }
      this.idleWorkers.push(worker);
      this.processQueue();
    });
    this.idleWorkers.push(worker);
  }

  runTask(data: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.queue.length === 0 || this.idleWorkers.length === 0) return;
    const worker = this.idleWorkers.pop()!;
    const job = this.queue[0];
    worker.postMessage(job.data);
  }

  destroy() {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
    this.idleWorkers = [];
  }
} 