---
id: ffi-04
original_id: P.UNS.FFI.04
level: P
impact: CRITICAL
clippy: panic_in_result_fn
---

# Handle Panics When Crossing FFI Boundaries

## Summary

Panics must not unwind across FFI boundaries. Use `catch_unwind` or mark functions as `extern "C-unwind"`.

## Rationale

- Unwinding across C code is undefined behavior
- C has no concept of Rust panics
- Can corrupt C stack frames and cause crashes
- Even with `panic=abort`, still UB to attempt unwinding in `extern "C"`

## Bad Example

```rust
// DON'T: Allow panics to escape to C
// SAFETY: The final binary must define this exported symbol only once.
#[unsafe(no_mangle)]
pub extern "C" fn callback(data: *const u8, len: usize) -> i32 {
    let slice = unsafe { std::slice::from_raw_parts(data, len) };

    // If this panics, UB occurs!
    let sum: i32 = slice.iter().map(|&x| x as i32).sum();

    // If this panics due to overflow in debug, UB!
    process(sum)
}

// DON'T: Unwrap in extern functions
// SAFETY: The final binary must define this exported symbol only once.
#[unsafe(no_mangle)]
pub extern "C" fn parse_config(path: *const c_char) -> i32 {
    let path = unsafe { CStr::from_ptr(path) };
    let config = std::fs::read_to_string(path.to_str().unwrap()).unwrap();  // Can panic!
    0
}
```

## Good Example

```rust
use std::panic::{catch_unwind, AssertUnwindSafe};
use std::ffi::CStr;
use std::os::raw::{c_char, c_int};

// DO: Catch panics at FFI boundary
/// # Safety
/// `data` must point to `len` initialized bytes in one live allocation, with no
/// mutation for the duration of the call, and `len` must not exceed `isize::MAX`.
// SAFETY: The final binary must define this exported symbol only once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn safe_callback(data: *const u8, len: usize) -> c_int {
    let result = catch_unwind(AssertUnwindSafe(|| {
        if data.is_null() || len == 0 {
            return -1;
        }

        // SAFETY: The caller guarantees the slice validity and lifetime.
        let slice = unsafe { std::slice::from_raw_parts(data, len) };
        let sum: i32 = slice.iter().map(|&x| x as i32).sum();
        sum
    }));

    match result {
        Ok(value) => value,
        Err(_) => {
            // Log error, return error code
            eprintln!("Panic caught at FFI boundary");
            -1
        }
    }
}

// DO: Use Result-based API internally
/// # Safety
/// `path` must point to a live, readable, NUL-terminated C string.
// SAFETY: The final binary must define this exported symbol only once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn parse_config(path: *const c_char) -> c_int {
    let result = catch_unwind(AssertUnwindSafe(|| -> Result<(), Box<dyn std::error::Error>> {
        // SAFETY: The caller guarantees a valid NUL-terminated string.
        let path = unsafe { CStr::from_ptr(path) }.to_str()?;
        let _config = std::fs::read_to_string(path)?;
        Ok(())
    }));

    match result {
        Ok(Ok(())) => 0,
        Ok(Err(e)) => {
            eprintln!("Error: {}", e);
            -1
        }
        Err(_) => {
            eprintln!("Panic in parse_config");
            -2
        }
    }
}

// DO: For Rust-calling-Rust across C, use "C-unwind"
// SAFETY: The final binary must define this exported symbol only once.
#[unsafe(no_mangle)]
pub extern "C-unwind" fn rust_callback_can_unwind() {
    // This is OK to panic if called from Rust through C
    // The "C-unwind" ABI allows unwinding
    panic!("This is allowed");
}
```

## FFI Error Handling Pattern

```rust
// Define error codes
const SUCCESS: c_int = 0;
const ERR_NULL_PTR: c_int = -1;
const ERR_INVALID_UTF8: c_int = -2;
const ERR_IO: c_int = -3;
const ERR_PANIC: c_int = -99;

// Thread-local storage owns the NUL-terminated message.
thread_local! {
    static LAST_ERROR: std::cell::RefCell<Option<std::ffi::CString>> =
        const { std::cell::RefCell::new(None) };
}

fn set_error(msg: std::ffi::CString) {
    LAST_ERROR.with(|e| *e.borrow_mut() = Some(msg));
}

/// The returned pointer is valid only on this thread, until the next error is
/// stored or the thread exits. The caller must not free or mutate it.
// SAFETY: The final binary must define this exported symbol only once.
#[unsafe(no_mangle)]
pub extern "C" fn get_last_error() -> *const c_char {
    LAST_ERROR.with(|e| {
        e.borrow().as_ref().map_or(std::ptr::null(), |s| s.as_ptr())
    })
}
```

## Checklist

- [ ] Does my extern "C" function use catch_unwind?
- [ ] Am I avoiding unwrap/expect in FFI functions?
- [ ] Do I return error codes for error conditions?
- [ ] Have I considered using "C-unwind" for Rust-to-Rust through C?

## Related Rules

- `ffi-08`: Handle errors properly in FFI
- `safety-01`: Panic safety
