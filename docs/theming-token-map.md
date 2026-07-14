# Theming — color → token migration map (Phase B)

The theming system requires every color to come from a **semantic token** so it
re-themes correctly. This doc is the canonical mapping used by the codemod
(`scripts/theme-codemod.mjs`) and by hand/agent migration. Tokens are defined in
`src/styles.css`; utilities exist for each (e.g. `text-foreground-muted`,
`bg-surface`, `bg-brand`, `bg-success-subtle`).

## Golden rules

1. **LMS Default must look the same.** Every mapping below was chosen so the
   token's `lms-default` value equals (or is imperceptibly close to) the
   original color. If a swap would visibly change Default, don't do it — flag it.
2. **Pairs, not singles.** A colored fill implies its `-foreground` on top. When
   you set `bg-brand`, text on it should be `text-brand-foreground`; `bg-*-subtle`
   pairs with `text-*-subtle-foreground`.
3. **When unsure, leave it and note it.** A wrong token is worse than an
   un-migrated color. Decorative gradients, illustrations, brand logos, and
   third-party embeds (LiveKit, Zoom, charts) are out of scope.

## Deterministic mappings (safe — done by codemod)

### Neutral text → foreground scale

| From                                                                                                                                    | To                       |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `text-gray-900/800/700`, `text-slate-900/800`, `text-[#111827]`, `text-[#111928]`, `text-[#1F2A37]`, `text-[#1F2937]`, `text-[#374151]` | `text-foreground`        |
| `text-gray-600/500`, `text-slate-600/500`, `text-[#4B5563]`, `text-[#6B7280]`                                                           | `text-foreground-muted`  |
| `text-gray-400/300`, `text-slate-400`, `text-[#9CA3AF]`, `text-[#D1D5DB]`                                                               | `text-foreground-subtle` |

### Borders → border scale

| From                                                                                                  | To                     |
| ----------------------------------------------------------------------------------------------------- | ---------------------- |
| `border-gray-200/100`, `border-slate-200`, `border-[#E5E7EB]`, `border-[#EDEAE8]`, `border-[#E0D9D3]` | `border-border`        |
| `border-gray-300`, `border-[#D1D5DB]`                                                                 | `border-border-strong` |

### Surfaces → bg scale

| From                                                                | To                 |
| ------------------------------------------------------------------- | ------------------ |
| `bg-white`                                                          | `bg-surface`       |
| `bg-gray-50/100`, `bg-slate-50/100`, `bg-[#F9FAFB]`, `bg-[#F3F4F6]` | `bg-surface-muted` |
| `bg-gray-200`, `bg-[#E5E7EB]`                                       | `bg-muted`         |

### Masai brand purple → brand

Family: `#6962AC`, `#60599D`, `#5B52A3`, `#585196`, `#564E97`, `#5C56A0`,
`#554F8B`, `#5B478B`, `#4B44A8`, `#3D379A`, `#6C63B8`, `#6E66B8`.

| From                                               | To                           |
| -------------------------------------------------- | ---------------------------- |
| `text-[#6962AC]` (& family)                        | `text-brand`                 |
| `bg-[#6962AC]` (& family)                          | `bg-brand`                   |
| `border-[#6962AC]`, `ring-[#6962AC]` (& family)    | `border-brand`, `ring-brand` |
| `bg-[#F0EFF7]`, `bg-[#F7F6FF]` (very light purple) | `bg-brand-subtle`            |

### Common status

| From                                                                       | To             |
| -------------------------------------------------------------------------- | -------------- |
| `text-red-700/600`, `text-[#DC2626]`, `text-[#B71C2B]`, `text-[#DC3545]`   | `text-danger`  |
| `bg-[#F05252]` (notif badge), `bg-red-500`, `bg-[#EF4444]`, `bg-[#ED0331]` | `bg-danger`    |
| `text-green-700/600`, `text-[#0d930f]`                                     | `text-success` |
| `bg-green-*`, `bg-[#3B9D6E]`, `bg-[#16A34A]`                               | `bg-success`   |

## Judgment mappings (agents / by hand — NOT the codemod)

- **`text-white` / `text-black`**: usually the `-foreground` of the fill it sits
  on. `text-white` on `bg-brand` → `text-brand-foreground`; on orange →
  `text-accent-warm-foreground`; on a solid status fill → that status
  `-foreground`. Only convert when you can see the parent fill.
- **Masaiverse orange** `#f25c04` / `masaiverse-orange` / `masaiverse-orange-dark`:
  → `accent-warm` / `bg-accent-warm` / `text-accent-warm-foreground`. Hover
  `masaiverse-orange-dark` → `accent-warm-hover`.
- **Indigo accent** `#4F6BED`, `#4F46E5`, `text-indigo-*`, `bg-indigo-50`,
  `bg-[#EEF2FF]`/`#EEF0FE`: this is a distinct accent from the purple brand.
  Prefer `brand` if it reads as the primary accent in context; otherwise `info`.
  Decide per feature.
- **Warning/amber, teal, blue info** one-offs: → `warning` / `info` pairs when
  they signal status; leave if purely decorative.
- **Gradients** (`from-* via-* to-*`), **charts** (`chart-1..5` exist as tokens),
  **dark hardcoded bgs** (`#1c1c1c`, `#242C3C`): judgment, often leave.

## Verify after any batch

```
npx tsc --noEmit        # 0 errors
npx eslint <files>      # clean
npm run check:contrast  # all themes pass
```
