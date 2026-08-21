# keep-reminder

[English](README.md) | **简体中文**

![npm version](https://img.shields.io/npm/v/keep-reminder)
![license](https://img.shields.io/npm/l/keep-reminder)

把 `.keep-reminder` 文件里「绝对重要」的自定义内容，以 `<system-reminder>` 用户消息注入模型上下文。

## 快速开始

1. 安装插件（二选一）：

```sh
# A. 官方命令（底层走 pnpm，需先安装 pnpm）
npm i -g pnpm
dsh plugin --profile web add keep-reminder

# B. 直接用 npm 装进 profile 目录
cd ~/.dsh/profiles/web    # Windows: C:\Users\<你>\.dsh\profiles\web
npm install keep-reminder --save
```

2. **在 profile 的 `cordis.patch.yml` 里挂载。**要*加载*插件必须用 `insert:`，而不是直接写 `- id:`。
   只写 `- id: keep-reminder` 会被当成对已加载条的覆盖，会报 `entry "keep-reminder" not found` 而被跳过（这是它不生效的常见原因）。
   正确写法：

```yaml
- insert:
    - id: keep-reminder
      name: 'keep-reminder'
      config:
        mode: turn              # session | turn | request
        file: '.keep-reminder'  # 可省略
```

3. 在**会话工作区根目录**建 `.keep-reminder` 文件（示例见 [`.keep-reminder.example`](.keep-reminder.example)），写入要提醒的内容。
4. 重启 `dsh web`，新建会话即可。

### 「会话工作区根目录」是哪个目录？

就是**会话的工作目录（`cwd`）**，插件只在这个目录下找 `.keep-reminder`，不会向上逐级查找。

- **Web GUI**：新建会话时选择的那个文件夹。例如你选的是 `D:\ui-workspace\my-project`，就放 `D:\ui-workspace\my-project\.keep-reminder`。
- **CLI / headless**：执行 `dsh` 命令时的当前目录（`process.cwd()`）。

## 配置

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `mode` | `turn` | 注入频率：`session` / `turn` / `request` |
| `file` | `.keep-reminder` | 文件路径；相对路径基于会话工作目录，也支持绝对路径 |

### 三种模式

| mode | 注入时机 |
|---|---|
| `session` | 每个会话一次（首个 turn 第一步） |
| `turn` | 每轮第一步一次 |
| `request` | 每次模型请求都注入 |

## 方案对比

`AGENTS.md`、用户提示词与本插件都能向模型传达信息，但定位不同：

| 维度 | AGENTS.md | 用户提示词 | keep-reminder |
|---|---|---|---|
| 注入通道 | `<system-reminder>` 用户消息 | 普通用户消息 | `<system-reminder>` 用户消息 |
| 作用范围 | 全局（`~/.dsh`）+ 项目各级目录 | 单条消息 | 工作区根目录单个文件 |
| 注入频率 | 会话开始一次，变更时更新 | 一次性 | `session`/`turn`/`request` 可选 |
| 优先级 | 指导级（低于系统提示词与直接用户指令） | 直接用户指令（最高） | 指导级（同 AGENTS.md） |
| 内容维护 | 编辑文件 | 每次手写 | 编辑文件 |
| 实时生效 | 是 | — | 是（每轮/每次请求重读） |
| 适合场景 | 团队 / 项目规约 | 临时、一次性指令 | 个人「绝对重要」的持续提醒 |

## 文件状态处理

插件对 `.keep-reminder` 文件的不同状态处理如下：

| 情况 | 行为 |
|---|---|
| 文件不存在 | 静默跳过，不注入、不报错 |
| 文件存在但为空（或全空白） | 静默跳过，不注入 |
| 文件存在且有内容 | 按 `mode` 注入 `<system-reminder>` |
| 内容被修改 | 下一轮 / 下一次请求注入新内容（实时重读） |
| 文件被删除 | 下一轮起停止注入，静默跳过 |
| 文件被恢复 | 恢复注入 |

## 替代 deepseek-harness-zh-cn

`keep-reminder` 是通用能力，`deepseek-harness-zh-cn` 是它的一种具体用法——把「中文优先」规则写进 `.keep-reminder` 即可实现同样效果（见 [`.keep-reminder.example`](.keep-reminder.example)）。区别：

- `deepseek-harness-zh-cn`：开箱即用，规则写死在插件里；
- `keep-reminder`：内容可自定义，想改成别的规则（不只语言）只需改文件。

## 开发

### 构建

```sh
npm install
npm run build      # 编译 src → lib/index.js
```

### 本地挂载

开发期可直接用 `file://` URL 挂载编译产物，无需安装依赖。同样要用 `insert:` 形式：

```yaml
- insert:
    - id: keep-reminder
      name: 'file:///D:/ui-workspace/keep-reminder/lib/index.js'
      config:
        mode: turn
```

把 URL 改成你的实际路径。

### 重启

```sh
npx @deepseek-ai/dsh web
```

### 验证

```sh
# Windows
npx @deepseek-ai/dsh web --dump-config | findstr /C:"keep-reminder"

# Linux / macOS
npx @deepseek-ai/dsh web --dump-config | grep keep-reminder
```

看到 `keep-reminder` 行且无 `not found` 警告，即表示挂载成功。

## 协议

[Apache-2.0](LICENSE)
