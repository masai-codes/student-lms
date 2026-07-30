import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const configPath = resolve(import.meta.dirname, 'amazon-cloudwatch-agent.json')

describe('amazon-cloudwatch-agent.json', () => {
  it('parses as valid JSON with expected metrics and log shipping', () => {
    const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
      metrics: {
        namespace: string
        metrics_collected: {
          mem: { measurement: string[] }
          disk: { measurement: string[]; resources: string[] }
        }
      }
      logs: {
        logs_collected: {
          files: {
            collect_list: Array<{
              file_path: string
              log_group_name: string
              log_stream_name: string
            }>
          }
        }
      }
    }

    expect(config.metrics.namespace).toBe('StudentLMS/EC2')
    expect(config.metrics.metrics_collected.mem.measurement).toContain(
      'mem_used_percent',
    )
    expect(config.metrics.metrics_collected.disk.resources).toContain('/')

    const logPaths = config.logs.logs_collected.files.collect_list.map(
      (entry) => entry.file_path,
    )
    expect(logPaths).toEqual([
      '/home/ubuntu/logs/app-out.log',
      '/home/ubuntu/logs/app-error.log',
    ])
    expect(
      config.logs.logs_collected.files.collect_list.every(
        (entry) => entry.log_group_name === '/student-lms/production/app',
      ),
    ).toBe(true)
  })
})
