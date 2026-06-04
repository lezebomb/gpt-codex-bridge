const STORAGE = {
  language: "bridge_language",
  sidebar: "bridge_sidebar_collapsed",
  projectId: "bridge_project_id"
};

const NAV = [
  ["setup", "S"],
  ["project", "P"],
  ["tasks", "T"],
  ["approvals", "A"],
  ["logs", "L"],
  ["mcp", "M"],
  ["executors", "E"],
  ["advanced", "G"]
];

const I18N = {
  zh: {
    brandTitle: "本地 Bridge",
    brandSubtitle: "ChatGPT 网页端主控 GPT 的本地能力层",
    topTitle: "ChatGPT Web-first Bridge",
    topSubtitle: "主界面是 ChatGPT 网页端，本页是本地 Bridge 控制面板，负责连接、项目、审批、日志、MCP 插件和执行器。",
    setup: "Setup",
    project: "项目",
    tasks: "任务",
    approvals: "审批",
    logs: "日志",
    mcp: "MCP Center",
    executors: "Executors",
    advanced: "Advanced",
    refresh: "刷新",
    testConnection: "测试连接",
    chinese: "中文",
    english: "English",
    copy: "复制",
    setupTitle: "连接向导",
    setupSubtitle: "先让本地 Bridge 跑起来，再把 /mcp 地址和本地配对码填进 ChatGPT 自定义 MCP。",
    setupNotice: "第一屏说明：主界面是 ChatGPT 网页端，本页不是 IDE，也不是主工作台。",
    projectTitle: "项目",
    projectSubtitle: "用文件管理器式浏览器挑选项目目录。Bridge 只会读写已注册项目根目录内的相对路径。",
    tasksTitle: "任务",
    tasksSubtitle: "先创建 taskId，再决定走 WebAgent、Codex、Hybrid 还是 External。新对话继续任务时应先读 get_task，而不是凭记忆。",
    approvalsTitle: "审批",
    approvalsSubtitle: "需要人确认的补丁、执行任务、Shell 命令和修复提案会出现在这里。",
    logsTitle: "日志",
    logsSubtitle: "所有 REST、MCP、执行器和错误事件都会写入统一 JSONL 日志。出错时先记下 requestId。",
    mcpTitle: "MCP Center",
    mcpSubtitle: "Bridge 自己就是你的 MCP 入口，同时统一管理文件、Git、Codex、Playwright 和预留插件。",
    executorsTitle: "执行器",
    executorsSubtitle: "默认是 WebAgent 省额度。复杂任务切换 Codex，审查型流程可用 Hybrid，第三方 CLI 走 External 预留配置。",
    advancedTitle: "高级",
    advancedSubtitle: "切换执行模式、权限模式、查看诊断包，并处理修复中心等底层控制。",
    noData: "暂无数据。",
    currentProject: "当前项目",
    browseRoots: "常用位置",
    browseDirs: "当前位置子目录",
    open: "打开",
    register: "注册项目",
    inspect: "检查项目",
    readFile: "读取文件",
    createTask: "创建任务",
    createPatch: "创建补丁草稿",
    createPack: "创建上下文包",
    createJob: "创建执行任务",
    apply: "应用",
    revert: "回滚",
    reject: "拒绝",
    approveRun: "批准并运行",
    loadLogs: "读取日志",
    loadBundle: "读取诊断包",
    save: "保存",
    copied: "已复制。",
    connected: "连接成功。",
    requestFailed: "请求失败"
  },
  en: {
    brandTitle: "Local Bridge",
    brandSubtitle: "The local capability layer behind your ChatGPT web orchestrator",
    topTitle: "ChatGPT Web-first Bridge",
    topSubtitle: "Your main workspace is ChatGPT Web. This local panel handles setup, projects, approvals, logs, MCP plugins, and executor controls.",
    setup: "Setup",
    project: "Project",
    tasks: "Tasks",
    approvals: "Approvals",
    logs: "Logs",
    mcp: "MCP Center",
    executors: "Executors",
    advanced: "Advanced",
    refresh: "Refresh",
    testConnection: "Test Connection",
    chinese: "中文",
    english: "English",
    copy: "Copy",
    setupTitle: "Setup",
    setupSubtitle: "Start the local bridge first, then use the /mcp endpoint and pairing code in ChatGPT Custom MCP.",
    setupNotice: "First-screen note: the main workspace is ChatGPT Web. This page is the local bridge control panel, not the primary IDE.",
    projectTitle: "Project",
    projectSubtitle: "Pick a project through a file-manager style browser. The bridge only reads and writes inside registered project roots.",
    tasksTitle: "Tasks",
    tasksSubtitle: "Create a task first, then choose WebAgent, Codex, Hybrid, or External. New conversations should resume with get_task instead of memory.",
    approvalsTitle: "Approvals",
    approvalsSubtitle: "Anything that needs a human decision appears here: patches, execution jobs, shell commands, and repair proposals.",
    logsTitle: "Logs",
    logsSubtitle: "Every REST, MCP, executor, and error event lands in the shared JSONL logs. When something fails, start with requestId.",
    mcpTitle: "MCP Center",
    mcpSubtitle: "The bridge is your MCP entry point and the manager for filesystem, Git, Codex, Playwright, and optional plugins.",
    executorsTitle: "Executors",
    executorsSubtitle: "WebAgent saves Codex quota. Codex is for harder engineering tasks. Hybrid mixes both. External is a dry-run stub for third-party CLIs.",
    advancedTitle: "Advanced",
    advancedSubtitle: "Switch execution mode, change permission mode, read diagnostics, and inspect the lower-level runtime controls.",
    noData: "No data yet.",
    currentProject: "Current project",
    browseRoots: "Common roots",
    browseDirs: "Directories",
    open: "Open",
    register: "Register",
    inspect: "Inspect",
    readFile: "Read File",
    createTask: "Create Task",
    createPatch: "Create Patch",
    createPack: "Create Context Pack",
    createJob: "Create Execution Job",
    apply: "Apply",
    revert: "Revert",
    reject: "Reject",
    approveRun: "Approve and Run",
    loadLogs: "Load Logs",
    loadBundle: "Load Support Bundle",
    save: "Save",
    copied: "Copied.",
    connected: "Connected.",
    requestFailed: "Request failed"
  }
};

