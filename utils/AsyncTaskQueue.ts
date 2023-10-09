export interface AsyncTask<T> {
  task: () => PromiseLike<T>;
  resolve: (v: T) => void;
  reject: (e: any) => void;
  id: number;
}

export class AsyncTaskQueue {
  private queue: AsyncTask<any>[] = [];
  private isTaskRunnerRunning = false;
  private id = 0;

  stopTaskRunner() {
    this.isTaskRunnerRunning = false;
  }

  runTaskRunner() {
    this.isTaskRunnerRunning = true;
    const fn = async () => {
      if (!this.isTaskRunnerRunning) return;
      for (let i = 0; this.queue.length && i < 50; i++) {
        const task = this.queue.pop()!;

        console.log("start task", task.id);
        try {
          task.resolve(await task.task());
        } catch (e) {
          task.reject(e);
        }
        console.log("end task", task.id);
      }

      setTimeout(fn, 100);
    };

    fn();
  }

  run<T>(fn: () => PromiseLike<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.unshift({
        task: fn,
        resolve,
        reject,
        id: this.id++,
      });
    });
  }
}
