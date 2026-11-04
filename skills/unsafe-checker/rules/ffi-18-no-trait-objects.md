---
id: ffi-18
original_id: P.UNS.FFI.18
level: P
impact: HIGH
---

# Avoid Passing Trait Objects to C Interfaces

## Summary

Trait objects (`dyn Trait`) have Rust-specific layout (fat pointers with vtable) that is not compatible with C.

## Rationale

- Trait objects are "fat pointers": data ptr + vtable ptr
- C expects thin pointers (single pointer)
- Vtable layout is not stable across Rust versions
- C cannot call Rust vtable methods

## Bad Example

```rust
// DON'T: Pass trait objects to C
trait Handler {
    fn handle(&self, data: i32);
}

unsafe extern "C" {
    // This won't work - dyn Handler is a fat pointer!
    fn set_handler(h: *const dyn Handler);
}

// DON'T: Store trait objects in FFI structs
#[repr(C)]
struct BadCallback {
    handler: *const dyn Handler,  // Not C-compatible!
}
```

## Safe interoperability pattern

Pass a C-compatible function pointer and an opaque data pointer. The trampoline must use
the same concrete type as the allocation, and the callback owner must keep that allocation
alive until all callbacks have stopped. See [ffi-16](ffi-16-closure-to-c.md) for a synchronous
example and the requirements for registrations that outlive a call.

A manually defined C-compatible vtable must pair each concrete handler type with its own
matching call and drop functions. Define ownership, threading, reentrancy, and unwinding in
the interface contract before exposing it. Never cast data allocated for one handler type
using a vtable specialized for another.

## Why Trait Objects Don't Work

```
Rust trait object (*const dyn Handler):
[data pointer][vtable pointer]  <- 16 bytes on 64-bit

C pointer (void*):
[pointer]  <- 8 bytes on 64-bit

The sizes don't match!
```

## Alternatives to Trait Objects

| Instead of | Use |
|------------|-----|
| `dyn Trait` | Function pointer + user_data |
| `Box<dyn Trait>` | Boxed concrete type + trampoline |
| `&dyn Trait` | C-compatible vtable struct |
| `Arc<dyn Trait>` | Reference counting wrapper |

## Checklist

- [ ] Am I passing trait objects across FFI?
- [ ] Can I use concrete types instead?
- [ ] Have I used the trampoline pattern for callbacks?
- [ ] If vtable is needed, is it C-compatible?

## Related Rules

- `ffi-16`: Closure to C with trampoline pattern
- `ffi-14`: Types should have stable layout
