//! Error type template for libraries using thiserror
//!
//! Add to Cargo.toml:
//! ```toml
//! [dependencies]
//! thiserror = "1"
//! ```

use thiserror::Error;
use std::io;

/// Main error type for the library
#[derive(Error, Debug)]
pub enum Error {
    /// Configuration error
    #[error("configuration error: {message}")]
    Config { message: String },

    /// Resource not found
    #[error("resource not found: {resource_type}/{id}")]
    NotFound { resource_type: String, id: String },

    /// Invalid input
    #[error("invalid input: {0}")]
    InvalidInput(String),

    /// IO error with context
    #[error("IO error: {context}")]
    Io {
        context: String,
        #[source]
        source: io::Error,
    },

    /// Parse error
    #[error("parse error")]
    Parse(#[from] std::num::ParseIntError),

    /// Wrapped external error
    #[error(transparent)]
    External(#[from] ExternalError),
}

/// Example external error that can be wrapped
#[derive(Error, Debug)]
#[error("external service error: {message}")]
pub struct ExternalError {
    pub message: String,
}

/// Result alias for convenience
pub type Result<T> = std::result::Result<T, Error>;

// =====================================================
// Usage Examples
// =====================================================

/// Load and parse the configuration.
///
/// # Errors
/// Returns an error if the file cannot be read or parsed.
pub fn load_config(path: &str) -> Result<Config> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| Error::Io {
            context: format!("reading config from {path}"),
            source: e,
        })?;

    // Parse would use ? with #[from]
    let _value: i32 = content.trim().parse()?;

    Ok(Config { /* ... */ })
}

/// Look up a user.
///
/// # Errors
/// Returns an error if the user is not found.
pub fn get_user(id: &str) -> Result<User> {
    // Simulate not found
    if id == "unknown" {
        return Err(Error::NotFound {
            resource_type: "user".to_string(),
            id: id.to_string(),
        });
    }
    Ok(User { /* ... */ })
}

/// Validate user input.
///
/// # Errors
/// Returns an error if input is empty.
pub fn validate_input(input: &str) -> Result<()> {
    if input.is_empty() {
        return Err(Error::InvalidInput("input cannot be empty".to_string()));
    }
    Ok(())
}

// Placeholder types for examples
pub struct Config;
pub struct User;

// =====================================================
// Tests
// =====================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_not_found_error() {
        let err = Error::NotFound {
            resource_type: "user".to_string(),
            id: "123".to_string(),
        };
        assert_eq!(err.to_string(), "resource not found: user/123");
    }

    #[test]
    fn test_error_source() {
        let io_err = io::Error::new(io::ErrorKind::NotFound, "file missing");
        let err = Error::Io {
            context: "loading data".to_string(),
            source: io_err,
        };

        // Error chain is preserved
        assert!(err.source().is_some());
    }
}
