import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-agent'
import type { Agent, PreStepDecision } from '@deepseek-ai/dsh-agent'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export const name = 'keep-reminder'

export const inject: string[] = []

/** 注入模式与文件位置。 */
export interface Config {
  /** session = 每次会话一次；turn = 每轮第一步一次；request = 每次请求都注入 */
  mode?: 'session' | 'turn' | 'request'
  /** .keep-reminder 文件路径；相对路径基于 agent 工作目录，默认 '.keep-reminder' */
  file?: string
}

export const Config: z<Config> = z.object({
  mode: z.union(['session', 'turn', 'request']).default('turn'),
  file: z.string().default('.keep-reminder'),
})

export function apply(ctx: Context, config: Config): void {
  const mode = config.mode ?? 'turn'
  const file = config.file ?? '.keep-reminder'

  ctx.on('agent/pre-step', async ({ agent, turn, step, signal }, next): Promise<PreStepDecision> => {
    const decision = await next()
    if (decision.kind === 'reject' || signal.aborted) return decision

    const due = mode === 'request'
      || (mode === 'turn' && step === 1)
      || (mode === 'session' && turn === 1 && step === 1)
    if (!due) return decision

    const text = await readReminder(agent, file)
    if (text === undefined) return decision

    return {
      kind: 'enter',
      messages: [
        ...decision.messages,
        createUserMessage({
          content: [{ type: 'text', text: `<system-reminder>\n${text}\n</system-reminder>` }],
          source: { kind: 'plugin', plugin: name, form: 'snapshot', sections: [{ name, text }] },
        }),
      ],
    }
  }, { prepend: true })
}

/** 读取 .keep-reminder；不存在或为空时返回 undefined（静默跳过）。 */
async function readReminder(agent: Agent, file: string): Promise<string | undefined> {
  const cwd = agent.session.header.cwd
  if (cwd === undefined) return undefined
  const path = resolve(cwd, file)
  try {
    const text = await readFile(path, 'utf8')
    const trimmed = text.trim()
    return trimmed.length > 0 ? trimmed : undefined
  } catch {
    return undefined
  }
}