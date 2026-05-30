const STORAGE = {
  baseUrl: "ccb_base_url",
  token: "ccb_token",
  projectId: "ccb_project_id",
  language: "ccb_language",
  sidebar: "ccb_sidebar_collapsed"
};

const I18N = {
  zh: {
    "document.title": "本地桥接控制台",
    "brand.title": "本地桥接",
    "brand.subtitle": "本地工作流控制台",
    "sidebar.toggle": "折叠或展开侧边栏",
    "nav.group.overview": "总览",
    "nav.group.projects": "项目与文件",
    "nav.group.patch": "网页补丁",
    "nav.group.codex": "执行器",
    "nav.group.review": "审查与修复",
    "nav.group.system": "系统",
    "nav.overview": "总览",
    "nav.projects": "项目",
    "nav.files": "文件",
    "nav.templates": "模板",
    "nav.patches": "网页补丁",
    "nav.diffs": "差异查看器",
    "nav.jobs": "执行任务",
    "nav.codexApp": "执行器连接",
    "nav.approvals": "审批",
    "nav.reviews": "交叉审查",
    "nav.screenshots": "界面截图",
    "nav.repairs": "修复中心",
    "nav.github": "代码同步",
    "nav.logs": "日志",
    "nav.knowledge": "角色与技能",
    "nav.access": "权限模式",
    "nav.settings": "设置",
    "app.eyebrow": "本地桥接控制台",
    "app.title": "本地工作流控制台",
    "app.subtitle": "管理项目、文件、补丁、执行任务、日志和修复流程。",
    "label.execution": "运行模式",
    "label.permission": "权限模式",
    "action.refreshAll": "刷新全部",
    "action.inspect": "检查项目",
    "action.newCodexJob": "新建任务",
    "action.refresh": "刷新",
    "action.registerProject": "注册项目",
    "action.loadTree": "加载文件树",
    "action.readFile": "读取文件",
    "action.createContextPack": "创建上下文包",
    "action.createPatchFromEditor": "从编辑器创建补丁",
    "action.createPatch": "创建补丁草案",
    "action.createJob": "创建任务",
    "action.loadTestPlan": "加载测试计划",
    "action.createTestJob": "创建验证任务",
    "action.refreshAccount": "刷新账号信息",
    "action.resetRunner": "查看运行说明",
    "action.createReview": "创建有界审查",
    "action.loadDiff": "加载差异",
    "action.createBranch": "创建并切换分支",
    "action.commit": "提交",
    "action.createPr": "创建拉取请求",
    "action.createScreenshotJob": "创建截图审查任务",
    "action.loadLatestErrors": "读取最新错误",
    "action.fillRepair": "从最新错误生成草案",
    "action.copyLogs": "复制日志",
    "action.clearLogs": "清空日志",
    "action.saveSettings": "保存设置",
    "action.testConnection": "测试连接",
    "action.clearSettings": "重新读取本机配置",
    "action.regenerateToken": "重新生成令牌",
    "quick.registerProject": "注册项目",
    "quick.createPatch": "创建补丁",
    "quick.createJob": "创建任务",
    "quick.viewLogs": "查看日志",
    "overview.title": "总览",
    "overview.subtitle": "先确认连接与权限，再进入项目、补丁、任务和日志流程。",
    "overview.jobs": "最近任务",
    "overview.jobsHint": "先用演练模式测试完整流程。",
    "overview.errors": "最近错误",
    "overview.errorsHint": "有请求编号的错误可以进入修复中心。",
    "metric.connection": "服务连接状态",
    "metric.execution": "当前运行模式",
    "metric.permission": "当前权限模式",
    "metric.projects": "已注册项目",
    "metric.recentJob": "最近任务",
    "metric.errors": "最近错误",
    "metric.patches": "补丁数量",
    "projects.title": "项目",
    "projects.subtitle": "先注册本地项目根目录，服务只会读写项目内的相对路径。",
    "projects.register": "注册本地项目",
    "projects.registerHint": "Windows 路径可以包含空格或中文。",
    "projects.context": "项目上下文",
    "projects.contextHint": "检查说明文件、依赖信息、版本状态和文件树。",
    "files.title": "文件",
    "files.subtitle": "读取文件、创建上下文包，并从编辑器生成可审查补丁。",
    "files.browser": "文件树与读取",
    "files.browserHint": "点击文件树中的文件，或输入项目内相对路径。",
    "files.patchEditor": "从当前文件创建补丁",
    "files.patchHint": "创建前请确认目标路径和操作模式。",
    "templates.title": "模板",
    "templates.subtitle": "用预设任务模板创建更稳定的执行任务。",
    "templates.verify": "验证任务",
    "templates.verifyHint": "根据项目结构推断测试命令，并创建验证任务。",
    "patches.title": "网页补丁",
    "patches.subtitle": "小范围文件替换可以先创建为草案，再由你审查、应用或回滚。",
    "patches.create": "创建补丁草案",
    "patches.createHint": "每个补丁都明确目标文件、模式和完整内容。",
    "patches.queue": "补丁队列",
    "patches.queueHint": "应用和回滚都需要确认。",
    "jobs.title": "执行任务",
    "jobs.subtitle": "用于较大实现、测试、审查和修复。演练模式不会真实调用执行器。",
    "jobs.create": "创建执行任务",
    "jobs.createHint": "安全等级会影响是否需要人工批准。",
    "codexApp.title": "执行器连接",
    "codexApp.subtitle": "支持演练、命令行和应用服务模式；账号切换由本机执行器自行管理。",
    "codexApp.step1": "演练模式始终可用",
    "codexApp.step1Hint": "先用演练模式测试控制台流程。",
    "codexApp.step2": "命令行模式跟随本机登录状态",
    "codexApp.step2Hint": "本工具不保存、不切换账号。",
    "codexApp.step3": "应用服务模式只同步本工具启动的任务",
    "codexApp.step3Hint": "直接在桌面应用另开的任务不一定自动出现。",
    "access.title": "权限模式",
    "access.subtitle": "当前模式显示在顶部和总览。完全访问需要输入确认文本。",
    "access.readOnly": "只读检查，不允许应用补丁，也不允许危险执行。",
    "access.manual": "推荐默认模式，关键动作都需要人工审查。",
    "access.auto": "低风险任务可自动运行，高风险仍需审批。",
    "access.full": "危险模式，会放宽执行限制和自动批准。",
    "access.fullWarning": "完全访问只建议在一次性分支或演示项目使用。开启前必须输入“我已理解风险”。",
    "access.effective": "当前生效设置",
    "access.effectiveHint": "包括沙箱、审批、网络和日志级别。",
    "reviews.title": "交叉审查",
    "reviews.subtitle": "限制网页端和本地执行器的审查轮次，最终必须做决定。",
    "diffs.title": "差异查看器",
    "diffs.subtitle": "查看补丁的统一差异，新增和删除行会高亮。",
    "approvals.title": "审批",
    "approvals.subtitle": "应用服务模式请求命令或文件变更批准时会出现在这里。",
    "github.title": "代码同步",
    "github.subtitle": "通过本机 git 和 GitHub 命令行执行分支、提交和拉取请求辅助操作。",
    "screenshots.title": "界面截图",
    "screenshots.subtitle": "创建任务，让本地执行器使用浏览器工具检查界面。",
    "screenshots.step1": "运行目标应用",
    "screenshots.step1Hint": "使用项目自己的开发服务。",
    "screenshots.step2": "创建截图任务",
    "screenshots.step2Hint": "本地执行器捕获或检查界面，并返回聚焦问题。",
    "screenshots.step3": "进入有界审查",
    "screenshots.step3Hint": "不要让双方无限互审。",
    "repairs.title": "修复中心",
    "repairs.subtitle": "把带请求编号的错误转成可审查修复方案，批准后创建修复任务。",
    "logs.title": "日志",
    "logs.subtitle": "查看最近日志，按级别和请求编号搜索。",
    "logs.allLevels": "全部级别",
    "logs.count": "当前显示",
    "knowledge.title": "角色与技能",
    "knowledge.subtitle": "查看网页端路由角色和本地技能。",
    "knowledge.roles": "角色协议",
    "knowledge.skills": "本地技能",
    "settings.title": "设置",
    "settings.subtitle": "连接和令牌会自动准备好；通常只需要选择运行模式和权限模式。",
    "status.notConfigured": "正在连接本机服务",
    "status.connected": "已连接",
    "status.offline": "离线",
    "status.checking": "检查中",
    "status.noProjects": "无项目",
    "status.none": "无",
    "status.unknown": "未知",
    "error.title": "请求失败",
    "error.unauthorized": "认证失败：当前浏览器保存的本机访问令牌已失效。请点击“重新读取本机配置”，或重新生成令牌。",
    "error.connectionFailed": "连接失败：无法访问本机服务。请确认 npm.cmd run dev 正在运行，端口是否正确。",
    "error.needSettings": "正在等待本机服务生成连接设置。",
    "error.viewLogs": "建议去日志或修复中心查看。",
    "field.endpoint": "接口",
    "field.status": "状态码",
    "field.requestId": "请求编号",
    "field.details": "错误详情",
    "action.viewLogs": "查看日志",
    "action.createRepair": "创建修复方案",
    "action.close": "关闭",
    "field.executionMode": "执行模式",
    "field.permissionMode": "权限模式",
    "field.localToken": "本机访问令牌",
    "field.baseUrl": "本机服务地址",
    "field.title": "标题",
    "field.roles": "角色",
    "field.safety": "安全等级",
    "field.task": "任务",
    "field.reviewTitle": "审查标题",
    "field.webSummary": "网页端摘要",
    "field.codexSummary": "本地执行器摘要",
    "field.webPatchId": "网页补丁编号",
    "field.codexJobId": "执行任务编号",
    "field.maxRounds": "最大轮次",
    "field.patchId": "补丁编号",
    "field.url": "网址",
    "field.sourceKind": "来源类型",
    "field.prTitle": "拉取请求标题",
    "field.prBody": "拉取请求正文",
    "field.baseBranch": "目标分支",
    "field.logLevel": "日志级别",
    "field.searchLogs": "请求编号 / 文本",
    "field.projectName": "项目名称",
    "field.localPath": "本地路径",
    "field.allowShell": "允许此项目使用命令行型执行任务",
    "field.relativePath": "相对文件路径",
    "field.selectedPaths": "选中文件，用逗号分隔",
    "field.notes": "备注",
    "field.includeDiff": "包含当前版本差异",
    "field.patchTitle": "补丁标题",
    "field.filePath": "目标文件路径",
    "field.mode": "操作模式",
    "field.rationale": "原因",
    "field.fullContent": "完整文件内容",
    "field.branch": "新分支",
    "field.commitMessage": "提交消息",
    "field.addAll": "提交前执行 git add -A",
    "field.draftPr": "创建草稿拉取请求",
    "field.runCommand": "运行命令",
    "field.screenshotPaths": "已有截图路径",
    "field.errorSummary": "错误摘要",
    "field.diagnosis": "简短诊断",
    "field.solution": "解决方案",
    "field.executionPlan": "执行计划",
    "field.codexTask": "执行任务",
    "settings.runtimeHint": "默认端口是 8787。执行模式和权限模式可以在这里直接选择；访问令牌由本机自动生成，不需要手动和文件对照。",
    "settings.tokenHint": "这是本机自动生成的访问令牌，只在你的电脑上使用。通常不用复制或修改；需要换一个时点击“重新生成令牌”。",
    "msg.settingsSaved": "设置已保存。",
    "msg.runtimeSaved": "运行设置已保存。",
    "msg.tokenRegenerated": "本机访问令牌已重新生成，并已自动更新到当前浏览器。",
    "msg.bootstrapReady": "已自动读取本机连接设置。",
    "msg.connectionOk": "连接成功；运行模式：{execution}；权限模式：{permissionMode}。",
    "msg.refreshDone": "刷新完成。",
    "msg.projectRequired": "请先注册或选择项目。",
    "msg.projectRegistered": "项目已注册：{name}",
    "msg.fileLoaded": "文件已加载到编辑器。",
    "msg.contextPackCreated": "上下文包已创建。",
    "msg.patchCreated": "补丁草案已创建。",
    "msg.patchApplied": "补丁已应用。",
    "msg.patchReverted": "补丁已回滚。",
    "msg.patchRejected": "补丁已拒绝。",
    "msg.jobCreated": "执行任务已创建。",
    "msg.jobRunRequested": "任务已批准并请求运行。",
    "msg.reviewCreated": "交叉审查已创建。",
    "msg.reviewDecided": "审查已做最终决定：{decision}。",
    "msg.logsRefreshed": "日志已刷新。",
    "msg.logsCopied": "日志已复制。",
    "msg.logsCleared": "日志已清空。",
    "msg.modeSet": "权限模式已切换为 {mode}。",
    "msg.fullAccessCancelled": "未开启完全访问。",
    "msg.latestErrorsLoaded": "已读取最新错误。",
    "msg.repairDraftReady": "已从最新错误填充修复方案草案，请审查后再创建。",
    "msg.repairCreated": "修复方案已创建。",
    "msg.repairApproved": "修复方案已批准并创建/运行修复任务。",
    "msg.repairRejected": "修复方案已拒绝。",
    "msg.confirmApply": "确认应用这个补丁到本地文件？本机服务会创建备份。",
    "msg.confirmRevert": "确认用本地备份回滚这个补丁？这会修改文件。",
    "msg.confirmClearLogs": "确认清空本地日志文件？任务和补丁历史不会删除。",
    "msg.confirmRepairRun": "确认批准此修复方案，并立即创建/运行对应修复任务？",
    "msg.confirmRegenerateToken": "重新生成令牌后，旧浏览器页面和旧请求会失效。确认继续？",
    "prompt.fullAccess": "输入“我已理解风险”来开启完全访问。\n\n这是危险模式，请只在一次性分支或演示项目使用。",
    "prompt.reviewSpeaker": "本轮发言者：网页端 / 本地执行器 / 用户",
    "prompt.reviewSummary": "只写本轮摘要：阻塞问题 / 具体改进 / 证据 / 建议决策",
    "placeholder.repairPlan": "1. 查看请求编号对应日志\n2. 定位失败接口和输入\n3. 做最小修复并运行冒烟测试",
    "disabled.readOnlyPatch": "当前权限模式是只读检查，禁止应用或回滚补丁。",
    "disabled.applyStatus": "只有待批准状态的补丁可以应用。",
    "disabled.revertStatus": "只有已应用状态的补丁可以回滚。",
    "disabled.reviewLimit": "已达到审查轮次上限，必须做最终决定。",
    "status.draft": "草稿",
    "status.needs_approval": "待批准",
    "status.queued": "排队中",
    "status.running": "运行中",
    "status.completed": "已完成",
    "status.failed": "失败",
    "status.cancelled": "已取消",
    "status.rejected": "已拒绝",
    "status.applied": "已应用",
    "status.reverted": "已回滚",
    "status.open": "进行中",
    "status.accepted": "已接受",
    "status.needs_human": "需人工判断",
    "exec.dry-run": "演练模式",
    "exec.cli": "命令行模式",
    "exec.app-server": "应用服务模式",
    "mode.read_only": "只读检查",
    "mode.manual_review": "人工审查",
    "mode.auto_review": "自动审查",
    "mode.full_access": "完全访问",
    "role.ui_ux_designer": "界面体验设计",
    "role.frontend_engineer": "前端工程",
    "role.qa_reviewer": "质量检查",
    "role.debugger": "问题排查",
    "role.backend_engineer": "后端工程",
    "role.security_reviewer": "安全审查",
    "role.release_manager": "发布管理",
    "category.frontend": "前端",
    "category.debugging": "问题排查",
    "category.qa": "质量检查",
    "category.backend": "后端",
    "category.release": "发布",
    "category.review": "审查",
    "level.info": "信息",
    "level.warn": "警告",
    "level.error": "错误",
    "source.http_error": "接口错误",
    "source.job_failure": "任务失败",
    "source.manual": "手动输入",
    "patchMode.overwrite": "覆盖文件",
    "patchMode.create": "新建文件",
    "reviewRound.1": "1 - 快速决定",
    "reviewRound.2": "2 - 推荐默认",
    "reviewRound.3": "3 - 最大轮次",
    "safety.1": "1 - 低风险",
    "safety.2": "2 - 中等风险",
    "safety.3": "3 - 高风险",
    "safety.4": "4 - 关键风险",
    "safety.5": "5 - 禁止自动运行",
    "label.safety": "安全等级",
    "label.roles": "角色",
    "label.files": "文件",
    "label.remaining": "剩余轮次",
    "label.decision": "最终决策",
    "label.pending": "待决定",
    "label.diagnosis": "诊断",
    "label.solution": "方案",
    "label.noRoles": "无",
    "label.logId": "日志编号",
    "label.request": "请求",
    "label.job": "任务",
    "label.expires": "过期时间",
    "label.rawDetails": "原始详情",
    "button.view": "查看",
    "button.diff": "差异",
    "button.apply": "应用",
    "button.revert": "回滚",
    "button.reviewPatch": "创建审查任务",
    "button.reject": "拒绝",
    "button.approveRun": "批准并运行",
    "button.runAsync": "后台运行",
    "button.runSync": "同步运行",
    "button.mirrorOutput": "同步外部输出",
    "button.cancel": "取消",
    "button.addRound": "添加一轮",
    "button.useWeb": "采用网页补丁",
    "button.useCodex": "采用本地实现",
    "button.hybrid": "合并方案",
    "button.needsHuman": "人工判断",
    "button.accept": "接受",
    "button.decline": "拒绝",
    "button.createJob": "创建任务",
    "empty.jobs": "暂无任务。",
    "empty.patches": "暂无补丁。",
    "empty.errors": "暂无错误。",
    "empty.logs": "暂无匹配日志。",
    "empty.reviews": "暂无审查。",
    "empty.approvals": "暂无审批。",
    "empty.repairs": "暂无修复方案。",
    "empty.roles": "暂无角色。",
    "empty.skills": "暂无技能。",
    "empty.templates": "暂无模板。",
    "placeholder.projectName": "演示项目",
    "placeholder.contextNotes": "希望网页端重点关注什么？",
    "placeholder.patchTitle": "改进界面布局",
    "placeholder.jobTitle": "验证控制台流程",
    "placeholder.roles": "前端工程、质量检查，可留空",
    "placeholder.task": "写清楚要本地执行器完成的任务",
    "placeholder.reviewTitle": "比较网页补丁与本地审查结果",
    "placeholder.optional": "可选",
    "placeholder.reviewSummary": "阻塞问题 / 具体改进 / 证据 / 建议决策",
    "placeholder.patchId": "补丁编号",
    "placeholder.url": "http://localhost:3000/login",
    "placeholder.screenshotPaths": "截图路径，可选，多个用逗号分隔",
    "placeholder.runCommand": "npm run dev",
    "placeholder.requestId": "可选，请求编号",
    "placeholder.searchLogs": "请求编号 / 关键字",
    "template.ui-polish.title": "界面打磨与可访问性检查",
    "template.ui-polish.prompt": "检查选中的界面文件，优化视觉层级、加载/错误/空状态、键盘可访问性和响应式表现，并保持改动尽量小。运行最相关的最小检查。",
    "template.bug-fix.title": "聚焦修复问题",
    "template.bug-fix.prompt": "复现或推理用户报告的问题，找到最小根因，做最小且安全的修复，并用针对性测试或明确的人工检查验证。",
    "template.test-triage.title": "测试失败排查",
    "template.test-triage.prompt": "运行或检查失败测试，把失败归类为产品问题、测试问题、环境问题或依赖问题，然后做最小安全修复并报告精确命令。",
    "template.api-endpoint.title": "后端接口实现",
    "template.api-endpoint.prompt": "实现请求的后端接口，包含校验、错误处理、认证假设、日志、测试和迁移风险控制。不要触碰生产数据或密钥。",
    "template.release-check.title": "发布前检查",
    "template.release-check.prompt": "执行发布准备检查：变更文件、已运行命令、测试、风险说明、回滚说明和拉取请求描述。避免大型无关重构。",
    "template.web-patch-review.title": "审查网页端补丁",
    "template.web-patch-review.prompt": "按仓库约定审查网页端创建的补丁，运行最相关的最小检查；如果安全则修复集成问题，并报告应该保留、修改还是回滚。"
  },
  en: {
    "document.title": "ChatGPT Codex Bridge Dashboard",
    "brand.title": "Local Bridge",
    "brand.subtitle": "Local workflow console",
    "sidebar.toggle": "Collapse sidebar",
    "nav.group.overview": "Overview",
    "nav.group.projects": "Projects & Files",
    "nav.group.patch": "Web Patch",
    "nav.group.codex": "Codex",
    "nav.group.review": "Review & Repair",
    "nav.group.system": "System",
    "nav.overview": "Overview",
    "nav.projects": "Projects",
    "nav.files": "Files",
    "nav.templates": "Templates",
    "nav.patches": "Web Patch",
    "nav.diffs": "Diff Viewer",
    "nav.jobs": "Codex Jobs",
    "nav.codexApp": "Codex App",
    "nav.approvals": "Approvals",
    "nav.reviews": "Cross Review",
    "nav.screenshots": "UI Screenshots",
    "nav.repairs": "Repair Center",
    "nav.github": "GitHub Sync",
    "nav.logs": "Logs",
    "nav.knowledge": "Roles & Skills",
    "nav.access": "Access Modes",
    "nav.settings": "Settings",
    "app.eyebrow": "ChatGPT Web × Codex local bridge",
    "app.title": "Local Workflow Console",
    "app.subtitle": "Manage projects, files, web patches, Codex jobs, logs, and repair flow.",
    "label.execution": "Execution",
    "label.permission": "Permission",
    "action.refreshAll": "Refresh all",
    "action.inspect": "Inspect",
    "action.newCodexJob": "New Codex Job",
    "action.refresh": "Refresh",
    "action.registerProject": "Register project",
    "action.loadTree": "Load tree",
    "action.readFile": "Read file",
    "action.createContextPack": "Create context pack",
    "action.createPatchFromEditor": "Create patch from editor",
    "action.createPatch": "Create patch proposal",
    "action.createJob": "Create Codex job",
    "action.loadTestPlan": "Load test plan",
    "action.createTestJob": "Create verification job",
    "action.refreshAccount": "Refresh account",
    "action.resetRunner": "Runner note",
    "action.createReview": "Create bounded review",
    "action.loadDiff": "Load diff",
    "action.createBranch": "Create and checkout branch",
    "action.commit": "Commit",
    "action.createPr": "Create PR with gh CLI",
    "action.createScreenshotJob": "Create screenshot review job",
    "action.loadLatestErrors": "Load latest errors",
    "action.fillRepair": "Draft from latest error",
    "action.copyLogs": "Copy logs",
    "action.clearLogs": "Clear logs",
    "action.saveSettings": "Save Settings",
    "action.testConnection": "Test connection",
    "action.clearSettings": "Reload local settings",
    "action.regenerateToken": "Regenerate token",
    "field.executionMode": "Codex execution mode",
    "field.permissionMode": "Permission mode",
    "field.localToken": "Local access token",
    "field.baseUrl": "Local Bridge URL",
    "field.webPatchId": "Web patch ID",
    "field.codexJobId": "Codex job ID",
    "field.patchId": "Patch ID",
    "field.url": "URL",
    "field.prTitle": "PR title",
    "field.prBody": "PR body",
    "field.baseBranch": "Base branch",
    "field.logLevel": "Log level",
    "field.searchLogs": "requestId / text",
    "settings.runtimeHint": "Default port is 8787. Choose execution and permission modes here. The local access token is generated automatically; you do not need to compare it with files.",
    "settings.tokenHint": "This local dashboard token is generated automatically for this computer. It is read-only here; use Regenerate token when you want a new one.",
    "msg.runtimeSaved": "Runtime settings saved.",
    "msg.tokenRegenerated": "Local access token regenerated and saved in this browser.",
    "msg.confirmRegenerateToken": "Regenerating the token invalidates old browser pages and old requests. Continue?",
    "msg.bootstrapReady": "Local Bridge settings loaded automatically.",
    "quick.registerProject": "Register project",
    "quick.createPatch": "Create Web Patch",
    "quick.createJob": "Create Codex Job",
    "quick.viewLogs": "View Logs",
    "overview.title": "Overview",
    "overview.subtitle": "Check connection and access mode first, then work through projects, patches, jobs, and logs.",
    "overview.jobs": "Recent Codex Jobs",
    "overview.jobsHint": "Use dry-run to test the whole flow first.",
    "overview.errors": "Recent Errors",
    "overview.errorsHint": "Errors with requestId can go to Repair Center.",
    "metric.connection": "Bridge connection",
    "metric.execution": "Execution mode",
    "metric.permission": "Permission mode",
    "metric.projects": "Registered projects",
    "metric.recentJob": "Recent Codex Job",
    "metric.errors": "Recent errors",
    "metric.patches": "Web patches",
    "projects.title": "Projects",
    "projects.subtitle": "Register local roots first. Bridge only reads or writes project-relative paths.",
    "projects.register": "Register local project",
    "projects.registerHint": "Windows paths may contain spaces or non-ASCII characters.",
    "projects.context": "Project context",
    "projects.contextHint": "Inspect README, package metadata, git status, and file tree.",
    "files.title": "Files",
    "files.subtitle": "Read files, create context packs, and draft reviewable patches from the editor.",
    "files.browser": "File tree and reader",
    "files.browserHint": "Click a file in the tree or type a project-relative path.",
    "files.patchEditor": "Create patch from current file",
    "files.patchHint": "Confirm target path and operation mode before creating.",
    "templates.title": "Templates",
    "templates.subtitle": "Use predefined task templates to create safer Codex jobs.",
    "templates.verify": "Verification task",
    "templates.verifyHint": "Infer test commands from project structure.",
    "patches.title": "Web Patch",
    "patches.subtitle": "Small file replacements can start in ChatGPT Web, then be reviewed, applied, or reverted here.",
    "patches.create": "Create patch proposal",
    "patches.createHint": "Each patch makes target file, mode, and full content explicit.",
    "patches.queue": "Patch queue",
    "patches.queueHint": "Apply and revert both require confirmation.",
    "jobs.title": "Codex Jobs",
    "jobs.subtitle": "Use for broader implementation, tests, review, and repairs. dry-run does not execute Codex.",
    "jobs.create": "Create Codex job",
    "jobs.createHint": "Safety level affects approval requirements.",
    "codexApp.title": "Codex App",
    "codexApp.subtitle": "Bridge supports dry-run, cli, and app-server; account switching is managed by local Codex.",
    "codexApp.step1": "dry-run is always available",
    "codexApp.step1Hint": "Test the dashboard workflow first.",
    "codexApp.step2": "cli follows your local codex login",
    "codexApp.step2Hint": "This tool does not store or switch accounts.",
    "codexApp.step3": "app-server syncs Bridge-started jobs",
    "codexApp.step3Hint": "Separate Codex Desktop tasks may not appear automatically.",
    "access.title": "Access Modes",
    "access.subtitle": "Current mode is shown in the header and overview. full_access requires typed confirmation.",
    "access.readOnly": "Read-only inspection. No patch apply and no dangerous execution.",
    "access.manual": "Recommended default. Human review for critical actions.",
    "access.auto": "Low-risk tasks may run automatically; high-risk tasks still need approval.",
    "access.full": "Danger mode with permissive execution and app-server auto approvals.",
    "access.fullWarning": "Use full_access only on disposable branches or demo projects. You must type I understand or 我已理解风险.",
    "access.effective": "Effective settings",
    "access.effectiveHint": "Includes sandbox, approval, network, and log level.",
    "reviews.title": "Cross Review",
    "reviews.subtitle": "Bound ChatGPT Web and Codex review rounds, then make a final decision.",
    "diffs.title": "Diff Viewer",
    "diffs.subtitle": "View unified Web Patch diff with additions and deletions highlighted.",
    "approvals.title": "Approvals",
    "approvals.subtitle": "app-server command or file-change approval requests appear here.",
    "github.title": "GitHub Sync",
    "github.subtitle": "Use local git and GitHub CLI for branch, commit, and PR helpers.",
    "screenshots.title": "UI Screenshots",
    "screenshots.subtitle": "Create a job for Codex to inspect UI with Playwright or project tooling.",
    "screenshots.step1": "Run the target app",
    "screenshots.step1Hint": "Use the project's own dev server.",
    "screenshots.step2": "Create screenshot job",
    "screenshots.step2Hint": "Codex captures or reviews UI and returns focused issues.",
    "screenshots.step3": "Use bounded review",
    "screenshots.step3Hint": "Do not let both sides review forever.",
    "repairs.title": "Repair Center",
    "repairs.subtitle": "Turn requestId-backed errors into reviewable repair proposals; approval creates a Codex repair job.",
    "logs.title": "Logs",
    "logs.subtitle": "View recent logs and filter by level or requestId.",
    "logs.allLevels": "All levels",
    "logs.count": "Showing",
    "knowledge.title": "Roles & Skills",
    "knowledge.subtitle": "View ChatGPT routing roles and Codex local skills.",
    "knowledge.roles": "Role protocols",
    "knowledge.skills": "Codex skills",
    "settings.title": "Settings",
    "settings.subtitle": "On first open, the dashboard loads local Bridge connection details automatically. You can choose access mode and Codex execution mode here.",
    "field.projectName": "Project name",
    "field.localPath": "Local path",
    "field.allowShell": "Allow shell-capable Codex jobs for this project",
    "field.relativePath": "Relative file path",
    "field.selectedPaths": "Selected paths, comma-separated",
    "field.notes": "Notes",
    "field.includeDiff": "Include current git diff",
    "field.patchTitle": "Patch title",
    "field.filePath": "Target file path",
    "field.mode": "Operation mode",
    "field.rationale": "Rationale",
    "field.fullContent": "Full file content",
    "field.title": "Title",
    "field.roles": "Roles",
    "field.safety": "Safety level",
    "field.task": "Task",
    "field.reviewTitle": "Review title",
    "field.webSummary": "ChatGPT Web summary",
    "field.codexSummary": "Codex summary",
    "field.maxRounds": "Max rounds",
    "field.branch": "New branch",
    "field.commitMessage": "Commit message",
    "field.addAll": "Run git add -A before commit",
    "field.draftPr": "Create draft PR",
    "field.runCommand": "Run command",
    "field.screenshotPaths": "Existing screenshot paths",
    "field.sourceKind": "Source kind",
    "field.errorSummary": "Error summary",
    "field.diagnosis": "Concise diagnosis",
    "field.solution": "Solution",
    "field.executionPlan": "Execution plan",
    "field.codexTask": "Codex task",
    "placeholder.projectName": "demo-project",
    "placeholder.contextNotes": "What should ChatGPT focus on?",
    "placeholder.patchTitle": "Improve app layout",
    "placeholder.jobTitle": "Verify dashboard flow",
    "placeholder.roles": "frontend_engineer,qa_reviewer",
    "placeholder.task": "Describe the exact task for Codex",
    "placeholder.reviewTitle": "Compare web patch and Codex review",
    "placeholder.optional": "optional",
    "placeholder.reviewSummary": "blocking issue / concrete improvement / evidence / decision",
    "placeholder.patchId": "web patch id",
    "placeholder.url": "http://localhost:3000/login",
    "placeholder.screenshotPaths": "comma-separated paths, optional",
    "placeholder.runCommand": "npm run dev",
    "placeholder.requestId": "optional requestId from error",
    "placeholder.searchLogs": "requestId / text",
    "status.notConfigured": "Configure Settings first",
    "status.connected": "Connected",
    "status.offline": "Offline",
    "status.checking": "Checking",
    "status.noProjects": "No projects",
    "status.none": "None",
    "status.unknown": "Unknown",
    "status.draft": "Draft",
    "status.needs_approval": "Needs approval",
    "status.queued": "Queued",
    "status.running": "Running",
    "status.completed": "Completed",
    "status.failed": "Failed",
    "status.cancelled": "Cancelled",
    "status.rejected": "Rejected",
    "status.applied": "Applied",
    "status.reverted": "Reverted",
    "status.open": "Open",
    "status.accepted": "Accepted",
    "status.needs_human": "Needs human",
    "exec.dry-run": "Dry run",
    "exec.cli": "CLI",
    "exec.app-server": "App server",
    "mode.read_only": "Read only",
    "mode.manual_review": "Manual review",
    "mode.auto_review": "Auto review",
    "mode.full_access": "Full access",
    "error.title": "Request failed",
    "error.unauthorized": "Authentication failed: the Bearer token is incorrect. Check whether Settings token matches the current local Bridge token, or clear local settings and refresh to load it again.",
    "error.connectionFailed": "Connection failed: cannot reach the Bridge service. Confirm npm.cmd run dev is running and the port is correct.",
    "error.needSettings": "Configure Bridge URL and Token in Settings first.",
    "error.viewLogs": "Open Logs / Repair Center for details.",
    "field.endpoint": "Endpoint",
    "field.status": "HTTP status",
    "field.requestId": "requestId",
    "field.details": "Details",
    "action.viewLogs": "View Logs",
    "action.createRepair": "Create repair draft",
    "action.close": "Close",
    "msg.settingsSaved": "Settings saved.",
    "msg.connectionOk": "Connection successful; execution: {execution}; permission mode: {permissionMode}.",
    "msg.refreshDone": "Refresh complete.",
    "msg.projectRequired": "Register or select a project first.",
    "msg.projectRegistered": "Registered project: {name}",
    "msg.fileLoaded": "File loaded into the editor.",
    "msg.contextPackCreated": "Context pack created.",
    "msg.patchCreated": "Patch proposal created.",
    "msg.patchApplied": "Patch applied.",
    "msg.patchReverted": "Patch reverted.",
    "msg.patchRejected": "Patch rejected.",
    "msg.jobCreated": "Codex job created.",
    "msg.jobRunRequested": "Job approved and run requested.",
    "msg.reviewCreated": "Cross review created.",
    "msg.reviewDecided": "Review decision saved: {decision}.",
    "msg.logsRefreshed": "Logs refreshed.",
    "msg.logsCopied": "Logs copied.",
    "msg.logsCleared": "Logs cleared.",
    "msg.modeSet": "Permission mode set to {mode}.",
    "msg.fullAccessCancelled": "full_access was not enabled.",
    "msg.latestErrorsLoaded": "Latest errors loaded.",
    "msg.repairDraftReady": "Repair draft filled from latest error. Review it before creating.",
    "msg.repairCreated": "Repair proposal created.",
    "msg.repairApproved": "Repair approved and Codex job created/run.",
    "msg.repairRejected": "Repair rejected.",
    "msg.confirmApply": "Apply this patch to local files? Bridge will create a backup.",
    "msg.confirmRevert": "Revert this patch from local backup? This modifies files.",
    "msg.confirmClearLogs": "Clear local Bridge log files? Job and patch history remain.",
    "msg.confirmRepairRun": "Approve this repair and create/run the Codex repair job now?",
    "prompt.fullAccess": "Type I understand or 我已理解风险 to enable full_access.\n\nThis is dangerous; use only on disposable branches or demo projects.",
    "prompt.reviewSpeaker": "Speaker this round: chatgpt-web / codex / user",
    "prompt.reviewSummary": "Only write: blocking issue / concrete improvement / evidence / recommended decision",
    "placeholder.repairPlan": "1. Inspect the log for this requestId\n2. Identify the failing endpoint and input\n3. Make the smallest fix and run a smoke test",
    "disabled.readOnlyPatch": "Current permission mode is read_only, so apply/revert patch is blocked.",
    "disabled.applyStatus": "Only needs_approval patches can be applied.",
    "disabled.revertStatus": "Only applied patches can be reverted.",
    "disabled.reviewLimit": "Round limit reached. Choose a final decision.",
    "level.info": "info",
    "level.warn": "warn",
    "level.error": "error",
    "source.http_error": "HTTP error",
    "source.job_failure": "Job failure",
    "source.manual": "Manual",
    "patchMode.overwrite": "Overwrite file",
    "patchMode.create": "Create file",
    "reviewRound.1": "1 - decide quickly",
    "reviewRound.2": "2 - recommended",
    "reviewRound.3": "3 - maximum",
    "safety.1": "1 - low",
    "safety.2": "2 - moderate",
    "safety.3": "3 - high",
    "safety.4": "4 - critical",
    "safety.5": "5 - do not auto-run",
    "label.safety": "Safety level",
    "label.roles": "Roles",
    "label.files": "Files",
    "label.remaining": "Remaining rounds",
    "label.decision": "Decision",
    "label.pending": "Pending",
    "label.diagnosis": "Diagnosis",
    "label.solution": "Solution",
    "label.noRoles": "none",
    "label.logId": "log id",
    "label.request": "request",
    "label.job": "job",
    "label.expires": "expires",
    "label.rawDetails": "raw details",
    "button.view": "View",
    "button.diff": "Diff",
    "button.apply": "Apply",
    "button.revert": "Revert",
    "button.reviewPatch": "Create review job",
    "button.reject": "Reject",
    "button.approveRun": "Approve & run",
    "button.runAsync": "Run async",
    "button.runSync": "Run sync",
    "button.mirrorOutput": "Mirror output",
    "button.cancel": "Cancel",
    "button.addRound": "Add round",
    "button.useWeb": "Use web patch",
    "button.useCodex": "Use Codex",
    "button.hybrid": "Hybrid",
    "button.needsHuman": "Needs human",
    "button.accept": "Accept",
    "button.decline": "Decline",
    "button.createJob": "Create job",
    "empty.jobs": "No jobs yet.",
    "empty.patches": "No patches yet.",
    "empty.errors": "No errors.",
    "empty.logs": "No matching logs.",
    "empty.reviews": "No reviews yet.",
    "empty.approvals": "No approval requests.",
    "empty.repairs": "No repair proposals.",
    "empty.roles": "No roles loaded.",
    "empty.skills": "No skills loaded.",
    "empty.templates": "No templates loaded."
  }
};

