// What the scripts that write demo_audio's solids models share (guns/*.model.mjs).
// `solids()` is a list of parts to push into, `both(fn)` pushing fn(1)'s and fn(-1)'s parts (a side and
// its mirror), and `mirror(part, nodes?)`, the part flipped in x, hung in `nodes[part.node]` when named:
// a loft or prism along x runs the other way, one along y or z has its x centre flipped, and a frame's
// `at` x and its turn about y are negated, so the solid is the mirror image of the first.
// `solids.write(model)` is the model's json as these solids files are laid out: each node, paint,
// part, light and empty on its own line, so the workshop's in-place edits keep working.
export function solids() {
  const parts = []
  const mirror = (part, nodes = {}) => {
    const p = structuredClone(part)
    p.node = nodes[p.node] ?? p.node
    const s = p.loft ?? p.prism
    if (s.axis === 'x') { s.from = -s.from; s.to = -s.to }
    else if (p.loft) { p.loft.a[0] = -p.loft.a[0]; if (p.loft.b) p.loft.b[0] = -p.loft.b[0] }
    else p.prism.at[0] = -p.prism.at[0]
    if (p.frame) {
      if (p.frame.at) p.frame.at[0] = -p.frame.at[0]
      if (p.frame.turn) p.frame.turn[1] = -p.frame.turn[1]
    }
    return p
  }
  const both = fn => { parts.push(...fn(1), ...fn(-1)) }
  return { parts, mirror, both }
}

const round = v => (typeof v === 'number' ? Math.round(v * 10000) / 10000 : v)
const line = v => JSON.stringify(v, (_, x) => round(x))

solids.write = model => {
  const out = []
  const keys = Object.keys(model)
  keys.forEach((k, i) => {
    const v = model[k]
    const comma = i < keys.length - 1 ? ',' : ''
    if (Array.isArray(v) && v.length && typeof v[0] === 'object') {
      out.push(`  ${JSON.stringify(k)}: [`, v.map(x => `    ${line(x)}`).join(',\n'), `  ]${comma}`)
    } else if (v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).every(x => x && typeof x === 'object')) {
      const e = Object.entries(v)
      out.push(`  ${JSON.stringify(k)}: {`, e.map(([n, x]) => `    ${JSON.stringify(n)}: ${line(x)}`).join(',\n'), `  }${comma}`)
    } else out.push(`  ${JSON.stringify(k)}: ${line(v)}${comma}`)
  })
  return `{\n${out.join('\n')}\n}\n`
}
