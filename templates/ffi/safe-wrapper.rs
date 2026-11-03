//! Safe wrapper template for unsafe FFI code
//!
//! This template shows how to create safe Rust abstractions over unsafe FFI calls.

use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_int, c_void};
use std::ptr::NonNull;

// =====================================================
// FFI Declarations (would typically be in separate bindgen file)
// =====================================================

mod ffi {
    use super::{c_char, c_int};

    // Opaque handle type
    pub enum Handle {}

    unsafe extern "C" {
        pub fn lib_create() -> *mut Handle;
        pub fn lib_destroy(handle: *mut Handle);
        pub fn lib_process(handle: *mut Handle, input: *const c_char) -> c_int;
        pub fn lib_get_result(handle: *mut Handle) -> *const c_char;
        pub fn lib_get_error() -> *const c_char;
    }
}

// =====================================================
// Safe Error Type
// =====================================================

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("failed to create handle")]
    CreateFailed,

    #[error("operation failed: {0}")]
    OperationFailed(String),

    #[error("null pointer returned")]
    NullPointer,

    #[error("invalid UTF-8 in result")]
    InvalidUtf8,
}

pub type Result<T> = std::result::Result<T, Error>;

// =====================================================
// Safe Wrapper Type
// =====================================================

/// Safe wrapper around the FFI library handle.
///
/// # Safety
///
/// This type ensures:
/// - Handle is properly initialized before use
/// - Handle is destroyed when dropped
/// - All operations check for errors
/// - String conversions are safe
pub struct Library {
    handle: NonNull<ffi::Handle>,
}

// SAFETY: The underlying C library is thread-safe (document this!)
unsafe impl Send for Library {}

impl Library {
    /// Create a new library instance.
    ///
    /// # Errors
    /// Returns an error if the library cannot create a handle.
    pub fn new() -> Result<Self> {
        // SAFETY: lib_create returns a valid handle or null
        let ptr = unsafe { ffi::lib_create() };

        NonNull::new(ptr)
            .map(|handle| Library { handle })
            .ok_or(Error::CreateFailed)
    }

    /// Process input and return result.
    ///
    /// # Errors
    /// Returns an error for invalid input, processing failure, or invalid output.
    pub fn process(&mut self, input: &str) -> Result<String> {
        // Convert Rust string to C string
        let c_input = CString::new(input)
            .map_err(|_| Error::OperationFailed("input contains null byte".to_string()))?;

        // SAFETY: handle is valid (from new()), c_input is valid C string
        let result = unsafe {
            ffi::lib_process(self.handle.as_ptr(), c_input.as_ptr())
        };

        if result != 0 {
            return Err(Self::get_last_error());
        }

        self.get_result()
    }

    /// Get the result string from the library.
    fn get_result(&self) -> Result<String> {
        // SAFETY: handle is valid, lib_get_result returns valid C string or null
        let ptr = unsafe { ffi::lib_get_result(self.handle.as_ptr()) };

        if ptr.is_null() {
            return Err(Error::NullPointer);
        }

        // SAFETY: ptr is non-null and points to valid C string
        let c_str = unsafe { CStr::from_ptr(ptr) };

        c_str
            .to_str()
            .map(ToString::to_string)
            .map_err(|_| Error::InvalidUtf8)
    }

    /// Get the last error message.
    fn get_last_error() -> Error {
        // SAFETY: lib_get_error returns valid C string or null
        let ptr = unsafe { ffi::lib_get_error() };

        if ptr.is_null() {
            return Error::OperationFailed("unknown error".to_string());
        }

        // SAFETY: ptr is non-null
        let c_str = unsafe { CStr::from_ptr(ptr) };

        let msg = c_str
            .to_str()
            .unwrap_or("invalid UTF-8 in error message");

        Error::OperationFailed(msg.to_string())
    }
}

impl Drop for Library {
    fn drop(&mut self) {
        // SAFETY: handle is valid and we're destroying it exactly once
        unsafe {
            ffi::lib_destroy(self.handle.as_ptr());
        }
    }
}

// =====================================================
// Builder Pattern (for complex initialization)
// =====================================================

pub struct LibraryBuilder {
    // Configuration options...
    config: String,
}

impl LibraryBuilder {
    #[must_use]
    pub fn new() -> Self {
        Self {
            config: String::new(),
        }
    }

    #[must_use]
    pub fn with_config(mut self, config: &str) -> Self {
        self.config = config.to_string();
        self
    }

    /// Build a library handle.
    ///
    /// # Errors
    /// Returns an error if the library cannot create a handle.
    pub fn build(self) -> Result<Library> {
        let _ = self.config;
        Library::new()
    }
}

impl Default for LibraryBuilder {
    fn default() -> Self {
        Self::new()
    }
}

// =====================================================
// Callback Pattern
// =====================================================

/// Wrapper for passing Rust closures to C callbacks
pub struct CallbackContext<F> {
    closure: F,
}

impl<F> CallbackContext<F>
where
    F: FnMut(i32),
{
    pub fn new(closure: F) -> Box<Self> {
        Box::new(Self { closure })
    }

    /// Get raw pointer for passing to C
    pub fn as_ptr(self: &mut Box<Self>) -> *mut c_void {
        (&raw mut **self).cast::<c_void>()
    }

    /// The actual callback function passed to C.
    ///
    /// # Safety
    /// `ctx` must point to a live, exclusively accessible `CallbackContext<F>`.
    /// The caller must prevent concurrent or reentrant access.
    pub unsafe extern "C" fn callback_trampoline(ctx: *mut c_void, value: c_int) {
        // SAFETY: ctx must be a valid pointer to CallbackContext
        let ctx = unsafe { &mut *ctx.cast::<Self>() };
        if std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| (ctx.closure)(value)))
            .is_err()
        {
            std::process::abort();
        }
    }
}

// =====================================================
// Usage Example
// =====================================================

fn main() -> Result<()> {
    let mut lib = Library::new()?;

    let result = lib.process("hello")?;
    println!("Result: {result}");

    Ok(())
}

// =====================================================
// Tests
// =====================================================

#[cfg(test)]
mod tests {
    use super::{c_char, c_int};

    // Note: These tests require mock FFI implementations
    // In real code, use mockall or similar for FFI mocking

    #[test]
    fn test_builder() {
        let builder = LibraryBuilder::new()
            .with_config("test");
        // Would test build() with mocked FFI
        let _ = builder;
    }
}
