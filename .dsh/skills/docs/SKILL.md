---
name: docs
description: "Fetch Rust API documentation from docs.rs for a crate or a specific item. Usage: /docs <crate> [item]"
disable-model-invocation: true
user-invocable: true
---

# /docs

Fetch API documentation for Rust crates from docs.rs.

The text after `/docs` in the user's message contains the crate name and an optional item. Parse both before doing anything else.

## Arguments

- `crate` (required): Crate name, for example `tokio` or `serde`.
- `item` (optional): A type, trait, function, macro, or module. It may be a bare name (`spawn`, `Serialize`) or a path (`sync::Mutex`, `tokio::spawn`).
- If the crate is missing, print the usage line and stop.

## Workflow

### No item: crate overview

1. Fetch `https://docs.rs/<crate>/latest/<crate>/`.
2. Fetch `https://docs.rs/<crate>/latest/<crate>/all.html` when the overview does not list items.
3. Summarize the crate description, modules, key structs/enums/traits, key functions/macros, and the feature flags that gate them.
4. Link to the full docs.rs page.

### With an item: item page

1. Split the item on `::`. The last segment is the item; the preceding segments are the module path.
2. Build candidate URLs and fetch them in order until one succeeds:
   - `https://docs.rs/<crate>/latest/<crate>/<module path>/fn.<item>.html`
   - `.../struct.<Item>.html`
   - `.../trait.<Item>.html`
   - `.../enum.<Item>.html`
   - `.../type.<Item>.html`
   - `.../constant.<item>.html`
   - `.../macro.<item>.html`
   - `.../union.<Item>.html`
   - `.../derive.<Item>.html`
   - `.../attr.<item>.html`
   - The same patterns without the module path, for root items.
3. Try both the supplied casing and the common casing (`spawn` vs `Spawn`, `serialize` vs `Serialize`).
4. If no candidate URL matches, search `all.html` for the item name and follow
   its relative link. Re-exported items are often only listed under their
   defining module, for example `tokio::spawn` lives at `task/fn.spawn.html`
   even though users write `tokio::spawn`.
5. Extract the signature, description, examples, feature gates, and source link.
6. If nothing matches, show the closest item names from `all.html` and ask the
   user to disambiguate rather than guessing.

## Output

````markdown
# <crate>::<item> API Documentation

## Signature
```rust
<signature>
```

## Description
<summary>

## Example
```rust
<example>
```

## Feature flags
- ...

## Source
- docs.rs: <link>
- source: <link>
````

For a crate overview, use the same structure with `Overview`, `Key Types`, `Key Functions`, and `Key Traits` sections.

## Failure handling

- HTTP 404 for the crate: the crate does not exist or has no docs.rs build; report it and suggest checking the crate name.
- Item not found: list close matches and ask the user to choose.
- Very large `all.html`: extract only the relevant sections; do not dump the page.
- Network unavailable: report the URL and stop; do not invent API details.
