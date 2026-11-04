//! Async task patterns with tokio
//!
//! Add to Cargo.toml:
//! ```toml
//! [dependencies]
//! tokio = { version = "1", features = ["full"] }
//! ```

use std::time::Duration;
use tokio::sync::{mpsc, oneshot};
use tokio::task::JoinSet;

// =====================================================
// Basic Task Spawning
// =====================================================

async fn basic_spawn() {
    // Spawn a task
    let handle = tokio::spawn(async {
        tokio::time::sleep(Duration::from_millis(100)).await;
        "result"
    });

    // Wait for result
    let result = handle.await.unwrap();
    println!("Got: {result}");
}

// =====================================================
// Concurrent Tasks with JoinSet
// =====================================================

async fn parallel_fetch(urls: Vec<String>) -> Vec<String> {
    let mut set = JoinSet::new();

    for url in urls {
        set.spawn(async move {
            // Simulate fetch
            tokio::time::sleep(Duration::from_millis(100)).await;
            format!("Response from {url}")
        });
    }

    let mut results = Vec::new();
    while let Some(res) = set.join_next().await {
        if let Ok(data) = res {
            results.push(data);
        }
    }
    results
}

// =====================================================
// Task with Cancellation
// =====================================================

async fn cancellable_task(cancel: oneshot::Receiver<()>) {
    tokio::select! {
        _ = async {
            loop {
                println!("Working...");
                tokio::time::sleep(Duration::from_millis(500)).await;
            }
        } => {}
        _ = cancel => {
            println!("Task cancelled");
        }
    }
}

async fn demo_cancellation() {
    let (cancel_tx, cancel_rx) = oneshot::channel();

    let handle = tokio::spawn(cancellable_task(cancel_rx));

    // Let it run for a bit
    tokio::time::sleep(Duration::from_secs(2)).await;

    // Cancel
    let _ = cancel_tx.send(());
    let _ = handle.await;
}

// =====================================================
// Task with Bounded Channel (Backpressure)
// =====================================================

async fn producer_consumer() {
    let (tx, mut rx) = mpsc::channel::<i32>(10); // buffer of 10

    // Producer
    let producer = tokio::spawn(async move {
        for i in 0..100 {
            tx.send(i).await.unwrap();
            println!("Sent: {i}");
        }
    });

    // Consumer (slower)
    let consumer = tokio::spawn(async move {
        while let Some(item) = rx.recv().await {
            tokio::time::sleep(Duration::from_millis(50)).await;
            println!("Received: {item}");
        }
    });

    let _ = tokio::join!(producer, consumer);
}

// =====================================================
// Task with Timeout
// =====================================================

async fn with_timeout<F, T>(future: F, timeout: Duration) -> Result<T, &'static str>
where
    F: std::future::Future<Output = T>,
{
    tokio::time::timeout(timeout, future)
        .await
        .map_err(|_| "timeout")
}

// =====================================================
// Graceful Shutdown Pattern
// =====================================================

struct Server {
    shutdown_tx: Option<oneshot::Sender<()>>,
}

impl Server {
    fn new() -> Self {
        Self { shutdown_tx: None }
    }

    async fn run(&mut self) {
        let (shutdown_tx, shutdown_rx) = oneshot::channel();
        self.shutdown_tx = Some(shutdown_tx);

        tokio::select! {
            () = self.serve() => {
                println!("Server finished");
            }
            _ = shutdown_rx => {
                println!("Shutdown signal received");
            }
        }
    }

    async fn serve(&self) {
        loop {
            // Accept connections...
            tokio::time::sleep(Duration::from_secs(1)).await;
            println!("Serving...");
        }
    }

    fn shutdown(&mut self) {
        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.send(());
        }
    }
}

// =====================================================
// Spawn Blocking for CPU Work
// =====================================================

async fn cpu_bound_in_async() -> i32 {
    tokio::task::spawn_blocking(|| {
        // CPU-intensive work here
        let mut sum = 0i32;
        for i in 0..1_000_000 {
            sum = sum.wrapping_add(i);
        }
        sum
    })
    .await
    .unwrap()
}

// =====================================================
// Main
// =====================================================

#[tokio::main]
async fn main() {
    basic_spawn().await;

    let urls = vec![
        "http://a.com".to_string(),
        "http://b.com".to_string(),
        "http://c.com".to_string(),
    ];
    let results = parallel_fetch(urls).await;
    println!("Fetched: {results:?}");

    let result = cpu_bound_in_async().await;
    println!("CPU result: {result}");
}

// =====================================================
// Tests
// =====================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_parallel_fetch() {
        let urls = vec!["a".to_string(), "b".to_string()];
        let results = parallel_fetch(urls).await;
        assert_eq!(results.len(), 2);
    }

    #[tokio::test]
    async fn test_timeout() {
        let result = with_timeout(
            async {
                tokio::time::sleep(Duration::from_secs(10)).await;
                42
            },
            Duration::from_millis(100),
        )
        .await;

        assert!(result.is_err());
    }
}