const state = {
  baseUrl: localStorage.getItem(STORAGE.baseUrl) || window.location.origin,
  token: localStorage.getItem(STORAGE.token) || "",
  selectedProjectId: localStorage.getItem(STORAGE.projectId) || "",
  language: localStorage.getItem(STORAGE.language) || "zh",
  sidebarCollapsed: localStorage.getItem(STORAGE.sidebar) === "true",
  connection: "notConfigured",
  health: null,
  config: null,
  projects: [],
  jobs: [],
  patches: [],
  roles: [],
  skills: [],
  reviews: [],
  account: null,
  logs: [],
  diagnostics: null,
  approvals: [],
  repairs: [],
  templates: [],
  latestErrors: [],
  lastError: null,
  currentFile: null
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

class BridgeApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "BridgeApiError";
    Object.assign(this, details);
  }
}

function t(key, vars = {}) {
  const dict = I18N[state.language] || I18N.zh;
  const fallback = I18N.zh[key] || key;
  let value = dict[key] || fallback;
  Object.entries(vars).forEach(([name, replacement]) => {
    value = value.replaceAll(`{${name}}`, String(replacement));
  });
  return value;
}

function i18nValue(key) {
  const dict = I18N[state.language] || I18N.zh;
  return dict[key] || I18N.zh[key] || "";
}

