---
id: safety-07
original_id: P.UNS.SAS.07
level: P
impact: MEDIUM
---

# Provide Unsafe Counterparts Only When Justified

## Summary

Provide a safe API by default. Add an unchecked counterpart only when benchmarks show a useful benefit and its safety contract is necessary and enforceable.

## Rationale

Users who need maximum performance can opt into unsafe, while others get safety by default. This follows the "safe by default, unsafe opt-in" principle.

## Bad Example

```rust
// DON'T: Only provide unsafe version
impl<T> MySlice<T> {
    /// Gets an element by index.
    ///
    /// # Safety
    /// Index must be in bounds.
    pub unsafe fn get(&self, index: usize) -> &T {
        // SAFETY: Caller guarantees index is in bounds and storage remains valid.
        unsafe { &*self.ptr.add(index) }
    }
}

// A checked version alone is appropriate unless measurements justify an unchecked API
impl<T> MySlice<T> {
    pub fn get(&self, index: usize) -> Option<&T> {
        if index < self.len {
            Some(unsafe { &*self.ptr.add(index) })
        } else {
            None
        }
    }
    // Add an unchecked method only if measured workloads justify it.
}
```

## Good Example

```rust
// DO: Provide both versions
impl<T> MySlice<T> {
    /// Gets an element by index, returning `None` if out of bounds.
    #[inline]
    pub fn get(&self, index: usize) -> Option<&T> {
        if index < self.len {
            // SAFETY: We just verified index < len
            Some(unsafe { self.get_unchecked(index) })
        } else {
            None
        }
    }

    /// Gets an element by index without bounds checking.
    ///
    /// # Safety
    ///
    /// Calling this method with an out-of-bounds index is undefined behavior.
    #[inline]
    pub unsafe fn get_unchecked(&self, index: usize) -> &T {
        debug_assert!(index < self.len, "index out of bounds");
        // SAFETY: Caller guarantees index is in bounds and storage remains valid.
        unsafe { &*self.ptr.add(index) }
    }

    /// Gets an element, panicking if out of bounds.
    #[inline]
    pub fn get_or_panic(&self, index: usize) -> &T {
        assert!(index < self.len, "index {} out of bounds for len {}", index, self.len);
        // SAFETY: We just asserted index < len
        unsafe { self.get_unchecked(index) }
    }
}
```

## Standard Library Patterns

| Safe Method | Unsafe Counterpart |
|-------------|-------------------|
| `slice.get(i)` | `slice.get_unchecked(i)` |
| `str.get(range)` | `str.get_unchecked(range)` |
| `vec.pop()` | `vec.set_len()` + `ptr::read` |
| `String::from_utf8()` | `String::from_utf8_unchecked()` |

## Naming Conventions

- Safe: `method_name()`
- Unsafe: `method_name_unchecked()`
- Or: `get()` vs `get_unchecked()`

## Checklist

- [ ] Do measurements justify an additional unchecked API?
- [ ] Does my unsafe method have a safe alternative for normal use?
- [ ] Are both methods documented with their trade-offs?
- [ ] Does the unsafe version include debug assertions?

## Related Rules

- `general-02`: Don't blindly use unsafe for performance
- `safety-09`: Add SAFETY comments
