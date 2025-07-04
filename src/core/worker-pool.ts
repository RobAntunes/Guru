import { Worker } from 'worker_threads';
import * as path from 'path';

interface WorkerPoolStats {
  activeWorkers: number;
  idleWorkers: number;
  queueLength: number;
  memoryUsage: number;
  memoryPressureLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface MemoryLimits {
  maxMemoryMB: number;
  pressureThresholdMB: number;
  criticalThresholdMB: number;
  minWorkers: number;
  maxWorkers: number;
}

export class WorkerPool<T, R> {
  private workers: Worker[] = [];
  private idleWorkers: Worker[] = [];
  private queue: Array<{ data: T; resolve: (r: R) => void; reject: (e: any) => void }> = [];
  private workerScript: string;
  private maxWorkers: number;
  private minWorkers: number;
  private memoryLimits: MemoryLimits;
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private lastMemoryCheck = 0;
  private memoryPressureLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  constructor(workerScript: string, maxWorkers: number = 4, memoryLimits?: Partial<MemoryLimits>) {
    this.workerScript = workerScript;
    this.maxWorkers = maxWorkers;
    this.minWorkers = Math.max(1, Math.floor(maxWorkers / 2)); // Always keep at least half workers
    
    // Default memory limits (can be overridden)
    this.memoryLimits = {
      maxMemoryMB: 512, // 512MB default limit
      pressureThresholdMB: 256, // Start scaling down at 256MB
      criticalThresholdMB: 384, // Critical at 384MB
      minWorkers: this.minWorkers,
      maxWorkers: this.maxWorkers,
      ...memoryLimits
    };

    // Start with minimum workers, scale up as needed
    for (let i = 0; i < this.minWorkers; i++) {
      this.addWorker();
    }

    // Start memory monitoring
    this.startMemoryMonitoring();
  }

  private addWorker() {
    if (this.workers.length >= this.maxWorkers) {
      return; // Already at max capacity
    }

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
      // Remove errored worker and potentially replace it
      this.removeWorker(worker);
      this.processQueue();
    });
    
    this.workers.push(worker);
    this.idleWorkers.push(worker);
  }

  private removeWorker(workerToRemove?: Worker) {
    if (this.workers.length <= this.minWorkers) {
      return; // Don't go below minimum
    }

    const worker = workerToRemove || this.idleWorkers.pop();
    if (!worker) return;

    // Remove from all arrays
    this.workers = this.workers.filter(w => w !== worker);
    this.idleWorkers = this.idleWorkers.filter(w => w !== worker);
    
    // Terminate the worker
    worker.terminate();
  }

  private startMemoryMonitoring() {
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryPressure();
    }, 1000); // Check every second
  }

  private checkMemoryPressure() {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    
    this.lastMemoryCheck = heapUsedMB;

    // Determine pressure level
    if (heapUsedMB > this.memoryLimits.criticalThresholdMB) {
      this.memoryPressureLevel = 'critical';
      this.scaleDownWorkers(2); // Aggressively scale down
    } else if (heapUsedMB > this.memoryLimits.pressureThresholdMB) {
      this.memoryPressureLevel = 'high';
      this.scaleDownWorkers(1); // Scale down gradually
    } else if (heapUsedMB < this.memoryLimits.pressureThresholdMB * 0.7) {
      this.memoryPressureLevel = 'low';
      this.scaleUpWorkers(); // Safe to scale up
    } else {
      this.memoryPressureLevel = 'medium';
      // No action needed, maintain current workers
    }
  }

  private scaleDownWorkers(count: number = 1) {
    for (let i = 0; i < count && this.workers.length > this.minWorkers; i++) {
      this.removeWorker();
    }
  }

  private scaleUpWorkers() {
    // Only scale up if we have queued work and memory is available
    if (this.queue.length > 0 && this.workers.length < this.maxWorkers) {
      this.addWorker();
    }
  }

  runTask(data: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
      
      // Check if we need more workers for the queue
      if (this.memoryPressureLevel === 'low' && this.queue.length > this.idleWorkers.length) {
        this.scaleUpWorkers();
      }
      
      this.processQueue();
    });
  }

  /**
   * Run multiple tasks in parallel with better load balancing
   */
  runTasks(tasks: T[]): Promise<R[]> {
    return Promise.all(tasks.map(task => this.runTask(task)));
  }

  /**
   * Run tasks in optimized batches based on current worker capacity
   */
  async runTasksInBatches(tasks: T[], batchSize?: number): Promise<R[]> {
    const results: R[] = [];
    const optimalBatchSize = batchSize || this.calculateOptimalBatchSize(tasks.length);
    
    for (let i = 0; i < tasks.length; i += optimalBatchSize) {
      const batch = tasks.slice(i, i + optimalBatchSize);
      const batchResults = await Promise.all(
        batch.map(task => this.runTask(task))
      );
      results.push(...batchResults);
      
      // Check memory pressure between batches
      if (this.memoryPressureLevel === 'high' || this.memoryPressureLevel === 'critical') {
        // Small delay to allow memory cleanup
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    return results;
  }

  /**
   * Calculate optimal batch size based on worker count and memory pressure
   */
  private calculateOptimalBatchSize(totalTasks: number): number {
    const workerCount = this.workers.length;
    let batchSize = Math.max(1, Math.floor(totalTasks / workerCount));
    
    // Adjust based on memory pressure
    switch (this.memoryPressureLevel) {
      case 'critical':
        batchSize = Math.max(1, Math.floor(batchSize * 0.3));
        break;
      case 'high':
        batchSize = Math.max(1, Math.floor(batchSize * 0.5));
        break;
      case 'medium':
        batchSize = Math.max(1, Math.floor(batchSize * 0.8));
        break;
      case 'low':
        batchSize = Math.min(totalTasks, Math.floor(batchSize * 1.5));
        break;
    }
    
    return Math.max(1, Math.min(20, batchSize)); // Between 1 and 20 tasks per batch
  }

  private processQueue() {
    if (this.queue.length === 0 || this.idleWorkers.length === 0) return;
    
    const worker = this.idleWorkers.pop()!;
    const job = this.queue[0];
    worker.postMessage(job.data);
  }

  getStats(): WorkerPoolStats {
    return {
      activeWorkers: this.workers.length - this.idleWorkers.length,
      idleWorkers: this.idleWorkers.length,
      queueLength: this.queue.length,
      memoryUsage: this.lastMemoryCheck,
      memoryPressureLevel: this.memoryPressureLevel
    };
  }

  /**
   * Force garbage collection if available and memory pressure is high
   */
  private forceGC() {
    if (global.gc && this.memoryPressureLevel === 'critical') {
      global.gc();
    }
  }

  /**
   * Adjust memory limits dynamically
   */
  updateMemoryLimits(newLimits: Partial<MemoryLimits>) {
    this.memoryLimits = { ...this.memoryLimits, ...newLimits };
  }

  destroy() {
    // Stop memory monitoring
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    // Terminate all workers
    for (const worker of this.workers) {
      worker.terminate();
    }
    
    this.workers = [];
    this.idleWorkers = [];
    this.queue = [];
    
    // Final garbage collection attempt
    this.forceGC();
  }
} 