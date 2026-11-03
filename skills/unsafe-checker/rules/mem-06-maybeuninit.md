---
id: mem-06
original_id: G.UNS.MEM.01
level: G
impact: HIGH
clippy: uninit_assumed_init, uninit_vec
---

# Use MaybeUninit<T> for Uninitialized Memory

## Summary

Use `MaybeUninit<T>` instead of `mem::uninitialized()` or `mem::zeroed()` when working with uninitialized memory.

## Rationale

- `mem::uninitialized()` is deprecated and unsound
- `mem::zeroed()` is UB for types where zero is invalid (references or NonZero)
- `MaybeUninit<T>` clearly marks memory as potentially uninitialized
- Compiler can optimize based on initialization state

## Bad Example

```rust
// DON'T: Use deprecated uninitialized
fn bad_uninit<T>() -> T {
    unsafe { std::mem::uninitialized() }  // Deprecated, UB
}

// DON'T: Use zeroed for types where zero is invalid
fn bad_zeroed() -> &'static str {
    unsafe { std::mem::zeroed() }  // UB: null reference
}

// Zero is a valid bool representation (false); not every byte pattern is valid.

// DON'T: Transmute to "initialize"
fn bad_transmute() -> [String; 10] {
    unsafe { std::mem::transmute([0u8; std::mem::size_of::<[String; 10]>()]) }
}

// DON'T: Set Vec length without initializing
fn bad_vec() -> Vec<String> {
    let mut v = Vec::with_capacity(10);
    unsafe { v.set_len(10); }  // Elements are uninitialized!
    v
}
```

## Good Example

Prefer safe initialization when possible. `array::from_fn` also drops values already
constructed if the initializer panics.

```rust
use std::mem::MaybeUninit;

fn initialized_array() -> [String; 10] {
    std::array::from_fn(|i| format!("item {i}"))
}

fn uninitialized_array<const N: usize>() -> [MaybeUninit<u8>; N] {
    [const { MaybeUninit::uninit() }; N]
}

fn initialized_buffer() -> Vec<u8> {
    vec![0; 1024]
}
```

When manual initialization is necessary, track initialized elements on every panic and error
path. Call `assume_init` only after proving the value is fully initialized and valid for `T`.
`MaybeUninit::zeroed()` does not make an invalid all-zero bit pattern valid.

## MaybeUninit API

```rust
use std::mem::MaybeUninit;

// Creation
let uninit: MaybeUninit<T> = MaybeUninit::uninit();
let zeroed: MaybeUninit<T> = MaybeUninit::zeroed();
let init: MaybeUninit<T> = MaybeUninit::new(value);

// Writing
uninit.write(value);  // Returns &mut T

// Reading (unsafe)
let value: T = unsafe { uninit.assume_init() };
let ref_: &T = unsafe { uninit.assume_init_ref() };
let mut_: &mut T = unsafe { uninit.assume_init_mut() };

// Pointer access
let ptr: *const T = uninit.as_ptr();
let mut_ptr: *mut T = uninit.as_mut_ptr();
```

## Checklist

- [ ] Am I using `mem::uninitialized()`? → Replace with `MaybeUninit`
- [ ] Am I using `mem::zeroed()` for non-POD types? → Use `MaybeUninit`
- [ ] Am I setting Vec length without initialization? → Use proper initialization
- [ ] Have I initialized all MaybeUninit before assume_init?

## Related Rules

- `safety-03`: Don't expose uninitialized memory in APIs
- `safety-01`: Panic safety with partial initialization
