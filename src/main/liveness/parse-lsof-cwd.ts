interface Proc {
  pid: number
  command: string
  cwd: string
}

/** Parse `lsof -a -d cwd -F pcn` output into one record per process with a cwd. */
export function parseLsofCwd(output: string): Proc[] {
  const procs: Proc[] = []
  let pid: number | null = null
  let command = ''
  let cwd: string | null = null
  const flush = (): void => {
    if (pid !== null && cwd !== null) procs.push({ pid, command, cwd })
    cwd = null
  }
  for (const line of output.split('\n')) {
    const tag = line[0]
    const rest = line.slice(1)
    if (tag === 'p') {
      flush()
      pid = Number(rest)
      command = ''
    } else if (tag === 'c') {
      command = rest
    } else if (tag === 'n') {
      cwd = rest
    }
  }
  flush()
  return procs
}
