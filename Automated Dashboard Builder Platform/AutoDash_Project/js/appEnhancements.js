(function () {
    if (!window.App) return;

    const STORE = {
        workspace: 'autodash.workspace.v5',
        templates: 'autodash.templates.v5',
        search: 'autodash.search.v5',
        ai: 'autodash.ai.v1'
    };

    const THEMES = {
        '星云流光': { primary: '#7c5cff', secondary: '#20c5ff', accent: '#ff8a3d', canvas: '#10182c' },
        '深海极光': { primary: '#00c2a8', secondary: '#4d9bff', accent: '#ffce52', canvas: '#081b2c' },
        '晨雾玻璃': { primary: '#6f7ef9', secondary: '#8cd4ff', accent: '#ff9b7d', canvas: '#141d30' }
    };

    const clone = (value) => JSON.parse(JSON.stringify(value));
    const salesRows = [
        { 月份: '1月', 销售额: 120, 利润率: 18, 区域: '华东', 产品线: 'A线' },
        { 月份: '2月', 销售额: 132, 利润率: 20, 区域: '华南', 产品线: 'B线' },
        { 月份: '3月', 销售额: 101, 利润率: 15, 区域: '华北', 产品线: 'A线' },
        { 月份: '4月', 销售额: 134, 利润率: 21, 区域: '华东', 产品线: 'C线' },
        { 月份: '5月', 销售额: 90, 利润率: 13, 区域: '西南', 产品线: 'B线' },
        { 月份: '6月', 销售额: 230, 利润率: 26, 区域: '华南', 产品线: 'A线' }
    ];
    const behaviorRows = [
        { 渠道: '自然流量', 用户数: 3200, 转化率: 4.2, 状态: '正常' },
        { 渠道: '广告投放', 用户数: 2800, 转化率: 3.6, 状态: '关注' },
        { 渠道: '社媒裂变', 用户数: 1800, 转化率: 4.9, 状态: '正常' },
        { 渠道: '线下活动', 用户数: 760, 转化率: 2.7, 状态: '需复核' }
    ];
    const opsRows = [
        { 日期: '04-01', 工单数: 68, 满意度: 93, 团队: '客服一组' },
        { 日期: '04-02', 工单数: 71, 满意度: 95, 团队: '客服二组' },
        { 日期: '04-03', 工单数: 66, 满意度: 94, 团队: '客服一组' },
        { 日期: '04-04', 工单数: 74, 满意度: 92, 团队: '客服三组' }
    ];
    const growthRows = [
        { 周期: 'W1', 线索量: 420, 成交量: 62, 渠道: '官网' },
        { 周期: 'W2', 线索量: 460, 成交量: 74, 渠道: '社媒' },
        { 周期: 'W3', 线索量: 510, 成交量: 83, 渠道: '伙伴推荐' },
        { 周期: 'W4', 线索量: 530, 成交量: 85, 渠道: '官网' }
    ];
    const retentionRows = [
        { 月份: 'M1', 留存率: 62, 付费率: 18, 人群: '新客' },
        { 月份: 'M2', 留存率: 55, 付费率: 16, 人群: '复购客' },
        { 月份: 'M3', 留存率: 49, 付费率: 14, 人群: '新客' }
    ];

    const DEFAULT_PROJECTS = [
        {
            id: 'project-sales',
            name: '销售数据分析',
            datasets: [
                { name: '2026_Q1_Sales.csv', status: 'ready', rows: salesRows },
                { name: 'User_Behavior.json', status: 'warning', rows: behaviorRows }
            ],
            folders: [
                { id: 'folder-sales-1', name: '经营分析', expanded: true, dashboards: [{ id: 'db-sales-overview', name: '销售总览', seed: 'sales' }, { id: 'db-sales-region', name: '区域洞察', seed: 'region' }] },
                { id: 'folder-sales-2', name: '增长协同', expanded: false, dashboards: [{ id: 'db-sales-behavior', name: '用户行为分析', seed: 'behavior' }] }
            ],
            lastDashboardId: 'db-sales-overview'
        },
        {
            id: 'project-ops',
            name: '运营指标总览',
            datasets: [{ name: 'Operations_Daily.csv', status: 'ready', rows: opsRows }],
            folders: [{ id: 'folder-ops-1', name: '客服中台', expanded: true, dashboards: [{ id: 'db-ops-overview', name: '运营总览', seed: 'ops' }] }],
            lastDashboardId: 'db-ops-overview'
        },
        {
            id: 'project-growth',
            name: '客户增长看板',
            datasets: [
                { name: 'Leads_2026.csv', status: 'ready', rows: growthRows },
                { name: 'Retention_Cohort.json', status: 'ready', rows: retentionRows }
            ],
            folders: [{ id: 'folder-growth-1', name: '增长策略', expanded: true, dashboards: [{ id: 'db-growth-funnel', name: '增长漏斗', seed: 'growth' }, { id: 'db-growth-retention', name: '留存实验室', seed: 'retention' }] }],
            lastDashboardId: 'db-growth-funnel'
        }
    ];

    const DEFAULT_TEMPLATES = [
        { id: 'tpl-exec', name: '高层经营简报', type: 'preset', seed: 'exec' },
        { id: 'tpl-weekly', name: '增长周报模板', type: 'preset', seed: 'weekly' }
    ];

    Object.assign(App, {
        storageKeys: STORE,
        projects: [],
        templates: [],
        searchHistory: [],
        selectedFolderId: null,
        selectedDashboardId: null,
        selectedDatasetIndex: 0,
        currentProjectIndex: 0,
        zIndexCounter: 20,
        editingWorkspaceName: null,
        editingProjectName: null,
        configApplyTimer: null,
        resizeSyncTimer: null,
        currentAutoLayoutMode: 'compact',
        aiBusy: false,
        workspaceContextTarget: null,
        projectContextTarget: null,
        projectClipboard: null,
        historyLimit: 60,
        historyPast: [],
        historyFuture: [],
        historySeeded: false,
        isRestoringHistory: false,
        rightSidebarCollapsedManually: false,
        rightSidebarInitializedHidden: true,
        canvasFocusMode: false,
        overviewMode: false,
        aiSettings: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-5.2', apiKey: '' },
        aiDockState: { minimized: false, dragging: false, moved: false, justDragged: false, left: null, top: null, offsetX: 0, offsetY: 0 },

        init: function () {
            this.cacheDom();
            this.loadState();
            this.bindUIEvents();
            if (window.DragLayout) DragLayout.init();
            this.renderProjectMenu();
            this.renderAutoArrangeMenu();
            this.syncAutoArrangeButton();
            this.renderSearchHistory();
            this.syncAiSettingsUI();
            this.setProject(this.currentProjectIndex, { folderId: this.selectedFolderId, dashboardId: this.selectedDashboardId, skipSave: true });
            this.applyTheme(this.dom.themeSelect.value || '星云流光');
            this.applyCanvasBackground(this.dom.backgroundColorInput.value || THEMES[this.dom.themeSelect.value || '星云流光'].canvas);
            this.initAiCopilotState();
            this.syncCanvasFocusClasses();
            if (typeof this.restoreSharedDashboard === 'function' && this.restoreSharedDashboard()) this.showToast('已加载分享看板');
            this.seedHistory('进入当前看板');
            this.log('系统初始化完成。你可以像使用创作工作台一样搭建看板。');
        },

        cacheDom: function () {
            this.dom = {
                projectSelector: document.getElementById('projectSelector'),
                projectSelectorText: document.getElementById('projectSelectorText'),
                projectMenu: document.getElementById('projectMenu'),
                historyToggleBtn: document.getElementById('historyToggleBtn'),
                historyDropdown: document.getElementById('historyDropdown'),
                undoBtn: document.getElementById('undoBtn'),
                redoBtn: document.getElementById('redoBtn'),
                historyStepList: document.getElementById('historyStepList'),
                globalSearch: document.getElementById('globalSearch'),
                clearSearchBtn: document.getElementById('clearSearchBtn'),
                clearSearchHistoryBtn: document.getElementById('clearSearchHistoryBtn'),
                searchHistoryPanel: document.getElementById('searchHistoryPanel'),
                searchHistoryList: document.getElementById('searchHistoryList'),
                saveDashboardBtn: document.getElementById('saveDashboardBtn'),
                exportDashboardBtn: document.getElementById('exportDashboardBtn'),
                shareDashboardBtn: document.getElementById('shareDashboardBtn'),
                settingsToggleBtn: document.getElementById('settingsToggleBtn'),
                userProfileBtn: document.getElementById('userProfileBtn'),
                deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
                dataImportBtn: document.getElementById('dataImportBtn'),
                dataFileInput: document.getElementById('dataFileInput'),
                templateLoadBtn: document.getElementById('templateLoadBtn'),
                saveTemplateBtn: document.getElementById('saveTemplateBtn'),
                historyTemplateBtn: document.getElementById('historyTemplateBtn'),
                copyFromDashboardBtn: document.getElementById('copyFromDashboardBtn'),
                datasetList: document.getElementById('datasetList'),
                datasetMeta: document.getElementById('datasetMeta'),
                workspaceTree: document.getElementById('workspaceTree'),
                leftSidebarToggleBtn: document.getElementById('leftSidebarToggleBtn'),
                leftSidebarRevealBtn: document.getElementById('leftSidebarRevealBtn'),
                newFolderBtn: document.getElementById('newFolderBtn'),
                newDashboardBtn: document.getElementById('newDashboardBtn'),
                currentDashboardName: document.getElementById('currentDashboardName'),
                currentDashboardMeta: document.getElementById('currentDashboardMeta'),
                autoArrangeBtn: document.getElementById('autoArrangeBtn'),
                autoArrangeMenuBtn: document.getElementById('autoArrangeMenuBtn'),
                autoArrangeMenu: document.getElementById('autoArrangeMenu'),
                themeSelect: document.getElementById('themeSelect'),
                backgroundColorInput: document.getElementById('backgroundColorInput'),
                globalBoardDescription: document.getElementById('globalBoardDescription'),
                globalConfigMsg: document.getElementById('globalConfigMsg'),
                rightSidebarToggleBtn: document.getElementById('rightSidebarToggleBtn'),
                rightSidebarRevealBtn: document.getElementById('rightSidebarRevealBtn'),
                componentConfigForm: document.getElementById('componentConfigForm'),
                configTypeTitle: document.getElementById('configTypeTitle'),
                configDataset: document.getElementById('configDataset'),
                configTitle: document.getElementById('configTitle'),
                configSubtitle: document.getElementById('configSubtitle'),
                configColor: document.getElementById('configColor'),
                configSecondaryColor: document.getElementById('configSecondaryColor'),
                configAccentColor: document.getElementById('configAccentColor'),
                configBackground: document.getElementById('configBackground'),
                configXField: document.getElementById('configXField'),
                configYField: document.getElementById('configYField'),
                configXAxisName: document.getElementById('configXAxisName'),
                configYAxisName: document.getElementById('configYAxisName'),
                configXRotate: document.getElementById('configXRotate'),
                configGranularity: document.getElementById('configGranularity'),
                configYMin: document.getElementById('configYMin'),
                configYMax: document.getElementById('configYMax'),
                configLegendPosition: document.getElementById('configLegendPosition'),
                configLabelPosition: document.getElementById('configLabelPosition'),
                configSortOrder: document.getElementById('configSortOrder'),
                configDataLimit: document.getElementById('configDataLimit'),
                configShowLegend: document.getElementById('configShowLegend'),
                configShowGrid: document.getElementById('configShowGrid'),
                configShowLabel: document.getElementById('configShowLabel'),
                configSmooth: document.getElementById('configSmooth'),
                configShowArea: document.getElementById('configShowArea'),
                configStack: document.getElementById('configStack'),
                configInnerRadius: document.getElementById('configInnerRadius'),
                configOpacity: document.getElementById('configOpacity'),
                configSymbolSize: document.getElementById('configSymbolSize'),
                configBorderRadius: document.getElementById('configBorderRadius'),
                configShadow: document.getElementById('configShadow'),
                configWidth: document.getElementById('configWidth'),
                configHeight: document.getElementById('configHeight'),
                applyConfigBtn: document.getElementById('applyConfigBtn'),
                dashboardCanvas: document.getElementById('dashboardCanvas'),
                overviewToggleBtn: document.getElementById('overviewToggleBtn'),
                exitOverviewBtn: document.getElementById('exitOverviewBtn'),
                systemLog: document.getElementById('systemLog'),
                toastContainer: document.getElementById('toastContainer'),
                aiCopilotPanel: document.getElementById('aiCopilotPanel'),
                aiPanelMinimizeBtn: document.getElementById('aiPanelMinimizeBtn'),
                aiDockBubble: document.getElementById('aiDockBubble'),
                aiEngineStatus: document.getElementById('aiEngineStatus'),
                aiBaseUrl: document.getElementById('aiBaseUrl'),
                aiModelInput: document.getElementById('aiModelInput'),
                aiApiKeyInput: document.getElementById('aiApiKeyInput'),
                agentInput: document.getElementById('agentInput'),
                agentSendBtn: document.getElementById('agentSendBtn'),
                aiSuggestions: document.querySelectorAll('.ai-suggestion'),
                reuseOverlay: document.getElementById('reuseOverlay'),
                reuseTitle: document.getElementById('reuseTitle'),
                reuseSubtitle: document.getElementById('reuseSubtitle'),
                reuseList: document.getElementById('reuseList'),
                closeReuseOverlayBtn: document.getElementById('closeReuseOverlayBtn'),
                workspaceContextMenu: document.getElementById('workspaceContextMenu'),
                projectContextMenu: document.getElementById('projectContextMenu')
            };
        },

        loadState: function () {
            const workspace = this.safeParse(localStorage.getItem(STORE.workspace));
            const aiSettings = this.safeParse(localStorage.getItem(STORE.ai));
            this.projects = workspace?.projects?.length ? workspace.projects : clone(DEFAULT_PROJECTS);
            this.templates = this.safeParse(localStorage.getItem(STORE.templates)) || clone(DEFAULT_TEMPLATES);
            this.searchHistory = this.safeParse(localStorage.getItem(STORE.search)) || [];
            this.currentProjectIndex = workspace?.currentProjectIndex || 0;
            this.selectedFolderId = workspace?.selectedFolderId || null;
            this.selectedDashboardId = workspace?.selectedDashboardId || null;
            this.currentAutoLayoutMode = workspace?.ui?.layoutMode || 'compact';
            this.rightSidebarCollapsedManually = workspace?.ui?.rightSidebarCollapsedManually === true;
            this.rightSidebarInitializedHidden = workspace?.ui?.rightSidebarInitializedHidden !== false;
            this.canvasFocusMode = workspace?.ui?.canvasFocusMode === true;
            this.projectClipboard = workspace?.ui?.projectClipboard || null;
            this.dom.themeSelect.value = workspace?.ui?.theme || '星云流光';
            this.dom.backgroundColorInput.value = workspace?.ui?.canvas || THEMES[this.dom.themeSelect.value].canvas;
            this.dom.globalBoardDescription.value = workspace?.ui?.description || '';
            this.aiSettings = {
                baseUrl: aiSettings?.baseUrl || 'https://api.openai.com/v1',
                model: aiSettings?.model || 'gpt-5.2',
                apiKey: aiSettings?.apiKey || ''
            };
            this.aiDockState = {
                minimized: workspace?.ui?.aiMinimized === true,
                dragging: false,
                moved: false,
                justDragged: false,
                left: typeof workspace?.ui?.aiBubbleLeft === 'number' ? workspace.ui.aiBubbleLeft : null,
                top: typeof workspace?.ui?.aiBubbleTop === 'number' ? workspace.ui.aiBubbleTop : null,
                offsetX: 0,
                offsetY: 0
            };
        },

        saveMeta: function () {
            const aiPosition = this.getAiBubblePosition();
            localStorage.setItem(STORE.workspace, JSON.stringify({
                projects: this.projects,
                currentProjectIndex: this.currentProjectIndex,
                selectedFolderId: this.selectedFolderId,
                selectedDashboardId: this.selectedDashboardId,
                ui: {
                    theme: this.dom.themeSelect.value,
                    canvas: this.dom.backgroundColorInput.value,
                    description: this.dom.globalBoardDescription.value,
                    layoutMode: this.currentAutoLayoutMode,
                    rightSidebarCollapsedManually: this.rightSidebarCollapsedManually === true,
                    rightSidebarInitializedHidden: this.rightSidebarInitializedHidden === true,
                    canvasFocusMode: this.canvasFocusMode === true,
                    projectClipboard: this.projectClipboard || null,
                    aiMinimized: this.aiDockState?.minimized === true,
                    aiBubbleLeft: aiPosition.left,
                    aiBubbleTop: aiPosition.top
                }
            }));
            localStorage.setItem(STORE.templates, JSON.stringify(this.templates));
            localStorage.setItem(STORE.search, JSON.stringify(this.searchHistory));
        },
        saveAiSettings: function () {
            localStorage.setItem(STORE.ai, JSON.stringify(this.aiSettings));
        },
        syncAiSettingsUI: function () {
            if (this.dom.aiBaseUrl) this.dom.aiBaseUrl.value = this.aiSettings.baseUrl || 'https://api.openai.com/v1';
            if (this.dom.aiModelInput) this.dom.aiModelInput.value = this.aiSettings.model || 'gpt-5.2';
            if (this.dom.aiApiKeyInput) this.dom.aiApiKeyInput.value = this.aiSettings.apiKey || '';
            if (this.dom.aiEngineStatus) {
                const connected = !!(this.aiSettings.apiKey || '').trim();
                this.dom.aiEngineStatus.innerText = connected ? '真实 AI 已就绪' : '待输入 Key';
                this.dom.aiEngineStatus.classList.toggle('connected', connected);
            }
        },
        captureHistorySnapshot: function () {
            return clone({
                projects: this.projects,
                currentProjectIndex: this.currentProjectIndex,
                selectedFolderId: this.selectedFolderId,
                selectedDashboardId: this.selectedDashboardId,
                selectedDatasetIndex: this.selectedDatasetIndex,
                selectedComponentIds: this.selectedComponentIds,
                currentAutoLayoutMode: this.currentAutoLayoutMode,
                rightSidebarCollapsedManually: this.rightSidebarCollapsedManually,
                rightSidebarInitializedHidden: this.rightSidebarInitializedHidden,
                canvasFocusMode: this.canvasFocusMode,
                projectClipboard: this.projectClipboard,
                boardState: this.serializeDashboardState(),
                ui: {
                    theme: this.dom.themeSelect.value,
                    canvas: this.dom.backgroundColorInput.value,
                    description: this.dom.globalBoardDescription.value
                }
            });
        },
        historySignature: function (snapshot) {
            return JSON.stringify({
                projects: snapshot.projects,
                currentProjectIndex: snapshot.currentProjectIndex,
                selectedFolderId: snapshot.selectedFolderId,
                selectedDashboardId: snapshot.selectedDashboardId,
                selectedDatasetIndex: snapshot.selectedDatasetIndex,
                selectedComponentIds: snapshot.selectedComponentIds,
                currentAutoLayoutMode: snapshot.currentAutoLayoutMode,
                rightSidebarCollapsedManually: snapshot.rightSidebarCollapsedManually,
                rightSidebarInitializedHidden: snapshot.rightSidebarInitializedHidden,
                canvasFocusMode: snapshot.canvasFocusMode,
                boardState: snapshot.boardState,
                ui: snapshot.ui
            });
        },
        seedHistory: function (label) {
            if (this.historySeeded) return;
            this.historySeeded = true;
            const snapshot = this.captureHistorySnapshot();
            this.historyPast = [{
                label: label || '进入当前看板',
                snapshot,
                signature: this.historySignature(snapshot)
            }];
            this.historyFuture = [];
            this.renderHistory();
        },
        recordHistoryStep: function (label) {
            if (this.isRestoringHistory) return;
            if (!this.historySeeded) this.seedHistory('进入当前看板');
            const snapshot = this.captureHistorySnapshot();
            const signature = this.historySignature(snapshot);
            const last = this.historyPast[this.historyPast.length - 1];
            if (last?.signature === signature) {
                if (label) last.label = label;
                this.renderHistory();
                return;
            }
            this.historyPast.push({ label: label || '已更新画布', snapshot, signature });
            if (this.historyPast.length > this.historyLimit) this.historyPast = this.historyPast.slice(-this.historyLimit);
            this.historyFuture = [];
            this.renderHistory();
        },
        renderHistory: function () {
            if (!this.dom.historyStepList) return;
            const startIndex = Math.max(0, this.historyPast.length - this.historyLimit);
            const visibleSteps = this.historyPast
                .slice(startIndex)
                .map((step, index) => ({ ...step, historyIndex: startIndex + index }))
                .reverse();
            const currentIndex = this.historyPast.length - 1;
            this.dom.historyStepList.innerHTML = visibleSteps.map((step) => `
                <div class="history-step${step.historyIndex === currentIndex ? ' active' : ''}" title="${this.escapeAttr(step.label)}">
                    <div class="history-step-label">${this.escapeHtml(step.label)}</div>
                    <button class="history-step-action" type="button" data-history-action="restore" data-history-index="${step.historyIndex}" ${step.historyIndex === currentIndex ? 'disabled' : ''}>
                        ${step.historyIndex === currentIndex ? '当前' : '撤销'}
                    </button>
                </div>`).join('');
            if (this.dom.undoBtn) this.dom.undoBtn.disabled = this.historyPast.length <= 1;
            if (this.dom.redoBtn) this.dom.redoBtn.disabled = this.historyFuture.length === 0;
        },
        restoreHistoryTo: function (targetIndex) {
            const normalizedIndex = Number(targetIndex);
            if (Number.isNaN(normalizedIndex) || normalizedIndex < 0 || normalizedIndex >= this.historyPast.length) return;
            if (normalizedIndex === this.historyPast.length - 1) return;
            const target = this.historyPast[normalizedIndex];
            const movedToFuture = this.historyPast.slice(normalizedIndex + 1);
            this.historyPast = this.historyPast.slice(0, normalizedIndex + 1);
            this.historyFuture = [...movedToFuture, ...this.historyFuture];
            this.restoreHistorySnapshot(target.snapshot);
            this.renderHistory();
            this.showToast(`已回到：${target.label}`);
        },
        restoreHistorySnapshot: function (snapshot) {
            if (!snapshot) return;
            this.isRestoringHistory = true;
            try {
                this.projects = clone(snapshot.projects || []);
                this.projectClipboard = snapshot.projectClipboard || null;
                this.currentProjectIndex = snapshot.currentProjectIndex || 0;
                this.selectedFolderId = snapshot.selectedFolderId || null;
                this.selectedDashboardId = snapshot.selectedDashboardId || null;
                this.selectedDatasetIndex = snapshot.selectedDatasetIndex || 0;
                this.currentAutoLayoutMode = snapshot.currentAutoLayoutMode || 'compact';
                this.rightSidebarCollapsedManually = snapshot.rightSidebarCollapsedManually === true;
                this.rightSidebarInitializedHidden = snapshot.rightSidebarInitializedHidden === true;
                this.canvasFocusMode = snapshot.canvasFocusMode === true;
                this.dom.themeSelect.value = snapshot.ui?.theme || '星云流光';
                this.dom.backgroundColorInput.value = snapshot.ui?.canvas || THEMES[this.dom.themeSelect.value].canvas;
                this.dom.globalBoardDescription.value = snapshot.ui?.description || '';
                this.datasets = this.getProject()?.datasets || [];
                this.syncProjectLabel();
                this.renderProjectMenu();
                this.renderWorkspace();
                this.renderDatasets();
                this.setAutoLayoutMode(this.currentAutoLayoutMode, { skipSave: true });
                this.applyTheme(this.dom.themeSelect.value);
                this.applyCanvasBackground(this.dom.backgroundColorInput.value);
                this.applySerializedState(snapshot.boardState || { components: [] });
                this.selectedComponentIds = [...(snapshot.selectedComponentIds || [])];
                this.syncCanvasFocusClasses();
                this.updateSelectionUI();
                this.saveMeta();
                this.refreshCanvasViewport();
            } finally {
                this.isRestoringHistory = false;
            }
        },
        undoHistory: function () {
            if (this.historyPast.length <= 1) return;
            const current = this.historyPast.pop();
            const previous = this.historyPast[this.historyPast.length - 1];
            if (current) this.historyFuture.unshift(current);
            this.restoreHistorySnapshot(previous.snapshot);
            this.renderHistory();
            this.showToast('已撤销上一步');
        },
        redoHistory: function () {
            if (!this.historyFuture.length) return;
            const next = this.historyFuture.shift();
            if (!next) return;
            this.historyPast.push(next);
            this.restoreHistorySnapshot(next.snapshot);
            this.renderHistory();
            this.showToast('已重做上一步');
        },
        bindUIEvents: function () {
            this.dom.projectSelector.addEventListener('click', (event) => { event.stopPropagation(); this.toggleProjectMenu(); });
            this.dom.projectSelector.addEventListener('dblclick', (event) => this.handleProjectRenameDblClick(event));
            this.dom.historyToggleBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.toggleHistoryDropdown();
            });
            this.dom.projectMenu.addEventListener('click', (event) => {
                if (event.target.closest('.project-inline-input')) return;
                const item = event.target.closest('[data-project-index]');
                if (!item) return;
                this.toggleProjectMenu(false);
                this.setProject(Number(item.dataset.projectIndex));
            });
            this.dom.projectMenu.addEventListener('dblclick', (event) => this.handleProjectRenameDblClick(event));
            this.dom.projectMenu.addEventListener('contextmenu', (event) => this.handleProjectMenuContextMenu(event));
            this.dom.historyStepList.addEventListener('click', (event) => {
                const action = event.target.closest('[data-history-action="restore"]');
                if (!action) return;
                this.restoreHistoryTo(Number(action.dataset.historyIndex));
            });
            this.dom.globalSearch.addEventListener('focus', () => this.toggleSearchHistory(true));
            this.dom.globalSearch.addEventListener('click', () => this.toggleSearchHistory(true));
            this.dom.globalSearch.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); this.handleGlobalSearch(); }
            });
            this.dom.clearSearchBtn.addEventListener('click', () => { this.dom.globalSearch.value = ''; this.clearSearchHighlights(); this.log('已清空搜索关键字'); });
            this.dom.clearSearchHistoryBtn.addEventListener('click', () => this.clearSearchHistory());
            this.dom.searchHistoryList.addEventListener('click', (event) => {
                const item = event.target.closest('[data-history-value]');
                if (!item) return;
                this.dom.globalSearch.value = item.dataset.historyValue;
                this.handleGlobalSearch(item.dataset.historyValue);
                this.toggleSearchHistory(false);
            });
            document.addEventListener('click', (event) => {
                if (!event.target.closest('.project-switcher') && !event.target.closest('#projectContextMenu')) this.toggleProjectMenu(false);
                if (!event.target.closest('.history-entry')) this.toggleHistoryDropdown(false);
                if (!event.target.closest('.search-shell')) this.toggleSearchHistory(false);
                if (!event.target.closest('.toolbar-split')) this.toggleAutoArrangeMenu(false);
                if (!event.target.closest('.context-menu')) this.hideWorkspaceContextMenu();
                if (!event.target.closest('.context-menu')) this.hideProjectContextMenu();
                if (event.target === this.dom.reuseOverlay) this.closeReuseOverlay();
                if (!event.target.closest('.project-inline-input') && !event.target.closest('#projectContextMenu') && this.editingProjectName) this.finishInlineProjectRename(true);
            });

            document.querySelectorAll('.drag-item').forEach(item => {
                item.addEventListener('click', (event) => {
                    const type = event.currentTarget.dataset.type;
                    const text = (event.currentTarget.innerText || event.currentTarget.textContent || '').trim();
                    const title = text.includes(' ') ? text.substring(text.indexOf(' ') + 1) : text;
                    const offset = (this.components.length % 4) * 22;
                    this.addComponentToCanvas(type, 40 + offset, 40 + offset, title || this.getTypeLabel(type));
                });
            });

            if (this.dom.undoBtn) this.dom.undoBtn.addEventListener('click', () => this.undoHistory());
            if (this.dom.redoBtn) this.dom.redoBtn.addEventListener('click', () => this.redoHistory());
            this.dom.saveDashboardBtn.addEventListener('click', () => this.saveDashboard());
            this.dom.exportDashboardBtn.addEventListener('click', () => this.exportDashboard());
            this.dom.shareDashboardBtn.addEventListener('click', () => this.shareDashboard());
            this.dom.settingsToggleBtn.addEventListener('click', () => this.toggleSettingsPanel());
            this.dom.userProfileBtn.addEventListener('click', () => this.showProfileSummary());
            this.dom.deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedComponents());

            this.dom.dataImportBtn.addEventListener('click', () => this.dom.dataFileInput.click());
            this.dom.dataFileInput.addEventListener('change', async (event) => { await this.importDatasetFiles(event.target.files); });
            this.dom.templateLoadBtn.addEventListener('click', () => this.loadEnterpriseTemplate());
            this.dom.saveTemplateBtn.addEventListener('click', () => this.saveCurrentAsTemplate());
            this.dom.historyTemplateBtn.addEventListener('click', () => this.openReuseOverlay('template'));
            this.dom.copyFromDashboardBtn.addEventListener('click', () => this.openReuseOverlay('dashboard'));
            this.dom.datasetList.addEventListener('click', (event) => {
                const target = event.target.closest('[data-dataset-index]');
                if (target) this.selectDataset(Number(target.dataset.datasetIndex));
            });
            this.dom.leftSidebarToggleBtn.addEventListener('click', () => this.toggleLeftSidebar(false));
            this.dom.leftSidebarRevealBtn.addEventListener('click', () => this.toggleLeftSidebar(true));
            this.dom.newFolderBtn.addEventListener('click', () => this.createFolder());
            this.dom.newDashboardBtn.addEventListener('click', () => this.createDashboard(this.selectedFolderId));
            this.dom.workspaceTree.addEventListener('click', (event) => this.handleWorkspaceTreeClick(event));
            this.dom.workspaceTree.addEventListener('dblclick', (event) => this.handleWorkspaceTreeDblClick(event));
            this.dom.workspaceTree.addEventListener('contextmenu', (event) => this.handleWorkspaceTreeContextMenu(event));
            this.dom.workspaceContextMenu.addEventListener('click', (event) => this.handleWorkspaceContextMenuClick(event));
            this.dom.projectContextMenu.addEventListener('click', (event) => this.handleProjectContextMenuClick(event));
            this.dom.autoArrangeBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.toggleAutoArrangeMenu();
            });
            this.dom.autoArrangeMenuBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.toggleAutoArrangeMenu();
            });
            this.dom.autoArrangeMenu.addEventListener('click', (event) => {
                const item = event.target.closest('[data-layout-mode]');
                if (!item) return;
                const mode = item.dataset.layoutMode;
                this.setAutoLayoutMode(mode);
                this.toggleAutoArrangeMenu(false);
                if (mode === 'custom') {
                    this.recordHistoryStep('切换布局模式：自定义布局');
                    this.showToast('已切换为自定义布局，可继续自由拖拽组件');
                    return;
                }
                this.autoArrange(mode);
                this.showToast(`已按${this.getAutoLayoutModeLabel(mode)}整理画布`);
            });
            this.dom.rightSidebarToggleBtn.addEventListener('click', () => this.toggleRightSidebar(false, { manual: true }));
            this.dom.rightSidebarRevealBtn.addEventListener('click', () => this.toggleRightSidebar(true, { manual: true }));
            this.dom.applyConfigBtn.addEventListener('click', () => this.applyConfig());
            this.dom.overviewToggleBtn.addEventListener('click', () => this.toggleOverviewMode(true));
            this.dom.exitOverviewBtn.addEventListener('click', () => this.toggleOverviewMode(false));
            this.dom.configDataset.addEventListener('change', () => this.populateMappingFields(this.dom.configDataset.value));
            this.bindConfigLivePreview();
            this.dom.themeSelect.addEventListener('change', (event) => {
                const themeName = event.target.value;
                this.applyTheme(themeName);
                if (THEMES[themeName]) {
                    this.dom.backgroundColorInput.value = THEMES[themeName].canvas;
                    this.applyCanvasBackground(this.dom.backgroundColorInput.value);
                }
                this.saveMeta();
                this.recordHistoryStep(`切换主题：${themeName}`);
            });
            this.dom.backgroundColorInput.addEventListener('input', (event) => { this.applyCanvasBackground(event.target.value); this.saveMeta(); });
            this.dom.backgroundColorInput.addEventListener('change', () => this.recordHistoryStep('调整画布主色'));
            this.dom.globalBoardDescription.addEventListener('input', () => this.saveMeta());
            this.dom.globalBoardDescription.addEventListener('change', () => this.recordHistoryStep('更新全局说明'));
            this.dom.aiPanelMinimizeBtn.addEventListener('click', () => this.toggleAiCopilotPanel(true));
            this.dom.aiDockBubble.addEventListener('click', () => {
                if (this.aiDockState.justDragged) return;
                this.toggleAiCopilotPanel(false);
            });
            this.dom.aiDockBubble.addEventListener('mousedown', (event) => this.startAiDockBubbleDrag(event));
            ['aiBaseUrl', 'aiModelInput', 'aiApiKeyInput'].forEach((id) => {
                const element = this.dom[id];
                if (!element) return;
                element.addEventListener('input', () => this.handleAiSettingsInput());
            });
            this.dom.agentSendBtn.addEventListener('click', async () => this.handleAgentRequest());
            this.dom.agentInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); this.handleAgentRequest(); }
            });
            this.dom.aiSuggestions.forEach(button => button.addEventListener('click', () => { this.dom.agentInput.value = button.dataset.prompt || ''; this.handleAgentRequest(); }));
            this.dom.closeReuseOverlayBtn.addEventListener('click', () => this.closeReuseOverlay());
            this.dom.reuseList.addEventListener('click', (event) => this.handleReuseClick(event));
            document.addEventListener('mousemove', (event) => this.handleAiDockBubbleDrag(event));
            document.addEventListener('mouseup', () => this.endAiDockBubbleDrag());
            window.addEventListener('resize', () => this.handleViewportResize());
            document.addEventListener('keydown', (event) => {
                const editable = ['INPUT', 'TEXTAREA'].includes(event.target.tagName) || event.target.isContentEditable;
                if (event.key === 'Escape' && this.overviewMode) { event.preventDefault(); return this.toggleOverviewMode(false); }
                if (!editable && (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z') { event.preventDefault(); return this.undoHistory(); }
                if (!editable && ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z')))) { event.preventDefault(); return this.redoHistory(); }
                if (!editable && (event.key === 'Delete' || event.key === 'Backspace')) this.deleteSelectedComponents();
            });
        },

        bindConfigLivePreview: function () {
            const controlIds = [
                'configDataset', 'configTitle', 'configSubtitle', 'configColor', 'configSecondaryColor', 'configAccentColor',
                'configBackground', 'configXField', 'configYField', 'configXAxisName', 'configYAxisName', 'configXRotate',
                'configGranularity', 'configYMin', 'configYMax', 'configLegendPosition', 'configLabelPosition',
                'configSortOrder', 'configDataLimit', 'configShowLegend', 'configShowGrid', 'configShowLabel',
                'configSmooth', 'configShowArea', 'configStack', 'configInnerRadius', 'configOpacity',
                'configSymbolSize', 'configBorderRadius', 'configShadow', 'configWidth', 'configHeight'
            ];
            controlIds.forEach((id) => {
                const element = this.dom[id];
                if (!element) return;
                const eventName = element.tagName === 'SELECT' || element.type === 'checkbox' ? 'change' : 'input';
                element.addEventListener(eventName, () => this.scheduleConfigApply());
            });
        },

        getProject: function () { return this.projects[this.currentProjectIndex]; },
        getFolder: function () { return this.getProject()?.folders.find(folder => folder.id === this.selectedFolderId) || null; },
        getDashboard: function () { return this.getFolder()?.dashboards.find(d => d.id === this.selectedDashboardId) || null; },
        getActiveDataset: function () { return this.datasets?.[this.selectedDatasetIndex] || this.datasets?.[0] || null; },
        getDatasetByName: function (name) { return this.datasets.find(item => item.name === name) || null; },

        setProject: function (index, options = {}) {
            const project = this.projects[index];
            if (!project) return;
            if (!options.skipSave) this.persistCurrentDashboardSilently();
            this.currentProjectIndex = index;
            this.datasets = project.datasets;
            this.selectedDatasetIndex = 0;
            this.selectedFolderId = options.folderId || project.folders[0]?.id || null;
            this.selectedDashboardId = options.dashboardId || project.lastDashboardId || project.folders[0]?.dashboards[0]?.id || null;
            this.syncProjectLabel();
            this.renderProjectMenu();
            this.renderDatasets();
            this.renderWorkspace();
            if (this.selectedDashboardId) this.selectDashboard(this.selectedDashboardId, this.selectedFolderId, { skipSave: true });
            this.saveMeta();
            if (!options.skipSave) this.recordHistoryStep(`切换项目：${project.name}`);
        },

        syncProjectLabel: function () { this.dom.projectSelectorText.innerText = this.getProject()?.name || '未命名项目'; },
        toggleProjectMenu: function (show) { this.dom.projectMenu.classList.toggle('hidden', typeof show === 'boolean' ? !show : !this.dom.projectMenu.classList.contains('hidden')); },
        toggleSearchHistory: function (show) { this.dom.searchHistoryPanel.classList.toggle('hidden', typeof show === 'boolean' ? !show : !this.dom.searchHistoryPanel.classList.contains('hidden')); },
        getTypeLabel: function (type) {
            return ({
                line: '折线趋势图',
                area: '面积趋势图',
                bar: '柱状对比图',
                stackedBar: '堆叠柱图',
                horizontalBar: '横向条形图',
                pie: '占比饼图',
                doughnut: '环形图',
                rose: '南丁格尔玫瑰图',
                scatter: '散点分布图',
                radar: '雷达图',
                funnel: '漏斗图',
                treemap: '矩形树图',
                gauge: '仪表盘',
                card: '核心指标卡',
                table: '明细数据表'
            })[type] || '组件';
        },

        renderProjectMenu: function () {
            this.dom.projectMenu.innerHTML = this.projects.map((project, index) => `
                <button class="dropdown-item${index === this.currentProjectIndex ? ' active' : ''}" type="button" data-project-index="${index}">
                    <div class="project-option-name" title="双击可直接重命名">${this.escapeHtml(project.name)}</div>
                    <div class="project-option-meta">${project.folders.length} 个文件夹 · ${project.datasets.length} 个数据集</div>
                </button>`).join('');
        },
        showProjectContextMenu: function (x, y, index) {
            if (!this.dom.projectContextMenu) return;
            this.hideWorkspaceContextMenu();
            this.projectContextTarget = { index };
            this.dom.projectContextMenu.innerHTML = `
                <button class="context-menu-item" type="button" data-project-action="rename">重命名</button>
                <button class="context-menu-item" type="button" data-project-action="copy">复制项目</button>
                <button class="context-menu-item" type="button" data-project-action="paste">粘贴项目</button>
                <button class="context-menu-item danger" type="button" data-project-action="delete">删除项目</button>
            `;
            this.dom.projectContextMenu.classList.remove('hidden');
            const viewportWidth = window.innerWidth || 1440;
            const viewportHeight = window.innerHeight || 900;
            const menuRect = this.dom.projectContextMenu.getBoundingClientRect();
            const left = Math.max(8, Math.min(viewportWidth - menuRect.width - 8, x));
            const top = Math.max(8, Math.min(viewportHeight - menuRect.height - 8, y));
            this.dom.projectContextMenu.style.left = `${left}px`;
            this.dom.projectContextMenu.style.top = `${top}px`;
        },
        hideProjectContextMenu: function () {
            if (!this.dom.projectContextMenu) return;
            this.dom.projectContextMenu.classList.add('hidden');
            this.projectContextTarget = null;
        },
        handleProjectMenuContextMenu: function (event) {
            const item = event.target.closest('[data-project-index]');
            if (!item) return;
            event.preventDefault();
            this.showProjectContextMenu(event.clientX, event.clientY, Number(item.dataset.projectIndex));
        },
        cloneProjectForPaste: function (project) {
            const next = clone(project);
            next.id = this.uid('project');
            next.name = `${project.name} - 副本`;
            next.folders = (next.folders || []).map((folder) => ({
                ...folder,
                id: this.uid('folder'),
                dashboards: (folder.dashboards || []).map((board) => ({
                    ...board,
                    id: this.uid('dashboard')
                }))
            }));
            next.lastDashboardId = next.folders[0]?.dashboards[0]?.id || null;
            return next;
        },
        copyProject: function (index) {
            const project = this.projects[index];
            if (!project) return;
            this.projectClipboard = clone(project);
            this.saveMeta();
            this.showToast(`已复制项目：${project.name}`);
        },
        pasteProject: function (index) {
            if (!this.projectClipboard) return this.showToast('请先复制一个项目');
            const cloned = this.cloneProjectForPaste(this.projectClipboard);
            const insertIndex = Math.max(0, Number(index) + 1);
            this.projects.splice(insertIndex, 0, cloned);
            this.renderProjectMenu();
            this.saveMeta();
            this.recordHistoryStep(`复制项目：${cloned.name}`);
            this.showToast(`已粘贴项目：${cloned.name}`);
        },
        deleteProject: function (index) {
            if (this.projects.length <= 1) return this.showToast('至少保留一个项目');
            const project = this.projects[index];
            if (!project) return;
            if (!window.confirm(`确定删除项目「${project.name}」吗？其中包含的文件夹和看板都会一起移除。`)) return;
            this.projects.splice(index, 1);
            if (index < this.currentProjectIndex) this.currentProjectIndex -= 1;
            if (index === this.currentProjectIndex) this.currentProjectIndex = Math.max(0, Math.min(index, this.projects.length - 1));
            this.setProject(this.currentProjectIndex, { skipSave: true });
            this.recordHistoryStep(`删除项目：${project.name}`);
            this.showToast(`已删除项目：${project.name}`);
        },
        handleProjectContextMenuClick: function (event) {
            const action = event.target.closest('[data-project-action]');
            if (!action || !this.projectContextTarget) return;
            const index = this.projectContextTarget.index;
            this.hideProjectContextMenu();
            if (action.dataset.projectAction === 'rename') return this.startInlineProjectRename(index, 'menu');
            if (action.dataset.projectAction === 'copy') return this.copyProject(index);
            if (action.dataset.projectAction === 'paste') return this.pasteProject(index);
            if (action.dataset.projectAction === 'delete') return this.deleteProject(index);
        },

        handleProjectRenameDblClick: function (event) {
            if (event.target.closest('.project-inline-input')) return;
            const menuName = event.target.closest('.project-option-name');
            if (menuName) {
                event.preventDefault();
                event.stopPropagation();
                return this.startInlineProjectRename(Number(menuName.closest('[data-project-index]').dataset.projectIndex), 'menu');
            }
            if (event.target.closest('#projectSelectorText')) {
                event.preventDefault();
                event.stopPropagation();
                return this.startInlineProjectRename(this.currentProjectIndex, 'selector');
            }
        },

        startInlineProjectRename: function (index, source) {
            const project = this.projects[index];
            if (!project) return;
            if (this.editingProjectName) this.finishInlineProjectRename(true);

            const host = source === 'selector'
                ? this.dom.projectSelector
                : this.dom.projectMenu.querySelector(`[data-project-index="${index}"]`);
            const label = source === 'selector'
                ? this.dom.projectSelectorText
                : host?.querySelector('.project-option-name');

            if (!host || !label) return;

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'project-inline-input';
            input.value = project.name || '';
            input.setAttribute('aria-label', '重命名项目');

            label.innerHTML = '';
            label.appendChild(input);
            host.classList.add('is-editing');
            this.editingProjectName = { index, source, host, input, originalName: project.name || '' };

            ['mousedown', 'click', 'dblclick'].forEach((name) => input.addEventListener(name, (evt) => evt.stopPropagation()));
            input.addEventListener('keydown', (evt) => {
                if (evt.key === 'Enter') {
                    evt.preventDefault();
                    this.finishInlineProjectRename(true);
                }
                if (evt.key === 'Escape') {
                    evt.preventDefault();
                    this.finishInlineProjectRename(false);
                }
            });
            input.addEventListener('blur', () => this.finishInlineProjectRename(true));

            const focusInput = () => {
                input.focus();
                input.select();
            };
            if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(focusInput);
            else setTimeout(focusInput, 0);
        },

        finishInlineProjectRename: function (commit) {
            const state = this.editingProjectName;
            if (!state) return;
            this.editingProjectName = null;
            const nextName = state.input.value.trim();
            const finalName = commit && nextName ? nextName : state.originalName;
            const project = this.projects[state.index];
            const changed = project && project.name !== finalName;
            if (project) project.name = finalName;
            state.host?.classList.remove('is-editing');
            this.syncProjectLabel();
            this.renderProjectMenu();
            this.renderWorkspace();
            this.syncDashboardMeta();
            if (changed) {
                this.saveMeta();
                this.recordHistoryStep(`重命名项目：${finalName}`);
                this.showToast(`项目已重命名为：${finalName}`);
            }
        },

        renderDatasets: function () {
            const datasets = this.datasets || [];
            this.dom.datasetList.innerHTML = datasets.length
                ? datasets.map((dataset, index) => `<button class="dataset-pill${index === this.selectedDatasetIndex ? ' active' : ''}" type="button" data-dataset-index="${index}">${dataset.status === 'ready' ? '🟢' : '🟡'} ${this.escapeHtml(dataset.name)}</button>`).join('')
                : '<div class="dataset-pill">暂无数据集</div>';
            this.renderDatasetMeta(this.getActiveDataset());
        },

        renderDatasetMeta: function (dataset) {
            if (!dataset) {
                this.dom.datasetMeta.innerText = '请选择数据集查看字段和预览信息。';
                this.dom.datasetMeta.title = this.dom.datasetMeta.innerText;
                return;
            }
            const fields = this.getDatasetFieldNames(dataset);
            const previewSource = dataset.rows?.[0] || {};
            const preview = Object.entries(previewSource).slice(0, 3).map(([key, value]) => `${key}:${value}`).join(' / ');
            const summary = `字段 ${fields.slice(0, 4).join(' / ')}${fields.length > 4 ? ' 等' : ''} · ${dataset.rows?.length || 0} 条记录 · ${preview || '暂无预览'}`;
            this.dom.datasetMeta.innerText = summary;
            this.dom.datasetMeta.title = summary;
        },

        initAiCopilotState: function () {
            if (!this.dom.aiCopilotPanel || !this.dom.aiDockBubble) return;
            if (this.aiDockState.left === null || this.aiDockState.top === null) this.resetAiDockBubblePosition();
            else this.applyAiBubblePosition(this.aiDockState.left, this.aiDockState.top);
            this.snapAiDockBubble(true);
            this.toggleAiCopilotPanel(this.aiDockState.minimized === true, { skipSave: true });
        },
        handleAiSettingsInput: function () {
            this.aiSettings = {
                baseUrl: this.dom.aiBaseUrl?.value?.trim() || 'https://api.openai.com/v1',
                model: this.dom.aiModelInput?.value?.trim() || 'gpt-5.2',
                apiKey: this.dom.aiApiKeyInput?.value?.trim() || ''
            };
            this.saveAiSettings();
            this.syncAiSettingsUI();
        },
        getAutoLayoutModeLabel: function (mode) {
            if (mode === 'presentation') return '演示排布';
            if (mode === 'custom') return '自定义布局';
            return '紧凑排布';
        },
        syncAutoArrangeButton: function () {
            if (this.dom.autoArrangeBtn) this.dom.autoArrangeBtn.innerText = `自适应布局 · ${this.getAutoLayoutModeLabel(this.currentAutoLayoutMode)}`;
        },
        renderAutoArrangeMenu: function () {
            if (!this.dom.autoArrangeMenu) return;
            this.dom.autoArrangeMenu.querySelectorAll('[data-layout-mode]').forEach((item) => {
                item.classList.toggle('active', item.dataset.layoutMode === this.currentAutoLayoutMode);
            });
        },
        setAutoLayoutMode: function (mode, options = {}) {
            this.currentAutoLayoutMode = mode === 'presentation' ? 'presentation' : (mode === 'custom' ? 'custom' : 'compact');
            this.syncAutoArrangeButton();
            this.renderAutoArrangeMenu();
            if (!options.skipSave) this.saveMeta();
        },
        toggleAutoArrangeMenu: function (show) {
            if (!this.dom.autoArrangeMenu) return;
            const next = typeof show === 'boolean' ? show : this.dom.autoArrangeMenu.classList.contains('hidden');
            this.dom.autoArrangeMenu.classList.toggle('hidden', !next);
        },

        resetAiDockBubblePosition: function () {
            const bubbleWidth = this.dom.aiDockBubble?.offsetWidth || 64;
            const viewportWidth = window.innerWidth || 1440;
            const viewportHeight = window.innerHeight || 900;
            this.applyAiBubblePosition(viewportWidth - bubbleWidth - 14, Math.round(viewportHeight * 0.54));
        },

        getAiBubblePosition: function () {
            return {
                left: typeof this.aiDockState?.left === 'number' ? this.aiDockState.left : null,
                top: typeof this.aiDockState?.top === 'number' ? this.aiDockState.top : null
            };
        },

        applyAiBubblePosition: function (left, top) {
            const bubble = this.dom.aiDockBubble;
            if (!bubble) return;
            bubble.style.left = `${left}px`;
            bubble.style.top = `${top}px`;
            bubble.style.right = 'auto';
            bubble.style.bottom = 'auto';
            this.aiDockState.left = left;
            this.aiDockState.top = top;
        },

        snapAiDockBubble: function (skipSave) {
            const bubble = this.dom.aiDockBubble;
            if (!bubble) return;
            const bubbleWidth = bubble.offsetWidth || 64;
            const bubbleHeight = bubble.offsetHeight || 64;
            const viewportWidth = window.innerWidth || 1440;
            const viewportHeight = window.innerHeight || 900;
            const rawLeft = typeof this.aiDockState.left === 'number' ? this.aiDockState.left : viewportWidth - bubbleWidth - 14;
            const rawTop = typeof this.aiDockState.top === 'number' ? this.aiDockState.top : Math.round(viewportHeight * 0.54);
            const snappedLeft = rawLeft + bubbleWidth / 2 < viewportWidth / 2 ? 14 : viewportWidth - bubbleWidth - 14;
            const clampedTop = Math.max(84, Math.min(viewportHeight - bubbleHeight - 16, rawTop));
            this.applyAiBubblePosition(snappedLeft, clampedTop);
            if (!skipSave) this.saveMeta();
        },

        toggleAiCopilotPanel: function (minimized, options = {}) {
            const next = typeof minimized === 'boolean' ? minimized : !this.aiDockState.minimized;
            this.aiDockState.minimized = next;
            this.dom.aiCopilotPanel.classList.toggle('hidden', next);
            this.dom.aiDockBubble.classList.toggle('hidden', !next);
            if (next) this.snapAiDockBubble(true);
            if (!next) setTimeout(() => this.dom.agentInput?.focus(), 0);
            if (!options.skipSave) this.saveMeta();
        },

        startAiDockBubbleDrag: function (event) {
            if (event.button !== 0) return;
            event.preventDefault();
            const rect = this.dom.aiDockBubble.getBoundingClientRect();
            this.aiDockState.dragging = true;
            this.aiDockState.moved = false;
            this.aiDockState.justDragged = false;
            this.aiDockState.offsetX = event.clientX - rect.left;
            this.aiDockState.offsetY = event.clientY - rect.top;
        },

        handleAiDockBubbleDrag: function (event) {
            if (!this.aiDockState.dragging) return;
            const bubble = this.dom.aiDockBubble;
            const bubbleWidth = bubble.offsetWidth || 64;
            const bubbleHeight = bubble.offsetHeight || 64;
            const viewportWidth = window.innerWidth || 1440;
            const viewportHeight = window.innerHeight || 900;
            const left = Math.max(8, Math.min(viewportWidth - bubbleWidth - 8, event.clientX - this.aiDockState.offsetX));
            const top = Math.max(84, Math.min(viewportHeight - bubbleHeight - 16, event.clientY - this.aiDockState.offsetY));
            this.applyAiBubblePosition(left, top);
            this.aiDockState.moved = true;
        },

        endAiDockBubbleDrag: function () {
            if (!this.aiDockState.dragging) return;
            this.aiDockState.dragging = false;
            this.snapAiDockBubble(true);
            if (this.aiDockState.moved) {
                this.aiDockState.justDragged = true;
                setTimeout(() => { this.aiDockState.justDragged = false; }, 160);
            }
            this.saveMeta();
        },

        handleViewportResize: function () {
            if (this.aiDockState.minimized) this.snapAiDockBubble(true);
            this.refreshCanvasViewport();
        },
        refreshCanvasViewport: function () {
            clearTimeout(this.resizeSyncTimer);
            const resize = () => {
                if (window.ChartManager?.resizeAll) ChartManager.resizeAll();
            };
            if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(resize);
            this.resizeSyncTimer = setTimeout(resize, 260);
        },
        shouldShowRightSidebar: function () {
            if (this.rightSidebarCollapsedManually === true) return false;
            return this.rightSidebarInitializedHidden !== true;
        },
        toggleHistoryDropdown: function (show) {
            if (!this.dom.historyDropdown) return;
            const next = typeof show === 'boolean' ? show : this.dom.historyDropdown.classList.contains('hidden');
            this.dom.historyDropdown.classList.toggle('hidden', !next);
        },
        syncCanvasFocusClasses: function () {
            const hideLeft = this.canvasFocusMode === true;
            const hideRight = !this.shouldShowRightSidebar();
            document.body.classList.toggle('canvas-focus-mode', hideLeft && hideRight);
            document.body.classList.toggle('hide-left-sidebar', hideLeft);
            document.body.classList.toggle('hide-right-sidebar', hideRight);
        },

        toggleLeftSidebar: function (visible) {
            const show = typeof visible === 'boolean' ? visible : this.canvasFocusMode;
            this.canvasFocusMode = !show;
            this.syncCanvasFocusClasses();
            this.saveMeta();
            this.refreshCanvasViewport();
        },

        toggleRightSidebar: function (visible, options = {}) {
            const show = typeof visible === 'boolean' ? visible : !this.shouldShowRightSidebar();
            if (show) this.rightSidebarInitializedHidden = false;
            if (options.manual === true) this.rightSidebarCollapsedManually = !show;
            this.syncCanvasFocusClasses();
            this.saveMeta();
            this.refreshCanvasViewport();
        },
        toggleOverviewMode: function (forceVisible) {
            const next = typeof forceVisible === 'boolean' ? forceVisible : !this.overviewMode;
            this.overviewMode = next;
            document.body.classList.toggle('overview-mode', this.overviewMode === true);
            this.toggleProjectMenu(false);
            this.toggleHistoryDropdown(false);
            this.toggleSearchHistory(false);
            this.toggleAutoArrangeMenu(false);
            this.closeReuseOverlay();
            this.hideWorkspaceContextMenu();
            this.hideProjectContextMenu();
            this.refreshCanvasViewport();
        },
        showWorkspaceContextMenu: function (x, y, items, target) {
            if (!this.dom.workspaceContextMenu) return;
            this.hideProjectContextMenu();
            this.workspaceContextTarget = target || null;
            this.dom.workspaceContextMenu.innerHTML = items.map((item) => `
                <button class="context-menu-item${item.danger ? ' danger' : ''}" type="button" data-context-action="${item.action}">
                    ${this.escapeHtml(item.label)}
                </button>`).join('');
            this.dom.workspaceContextMenu.classList.remove('hidden');
            const viewportWidth = window.innerWidth || 1440;
            const viewportHeight = window.innerHeight || 900;
            const menuRect = this.dom.workspaceContextMenu.getBoundingClientRect();
            const left = Math.max(8, Math.min(viewportWidth - menuRect.width - 8, x));
            const top = Math.max(8, Math.min(viewportHeight - menuRect.height - 8, y));
            this.dom.workspaceContextMenu.style.left = `${left}px`;
            this.dom.workspaceContextMenu.style.top = `${top}px`;
        },
        hideWorkspaceContextMenu: function () {
            if (!this.dom.workspaceContextMenu) return;
            this.dom.workspaceContextMenu.classList.add('hidden');
            this.workspaceContextTarget = null;
        },
        handleWorkspaceTreeContextMenu: function (event) {
            if (event.target.closest('.inline-rename-input')) return;
            event.preventDefault();
            const folderNode = event.target.closest('.workspace-folder');
            const dashboardNode = event.target.closest('.dashboard-row');
            if (dashboardNode) {
                return this.showWorkspaceContextMenu(event.clientX, event.clientY, [
                    { action: 'rename-dashboard', label: '重命名看板' },
                    { action: 'delete-dashboard', label: '删除看板', danger: true }
                ], { type: 'dashboard', folderId: dashboardNode.dataset.folderId, dashboardId: dashboardNode.dataset.dashboardId });
            }
            if (folderNode) {
                return this.showWorkspaceContextMenu(event.clientX, event.clientY, [
                    { action: 'new-dashboard', label: '新建看板' },
                    { action: 'rename-folder', label: '重命名文件夹' },
                    { action: 'delete-folder', label: '删除文件夹', danger: true }
                ], { type: 'folder', folderId: folderNode.dataset.folderId });
            }
            this.showWorkspaceContextMenu(event.clientX, event.clientY, [
                { action: 'new-folder', label: '新建文件夹' },
                { action: 'new-dashboard-selected', label: '在当前文件夹中新建看板' }
            ], { type: 'blank', folderId: this.selectedFolderId });
        },
        handleWorkspaceContextMenuClick: function (event) {
            const item = event.target.closest('[data-context-action]');
            if (!item || !this.workspaceContextTarget) return;
            const target = this.workspaceContextTarget;
            this.hideWorkspaceContextMenu();
            if (item.dataset.contextAction === 'new-folder') return this.createFolder();
            if (item.dataset.contextAction === 'new-dashboard-selected') return this.createDashboard(target.folderId || this.selectedFolderId);
            if (item.dataset.contextAction === 'new-dashboard') return this.createDashboard(target.folderId);
            if (item.dataset.contextAction === 'rename-folder') return this.renameFolder(target.folderId);
            if (item.dataset.contextAction === 'delete-folder') return this.deleteFolder(target.folderId);
            if (item.dataset.contextAction === 'rename-dashboard') return this.renameDashboard(target.folderId, target.dashboardId);
            if (item.dataset.contextAction === 'delete-dashboard') return this.deleteDashboard(target.folderId, target.dashboardId);
        },

        renderWorkspace: function () {
            const project = this.getProject();
            this.dom.workspaceTree.innerHTML = project.folders.map(folder => `
                <div class="workspace-folder" data-folder-id="${folder.id}">
                    <div class="workspace-folder-head" data-folder-id="${folder.id}">
                        <span class="folder-toggle">${folder.expanded ? '▾' : '▸'}</span>
                        <span class="folder-name" title="双击可直接重命名">${this.escapeHtml(folder.name)}</span>
                        <span class="folder-meta">${folder.dashboards.length} 个看板</span>
                    </div>
                    <div class="workspace-folder-body" style="display:${folder.expanded ? 'block' : 'none'};">
                        ${folder.dashboards.map(board => `
                            <div class="dashboard-row${board.id === this.selectedDashboardId ? ' active' : ''}" data-folder-id="${folder.id}" data-dashboard-id="${board.id}">
                                <span class="dashboard-name" title="双击可直接重命名">${this.escapeHtml(board.name)}</span>
                            </div>`).join('')}
                    </div>
                </div>`).join('');
        },

        handleWorkspaceTreeClick: function (event) {
            if (event.target.closest('.inline-rename-input')) return;
            const dashboard = event.target.closest('.dashboard-row');
            if (dashboard) return this.selectDashboard(dashboard.dataset.dashboardId, dashboard.dataset.folderId);
            const head = event.target.closest('.workspace-folder-head');
            if (head) this.toggleFolder(head.closest('[data-folder-id]').dataset.folderId);
        },

        handleWorkspaceTreeDblClick: function (event) {
            if (event.target.closest('.inline-rename-input')) return;
            const folderName = event.target.closest('.folder-name');
            if (folderName) {
                event.preventDefault();
                event.stopPropagation();
                return this.startInlineRename('folder', folderName.closest('[data-folder-id]').dataset.folderId);
            }
            const dashboardName = event.target.closest('.dashboard-name');
            if (dashboardName) {
                const row = dashboardName.closest('.dashboard-row');
                event.preventDefault();
                event.stopPropagation();
                return this.startInlineRename('dashboard', row.dataset.folderId, row.dataset.dashboardId);
            }
        },

        toggleFolder: function (folderId) {
            const folder = this.getProject()?.folders.find(item => item.id === folderId);
            if (!folder) return;
            folder.expanded = !folder.expanded;
            this.renderWorkspace();
            this.saveMeta();
        },

        nextEntityName: function (items, prefix) {
            let index = 1;
            let name = `${prefix}${index}`;
            const names = new Set((items || []).map(item => item.name));
            while (names.has(name)) {
                index += 1;
                name = `${prefix}${index}`;
            }
            return name;
        },
        createFolder: function (options = {}) {
            const folder = {
                id: this.uid('folder'),
                name: options.name || this.nextEntityName(this.getProject().folders, '新建文件夹'),
                expanded: true,
                dashboards: []
            };
            this.getProject().folders.push(folder);
            this.selectedFolderId = folder.id;
            this.renderWorkspace();
            this.saveMeta();
            this.recordHistoryStep(`新建文件夹：${folder.name}`);
            this.showToast(`已新建文件夹：${folder.name}`);
            if (options.startRename !== false) this.startInlineRename('folder', folder.id);
        },

        createDashboard: function (folderId, options = {}) {
            const folder = this.getProject().folders.find(item => item.id === folderId) || this.getProject().folders[0];
            if (!folder) return;
            const dashboard = {
                id: this.uid('dashboard'),
                name: options.name || this.nextEntityName(folder.dashboards, '新建看板'),
                seed: 'blank',
                updatedAt: new Date().toISOString()
            };
            folder.dashboards.push(dashboard);
            folder.expanded = true;
            this.getProject().lastDashboardId = dashboard.id;
            this.selectedFolderId = folder.id;
            this.selectedDashboardId = dashboard.id;
            this.renderWorkspace();
            this.selectDashboard(dashboard.id, folder.id, { skipSave: true, blank: true });
            this.saveMeta();
            this.recordHistoryStep(`新建看板：${dashboard.name}`);
            if (options.startRename !== false) this.startInlineRename('dashboard', folder.id, dashboard.id);
        },

        renameFolder: function (folderId) { this.startInlineRename('folder', folderId); },

        renameDashboard: function (folderId, dashboardId) { this.startInlineRename('dashboard', folderId, dashboardId); },

        deleteFolder: function (folderId) {
            const project = this.getProject();
            const folder = project?.folders.find(item => item.id === folderId);
            if (!folder) return;
            if (!window.confirm(`确定删除文件夹「${folder.name}」吗？其中的看板也会一并移除。`)) return;

            const deletingCurrent = folder.id === this.selectedFolderId;
            project.folders = project.folders.filter(item => item.id !== folderId);

            if (!project.folders.length) {
                this.selectedFolderId = null;
                this.selectedDashboardId = null;
                this.resetCanvas();
                this.renderWorkspace();
                this.syncDashboardMeta();
                this.saveMeta();
                this.showToast(`已删除文件夹：${folder.name}`);
                return;
            }

            const fallback = this.findFallbackBoard();
            this.renderWorkspace();
            if (deletingCurrent && fallback) this.selectDashboard(fallback.board.id, fallback.folder.id, { skipSave: true });
            else {
                this.selectedFolderId = project.folders[0]?.id || null;
                this.selectedDashboardId = fallback?.board.id || null;
                this.renderWorkspace();
                if (fallback) this.syncDashboardMeta();
            }
            this.saveMeta();
            this.recordHistoryStep(`删除文件夹：${folder.name}`);
            this.showToast(`已删除文件夹：${folder.name}`);
        },

        deleteDashboard: function (folderId, dashboardId) {
            const folder = this.getProject()?.folders.find(item => item.id === folderId);
            const dashboard = folder?.dashboards.find(item => item.id === dashboardId);
            if (!dashboard) return;
            if (!window.confirm(`确定删除看板「${dashboard.name}」吗？`)) return;

            const deletingCurrent = dashboard.id === this.selectedDashboardId;
            folder.dashboards = folder.dashboards.filter(item => item.id !== dashboardId);

            if (deletingCurrent) this.persistCurrentDashboardSilently();

            const fallback = this.findFallbackBoard(folderId);
            this.renderWorkspace();
            if (deletingCurrent && fallback) this.selectDashboard(fallback.board.id, fallback.folder.id, { skipSave: true });
            else if (deletingCurrent) {
                this.selectedDashboardId = null;
                this.selectedFolderId = folderId;
                this.resetCanvas();
                this.syncDashboardMeta();
                this.renderWorkspace();
            }
            this.saveMeta();
            this.recordHistoryStep(`删除看板：${dashboard.name}`);
            this.showToast(`已删除看板：${dashboard.name}`);
        },

        findFallbackBoard: function (preferredFolderId) {
            const project = this.getProject();
            const orderedFolders = preferredFolderId
                ? [
                    ...project.folders.filter(folder => folder.id === preferredFolderId),
                    ...project.folders.filter(folder => folder.id !== preferredFolderId)
                ]
                : project.folders;
            for (const folder of orderedFolders) {
                if (folder.dashboards?.length) return { folder, board: folder.dashboards[0] };
            }
            return null;
        },

        startInlineRename: function (type, folderId, dashboardId) {
            if (this.editingWorkspaceName) {
                const sameTarget = this.editingWorkspaceName.type === type
                    && this.editingWorkspaceName.folderId === folderId
                    && this.editingWorkspaceName.dashboardId === dashboardId;
                if (sameTarget) return;
                this.finishInlineRename(true);
            }

            const folderNode = this.dom.workspaceTree.querySelector(`.workspace-folder[data-folder-id="${folderId}"]`);
            const label = type === 'folder'
                ? folderNode?.querySelector('.folder-name')
                : folderNode?.querySelector(`.dashboard-row[data-dashboard-id="${dashboardId}"] .dashboard-name`);
            const entity = type === 'folder'
                ? this.getProject()?.folders.find(item => item.id === folderId)
                : this.getProject()?.folders.find(item => item.id === folderId)?.dashboards.find(item => item.id === dashboardId);

            if (!label || !entity) return;

            const host = type === 'folder' ? label.closest('.workspace-folder-head') : label.closest('.dashboard-row');
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'inline-rename-input';
            input.value = entity.name || '';
            input.setAttribute('aria-label', type === 'folder' ? '重命名文件夹' : '重命名看板');

            label.innerHTML = '';
            label.appendChild(input);
            host?.classList.add('is-renaming');

            this.editingWorkspaceName = {
                type,
                folderId,
                dashboardId: dashboardId || null,
                originalName: entity.name || '',
                host,
                input
            };

            ['mousedown', 'click', 'dblclick'].forEach(name => {
                input.addEventListener(name, (event) => {
                    event.stopPropagation();
                });
            });

            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.finishInlineRename(true);
                }
                if (event.key === 'Escape') {
                    event.preventDefault();
                    this.finishInlineRename(false);
                }
            });

            input.addEventListener('blur', () => this.finishInlineRename(true));

            const focusInput = () => {
                input.focus();
                input.select();
            };
            if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(focusInput);
            else setTimeout(focusInput, 0);
        },

        finishInlineRename: function (commit) {
            const state = this.editingWorkspaceName;
            if (!state) return;

            this.editingWorkspaceName = null;
            const nextName = state.input.value.trim();
            const finalName = commit && nextName ? nextName : state.originalName;
            let changed = false;

            if (state.type === 'folder') {
                const folder = this.getProject()?.folders.find(item => item.id === state.folderId);
                if (folder) {
                    changed = folder.name !== finalName;
                    folder.name = finalName;
                }
            } else {
                const folder = this.getProject()?.folders.find(item => item.id === state.folderId);
                const dashboard = folder?.dashboards.find(item => item.id === state.dashboardId);
                if (dashboard) {
                    changed = dashboard.name !== finalName;
                    dashboard.name = finalName;
                }
            }

            state.host?.classList.remove('is-renaming');
            this.renderWorkspace();
            if (state.type === 'dashboard' && state.dashboardId === this.selectedDashboardId) this.syncDashboardMeta();
            if (changed) {
                this.saveMeta();
                this.recordHistoryStep(`${state.type === 'folder' ? '重命名文件夹' : '重命名看板'}：${finalName}`);
                this.showToast(`已重命名为：${finalName}`);
            }
        },

        selectDataset: function (index) {
            if (!this.datasets[index]) return;
            this.selectedDatasetIndex = index;
            this.renderDatasets();
            this.log(`当前选中数据集：${this.datasets[index].name}`);
            if (this.selectedComponentIds.length === 1) this.populateConfigForm(this.components.find(item => item.id === this.selectedComponentIds[0]));
        },

        selectDashboard: function (dashboardId, folderId, options = {}) {
            const folder = this.getProject()?.folders.find(item => item.id === folderId) || this.getProject()?.folders.find(item => item.dashboards.some(board => board.id === dashboardId));
            const board = folder?.dashboards.find(item => item.id === dashboardId);
            if (!board) return;
            if (!options.skipSave) this.persistCurrentDashboardSilently();
            this.selectedFolderId = folder.id;
            this.selectedDashboardId = board.id;
            this.getProject().lastDashboardId = board.id;
            folder.expanded = true;
            this.renderWorkspace();
            const state = options.blank ? null : this.loadDashboardState(this.getProject().id, board.id);
            if (state) this.applySerializedState(state); else this.applySeed(board.seed);
            this.syncDashboardMeta();
            this.updateSelectionUI();
            this.saveMeta();
            this.refreshCanvasViewport();
            if (!options.skipSave) this.recordHistoryStep(`切换看板：${board.name}`);
        },

        syncDashboardMeta: function () {
            const board = this.getDashboard();
            this.dom.currentDashboardName.innerText = board?.name || '未命名看板';
            this.dom.currentDashboardMeta.innerText = `${this.getProject()?.name || ''} · ${this.components.length} 个组件 · ${this.datasets.length} 个数据集`;
        },
        keyForBoard: function (projectId = this.getProject()?.id, dashboardId = this.selectedDashboardId) { return `${this.storagePrefix}${projectId}.${dashboardId}`; },
        loadDashboardState: function (projectId, dashboardId) { return this.safeParse(localStorage.getItem(this.keyForBoard(projectId, dashboardId))); },
        persistCurrentDashboardSilently: function () { const board = this.getDashboard(); if (board) localStorage.setItem(this.keyForBoard(this.getProject().id, board.id), JSON.stringify(this.serializeDashboardState())); },

        seedPreset: function (name) {
            const d0 = this.datasets[0]?.name || '';
            const d1 = this.datasets[1]?.name || d0;
            const presets = {
                sales: [
                    { type: 'line', x: 36, y: 36, title: '月度销售趋势', datasetName: d0 },
                    { type: 'bar', x: 500, y: 36, title: '产品线销售对比', datasetName: d0, color: '#20c5ff' },
                    { type: 'card', x: 964, y: 36, title: '核心销售指标', datasetName: d0, width: 280, height: 220 },
                    { type: 'doughnut', x: 36, y: 392, title: '区域贡献结构', datasetName: d0, color: '#ff8a3d' },
                    { type: 'table', x: 500, y: 392, title: '重点客户明细', datasetName: d0, width: 746, height: 284 }
                ],
                region: [
                    { type: 'horizontalBar', x: 36, y: 36, title: '区域销售排名', datasetName: d0, color: '#00c2a8' },
                    { type: 'pie', x: 500, y: 36, title: '区域占比', datasetName: d0, color: '#4d9bff' },
                    { type: 'radar', x: 964, y: 36, title: '区域能力雷达', datasetName: d0, width: 300, height: 320 },
                    { type: 'table', x: 36, y: 392, title: '区域清单', datasetName: d0, width: 1228, height: 284 }
                ],
                behavior: [
                    { type: 'scatter', x: 36, y: 36, title: '渠道转化分布', datasetName: d1, color: '#6f7ef9' },
                    { type: 'card', x: 500, y: 36, title: '转化总量', datasetName: d1, width: 280, height: 220 },
                    { type: 'table', x: 36, y: 392, title: '渠道明细', datasetName: d1, width: 746, height: 284 }
                ],
                ops: [
                    { type: 'area', x: 36, y: 36, title: '工单波动趋势', datasetName: d0 },
                    { type: 'line', x: 500, y: 36, title: '满意度趋势', datasetName: d0, color: '#ffce52' },
                    { type: 'card', x: 964, y: 36, title: '本周响应总量', datasetName: d0 },
                    { type: 'table', x: 36, y: 392, title: '团队明细', datasetName: d0, width: 1228, height: 284 }
                ],
                growth: [
                    { type: 'bar', x: 36, y: 36, title: '周线索增长', datasetName: d0 },
                    { type: 'line', x: 500, y: 36, title: '成交趋势', datasetName: d0, color: '#20c5ff' },
                    { type: 'card', x: 964, y: 36, title: '总成交量', datasetName: d0 },
                    { type: 'table', x: 36, y: 392, title: '线索渠道明细', datasetName: d0, width: 1228, height: 284 }
                ],
                retention: [
                    { type: 'radar', x: 36, y: 36, title: '人群价值雷达', datasetName: d1 },
                    { type: 'line', x: 500, y: 36, title: '留存率变化', datasetName: d1, color: '#8cd4ff' },
                    { type: 'table', x: 36, y: 392, title: '留存明细', datasetName: d1, width: 1228, height: 284 }
                ],
                exec: [
                    { type: 'card', x: 36, y: 36, title: '总收入', datasetName: d0, width: 260, height: 190 },
                    { type: 'card', x: 322, y: 36, title: '利润率', datasetName: d0, width: 260, height: 190, color: '#20c5ff' },
                    { type: 'card', x: 608, y: 36, title: '转化率', datasetName: d0, width: 260, height: 190, color: '#ff8a3d' },
                    { type: 'line', x: 36, y: 252, title: '经营趋势', datasetName: d0, width: 600, height: 320 },
                    { type: 'doughnut', x: 668, y: 252, title: '结构分布', datasetName: d0, width: 340, height: 320 },
                    { type: 'table', x: 1032, y: 252, title: '重点明细', datasetName: d0, width: 380, height: 320 }
                ],
                weekly: [
                    { type: 'area', x: 36, y: 36, title: '新增趋势', datasetName: d0, width: 560, height: 300 },
                    { type: 'scatter', x: 620, y: 36, title: '渠道效率', datasetName: d0, width: 420, height: 300 },
                    { type: 'gauge', x: 1060, y: 36, title: '周目标达成', datasetName: d0, width: 300, height: 300 },
                    { type: 'table', x: 36, y: 360, title: '周报明细', datasetName: d0, width: 1324, height: 300 }
                ],
                blank: []
            };
            return clone(presets[name] || presets.blank);
        },

        applySeed: function (seed) { this.resetCanvas(); this.seedPreset(seed).forEach(item => this.addComponentToCanvas(item.type, item.x, item.y, item.title, { ...item, silent: true })); this.refreshCanvasViewport(); },
        openReuseOverlay: function (mode) {
            this.dom.reuseOverlay.classList.remove('hidden');
            if (mode === 'template') {
                this.dom.reuseTitle.innerText = '历史模板';
                this.dom.reuseSubtitle.innerText = '点击模板可替换当前工作台';
                this.dom.reuseList.innerHTML = this.templates.map(item => `<button class="reuse-item" type="button" data-mode="template" data-id="${item.id}"><div class="reuse-item-title">${this.escapeHtml(item.name)}</div><div class="panel-subtitle">${item.type === 'preset' ? '系统模板' : '我的模板'}</div></button>`).join('');
            } else {
                const currentProject = this.getProject();
                const boards = this.projects.flatMap(project => project.folders.flatMap(folder => folder.dashboards.filter(board => !(project.id === currentProject.id && board.id === this.selectedDashboardId)).map(board => ({ project, folder, board }))));
                this.dom.reuseTitle.innerText = '从其他看板复制';
                this.dom.reuseSubtitle.innerText = '点击后将目标看板内容复制到当前画布';
                this.dom.reuseList.innerHTML = boards.length ? boards.map(item => `<button class="reuse-item" type="button" data-mode="dashboard" data-project="${item.project.id}" data-id="${item.board.id}"><div class="reuse-item-title">${this.escapeHtml(item.board.name)}</div><div class="panel-subtitle">${this.escapeHtml(item.project.name)} · ${this.escapeHtml(item.folder.name)}</div></button>`).join('') : '<div class="reuse-item">暂无可复制的其他看板。</div>';
            }
        },
        closeReuseOverlay: function () { this.dom.reuseOverlay.classList.add('hidden'); },
        handleReuseClick: function (event) {
            const item = event.target.closest('[data-mode]');
            if (!item) return;
            if (item.dataset.mode === 'template') this.applyTemplate(item.dataset.id); else this.copyDashboard(item.dataset.project, item.dataset.id);
            this.closeReuseOverlay();
        },
        applyTemplate: function (id) { const tpl = this.templates.find(item => item.id === id); if (!tpl) return; if (tpl.type === 'preset') this.applySeed(tpl.seed); else this.applySerializedState(clone(tpl.state)); this.syncDashboardMeta(); this.showToast(`已应用模板：${tpl.name}`); this.recordHistoryStep(`应用模板：${tpl.name}`); },
        copyDashboard: function (projectId, dashboardId) { const state = this.loadDashboardState(projectId, dashboardId); const board = this.projects.flatMap(project => project.folders.flatMap(folder => folder.dashboards)).find(item => item.id === dashboardId); if (state) { this.appendState(state); this.recordHistoryStep(`从其他看板复制：${board?.name || dashboardId}`); return; } if (board?.seed) this.seedPreset(board.seed).forEach(item => this.addComponentToCanvas(item.type, item.x + 30, item.y + 30, item.title, { ...item, silent: true })); this.syncDashboardMeta(); this.recordHistoryStep(`从其他看板复制：${board?.name || dashboardId}`); },
        appendState: function (state) { (state.components || []).forEach(item => this.addComponentToCanvas(item.type, (item.layout?.left || 20) + 30, (item.layout?.top || 20) + 30, item.config?.title || this.getTypeLabel(item.type), { data: item.data, config: item.config, datasetName: item.config?.datasetName, width: item.layout?.width, height: item.layout?.height, silent: true })); this.syncDashboardMeta(); },
        saveCurrentAsTemplate: function () { const name = window.prompt('请输入模板名称', this.getDashboard()?.name || '我的模板'); if (!name) return; this.templates.unshift({ id: this.uid('tpl'), name: name.trim(), type: 'custom', state: this.serializeDashboardState() }); this.saveMeta(); this.showToast(`已保存模板：${name}`); },

        buildConfig: function (type, title, dataset, options = {}) {
            const fields = this.getDatasetFieldNames(dataset);
            const numerics = this.getNumericFields(dataset);
            const categories = fields.filter(field => !numerics.includes(field));
            const base = {
                title,
                subtitle: options.subtitle || '',
                datasetName: dataset?.name || '',
                xField: options.xField || categories[0] || fields[0] || '',
                yField: options.yField || numerics[0] || fields[1] || fields[0] || '',
                xAxisName: options.xAxisName || '',
                yAxisName: options.yAxisName || '',
                color: options.color || THEMES[this.dom.themeSelect.value].primary,
                secondaryColor: options.secondaryColor || THEMES[this.dom.themeSelect.value].secondary,
                accentColor: options.accentColor || THEMES[this.dom.themeSelect.value].accent,
                background: options.background || '#0f1628',
                xLabelRotate: options.xLabelRotate || 0,
                granularity: options.granularity || 0,
                yMin: options.yMin ?? '',
                yMax: options.yMax ?? '',
                legendPosition: options.legendPosition || 'top',
                labelPosition: options.labelPosition || 'auto',
                sortOrder: options.sortOrder || 'none',
                dataLimit: options.dataLimit ?? (type === 'radar' ? 6 : 12),
                showLegend: options.showLegend !== false,
                showGrid: options.showGrid !== false,
                showLabel: options.showLabel === true,
                smooth: options.smooth || type === 'area',
                showArea: options.showArea || type === 'area',
                stack: options.stack === true || type === 'stackedBar',
                innerRadius: options.innerRadius || 42,
                opacity: options.opacity || 88,
                symbolSize: options.symbolSize || 12,
                borderRadius: options.borderRadius || 12,
                shadow: options.shadow || 18
            };
            return options.config ? { ...base, ...clone(options.config) } : base;
        },
        componentSize: function (type, width, height) { if (width && height) return { width, height }; return ({ card: { width: 280, height: 220 }, gauge: { width: 320, height: 320 }, table: { width: 560, height: 300 }, radar: { width: 360, height: 320 }, treemap: { width: 480, height: 340 }, funnel: { width: 420, height: 340 } })[type] || { width: 420, height: 320 }; },
        buildData: function (type, dataset, config) {
            if (!dataset?.rows?.length) return this.mockData(type);
            const limit = Math.max(0, Number(config.dataLimit) || 0);
            if (type === 'table') return dataset.rows.slice(0, limit || 8).map((row, index) => ({ name: row[config.xField] ?? `记录 ${index + 1}`, value: row[config.yField] ?? '-', status: row.状态 || row.status || '正常' }));
            if (type === 'card' || type === 'gauge') return [{ name: config.yField || '指标', value: dataset.rows.reduce((sum, row) => sum + (Number(row[config.yField]) || 0), 0) }];
            const map = new Map();
            dataset.rows.forEach((row, index) => { const name = row[config.xField] ?? `项 ${index + 1}`; const value = Number(row[config.yField]); map.set(name, (map.get(name) || 0) + (Number.isNaN(value) ? 1 : value)); });
            let series = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
            if (config.sortOrder === 'desc') series = series.sort((a, b) => b.value - a.value);
            if (config.sortOrder === 'asc') series = series.sort((a, b) => a.value - b.value);
            return series.slice(0, limit || (type === 'radar' ? 6 : 12));
        },
        addComponentToCanvas: function (type, x, y, title, options = {}) {
            const id = options.id || this.generateComponentId();
            const dataset = this.getDatasetByName(options.datasetName) || this.getActiveDataset();
            const config = this.buildConfig(type, title, dataset, options);
            const component = { id, type, config, data: options.data || this.buildData(type, dataset, config) };
            this.components.push(component);
            const size = this.componentSize(type, options.width, options.height);
            const wrapper = document.createElement('div');
            wrapper.className = 'chart-container';
            wrapper.id = `${id}_wrapper`;
            wrapper.style.left = `${x}px`;
            wrapper.style.top = `${y}px`;
            wrapper.style.width = `${size.width}px`;
            wrapper.style.height = `${size.height}px`;
            wrapper.style.zIndex = `${options.zIndex || ++this.zIndexCounter}`;
            wrapper.innerHTML = `<div class="component-topbar"><span class="drag-handle" title="拖动组件">⠿ 拖动</span><span class="component-badge">${this.getTypeLabel(type)}</span></div><div id="${id}" class="echart-box"></div><div class="resize-handle"></div><div class="delete-btn" onclick="App.deleteSingleComponent('${id}', event)">×</div>`;
            this.dom.dashboardCanvas.appendChild(wrapper);
            this.renderComponent(component);
            this.bringComponentToFront(id);
            if (!options.silent) { this.selectedComponentIds = [id]; this.updateSelectionUI(); this.syncDashboardMeta(); this.log(`已添加 ${this.getTypeLabel(type)}`); this.recordHistoryStep(`新增组件：${title || this.getTypeLabel(type)}`); }
            this.refreshCanvasViewport();
            return component;
        },
        renderComponent: function (component) { const wrapper = document.getElementById(`${component.id}_wrapper`); if (wrapper) this.paintWrapper(wrapper, component.config); if (window.ChartManager) ChartManager.renderChart(component.id, component.type, component.data, component.config); },
        paintWrapper: function (wrapper, config) { const shadow = Number(config.shadow) || 18; const radius = Number(config.borderRadius) || 12; wrapper.style.borderRadius = `${radius + 6}px`; wrapper.style.background = this.hexToRgba(config.background || '#0f1628', 0.84); wrapper.style.boxShadow = `0 ${Math.round(shadow * 0.9)}px ${shadow * 2}px rgba(4,8,18,0.32)`; },
        updateSelectionUI: function () {
            document.querySelectorAll('.chart-container').forEach(element => element.classList.remove('selected'));
            this.selectedComponentIds.forEach(id => { const element = document.getElementById(`${id}_wrapper`); if (element) { element.classList.add('selected'); this.bringComponentToFront(id); } });
            const component = this.selectedComponentIds.length === 1 ? this.components.find(item => item.id === this.selectedComponentIds[0]) : null;
            this.dom.globalConfigMsg.style.display = component ? 'none' : 'block';
            this.dom.componentConfigForm.style.display = component ? 'block' : 'none';
            this.dom.deleteSelectedBtn.style.display = this.selectedComponentIds.length ? 'inline-flex' : 'none';
            if (component) this.populateConfigForm(component);
            if (component) {
                this.rightSidebarCollapsedManually = false;
                this.rightSidebarInitializedHidden = false;
            }
            this.syncCanvasFocusClasses();
            this.refreshCanvasViewport();
        },
        populateConfigForm: function (component) {
            this.dom.configTypeTitle.innerText = `配置项（${this.getTypeLabel(component.type)}）`;
            this.fillSelect(this.dom.configDataset, this.datasets.map(dataset => ({ value: dataset.name, label: dataset.name })), component.config.datasetName);
            this.populateMappingFields(component.config.datasetName, component.config.xField, component.config.yField);
            ['Title','Subtitle','XAxisName','YAxisName'].forEach(key => { this.dom[`config${key}`].value = component.config[key.charAt(0).toLowerCase() + key.slice(1)] || ''; });
            this.dom.configColor.value = component.config.color || '#7c5cff';
            this.dom.configSecondaryColor.value = component.config.secondaryColor || '#20c5ff';
            this.dom.configAccentColor.value = component.config.accentColor || '#ff8a3d';
            this.dom.configBackground.value = component.config.background || '#0f1628';
            this.dom.configXRotate.value = component.config.xLabelRotate || 0;
            this.dom.configGranularity.value = component.config.granularity || 0;
            this.dom.configYMin.value = component.config.yMin ?? '';
            this.dom.configYMax.value = component.config.yMax ?? '';
            this.dom.configLegendPosition.value = component.config.legendPosition || 'top';
            this.dom.configLabelPosition.value = component.config.labelPosition || 'auto';
            this.dom.configSortOrder.value = component.config.sortOrder || 'none';
            this.dom.configDataLimit.value = component.config.dataLimit ?? (component.type === 'radar' ? 6 : 12);
            this.dom.configShowLegend.checked = component.config.showLegend !== false;
            this.dom.configShowGrid.checked = component.config.showGrid !== false;
            this.dom.configShowLabel.checked = component.config.showLabel === true;
            this.dom.configSmooth.checked = component.config.smooth === true;
            this.dom.configShowArea.checked = component.config.showArea === true;
            this.dom.configStack.checked = component.config.stack === true || component.type === 'stackedBar';
            this.dom.configInnerRadius.value = component.config.innerRadius || 42;
            this.dom.configOpacity.value = component.config.opacity || 88;
            this.dom.configSymbolSize.value = component.config.symbolSize || 12;
            this.dom.configBorderRadius.value = component.config.borderRadius || 12;
            this.dom.configShadow.value = component.config.shadow || 18;
            const wrapper = document.getElementById(`${component.id}_wrapper`);
            this.dom.configWidth.value = parseInt(wrapper?.style.width, 10) || 420;
            this.dom.configHeight.value = parseInt(wrapper?.style.height, 10) || 320;
        },
        populateMappingFields: function (datasetName, selectedX, selectedY) {
            const dataset = this.getDatasetByName(datasetName) || this.getActiveDataset();
            const fields = this.getDatasetFieldNames(dataset);
            const numerics = this.getNumericFields(dataset);
            this.fillSelect(this.dom.configXField, fields.map(field => ({ value: field, label: field })), selectedX || fields[0] || '');
            this.fillSelect(this.dom.configYField, (numerics.length ? numerics : fields).map(field => ({ value: field, label: field })), selectedY || numerics[0] || fields[0] || '');
        },
        fillSelect: function (select, options, selected) { select.innerHTML = options.length ? options.map(option => `<option value="${this.escapeAttr(option.value)}">${this.escapeHtml(option.label)}</option>`).join('') : '<option value="">无可用项</option>'; select.value = options.some(option => option.value === selected) ? selected : (options[0]?.value || ''); },
        scheduleConfigApply: function () {
            if (this.selectedComponentIds.length !== 1) return;
            clearTimeout(this.configApplyTimer);
            this.configApplyTimer = setTimeout(() => this.applyConfig({ silentToast: true, silentHistory: true }), 90);
        },
        applyConfig: function (options = {}) {
            if (this.selectedComponentIds.length !== 1) return;
            const component = this.components.find(item => item.id === this.selectedComponentIds[0]);
            if (!component) return;
            const wrapper = document.getElementById(`${component.id}_wrapper`);
            Object.assign(component.config, {
                title: this.dom.configTitle.value.trim() || this.getTypeLabel(component.type),
                subtitle: this.dom.configSubtitle.value.trim(),
                datasetName: this.dom.configDataset.value || '',
                xField: this.dom.configXField.value || '',
                yField: this.dom.configYField.value || '',
                xAxisName: this.dom.configXAxisName.value.trim(),
                yAxisName: this.dom.configYAxisName.value.trim(),
                color: this.dom.configColor.value,
                secondaryColor: this.dom.configSecondaryColor.value,
                accentColor: this.dom.configAccentColor.value,
                background: this.dom.configBackground.value,
                xLabelRotate: Number(this.dom.configXRotate.value) || 0,
                granularity: Number(this.dom.configGranularity.value) || 0,
                yMin: this.dom.configYMin.value,
                yMax: this.dom.configYMax.value,
                legendPosition: this.dom.configLegendPosition.value || 'top',
                labelPosition: this.dom.configLabelPosition.value || 'auto',
                sortOrder: this.dom.configSortOrder.value || 'none',
                dataLimit: Number(this.dom.configDataLimit.value) || 0,
                showLegend: this.dom.configShowLegend.checked,
                showGrid: this.dom.configShowGrid.checked,
                showLabel: this.dom.configShowLabel.checked,
                smooth: this.dom.configSmooth.checked,
                showArea: this.dom.configShowArea.checked,
                stack: this.dom.configStack.checked,
                innerRadius: Number(this.dom.configInnerRadius.value) || 42,
                opacity: Number(this.dom.configOpacity.value) || 88,
                symbolSize: Number(this.dom.configSymbolSize.value) || 12,
                borderRadius: Number(this.dom.configBorderRadius.value) || 12,
                shadow: Number(this.dom.configShadow.value) || 18
            });
            if (wrapper) { wrapper.style.width = `${Math.max(240, Number(this.dom.configWidth.value) || 420)}px`; wrapper.style.height = `${Math.max(180, Number(this.dom.configHeight.value) || 320)}px`; }
            component.data = this.buildData(component.type, this.getDatasetByName(component.config.datasetName), component.config);
            this.renderComponent(component);
            this.syncDashboardMeta();
            this.refreshCanvasViewport();
            if (!options.silentHistory) this.recordHistoryStep(`更新组件：${component.config.title || this.getTypeLabel(component.type)}`);
            if (!options.silentToast) this.showToast('组件配置已更新');
        },
        deleteSingleComponent: function (id, event) { if (event) event.stopPropagation(); const component = this.components.find(item => item.id === id); this.removeComponent(id); this.selectedComponentIds = this.selectedComponentIds.filter(item => item !== id); this.updateSelectionUI(); this.syncDashboardMeta(); this.recordHistoryStep(`删除组件：${component?.config?.title || id}`); },
        deleteSelectedComponents: function () { if (!this.selectedComponentIds.length) return; const titles = this.components.filter(item => this.selectedComponentIds.includes(item.id)).map(item => item.config.title || item.id); this.selectedComponentIds.forEach(id => this.removeComponent(id)); this.selectedComponentIds = []; this.updateSelectionUI(); this.syncDashboardMeta(); this.recordHistoryStep(`删除组件：${titles.join('、')}`); },
        removeComponent: function (id) { const wrapper = document.getElementById(`${id}_wrapper`); if (wrapper) wrapper.remove(); this.components = this.components.filter(item => item.id !== id); if (window.ChartManager) ChartManager.destroyChart(id); this.refreshCanvasViewport(); },
        bringComponentToFront: function (id) { const wrapper = document.getElementById(`${id}_wrapper`); if (wrapper) wrapper.style.zIndex = `${++this.zIndexCounter}`; },
        resetCanvas: function () { this.components.forEach(item => window.ChartManager && ChartManager.destroyChart(item.id)); this.components = []; this.selectedComponentIds = []; this.zIndexCounter = 20; this.dom.dashboardCanvas.innerHTML = ''; },
        getLayout: function (id) { const wrapper = document.getElementById(`${id}_wrapper`); return wrapper ? { left: parseInt(wrapper.style.left, 10) || 20, top: parseInt(wrapper.style.top, 10) || 20, width: parseInt(wrapper.style.width, 10) || 420, height: parseInt(wrapper.style.height, 10) || 320, zIndex: parseInt(wrapper.style.zIndex, 10) || 1 } : { left: 20, top: 20, width: 420, height: 320, zIndex: 1 }; },
        serializeDashboardState: function () { return { version: 5, settings: { theme: this.dom.themeSelect.value, canvas: this.dom.backgroundColorInput.value, description: this.dom.globalBoardDescription.value }, zIndexCounter: this.zIndexCounter, components: this.components.map(item => ({ id: item.id, type: item.type, data: item.data, config: item.config, layout: this.getLayout(item.id) })) }; },
        applySerializedState: function (state) { this.resetCanvas(); if (state.settings?.theme) this.dom.themeSelect.value = state.settings.theme; if (state.settings?.canvas) this.dom.backgroundColorInput.value = state.settings.canvas; if (state.settings?.description !== undefined) this.dom.globalBoardDescription.value = state.settings.description; this.applyTheme(this.dom.themeSelect.value); this.applyCanvasBackground(this.dom.backgroundColorInput.value); (state.components || []).forEach(item => this.addComponentToCanvas(item.type, item.layout?.left ?? 20, item.layout?.top ?? 20, item.config?.title || this.getTypeLabel(item.type), { data: item.data, config: item.config, datasetName: item.config?.datasetName, width: item.layout?.width, height: item.layout?.height, zIndex: item.layout?.zIndex, silent: true })); this.zIndexCounter = state.zIndexCounter || this.zIndexCounter; this.syncDashboardMeta(); this.refreshCanvasViewport(); },
        saveDashboard: function () { const board = this.getDashboard(); if (!board) return; localStorage.setItem(this.keyForBoard(this.getProject().id, board.id), JSON.stringify(this.serializeDashboardState())); board.updatedAt = new Date().toISOString(); this.renderWorkspace(); this.saveMeta(); this.showToast('看板已保存'); this.log(`已保存看板：${board.name}`); },
        exportDashboard: function () { const board = this.getDashboard(); this.downloadText(`${(board?.name || 'dashboard').replace(/\s+/g, '_')}.json`, JSON.stringify(this.serializeDashboardState(), null, 2)); this.log('看板已导出'); },
        shareDashboard: async function () { const share = `${window.location.href.split('#')[0]}#dashboard=${btoa(unescape(encodeURIComponent(JSON.stringify(this.serializeDashboardState()))))}`; try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(share); this.showToast('分享链接已复制'); } else { window.prompt('请复制分享链接', share); } this.log('分享链接已生成'); } catch (error) { window.prompt('复制失败，请手动复制', share); } },
        loadEnterpriseTemplate: function () { if (this.components.length && !window.confirm('加载企业模板会替换当前画布内容，是否继续？')) return; this.applySeed('exec'); this.showToast('企业模板已加载'); this.syncDashboardMeta(); this.refreshCanvasViewport(); this.recordHistoryStep('加载企业模板'); },
        setAiBusy: function (busy) {
            this.aiBusy = busy === true;
            if (this.dom.agentSendBtn) {
                this.dom.agentSendBtn.disabled = this.aiBusy;
                this.dom.agentSendBtn.innerText = this.aiBusy ? 'AI 处理中...' : '生成';
            }
        },
        buildAiSnapshot: function () {
            const datasetSummaries = (this.datasets || []).map((dataset) => ({
                name: dataset.name,
                rowCount: dataset.rows?.length || 0,
                fields: this.getDatasetFieldNames(dataset).slice(0, 12),
                numericFields: this.getNumericFields(dataset).slice(0, 12)
            }));
            return {
                projectName: this.getProject()?.name || '',
                dashboardName: this.getDashboard()?.name || '',
                activeDatasetName: this.getActiveDataset()?.name || '',
                layoutMode: this.currentAutoLayoutMode,
                selectedComponentIds: [...this.selectedComponentIds],
                datasets: datasetSummaries,
                components: this.components.map((component) => ({
                    id: component.id,
                    type: component.type,
                    title: component.config.title || '',
                    subtitle: component.config.subtitle || '',
                    datasetName: component.config.datasetName || '',
                    xField: component.config.xField || '',
                    yField: component.config.yField || '',
                    layout: this.getLayout(component.id)
                }))
            };
        },
        getNextAiPlacement: function (type) {
            if (!this.components.length) return { left: 24, top: 24 };
            const layout = this.components
                .map((item) => ({ item, layout: this.getLayout(item.id) }))
                .sort((a, b) => (a.layout.top - b.layout.top) || (a.layout.left - b.layout.left));
            const last = layout[layout.length - 1];
            const nextSize = this.componentSize(type);
            const canvasWidth = Math.max(760, (this.dom.dashboardCanvas?.clientWidth || 1320) - 36);
            let left = last.layout.left + last.layout.width + 18;
            let top = last.layout.top;
            if (left + nextSize.width > canvasWidth) {
                left = 24;
                top = Math.max(...layout.map(item => item.layout.top + item.layout.height)) + 18;
            }
            return { left, top };
        },
        resolveComponentMatches: function (match = {}) {
            let resolved = [...this.components];
            if (match.scope === 'selected') {
                resolved = this.components.filter(component => this.selectedComponentIds.includes(component.id));
            } else if (match.scope === 'all') {
                resolved = [...this.components];
            }
            if (match.id) resolved = resolved.filter(component => component.id === match.id);
            if (match.titleIncludes) resolved = resolved.filter(component => (component.config.title || '').includes(match.titleIncludes));
            if (match.type) resolved = resolved.filter(component => component.type === match.type);
            if (!match.allMatches && resolved.length > 1) return resolved.slice(0, 1);
            return resolved;
        },
        applyAiComponentChanges: function (component, changes = {}) {
            if (!component) return;
            const wrapper = document.getElementById(`${component.id}_wrapper`);
            if (!wrapper) return;

            if (changes.chartType && changes.chartType !== component.type) component.type = changes.chartType;

            const fields = ['title', 'subtitle', 'datasetName', 'xField', 'yField', 'xAxisName', 'yAxisName', 'color', 'secondaryColor', 'accentColor', 'background', 'legendPosition', 'labelPosition', 'sortOrder'];
            fields.forEach((key) => {
                if (changes[key] !== undefined && changes[key] !== '') component.config[key] = changes[key];
            });

            const numericFields = ['xLabelRotate', 'granularity', 'dataLimit', 'innerRadius', 'opacity', 'symbolSize', 'borderRadius', 'shadow'];
            numericFields.forEach((key) => {
                if (Number(changes[key])) component.config[key] = Number(changes[key]);
            });

            if (changes.yMin !== undefined && changes.yMin !== '') component.config.yMin = changes.yMin;
            if (changes.yMax !== undefined && changes.yMax !== '') component.config.yMax = changes.yMax;
            ['showLegend', 'showGrid', 'showLabel', 'smooth', 'showArea', 'stack'].forEach((key) => {
                if (typeof changes[key] === 'boolean') component.config[key] = changes[key];
            });

            if (changes.width > 0) wrapper.style.width = `${Math.max(240, changes.width)}px`;
            if (changes.height > 0) wrapper.style.height = `${Math.max(180, changes.height)}px`;
            if (changes.left > 0 || changes.left === 0) wrapper.style.left = `${Math.max(0, changes.left)}px`;
            if (changes.top > 0 || changes.top === 0) wrapper.style.top = `${Math.max(0, changes.top)}px`;

            const dataset = this.getDatasetByName(component.config.datasetName) || this.getActiveDataset();
            component.data = this.buildData(component.type, dataset, component.config);
            this.renderComponent(component);
        },
        executeAiPlan: function (plan) {
            const operations = Array.isArray(plan?.operations) ? plan.operations : [];
            let latestMessage = plan?.summary || '';

            operations.forEach((operation) => {
                if (!operation || !operation.action) return;
                if (operation.action === 'set_theme' && operation.themeName && THEMES[operation.themeName]) {
                    this.dom.themeSelect.value = operation.themeName;
                    this.applyTheme(operation.themeName);
                    this.dom.backgroundColorInput.value = THEMES[operation.themeName].canvas;
                    this.applyCanvasBackground(this.dom.backgroundColorInput.value);
                }
                if (operation.action === 'auto_arrange') {
                    const mode = operation.mode === 'presentation' ? 'presentation' : 'compact';
                    this.setAutoLayoutMode(mode);
                    this.autoArrange(mode, { silentHistory: true });
                }
                if (operation.action === 'add_component' && operation.component?.type) {
                    const position = this.getNextAiPlacement(operation.component.type);
                    this.addComponentToCanvas(
                        operation.component.type,
                        operation.component.left > 0 || operation.component.left === 0 ? operation.component.left : position.left,
                        operation.component.top > 0 || operation.component.top === 0 ? operation.component.top : position.top,
                        operation.component.title || this.getTypeLabel(operation.component.type),
                        {
                            silent: true,
                            subtitle: operation.component.subtitle,
                            datasetName: operation.component.datasetName,
                            xField: operation.component.xField,
                            yField: operation.component.yField,
                            xAxisName: operation.component.xAxisName,
                            yAxisName: operation.component.yAxisName,
                            color: operation.component.color || undefined,
                            secondaryColor: operation.component.secondaryColor || undefined,
                            accentColor: operation.component.accentColor || undefined,
                            background: operation.component.background || undefined,
                            width: operation.component.width || undefined,
                            height: operation.component.height || undefined
                        }
                    );
                }
                if (operation.action === 'delete_component') {
                    this.resolveComponentMatches(operation.match).forEach(component => this.removeComponent(component.id));
                }
                if (operation.action === 'select_component') {
                    this.selectedComponentIds = this.resolveComponentMatches(operation.match).map(component => component.id);
                }
                if (operation.action === 'update_component') {
                    this.resolveComponentMatches(operation.match).forEach(component => this.applyAiComponentChanges(component, operation.changes));
                }
                if (operation.action === 'reply_only' && operation.message) latestMessage = operation.message;
                if (operation.message) latestMessage = operation.message;
            });

            this.syncDashboardMeta();
            this.updateSelectionUI();
            this.saveMeta();
            this.refreshCanvasViewport();
            this.recordHistoryStep(`AI 操作：${plan?.summary || latestMessage || '更新看板'}`);
            if (latestMessage) this.log(`AI：${latestMessage}`);
            return latestMessage;
        },
        handleAgentRequest: async function () {
            const prompt = this.dom.agentInput.value.trim();
            if (!prompt || this.aiBusy) return;

            this.handleAiSettingsInput();
            this.setAiBusy(true);
            this.log(`AI 正在分析指令：“${prompt}”`);

            try {
                const snapshot = this.buildAiSnapshot();
                let plan;
                if (this.aiSettings.apiKey && window.AIAgent?.requestPlan) {
                    plan = await AIAgent.requestPlan({
                        prompt,
                        snapshot,
                        apiKey: this.aiSettings.apiKey,
                        model: this.aiSettings.model,
                        baseUrl: this.aiSettings.baseUrl
                    });
                } else if (window.AIAgent?.buildLocalPlan) {
                    plan = AIAgent.buildLocalPlan(prompt, snapshot);
                    this.showToast('未检测到 API Key，已切换本地快速模式');
                } else {
                    throw new Error('AI 副驾驶未正确加载');
                }

                const message = this.executeAiPlan(plan);
                this.dom.agentInput.value = '';
                this.showToast(message || plan.summary || 'AI 操作已执行');
            } catch (error) {
                const message = error?.message || 'AI 执行失败';
                this.showToast(message);
                this.log(`AI 错误：${message}`);
            } finally {
                this.setAiBusy(false);
            }
        },
        getAutoArrangeGroup: function (type) {
            return ({
                bar: '01-柱状图',
                stackedBar: '01-柱状图',
                horizontalBar: '01-柱状图',
                line: '02-趋势图',
                area: '02-趋势图',
                scatter: '02-趋势图',
                radar: '03-分析图',
                funnel: '03-分析图',
                treemap: '03-分析图',
                pie: '04-结构图',
                doughnut: '04-结构图',
                rose: '04-结构图',
                gauge: '05-指标图',
                card: '06-指标卡',
                table: '07-数据表'
            })[type] || `99-${type}`;
        },
        autoArrange: function (mode = this.currentAutoLayoutMode, options = {}) {
            const canvas = this.dom.dashboardCanvas;
            const ordered = this.components
                .map(component => ({ component, wrapper: document.getElementById(`${component.id}_wrapper`) }))
                .filter(item => item.wrapper)
                .sort((a, b) => {
                    const topA = parseInt(a.wrapper.style.top, 10) || 0;
                    const topB = parseInt(b.wrapper.style.top, 10) || 0;
                    const leftA = parseInt(a.wrapper.style.left, 10) || 0;
                    const leftB = parseInt(b.wrapper.style.left, 10) || 0;
                    return topA - topB || leftA - leftB;
                });
            if (!ordered.length) return;

            const normalizedMode = mode === 'presentation' ? 'presentation' : (mode === 'custom' ? 'custom' : 'compact');
            this.setAutoLayoutMode(normalizedMode);
            if (normalizedMode === 'custom') {
                if (!options.silentHistory) this.recordHistoryStep('切换布局模式：自定义布局');
                return;
            }
            const availableWidth = Math.max(720, (canvas?.clientWidth || 1320) - 40);
            const grouped = ordered.reduce((map, item) => {
                const groupKey = this.getAutoArrangeGroup(item.component.type);
                if (!map[groupKey]) map[groupKey] = [];
                map[groupKey].push(item);
                return map;
            }, {});
            const padding = 18;
            const gap = normalizedMode === 'presentation' ? 20 : 16;
            const totalColumns = 12;
            const columnWidth = Math.max(48, Math.floor((availableWidth - gap * (totalColumns - 1)) / totalColumns));
            const spanMap = normalizedMode === 'presentation'
                ? { card: 6, gauge: 6, table: 12, line: 6, area: 6, bar: 6, stackedBar: 6, horizontalBar: 6, pie: 6, doughnut: 6, rose: 6, scatter: 6, radar: 6, funnel: 6, treemap: 6 }
                : { card: 3, gauge: 4, table: 12, line: 4, area: 4, bar: 4, stackedBar: 4, horizontalBar: 4, pie: 4, doughnut: 4, rose: 4, scatter: 4, radar: 4, funnel: 4, treemap: 4 };
            const heightMap = normalizedMode === 'presentation'
                ? { card: 220, gauge: 320, table: 360, pie: 340, doughnut: 340, rose: 340, line: 360, area: 360, bar: 360, stackedBar: 360, horizontalBar: 360, scatter: 360, radar: 360, funnel: 360, treemap: 360 }
                : { card: 190, gauge: 260, table: 300, pie: 280, doughnut: 280, rose: 280, line: 280, area: 280, bar: 280, stackedBar: 280, horizontalBar: 280, scatter: 280, radar: 280, funnel: 280, treemap: 280 };

            let y = padding;
            Object.keys(grouped).sort().forEach((groupKey) => {
                let cursor = 0;
                let rowHeight = 0;
                grouped[groupKey].forEach(({ component, wrapper }) => {
                    const span = spanMap[component.type] || (normalizedMode === 'presentation' ? 6 : 4);
                    if (cursor + span > totalColumns) {
                        cursor = 0;
                        y += rowHeight + gap;
                        rowHeight = 0;
                    }
                    const width = Math.max(240, columnWidth * span + gap * (span - 1));
                    const height = heightMap[component.type] || (normalizedMode === 'presentation' ? 360 : 280);
                    wrapper.style.left = `${padding + cursor * (columnWidth + gap)}px`;
                    wrapper.style.top = `${y}px`;
                    wrapper.style.width = `${width}px`;
                    wrapper.style.height = `${height}px`;
                    cursor += span;
                    rowHeight = Math.max(rowHeight, height);
                });
                y += rowHeight + gap + 8;
            });

            this.refreshCanvasViewport();
            if (!options.silentHistory) this.recordHistoryStep(`自动排布：${this.getAutoLayoutModeLabel(normalizedMode)}`);
        },
        clearSearchHistory: function () { this.searchHistory = []; this.saveMeta(); this.renderSearchHistory(); },
        renderSearchHistory: function () { this.dom.searchHistoryList.innerHTML = this.searchHistory.length ? this.searchHistory.slice(0, 10).map(item => `<button class="search-history-item" type="button" data-history-value="${this.escapeAttr(item)}">${this.escapeHtml(item)}</button>`).join('') : '<div class="search-history-item">暂无搜索历史，直接输入关键字即可。</div>'; },
        pushSearchHistory: function (text) { const clean = text.trim(); if (!clean) return; this.searchHistory = [clean, ...this.searchHistory.filter(item => item !== clean)].slice(0, 10); this.saveMeta(); this.renderSearchHistory(); },
        handleGlobalSearch: function (value) { const keyword = (value ?? this.dom.globalSearch.value).trim().toLowerCase(); this.clearSearchHighlights(); if (!keyword) return this.log('已清空搜索关键字'); this.pushSearchHistory(keyword); let count = 0; document.querySelectorAll('.drag-item, .dataset-pill, .dashboard-row, .workspace-folder-head').forEach(element => { const text = (element.innerText || element.textContent || '').toLowerCase(); if (text.includes(keyword)) { element.classList.add('search-hit'); count += 1; } }); this.components.forEach(component => { const text = `${component.config.title} ${component.config.subtitle || ''} ${component.config.datasetName || ''} ${this.getTypeLabel(component.type)}`.toLowerCase(); if (text.includes(keyword)) { const wrapper = document.getElementById(`${component.id}_wrapper`); if (wrapper) { wrapper.classList.add('search-hit'); this.bringComponentToFront(component.id); count += 1; } } }); this.log(count ? `搜索完成，共命中 ${count} 项` : '未搜索到匹配内容'); },
        clearSearchHighlights: function () { document.querySelectorAll('.search-hit').forEach(element => element.classList.remove('search-hit')); },
        applyTheme: function (themeName) { const theme = THEMES[themeName] || THEMES['星云流光']; const root = document.documentElement; root.style.setProperty('--primary', theme.primary); root.style.setProperty('--secondary', theme.secondary); root.style.setProperty('--accent', theme.accent); if (!this.dom.backgroundColorInput.value) this.dom.backgroundColorInput.value = theme.canvas; this.applyCanvasBackground(this.dom.backgroundColorInput.value || theme.canvas); },
        applyCanvasBackground: function (color) { const tint = this.hexToRgba(color, 0.88); const glow = this.hexToRgba(color, 0.38); this.dom.dashboardCanvas.style.background = `radial-gradient(circle at top left, ${glow}, transparent 26%),radial-gradient(circle at bottom right, rgba(32,197,255,0.12), transparent 28%),linear-gradient(135deg, rgba(255,255,255,0.04), transparent 50%),linear-gradient(180deg, ${tint}, rgba(7,13,25,0.96))`; },
        toggleSettingsPanel: function (forceVisible) {
            const shouldShow = typeof forceVisible === 'boolean'
                ? forceVisible
                : !this.shouldShowRightSidebar();
            this.toggleRightSidebar(shouldShow, { manual: true });
        },
        showProfileSummary: function () { const board = this.getDashboard(); window.alert(`当前账号：管理员\n当前项目：${this.getProject()?.name || '-'}\n当前看板：${board?.name || '-'}\n画布组件数：${this.components.length}\n历史模板数：${this.templates.length}`); },
        importDatasetFiles: async function (fileList) { const files = Array.from(fileList || []); if (!files.length) return; const imported = await Promise.all(files.map(file => this.buildDatasetFromFile(file))); this.getProject().datasets = [...imported, ...this.getProject().datasets]; this.datasets = this.getProject().datasets; this.selectedDatasetIndex = 0; this.renderDatasets(); this.saveMeta(); this.recordHistoryStep(`导入数据集：${files.length} 个文件`); this.showToast(`已导入 ${files.length} 个数据文件`); this.dom.dataFileInput.value = ''; },
        buildDatasetFromFile: async function (file) { const name = file.name.toLowerCase(); if (name.endsWith('.csv')) return { name: file.name, status: 'ready', rows: this.parseCsv(await this.readText(file)) }; if (name.endsWith('.json')) return { name: file.name, status: 'ready', rows: this.parseJson(await this.readText(file)) }; return { name: file.name, status: 'warning', rows: [] }; },
        readText: function (file) { if (typeof file.text === 'function') return file.text(); return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(reader.error); reader.readAsText(file, 'utf8'); }); },
        parseCsv: function (text) { const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).map(line => line.trim()).filter(Boolean); if (lines.length < 2) return []; const headers = this.splitCsv(lines[0]); return lines.slice(1).map(line => { const cells = this.splitCsv(line); return headers.reduce((row, header, index) => { const cell = cells[index] ?? ''; const numeric = Number(cell); row[header] = cell !== '' && !Number.isNaN(numeric) ? numeric : cell; return row; }, {}); }); },
        splitCsv: function (line) { const result = []; let current = ''; let inQuotes = false; for (let i = 0; i < line.length; i += 1) { const char = line[i]; const next = line[i + 1]; if (char === '"' && inQuotes && next === '"') { current += '"'; i += 1; continue; } if (char === '"') { inQuotes = !inQuotes; continue; } if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; } current += char; } result.push(current.trim()); return result; },
        parseJson: function (text) { try { const parsed = JSON.parse(text); return Array.isArray(parsed) ? parsed : (Array.isArray(parsed.data) ? parsed.data : []); } catch (error) { return []; } },
        getDatasetFieldNames: function (dataset) { return dataset?.rows?.length ? Object.keys(dataset.rows[0]) : []; },
        getNumericFields: function (dataset) { return this.getDatasetFieldNames(dataset).filter(field => this.isNumeric(dataset.rows, field)); },
        isNumeric: function (rows, field) { const values = rows.map(row => row[field]).filter(value => value !== '' && value !== null && value !== undefined); if (!values.length) return false; return values.filter(value => !Number.isNaN(Number(value))).length / values.length >= 0.6; },
        mockData: function (type) { if (type === 'card' || type === 'gauge') return [{ name: '总计', value: 807 }]; if (type === 'table') return [{ name: '示例记录 A', value: 128, status: '正常' }, { name: '示例记录 B', value: 96, status: '关注' }]; if (type === 'pie' || type === 'doughnut') return [{ name: '华东', value: 35 }, { name: '华南', value: 28 }, { name: '华北', value: 22 }, { name: '西南', value: 15 }]; return [{ name: '1月', value: 120 }, { name: '2月', value: 132 }, { name: '3月', value: 101 }, { name: '4月', value: 134 }, { name: '5月', value: 90 }, { name: '6月', value: 230 }]; },
        generateComponentId: function () { this.componentSequence += 1; return `chart_${Date.now()}_${this.componentSequence}`; },
        uid: function (prefix) { return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`; },
        showToast: function (message) { const toast = document.createElement('div'); toast.className = 'toast'; toast.innerText = message; this.dom.toastContainer.appendChild(toast); setTimeout(() => { toast.classList.add('toast-leave'); setTimeout(() => toast.remove(), 220); }, 2200); },
        log: function (message) { this.dom.systemLog.innerText = `📝 ${message}`; },
        downloadText: function (fileName, content) { const blob = new Blob([content], { type: 'application/json;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = fileName; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); },
        safeParse: function (text) { try { return text ? JSON.parse(text) : null; } catch (error) { return null; } },
        escapeHtml: function (value) { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); },
        escapeAttr: function (value) { return this.escapeHtml(value).replace(/`/g, '&#96;'); },
        hexToRgba: function (hex, alpha) { const safe = String(hex || '#0f1628').replace('#', ''); const full = safe.length === 3 ? safe.split('').map(item => item + item).join('') : safe.padEnd(6, '0').slice(0, 6); const value = parseInt(full, 16); return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`; }
    });
})();
