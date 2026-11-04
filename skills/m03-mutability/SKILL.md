---
name: m03-mutability
description: "CRITICAL: Use for mutability issues. Triggers: E0596, E0499, E0502, cannot borrow as mutable, already borrowed as immutable, mut, &mut, interior mutability, Cell, RefCell, Mutex, RwLock, 可变性, 内部可变性, 借用冲突"
user-invocable: false
---

# Mutability

> **Layer 1: Language Mechanics**

## Core Question

**Why does this data need to change, and who can change it?**

Before adding interior mutability, understand:
- Is mutation essential or accidental complexity?
- Who should control mutation?
- Is the mutation pattern safe?

---

## Error → Design Question

| Error | Don't Just Say | Ask Instead |
|-------|----------------|-------------|
| E0596 | "Add mut" | Should this really be mutable? |
| E0499 | "Split borrows" | Is the data structure right? |
| E0502 | "Separate scopes" | Why do we need both borrows? |
| RefCell panic | "Use try_borrow" | Is runtime check appropriate? |

---

## Thinking Prompt

Before adding mutability:

1. **Is mutation necessary?**
   - Maybe transform → return new value
   - Maybe builder → construct immutably

2. **Who controls mutation?**
   - External caller → `&mut T`
   - Internal logic → interior mutability
   - Concurrent access → synchronized mutability

3. **What's the thread context?**
   - Single-thread → Cell/RefCell
   - Multi-thread → Mutex/RwLock/Atomic

---

## Trace Up ↑

When mutability conflicts persist:

```
E0499/E0502 (borrow conflicts)
    ↑ Ask: Is the data structure designed correctly?
    ↑ Check: m09-domain (should data be split?)
    ↑ Check: m07-concurrency (is async involved?)
```

| Persistent Error | Trace To | Question |
|-----------------|----------|----------|
| Repeated borrow conflicts | m09-domain | Should data be restructured? |
| RefCell in async | m07-concurrency | Is Send/Sync needed? |
| Mutex deadlocks | m07-concurrency | Is the lock design right? |

---

## Trace Down ↓

From design to implementation:

```
"Need mutable access from &self"
    ↓ Copy or replace/take whole values → Cell<T>
    ↓ Need dynamically checked references → RefCell<T>

"Need thread-safe mutation"
    ↓ Simple counters → AtomicXxx
    ↓ Complex data → Mutex<T> or RwLock<T>

"Need shared mutable state"
    ↓ Single-thread: Rc<RefCell<T>>
    ↓ Multi-thread: Arc<Mutex<T>>
```

---

## Borrow Rules

```
At any time, you can have EITHER:
├─ Multiple &T (immutable borrows)
└─ OR one &mut T (mutable borrow)

Never both simultaneously.
```

## Quick Reference

| Pattern | Thread-Safe | Runtime Cost | Use When |
|---------|-------------|--------------|----------|
| `&mut T` | N/A | Zero | Exclusive mutable access |
| `Cell<T>` | No | Zero | Whole-value mutation, no refs needed |
| `RefCell<T>` | No | Runtime check | Need runtime-checked references |
| `Mutex<T>` | Yes | Lock contention | Thread-safe mutation |
| `RwLock<T>` | Yes | Lock contention | Many readers, few writers |
| `Atomic*` | Yes | Minimal | Simple types (bool, usize) |

## Error Code Reference

For several mutable elements in one slice or `HashMap`, consider `get_disjoint_mut`.
Slice access returns an error for overlapping or out-of-bounds indices. `HashMap` returns
`None` for a missing key and panics for overlapping keys. Validate untrusted keys before
calling it; use unchecked access only with a proof of safety.

```rust
fn increment_pair(values: &mut [i32], left: usize, right: usize) -> bool {
    let Ok([first, second]) = values.get_disjoint_mut([left, right]) else {
        return false;
    };
    *first += 1;
    *second += 1;
    true
}
```

| Error | Cause | Quick Fix |
|-------|-------|-----------|
| E0596 | Borrowing immutable as mutable | Add `mut` or redesign |
| E0499 | Multiple mutable borrows | Restructure code flow |
| E0502 | &mut while & exists | Separate borrow scopes |

---

## Interior Mutability Decision

| Scenario | Choose |
|----------|--------|
| T: Copy, single-thread | `Cell<T>` |
| Non-Copy, replace or take whole value | `Cell<T>` |
| Need borrowed access, single-thread | `RefCell<T>` |
| Supported atomic primitive, multi-thread | `AtomicXxx` |
| Shared complex state, multi-thread | `Mutex<T>` or `RwLock<T>` |
| Read-heavy, multi-thread | `RwLock<T>` |
| Simple flags/counters | `AtomicBool`, `AtomicUsize` |

---

## Anti-Patterns

| Anti-Pattern | Why Bad | Better |
|--------------|---------|--------|
| RefCell everywhere | Runtime panics | Clear ownership design |
| Mutex for single-thread | Unnecessary overhead | RefCell |
| Ignore RefCell panic | Hard to debug | Handle or restructure |
| Lock inside hot loop | Performance killer | Batch operations |

---

## Related Skills

| When | See |
|------|-----|
| Smart pointer choice | m02-resource |
| Thread safety | m07-concurrency |
| Data structure design | m09-domain |
| Anti-patterns | m15-anti-pattern |
