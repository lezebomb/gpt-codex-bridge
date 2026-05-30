const STORAGE = {
  baseUrl: "ccb_base_url",
  code: "ccb_pairing_code",
  language: "ccb_language",
  sidebar: "ccb_sidebar_collapsed",
  projectId: "ccb_project_id",
  publicBaseUrl: "ccb_public_base_url"
};

const NAV = [
  ["setup", "S", "nav.setup"],
  ["project", "P", "nav.project"],
  ["tasks", "T", "nav.tasks"],
  ["approvals", "A", "nav.approvals"],
  ["logs", "L", "nav.logs"],
  ["mcp", "M", "nav.mcp"],
  ["advanced", "G", "nav.advanced"]
];

const TOOL_ZH = {
  get_bridge_status: "检查 Bridge 是否在线、执行模式、权限模式、项目数量、最近错误和托管能力摘要。",
  get_setup_guide: "返回 Windows 与 ChatGPT 自定义 MCP 的简明连接步骤。",
  list_projects: "列出已经加入白名单的本地项目。",
  browse_folders: "安全浏览本地文件夹，用文件管理器方式选择项目，只返回文件夹。",
  select_project: "把选中的本地文件夹注册为 Bridge 项目白名单根目录。",
  inspect_project: "检查项目的依赖、说明文档、Git 状态、目录摘要和可能技术栈。",
  read_file: "读取已注册项目内的文件，阻止绝对路径和路径穿越。",
  create_context_pack: "为 ChatGPT 网页端生成包含文件、目录树、Git 状态和差异的上下文包。",
  propose_web_patch: "创建小范围网页补丁草稿；不会直接写文件，除非权限模式和审批允许。",
  get_patch_diff: "返回补丁的可读统一差异。",
  request_apply_patch: "请求应用补丁；人工审查会转入控制台，自动审查只处理低风险补丁，完整访问可直接应用。",
  request_revert_patch: "请求从备份回滚补丁；除完整访问外，其余模式会要求控制台审批。",
  create_codex_job: "创建 Codex 演练、命令行或应用服务任务；只有无需审批时才会立即运行。",
  get_codex_job: "读取 Codex 任务状态、输出、结果和事件。",
  get_latest_logs: "读取最近 Bridge 日志，支持级别、requestId 和数量过滤。",
  analyze_error_log: "分析最新或指定错误日志，返回可能原因和下一步动作。",
  create_repair_proposal: "根据错误创建修复方案；不会自动执行，必须等待用户审批。",
  create_ui_screenshot_job: "创建本地 UI 截图审查任务；开发服务未启动时会返回启动建议。",
  get_ui_screenshot_result: "按任务编号读取 UI 截图审查结果。",
  create_cross_review: "开启最多 1 到 3 轮的 ChatGPT 网页端与 Codex 有界交叉审查。",
  add_cross_review_round: "添加一轮审查，只包含阻塞问题、具体改进、证据和建议决策。",
  finalize_cross_review: "结束交叉审查，并选择采用网页补丁、采用 Codex、混合或人工判断。"
};

const PLUGIN_ZH = {
  filesystem: {
    name: "文件系统",
    description: "限定在已注册项目目录内浏览、读取、生成上下文包和创建网页补丁。写文件必须遵守权限模式。"
  },
  git: {
    name: "Git",
    description: "Git 状态和差异读取属于低风险；分支、提交和 PR 辅助操作仍受权限模式保护。"
  },
  codex: {
    name: "Codex 执行器",
    description: "创建演练、命令行或应用服务任务。命令行和应用服务模式使用本机当前 Codex 登录状态。"
  },
  playwright: {
    name: "浏览器截图",
    description: "用于 UI 截图和浏览器冒烟测试。Bridge 创建任务，本地执行器负责浏览器操作。"
  },
  context7: {
    name: "库文档查询",
    description: "计划中的受管插件，用于查询库文档；当前不会自动启用。"
  },
  fetch: {
    name: "网页读取",
    description: "计划中的网页文档读取能力；联网访问必须显式开启。"
  },
  github: {
    name: "GitHub",
    description: "在 gh 已安装并登录时辅助创建 PR；不会静默执行写入操作。"
  },
  memory: {
    name: "项目记忆",
    description: "计划中的项目长期记忆能力，当前尚未实现。"
  },
  "sequential-thinking": {
    name: "顺序规划",
    description: "计划中的复杂规划辅助能力，当前尚未实现。"
  }
};

