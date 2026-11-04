//! Worker pool template for CPU-bound tasks
//!
//! Uses crossbeam for better ergonomics than `std::mpsc`

use std::sync::Arc;
use std::thread;

// =====================================================
// Simple Worker Pool
// =====================================================

/// A thread pool for processing tasks
pub struct WorkerPool<T, R>
where
    T: Send + 'static,
    R: Send + 'static,
{
    sender: crossbeam_channel::Sender<Task<T, R>>,
    handles: Vec<thread::JoinHandle<()>>,
}

struct Task<T, R> {
    data: T,
    result_sender: crossbeam_channel::Sender<R>,
}

impl<T, R> WorkerPool<T, R>
where
    T: Send + 'static,
    R: Send + 'static,
{
    /// Create a new worker pool with the given processor function
    pub fn new<F>(num_workers: usize, processor: F) -> Self
    where
        F: Fn(T) -> R + Send + Sync + 'static,
    {
        let (sender, receiver) = crossbeam_channel::bounded::<Task<T, R>>(num_workers * 2);
        let processor = Arc::new(processor);

        let handles = (0..num_workers)
            .map(|_| {
                let receiver = receiver.clone();
                let processor = Arc::clone(&processor);

                thread::spawn(move || {
                    while let Ok(task) = receiver.recv() {
                        let result = processor(task.data);
                        let _ = task.result_sender.send(result);
                    }
                })
            })
            .collect();

        Self { sender, handles }
    }

    /// Submit a task and get a channel for the result
    pub fn submit(&self, data: T) -> crossbeam_channel::Receiver<R> {
        let (result_sender, result_receiver) = crossbeam_channel::bounded(1);
        let _ = self.sender.send(Task { data, result_sender });
        result_receiver
    }

    /// Process all items and collect results.
    ///
    /// # Panics
    /// Panics if a worker disconnects before sending its result.
    #[must_use]
    pub fn map(&self, items: Vec<T>) -> Vec<R> {
        let receivers: Vec<_> = items
            .into_iter()
            .map(|item| self.submit(item))
            .collect();

        receivers
            .into_iter()
            .map(|r| r.recv().unwrap())
            .collect()
    }

    /// Shutdown the pool gracefully
    pub fn shutdown(self) {
        drop(self.sender);
        for handle in self.handles {
            let _ = handle.join();
        }
    }
}

// =====================================================
// Usage with rayon (simpler alternative)
// =====================================================

/// Using rayon for parallel iteration (often simpler)
mod rayon_example {
    use rayon::prelude::*;

    pub fn parallel_process(items: &[i32]) -> Vec<i32> {
        items
            .par_iter()
            .map(|x| expensive_computation(*x))
            .collect()
    }

    fn expensive_computation(x: i32) -> i32 {
        // Simulate work
        std::thread::sleep(std::time::Duration::from_millis(10));
        x * x
    }
}

// =====================================================
// Example Usage
// =====================================================

fn main() {
    // Create pool with 4 workers
    let pool = WorkerPool::new(4, |x: i32| {
        std::thread::sleep(std::time::Duration::from_millis(100));
        x * x
    });

    // Submit single task
    let receiver = pool.submit(5);
    println!("Result: {}", receiver.recv().unwrap());

    // Process batch
    let items = vec![1, 2, 3, 4, 5, 6, 7, 8];
    let results = pool.map(items);
    println!("Results: {results:?}");

    // Cleanup
    pool.shutdown();
}

// =====================================================
// Tests
// =====================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_worker_pool() {
        let pool = WorkerPool::new(2, |x: i32| x * 2);

        let results = pool.map(vec![1, 2, 3, 4]);
        assert_eq!(results, vec![2, 4, 6, 8]);

        pool.shutdown();
    }
}