function escapeHtml(input) {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function compactText(value, max = 180) {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function formatExecution(value) {
  return i18nValue(`exec.${value}`) || value || t("status.unknown");
}

function formatPermission(value) {
  return i18nValue(`mode.${value}`) || value || t("status.unknown");
}

function formatStatus(value) {
  return i18nValue(`status.${value}`) || value || t("status.unknown");
}

function formatRole(value) {
  return state.language === "zh" ? (i18nValue(`role.${value}`) || value) : value;
}

function formatCategory(value) {
  return state.language === "zh" ? (i18nValue(`category.${value}`) || value) : value;
}

function formatSafety(value) {
  return i18nValue(`safety.${value}`) || `${t("label.safety")} ${value}`;
}

function formatLevel(value) {
  return i18nValue(`level.${value}`) || value || t("status.unknown");
}

function formatSourceKind(value) {
  return i18nValue(`source.${value}`) || value || t("status.unknown");
}

function formatPatchMode(value) {
  return i18nValue(`patchMode.${value}`) || value || t("status.unknown");
}

function formatDecision(value) {
  if (!value) return t("label.pending");
  if (value === "web") return t("button.useWeb");
  if (value === "codex") return t("button.useCodex");
  if (value === "hybrid") return t("button.hybrid");
  if (value === "needs_human") return t("button.needsHuman");
  return value;
}

function localizeKnownText(value) {
  const text = String(value ?? "");
  if (state.language !== "zh" || !text) return text;
  const exact = new Map([
    ["Dry run only. Codex was not executed. Switch execution mode in Dashboard > Settings or copy codexPrompt into Codex.", "仅演练：没有实际调用本地执行器。需要真实执行时，请在“设置”里切换执行模式，或复制执行提示到本地执行器。"],
    ["No code was changed.", "没有修改代码。"],
    ["Dry-run job completed", "演练任务已完成"],
    ["Verification job", "验证任务"],
    ["Job run started", "任务已开始运行"],
    ["Job run finished", "任务运行完成"],
    ["Job run failed", "任务运行失败"],
    ["Runtime settings changed from dashboard", "运行设置已从控制台修改"],
    ["Permission mode changed", "权限模式已修改"],
    ["file not found", "文件不存在"],
    ["project not found", "项目不存在"],
    ["job not found", "任务不存在"],
    ["patch not found", "补丁不存在"],
    ["repair proposal not found", "修复方案不存在"],
    ["approval request not found", "审批请求不存在"],
    ["Bearer token is missing or invalid", "访问令牌缺失或已失效"],
    ["Runtime settings updated. Future requests must use the current token.", "运行设置已更新，后续请求会使用当前令牌。"],
    ["Mode changed. New Codex jobs will use this mode.", "权限模式已更新，新的执行任务会使用此模式。"]
  ]);
  if (exact.has(text)) return exact.get(text);
  const jobActionMatch = text.match(/^job cannot be (approved|cancelled|rejected|run) from status (.+)$/i);
  if (jobActionMatch) {
    const actionMap = { approved: "批准", cancelled: "取消", rejected: "拒绝", run: "运行" };
    return `任务处于“${formatStatus(jobActionMatch[2])}”状态，不能${actionMap[jobActionMatch[1]] || "执行该操作"}。`;
  }
  const patchActionMatch = text.match(/^patch cannot be (applied|reverted|rejected) from status (.+)$/i);
  if (patchActionMatch) {
    const actionMap = { applied: "应用", reverted: "回滚", rejected: "拒绝" };
    return `补丁处于“${formatStatus(patchActionMatch[2])}”状态，不能${actionMap[patchActionMatch[1]] || "执行该操作"}。`;
  }
  return text
    .replaceAll("Dry-run", "演练")
    .replaceAll("dry-run", "演练模式")
    .replaceAll("Codex", "本地执行器")
    .replaceAll("Dashboard", "控制台")
    .replaceAll("Settings", "设置")
    .replaceAll("Job", "任务")
    .replaceAll("job", "任务")
    .replaceAll("Patch", "补丁")
    .replaceAll("patch", "补丁")
    .replaceAll("permission mode", "权限模式")
    .replaceAll("Execution mode", "执行模式")
    .replaceAll("requestId", "请求编号");
}

function localizeKnownTitle(value) {
  const text = String(value ?? "");
  if (state.language !== "zh") return text;
  if (text === "Verification job") return "验证任务";
  if (text.startsWith("Repair: ")) return text.replace("Repair: ", "修复：");
  return text;
}

function templateField(template, field) {
  const key = `template.${template.id}.${field}`;
  return (I18N[state.language] || {})[key] || template[field] || "";
}

function templateRoles(roles = []) {
  const separator = state.language === "zh" ? "、" : ", ";
  return roles.map(formatRole).join(separator) || t("label.noRoles");
}

function normalizeRoleInput(value) {
  const aliases = new Map([
    ["前端工程", "frontend_engineer"],
    ["前端工程师", "frontend_engineer"],
    ["界面体验设计", "ui_ux_designer"],
    ["质量检查", "qa_reviewer"],
    ["测试检查", "qa_reviewer"],
    ["问题排查", "debugger"],
    ["后端工程", "backend_engineer"],
    ["后端工程师", "backend_engineer"],
    ["安全审查", "security_reviewer"],
    ["发布管理", "release_manager"]
  ]);
  return String(value || "")
    .split(/[,，、\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => aliases.get(item) || item);
}

function normalizeReviewSpeaker(value) {
  const aliases = new Map([
    ["网页端", "chatgpt-web"],
    ["网页", "chatgpt-web"],
    ["本地执行器", "codex"],
    ["执行器", "codex"],
    ["用户", "user"]
  ]);
  const input = String(value || "").trim();
  return aliases.get(input) || input;
}

function applyI18n() {
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
  document.title = t("document.title");
  $$("[data-i18n]").forEach((el) => {
    if (!el.dataset.i18nDefault) el.dataset.i18nDefault = el.textContent || "";
    const value = (I18N[state.language] || {})[el.dataset.i18n] || el.dataset.i18nDefault;
    el.textContent = value;
  });
  $$("[data-i18n-title]").forEach((el) => {
    if (!el.dataset.i18nTitleDefault) el.dataset.i18nTitleDefault = el.getAttribute("title") || "";
    const value = (I18N[state.language] || {})[el.dataset.i18nTitle] || el.dataset.i18nTitleDefault;
    el.setAttribute("title", value);
  });
  $$("[data-i18n-placeholder]").forEach((el) => {
    if (!el.dataset.i18nPlaceholderDefault) el.dataset.i18nPlaceholderDefault = el.getAttribute("placeholder") || "";
    const value = (I18N[state.language] || {})[el.dataset.i18nPlaceholder] || el.dataset.i18nPlaceholderDefault;
    el.setAttribute("placeholder", value);
  });
  $$("[data-i18n-aria-label]").forEach((el) => {
    if (!el.dataset.i18nAriaLabelDefault) el.dataset.i18nAriaLabelDefault = el.getAttribute("aria-label") || "";
    const value = (I18N[state.language] || {})[el.dataset.i18nAriaLabel] || el.dataset.i18nAriaLabelDefault;
    el.setAttribute("aria-label", value);
  });
  $$("[data-lang]").forEach((btn) => btn.classList.toggle("active", btn.dataset.lang === state.language));
  const navIconsZh = { overview: "总", projects: "项", files: "文", templates: "模", patches: "补", diffs: "差", jobs: "任", "codex-app": "连", approvals: "批", reviews: "交", screenshots: "图", repairs: "修", github: "同", logs: "志", knowledge: "技", access: "权", settings: "设" };
  const navIconsEn = { overview: "OV", projects: "PR", files: "FL", templates: "TP", patches: "WP", diffs: "DF", jobs: "CJ", "codex-app": "CA", approvals: "AP", reviews: "CR", screenshots: "UI", repairs: "RC", github: "GH", logs: "LG", knowledge: "RS", access: "AM", settings: "ST" };
  const mark = $(".brand-mark");
  if (mark) mark.textContent = state.language === "zh" ? "桥" : "CB";
  $$(".nav-item").forEach((btn) => {
    const label = btn.querySelector(".nav-label")?.textContent;
    if (label) btn.setAttribute("title", label);
    const icon = btn.querySelector(".nav-icon");
    const iconText = (state.language === "zh" ? navIconsZh : navIconsEn)[btn.dataset.view];
    if (icon && iconText) icon.textContent = iconText;
  });
}

function setLanguage(language) {
  state.language = language === "en" ? "en" : "zh";
  localStorage.setItem(STORAGE.language, state.language);
  applyI18n();
  renderAll();
}

function showAlert(message, type = "ok", { persist = false } = {}) {
  const el = $("#alert");
  el.className = `alert ${type === "error" ? "error" : type === "warn" ? "warn" : type === "info" ? "info" : ""}`;
  el.textContent = message;
  if (!persist && type !== "error") {
    window.setTimeout(() => el.classList.add("hidden"), 5200);
  }
}

function normalizeError(error) {
  if (error instanceof BridgeApiError) return error;
  return new BridgeApiError(error?.message || String(error), { original: error });
}

function showError(error) {
  const normalized = normalizeError(error);
  state.lastError = normalized;
  const el = $("#alert");
  const title = normalized.status === 401 ? t("error.unauthorized") : localizeKnownText(normalized.message || t("error.title"));
  el.className = "alert error";
  el.innerHTML = `
    <div class="alert-title">${escapeHtml(title)}</div>
    <dl class="alert-grid">
      <dt>${escapeHtml(t("field.endpoint"))}</dt><dd>${escapeHtml(normalized.endpoint || "-")}</dd>
      <dt>${escapeHtml(t("field.status"))}</dt><dd>${escapeHtml(normalized.status || "-")}</dd>
      <dt>${escapeHtml(t("field.requestId"))}</dt><dd>${escapeHtml(normalized.requestId || "-")}</dd>
      <dt>${escapeHtml(t("field.details"))}</dt><dd>${escapeHtml(localizeKnownText(normalized.detail || normalized.message || "-"))}</dd>
    </dl>
    <div>${escapeHtml(t("error.viewLogs"))}</div>
    <div class="alert-actions">
      <button class="button secondary" type="button" data-alert-action="logs">${escapeHtml(t("action.viewLogs"))}</button>
      <button class="button primary" type="button" data-alert-action="repair">${escapeHtml(t("action.createRepair"))}</button>
      <button class="button ghost" type="button" data-alert-action="close">${escapeHtml(t("action.close"))}</button>
    </div>
  `;
}

async function apiRequest(path, options = {}) {
  const baseUrl = (state.baseUrl || window.location.origin).replace(/\/$/, "");
  const { skipAuth = false, authToken, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  const token = authToken || state.token;
  if (token && !skipAuth) headers.set("Authorization", `Bearer ${token}`);
  if (fetchOptions.body && !headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...fetchOptions, headers });
  } catch (error) {
    throw new BridgeApiError(t("error.connectionFailed"), {
      endpoint: path,
      status: 0,
      detail: error?.message || String(error),
      original: error
    });
  }

  const requestId = response.headers.get("X-Request-Id") || undefined;
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    const message = response.status === 401
      ? t("error.unauthorized")
      : localizeKnownText(data?.message || data?.error || response.statusText || t("error.title"));
    throw new BridgeApiError(message, {
      endpoint: path,
      status: response.status,
      requestId: data?.requestId || requestId,
      detail: localizeKnownText(data?.error || data?.message || data?.raw || response.statusText),
      logHint: data?.logHint,
      repair: data?.repair,
      data
    });
  }
  return data;
}

function activeProject() {
  return state.projects.find((p) => p.id === state.selectedProjectId) || state.projects[0] || null;
}

function setView(view) {
  $$(".nav-item").forEach((btn) => btn.classList.toggle("active", btn.dataset.view === view));
  $$(".view").forEach((panel) => panel.classList.toggle("active", panel.id === `view-${view}`));
}

function setConnectionStatus(status, detail = "") {
  state.connection = status;
  const dotClass = status === "connected" ? "dot" : status === "offline" ? "dot bad" : status === "checking" ? "dot warn" : "dot muted";
  const text = status === "connected" ? t("status.connected") : status === "offline" ? t("status.offline") : status === "checking" ? t("status.checking") : t("status.notConfigured");
  ["#healthDot", "#topConnectionDot"].forEach((selector) => {
    const el = $(selector);
    if (el) el.className = dotClass;
  });
  const display = detail ? `${text} · ${detail}` : text;
  if ($("#healthText")) $("#healthText").textContent = display;
  if ($("#topConnectionText")) $("#topConnectionText").textContent = display;
}

function renderProjectSelect() {
  const select = $("#projectSelect");
  if (!select) return;
  select.innerHTML = "";
  if (!state.projects.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = t("status.noProjects");
    select.appendChild(option);
    return;
  }
  state.projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    select.appendChild(option);
  });
  if (!state.selectedProjectId || !state.projects.some((p) => p.id === state.selectedProjectId)) {
    state.selectedProjectId = state.projects[0].id;
    localStorage.setItem(STORAGE.projectId, state.selectedProjectId);
  }
  select.value = state.selectedProjectId;
}