const I18N = {
  zh: {
    "brand.title": "本地桥接器",
    "brand.subtitle": "ChatGPT 主控 GPT 的本地能力层",
    "nav.setup": "连接向导",
    "nav.project": "项目",
    "nav.tasks": "任务",
    "nav.approvals": "审批",
    "nav.logs": "日志",
    "nav.mcp": "能力中心",
    "nav.advanced": "高级",
    "top.title": "ChatGPT-Codex 本地桥接器",
    "top.subtitle": "这里不是主界面。日常对话在 ChatGPT 网页端主控 GPT 中进行，这里负责本地连接、项目选择、审批和日志。",
    "status.connected": "已连接",
    "status.checking": "检查中",
    "status.offline": "离线",
    "status.needSetup": "等待本地配置",
    "label.execution": "执行模式",
    "label.permission": "权限模式",
    "label.project": "当前项目",
    "button.refresh": "刷新",
    "button.test": "测试连接",
    "button.copy": "复制",
    "button.save": "保存",
    "button.regenerate": "重新生成",
    "button.open": "打开",
    "button.back": "返回上一级",
    "button.selectFolder": "选择当前文件夹",
    "button.register": "注册项目",
    "button.inspect": "检查项目",
    "button.loadTree": "加载文件树",
    "button.readFile": "读取文件",
    "button.contextPack": "创建上下文包",
    "button.createPatch": "创建补丁草稿",
    "button.apply": "应用",
    "button.revert": "回滚",
    "button.reject": "拒绝",
    "button.diff": "查看差异",
    "button.review": "创建审查任务",
    "button.createJob": "创建 Codex 任务",
    "button.approveRun": "批准并运行",
    "button.run": "运行",
    "button.analyze": "分析错误",
    "button.createRepair": "创建修复方案",
    "button.loadTools": "读取 MCP 工具",
    "button.fullAccess": "开启完整访问",
    "button.accept": "接受",
    "button.decline": "拒绝",
    "button.copyMcp": "复制 MCP 地址",
    "setup.title": "连接向导",
    "setup.subtitle": "先让本地 Bridge 正常运行，再把 /mcp 地址和本地配对码填入 ChatGPT 自定义 MCP。",
    "setup.primaryNotice": "主界面是 ChatGPT 网页端主控 GPT。Dashboard 只做本地控制台：连接、项目、审批、日志和能力管理。",
    "setup.localAddress": "本地地址",
    "setup.mcpUrl": "MCP 地址",
    "setup.publicUrl": "公网地址示例",
    "setup.auth": "认证方式",
    "setup.authValue": "访问令牌 / API 密钥",
    "setup.code": "本地配对码",
    "setup.codeHint": "配对码由本机自动生成。通常不用手动设置；需要换一个时点击重新生成。",
    "setup.steps": "从零开始",
    "setup.step1": "在 PowerShell 进入 bridge 目录，运行 npm.cmd install --no-audit --no-fund，然后运行 npm.cmd run dev。",
    "setup.step2": "打开本页面，点击测试连接，确认执行模式和权限模式正确。",
    "setup.step3": "用 Cloudflare Tunnel 或 ngrok 把 http://localhost:8787 暴露成 HTTPS 子域名。",
    "setup.step4": "在 ChatGPT 自定义 GPT 中添加自定义 MCP，服务器 URL 填 https://你的子域名/mcp，认证填本地配对码。",
    "setup.result": "连接结果",
    "project.title": "项目",
    "project.subtitle": "用文件管理器式界面选择本地项目文件夹。Bridge 只会读写已注册项目目录内的相对路径。",
    "project.browser": "文件夹选择器",
    "project.roots": "常用位置",
    "project.current": "当前位置",
    "project.registered": "已注册项目",
    "project.inspect": "项目概览",
    "project.files": "读取文件与上下文",
    "tasks.title": "任务",
    "tasks.subtitle": "小范围界面、文案、样式修改可先创建网页补丁；较大实现、测试和修复交给 Codex 任务。",
    "tasks.patches": "网页补丁",
    "tasks.jobs": "Codex 任务",
    "tasks.screenshot": "UI 截图任务",
    "tasks.patchList": "补丁列表",
    "tasks.jobList": "任务列表",
    "tasks.itemCount": "{count} 项",
    "tasks.jobCount": "{count} 个任务",
    "approvals.title": "审批",
    "approvals.subtitle": "需要人工确认的任务、命令请求、修复方案会出现在这里。禁止的动作会显示原因，不会静默失败。",
    "logs.title": "日志",
    "logs.subtitle": "所有 REST、MCP、Codex、审批和错误都会写入统一日志。出错时先复制 requestId。",
    "mcp.title": "能力中心",
    "mcp.subtitle": "Bridge 自己是 ChatGPT 自定义 MCP 服务，同时统一管理文件、Git、Codex、Playwright 等能力。",
    "advanced.title": "高级",
    "advanced.subtitle": "切换执行模式、权限模式、修复中心、交叉审查和兼容 API。普通用户日常不需要停在这里。",
    "advanced.runtime": "运行设置",
    "advanced.access": "权限模式",
    "advanced.repair": "修复中心",
    "advanced.review": "交叉审查",
    "advanced.fullWarning": "完整访问会放宽写文件和执行限制。只建议在一次性分支或演示项目中使用。",
    "advanced.confirmFull": "完整访问确认",
    "advanced.reviewHint": "最多 1 到 3 轮，超过上限后必须做最终决定。",
    "advanced.readOnly": "只读检查：不能应用补丁，不能运行危险命令。",
    "advanced.manualReview": "人工审查：推荐默认模式，关键动作都需要你确认。",
    "advanced.autoReview": "自动审查：低风险任务可自动运行，高风险仍需审批。",
    "advanced.fullAccess": "完整访问：危险模式，开启前必须输入确认语。",
    "field.baseUrl": "本机 Bridge 地址",
    "field.publicBase": "公网桥接地址",
    "field.displayName": "显示名称",
    "field.path": "路径",
    "field.filePath": "文件路径",
    "field.paths": "文件列表",
    "field.title": "标题",
    "field.rationale": "原因",
    "field.mode": "模式",
    "field.content": "完整内容",
    "field.task": "任务说明",
    "field.roles": "角色",
    "field.safety": "安全等级",
    "field.search": "搜索",
    "field.level": "级别",
    "field.errorSummary": "错误摘要",
    "field.diagnosis": "简短诊断",
    "field.solution": "解决方案",
    "field.plan": "执行计划",
    "field.devUrl": "开发服务 URL",
    "field.route": "页面路径",
    "field.webSummary": "网页端方案摘要",
    "field.codexSummary": "Codex 方案摘要",
    "placeholder.file": "src/App.tsx",
    "placeholder.paths": "src/App.tsx, src/styles.css",
    "placeholder.patchTitle": "更新首页文案",
    "placeholder.task": "请检查项目并修复当前失败的测试。",
    "placeholder.jobTitle": "Codex 任务",
    "placeholder.fullConfirm": "我已理解风险",
    "placeholder.planLines": "每行一个步骤",
    "placeholder.reviewTitle": "交叉审查",
    "empty.projects": "还没有注册项目。",
    "empty.items": "暂无数据。",
    "empty.logs": "暂无日志。",
    "msg.bootstrap": "已自动读取本机连接设置。",
    "msg.saved": "已保存。",
    "msg.codeRegenerated": "本地配对码已重新生成，并已更新到当前浏览器。",
    "msg.connectionOk": "连接成功；运行模式：{execution}；权限模式：{permissionMode}。",
    "msg.copied": "已复制。",
    "msg.projectSelected": "项目已注册：{name}",
    "msg.fileLoaded": "文件已读取。",
    "msg.packCreated": "上下文包已创建。",
    "msg.patchCreated": "补丁草稿已创建。",
    "msg.jobCreated": "Codex 任务已创建。",
    "msg.repairCreated": "修复方案已创建，等待审批。",
    "msg.modeChanged": "权限模式已切换为 {mode}。",
    "msg.confirmApply": "确认应用这个补丁到本地文件？Bridge 会创建备份。",
    "msg.confirmRevert": "确认回滚这个补丁？这会修改本地文件。",
    "msg.confirmReject": "确认拒绝这个条目？",
    "msg.fullPrompt": "输入“我已理解风险”或“I understand”后才能开启完整访问。",
    "hint.errorNext": "建议打开“日志”或“高级 > 修复中心”查看详情并创建修复方案。",
    "hint.readOnlyApply": "当前是只读模式，不能应用补丁。",
    "error.unauthorized": "认证失败：本地配对码不正确。请在连接向导中重新读取或重新生成配对码，并确保 ChatGPT 自定义 MCP 使用同一个配对码。",
    "error.connection": "连接失败：无法访问 Bridge 服务。请确认 npm.cmd run dev 正在运行，端口是否正确。",
    "error.needProject": "请先选择或注册项目。",
    "error.title": "请求失败"
  },
  en: {
    "brand.title": "Local Bridge",
    "brand.subtitle": "Local capability layer for a ChatGPT orchestrator GPT",
    "nav.setup": "Setup",
    "nav.project": "Project",
    "nav.tasks": "Tasks",
    "nav.approvals": "Approvals",
    "nav.logs": "Logs",
    "nav.mcp": "MCP Center",
    "nav.advanced": "Advanced",
    "top.title": "ChatGPT-Codex Local Bridge",
    "top.subtitle": "The main workspace is your ChatGPT orchestrator GPT. This dashboard handles local setup, project selection, approvals, logs, and capability management.",
    "status.connected": "Connected",
    "status.checking": "Checking",
    "status.offline": "Offline",
    "status.needSetup": "Waiting for local setup",
    "label.execution": "Execution",
    "label.permission": "Permission",
    "label.project": "Current project",
    "button.refresh": "Refresh",
    "button.test": "Test connection",
    "button.copy": "Copy",
    "button.save": "Save",
    "button.regenerate": "Regenerate",
    "button.open": "Open",
    "button.back": "Parent",
    "button.selectFolder": "Select folder",
    "button.register": "Register project",
    "button.inspect": "Inspect",
    "button.loadTree": "Load tree",
    "button.readFile": "Read file",
    "button.contextPack": "Create context pack",
    "button.createPatch": "Create patch draft",
    "button.apply": "Apply",
    "button.revert": "Revert",
    "button.reject": "Reject",
    "button.diff": "View diff",
    "button.review": "Create review job",
    "button.createJob": "Create Codex job",
    "button.approveRun": "Approve and run",
    "button.run": "Run",
    "button.analyze": "Analyze error",
    "button.createRepair": "Create repair",
    "button.loadTools": "Load MCP tools",
    "button.fullAccess": "Enable full access",
    "button.accept": "Accept",
    "button.decline": "Decline",
    "button.copyMcp": "Copy MCP URL",
    "setup.title": "Setup",
    "setup.subtitle": "Start the local Bridge, then add the /mcp URL and local pairing code to ChatGPT Custom MCP.",
    "setup.primaryNotice": "The main interface is ChatGPT Web. This dashboard is a local control panel for setup, projects, approvals, logs, and capabilities.",
    "setup.localAddress": "Local address",
    "setup.mcpUrl": "MCP URL",
    "setup.publicUrl": "Public URL example",
    "setup.auth": "Auth mode",
    "setup.authValue": "Access token / API key",
    "setup.code": "Local pairing code",
    "setup.codeHint": "The code is generated on this computer. Usually you do not edit it; regenerate it when needed.",
    "setup.steps": "From scratch",
    "setup.step1": "In PowerShell, enter the bridge folder, run npm.cmd install --no-audit --no-fund, then npm.cmd run dev.",
    "setup.step2": "Open this dashboard and test the connection.",
    "setup.step3": "Expose http://localhost:8787 as an HTTPS subdomain with Cloudflare Tunnel or ngrok.",
    "setup.step4": "In your custom GPT, add Custom MCP, use https://your-subdomain/mcp, and use the local pairing code.",
    "setup.result": "Connection result",
    "project.title": "Project",
    "project.subtitle": "Select a local project folder through the folder picker. Bridge reads and writes only inside registered project roots.",
    "project.browser": "Folder picker",
    "project.roots": "Roots",
    "project.current": "Current path",
    "project.registered": "Registered projects",
    "project.inspect": "Project overview",
    "project.files": "Files and context",
    "tasks.title": "Tasks",
    "tasks.subtitle": "Use Web Patch for small UI/copy/CSS edits. Use Codex jobs for larger implementation, testing, and repair.",
    "tasks.patches": "Web Patch",
    "tasks.jobs": "Codex Jobs",
    "tasks.screenshot": "UI Screenshot Job",
    "tasks.patchList": "Patch list",
    "tasks.jobList": "Job list",
    "tasks.itemCount": "{count} items",
    "tasks.jobCount": "{count} jobs",
    "approvals.title": "Approvals",
    "approvals.subtitle": "Tasks, command requests, and repairs needing human confirmation appear here.",
    "logs.title": "Logs",
    "logs.subtitle": "All REST, MCP, Codex, approval, and error events are written to unified logs.",
    "mcp.title": "MCP Center",
    "mcp.subtitle": "Bridge is the ChatGPT Custom MCP server and manages file, Git, Codex, Playwright, and planned plugin capabilities.",
    "advanced.title": "Advanced",
    "advanced.subtitle": "Execution mode, permission mode, repair center, cross review, and compatibility APIs.",
    "advanced.runtime": "Runtime",
    "advanced.access": "Permission mode",
    "advanced.repair": "Repair Center",
    "advanced.review": "Cross Review",
    "advanced.fullWarning": "Full access relaxes write and execution restrictions. Use it only on disposable branches or demo projects.",
    "advanced.confirmFull": "Full access confirmation",
    "advanced.reviewHint": "Maximum 1 to 3 rounds. After the limit, choose a final decision.",
    "advanced.readOnly": "Read only: cannot apply patches or run dangerous commands.",
    "advanced.manualReview": "Manual review: recommended default; key actions require confirmation.",
    "advanced.autoReview": "Auto review: low-risk tasks can run automatically; high-risk tasks still need approval.",
    "advanced.fullAccess": "Full access: dangerous mode; requires explicit confirmation.",
    "field.baseUrl": "Bridge URL",
    "field.publicBase": "Public Base URL",
    "field.displayName": "Display name",
    "field.path": "Path",
    "field.filePath": "File path",
    "field.paths": "Paths",
    "field.title": "Title",
    "field.rationale": "Rationale",
    "field.mode": "Mode",
    "field.content": "Full content",
    "field.task": "Task",
    "field.roles": "Roles",
    "field.safety": "Safety",
    "field.search": "Search",
    "field.level": "Level",
    "field.errorSummary": "Error summary",
    "field.diagnosis": "Diagnosis",
    "field.solution": "Solution",
    "field.plan": "Execution plan",
    "field.devUrl": "Dev server URL",
    "field.route": "Route",
    "field.webSummary": "Web proposal summary",
    "field.codexSummary": "Codex proposal summary",
    "placeholder.file": "src/App.tsx",
    "placeholder.paths": "src/App.tsx, src/styles.css",
    "placeholder.patchTitle": "Update homepage copy",
    "placeholder.task": "Inspect the project and fix the failing test.",
    "placeholder.jobTitle": "Codex task",
    "placeholder.fullConfirm": "I understand",
    "placeholder.planLines": "One step per line",
    "placeholder.reviewTitle": "Cross review",
    "empty.projects": "No projects registered yet.",
    "empty.items": "No items.",
    "empty.logs": "No logs.",
    "msg.bootstrap": "Loaded local connection settings.",
    "msg.saved": "Saved.",
    "msg.codeRegenerated": "Local pairing code regenerated and saved in this browser.",
    "msg.connectionOk": "Connection successful; execution mode: {execution}; permission mode: {permissionMode}.",
    "msg.copied": "Copied.",
    "msg.projectSelected": "Project registered: {name}",
    "msg.fileLoaded": "File loaded.",
    "msg.packCreated": "Context pack created.",
    "msg.patchCreated": "Patch draft created.",
    "msg.jobCreated": "Codex job created.",
    "msg.repairCreated": "Repair proposal created and awaits approval.",
    "msg.modeChanged": "Permission mode changed to {mode}.",
    "msg.confirmApply": "Apply this patch to local files? Bridge will create a backup.",
    "msg.confirmRevert": "Revert this patch? This modifies local files.",
    "msg.confirmReject": "Reject this item?",
    "msg.fullPrompt": "Type I understand or 我已理解风险 to enable full access.",
    "hint.errorNext": "Open Logs or Advanced > Repair Center for details and a repair proposal.",
    "hint.readOnlyApply": "The current mode is read only, so patches cannot be applied.",
    "error.unauthorized": "Authentication failed: the local pairing code is incorrect. Reload or regenerate it in Setup, and make sure ChatGPT Custom MCP uses the same code.",
    "error.connection": "Connection failed: cannot reach the Bridge service. Confirm npm.cmd run dev is running and the port is correct.",
    "error.needProject": "Select or register a project first.",
    "error.title": "Request failed"
  }
};

