# keep-reminder

**English** | [简体中文](README.zh.md)

![npm version](https://img.shields.io/npm/v/keep-reminder)
![license](https://img.shields.io/npm/l/keep-reminder)

Inject a user-defined `.keep-reminder` file into the model context as a `<system-reminder>` user message.

## Quick Start

1. Install the plugin (choose one):

```sh
# A. Official command (backs onto pnpm; install pnpm first)
npm i -g pnpm
dsh plugin --profile web add keep-reminder

# B. Install with npm directly into the profile directory
cd ~/.dsh/profiles/web    # Windows: C:\Users\<you>\.dsh\profiles\web
npm install keep-reminder --save
```

2. Mount it in the profile `cordis.patch.yml`:

```yaml
- id: keep-reminder
  name: 'keep-reminder'
  config:
    mode: turn              # session | turn | request
    file: '.keep-reminder'  # optional
```

3. Create a `.keep-reminder` file in the **session workspace root** (see [`.keep-reminder.example`](.keep-reminder.example)) with the content to remember.
4. Restart `dsh web` and start a new session.

### What is the "session workspace root"?

It is the session's working directory (`cwd`); the plugin looks for `.keep-reminder` only there and does not search upward.

- **Web GUI**: the folder you pick when creating the session. If you pick `D:\ui-workspace\my-project`, put it at `D:\ui-workspace\my-project\.keep-reminder`.
- **CLI / headless**: the current directory where you run `dsh` (`process.cwd()`).

## Configuration

| Key | Default | Description |
|---|---|---|
| `mode` | `turn` | Injection frequency: `session` / `turn` / `request` |
| `file` | `.keep-reminder` | File path; relative to the session working directory, or absolute |

### Three modes

| mode | When injected |
|---|---|
| `session` | Once per session (first step of the first turn) |
| `turn` | Once per turn (first step) |
| `request` | Every model request |

## Comparison

`AGENTS.md`, direct user prompts, and this plugin all convey information to the model, but with different purposes:

| Dimension | AGENTS.md | User prompt | keep-reminder |
|---|---|---|---|
| Channel | `<system-reminder>` user message | ordinary user message | `<system-reminder>` user message |
| Scope | global (`~/.dsh`) + project directories | one message | one file in the workspace root |
| Frequency | once per session, updated on change | one-shot | `session`/`turn`/`request` |
| Priority | guidance (below system prompt and direct user instructions) | direct user instruction (highest) | guidance (same as AGENTS.md) |
| Maintenance | edit a file | write each time | edit a file |
| Live update | yes | — | yes (re-read per injection) |
| Use case | team / project conventions | temporary, one-off | personal "must-remember" reminders |

## File-state handling

How the plugin treats the `.keep-reminder` file in each state:

| State | Behavior |
|---|---|
| File missing | Silently skipped — no injection, no error |
| File exists but empty/whitespace | Silently skipped — no injection |
| File has content | Injected as `<system-reminder>` per `mode` |
| Content modified | New content injected next turn/request (re-read live) |
| File deleted | Injection stops from the next turn, silently |
| File restored | Injection resumes |

## Replacing deepseek-harness-zh-cn

`keep-reminder` is a general capability; `deepseek-harness-zh-cn` is one concrete use of it — put the "Chinese-first" rules into a `.keep-reminder` file to achieve the same effect (see [`.keep-reminder.example`](.keep-reminder.example)). The difference:

- `deepseek-harness-zh-cn`: works out of the box, rules hard-coded;
- `keep-reminder`: fully customizable — change the file to change the rules (not only language).

## Development

### Build

```sh
npm install
npm run build      # compiles src → lib/index.js
```

### Mount locally

During development you can mount the compiled output directly via a `file://` URL, with no package install:

```yaml
- id: keep-reminder
  name: 'file:///D:/ui-workspace/keep-reminder/lib/index.js'
  config:
    mode: turn
```

Adjust the URL to your checkout path.

### Restart

```sh
npx @deepseek-ai/dsh web
```

### Verify

```sh
# Windows
npx @deepseek-ai/dsh web --dump-config | findstr /C:"keep-reminder"

# Linux / macOS
npx @deepseek-ai/dsh web --dump-config | grep keep-reminder
```

Seeing the `keep-reminder` row means the plugin is mounted.

## License

[Apache-2.0](LICENSE)