function statusBadge(status) {
  const good = ["completed", "applied", "approved", "accepted", "executed"];
  const bad = ["failed", "rejected", "cancelled"];
  const warn = ["needs_approval", "running", "queued", "open"];
  const cls = good.includes(status) ? "good" : bad.includes(status) ? "bad" : warn.includes(status) ? "warn" : "info";
  return `<span class="badge ${cls}">${escapeHtml(formatStatus(status))}</span>`;
}

function renderMetrics() {
  const settings = state.config?.settings || {};
  const execution = state.config?.execution || state.health?.execution || "unknown";
  const permission = settings.permissionMode || state.health?.permissionMode || "unknown";
  const recentJob = state.jobs[0];
  const errors = (state.logs || []).filter((log) => log.level === "error");

  $("#metricConnection").textContent = state.connection === "connected" ? t("status.connected") : state.connection === "offline" ? t("status.offline") : t("status.notConfigured");
  $("#metricExecution").textContent = formatExecution(execution);
  $("#metricMode").textContent = formatPermission(permission);
  $("#metricProjects").textContent = String(state.projects.length);
  $("#metricPatches").textContent = String(state.patches.length);
  $("#metricRecentJob").textContent = recentJob ? `${localizeKnownTitle(recentJob.title)} · ${formatStatus(recentJob.status)}` : t("status.none");
  $("#metricErrors").textContent = String(errors.length);
  $("#executionChip").textContent = formatExecution(execution);
  $("#permissionChip").textContent = formatPermission(permission);
}

function renderOverviewLists() {
  const jobBox = $("#recentJobList");
  const errorBox = $("#recentErrorList");
  const jobs = state.jobs.slice(0, 4);
  if (!jobs.length) {
    jobBox.className = "item-list empty";
    jobBox.textContent = t("empty.jobs");
  } else {
    jobBox.className = "item-list";
    jobBox.innerHTML = jobs.map((job) => `
      <div class="item">
        <div class="item-title"><span>${escapeHtml(localizeKnownTitle(job.title))}</span>${statusBadge(job.status)}</div>
        <div class="item-meta">${escapeHtml(job.id)} · ${escapeHtml(formatSafety(job.safetyLevel))} · ${escapeHtml(job.updatedAt || job.createdAt)}</div>
      </div>
    `).join("");
  }

  const errors = (state.logs || []).filter((log) => log.level === "error").slice(0, 4);
  if (!errors.length) {
    errorBox.className = "item-list empty";
    errorBox.textContent = t("empty.errors");
  } else {
    errorBox.className = "item-list";
    errorBox.innerHTML = errors.map((log) => `
      <div class="item log-entry error">
        <div class="item-title"><span>${escapeHtml(log.scope || t("level.error"))}</span><span class="badge bad">${escapeHtml(formatLevel(log.level))}</span></div>
        <div class="item-meta">${escapeHtml(log.at)}${log.requestId ? ` · ${escapeHtml(t("field.requestId"))}=${escapeHtml(log.requestId)}` : ""}</div>
        <div class="item-meta">${escapeHtml(localizeKnownText(log.message))}</div>
      </div>
    `).join("");
  }
}