const state = {
  lang: localStorage.getItem(STORAGE.language) || "zh",
  view: "setup",
  collapsed: localStorage.getItem(STORAGE.sidebar) === "1",
  baseUrl: localStorage.getItem(STORAGE.baseUrl) || window.location.origin,
  publicBaseUrl: localStorage.getItem(STORAGE.publicBaseUrl) || "",
  pairingCode: localStorage.getItem(STORAGE.code) || "",
  status: "checking",
  config: null,
  projects: [],
  projectId: localStorage.getItem(STORAGE.projectId) || "",
  browser: { roots: [], directories: [], currentPath: "", parentPath: null },
  jobs: [],
  patches: [],
  approvals: [],
  logs: [],
  repairs: [],
  reviews: [],
  mcpCenter: null,
  mcpTools: [],
  projectDetail: "",
  treeText: "",
  fileContent: "",
  filePath: "",
  contextPack: "",
  diffHtml: "",
  latestErrorAnalysis: null,
  alert: null,
  busy: false
};

const app = document.getElementById("app");

function t(key, vars = {}) {
  const table = I18N[state.lang] || I18N.zh;
  let value = table[key] || I18N.zh[key] || key;
  for (const [name, replacement] of Object.entries(vars)) {
    value = value.replaceAll(`{${name}}`, String(replacement));
  }
  return value;
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeBaseUrl(value) {
  return String(value || window.location.origin).trim().replace(/\/+$/, "");
}

function currentProject() {
  return state.projects.find((project) => project.id === state.projectId) || state.projects[0] || null;
}

function currentProjectId() {
  const project = currentProject();
  return project ? project.id : "";
}

function labelStatus(value) {
  if (state.lang !== "zh") return value;
  const map = {
    "built-in": "内置",
    available: "可用",
    disabled: "已禁用",
    not_implemented: "未实现",
    low: "低风险",
    medium: "中风险",
    high: "高风险",
    yes: "是",
    no: "否",
    draft: "草稿",
    needs_approval: "待审批",
    applied: "已应用",
    reverted: "已回滚",
    rejected: "已拒绝",
    approved: "已批准",
    executed: "已执行",
    queued: "排队中",
    running: "运行中",
    completed: "已完成",
    failed: "失败",
    cancelled: "已取消",
    pending: "待处理",
    open: "进行中",
    closed: "已关闭"
  };
  return map[value] || value;
}

function boolLabel(value) {
  return state.lang === "zh" ? (value ? "是" : "否") : (value ? "yes" : "no");
}

function labelExecution(value) {
  if (state.lang !== "zh") return value || "dry-run";
  const map = {
    "dry-run": "演练模式",
    cli: "命令行模式",
    "app-server": "应用服务模式"
  };
  return map[value] || value || "演练模式";
}

function labelPermission(value) {
  if (state.lang !== "zh") return value || "manual_review";
  const map = {
    read_only: "只读检查",
    manual_review: "人工审查",
    auto_review: "自动审查",
    full_access: "完整访问"
  };
  return map[value] || value || "人工审查";
}

function modeOption(value) {
  const labels = {
    overwrite: state.lang === "zh" ? "覆盖现有文件" : "Overwrite file",
    create: state.lang === "zh" ? "新建文件" : "Create file"
  };
  return `<option value="${esc(value)}">${esc(labels[value] || value)}</option>`;
}

function safetyOption(value, label) {
  return `<option value="${value}">${state.lang === "zh" ? label.zh : label.en}</option>`;
}

function permissionModeInfo() {
  return [
    ["read_only", t("advanced.readOnly")],
    ["manual_review", t("advanced.manualReview")],
    ["auto_review", t("advanced.autoReview")],
    ["full_access", t("advanced.fullAccess")]
  ];
}

function setAlert(kind, message, details) {
  state.alert = { kind, message, details };
  render();
}

function clearAlert() {
  state.alert = null;
}

function setBusy(value) {
  state.busy = value;
  render();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(String(text || ""));
    setAlert("success", t("msg.copied"));
  } catch {
    const area = document.createElement("textarea");
    area.value = String(text || "");
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    setAlert("success", t("msg.copied"));
  }
}

function authHeaders(extra = {}) {
  return state.pairingCode ? { ...extra, Authorization: `Bearer ${state.pairingCode}` } : extra;
}

async function api(path, options = {}) {
  const url = `${normalizeBaseUrl(state.baseUrl)}${path}`;
  const headers = authHeaders({ Accept: "application/json", ...(options.headers || {}) });
  const init = { ...options, headers };
  if (init.body && !headers["Content-Type"]) {
    init.headers = { ...headers, "Content-Type": "application/json" };
  }
  let response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    throw { kind: "connection", endpoint: path, message: t("error.connection"), details: error instanceof Error ? error.message : String(error) };
  }
  const text = await response.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }
  if (!response.ok) {
    const message = response.status === 401 ? t("error.unauthorized") : body.message || body.error || response.statusText;
    throw { kind: "http", endpoint: path, status: response.status, requestId: body.requestId || response.headers.get("x-request-id"), message, details: body };
  }
  return body;
}