const state = {
  view: "setup",
  language: localStorage.getItem(STORAGE.language) || "zh",
  sidebarCollapsed: localStorage.getItem(STORAGE.sidebar) === "true",
  token: "",
  bootstrap: null,
  config: null,
  projects: [],
  projectId: localStorage.getItem(STORAGE.projectId) || "",
  projectInspect: null,
  projectIndex: null,
  fileContent: "",
  browse: { currentPath: "", roots: [], directories: [], parentPath: null },
  tasks: [],
  taskBranches: [],
  taskDetail: null,
  patches: [],
  executionJobs: [],
  approvals: null,
  logs: [],
  logFilters: { requestId: "" },
  mcpCenter: null,
  executors: null,
  diagnostics: null,
  alert: null
};

function t(key) {
  return I18N[state.language][key] || key;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setAlert(type, message) {
  state.alert = { type, message };
  render();
}

function clearAlert() {
  state.alert = null;
}

async function api(route, options = {}, auth = true) {
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  if (auth && state.token) headers.Authorization = `Bearer ${state.token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(route, {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    const error = new Error(body.message || body.error || `${t("requestFailed")}: ${response.status}`);
    error.requestId = body.requestId;
    throw error;
  }
  return body;
}

async function bootstrap() {
  state.bootstrap = await api("/bootstrap", {}, false);
  state.token = state.bootstrap.token;
  await refreshCore();
}

async function refreshCore() {
  const [config, projects, approvals, mcpCenter, executors] = await Promise.all([
    api("/config"),
    api("/projects"),
    api("/approvals"),
    api("/mcp-center"),
    api("/executors")
  ]);
  state.config = config;
  state.projects = projects.projects || [];
  state.approvals = approvals;
  state.mcpCenter = mcpCenter;
  state.executors = executors;
  if (!state.projectId && state.projects[0]) {
    state.projectId = state.projects[0].id;
    localStorage.setItem(STORAGE.projectId, state.projectId);
  }
  await Promise.all([loadTasks(), loadTaskBranches(), loadPatches(), loadExecutionJobs(), loadBrowse()]);
  if (state.projectId) {
    await Promise.all([loadProjectInspect(state.projectId), loadProjectIndexStatus(state.projectId)]);
  }
  render();
}

async function loadBrowse(pathValue = "") {
  const query = pathValue ? `?path=${encodeURIComponent(pathValue)}` : "";
  state.browse = await api(`/fs/list${query}`);
  render();
}

async function loadProjectInspect(projectId) {
  if (!projectId) return;
  state.projectInspect = await api(`/projects/${projectId}/inspect`);
  render();
}

async function loadProjectIndexStatus(projectId) {
  if (!projectId) {
    state.projectIndex = null;
    render();
    return;
  }
  const body = await api(`/projects/${projectId}/index-status`);
  state.projectIndex = body.index || null;
  render();
}

async function loadApprovals() {
  state.approvals = await api("/approvals");
  render();
}

async function loadTasks() {
  const query = state.projectId ? `?projectId=${encodeURIComponent(state.projectId)}` : "";
  const body = await api(`/tasks${query}`);
  state.tasks = body.tasks || [];
  render();
}

async function loadTaskBranches() {
  const query = state.projectId ? `?projectId=${encodeURIComponent(state.projectId)}` : "";
  const body = await api(`/task-branches${query}`);
  state.taskBranches = body.taskBranches || [];
  render();
}

async function loadPatches() {
  const body = await api("/web-patches");
  state.patches = body.patches || [];
  render();
}

async function loadExecutionJobs() {
  const body = await api("/execution-jobs");
  state.executionJobs = body.jobs || [];
  render();
}

async function loadLogs() {
  const params = new URLSearchParams({ limit: "80" });
  if (state.logFilters.requestId) params.set("requestId", state.logFilters.requestId.trim());
  const body = await api(`/logs?${params.toString()}`);
  state.logs = body.logs || [];
  render();
}

async function loadDiagnostics() {
  state.diagnostics = await api("/support-bundle");
  render();
}

function pageSetup() {
  const setup = state.bootstrap || {};
  return `
    <section class="page-header">
      <div>
        <h2>${t("setupTitle")}</h2>
        <p>${t("setupSubtitle")}</p>
      </div>
      <div class="toolbar">
        <button class="secondary-button" data-action="test-connection">${t("testConnection")}</button>
      </div>
    </section>
    <div class="grid two">
      <article class="card notice-card">
        <h3>${t("setupNotice")}</h3>
        <p>${escapeHtml(state.config ? `Run mode: ${state.config.execution}; Permission mode: ${state.config.settings.permissionMode}` : "")}</p>
      </article>
      <article class="card">
        <h3>Quick Status</h3>
        <dl class="kv">
          <dt>Dashboard</dt>
          <dd>${escapeHtml((serviceUrl() || "") + "/dashboard/")}</dd>
          <dt>MCP</dt>
          <dd>${escapeHtml((serviceUrl() || "") + "/mcp")}</dd>
          <dt>Cloudflare</dt>
          <dd>https://bridge.your-domain.com/mcp</dd>
          <dt>Auth</dt>
          <dd>Local pairing code</dd>
          <dt>Local pairing code</dt>
          <dd><code>${escapeHtml(setup.token || "")}</code></dd>
        </dl>
      </article>
    </div>
    <div class="grid two">
      <article class="card">
        <h3>Windows PowerShell</h3>
        <pre>cd .\\bridge
npm.cmd install --no-audit --no-fund
npm.cmd run dev</pre>
      </article>
      <article class="card">
        <h3>ChatGPT Custom MCP</h3>
        <pre>1. Expose http://localhost:8787 with Cloudflare Tunnel
2. Use https://your-domain/mcp
3. Choose Local pairing code
4. Paste the local pairing code shown here
5. Start each conversation with get_bridge_status</pre>
      </article>
    </div>
  `;
}

function projectOptions() {
  return state.projects.map((project) => `<option value="${project.id}" ${project.id === state.projectId ? "selected" : ""}>${escapeHtml(project.name)}</option>`).join("");
}

function renderBrowseItems(items, allowRegister = false) {
  if (!items.length) return `<div class="empty">${t("noData")}</div>`;
  return `<div class="browser-list">${items.map((item) => `
    <div class="browser-item">
      <div class="browser-meta">
        <strong>${escapeHtml(item.name)}</strong>
        <div class="browser-path">${escapeHtml(item.path)}</div>
      </div>
      <div class="item-actions">
        <button class="ghost-button" data-open-path="${escapeHtml(item.path)}">${t("open")}</button>
        ${allowRegister ? `<button class="secondary-button" data-register-path="${escapeHtml(item.path)}">${t("register")}</button>` : ""}
      </div>
    </div>`).join("")}</div>`;
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function getTaskBranches(taskId) {
  return state.taskBranches.filter((branch) => branch.taskId === taskId);
}

function taskBranchOptions(taskId = "") {
  const branches = taskId ? getTaskBranches(taskId) : state.taskBranches;
  return branches.map((branch) => `<option value="${branch.id}">${escapeHtml(branch.branchName)} (${escapeHtml(branch.executorMode)})</option>`).join("");
}

function renderTaskBranches(task) {
  const branches = getTaskBranches(task.id);
  if (!branches.length) return `<div class="empty">No branches yet.</div>`;
  return `<div class="items">${branches.map((branch) => `
    <div class="item">
      <header>
        <div>
          <h4>${escapeHtml(branch.branchName)}</h4>
          <p>${escapeHtml(branch.branchGoal || "")}</p>
        </div>
        <span class="pill-status ${branch.status}">${escapeHtml(branch.status)}</span>
      </header>
      <div class="stack">
        <span class="tag">executor: ${escapeHtml(branch.executorMode)}</span>
        <span class="tag">${branch.executorLocked ? "locked" : "switchable"}</span>
        ${task.activeTaskBranchId === branch.id ? `<span class="tag">active branch</span>` : ""}
        ${branch.touchedFiles.map((filePath) => `<span class="tag">${escapeHtml(filePath)}</span>`).join("")}
      </div>
      <p style="margin: 12px 0 0;">${escapeHtml(branch.executorDecisionReason || "")}</p>
      <div class="item-actions" style="margin-top: 12px;">
        ${task.activeTaskBranchId === branch.id ? "" : `<button class="secondary-button" data-set-active-branch="${branch.id}" data-task-id="${task.id}">Set Active</button>`}
        <button class="ghost-button" data-continue-branch="${branch.id}">Continue</button>
        <button class="ghost-button" data-branch-conflicts="${branch.id}">Conflicts</button>
        <button class="ghost-button" data-branch-detail="${branch.id}">Detail</button>
      </div>
    </div>
  `).join("")}</div>`;
}

function pageProject() {
  const inspect = state.projectInspect?.project;
  const index = state.projectIndex;
  return `
    <section class="page-header">
      <div>
        <h2>${t("projectTitle")}</h2>
        <p>${t("projectSubtitle")}</p>
      </div>
      <div class="toolbar">
        <select id="projectSelect">${projectOptions()}</select>
        <button class="secondary-button" data-action="inspect-project">${t("inspect")}</button>
      </div>
    </section>
    <div class="grid two">
      <article class="card">
        <h3>${t("browseRoots")}</h3>
        ${renderBrowseItems(state.browse.roots || [], true)}
      </article>
      <article class="card">
        <h3>${t("browseDirs")}</h3>
        <div class="inline-row" style="margin-bottom: 12px;">
          ${state.browse.parentPath ? `<button class="ghost-button" data-open-path="${escapeHtml(state.browse.parentPath)}">..</button>` : ""}
          <span class="tag">${escapeHtml(state.browse.currentPath || "/")}</span>
        </div>
        ${renderBrowseItems(state.browse.directories || [], true)}
      </article>
    </div>
    <div class="grid two">
      <article class="card">
        <h3>${t("currentProject")}</h3>
        ${inspect ? `
          <div class="stack" style="margin-bottom: 12px;">${(inspect.techStack || []).map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</div>
          <pre>${escapeHtml(JSON.stringify({
            name: inspect.project.name,
            path: inspect.project.path,
            treePreview: (inspect.tree || []).slice(0, 30),
            gitStatus: inspect.gitStatus?.stdout || "",
            instructions: (inspect.instructions || []).map((item) => ({ path: item.path, scope: item.scope }))
          }, null, 2))}</pre>
        ` : `<div class="empty">${t("noData")}</div>`}
      </article>
      <article class="card">
        <h3>Context Index</h3>
        ${state.projectId ? `
          <div class="stack" style="margin-bottom: 12px;">
            <span class="tag">status: ${escapeHtml(index?.status || "missing")}</span>
            <span class="tag">files: ${escapeHtml(index?.indexedFiles ?? 0)}</span>
            <span class="tag">providers: ${escapeHtml((index?.enabledProviders || []).join(", ") || "none")}</span>
          </div>
          <p>Last indexed: ${escapeHtml(formatDateTime(index?.lastIndexedAt) || "not yet")}</p>
          ${index?.staleFiles?.length ? `<p>Stale files: ${escapeHtml(index.staleFiles.slice(0, 6).join(", "))}</p>` : ""}
          <div class="item-actions" style="margin-top: 12px;">
            <button class="secondary-button" data-action="index-project">Index Project</button>
            <button class="ghost-button" data-action="refresh-index">Refresh Index</button>
          </div>
        ` : `<div class="empty">${t("noData")}</div>`}
      </article>
      <article class="card">
        <h3>${t("readFile")}</h3>
        <form id="readFileForm">
          <label>Relative path<input name="path" placeholder="src/App.tsx" /></label>
          <button class="primary-button" type="submit">${t("readFile")}</button>
        </form>
        <div style="margin-top: 14px;"><pre id="fileContentPre">${escapeHtml(state.fileContent || "")}</pre></div>
      </article>
    </div>
  `;
}

function pageTasks() {
  return `
    <section class="page-header">
      <div>
        <h2>${t("tasksTitle")}</h2>
        <p>${t("tasksSubtitle")}</p>
      </div>
      <div class="toolbar">
        <button class="secondary-button" data-action="reload-tasks">${t("refresh")}</button>
      </div>
    </section>
    <div class="grid two">
      <article class="card">
        <h3>${t("createTask")}</h3>
        <form id="taskForm">
          <label>Title<input name="taskTitle" placeholder="v2 MCP routing polish" /></label>
          <label>Goal<textarea name="taskGoal" placeholder="Refactor the MCP task flow and keep the dashboard buildable."></textarea></label>
          <label>Target files<input name="targetFiles" placeholder="src/server.ts, public/app.js" /></label>
          <label>Executor mode
            <select name="executorMode">
              <option value="">auto</option>
              <option value="webagent">webagent</option>
              <option value="codex">codex</option>
              <option value="hybrid">hybrid</option>
              <option value="external">external</option>
            </select>
          </label>
          <label>Executor policy
            <select name="executorPolicy">
              <option value="">save_codex_quota</option>
              <option value="save_codex_quota">save_codex_quota</option>
              <option value="best_result">best_result</option>
              <option value="fast">fast</option>
              <option value="manual">manual</option>
            </select>
          </label>
          <button class="primary-button" type="submit">${t("createTask")}</button>
        </form>
      </article>
      <article class="card">
        <h3>${t("createPatch")}</h3>
        <form id="patchForm">
          <label>Task
            <select name="taskId">
              <option value="">optional</option>
              ${state.tasks.map((task) => `<option value="${task.id}">${escapeHtml(task.taskTitle)}</option>`).join("")}
            </select>
          </label>
          <label>Task branch
            <select name="taskBranchId">
              <option value="">active branch</option>
              ${taskBranchOptions()}
            </select>
          </label>
          <label>Title<input name="title" placeholder="Update README copy" /></label>
          <label>File path<input name="filePath" placeholder="README.md" /></label>
          <label>Mode
            <select name="mode">
              <option value="overwrite">overwrite</option>
              <option value="create">create</option>
            </select>
          </label>
          <label>Rationale<textarea name="rationale" placeholder="Explain why this bounded patch is safe."></textarea></label>
          <label>Content<textarea name="content" placeholder="Full file content"></textarea></label>
          <button class="primary-button" type="submit">${t("createPatch")}</button>
        </form>
      </article>
    </div>
    <div class="grid two">
      <article class="card">
        <h3>Tasks</h3>
        <div class="items">
          ${state.tasks.length ? state.tasks.map((task) => `
            <div class="item">
              <header>
                <div>
                  <h4>${escapeHtml(task.taskTitle)}</h4>
                  <p>${escapeHtml(task.taskGoal)}</p>
                </div>
                <span class="pill-status ${task.status}">${escapeHtml(task.status)}</span>
              </header>
              <div class="stack">
                <span class="tag">mode: ${escapeHtml(task.executorMode)}</span>
                <span class="tag">policy: ${escapeHtml(task.executorPolicy)}</span>
                <span class="tag">${task.executorLocked ? "executor locked" : "executor switchable"}</span>
                ${task.activeTaskBranchId ? `<span class="tag">active: ${escapeHtml(getTaskBranches(task.id).find((branch) => branch.id === task.activeTaskBranchId)?.branchName || task.activeTaskBranchId)}</span>` : ""}
                ${task.recommendedNextAction ? `<span class="tag">next: ${escapeHtml(task.recommendedNextAction)}</span>` : ""}
                ${task.conflicts.map((conflict) => `<span class="tag">conflict: ${escapeHtml(conflict.filePath)}</span>`).join("")}
              </div>
              <p style="margin: 12px 0 0;">${escapeHtml(task.executorDecisionReason || "")}</p>
              <div class="item-actions" style="margin-top: 12px;">
                <button class="secondary-button" data-create-pack="${task.id}">${t("createPack")}</button>
                <button class="primary-button" data-create-job="${task.id}">${t("createJob")}</button>
                <button class="ghost-button" data-create-branch="${task.id}">New Branch</button>
                <button class="ghost-button" data-task-detail="${task.id}">Detail</button>
              </div>
              <div style="margin-top: 12px;">
                <h4>Branches</h4>
                ${renderTaskBranches(task)}
              </div>
            </div>
          `).join("") : `<div class="empty">${t("noData")}</div>`}
        </div>
      </article>
      <article class="card">
        <h3>Execution Jobs</h3>
        <div class="items">
          ${state.executionJobs.length ? state.executionJobs.map((job) => `
            <div class="item">
              <header>
                <div>
                  <h4>${escapeHtml(job.title)}</h4>
                  <p>${escapeHtml(job.result || job.packet?.relevantContextSummary || "")}</p>
                </div>
                <span class="pill-status ${job.status}">${escapeHtml(job.status)}</span>
              </header>
              <div class="stack">
                <span class="tag">${escapeHtml(job.executorMode)}</span>
                <span class="tag">${escapeHtml(job.executorPolicy)}</span>
                <span class="tag">safety: ${escapeHtml(job.safetyLevel)}</span>
              </div>
              <div class="item-actions" style="margin-top: 12px;">
                ${job.status === "needs_approval" ? `<button class="primary-button" data-approve-job="${job.id}">${t("approveRun")}</button>` : ""}
                ${job.status === "queued" ? `<button class="secondary-button" data-run-job="${job.id}">Run</button>` : ""}
                <button class="ghost-button" data-job-detail="${job.id}">Detail</button>
              </div>
            </div>
          `).join("") : `<div class="empty">${t("noData")}</div>`}
        </div>
      </article>
    </div>
    <div class="grid two">
      <article class="card">
        <h3>Patches</h3>
        <div class="items">
          ${state.patches.length ? state.patches.map((patch) => `
            <div class="item">
              <header>
                <div>
                  <h4>${escapeHtml(patch.title)}</h4>
                  <p>${escapeHtml(patch.rationale || "")}</p>
                </div>
                <span class="pill-status ${patch.status}">${escapeHtml(patch.status)}</span>
              </header>
              <div class="stack">${patch.changes.map((change) => `<span class="tag">${escapeHtml(change.filePath)}</span>`).join("")}</div>
              <div class="item-actions" style="margin-top: 12px;">
                <button class="ghost-button" data-patch-diff="${patch.id}">Diff</button>
              </div>
            </div>
          `).join("") : `<div class="empty">${t("noData")}</div>`}
        </div>
      </article>
      <article class="card">
        <h3>Selected Detail</h3>
        <pre id="taskDetailPre">${escapeHtml(state.taskDetail ? JSON.stringify(state.taskDetail, null, 2) : "")}</pre>
      </article>
    </div>
  `;
}

function pageApprovals() {
  const approvals = state.approvals || { patches: [], executionJobs: [], shellCommands: [], repairs: [] };
  const renderApprovalBlock = (title, items, renderActions) => `
    <article class="card">
      <h3>${title}</h3>
      <div class="items">
        ${items.length ? items.map((item) => `
          <div class="item">
            <header>
              <div>
                <h4>${escapeHtml(item.title || item.command || item.errorSummary || item.id)}</h4>
                <p>${escapeHtml(item.taskGoal || item.rationale || item.solution || item.command || "")}</p>
              </div>
              <span class="pill-status ${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
            </header>
            <div class="item-actions">${renderActions(item)}</div>
          </div>
        `).join("") : `<div class="empty">${t("noData")}</div>`}
      </div>
    </article>
  `;

  return `
    <section class="page-header">
      <div>
        <h2>${t("approvalsTitle")}</h2>
        <p>${t("approvalsSubtitle")}</p>
      </div>
      <div class="toolbar">
        <button class="secondary-button" data-action="refresh-approvals">${t("refresh")}</button>
      </div>
    </section>
    <div class="grid two">
      ${renderApprovalBlock("Patch Apply", approvals.patches || [], (item) => `
        <button class="primary-button" data-apply-patch="${item.id}">${t("apply")}</button>
        <button class="danger-button" data-reject-patch="${item.id}">${t("reject")}</button>
      `)}
      ${renderApprovalBlock("Execution Jobs", approvals.executionJobs || [], (item) => `
        <button class="primary-button" data-approve-job="${item.id}">${t("approveRun")}</button>
      `)}
      ${renderApprovalBlock("Shell Commands", approvals.shellCommands || [], (item) => `
        <button class="primary-button" data-approve-command="${item.id}">${t("approveRun")}</button>
      `)}
      ${renderApprovalBlock("Repairs", approvals.repairs || [], (item) => `
        <button class="secondary-button" data-approve-repair="${item.id}">${t("save")}</button>
      `)}
    </div>
  `;
}

function pageLogs() {
  return `
    <section class="page-header">
      <div>
        <h2>${t("logsTitle")}</h2>
        <p>${t("logsSubtitle")}</p>
      </div>
      <div class="toolbar">
        <button class="secondary-button" data-action="load-logs">${t("loadLogs")}</button>
      </div>
    </section>
    <article class="card">
      <form id="logFilterForm" style="margin-bottom: 16px;">
        <label>requestId<input name="requestId" value="${escapeHtml(state.logFilters.requestId || "")}" placeholder="Filter a failing requestId" /></label>
        <div class="item-actions" style="margin-top: 12px;">
          <button class="secondary-button" type="submit">${t("loadLogs")}</button>
          <button class="ghost-button" type="button" data-action="clear-log-filter">Clear</button>
        </div>
      </form>
      <div class="items">
        ${state.logs.length ? state.logs.map((entry) => `
          <div class="item">
            <header>
              <div>
                <h4>${escapeHtml(entry.action)}</h4>
                <p>${escapeHtml(entry.message)}</p>
              </div>
              <span class="pill-status ${entry.level}">${escapeHtml(entry.level)}</span>
            </header>
            <pre>${escapeHtml(JSON.stringify(entry, null, 2))}</pre>
          </div>
        `).join("") : `<div class="empty">${t("noData")}</div>`}
      </div>
    </article>
  `;
}

function renderPluginActions(plugin) {
  if (plugin.status === "built-in") {
    return `<button class="ghost-button" disabled>Always On</button>`;
  }
  if (plugin.status === "not_implemented") {
    return `<button class="ghost-button" disabled>Planned</button>`;
  }
  const pluginId = escapeHtml(plugin.id);
  const primary = plugin.enabled
    ? `<button class="secondary-button" data-plugin-disable="${pluginId}">Disable</button>`
    : `<button class="secondary-button" data-plugin-enable="${pluginId}">Enable</button>`;
  return `${primary}<button class="ghost-button" data-plugin-configure="${pluginId}">Configure</button>`;
}

function pageMcp() {
  const summary = state.mcpCenter?.summary || { plugins: [] };
  const tools = state.mcpCenter?.tools || [];
  return `
    <section class="page-header">
      <div>
        <h2>${t("mcpTitle")}</h2>
        <p>${t("mcpSubtitle")}</p>
      </div>
      <div class="toolbar">
        <button class="secondary-button" data-action="refresh-core">${t("refresh")}</button>
      </div>
    </section>
    <div class="grid two">
      <article class="card">
        <h3>Plugins</h3>
        <div class="items">
          ${summary.plugins?.length ? summary.plugins.map((plugin) => `
            <div class="item">
              <header>
                <div>
                  <h4>${escapeHtml(plugin.name)}</h4>
                  <p>${escapeHtml(plugin.description)}</p>
                </div>
                <span class="pill-status ${escapeHtml(plugin.status)}">${escapeHtml(plugin.status)}</span>
              </header>
              <div class="stack">
                <span class="tag">read: ${plugin.canReadFiles ? "yes" : "no"}</span>
                <span class="tag">risk: ${escapeHtml(plugin.risk)}</span>
                <span class="tag">net: ${plugin.canAccessNetwork ? "yes" : "no"}</span>
                <span class="tag">write: ${plugin.canWriteFiles ? "yes" : "no"}</span>
                <span class="tag">token: ${plugin.needsToken ? "yes" : "no"}</span>
                <span class="tag">enabled: ${plugin.enabled ? "yes" : "no"}</span>
                <span class="tag">config: ${Object.keys(plugin.config || {}).length}</span>
              </div>
              <div class="item-actions" style="margin-top: 12px;">
                ${renderPluginActions(plugin)}
              </div>
            </div>
          `).join("") : `<div class="empty">${t("noData")}</div>`}
        </div>
      </article>
      <article class="card">
        <h3>Tools</h3>
        <div class="items">
          ${tools.length ? tools.map((tool) => `
            <div class="item">
              <h4>${escapeHtml(tool.name)}</h4>
              <p>${escapeHtml(tool.description)}</p>
            </div>
          `).join("") : `<div class="empty">${t("noData")}</div>`}
        </div>
      </article>
    </div>
  `;
}

function pageExecutors() {
  const executors = state.executors || { modes: [], policies: [], externalExecutors: [] };
  return `
    <section class="page-header">
      <div>
        <h2>${t("executorsTitle")}</h2>
        <p>${t("executorsSubtitle")}</p>
      </div>
      <div class="toolbar">
        <span class="tag">runtime: ${escapeHtml(executors.runtimeExecution || "")}</span>
        <span class="tag">default: ${escapeHtml(executors.defaultExecutorMode || "")}</span>
      </div>
    </section>
    <div class="grid three">
      ${(executors.modes || []).map((mode) => `
        <article class="card">
          <h3>${escapeHtml(mode.id)}</h3>
          <p>${escapeHtml(mode.summary)}</p>
        </article>
      `).join("")}
    </div>
    <div class="grid two" style="margin-top: 18px;">
      <article class="card">
        <h3>Policies</h3>
        <div class="items">${(executors.policies || []).map((policy) => `<div class="item"><h4>${escapeHtml(policy.id)}</h4><p>${escapeHtml(policy.summary)}</p></div>`).join("")}</div>
      </article>
      <article class="card">
        <h3>External Executors</h3>
        <p>${escapeHtml(executors.configPath || "")}</p>
        <div class="items">${(executors.externalExecutors || []).map((item) => `<div class="item"><h4>${escapeHtml(item.name)}</h4><p>${escapeHtml(item.command)} ${escapeHtml(item.args.join(" "))}</p><div class="stack"><span class="tag">enabled: ${item.enabled}</span><span class="tag">risk: ${escapeHtml(item.riskLevel)}</span></div></div>`).join("")}</div>
      </article>
    </div>
  `;
}

function pageAdvanced() {
  return `
    <section class="page-header">
      <div>
        <h2>${t("advancedTitle")}</h2>
        <p>${t("advancedSubtitle")}</p>
      </div>
      <div class="toolbar">
        <button class="secondary-button" data-action="load-bundle">${t("loadBundle")}</button>
      </div>
    </section>
    <div class="grid two">
      <article class="card">
        <h3>Runtime</h3>
        <form id="runtimeForm">
          <label>Execution mode
            <select name="execution">
              ${["dry-run", "cli", "app-server"].map((mode) => `<option value="${mode}" ${state.config?.execution === mode ? "selected" : ""}>${mode}</option>`).join("")}
            </select>
          </label>
          <button class="primary-button" type="submit">${t("save")}</button>
        </form>
      </article>
      <article class="card">
        <h3>Permission Mode</h3>
        <form id="permissionForm">
          <label>Mode
            <select name="permissionMode">
              ${["read_only", "manual_review", "auto_review", "full_access"].map((mode) => `<option value="${mode}" ${state.config?.settings?.permissionMode === mode ? "selected" : ""}>${mode}</option>`).join("")}
            </select>
          </label>
          <label>Confirm full access<input name="confirmFullAccess" placeholder="I understand / 我已理解风险" /></label>
          <button class="primary-button" type="submit">${t("save")}</button>
        </form>
      </article>
    </div>
    <article class="card" style="margin-top: 18px;">
      <h3>Support Bundle</h3>
      <pre>${escapeHtml(state.diagnostics ? JSON.stringify(state.diagnostics, null, 2) : "")}</pre>
    </article>
  `;
}

function renderView() {
  if (state.view === "setup") return pageSetup();
  if (state.view === "project") return pageProject();
  if (state.view === "tasks") return pageTasks();
  if (state.view === "approvals") return pageApprovals();
  if (state.view === "logs") return pageLogs();
  if (state.view === "mcp") return pageMcp();
  if (state.view === "executors") return pageExecutors();
  return pageAdvanced();
}

function serviceUrl() {
  return window.location.origin;
}

function render() {
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = `
    <div class="shell ${state.sidebarCollapsed ? "collapsed" : ""}">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">B</div>
          <div class="brand-copy">
            <div class="brand-title">${t("brandTitle")}</div>
            <div class="brand-subtitle">${t("brandSubtitle")}</div>
          </div>
          <button class="icon-button" data-action="toggle-sidebar">≡</button>
        </div>
        <nav class="nav">
          ${NAV.map(([view, icon]) => `
            <button class="nav-item ${state.view === view ? "active" : ""}" data-view="${view}">
              <span class="nav-icon">${icon}</span>
              <span class="nav-label">${t(view)}</span>
            </button>
          `).join("")}
        </nav>
        <div class="sidebar-footer">
          <div class="stack">
            <span class="tag">${escapeHtml(state.config?.execution || "")}</span>
            <span class="tag">${escapeHtml(state.config?.settings?.permissionMode || "")}</span>
          </div>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div>
            <h1>${t("topTitle")}</h1>
            <p>${t("topSubtitle")}</p>
          </div>
          <div class="toolbar">
            <button class="ghost-button" data-action="switch-language">${state.language === "zh" ? t("english") : t("chinese")}</button>
            <button class="secondary-button" data-action="refresh-core">${t("refresh")}</button>
          </div>
        </header>
        <div class="content">
          ${state.alert ? `<div class="alert ${escapeHtml(state.alert.type)}">${escapeHtml(state.alert.message)}</div>` : ""}
          ${renderView()}
        </div>
      </main>
    </div>
  `;
  bindCommon();
  bindView();
}

function bindCommon() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.view = button.getAttribute("data-view");
      clearAlert();
      render();
      if (state.view === "approvals") {
        try {
          await loadApprovals();
        } catch (error) {
          handleError(error);
        }
      }
    });
  });
  document.querySelectorAll("[data-action='toggle-sidebar']").forEach((button) => {
    button.addEventListener("click", () => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem(STORAGE.sidebar, String(state.sidebarCollapsed));
      render();
    });
  });
  document.querySelector("[data-action='switch-language']")?.addEventListener("click", () => {
    state.language = state.language === "zh" ? "en" : "zh";
    localStorage.setItem(STORAGE.language, state.language);
    render();
  });
  document.querySelector("[data-action='refresh-core']")?.addEventListener("click", () => refreshCore().catch(handleError));
  document.querySelector("[data-action='test-connection']")?.addEventListener("click", async () => {
    try {
      await api("/config");
      setAlert("success", t("connected"));
    } catch (error) {
      handleError(error);
    }
  });
}

function bindView() {
  document.querySelectorAll("[data-open-path]").forEach((button) => {
    button.addEventListener("click", () => loadBrowse(button.getAttribute("data-open-path")).catch(handleError));
  });
  document.querySelectorAll("[data-register-path]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const folderPath = button.getAttribute("data-register-path");
        const body = await api("/projects/select", { method: "POST", body: { path: folderPath } });
        state.projectId = body.project.id;
        localStorage.setItem(STORAGE.projectId, state.projectId);
        await refreshCore();
        setAlert("success", `${t("project")} ${body.project.name}`);
      } catch (error) {
        handleError(error);
      }
    });
  });
  document.getElementById("projectSelect")?.addEventListener("change", async (event) => {
    state.projectId = event.target.value;
    localStorage.setItem(STORAGE.projectId, state.projectId);
    await Promise.all([loadProjectInspect(state.projectId), loadProjectIndexStatus(state.projectId), loadTasks(), loadTaskBranches()]);
  });
  document.querySelector("[data-action='inspect-project']")?.addEventListener("click", () => loadProjectInspect(state.projectId).catch(handleError));
  document.querySelector("[data-action='index-project']")?.addEventListener("click", async () => {
    try {
      await api(`/projects/${state.projectId}/index`, { method: "POST", body: { force: false } });
      await loadProjectIndexStatus(state.projectId);
      setAlert("success", "Project indexed");
    } catch (error) {
      handleError(error);
    }
  });
  document.querySelector("[data-action='refresh-index']")?.addEventListener("click", async () => {
    try {
      await api(`/projects/${state.projectId}/index/refresh`, { method: "POST", body: {} });
      await loadProjectIndexStatus(state.projectId);
      setAlert("success", "Index refreshed");
    } catch (error) {
      handleError(error);
    }
  });

  document.getElementById("readFileForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      const body = await api(`/projects/${state.projectId}/files/read?path=${encodeURIComponent(form.get("path"))}`);
      state.fileContent = body.file.content || "";
      render();
    } catch (error) {
      handleError(error);
    }
  });

  document.getElementById("taskForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      await api("/tasks", {
        method: "POST",
        body: {
          projectId: state.projectId,
          taskTitle: form.get("taskTitle"),
          taskGoal: form.get("taskGoal"),
          targetFiles: String(form.get("targetFiles") || "").split(",").map((item) => item.trim()).filter(Boolean),
          executorMode: form.get("executorMode") || undefined,
          executorPolicy: form.get("executorPolicy") || undefined
        }
      });
      await Promise.all([loadTasks(), loadTaskBranches()]);
      setAlert("success", t("createTask"));
    } catch (error) {
      handleError(error);
    }
  });

  document.getElementById("patchForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      await api("/web-patches", {
        method: "POST",
        body: {
          projectId: state.projectId,
          taskId: form.get("taskId") || undefined,
          taskBranchId: form.get("taskBranchId") || undefined,
          title: form.get("title"),
          rationale: form.get("rationale"),
          changes: [{
            filePath: form.get("filePath"),
            mode: form.get("mode"),
            content: form.get("content")
          }]
        }
      });
      await Promise.all([loadPatches(), loadApprovals()]);
      setAlert("success", t("createPatch"));
    } catch (error) {
      handleError(error);
    }
  });

  document.querySelectorAll("[data-create-pack]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const taskId = button.getAttribute("data-create-pack");
        const task = state.tasks.find((item) => item.id === taskId);
        await api(`/tasks/${taskId}/continue`, { method: "POST", body: { taskBranchId: task?.activeTaskBranchId, createContextPack: true } });
        setAlert("success", t("createPack"));
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-create-job]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const taskId = button.getAttribute("data-create-job");
        const task = state.tasks.find((item) => item.id === taskId);
        await api(`/tasks/${taskId}/executions`, { method: "POST", body: { taskBranchId: task?.activeTaskBranchId, runImmediately: true } });
        await Promise.all([loadExecutionJobs(), loadTasks(), loadTaskBranches(), loadApprovals()]);
        setAlert("success", t("createJob"));
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-create-branch]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const taskId = button.getAttribute("data-create-branch");
        const branchName = window.prompt("Branch name", "alt-approach");
        if (!branchName) return;
        await api(`/tasks/${taskId}/branches`, { method: "POST", body: { branchName } });
        await Promise.all([loadTasks(), loadTaskBranches()]);
        setAlert("success", "Task branch created");
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-set-active-branch]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api(`/tasks/${button.getAttribute("data-task-id")}/active-branch`, {
          method: "POST",
          body: { taskBranchId: button.getAttribute("data-set-active-branch") }
        });
        await Promise.all([loadTasks(), loadTaskBranches()]);
        setAlert("success", "Active branch updated");
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-continue-branch]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const result = await api(`/task-branches/${button.getAttribute("data-continue-branch")}/continue`, { method: "POST", body: {} });
        state.taskDetail = result;
        render();
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-branch-conflicts]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        state.taskDetail = await api(`/task-branches/${button.getAttribute("data-branch-conflicts")}/conflicts`);
        render();
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-branch-detail]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        state.taskDetail = await api(`/task-branches/${button.getAttribute("data-branch-detail")}`);
        render();
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-task-detail]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        state.taskDetail = await api(`/tasks/${button.getAttribute("data-task-detail")}`);
        render();
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-job-detail]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        state.taskDetail = await api(`/execution-jobs/${button.getAttribute("data-job-detail")}`);
        render();
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-approve-job]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api(`/execution-jobs/${button.getAttribute("data-approve-job")}/approve-run`, { method: "POST", body: { runNow: true } });
        await refreshCore();
        setAlert("success", t("approveRun"));
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-run-job]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api(`/execution-jobs/${button.getAttribute("data-run-job")}/run`, { method: "POST" });
        await loadExecutionJobs();
        setAlert("success", t("createJob"));
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-patch-diff]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        state.taskDetail = await api(`/web-patches/${button.getAttribute("data-patch-diff")}/diff`);
        render();
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-apply-patch]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api(`/web-patches/${button.getAttribute("data-apply-patch")}/apply`, { method: "POST", body: { confirm: true } });
        await refreshCore();
        setAlert("success", t("apply"));
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-reject-patch]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api(`/web-patches/${button.getAttribute("data-reject-patch")}/reject`, { method: "POST", body: {} });
        await refreshCore();
        setAlert("success", t("reject"));
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-approve-command]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api(`/shell-commands/${button.getAttribute("data-approve-command")}/approve-run`, { method: "POST", body: { runNow: true } });
        await refreshCore();
        setAlert("success", t("approveRun"));
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-approve-repair]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api(`/repairs/${button.getAttribute("data-approve-repair")}/approve`, { method: "POST" });
        await refreshCore();
        setAlert("success", t("save"));
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-plugin-enable]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api(`/mcp-center/plugins/${button.getAttribute("data-plugin-enable")}/enable`, { method: "POST", body: {} });
        await refreshCore();
        setAlert("success", "Plugin enabled");
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-plugin-disable]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api(`/mcp-center/plugins/${button.getAttribute("data-plugin-disable")}/disable`, { method: "POST", body: {} });
        await refreshCore();
        setAlert("success", "Plugin disabled");
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelectorAll("[data-plugin-configure]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const raw = window.prompt("Plugin JSON config. Use env:NAME for secrets.", "{}");
        if (raw === null) return;
        const config = raw.trim() ? JSON.parse(raw) : {};
        await api(`/mcp-center/plugins/${button.getAttribute("data-plugin-configure")}/configure`, { method: "POST", body: { config } });
        await refreshCore();
        setAlert("success", "Plugin configured");
      } catch (error) {
        handleError(error);
      }
    });
  });

  document.querySelector("[data-action='load-logs']")?.addEventListener("click", () => loadLogs().catch(handleError));
  document.querySelector("[data-action='clear-log-filter']")?.addEventListener("click", async () => {
    state.logFilters.requestId = "";
    await loadLogs();
  });
  document.querySelector("[data-action='load-bundle']")?.addEventListener("click", () => loadDiagnostics().catch(handleError));
  document.querySelector("[data-action='refresh-approvals']")?.addEventListener("click", () => refreshCore().catch(handleError));
  document.querySelector("[data-action='reload-tasks']")?.addEventListener("click", async () => {
    await Promise.all([loadTasks(), loadTaskBranches(), loadPatches(), loadExecutionJobs()]);
  });

  document.getElementById("logFilterForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.logFilters.requestId = String(form.get("requestId") || "").trim();
    await loadLogs();
  });

  document.getElementById("runtimeForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      await api("/config/runtime", { method: "POST", body: { execution: form.get("execution") } });
      await refreshCore();
      setAlert("success", t("save"));
    } catch (error) {
      handleError(error);
    }
  });

  document.getElementById("permissionForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      await api("/config/access-mode", {
        method: "POST",
        body: { permissionMode: form.get("permissionMode"), confirmFullAccess: form.get("confirmFullAccess") }
      });
      await refreshCore();
      setAlert("success", t("save"));
    } catch (error) {
      handleError(error);
    }
  });
}

function handleError(error) {
  console.error(error);
  setAlert("error", `${error.message || t("requestFailed")}${error.requestId ? ` (requestId: ${error.requestId})` : ""}`);
}

bootstrap().catch(handleError);
