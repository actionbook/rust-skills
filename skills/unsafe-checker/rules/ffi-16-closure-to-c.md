---
id: ffi-16
original_id: P.UNS.FFI.16
level: P
impact: HIGH
---

# Separate Data and Code When Passing Rust Closures to C

## Summary

C callbacks are function pointers without captured state. To pass Rust closures to C, separate the function pointer from the closure data using a "trampoline" pattern.

## Rationale

- Rust closures can capture state (like lambdas)
- C function pointers are just addresses, no state
- Must pass state separately via `void*` user_data

## Bad Example

```rust
// DON'T: Try to pass closure directly
unsafe extern "C" {
    fn set_callback(cb: fn(i32) -> i32);  // Only works for non-capturing!
}

fn bad_closure() {
    let multiplier = 2;
    let closure = |x| x * multiplier;  // Captures multiplier

    // This won't compile - closure is not fn pointer
    // set_callback(closure);
}

// DON'T: Transmute closure to function pointer
fn bad_transmute() {
    let closure = |x: i32| x * 2;
    let fp: fn(i32) -> i32 = unsafe { std::mem::transmute(closure) };
    // UB: Closure may have non-zero size
}
```

## Good Example

This example assumes the C library calls the callback synchronously, on the calling thread,
without reentrancy, and never retains `user_data`. Its documentation must guarantee all of
those properties. A registration API that retains a callback needs a stable allocation,
unregistration that waits for in-flight calls, and an owner that frees it only afterward.

```rust
use std::ffi::{c_int, c_void};
use std::panic::{catch_unwind, AssertUnwindSafe};

unsafe extern "C" {
    fn visit_values(callback: unsafe extern "C" fn(c_int, *mut c_void), data: *mut c_void);
}

fn visit_with<F: FnMut(c_int)>(mut callback: F) {
    unsafe extern "C" fn trampoline<F: FnMut(c_int)>(value: c_int, data: *mut c_void) {
        // SAFETY: The C contract passes the live, exclusively borrowed F provided below.
        let callback = unsafe { &mut *data.cast::<F>() };
        if catch_unwind(AssertUnwindSafe(|| callback(value))).is_err() {
            // A panic must not unwind across a non-unwinding C ABI boundary.
            std::process::abort();
        }
    }

    let data = (&mut callback as *mut F).cast::<c_void>();
    // SAFETY: The C contract limits callback use to this call and excludes reentrancy.
    unsafe { visit_values(trampoline::<F>, data) };
}
```

For asynchronous callbacks, never rely on a movable stack address or on a destructor
always running: safe code can forget a guard. The allocation must stay valid if the guard
is forgotten. Ensure the C library cannot call after unregistration or race with teardown.

## Trampoline Pattern

```
Rust Closure: |x| x * captured_value
     |
     v
+-----------------+     +-----------------+
| trampoline fn   | --> | closure data    |
| (no captures)   |     | (captured_value)|
+-----------------+     +-----------------+
     |                         ^
     |    user_data ptr        |
     +-------------------------+

C sees: function pointer + void* user_data
```

## Checklist

- [ ] Does my closure capture any state?
- [ ] Am I using the trampoline pattern?
- [ ] Does the closure data live long enough?
- [ ] Am I unregistering before dropping the closure?

## Related Rules

- `ffi-03`: Implement Drop for resource wrappers
- `ffi-10`: Thread safety for callbacks