async function bootstrap() {
  clearAlert();
  try {
    const body = await fetch(`${window.location.origin}/bootstrap`).then((res) => res.json());
    if (body && body.ok) {
      state.baseUrl = body.baseUrl || window.location.origin;
      state.pairingCode = body.token || state.pairingCode;
      localStorage.setItem(STORAGE.baseUrl, state.baseUrl);
      localStorage.setItem(STORAGE.code, state.pairingCode);
      state.status = "connected";
      await loadAll(false);
      setAlert("success", t("msg.bootstrap"));
      return;
    }
  } catch {
    state.status = state.pairingCode ? "offline" : "needSetup";
  }
  render();
}

async function loadAll(showSuccess = false) {
  try {
    const [config, projects, jobs, patches, approvals, logs, repairs, reviews, mcpCenter] = await Promise.all([
      api("/config"),
      api("/projects"),
      api("/codex/jobs"),
      api("/web-patches"),
      api("/codex/approvals"),
      api("/logs?limit=100"),
      api("/repairs"),
      api("/reviews"),
      api("/mcp-center")
    ]);
    state.config = config;
    state.projects = projects.projects || [];
    if (!state.projectId && state.projects[0]) state.projectId = state.projects[0].id;
    if (state.projectId) localStorage.setItem(STORAGE.projectId, state.projectId);
    state.jobs = jobs.jobs || [];
    state.patches = patches.patches || [];
    state.approvals = approvals.approvals || [];
    state.logs = logs.logs || [];
    state.repairs = repairs.repairs || [];
    state.reviews = reviews.reviews || [];
    state.mcpCenter = mcpCenter;
    state.status = "connected";
    if (showSuccess) setAlert("success", t("button.refresh"));
    render();
  } catch (error) {
    handleError(error);
  }
}

function handleError(error) {
  state.status = error && error.kind === "connection" ? "offline" : state.status;
  state.alert = {
    kind: "error",
    message: (error && error.message) || t("error.title"),
    details: {
      endpoint: error && error.endpoint,
      status: error && error.status,
      requestId: error && error.requestId,
      details: error && error.details,
      hint: t("hint.errorNext")
    }
  };
  render();
}

async function parseRpcResponse(response) {
  const sessionId = response.headers.get("mcp-session-id") || "";
  const text = await response.text();
  let body = null;
  if ((response.headers.get("content-type") || "").includes("text/event-stream")) {
    const dataLine = text.split("\n").map((line) => line.trim()).find((line) => line.startsWith("data:"));
    body = dataLine ? JSON.parse(dataLine.slice(5).trim()) : {};
  } else {
    body = text ? JSON.parse(text) : {};
  }
  if (!response.ok || body.error) {
    throw {
      kind: "http",
      endpoint: "/mcp",
      status: response.status,
      requestId: body.requestId || response.headers.get("x-request-id"),
      message: response.status === 401 ? t("error.unauthorized") : (body.error?.message || body.message || response.statusText),
      details: body
    };
  }
  return { body, sessionId };
}

async function mcpPost(payload, sessionId = "") {
  const response = await fetch(`${normalizeBaseUrl(state.baseUrl)}/mcp`, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...(sessionId ? { "mcp-session-id": sessionId } : {})
    }),
    body: JSON.stringify(payload)
  });
  return parseRpcResponse(response);
}

async function mcpListTools() {
  const init = await mcpPost({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "bridge-dashboard", version: "1.0.0" }
    }
  });
  const sessionId = init.sessionId;
  await mcpPost({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }, sessionId);
  const tools = await mcpPost({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, sessionId);
  return tools.body.result?.tools || [];
}

async function testConnection() {
  setBusy(true);
  try {
    const healthResponse = await fetch(`${normalizeBaseUrl(state.baseUrl)}/health`, {
      headers: authHeaders({ Accept: "application/json" })
    });
    const health = await healthResponse.json().catch(() => ({}));
    if (!healthResponse.ok) {
      throw {
        kind: "http",
        endpoint: "/health",
        status: healthResponse.status,
        requestId: health.requestId || healthResponse.headers.get("x-request-id"),
        message: healthResponse.status === 401 ? t("error.unauthorized") : (health.message || health.error || healthResponse.statusText),
        details: health
      };
    }
    const config = await api("/config");
    state.mcpTools = await mcpListTools();
    state.config = config;
    state.status = "connected";
    setAlert("success", t("msg.connectionOk", {
      execution: labelExecution(health.execution || config.execution),
      permissionMode: labelPermission(health.permissionMode || config.settings?.permissionMode)
    }));
  } catch (error) {
    handleError(error);
  } finally {
    state.busy = false;
    render();
  }
}

function render() {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  document.title = state.lang === "zh" ? "ChatGPT-Codex 本地桥接器" : "ChatGPT-Codex Local Bridge";
  const project = currentProject();
  app.innerHTML = `
    <div class="shell ${state.collapsed ? "collapsed" : ""}">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">CB</div>
          <div class="brand-copy">
            <div class="brand-title">${t("brand.title")}</div>
            <div class="brand-subtitle">${t("brand.subtitle")}</div>
          </div>
          <button class="icon-button" data-action="toggle-sidebar" title="${t("nav.setup")}">☰</button>
        </div>
        <nav class="nav">
          ${NAV.map(([id, icon, label]) => `
            <button class="nav-item ${state.view === id ? "active" : ""}" data-view="${id}" title="${t(label)}">
              <span class="nav-icon">${icon}</span>
              <span class="nav-label">${t(label)}</span>
            </button>
          `).join("")}
        </nav>
        <div class="sidebar-footer">
          <div class="status-mini"><span class="dot ${statusClass()}"></span><span>${statusText()}</span></div>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="top-title">
            <button class="icon-button" data-action="toggle-sidebar" title="${state.collapsed ? (state.lang === "zh" ? "展开侧边栏" : "Open sidebar") : (state.lang === "zh" ? "收起侧边栏" : "Collapse sidebar")}">☰</button>
            <div>
              <h1>${t("top.title")}</h1>
              <p>${t("top.subtitle")}</p>
            </div>
          </div>
          <div class="top-actions">
            <span class="status-chip"><span class="dot ${statusClass()}"></span>${statusText()}</span>
            <span class="status-chip">${t("label.execution")}: <strong>${esc(labelExecution(state.config?.execution || "dry-run"))}</strong></span>
            <span class="status-chip">${t("label.permission")}: <strong>${esc(labelPermission(state.config?.settings?.permissionMode || "manual_review"))}</strong></span>
            <select id="projectSelect" title="${t("label.project")}">
              <option value="">${t("label.project")}</option>
              ${state.projects.map((item) => `<option value="${esc(item.id)}" ${project && project.id === item.id ? "selected" : ""}>${esc(item.name)}</option>`).join("")}
            </select>
            <div class="segmented">
              <button data-lang="zh" class="${state.lang === "zh" ? "active" : ""}">中文</button>
              <button data-lang="en" class="${state.lang === "en" ? "active" : ""}">English</button>
            </div>
            <button class="button secondary" data-action="refresh">${t("button.refresh")}</button>
          </div>
        </header>
        <section class="content">
          ${renderAlert()}
          ${renderPage()}
        </section>
      </main>
    </div>
  `;
  bind();
}

function statusClass() {
  if (state.status === "connected") return "ok";
  if (state.status === "checking" || state.status === "needSetup") return "warn";
  return "bad";
}

function statusText() {
  if (state.status === "connected") return t("status.connected");
  if (state.status === "checking") return t("status.checking");
  if (state.status === "needSetup") return t("status.needSetup");
  return t("status.offline");
}

function renderAlert() {
  if (!state.alert) return "";
  const details = state.alert.details ? `<pre>${esc(JSON.stringify(state.alert.details, null, 2))}</pre>` : "";
  return `<div class="alert ${esc(state.alert.kind)}"><strong>${esc(state.alert.message)}</strong>${details}</div>`;
}

function renderPage() {
  if (state.view === "project") return renderProject();
  if (state.view === "tasks") return renderTasks();
  if (state.view === "approvals") return renderApprovals();
  if (state.view === "logs") return renderLogs();
  if (state.view === "mcp") return renderMcp();
  if (state.view === "advanced") return renderAdvanced();
  return renderSetup();
}

