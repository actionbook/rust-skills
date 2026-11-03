---
id: mem-03
original_id: P.UNS.MEM.03
level: P
impact: CRITICAL
---

# Do Not Let String/Vec Auto-Drop Other Process's Memory

## Summary

Do not create an owning Rust collection from foreign memory unless every allocator, layout, initialization, and ownership requirement of the relevant raw-parts API is proven.

## Rationale

The default `String`, `Vec`, and `Box` types deallocate through the global allocator. A foreign allocation is not automatically compatible: allocator identity alone is insufficient without the exact layout, initialization, and ownership guarantees.

## Bad Example

```rust
// DON'T: Create String from C-allocated memory
unsafe extern "C" {
    fn c_get_string() -> *mut std::os::raw::c_char;
}

fn bad_string() -> String {
    unsafe {
        let ptr = c_get_string();
        // BAD: String will try to free with Rust allocator
        String::from_raw_parts(ptr as *mut u8, len, cap)
    }
}

// DON'T: Create Vec from foreign memory
fn bad_vec(ptr: *mut u8, len: usize) -> Vec<u8> {
    // BAD: Vec will free this memory incorrectly
    unsafe { Vec::from_raw_parts(ptr, len, len) }
}

// DON'T: Wrap shared memory in Box
fn bad_box(shared_ptr: *mut Data) -> Box<Data> {
    // BAD: Box will try to deallocate shared memory!
    unsafe { Box::from_raw(shared_ptr) }
}
```

## Borrowing foreign memory

A null check alone cannot prove that a pointer is live, initialized, or readable. The
foreign API must supply those guarantees. Tie a view to the actual owner or guard; do not
invent a `'static` lifetime. Construct a safe wrapper only when its constructor and owner
can enforce all of the requirements.

```rust
/// Borrow bytes from an allocation managed elsewhere.
///
/// # Safety
/// `ptr` must be non-null and valid for `len` initialized bytes in one live
/// allocation for the entire returned lifetime. The bytes must not be mutated
/// during that lifetime. `len` must not exceed `isize::MAX`.
unsafe fn foreign_bytes<'a>(ptr: *const u8, len: usize) -> &'a [u8] {
    // SAFETY: The caller guarantees the allocation, lifetime and aliasing requirements.
    unsafe { std::slice::from_raw_parts(ptr, len) }
}
```

For foreign strings, copy into a Rust-owned `String` only after the foreign API guarantees
that the pointer is a readable, NUL-terminated string. Release the original with the
foreign API's matching deallocator, after the copy. Wrap a foreign resource in an owning
RAII type only when its constructor enforces its lifetime and deallocation contract.

## Memory Allocation Compatibility

| Allocator | Can use Rust Vec/String/Box? |
|-----------|------------------------------|
| Rust global allocator | Only when the raw-parts API's layout, initialization, and ownership requirements also hold |
| C malloc | Do not assume compatibility; use the documented matching deallocator |
| C++ new | No - use wrapper with C++ delete |
| Custom allocator | No - use allocator_api |
| mmap/shared memory | No - use munmap |
| Stack/static | No - never "free" |

## Checklist

- [ ] Who allocated this memory?
- [ ] Is it from Rust's global allocator?
- [ ] If not, do I have a custom Drop that frees correctly?
- [ ] Am I copying data or taking ownership?

## Related Rules

- `mem-02`: Don't modify other process's memory
- `ffi-03`: Implement Drop for wrapped C pointers
- `ffi-07`: Don't implement Drop for types passed to external code
