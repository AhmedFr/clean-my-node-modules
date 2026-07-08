/** Parse `lsof -iTCP -sTCP:LISTEN -P -F pn` output into pid -> listening port. */
export function parseLsofPorts(output: string): Map<number, number> {
  const ports = new Map<number, number>()
  let pid: number | null = null
  for (const line of output.split('\n')) {
    const tag = line[0]
    const rest = line.slice(1)
    if (tag === 'p') {
      pid = Number(rest)
    } else if (tag === 'n' && pid !== null) {
      const port = Number(rest.slice(rest.lastIndexOf(':') + 1))
      if (Number.isFinite(port) && !ports.has(pid)) ports.set(pid, port)
    }
  }
  return ports
}