function renderSetup() {
  const local = normalizeBaseUrl(state.baseUrl);
  const mcpUrl = `${local}/mcp`;
  const publicMcp = state.publicBaseUrl ? `${normalizeBaseUrl(state.publicBaseUrl)}/mcp` : "https://bridge.your-domain.com/mcp";
  return `
    <div class="page-heading">
      <div><h2>${t("setup.title")}</h2><p>${t("setup.subtitle")}</p></div>
      <button class="button primary" data-action="test">${t("button.test")}</button>
    </div>
    <div class="alert warning"><strong>${t("setup.primaryNotice")}</strong></div>
    <div class="grid three">
      <div class="metric"><div class="metric-label">${t("setup.localAddress")}</div><div class="metric-value">${esc(local)}</div></div>
      <div class="metric"><div class="metric-label">${t("setup.mcpUrl")}</div><div class="metric-value">${esc(mcpUrl)}</div></div>
      <div class="metric"><div class="metric-label">${t("setup.auth")}</div><div class="metric-value">${t("setup.authValue")}</div></div>
    </div>
    <div class="grid two" style="margin-top:14px">
      <section class="panel">
        <div class="panel-header"><div><h3>${t("setup.code")}</h3><p>${t("setup.codeHint")}</p></div></div>
        <div class="form">
          <label class="field"><span class="field-label">${t("field.baseUrl")}</span><input id="baseUrlInput" value="${esc(state.baseUrl)}"></label>
          <label class="field"><span class="field-label">${t("field.publicBase")}</span><input id="publicBaseInput" value="${esc(state.publicBaseUrl)}" placeholder="https://bridge.your-domain.com"></label>
          <label class="field"><span class="field-label">${t("setup.code")}</span><input id="pairingInput" value="${esc(state.pairingCode)}" readonly></label>
          <div class="toolbar">
            <button class="button secondary" data-action="save-connection">${t("button.save")}</button>
            <button class="button secondary" data-action="copy-code">${t("button.copy")} ${t("setup.code")}</button>
            <button class="button secondary" data-action="copy-mcp">${t("button.copyMcp")}</button>
            <button class="button danger" data-action="regenerate-code">${t("button.regenerate")}</button>
          </div>
          <pre>${esc(state.lang === "zh" ? `自定义 MCP 地址：${publicMcp}\n认证方式：${t("setup.authValue")}\n${t("setup.code")}：${state.pairingCode || "自动生成"}` : `Custom MCP URL: ${publicMcp}\nAuth: ${t("setup.authValue")}\n${t("setup.code")}: ${state.pairingCode || "(auto generated)"}`)}</pre>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><div><h3>${t("setup.steps")}</h3><p>${t("setup.result")}</p></div></div>
        <div class="item-list">
          ${[t("setup.step1"), t("setup.step2"), t("setup.step3"), t("setup.step4")].map((step, index) => `<div class="item"><div class="item-title">${index + 1}. ${esc(step)}</div></div>`).join("")}
        </div>
        <div style="margin-top:12px">${state.mcpTools.length ? `<div class="chip">${state.lang === "zh" ? "MCP 工具" : "MCP tools"}: ${state.mcpTools.length}</div>` : ""}</div>
      </section>
    </div>
  `;
}

function renderProject() {
  const project = currentProject();
  return `
    <div class="page-heading">
      <div><h2>${t("project.title")}</h2><p>${t("project.subtitle")}</p></div>
      <div class="toolbar"><button class="button secondary" data-action="load-roots">${t("button.refresh")}</button><button class="button primary" data-action="inspect">${t("button.inspect")}</button></div>
    </div>
    <div class="grid wide-left">
      <section class="panel">
        <div class="panel-header"><div><h3>${t("project.browser")}</h3><p>${t("project.current")}: ${esc(state.browser.currentPath || t("project.roots"))}</p></div></div>
        <div class="toolbar" style="margin-bottom:10px">
          ${state.browser.parentPath ? `<button class="button secondary" data-open-folder="${esc(state.browser.parentPath)}">${t("button.back")}</button>` : ""}
          ${state.browser.currentPath ? `<button class="button primary" data-action="select-current">${t("button.selectFolder")}</button>` : ""}
        </div>
        <div class="folder-grid">
          ${(state.browser.currentPath ? state.browser.directories : state.browser.roots).map((dir) => `<button class="button secondary folder-button" data-open-folder="${esc(dir.path)}">${esc(dir.name)}<br><span class="muted">${esc(dir.path)}</span></button>`).join("") || `<div class="muted">${t("empty.items")}</div>`}
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><div><h3>${t("project.registered")}</h3><p>${project ? esc(project.path) : t("empty.projects")}</p></div></div>
        <form id="manualProjectForm" class="form">
          <label class="field"><span class="field-label">${t("field.displayName")}</span><input name="displayName" placeholder="demo-project"></label>
          <label class="field"><span class="field-label">${t("field.path")}</span><input name="path" value="${esc(state.browser.currentPath)}"></label>
          <button class="button primary" type="submit">${t("button.register")}</button>
        </form>
        <div class="item-list" style="margin-top:12px">
          ${state.projects.map((item) => `<button class="item" data-project-id="${esc(item.id)}"><span class="item-title">${esc(item.name)}</span><span class="item-meta">${esc(item.path)}</span></button>`).join("") || `<div class="muted">${t("empty.projects")}</div>`}
        </div>
      </section>
    </div>
    <div class="grid two" style="margin-top:14px">
      <section class="panel">
        <div class="panel-header"><div><h3>${t("project.inspect")}</h3><p>${t("button.inspect")}</p></div><button class="button secondary" data-action="load-tree">${t("button.loadTree")}</button></div>
        <pre>${esc(state.projectDetail || state.treeText || t("empty.items"))}</pre>
      </section>
      <section class="panel">
        <div class="panel-header"><div><h3>${t("project.files")}</h3><p>${t("placeholder.file")}</p></div></div>
        <form id="fileReadForm" class="form">
          <label class="field"><span class="field-label">${t("field.filePath")}</span><input name="filePath" value="${esc(state.filePath)}" placeholder="${t("placeholder.file")}"></label>
          <div class="toolbar"><button class="button primary" type="button" data-action="read-file">${t("button.readFile")}</button><button class="button secondary" type="button" data-action="context-pack">${t("button.contextPack")}</button></div>
        </form>
        <textarea class="tall" id="fileContentArea">${esc(state.fileContent)}</textarea>
      </section>
    </div>
  `;
}

function renderTasks() {
  const projectId = currentProjectId();
  return `
    <div class="page-heading"><div><h2>${t("tasks.title")}</h2><p>${t("tasks.subtitle")}</p></div><button class="button secondary" data-action="refresh">${t("button.refresh")}</button></div>
    <div class="grid two">
      <section class="panel">
        <div class="panel-header"><div><h3>${t("tasks.patches")}</h3><p>${t("button.createPatch")}</p></div></div>
        <form id="patchForm" class="form">
          <label class="field"><span class="field-label">${t("field.title")}</span><input name="title" placeholder="${t("placeholder.patchTitle")}" required></label>
          <label class="field"><span class="field-label">${t("field.filePath")}</span><input name="filePath" value="${esc(state.filePath)}" placeholder="${t("placeholder.file")}" required></label>
          <label class="field"><span class="field-label">${t("field.mode")}</span><select name="mode">${modeOption("overwrite")}${modeOption("create")}</select></label>
          <label class="field"><span class="field-label">${t("field.rationale")}</span><textarea name="rationale"></textarea></label>
          <label class="field"><span class="field-label">${t("field.content")}</span><textarea class="tall" name="content" required>${esc(state.fileContent)}</textarea></label>
          <button class="button primary" type="submit" ${projectId ? "" : "disabled"}>${t("button.createPatch")}</button>
        </form>
      </section>
      <section class="panel">
        <div class="panel-header"><div><h3>${t("tasks.jobs")}</h3><p>${t("button.createJob")}</p></div></div>
        <form id="jobForm" class="form">
          <label class="field"><span class="field-label">${t("field.title")}</span><input name="title" value="${t("placeholder.jobTitle")}" required></label>
          <label class="field"><span class="field-label">${t("field.roles")}</span><input name="roles" value="fullstack_engineer,qa_reviewer"></label>
          <label class="field"><span class="field-label">${t("field.safety")}</span><select name="safetyLevel">${safetyOption(1, { zh: "1 低风险", en: "1 low" })}${safetyOption(2, { zh: "2 常规", en: "2 normal" })}${safetyOption(3, { zh: "3 写文件", en: "3 write" })}${safetyOption(4, { zh: "4 执行命令", en: "4 command" })}${safetyOption(5, { zh: "5 高风险", en: "5 high" })}</select></label>
          <label class="field"><span class="field-label">${t("field.task")}</span><textarea name="task" placeholder="${t("placeholder.task")}" required></textarea></label>
          <button class="button primary" type="submit" ${projectId ? "" : "disabled"}>${t("button.createJob")}</button>
        </form>
      </section>
    </div>
    <div class="grid two" style="margin-top:14px">
      <section class="panel">
        <div class="panel-header"><div><h3>${t("tasks.patchList")}</h3><p>${t("tasks.itemCount", { count: state.patches.length })}</p></div></div>
        <div class="item-list">${state.patches.map(renderPatchItem).join("") || `<div class="muted">${t("empty.items")}</div>`}</div>
        ${state.diffHtml ? `<div style="margin-top:12px"><pre>${state.diffHtml}</pre></div>` : ""}
      </section>
      <section class="panel">
        <div class="panel-header"><div><h3>${t("tasks.jobList")}</h3><p>${t("tasks.jobCount", { count: state.jobs.length })}</p></div></div>
        <div class="item-list">${state.jobs.map(renderJobItem).join("") || `<div class="muted">${t("empty.items")}</div>`}</div>
        <hr style="border-color:var(--line);border-style:solid none none;margin:14px 0">
        <form id="screenshotForm" class="form">
          <h3>${t("tasks.screenshot")}</h3>
          <label class="field"><span class="field-label">${t("field.devUrl")}</span><input name="devServerUrl" placeholder="http://localhost:5173"></label>
          <label class="field"><span class="field-label">${t("field.route")}</span><input name="route" placeholder="/"></label>
          <button class="button secondary" type="submit" ${projectId ? "" : "disabled"}>${t("tasks.screenshot")}</button>
        </form>
      </section>
    </div>
  `;
}