function renderPatches() {
  const box = $("#patchList");
  if (!box) return;
  if (!state.patches.length) {
    box.className = "item-list empty";
    box.textContent = t("empty.patches");
    return;
  }

  const settings = state.config?.settings || {};
  const readOnly = settings.permissionMode === "read_only";
  box.className = "item-list";
  box.innerHTML = state.patches.map((patch) => {
    const applyReason = readOnly ? t("disabled.readOnlyPatch") : patch.status !== "needs_approval" ? t("disabled.applyStatus") : "";
    const revertReason = readOnly ? t("disabled.readOnlyPatch") : patch.status !== "applied" ? t("disabled.revertStatus") : "";
    return `
      <div class="item">
        <div class="item-title"><span>${escapeHtml(patch.title)}</span>${statusBadge(patch.status)}</div>
        <div class="item-meta">${escapeHtml(patch.id)} · ${escapeHtml(t("label.files"))}: ${patch.changes?.length || 0} · ${escapeHtml(patch.updatedAt || patch.createdAt)}</div>
        <div class="item-meta">${escapeHtml(patch.rationale || "")}</div>
        <div class="item-actions">
          <button class="button secondary" data-action="view-patch" data-id="${patch.id}" type="button">${escapeHtml(t("button.view"))}</button>
          <button class="button secondary" data-action="diff-patch" data-id="${patch.id}" type="button">${escapeHtml(t("button.diff"))}</button>
          <button class="button primary ${applyReason ? "is-disabled" : ""}" data-action="apply-patch" data-id="${patch.id}" data-disabled-reason="${escapeHtml(applyReason)}" type="button">${escapeHtml(t("button.apply"))}</button>
          <button class="button secondary ${revertReason ? "is-disabled" : ""}" data-action="revert-patch" data-id="${patch.id}" data-disabled-reason="${escapeHtml(revertReason)}" type="button">${escapeHtml(t("button.revert"))}</button>
          <button class="button secondary" data-action="review-patch" data-id="${patch.id}" type="button">${escapeHtml(t("button.reviewPatch"))}</button>
          <button class="button danger" data-action="reject-patch" data-id="${patch.id}" type="button">${escapeHtml(t("button.reject"))}</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderJobs() {
  const box = $("#jobList");
  if (!box) return;
  if (!state.jobs.length) {
    box.className = "item-list empty";
    box.textContent = t("empty.jobs");
    return;
  }
  box.className = "item-list";
  box.innerHTML = state.jobs.map((job) => `
    <div class="item">
      <div class="item-title"><span>${escapeHtml(localizeKnownTitle(job.title))}</span>${statusBadge(job.status)}</div>
      <div class="item-meta">${escapeHtml(job.id)} · ${escapeHtml(formatSafety(job.safetyLevel))} · ${escapeHtml(t("label.roles"))}: ${escapeHtml(templateRoles(job.roles || []))}</div>
      <div class="item-meta">${escapeHtml(compactText(localizeKnownText(job.result || job.error || ""), 260))}</div>
      <div class="item-actions">
        <button class="button secondary" data-action="view-job" data-id="${job.id}" type="button">${escapeHtml(t("button.view"))}</button>
        <button class="button primary" data-action="approve-run-job" data-id="${job.id}" type="button">${escapeHtml(t("button.approveRun"))}</button>
        <button class="button primary" data-action="run-job-async" data-id="${job.id}" type="button">${escapeHtml(t("button.runAsync"))}</button>
        <button class="button secondary" data-action="run-job" data-id="${job.id}" type="button">${escapeHtml(t("button.runSync"))}</button>
        <button class="button secondary" data-action="mirror-output" data-id="${job.id}" type="button">${escapeHtml(t("button.mirrorOutput"))}</button>
        <button class="button danger" data-action="cancel-job" data-id="${job.id}" type="button">${escapeHtml(t("button.cancel"))}</button>
      </div>
    </div>
  `).join("");
}

function renderCodexApp() {
  const box = $("#codexAccountDetail");
  if (!box) return;
  if (!state.account) {
    box.textContent = state.language === "zh" ? "暂无账号信息。应用服务模式才支持账号和限额读取。" : "No account info loaded. app-server mode is required for account/rate-limit introspection.";
    return;
  }
  if (state.language === "zh") {
    box.innerHTML = `
      <div class="item-meta">账号读取：${escapeHtml(state.account.error ? "失败" : "可用")}</div>
      <div class="item-meta">退出码：${escapeHtml(state.account.exitCode ?? "-")}</div>
      <div class="item-meta">${escapeHtml(t("label.rawDetails"))}：如需排查请切换英文或查看日志。</div>
    `;
    return;
  }
  box.textContent = JSON.stringify(state.account, null, 2);
}

function renderAccessMode() {
  const detail = $("#accessModeDetail");
  if (!detail) return;
  const settings = state.config?.settings || {};
  if (state.language === "zh") {
    detail.innerHTML = `
      <div class="item-meta">运行模式：${escapeHtml(formatExecution(state.config?.execution || state.health?.execution || "unknown"))}</div>
      <div class="item-meta">权限模式：${escapeHtml(formatPermission(settings.permissionMode || state.health?.permissionMode || "unknown"))}</div>
      <div class="item-meta">补丁应用：${settings.allowWebPatchApply ? "允许" : "禁止"}</div>
      <div class="item-meta">任务审批：${settings.requireApprovalForAllRuns ? "全部需要人工批准" : "按安全等级判断"}</div>
      <div class="item-meta">网络访问：${settings.networkAccess ? "允许" : "禁止"}</div>
      <div class="item-meta">日志级别：${escapeHtml(formatLevel(settings.logLevel || "info"))}</div>
    `;
  } else {
    detail.textContent = JSON.stringify({ execution: state.config?.execution, settings }, null, 2);
  }
  $$("button[data-access-mode]").forEach((button) => {
    button.classList.toggle("active-mode", button.dataset.accessMode === settings.permissionMode);
  });
}

function filteredLogs() {
  const level = $("#logLevelFilter")?.value || "";
  const query = ($("#logSearch")?.value || "").trim().toLowerCase();
  return (state.logs || []).filter((log) => {
    if (level && log.level !== level) return false;
    if (!query) return true;
    return JSON.stringify(log).toLowerCase().includes(query);
  });
}

function renderLogs() {
  const box = $("#logList");
  if (!box) return;
  const logs = filteredLogs();
  $("#logCount").textContent = String(logs.length);
  const diag = $("#diagnosticsDetail");
  if (diag) {
    if (!state.diagnostics) {
      diag.textContent = state.language === "zh" ? "暂无诊断信息。" : "No diagnostics loaded.";
    } else if (state.language === "zh") {
      const counts = state.diagnostics.counts || {};
      diag.innerHTML = `
        <div class="item-meta">项目：${escapeHtml(counts.projects ?? 0)}</div>
        <div class="item-meta">任务：${escapeHtml(counts.jobs ?? 0)}</div>
        <div class="item-meta">补丁：${escapeHtml(counts.webPatches ?? 0)}</div>
        <div class="item-meta">审查：${escapeHtml(counts.reviews ?? 0)}</div>
        <div class="item-meta">审批：${escapeHtml(counts.approvals ?? 0)}</div>
        <div class="item-meta">修复方案：${escapeHtml(counts.repairs ?? 0)}</div>
        <div class="item-meta">错误：${escapeHtml(counts.errors ?? 0)}</div>
      `;
    } else {
      diag.textContent = JSON.stringify(state.diagnostics, null, 2);
    }
  }
  if (!logs.length) {
    box.className = "item-list empty";
    box.textContent = t("empty.logs");
    return;
  }
  box.className = "item-list logs";
  box.innerHTML = logs.map((log) => `
    <div class="item log-entry ${escapeHtml(log.level)}">
      <div class="item-title"><span>${escapeHtml(log.scope || "-")}</span><span class="badge ${log.level === "error" ? "bad" : log.level === "warn" ? "warn" : "info"}">${escapeHtml(formatLevel(log.level))}</span></div>
      <div class="item-meta">${escapeHtml(log.at)} · ${escapeHtml(t("label.logId"))}: ${escapeHtml(log.id || "-")}${log.requestId ? ` · ${escapeHtml(t("field.requestId"))}: ${escapeHtml(log.requestId)}` : ""}</div>
      <div class="item-meta">${escapeHtml(localizeKnownText(log.message || ""))}</div>
      ${log.data && state.language !== "zh" ? `<pre>${escapeHtml(JSON.stringify(log.data, null, 2))}</pre>` : ""}
    </div>
  `).join("");
}

function renderReviews() {
  const box = $("#reviewList");
  if (!box) return;
  if (!state.reviews.length) {
    box.className = "item-list empty";
    box.textContent = t("empty.reviews");
    return;
  }
  box.className = "item-list";
  box.innerHTML = state.reviews.map((review) => {
    const remaining = Math.max(0, Number(review.maxRounds || 0) - Number(review.roundsUsed || 0));
    const limitReason = remaining <= 0 ? t("disabled.reviewLimit") : "";
    return `
      <div class="item">
        <div class="item-title"><span>${escapeHtml(review.title)}</span>${statusBadge(review.status)}</div>
        <div class="item-meta">${escapeHtml(review.id)} · ${escapeHtml(t("field.maxRounds"))}: ${escapeHtml(review.roundsUsed)}/${escapeHtml(review.maxRounds)} · ${escapeHtml(t("label.remaining"))}: ${remaining} · ${escapeHtml(t("label.decision"))}: ${escapeHtml(formatDecision(review.decision))}</div>
        <div class="item-meta">${escapeHtml(t("field.webPatchId"))}: ${escapeHtml(review.webPatchId || "-")} · ${escapeHtml(t("field.codexJobId"))}: ${escapeHtml(review.codexJobId || "-")}</div>
        <div class="item-actions">
          <button class="button secondary" data-action="view-review" data-id="${review.id}" type="button">${escapeHtml(t("button.view"))}</button>
          <button class="button secondary ${limitReason ? "is-disabled" : ""}" data-action="add-review-round" data-id="${review.id}" data-disabled-reason="${escapeHtml(limitReason)}" type="button">${escapeHtml(t("button.addRound"))}</button>
          <button class="button primary" data-action="decide-review-web" data-id="${review.id}" type="button">${escapeHtml(t("button.useWeb"))}</button>
          <button class="button primary" data-action="decide-review-codex" data-id="${review.id}" type="button">${escapeHtml(t("button.useCodex"))}</button>
          <button class="button primary" data-action="decide-review-hybrid" data-id="${review.id}" type="button">${escapeHtml(t("button.hybrid"))}</button>
          <button class="button danger" data-action="decide-review-human" data-id="${review.id}" type="button">${escapeHtml(t("button.needsHuman"))}</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderApprovals() {
  const box = $("#approvalList");
  if (!box) return;
  if (!state.approvals.length) {
    box.className = "item-list empty";
    box.textContent = t("empty.approvals");
    return;
  }
  box.className = "item-list";
  box.innerHTML = state.approvals.map((approval) => `
    <div class="item">
      <div class="item-title"><span>${escapeHtml(approval.method)}</span>${statusBadge(approval.status)}</div>
      <div class="item-meta">${escapeHtml(approval.id)} · ${escapeHtml(t("label.job"))}: ${escapeHtml(approval.jobId)} · ${escapeHtml(t("label.expires"))}: ${escapeHtml(approval.expiresAt || "-")}</div>
      ${state.language === "zh" ? `<div class="item-meta">${escapeHtml(t("label.rawDetails"))}：请切换英文或查看日志。</div>` : `<pre>${escapeHtml(JSON.stringify(approval.params, null, 2))}</pre>`}
      <div class="item-actions">
        <button class="button primary" data-action="approve-codex-approval" data-id="${approval.id}" type="button">${escapeHtml(t("button.accept"))}</button>
        <button class="button danger" data-action="decline-codex-approval" data-id="${approval.id}" type="button">${escapeHtml(t("button.decline"))}</button>
      </div>
    </div>
  `).join("");
}

function renderRepairs() {
  const box = $("#repairList");
  if (!box) return;
  if (!state.repairs.length) {
    box.className = "item-list empty";
    box.textContent = t("empty.repairs");
    return;
  }
  box.className = "item-list";
  box.innerHTML = state.repairs.map((repair) => `
    <div class="item">
      <div class="item-title"><span>${escapeHtml(repair.errorSummary)}</span>${statusBadge(repair.status)}</div>
      <div class="item-meta">${escapeHtml(repair.id)} · ${escapeHtml(t("field.requestId"))}: ${escapeHtml(repair.sourceRequestId || "-")} · ${escapeHtml(t("label.job"))}: ${escapeHtml(repair.createdCodexJobId || "-")}</div>
      <div class="item-meta"><strong>${escapeHtml(t("label.diagnosis"))}:</strong> ${escapeHtml(repair.conciseDiagnosis)}</div>
      <div class="item-meta"><strong>${escapeHtml(t("label.solution"))}:</strong> ${escapeHtml(repair.solution)}</div>
      <div class="item-actions">
        <button class="button secondary" data-action="view-repair" data-id="${repair.id}" type="button">${escapeHtml(t("button.view"))}</button>
        <button class="button primary" data-action="approve-repair-run" data-id="${repair.id}" type="button">${escapeHtml(t("button.approveRun"))}</button>
        <button class="button danger" data-action="reject-repair" data-id="${repair.id}" type="button">${escapeHtml(t("button.reject"))}</button>
      </div>
    </div>
  `).join("");
}

function renderKnowledge() {
  const roleBox = $("#roleList");
  const skillBox = $("#skillList");
  if (roleBox) {
    roleBox.className = state.roles.length ? "item-list" : "item-list empty";
    roleBox.innerHTML = state.roles.length ? state.roles.map((role) => `
      <div class="item">
        <div class="item-title"><span>${escapeHtml(state.language === "zh" ? formatRole(role.id) : role.name)}</span><span class="badge">${escapeHtml(role.id)}</span></div>
        <div class="item-meta">${state.language === "zh" ? escapeHtml("角色协议已加载。详细原文可切换英文查看。") : `<pre>${escapeHtml(role.preview || "")}</pre>`}</div>
      </div>
    `).join("") : t("empty.roles");
  }
  if (skillBox) {
    skillBox.className = state.skills.length ? "item-list" : "item-list empty";
    skillBox.innerHTML = state.skills.length ? state.skills.map((skill) => `
      <div class="item">
        <div class="item-title"><span>${escapeHtml(skill.id)}</span><span class="badge">${escapeHtml(t("knowledge.skills"))}</span></div>
        <div class="item-meta">${state.language === "zh" ? escapeHtml("本地技能已加载。详细原文可切换英文查看。") : `<pre>${escapeHtml(skill.frontmatter || "No frontmatter")}</pre>`}</div>
      </div>
    `).join("") : t("empty.skills");
  }
}

function renderTemplates() {
  const box = $("#templateList");
  if (!box) return;
  if (!state.templates.length) {
    box.className = "item-list empty";
    box.textContent = t("empty.templates");
    return;
  }
  box.className = "item-list";
  box.innerHTML = state.templates.map((tpl) => `
    <div class="item">
      <div class="item-title"><span>${escapeHtml(templateField(tpl, "title"))}</span><span class="badge">${escapeHtml(formatCategory(tpl.category))}</span></div>
      <div class="item-meta">${state.language === "zh" ? "" : `${escapeHtml(tpl.id)} · `}${escapeHtml(formatSafety(tpl.safetyLevel))} · ${escapeHtml(t("label.roles"))}: ${escapeHtml(templateRoles(tpl.roles || []))}</div>
      <div class="item-meta">${escapeHtml(templateField(tpl, "prompt"))}</div>
      <div class="item-actions"><button class="button primary" data-action="create-template-job" data-id="${tpl.id}" type="button">${escapeHtml(t("button.createJob"))}</button></div>
    </div>
  `).join("");
}

function renderAll() {
  renderProjectSelect();
  renderMetrics();
  renderOverviewLists();
  renderPatches();
  renderJobs();
  renderCodexApp();
  renderAccessMode();
  renderLogs();
  renderReviews();
  renderApprovals();
  renderRepairs();
  renderKnowledge();
  renderTemplates();
  renderSettingsForm();
}

function renderSettingsForm() {
  const form = $("#settingsForm");
  if (!form) return;
  const execution = state.config?.execution || state.health?.execution || "dry-run";
  const permissionMode = state.config?.settings?.permissionMode || state.health?.permissionMode || "manual_review";
  if (form.elements.token) form.elements.token.value = state.token || "";
  if (form.elements.execution) {
    Array.from(form.elements.execution.options).forEach((option) => {
      option.textContent = formatExecution(option.value);
    });
  }
  if (form.elements.permissionMode) {
    Array.from(form.elements.permissionMode.options).forEach((option) => {
      option.textContent = formatPermission(option.value);
    });
  }
  if (form.elements.execution) form.elements.execution.value = execution;
  if (form.elements.permissionMode) form.elements.permissionMode.value = permissionMode;
}

async function bootstrapLocalSettings() {
  if (state.token) return null;
  try {
    const data = await apiRequest("/bootstrap", { method: "GET", skipAuth: true });
    if (!data?.token) return null;
    state.baseUrl = String(data.baseUrl || state.baseUrl || window.location.origin).replace(/\/$/, "");
    state.token = String(data.token || "").trim();
    localStorage.setItem(STORAGE.baseUrl, state.baseUrl);
    localStorage.setItem(STORAGE.token, state.token);
    $("#settingsForm [name=baseUrl]").value = state.baseUrl;
    $("#settingsForm [name=token]").value = state.token;
    if ($("#settingsForm [name=execution]")) $("#settingsForm [name=execution]").value = data.execution || "dry-run";
    if ($("#settingsForm [name=permissionMode]")) $("#settingsForm [name=permissionMode]").value = data.permissionMode || "manual_review";
    $("#settingsStatus").textContent = t("msg.bootstrapReady");
    state.health = { ok: true, execution: data.execution, permissionMode: data.permissionMode, version: data.version };
    return data;
  } catch {
    return null;
  }
}

async function checkHealthOnly() {
  try {
    setConnectionStatus("checking");
    const health = await apiRequest("/health", { method: "GET" });
    state.health = health;
    if (!state.token) {
      setConnectionStatus("notConfigured");
    }
    return health;
  } catch (error) {
    state.health = null;
    setConnectionStatus("offline");
    throw error;
  }
}

async function testConnection({ silent = false } = {}) {
  state.baseUrl = ($("#settingsForm [name=baseUrl]")?.value || state.baseUrl || window.location.origin).trim().replace(/\/$/, "");
  state.token = ($("#settingsForm [name=token]")?.value || state.token || "").trim();

  if (!state.token) await bootstrapLocalSettings();

  if (!state.token) {
    try {
      await checkHealthOnly();
    } catch {
      // The visible message below is more useful than a raw health failure while token is empty.
    }
    const message = t("error.needSettings");
    $("#settingsStatus").textContent = message;
    setConnectionStatus("notConfigured");
    if (!silent) showAlert(message, "info", { persist: true });
    renderAll();
    return null;
  }

  try {
    setConnectionStatus("checking");
    const [health, config] = await Promise.all([apiRequest("/health"), apiRequest("/config")]);
    state.health = health;
    state.config = config;
    const execution = config.execution || health.execution || "unknown";
    const permissionMode = config.settings?.permissionMode || health.permissionMode || "unknown";
    setConnectionStatus("connected", `${formatExecution(execution)} · ${formatPermission(permissionMode)}`);
    const message = t("msg.connectionOk", { execution: formatExecution(execution), permissionMode: formatPermission(permissionMode) });
    $("#settingsStatus").textContent = message;
    if (!silent) showAlert(message, "ok");
    renderAll();
    return { health, config };
  } catch (error) {
    setConnectionStatus(error?.status === 401 ? "notConfigured" : "offline");
    $("#settingsStatus").textContent = normalizeError(error).message;
    if (!silent) showError(error);
    throw error;
  }
}

async function loadAll({ silent = false } = {}) {
  try {
    if (!state.token) await bootstrapLocalSettings();
    if (!state.token) {
      await checkHealthOnly().catch(() => null);
      renderAll();
      if (!silent) showAlert(t("error.needSettings"), "info", { persist: true });
      return;
    }

    const connection = await testConnection({ silent: true });
    if (!connection) return;
    const [projects, jobs, patches, roles, skills, reviews, account, logs, diagnostics, approvals, repairs, templates] = await Promise.all([
      apiRequest("/projects"),
      apiRequest("/codex/jobs"),
      apiRequest("/web-patches"),
      apiRequest("/roles"),
      apiRequest("/skills"),
      apiRequest("/reviews"),
      apiRequest("/codex/account").catch((err) => ({ error: err.message })),
      apiRequest("/logs?limit=200").catch((err) => ({ logs: [{ level: "error", scope: "dashboard", message: err.message, at: new Date().toISOString(), requestId: err.requestId }] })),
      apiRequest("/diagnostics").catch((err) => ({ error: err.message })),
      apiRequest("/codex/approvals").catch(() => ({ approvals: [] })),
      apiRequest("/repairs").catch(() => ({ repairs: [] })),
      apiRequest("/task-templates").catch(() => ({ templates: [] }))
    ]);

    state.projects = projects.projects || [];
    state.jobs = jobs.jobs || [];
    state.patches = patches.webPatches || patches.patches || [];
    state.roles = roles.roles || [];
    state.skills = skills.skills || [];
    state.reviews = reviews.reviews || [];
    state.account = account || null;
    state.logs = logs.logs || [];
    state.diagnostics = diagnostics || null;
    state.approvals = approvals.approvals || [];
    state.repairs = repairs.repairs || [];
    state.templates = templates.templates || [];
    renderAll();
    if (!silent) showAlert(t("msg.refreshDone"), "ok");
  } catch (error) {
    showError(error);
  }
}

async function inspectSelectedProject() {
  const project = activeProject();
  if (!project) return showAlert(t("msg.projectRequired"), "error", { persist: true });
  const [inspect, status, diff] = await Promise.all([
    apiRequest(`/projects/${project.id}/inspect`),
    apiRequest(`/projects/${project.id}/git/status`).catch((err) => ({ stdout: "", stderr: err.message })),
    apiRequest(`/projects/${project.id}/git/diff`).catch((err) => ({ stdout: "", stderr: err.message }))
  ]);
  $("#projectDetail").textContent = state.language === "zh"
    ? [
      `项目：${project.name}`,
      `路径：${project.path}`,
      `文件数量：${inspect.tree?.length || inspect.entries?.length || 0}`,
      `版本状态：${compactText(localizeKnownText(status.stdout || status.stderr || "暂无输出"), 1200)}`,
      `当前差异预览：${compactText(diff.stdout || diff.stderr || "暂无差异", 3000)}`
    ].join("\n")
    : JSON.stringify({ inspect, gitStatus: status, gitDiffPreview: String(diff.stdout || diff.stderr || "").slice(0, 5000) }, null, 2);
  setView("projects");
}

async function loadTree() {
  const project = activeProject();
  if (!project) return showAlert(t("msg.projectRequired"), "error", { persist: true });
  const data = await apiRequest(`/projects/${project.id}/tree?limit=500`);
  $("#projectDetail").textContent = (data.entries || data.tree || []).map((entry) => `${entry.type === "dir" ? "[d]" : "[f]"} ${entry.path}${entry.size ? ` (${entry.size}b)` : ""}`).join("\n");
}

function renderFileTree(entries) {
  const box = $("#fileTreeDetail");
  if (!entries?.length) {
    box.className = "codebox small";
    box.textContent = state.language === "zh" ? "未找到文件。" : "No files found.";
    return;
  }
  box.className = "file-tree codebox small";
  box.innerHTML = entries.map((entry) => {
    const isFile = entry.type !== "dir";
    const tag = isFile ? "button" : "div";
    return `
      <${tag} class="tree-row" ${isFile ? `type="button" data-file-path="${escapeHtml(entry.path)}"` : ""} title="${escapeHtml(entry.path)}">
        <span class="tree-kind">${state.language === "zh" ? (isFile ? "文件" : "目录") : (isFile ? "file" : "dir")}</span>
        <span class="tree-path">${escapeHtml(entry.path)}</span>
        <span class="tree-size">${entry.size ? `${escapeHtml(entry.size)}b` : ""}</span>
      </${tag}>
    `;
  }).join("");
}

async function loadFileTreePanel() {
  const project = activeProject();
  if (!project) return showAlert(t("msg.projectRequired"), "error", { persist: true });
  const data = await apiRequest(`/projects/${project.id}/tree?limit=800`);
  renderFileTree(data.entries || data.tree || []);
  setView("files");
}

async function readFilePath(filePath) {
  const project = activeProject();
  if (!project) return showAlert(t("msg.projectRequired"), "error", { persist: true });
  const data = await apiRequest(`/projects/${project.id}/files/read?path=${encodeURIComponent(filePath)}`);
  state.currentFile = data.file;
  const info = state.language === "zh"
    ? [`路径：${data.file.path}`, `大小：${data.file.size} 字节`, `更新时间：${data.file.updatedAt || "-"}`].join("\n")
    : JSON.stringify({ path: data.file.path, size: data.file.size, updatedAt: data.file.updatedAt }, null, 2);
  const box = $("#fileTreeDetail");
  box.className = "codebox small";
  box.textContent = `${info}\n\n${data.file.content}`;
  const patchForm = $("#filePatchForm");
  patchForm.elements.filePath.value = data.file.path;
  patchForm.elements.title.value = state.language === "zh" ? `更新 ${data.file.path}` : `Update ${data.file.path}`;
  patchForm.elements.content.value = data.file.content;
  $("#fileReadForm").elements.filePath.value = data.file.path;
  showAlert(t("msg.fileLoaded"));
}

async function readFilePanel(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const filePath = String(form.get("filePath") || "").trim();
  await readFilePath(filePath);
}

async function createContextPack(event) {
  event.preventDefault();
  const project = activeProject();
  if (!project) return showAlert(t("msg.projectRequired"), "error", { persist: true });
  const form = new FormData(event.currentTarget);
  const paths = String(form.get("paths") || "").split(",").map((x) => x.trim()).filter(Boolean);
  const data = await apiRequest(`/projects/${project.id}/context-pack`, {
    method: "POST",
    body: JSON.stringify({ paths, includeTree: true, includeGitStatus: true, includeDiff: form.get("includeDiff") === "on", includeRoles: true, includeSkills: true, notes: form.get("notes") || "" })
  });
  $("#fileTreeDetail").className = "codebox small";
  $("#fileTreeDetail").textContent = state.language === "zh"
    ? `上下文包：${data.pack.id}\n保存位置：${data.pack.filePath}\n\n${data.markdown.slice(0, 20000)}`
    : `Context pack ${data.pack.id}\nSaved at: ${data.pack.filePath}\n\n${data.markdown.slice(0, 20000)}`;
  showAlert(t("msg.contextPackCreated"));
}

async function createPatchFromFileEditor(event) {
  event.preventDefault();
  const formEl = event.currentTarget;
  const project = activeProject();
  if (!project) return showAlert(t("msg.projectRequired"), "error", { persist: true });
  const form = new FormData(formEl);
  const data = await apiRequest("/web-patches", {
    method: "POST",
    body: JSON.stringify({
      projectId: project.id,
      title: form.get("title"),
      rationale: form.get("rationale") || (state.language === "zh" ? "从文件编辑器创建。" : "Created from Files editor."),
      changes: [{ filePath: form.get("filePath"), mode: "overwrite", content: form.get("content") }]
    })
  });
  if (data.patch) {
    state.patches.unshift(data.patch);
    renderPatches();
    renderMetrics();
  }
  showAlert(t("msg.patchCreated"));
  await loadAll({ silent: true });
}

async function loadTestPlan() {
  const project = activeProject();
  if (!project) return showAlert(t("msg.projectRequired"), "error", { persist: true });
  const data = await apiRequest(`/projects/${project.id}/test-plan`);
  const plan = data.testPlan || {};
  $("#templateDetail").textContent = state.language === "zh"
    ? `推荐检查：\n${(plan.recommended || []).map((cmd) => `- ${cmd.command || "命令"}: ${cmd.script || ""}`).join("\n") || "暂无推荐检查。"}`
    : JSON.stringify(data, null, 2);
  setView("templates");
}

async function createTestJob() {
  const project = activeProject();
  if (!project) return showAlert(t("msg.projectRequired"), "error", { persist: true });
  const scope = state.language === "zh" ? "验证当前改动，先运行最小安全检查。" : "Verify current changes after ChatGPT/Codex work.";
  const data = await apiRequest(`/projects/${project.id}/test-job`, { method: "POST", body: JSON.stringify({ scope, runImmediately: false }) });
  $("#templateDetail").textContent = state.language === "zh"
    ? `验证任务已创建：${data.job?.id || "-"}\n状态：${formatStatus(data.job?.status)}`
    : JSON.stringify(data, null, 2);
  showAlert(t("msg.jobCreated"));
  await loadAll({ silent: true });
}

function renderDiffText(text) {
  const box = $("#diffDetail");
  const lines = String(text || "").split(/\r?\n/);
  if (!text) {
    box.className = "codebox diffbox empty";
    box.textContent = state.language === "zh" ? "暂无 diff。" : "No diff loaded.";
    return;
  }
  box.className = "codebox diffbox";
  box.innerHTML = lines.map((line) => {
    const cls = line.startsWith("@@") ? "hunk" : line.startsWith("+++") || line.startsWith("---") ? "file" : line.startsWith("+") ? "add" : line.startsWith("-") ? "del" : "context";
    return `<span class="diff-line ${cls}">${escapeHtml(line || " ")}</span>`;
  }).join("");
}

async function loadPatchDiffById(patchId) {
  const data = await apiRequest(`/web-patches/${patchId}/diff`);
  const diffText = (data.diff?.files || []).map((file) => file.diff).join("\n\n");
  renderDiffText(diffText);
  setView("diffs");
}

async function loadPatchDiff(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const patchId = String(form.get("patchId") || "").trim();
  if (!patchId) return showAlert(state.language === "zh" ? "请填写补丁编号。" : "Patch ID is required.", "error", { persist: true });
  await loadPatchDiffById(patchId);
}

async function createScreenshotReview(event) {
  event.preventDefault();
  const formEl = event.currentTarget;
  const project = activeProject();
  if (!project) return showAlert(t("msg.projectRequired"), "error", { persist: true });
  const form = new FormData(formEl);
  const data = await apiRequest(`/projects/${project.id}/ui/screenshot-review-job`, {
    method: "POST",
    body: JSON.stringify({
      url: form.get("url") || undefined,
      runCommand: form.get("runCommand") || undefined,
      notes: form.get("notes") || "",
      screenshotPaths: String(form.get("screenshotPaths") || "").split(",").map((x) => x.trim()).filter(Boolean)
    })
  });
  if (data.job) {
    state.jobs.unshift(data.job);
    renderJobs();
    renderMetrics();
  }
  showAlert(t("msg.jobCreated"));
  formEl.reset();
  await loadAll({ silent: true });
}

async function createGitBranch(event) {
  event.preventDefault();
  const project = activeProject();
  if (!project) return showAlert(t("msg.projectRequired"), "error", { persist: true });
  const form = new FormData(event.currentTarget);
  const data = await apiRequest(`/projects/${project.id}/git/branch`, { method: "POST", body: JSON.stringify({ branchName: form.get("branchName"), checkout: true, create: true }) });
  $("#githubDetail").textContent = JSON.stringify(data, null, 2);
}

async function createGitCommit(event) {
  event.preventDefault();
  const project = activeProject();
  if (!project) return showAlert(t("msg.projectRequired"), "error", { persist: true });
  const form = new FormData(event.currentTarget);
  const data = await apiRequest(`/projects/${project.id}/git/commit`, { method: "POST", body: JSON.stringify({ message: form.get("message"), addAll: form.get("addAll") === "on" }) });
  $("#githubDetail").textContent = JSON.stringify(data, null, 2);
}

async function createGithubPr(event) {
  event.preventDefault();
  const project = activeProject();
  if (!project) return showAlert(t("msg.projectRequired"), "error", { persist: true });
  const form = new FormData(event.currentTarget);
  const data = await apiRequest(`/projects/${project.id}/github/pr`, { method: "POST", body: JSON.stringify({ title: form.get("title"), body: form.get("body") || "", base: form.get("base") || "main", draft: form.get("draft") !== "off" }) });
  $("#githubDetail").textContent = JSON.stringify(data, null, 2);
}

async function loadLatestErrors(requestId = "") {
  const query = requestId ? `?requestId=${encodeURIComponent(requestId)}` : "?limit=5";
  const data = await apiRequest(`/errors/latest${query}`);
  state.latestErrors = data.errors || [];
  const detail = $("#repairSourceDetail");
  if (state.language === "zh") {
    detail.innerHTML = state.latestErrors.length
      ? state.latestErrors.map((item) => `
        <div class="item-meta">${escapeHtml(t("field.requestId"))}: ${escapeHtml(item.requestId || "-")}</div>
        <div class="item-meta">${escapeHtml(t("field.endpoint"))}: ${escapeHtml(item.data?.path || item.path || "-")}</div>
        <div class="item-meta">${escapeHtml(t("field.details"))}: ${escapeHtml(localizeKnownText(item.message || item.error || "-"))}</div>
      `).join("")
      : "暂无错误。";
  } else {
    detail.textContent = JSON.stringify(data, null, 2);
  }
  showAlert(t("msg.latestErrorsLoaded"));
  return data;
}

function fillRepairFromError(errorOrLog) {
  const error = errorOrLog || state.latestErrors[0] || state.lastError;
  if (!error) return showAlert(state.language === "zh" ? "没有可用错误。" : "No error available.", "warn");
  const form = $("#repairForm");
  const requestId = error.requestId || "";
  const message = error.message || error.error || error.detail || error.message || "Unknown error";
  form.elements.sourceKind.value = "http_error";
  form.elements.sourceRequestId.value = requestId;
  form.elements.errorSummary.value = compactText(localizeKnownText(message), 160);
  form.elements.conciseDiagnosis.value = state.language === "zh"
    ? `请求失败。先根据请求编号=${requestId || "-"} 在日志中定位接口、状态码和后端错误详情。`
    : `Request failed. Use requestId=${requestId || "-"} in Logs to identify endpoint, HTTP status, and backend details.`;
  form.elements.solution.value = state.language === "zh"
    ? "先做最小可验证修复：确认设置、请求参数和权限模式；若是代码问题，只修改相关模块并运行冒烟测试。"
    : "Make the smallest verifiable fix: confirm Settings, request payload, and access mode; if code is at fault, edit only related modules and run smoke tests.";
  form.elements.executionPlan.value = t("placeholder.repairPlan");
  form.elements.codexTask.value = state.language === "zh"
    ? `请调查请求编号=${requestId || "-"} 对应错误，提出并实现最小修复，然后运行相关检查。`
    : `Investigate the error for requestId=${requestId || "-"}, implement the smallest fix, then run relevant checks.`;
  form.elements.safetyLevel.value = "2";
  setView("repairs");
  showAlert(t("msg.repairDraftReady"));
}

async function createRepair(event) {
  event.preventDefault();
  const formEl = event.currentTarget;
  const project = activeProject();
  const form = new FormData(formEl);
  const data = await apiRequest("/repairs", {
    method: "POST",
    body: JSON.stringify({
      projectId: project?.id,
      sourceRequestId: form.get("sourceRequestId") || undefined,
      sourceKind: form.get("sourceKind") || "manual",
      errorSummary: form.get("errorSummary"),
      conciseDiagnosis: form.get("conciseDiagnosis"),
      solution: form.get("solution"),
      executionPlan: String(form.get("executionPlan") || "").split("\n").map((x) => x.trim()).filter(Boolean),
      codexTask: form.get("codexTask") || undefined,
      safetyLevel: Number(form.get("safetyLevel") || 2)
    })
  });
  if (data.repair) {
    state.repairs.unshift(data.repair);
    renderRepairs();
  }
  showAlert(t("msg.repairCreated"));
  formEl.reset();
  await loadAll({ silent: true });
}

async function createProject(event) {
  event.preventDefault();
  const formEl = event.currentTarget;
  const form = new FormData(formEl);
  const project = await apiRequest("/projects", {
    method: "POST",
    body: JSON.stringify({ name: form.get("name"), path: form.get("path"), allowShell: form.get("allowShell") === "on" })
  });
  const savedProject = project.project;
  if (savedProject) {
    const existingIndex = state.projects.findIndex((item) => item.id === savedProject.id);
    if (existingIndex >= 0) state.projects[existingIndex] = savedProject;
    else state.projects.unshift(savedProject);
    state.selectedProjectId = savedProject.id;
    localStorage.setItem(STORAGE.projectId, state.selectedProjectId);
    renderProjectSelect();
    renderMetrics();
  }
  showAlert(t("msg.projectRegistered", { name: project.project.name }));
  formEl.reset();
  await loadAll({ silent: true });
}

async function createPatch(event) {
  event.preventDefault();
  const formEl = event.currentTarget;
  const project = activeProject();
  if (!project) return showAlert(t("msg.projectRequired"), "error", { persist: true });
  const form = new FormData(formEl);
  const data = await apiRequest("/web-patches", {
    method: "POST",
    body: JSON.stringify({
      projectId: project.id,
      title: form.get("title"),
      rationale: form.get("rationale") || "",
      changes: [{ filePath: form.get("filePath"), mode: form.get("mode"), content: form.get("content") }]
    })
  });
  if (data.patch) {
    state.patches.unshift(data.patch);
    renderPatches();
    renderMetrics();
  }
  showAlert(t("msg.patchCreated"));
  formEl.reset();
  await loadAll({ silent: true });
}

async function createJob(event) {
  event.preventDefault();
  const formEl = event.currentTarget;
  const project = activeProject();
  if (!project) return showAlert(t("msg.projectRequired"), "error", { persist: true });
  const form = new FormData(formEl);
  const roles = normalizeRoleInput(form.get("roles"));
  const data = await apiRequest("/codex/jobs", {
    method: "POST",
    body: JSON.stringify({
      projectId: project.id,
      title: form.get("title"),
      task: form.get("task"),
      roles,
      safetyLevel: Number(form.get("safetyLevel") || 1)
    })
  });
  if (data.job) {
    state.jobs.unshift(data.job);
    renderJobs();
    renderMetrics();
  }
  showAlert(t("msg.jobCreated"));
  formEl.reset();
  await loadAll({ silent: true });
}

async function createReview(event) {
  event.preventDefault();
  const formEl = event.currentTarget;
  const project = activeProject();
  if (!project) return showAlert(t("msg.projectRequired"), "error", { persist: true });
  const form = new FormData(formEl);
  const data = await apiRequest("/reviews", {
    method: "POST",
    body: JSON.stringify({
      projectId: project.id,
      title: form.get("title"),
      webPatchId: form.get("webPatchId") || undefined,
      codexJobId: form.get("codexJobId") || undefined,
      webSummary: form.get("webSummary") || undefined,
      codexSummary: form.get("codexSummary") || undefined,
      maxRounds: Number(form.get("maxRounds") || 2)
    })
  });
  if (data.review) {
    state.reviews.unshift(data.review);
    renderReviews();
  }
  showAlert(t("msg.reviewCreated"));
  formEl.reset();
  await loadAll({ silent: true });
}

async function refreshAccount() {
  state.account = await apiRequest("/codex/account");
  renderCodexApp();
}

async function resetCodexSession() {
  const data = await apiRequest("/codex/session/reset", { method: "POST", body: JSON.stringify({}) });
  $("#codexAccountDetail").textContent = state.language === "zh"
    ? "运行说明已刷新。应用服务模式只同步本工具启动的任务；直接在桌面应用中单独打开的任务不一定会自动出现在这里。"
    : JSON.stringify(data, null, 2);
}

async function refreshLogs() {
  const [logs, diagnostics] = await Promise.all([apiRequest("/logs?limit=200"), apiRequest("/diagnostics")]);
  state.logs = logs.logs || [];
  state.diagnostics = diagnostics || null;
  renderLogs();
  renderMetrics();
  showAlert(t("msg.logsRefreshed"));
}

async function clearLogs() {
  if (!window.confirm(t("msg.confirmClearLogs"))) return;
  await apiRequest("/logs/clear", { method: "POST", body: JSON.stringify({}) });
  state.logs = [];
  await refreshLogs();
  showAlert(t("msg.logsCleared"));
}

async function copyLogs() {
  const logs = filteredLogs();
  await navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
  showAlert(t("msg.logsCopied"));
}

async function setAccessMode(mode) {
  const payload = { permissionMode: mode };
  if (mode === "full_access") {
    const confirmation = window.prompt(t("prompt.fullAccess"));
    if (!["I understand", "我已理解风险"].includes(confirmation || "")) return showAlert(t("msg.fullAccessCancelled"), "error", { persist: true });
    payload.confirmFullAccess = confirmation;
  }
  const data = await apiRequest("/config/access-mode", { method: "POST", body: JSON.stringify(payload) });
  state.config = { ...(state.config || {}), settings: data.settings };
  renderAccessMode();
  renderMetrics();
  await refreshLogs();
  showAlert(t("msg.modeSet", { mode: formatPermission(mode) }));
}

async function decideReview(id, decision) {
  await apiRequest(`/reviews/${id}/decision`, {
    method: "POST",
    body: JSON.stringify({ decision, rationale: `Dashboard final decision: ${decision}` })
  });
  showAlert(t("msg.reviewDecided", { decision: formatDecision(decision) }));
}

async function addReviewRound(id) {
  const speaker = normalizeReviewSpeaker(window.prompt(t("prompt.reviewSpeaker"), state.language === "zh" ? "本地执行器" : "codex"));
  if (!["chatgpt-web", "codex", "user"].includes(speaker || "")) return;
  const summary = window.prompt(t("prompt.reviewSummary"));
  if (!summary) return;
  await apiRequest(`/reviews/${id}/round`, { method: "POST", body: JSON.stringify({ speaker, summary }) });
  showAlert(t("msg.refreshDone"));
}

async function regenerateToken() {
  if (!state.token) await bootstrapLocalSettings();
  if (!state.token) return showAlert(t("error.needSettings"), "warn", { persist: true });
  if (!window.confirm(t("msg.confirmRegenerateToken"))) return;
  const data = await apiRequest("/config/runtime", {
    method: "POST",
    authToken: state.token,
    body: JSON.stringify({ regenerateToken: true })
  });
  if (data.token) {
    state.token = data.token;
    localStorage.setItem(STORAGE.token, state.token);
    const tokenInput = $("#settingsForm [name=token]");
    if (tokenInput) tokenInput.value = state.token;
  }
  state.config = { ...(state.config || {}), execution: data.execution, settings: data.settings || state.config?.settings };
  showAlert(t("msg.tokenRegenerated"));
  await testConnection({ silent: true });
  await loadAll({ silent: true });
}

async function itemAction(event) {
  const alertButton = event.target.closest("button[data-alert-action]");
  if (alertButton) {
    const action = alertButton.dataset.alertAction;
    if (action === "logs") setView("logs");
    if (action === "repair") {
      if (state.lastError?.requestId) await loadLatestErrors(state.lastError.requestId).catch(() => null);
      fillRepairFromError(state.latestErrors[0] || state.lastError);
    }
    if (action === "close") $("#alert").classList.add("hidden");
    return;
  }

  const fileButton = event.target.closest("[data-file-path]");
  if (fileButton) {
    await readFilePath(fileButton.dataset.filePath).catch(showError);
    return;
  }

  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const disabledReason = button.dataset.disabledReason;
  if (disabledReason) return showAlert(disabledReason, "error", { persist: true });
  const { action, id } = button.dataset;

  try {
    switch (action) {
      case "view-patch": {
        const data = await apiRequest(`/web-patches/${id}`);
        $("#projectDetail").textContent = JSON.stringify(data, null, 2);
        setView("projects");
        break;
      }
      case "apply-patch":
        if (window.confirm(t("msg.confirmApply"))) {
          await apiRequest(`/web-patches/${id}/apply`, { method: "POST", body: JSON.stringify({ confirm: true }) });
          showAlert(t("msg.patchApplied"));
        }
        break;
      case "revert-patch":
        if (window.confirm(t("msg.confirmRevert"))) {
          await apiRequest(`/web-patches/${id}/revert`, { method: "POST", body: JSON.stringify({ confirm: true }) });
          showAlert(t("msg.patchReverted"));
        }
        break;
      case "review-patch":
        await apiRequest(`/web-patches/${id}/create-codex-review-job`, { method: "POST", body: JSON.stringify({ runImmediately: false }) });
        showAlert(t("msg.jobCreated"));
        break;
      case "reject-patch":
        await apiRequest(`/web-patches/${id}/reject`, { method: "POST", body: JSON.stringify({ reason: "Rejected from dashboard." }) });
        showAlert(t("msg.patchRejected"));
        break;
      case "diff-patch":
        await loadPatchDiffById(id);
        break;
      case "view-job": {
        const data = await apiRequest(`/codex/jobs/${id}`);
        $("#projectDetail").textContent = JSON.stringify(data, null, 2);
        setView("projects");
        break;
      }
      case "approve-run-job":
        await apiRequest(`/codex/jobs/${id}/approve`, { method: "POST", body: JSON.stringify({ runNow: true, note: "Approved from dashboard." }) });
        showAlert(t("msg.jobRunRequested"));
        break;
      case "run-job":
        await apiRequest(`/codex/jobs/${id}/run`, { method: "POST", body: JSON.stringify({}) });
        showAlert(t("msg.jobRunRequested"));
        break;
      case "run-job-async":
        await apiRequest(`/codex/jobs/${id}/run-async`, { method: "POST", body: JSON.stringify({}) });
        showAlert(t("msg.jobRunRequested"));
        break;
      case "mirror-output": {
        const output = window.prompt(state.language === "zh" ? "粘贴外部执行器输出，用于同步到当前控制台任务：" : "Paste Codex app output to mirror into this dashboard job:");
        if (output) await apiRequest(`/codex/jobs/${id}/external-output`, { method: "POST", body: JSON.stringify({ source: "codex-app", output }) });
        break;
      }
      case "cancel-job":
        await apiRequest(`/codex/jobs/${id}/cancel`, { method: "POST", body: JSON.stringify({}) });
        break;
      case "view-review": {
        const data = await apiRequest(`/reviews/${id}`);
        $("#projectDetail").textContent = JSON.stringify(data, null, 2);
        setView("projects");
        break;
      }
      case "add-review-round":
        await addReviewRound(id);
        break;
      case "decide-review-web":
        await decideReview(id, "web");
        break;
      case "decide-review-codex":
        await decideReview(id, "codex");
        break;
      case "decide-review-hybrid":
        await decideReview(id, "hybrid");
        break;
      case "decide-review-human":
        await decideReview(id, "needs_human");
        break;
      case "approve-codex-approval":
        await apiRequest(`/codex/approvals/${id}/decision`, { method: "POST", body: JSON.stringify({ decision: "accept", note: "Accepted from dashboard." }) });
        break;
      case "decline-codex-approval":
        await apiRequest(`/codex/approvals/${id}/decision`, { method: "POST", body: JSON.stringify({ decision: "decline", note: "Declined from dashboard." }) });
        break;
      case "view-repair": {
        const data = await apiRequest(`/repairs/${id}`);
        $("#repairSourceDetail").textContent = JSON.stringify(data, null, 2);
        setView("repairs");
        break;
      }
      case "approve-repair-run":
        if (window.confirm(t("msg.confirmRepairRun"))) {
          await apiRequest(`/repairs/${id}/approve`, { method: "POST", body: JSON.stringify({ runNow: true, note: "Approved from dashboard." }) });
          showAlert(t("msg.repairApproved"));
        }
        break;
      case "reject-repair":
        await apiRequest(`/repairs/${id}/reject`, { method: "POST", body: JSON.stringify({ reason: "Rejected from dashboard." }) });
        showAlert(t("msg.repairRejected"));
        break;
      case "create-template-job": {
        const project = activeProject();
        if (!project) return showAlert(t("msg.projectRequired"), "error", { persist: true });
        const tpl = state.templates.find((item) => item.id === id);
        if (!tpl) return showAlert(state.language === "zh" ? "模板不存在。" : "Template not found.", "error", { persist: true });
        await apiRequest("/codex/jobs", { method: "POST", body: JSON.stringify({ projectId: project.id, title: templateField(tpl, "title"), task: templateField(tpl, "prompt"), roles: tpl.roles || [], safetyLevel: tpl.safetyLevel || 2 }) });
        showAlert(t("msg.jobCreated"));
        break;
      }
      default:
        break;
    }
    await loadAll({ silent: true });
  } catch (error) {
    showError(error);
  }
}

async function saveSettings(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  if (!state.token) await bootstrapLocalSettings();
  const previousToken = state.token;
  const currentExecution = state.config?.execution || state.health?.execution || "dry-run";
  const currentPermission = state.config?.settings?.permissionMode || state.health?.permissionMode || "manual_review";
  state.baseUrl = String(form.get("baseUrl") || window.location.origin).trim().replace(/\/$/, "");
  const nextExecution = String(form.get("execution") || currentExecution);
  const nextPermission = String(form.get("permissionMode") || currentPermission);
  localStorage.setItem(STORAGE.baseUrl, state.baseUrl);
  if (previousToken) {
    const runtimeNeedsUpdate = nextExecution !== currentExecution;
    if (runtimeNeedsUpdate) {
      const payload = { execution: nextExecution };
      await apiRequest("/config/runtime", { method: "POST", body: JSON.stringify(payload), authToken: previousToken });
      showAlert(t("msg.runtimeSaved"));
    }
  }
  state.token = previousToken;
  if (state.token) localStorage.setItem(STORAGE.token, state.token);

  if (state.token && nextPermission !== currentPermission) {
    const payload = { permissionMode: nextPermission };
    if (nextPermission === "full_access") {
      const confirmation = window.prompt(t("prompt.fullAccess"));
      if (!["I understand", "我已理解风险"].includes(confirmation || "")) return showAlert(t("msg.fullAccessCancelled"), "error", { persist: true });
      payload.confirmFullAccess = confirmation;
    }
    const data = await apiRequest("/config/access-mode", { method: "POST", body: JSON.stringify(payload) });
    state.config = { ...(state.config || {}), settings: data.settings };
  }

  showAlert(t("msg.settingsSaved"));
  await testConnection();
  await loadAll({ silent: true });
}

function toggleSidebar() {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  localStorage.setItem(STORAGE.sidebar, String(state.sidebarCollapsed));
  $("#appShell").classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
}

function on(selector, event, handler) {
  const el = $(selector);
  if (el) el.addEventListener(event, handler);
}

function init() {
  $("#appShell").classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
  $("#settingsForm [name=baseUrl]").value = state.baseUrl;
  $("#settingsForm [name=token]").value = state.token;
  applyI18n();

  $$(".nav-item").forEach((btn) => btn.addEventListener("click", () => setView(btn.dataset.view)));
  $$("[data-go-view]").forEach((btn) => btn.addEventListener("click", () => setView(btn.dataset.goView)));
  $$("[data-lang]").forEach((btn) => btn.addEventListener("click", () => setLanguage(btn.dataset.lang)));
  on("#sidebarToggle", "click", toggleSidebar);
  on("#projectSelect", "change", (event) => {
    state.selectedProjectId = event.target.value;
    localStorage.setItem(STORAGE.projectId, state.selectedProjectId);
  });
  on("#refreshAll", "click", () => loadAll().catch(showError));
  on("#inspectProject", "click", () => inspectSelectedProject().catch(showError));
  on("#loadTree", "click", () => loadTree().catch(showError));
  on("#refreshFileTree", "click", () => loadFileTreePanel().catch(showError));
  on("#fileReadForm", "submit", (event) => readFilePanel(event).catch(showError));
  on("#contextPackForm", "submit", (event) => createContextPack(event).catch(showError));
  on("#filePatchForm", "submit", (event) => createPatchFromFileEditor(event).catch(showError));
  on("#refreshTemplates", "click", () => loadAll().catch(showError));
  on("#loadTestPlan", "click", () => loadTestPlan().catch(showError));
  on("#createTestJob", "click", () => createTestJob().catch(showError));
  on("#newCodexJob", "click", () => setView("jobs"));
  on("#projectForm", "submit", (event) => createProject(event).catch(showError));
  on("#patchForm", "submit", (event) => createPatch(event).catch(showError));
  on("#jobForm", "submit", (event) => createJob(event).catch(showError));
  on("#reviewForm", "submit", (event) => createReview(event).catch(showError));
  on("#diffForm", "submit", (event) => loadPatchDiff(event).catch(showError));
  on("#screenshotForm", "submit", (event) => createScreenshotReview(event).catch(showError));
  on("#branchForm", "submit", (event) => createGitBranch(event).catch(showError));
  on("#commitForm", "submit", (event) => createGitCommit(event).catch(showError));
  on("#prForm", "submit", (event) => createGithubPr(event).catch(showError));
  on("#repairForm", "submit", (event) => createRepair(event).catch(showError));
  on("#loadLatestErrors", "click", () => loadLatestErrors().catch(showError));
  on("#fillRepairFromLatest", "click", () => fillRepairFromError(state.latestErrors[0] || state.lastError));
  on("#refreshCodexAccount", "click", () => refreshAccount().catch(showError));
  on("#resetCodexSession", "click", () => resetCodexSession().catch(showError));
  on("#refreshLogs", "click", () => refreshLogs().catch(showError));
  on("#clearLogs", "click", () => clearLogs().catch(showError));
  on("#copyLogs", "click", () => copyLogs().catch(showError));
  on("#logLevelFilter", "change", renderLogs);
  on("#logSearch", "input", renderLogs);
  $$("button[data-access-mode]").forEach((button) => button.addEventListener("click", () => setAccessMode(button.dataset.accessMode).catch(showError)));
  on("#settingsForm", "submit", (event) => saveSettings(event).catch(showError));
  on("#testConnection", "click", () => testConnection().then(() => loadAll({ silent: true })).catch(() => null));
  on("#regenerateToken", "click", () => regenerateToken().catch(showError));
  on("#clearSettings", "click", async () => {
    localStorage.removeItem(STORAGE.baseUrl);
    localStorage.removeItem(STORAGE.token);
    localStorage.removeItem(STORAGE.projectId);
    state.baseUrl = window.location.origin;
    state.token = "";
    state.selectedProjectId = "";
    $("#settingsForm [name=baseUrl]").value = state.baseUrl;
    $("#settingsForm [name=token]").value = "";
    state.projects = [];
    state.jobs = [];
    state.patches = [];
    setConnectionStatus("notConfigured");
    renderAll();
    await bootstrapLocalSettings();
    await loadAll({ silent: true });
    showAlert(t("msg.bootstrapReady"), "info");
  });
  document.body.addEventListener("click", (event) => itemAction(event).catch(showError));
  window.addEventListener("unhandledrejection", (event) => showError(event.reason));

  setConnectionStatus(state.token ? "checking" : "notConfigured");
  bootstrapLocalSettings().then(() => loadAll({ silent: true })).catch(showError);
}

init();