function renderPatchItem(patch) {
  const readOnly = state.config?.settings?.permissionMode === "read_only";
  const canApply = patch.status === "needs_approval" && !readOnly;
  return `<div class="item">
    <div class="item-title">${esc(patch.title)} <span class="chip">${esc(labelStatus(patch.status))}</span></div>
    <div class="item-meta">${esc(patch.id)} · ${esc(patch.changes?.map((c) => c.filePath).join(", ") || "")}</div>
    <div class="toolbar">
      <button class="button secondary" data-patch-diff="${esc(patch.id)}">${t("button.diff")}</button>
      <button class="button primary" data-patch-apply="${esc(patch.id)}" title="${readOnly ? t("hint.readOnlyApply") : ""}" ${canApply ? "" : "disabled"}>${t("button.apply")}</button>
      <button class="button secondary" data-patch-revert="${esc(patch.id)}" ${patch.status !== "applied" ? "disabled" : ""}>${t("button.revert")}</button>
      <button class="button ghost" data-patch-review="${esc(patch.id)}">${t("button.review")}</button>
      <button class="button danger" data-patch-reject="${esc(patch.id)}" ${patch.status === "applied" ? "disabled" : ""}>${t("button.reject")}</button>
    </div>
  </div>`;
}

function renderJobItem(job) {
  return `<div class="item">
    <div class="item-title">${esc(job.title)} <span class="chip">${esc(labelStatus(job.status))}</span></div>
    <div class="item-meta">${esc(job.id)} · ${state.lang === "zh" ? "安全等级" : "safety"} ${esc(job.safetyLevel)} · ${esc(job.roles?.join(", ") || "")}</div>
    ${job.result || job.error ? `<pre>${esc(job.result || job.error)}</pre>` : ""}
    <div class="toolbar">
      <button class="button primary" data-job-approve="${esc(job.id)}" ${["needs_approval", "queued"].includes(job.status) ? "" : "disabled"}>${t("button.approveRun")}</button>
      <button class="button secondary" data-job-run="${esc(job.id)}" ${job.status === "queued" ? "" : "disabled"}>${t("button.run")}</button>
    </div>
  </div>`;
}

function renderApprovals() {
  const pendingJobs = state.jobs.filter((job) => job.status === "needs_approval");
  const pendingRepairs = state.repairs.filter((repair) => repair.status === "needs_approval");
  return `
    <div class="page-heading"><div><h2>${t("approvals.title")}</h2><p>${t("approvals.subtitle")}</p></div><button class="button secondary" data-action="refresh">${t("button.refresh")}</button></div>
    <div class="grid three">
      <section class="panel"><h3>${state.lang === "zh" ? "Codex 任务审批" : "Codex Jobs"}</h3><div class="item-list">${pendingJobs.map(renderJobItem).join("") || `<div class="muted">${t("empty.items")}</div>`}</div></section>
      <section class="panel"><h3>${state.lang === "zh" ? "Codex App 审批" : "Codex App"}</h3><div class="item-list">${state.approvals.map((item) => `<div class="item"><div class="item-title">${esc(item.method)} <span class="chip">${esc(labelStatus(item.status))}</span></div><div class="item-meta">${esc(item.id)}</div><div class="toolbar"><button class="button primary" data-approval="${esc(item.id)}" data-decision="accept">${t("button.accept")}</button><button class="button danger" data-approval="${esc(item.id)}" data-decision="decline">${t("button.decline")}</button></div></div>`).join("") || `<div class="muted">${t("empty.items")}</div>`}</div></section>
      <section class="panel"><h3>${t("advanced.repair")}</h3><div class="item-list">${pendingRepairs.map((item) => `<div class="item"><div class="item-title">${esc(item.errorSummary)}</div><div class="item-meta">${esc(item.id)}</div><div class="toolbar"><button class="button primary" data-repair-approve="${esc(item.id)}">${t("button.approveRun")}</button><button class="button danger" data-repair-reject="${esc(item.id)}">${t("button.reject")}</button></div></div>`).join("") || `<div class="muted">${t("empty.items")}</div>`}</div></section>
    </div>
  `;
}

function renderLogs() {
  return `
    <div class="page-heading"><div><h2>${t("logs.title")}</h2><p>${t("logs.subtitle")}</p></div><div class="toolbar"><button class="button secondary" data-action="load-logs">${t("button.refresh")}</button><button class="button secondary" data-action="copy-logs">${t("button.copy")}</button></div></div>
    <section class="panel">
      <form id="logFilterForm" class="toolbar">
        <select name="level"><option value="">${state.lang === "zh" ? "全部级别" : "all"}</option><option value="debug">${state.lang === "zh" ? "调试" : "debug"}</option><option value="info">${state.lang === "zh" ? "信息" : "info"}</option><option value="warn">${state.lang === "zh" ? "警告" : "warn"}</option><option value="error">${state.lang === "zh" ? "错误" : "error"}</option></select>
        <input name="requestId" placeholder="requestId">
        <button class="button secondary" type="submit">${t("button.refresh")}</button>
        <button class="button primary" type="button" data-action="latest-error">${t("button.analyze")}</button>
      </form>
      ${state.latestErrorAnalysis ? `<pre>${esc(JSON.stringify(state.latestErrorAnalysis, null, 2))}</pre>` : ""}
      <div class="item-list" style="margin-top:12px">${state.logs.map((log) => `<div class="item"><div class="item-title">${esc(log.level)} · ${esc(log.scope || log.action)}</div><div class="item-meta">${esc(log.timestamp || log.at)} · requestId: ${esc(log.requestId || "")}</div><pre>${esc(JSON.stringify(log.details || log.data || log.message, null, 2))}</pre></div>`).join("") || `<div class="muted">${t("empty.logs")}</div>`}</div>
    </section>
  `;
}

function renderMcp() {
  const plugins = state.mcpCenter?.plugins || [];
  const serverInfo = state.lang === "zh"
    ? { "服务地址": `${normalizeBaseUrl(state.baseUrl)}/mcp`, "认证方式": t("setup.authValue"), "工具数量": state.mcpTools.length }
    : { endpoint: `${normalizeBaseUrl(state.baseUrl)}/mcp`, auth: t("setup.authValue"), toolCount: state.mcpTools.length };
  return `
    <div class="page-heading"><div><h2>${t("mcp.title")}</h2><p>${t("mcp.subtitle")}</p></div><button class="button primary" data-action="load-mcp-tools">${t("button.loadTools")}</button></div>
    <div class="grid two">
      <section class="panel">
        <h3>${state.lang === "zh" ? "MCP 服务" : "MCP Server"}</h3>
        <pre>${esc(JSON.stringify(serverInfo, null, 2))}</pre>
        <div class="item-list">${state.mcpTools.map((tool) => `<div class="item"><div class="item-title">${esc(tool.name)}</div><div class="item-meta">${esc(state.lang === "zh" ? (TOOL_ZH[tool.name] || tool.description || "") : (tool.description || ""))}</div></div>`).join("") || `<div class="muted">${t("empty.items")}</div>`}</div>
      </section>
      <section class="panel">
        <h3>${t("mcp.title")}</h3>
        <div class="item-list">${plugins.map((plugin) => {
          const zh = PLUGIN_ZH[plugin.id] || {};
          const name = state.lang === "zh" ? (zh.name || plugin.name) : plugin.name;
          const description = state.lang === "zh" ? (zh.description || plugin.description) : plugin.description;
          const readLabel = state.lang === "zh" ? "读文件" : "read";
          const writeLabel = state.lang === "zh" ? "写文件" : "write";
          const networkLabel = state.lang === "zh" ? "联网" : "network";
          return `<div class="item"><div class="item-title">${esc(name)} <span class="chip">${esc(labelStatus(plugin.status))}</span> <span class="chip">${esc(labelStatus(plugin.risk))}</span></div><div class="item-meta">${esc(description)}</div><div class="row"><span class="chip">${readLabel}: ${boolLabel(plugin.canReadFiles)}</span><span class="chip">${writeLabel}: ${boolLabel(plugin.canWriteFiles)}</span><span class="chip">${networkLabel}: ${boolLabel(plugin.canAccessNetwork)}</span></div></div>`;
        }).join("") || `<div class="muted">${t("empty.items")}</div>`}</div>
      </section>
    </div>
  `;
}

function renderAdvanced() {
  return `
    <div class="page-heading"><div><h2>${t("advanced.title")}</h2><p>${t("advanced.subtitle")}</p></div></div>
    <div class="grid two">
      <section class="panel">
        <div class="panel-header"><div><h3>${t("advanced.runtime")}</h3><p>${t("setup.codeHint")}</p></div></div>
        <form id="runtimeForm" class="form">
          <label class="field"><span class="field-label">${t("label.execution")}</span><select name="execution"><option value="dry-run">${esc(labelExecution("dry-run"))}</option><option value="cli">${esc(labelExecution("cli"))}</option><option value="app-server">${esc(labelExecution("app-server"))}</option></select></label>
          <button class="button primary" type="submit">${t("button.save")}</button>
        </form>
      </section>
      <section class="panel">
        <div class="panel-header"><div><h3>${t("advanced.access")}</h3><p class="danger-text">${t("advanced.fullWarning")}</p></div></div>
        <form id="accessForm" class="form">
          <label class="field"><span class="field-label">${t("label.permission")}</span><select name="permissionMode"><option value="read_only">${esc(labelPermission("read_only"))}</option><option value="manual_review">${esc(labelPermission("manual_review"))}</option><option value="auto_review">${esc(labelPermission("auto_review"))}</option><option value="full_access">${esc(labelPermission("full_access"))}</option></select></label>
          <label class="field"><span class="field-label">${t("advanced.confirmFull")}</span><input name="confirmFullAccess" placeholder="${t("placeholder.fullConfirm")}"></label>
          <button class="button danger" type="submit">${t("button.save")}</button>
        </form>
        <div class="item-list" style="margin-top:12px">
          ${permissionModeInfo().map(([mode, text]) => `<div class="item"><div class="item-title">${esc(labelPermission(mode))}</div><div class="item-meta">${esc(text)}</div></div>`).join("")}
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><div><h3>${t("advanced.repair")}</h3><p>${t("button.createRepair")}</p></div></div>
        <form id="repairForm" class="form">
          <label class="field"><span class="field-label">${t("field.errorSummary")}</span><input name="errorSummary" required></label>
          <label class="field"><span class="field-label">${t("field.diagnosis")}</span><textarea name="conciseDiagnosis" required></textarea></label>
          <label class="field"><span class="field-label">${t("field.solution")}</span><textarea name="solution" required></textarea></label>
          <label class="field"><span class="field-label">${t("field.plan")}</span><textarea name="executionPlan" placeholder="${t("placeholder.planLines")}" required></textarea></label>
          <button class="button primary" type="submit">${t("button.createRepair")}</button>
        </form>
      </section>
      <section class="panel">
        <div class="panel-header"><div><h3>${t("advanced.review")}</h3><p>${t("advanced.reviewHint")}</p></div></div>
        <form id="reviewForm" class="form">
          <label class="field"><span class="field-label">${t("field.title")}</span><input name="title" value="${t("placeholder.reviewTitle")}" required></label>
          <label class="field"><span class="field-label">${t("field.webSummary")}</span><textarea name="webSummary"></textarea></label>
          <label class="field"><span class="field-label">${t("field.codexSummary")}</span><textarea name="codexSummary"></textarea></label>
          <button class="button secondary" type="submit">${t("advanced.review")}</button>
        </form>
        <div class="item-list" style="margin-top:12px">${state.reviews.map((item) => `<div class="item"><div class="item-title">${esc(item.title)} <span class="chip">${esc(item.status)}</span></div><div class="item-meta">${esc(item.id)} · ${item.roundsUsed}/${item.maxRounds}</div></div>`).join("") || `<div class="muted">${t("empty.items")}</div>`}</div>
      </section>
    </div>
  `;
}

function diffToHtml(diff) {
  const text = (diff.files || []).map((file) => file.diff).join("\n\n");
  return text.split("\n").map((line) => {
    const cls = line.startsWith("+") ? "add" : line.startsWith("-") ? "remove" : line.startsWith("@@") || line.startsWith("---") || line.startsWith("+++") ? "header" : "";
    return `<div class="diff-line ${cls}">${esc(line)}</div>`;
  }).join("");
}

function bind() {
  app.onclick = async (event) => {
    const target = event.target.closest("button, [data-view], [data-open-folder], [data-project-id]");
    if (!target) return;
    if (target.tagName === "BUTTON" && target.type === "submit" && target.form) return;
    const view = target.getAttribute("data-view");
    if (view) {
      state.view = view;
      render();
      return;
    }
    const lang = target.getAttribute("data-lang");
    if (lang) {
      state.lang = lang;
      localStorage.setItem(STORAGE.language, lang);
      render();
      return;
    }
    const folder = target.getAttribute("data-open-folder");
    if (folder !== null) {
      await openFolder(folder);
      return;
    }
    const projectId = target.getAttribute("data-project-id");
    if (projectId) {
      state.projectId = projectId;
      localStorage.setItem(STORAGE.projectId, projectId);
      render();
      return;
    }
    await handleAction(target);
  };

  app.onsubmit = async (event) => {
    event.preventDefault();
    await handleSubmit(event.target);
  };

  const projectSelect = document.getElementById("projectSelect");
  if (projectSelect) {
    projectSelect.onchange = () => {
      state.projectId = projectSelect.value;
      localStorage.setItem(STORAGE.projectId, state.projectId);
      render();
    };
  }

  const runtimeSelect = document.querySelector("#runtimeForm select[name='execution']");
  if (runtimeSelect && state.config?.execution) runtimeSelect.value = state.config.execution;
  const permissionSelect = document.querySelector("#accessForm select[name='permissionMode']");
  if (permissionSelect && state.config?.settings?.permissionMode) permissionSelect.value = state.config.settings.permissionMode;
  const fileInput = document.querySelector('#fileReadForm input[name="filePath"]');
  if (fileInput) {
    fileInput.oninput = () => {
      state.filePath = fileInput.value;
    };
  }
}

async function handleAction(target) {
  const action = target.getAttribute("data-action");
  try {
    if (action === "toggle-sidebar") {
      state.collapsed = !state.collapsed;
      localStorage.setItem(STORAGE.sidebar, state.collapsed ? "1" : "0");
      render();
    } else if (action === "refresh") {
      await loadAll(true);
    } else if (action === "test") {
      await testConnection();
    } else if (action === "save-connection") {
      state.baseUrl = normalizeBaseUrl(document.getElementById("baseUrlInput").value);
      state.publicBaseUrl = document.getElementById("publicBaseInput").value.trim();
      localStorage.setItem(STORAGE.baseUrl, state.baseUrl);
      localStorage.setItem(STORAGE.publicBaseUrl, state.publicBaseUrl);
      setAlert("success", t("msg.saved"));
    } else if (action === "copy-code") {
      await copyText(state.pairingCode);
    } else if (action === "copy-mcp") {
      const base = state.publicBaseUrl || state.baseUrl;
      await copyText(`${normalizeBaseUrl(base)}/mcp`);
    } else if (action === "regenerate-code") {
      const body = await api("/config/runtime", { method: "POST", body: JSON.stringify({ regenerateToken: true }) });
      state.pairingCode = body.token || state.pairingCode;
      localStorage.setItem(STORAGE.code, state.pairingCode);
      setAlert("success", t("msg.codeRegenerated"));
      await loadAll();
    } else if (action === "load-roots") {
      await loadRoots();
    } else if (action === "select-current") {
      await selectProject(state.browser.currentPath);
    } else if (action === "inspect") {
      await inspectProject();
    } else if (action === "load-tree") {
      await loadTree();
    } else if (action === "read-file") {
      const input = document.querySelector('#fileReadForm input[name="filePath"]');
      await readFile(input && input.value ? input.value : state.filePath);
    } else if (action === "context-pack") {
      await createContextPack();
    } else if (action === "load-logs") {
      await loadLogs();
    } else if (action === "copy-logs") {
      await copyText(JSON.stringify(state.logs, null, 2));
    } else if (action === "latest-error") {
      await analyzeLatestError();
    } else if (action === "load-mcp-tools") {
      state.mcpTools = await mcpListTools();
      setAlert("success", `${state.lang === "zh" ? "MCP 工具数量" : "MCP tools"}: ${state.mcpTools.length}`);
      render();
    } else if (target.dataset.patchDiff) {
      const body = await api(`/web-patches/${target.dataset.patchDiff}/diff`);
      state.diffHtml = diffToHtml(body.diff);
      render();
    } else if (target.dataset.patchApply) {
      if (confirm(t("msg.confirmApply"))) await api(`/web-patches/${target.dataset.patchApply}/apply`, { method: "POST", body: JSON.stringify({ confirm: true }) });
      await loadAll();
    } else if (target.dataset.patchRevert) {
      if (confirm(t("msg.confirmRevert"))) await api(`/web-patches/${target.dataset.patchRevert}/revert`, { method: "POST", body: JSON.stringify({ confirm: true }) });
      await loadAll();
    } else if (target.dataset.patchReject) {
      if (confirm(t("msg.confirmReject"))) await api(`/web-patches/${target.dataset.patchReject}/reject`, { method: "POST", body: JSON.stringify({ reason: "Rejected in dashboard" }) });
      await loadAll();
    } else if (target.dataset.patchReview) {
      await api(`/web-patches/${target.dataset.patchReview}/create-codex-review-job`, { method: "POST", body: JSON.stringify({ runImmediately: false }) });
      await loadAll();
    } else if (target.dataset.jobApprove) {
      await api(`/codex/jobs/${target.dataset.jobApprove}/approve`, { method: "POST", body: JSON.stringify({ runNow: true }) });
      await loadAll();
    } else if (target.dataset.jobRun) {
      await api(`/codex/jobs/${target.dataset.jobRun}/run`, { method: "POST", body: JSON.stringify({}) });
      await loadAll();
    } else if (target.dataset.approval) {
      await api(`/codex/approvals/${target.dataset.approval}/decision`, { method: "POST", body: JSON.stringify({ decision: target.dataset.decision }) });
      await loadAll();
    } else if (target.dataset.repairApprove) {
      await api(`/repairs/${target.dataset.repairApprove}/approve`, { method: "POST", body: JSON.stringify({ runNow: true }) });
      await loadAll();
    } else if (target.dataset.repairReject) {
      await api(`/repairs/${target.dataset.repairReject}/reject`, { method: "POST", body: JSON.stringify({ reason: "Rejected in dashboard" }) });
      await loadAll();
    }
  } catch (error) {
    handleError(error);
  }
}

async function handleSubmit(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    if (form.id === "manualProjectForm") {
      await selectProject(data.path, data.displayName);
    } else if (form.id === "fileReadForm") {
      await readFile(data.filePath);
    } else if (form.id === "patchForm") {
      await ensureProject();
      await api("/web-patches", {
        method: "POST",
        body: JSON.stringify({
          projectId: currentProjectId(),
          title: data.title,
          rationale: data.rationale || "",
          changes: [{ filePath: data.filePath, mode: data.mode || "overwrite", content: data.content || "" }]
        })
      });
      setAlert("success", t("msg.patchCreated"));
      await loadAll();
    } else if (form.id === "jobForm") {
      await ensureProject();
      await api("/codex/jobs", {
        method: "POST",
        body: JSON.stringify({
          projectId: currentProjectId(),
          title: data.title,
          task: data.task,
          roles: String(data.roles || "").split(",").map((role) => role.trim()).filter(Boolean),
          safetyLevel: Number(data.safetyLevel || 1),
          runImmediately: false
        })
      });
      setAlert("success", t("msg.jobCreated"));
      await loadAll();
    } else if (form.id === "screenshotForm") {
      await ensureProject();
      await api(`/projects/${currentProjectId()}/ui/screenshot-review-job`, {
        method: "POST",
        body: JSON.stringify({ url: data.devServerUrl, notes: data.route, runImmediately: false })
      });
      setAlert("success", t("msg.jobCreated"));
      await loadAll();
    } else if (form.id === "logFilterForm") {
      await loadLogs(data.level, data.requestId);
    } else if (form.id === "runtimeForm") {
      await api("/config/runtime", { method: "POST", body: JSON.stringify({ execution: data.execution }) });
      setAlert("success", t("msg.saved"));
      await loadAll();
    } else if (form.id === "accessForm") {
      await api("/config/access-mode", { method: "POST", body: JSON.stringify({ permissionMode: data.permissionMode, confirmFullAccess: data.confirmFullAccess }) });
      setAlert("success", t("msg.modeChanged", { mode: data.permissionMode }));
      await loadAll();
    } else if (form.id === "repairForm") {
      await api("/repairs", {
        method: "POST",
        body: JSON.stringify({
          projectId: currentProjectId() || undefined,
          sourceKind: "manual",
          errorSummary: data.errorSummary,
          conciseDiagnosis: data.conciseDiagnosis,
          solution: data.solution,
          executionPlan: String(data.executionPlan || "").split("\n").map((line) => line.trim()).filter(Boolean),
          safetyLevel: 2
        })
      });
      setAlert("success", t("msg.repairCreated"));
      await loadAll();
    } else if (form.id === "reviewForm") {
      await ensureProject();
      await api("/reviews", {
        method: "POST",
        body: JSON.stringify({ projectId: currentProjectId(), title: data.title, webSummary: data.webSummary, codexSummary: data.codexSummary, maxRounds: 2 })
      });
      await loadAll();
    }
  } catch (error) {
    handleError(error);
  }
}

async function ensureProject() {
  if (!currentProjectId()) throw { message: t("error.needProject") };
}

async function loadRoots() {
  const body = await api("/fs/roots");
  state.browser = { roots: body.roots || [], directories: [], currentPath: "", parentPath: null };
  render();
}

async function openFolder(folder) {
  const body = await api(`/fs/list?path=${encodeURIComponent(folder)}`);
  state.browser = body;
  render();
}

async function selectProject(folder, displayName = "") {
  const body = await api("/projects/select", { method: "POST", body: JSON.stringify({ path: folder, displayName }) });
  state.projectId = body.project.id;
  localStorage.setItem(STORAGE.projectId, state.projectId);
  setAlert("success", t("msg.projectSelected", { name: body.project.name }));
  await loadAll();
}

async function inspectProject() {
  await ensureProject();
  const body = await api(`/projects/${currentProjectId()}/inspect`);
  state.projectDetail = JSON.stringify(body, null, 2);
  render();
}

async function loadTree() {
  await ensureProject();
  const body = await api(`/projects/${currentProjectId()}/tree?limit=500`);
  state.treeText = (body.entries || []).map((entry) => `${entry.type === "dir" ? "[dir] " : "      "}${entry.path}`).join("\n");
  render();
}

async function readFile(filePath) {
  await ensureProject();
  const body = await api(`/projects/${currentProjectId()}/files/read?path=${encodeURIComponent(filePath)}`);
  state.filePath = filePath;
  state.fileContent = body.file?.content || "";
  setAlert("success", t("msg.fileLoaded"));
  render();
}

async function createContextPack() {
  await ensureProject();
  const paths = state.filePath ? [state.filePath] : [];
  const body = await api(`/projects/${currentProjectId()}/context-pack`, {
    method: "POST",
    body: JSON.stringify({ paths, includeTree: true, includeGitStatus: true, includeDiff: true })
  });
  state.contextPack = body.markdown || "";
  setAlert("success", t("msg.packCreated"));
  render();
}

async function loadLogs(level = "", requestId = "") {
  const params = new URLSearchParams({ limit: "150" });
  if (level) params.set("level", level);
  const body = await api(`/logs?${params.toString()}`);
  state.logs = (body.logs || []).filter((log) => !requestId || log.requestId === requestId || JSON.stringify(log).includes(requestId));
  render();
}

async function analyzeLatestError() {
  const body = await api("/errors/latest?limit=1");
  const log = body.errors?.[0];
  if (!log) {
    state.latestErrorAnalysis = { message: t("empty.items") };
  } else {
    state.latestErrorAnalysis = {
      requestId: log.requestId,
      endpoint: log.scope,
      errorSummary: log.message,
      likelyCause: log.message,
      suggestedNextActions: [t("button.createRepair"), t("nav.logs")]
    };
    const formValues = { errorSummary: log.message };
    Object.assign(formValues, {});
  }
  render();
}

render();
bootstrap().then(loadRoots).catch(handleError);
