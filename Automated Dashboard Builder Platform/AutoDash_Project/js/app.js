/**
 * 模块：主逻辑与 UI 控制器
 */
const App = {
    components: [],
    selectedComponentIds: [],
    selectedDatasetIndex: null,
    currentProjectIndex: 0,
    settingsPanelVisible: true,
    componentSequence: 0,
    storagePrefix: 'autodash.dashboard.',
    themePresets: {
        '科技蓝调 (默认)': {
            primary: '#1677ff',
            primaryHover: '#4096ff',
            bgDark: '#001529',
            bgLight: '#f0f2f5',
            panel: '#ffffff'
        },
        '极简商务': {
            primary: '#3f8600',
            primaryHover: '#52c41a',
            bgDark: '#262626',
            bgLight: '#f7f7f7',
            panel: '#ffffff'
        }
    },
    projects: [
        {
            name: '销售数据分析',
            datasets: [
                { name: '2026_Q1_Sales.csv', status: 'ready' },
                { name: 'User_Behavior.json', status: 'warning' }
            ]
        },
        {
            name: '运营指标总览',
            datasets: [
                { name: 'Operations_Daily.xlsx', status: 'ready' },
                { name: 'Customer_Service.json', status: 'warning' }
            ]
        },
        {
            name: '客户增长看板',
            datasets: [
                { name: 'Leads_2026.csv', status: 'ready' },
                { name: 'Retention_Cohort.xlsx', status: 'ready' }
            ]
        }
    ],
    datasets: [],

    init: function() {
        this.cacheDom();
        this.datasets = this.cloneProjectDatasets(this.currentProjectIndex);
        this.syncProjectLabel();
        this.renderDatasetList();
        this.bindUIEvents();
        this.applyTheme(this.dom.themeSelect.value);
        this.applyCanvasBackground(this.dom.backgroundColorInput.value);
        this.toggleSettingsPanel(true);

        if (window.DragLayout) DragLayout.init();

        if (this.restoreInitialState()) {
            this.showToast('已恢复最近一次看板状态');
        } else {
            this.log('系统初始化完成。画布已就绪。');
        }
    },

    cacheDom: function() {
        this.dom = {
            projectSelector: document.getElementById('projectSelector'),
            globalSearch: document.getElementById('globalSearch'),
            saveDashboardBtn: document.getElementById('saveDashboardBtn'),
            exportDashboardBtn: document.getElementById('exportDashboardBtn'),
            shareDashboardBtn: document.getElementById('shareDashboardBtn'),
            settingsToggleBtn: document.getElementById('settingsToggleBtn'),
            userProfileBtn: document.getElementById('userProfileBtn'),
            deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
            dataImportBtn: document.getElementById('dataImportBtn'),
            dataFileInput: document.getElementById('dataFileInput'),
            datasetList: document.getElementById('datasetList'),
            templateLoadBtn: document.getElementById('templateLoadBtn'),
            themeSelect: document.getElementById('themeSelect'),
            backgroundColorInput: document.getElementById('backgroundColorInput'),
            applyConfigBtn: document.getElementById('applyConfigBtn'),
            configTypeTitle: document.getElementById('configTypeTitle'),
            configTitle: document.getElementById('configTitle'),
            configColor: document.getElementById('configColor'),
            globalConfigMsg: document.getElementById('globalConfigMsg'),
            componentConfigForm: document.getElementById('componentConfigForm'),
            agentInput: document.getElementById('agentInput'),
            agentSendBtn: document.getElementById('agentSendBtn'),
            systemLog: document.getElementById('systemLog'),
            dashboardCanvas: document.getElementById('dashboardCanvas'),
            toastContainer: document.getElementById('toastContainer')
        };
    },

    bindUIEvents: function() {
        document.querySelectorAll('.left-sidebar .tab').forEach(tab => {
            tab.addEventListener('click', (event) => {
                document.querySelectorAll('.left-sidebar .tab').forEach(item => item.classList.remove('active'));
                document.querySelectorAll('.left-sidebar .sidebar-panel').forEach(panel => panel.classList.remove('active'));
                event.currentTarget.classList.add('active');
                document.getElementById(event.currentTarget.dataset.target).classList.add('active');
            });
        });

        document.querySelectorAll('.drag-item').forEach(item => {
            item.addEventListener('click', (event) => {
                const target = event.currentTarget;
                const type = target.getAttribute('data-type');
                const text = (target.innerText || target.textContent || '').trim();
                const title = text.substring(text.indexOf(' ') + 1) || this.getTypeLabel(type);
                const offset = (this.components.length % 5) * 14;
                this.addComponentToCanvas(type, 20 + offset, 20 + offset, title);
                this.showToast(`已插入${title}`);
            });
        });

        this.dom.applyConfigBtn.addEventListener('click', () => this.applyConfig());
        this.dom.deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedComponents());

        document.addEventListener('keydown', (event) => {
            const tagName = event.target.tagName;
            const isEditable = tagName === 'INPUT' || tagName === 'TEXTAREA' || event.target.isContentEditable;
            if ((event.key === 'Delete' || event.key === 'Backspace') && !isEditable) {
                this.deleteSelectedComponents();
            }
        });

        this.dom.agentSendBtn.addEventListener('click', () => this.handleAgentRequest());
        this.dom.agentInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') this.handleAgentRequest();
        });

        this.dom.saveDashboardBtn.addEventListener('click', () => this.saveDashboard());
        this.dom.exportDashboardBtn.addEventListener('click', () => this.exportDashboard());
        this.dom.shareDashboardBtn.addEventListener('click', () => this.shareDashboard());
        this.dom.settingsToggleBtn.addEventListener('click', () => this.toggleSettingsPanel());
        this.dom.projectSelector.addEventListener('click', () => this.cycleProject());
        this.dom.userProfileBtn.addEventListener('click', () => this.showProfileSummary());

        this.dom.dataImportBtn.addEventListener('click', () => this.dom.dataFileInput.click());
        this.dom.dataFileInput.addEventListener('change', (event) => this.importDatasetFiles(event.target.files));
        this.dom.datasetList.addEventListener('click', (event) => {
            const item = event.target.closest('.data-item');
            if (!item) return;
            this.selectDataset(Number(item.dataset.index));
        });

        this.dom.templateLoadBtn.addEventListener('click', () => this.loadEnterpriseTemplate());

        this.dom.themeSelect.addEventListener('change', (event) => {
            this.applyTheme(event.target.value);
            this.log(`已切换主题：${event.target.value}`);
        });

        this.dom.backgroundColorInput.addEventListener('input', (event) => {
            this.applyCanvasBackground(event.target.value);
        });

        this.dom.globalSearch.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') this.handleGlobalSearch();
        });

        this.dom.globalSearch.addEventListener('input', (event) => {
            if (!event.target.value.trim()) this.handleGlobalSearch();
        });
    },

    log: function(message) {
        this.dom.systemLog.innerText = `📝 ${message}`;
    },

    showToast: function(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerText = message;
        this.dom.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-leave');
            setTimeout(() => toast.remove(), 240);
        }, 2200);
    },

    cloneProjectDatasets: function(index) {
        return this.projects[index].datasets.map(item => ({ ...item }));
    },

    getStorageKey: function(index = this.currentProjectIndex) {
        return `${this.storagePrefix}${index}`;
    },

    syncProjectLabel: function() {
        this.dom.projectSelector.innerText = `项目: ${this.projects[this.currentProjectIndex].name} ▼`;
    },

    cycleProject: function() {
        const hasCanvasContent = this.components.length > 0;
        if (hasCanvasContent) {
            const shouldContinue = window.confirm('切换项目会先自动保存当前看板草稿，并加载下一个项目。是否继续？');
            if (!shouldContinue) return;
            this.persistCurrentProjectSilently();
        }

        this.currentProjectIndex = (this.currentProjectIndex + 1) % this.projects.length;
        this.datasets = this.cloneProjectDatasets(this.currentProjectIndex);
        this.selectedDatasetIndex = null;
        this.syncProjectLabel();
        this.renderDatasetList();

        if (!this.restoreProjectDraft(this.currentProjectIndex)) {
            this.resetCanvas();
            this.updateSelectionUI();
            this.log(`已切换到项目「${this.projects[this.currentProjectIndex].name}」`);
        }

        this.showToast(`当前项目：${this.projects[this.currentProjectIndex].name}`);
    },

    renderDatasetList: function() {
        if (this.datasets.length === 0) {
            this.dom.datasetList.innerHTML = '<div class="empty-dataset">暂无数据集，请点击上方按钮接入。</div>';
            return;
        }

        this.dom.datasetList.innerHTML = this.datasets.map((dataset, index) => {
            const icon = dataset.status === 'ready' ? '🟢' : (dataset.status === 'warning' ? '🟡' : '🔴');
            const activeClass = index === this.selectedDatasetIndex ? ' active' : '';
            return `<div class="data-item${activeClass}" data-index="${index}">${icon} ${dataset.name}</div>`;
        }).join('');
    },

    selectDataset: function(index) {
        if (!this.datasets[index]) return;
        this.selectedDatasetIndex = index;
        this.renderDatasetList();

        const dataset = this.datasets[index];
        const suffix = dataset.status === 'ready' ? '可直接使用' : '建议先清洗数据';
        this.log(`当前选中数据集：${dataset.name}，${suffix}`);
    },

    importDatasetFiles: function(fileList) {
        const files = Array.from(fileList || []);
        if (files.length === 0) return;

        const imported = files.map(file => ({
            name: file.name,
            status: /\.(csv|xlsx?|json)$/i.test(file.name) ? 'ready' : 'warning'
        }));

        this.datasets = [...imported, ...this.datasets];
        this.selectedDatasetIndex = 0;
        this.renderDatasetList();
        this.log(`已接入 ${files.length} 个数据文件`);
        this.showToast(`数据接入完成：${files.length} 个文件`);
        this.dom.dataFileInput.value = '';
    },

    loadEnterpriseTemplate: function() {
        if (this.components.length > 0) {
            const shouldReplace = window.confirm('加载模板会替换当前画布内容，是否继续？');
            if (!shouldReplace) return;
        }

        const template = [
            { type: 'line', x: 30, y: 30, title: '月度销售趋势', color: '#1677ff' },
            { type: 'bar', x: 480, y: 30, title: '产品线销售对比', color: '#13c2c2' },
            { type: 'card', x: 930, y: 30, title: '本季度核心指标', color: '#52c41a' },
            { type: 'pie', x: 30, y: 360, title: '区域贡献占比', color: '#722ed1' },
            { type: 'table', x: 480, y: 360, title: '重点客户明细', color: '#fa8c16', width: 730, height: 280 }
        ];

        this.resetCanvas();
        template.forEach(item => {
            this.addComponentToCanvas(item.type, item.x, item.y, item.title, {
                color: item.color,
                width: item.width,
                height: item.height,
                silent: true
            });
        });

        this.updateSelectionUI();
        this.log('企业级模板已加载完成');
        this.showToast('模板已应用到当前画布');
    },

    handleAgentRequest: function() {
        const input = this.dom.agentInput.value.trim();
        if (!input) return;

        this.log(`AI 正在分析指令：“${input}”`);

        const parsed = window.Agent && typeof Agent.parseCommand === 'function'
            ? Agent.parseCommand(input)
            : { action: 'render', chartTypes: [], needsValidation: false };

        const chartTypes = new Set(parsed.chartTypes || []);
        if (input.includes('柱')) chartTypes.add('bar');
        if (input.includes('饼') || input.includes('占比')) chartTypes.add('pie');
        if (input.includes('表') || input.includes('明细')) chartTypes.add('table');
        if (chartTypes.size === 0) chartTypes.add('line');

        let currentX = 40;
        let currentY = 40;

        setTimeout(() => {
            Array.from(chartTypes).forEach(type => {
                const size = this.getDefaultSizeForType(type);
                if (currentX + size.width > 1180) {
                    currentX = 40;
                    currentY += 340;
                }

                this.addComponentToCanvas(type, currentX, currentY, this.buildAgentTitle(type, input), {
                    data: this.getMockData(type, parsed.needsValidation),
                    silent: true
                });

                currentX += size.width + 20;
            });

            this.selectedComponentIds = [];
            this.updateSelectionUI();
            this.dom.agentInput.value = '';
            this.log(`AI 搭建完成，共生成 ${chartTypes.size} 个组件`);
            this.showToast('AI 组件已生成');
        }, 500);
    },

    buildAgentTitle: function(type, prompt) {
        const keyword = prompt.includes('利润') ? '利润' : (prompt.includes('销售') ? '销售' : '业务');
        const suffixMap = {
            line: '趋势图',
            bar: '对比图',
            pie: '占比图',
            card: '指标卡',
            table: '明细表'
        };
        return `${keyword}${suffixMap[type] || '图表'}`;
    },

    addComponentToCanvas: function(type, x = 20, y = 20, title = '新组件', options = {}) {
        const id = options.id || this.generateComponentId();
        const size = this.getDefaultSizeForType(type, options.width, options.height);
        const component = {
            id,
            type,
            data: options.data || this.getMockData(type),
            config: {
                title,
                color: options.color || '#1677ff'
            }
        };

        this.components.push(component);

        const wrapper = document.createElement('div');
        wrapper.className = 'chart-container';
        wrapper.id = `${id}_wrapper`;
        wrapper.style.left = `${x}px`;
        wrapper.style.top = `${y}px`;
        wrapper.style.width = `${size.width}px`;
        wrapper.style.height = `${size.height}px`;
        wrapper.innerHTML = `
            <div id="${id}" class="echart-box"></div>
            <div class="resize-handle"></div>
            <div class="delete-btn" onclick="App.deleteSingleComponent('${id}', event)">×</div>
        `;

        this.dom.dashboardCanvas.appendChild(wrapper);
        this.renderComponent(component);

        if (!options.silent) {
            this.selectedComponentIds = [id];
            this.updateSelectionUI();
            this.log(`已添加 ${this.getTypeLabel(type)}`);
        }

        return component;
    },

    generateComponentId: function() {
        this.componentSequence += 1;
        return `chart_${Date.now()}_${this.componentSequence}`;
    },

    getDefaultSizeForType: function(type, width, height) {
        if (width && height) return { width, height };

        const map = {
            card: { width: 260, height: 180 },
            table: { width: 480, height: 260 }
        };

        return map[type] || { width: 400, height: 300 };
    },

    getTypeLabel: function(type) {
        const labelMap = {
            line: '折线趋势图',
            bar: '柱状对比图',
            pie: '占比饼图',
            card: '核心指标卡',
            table: '明细数据表'
        };
        return labelMap[type] || '组件';
    },

    getMockData: function(type, needsValidation = false) {
        if (type === 'pie') {
            return [
                { name: '华东', value: 35 },
                { name: '华南', value: 28 },
                { name: '华北', value: 22 },
                { name: '西南', value: 15 }
            ];
        }

        if (type === 'table') {
            return [
                { name: '重点客户A', value: 128, status: '正常' },
                { name: '重点客户B', value: 96, status: needsValidation ? '需复核' : '正常' },
                { name: '重点客户C', value: 84, status: '正常' },
                { name: '重点客户D', value: 72, status: '关注' }
            ];
        }

        const series = [
            { name: '1月', value: 120 },
            { name: '2月', value: 132 },
            { name: '3月', value: 101 },
            { name: '4月', value: 134 },
            { name: '5月', value: 90 },
            { name: '6月', value: 230 }
        ];

        if (needsValidation && series[2]) {
            series[2]._isWarning = true;
        }

        return series;
    },

    renderComponent: function(component) {
        if (!window.ChartManager) return;
        ChartManager.renderChart(component.id, component.type, component.data, component.config);
    },

    updateSelectionUI: function() {
        document.querySelectorAll('.chart-container').forEach(element => element.classList.remove('selected'));
        this.selectedComponentIds.forEach(id => {
            const element = document.getElementById(`${id}_wrapper`);
            if (element) element.classList.add('selected');
        });

        const count = this.selectedComponentIds.length;
        const selectedComponent = count === 1
            ? this.components.find(item => item.id === this.selectedComponentIds[0])
            : null;

        if (count === 0) {
            this.dom.globalConfigMsg.style.display = 'block';
            this.dom.componentConfigForm.style.display = 'none';
            this.dom.deleteSelectedBtn.style.display = 'none';
            return;
        }

        if (count === 1 && selectedComponent) {
            this.dom.globalConfigMsg.style.display = 'none';
            this.dom.componentConfigForm.style.display = 'block';
            this.dom.deleteSelectedBtn.style.display = 'inline-flex';
            this.dom.configTypeTitle.innerText = `配置项（${this.getTypeLabel(selectedComponent.type)}）`;
            this.dom.configTitle.value = selectedComponent.config.title;
            this.dom.configColor.value = selectedComponent.config.color || '#1677ff';
            return;
        }

        this.dom.globalConfigMsg.style.display = 'none';
        this.dom.componentConfigForm.style.display = 'none';
        this.dom.deleteSelectedBtn.style.display = 'inline-flex';
    },

    applyConfig: function() {
        if (this.selectedComponentIds.length !== 1) return;

        const component = this.components.find(item => item.id === this.selectedComponentIds[0]);
        if (!component) return;

        component.config.title = this.dom.configTitle.value.trim() || this.getTypeLabel(component.type);
        component.config.color = this.dom.configColor.value || '#1677ff';
        this.renderComponent(component);
        this.log('组件配置已更新');
        this.showToast('组件已重新渲染');
    },

    deleteSingleComponent: function(id, event) {
        if (event) event.stopPropagation();
        this.removeComponentFromDOM(id);
        this.selectedComponentIds = this.selectedComponentIds.filter(item => item !== id);
        this.updateSelectionUI();
        this.log('组件已删除');
    },

    deleteSelectedComponents: function() {
        if (this.selectedComponentIds.length === 0) return;

        const count = this.selectedComponentIds.length;
        this.selectedComponentIds.forEach(id => this.removeComponentFromDOM(id));
        this.selectedComponentIds = [];
        this.updateSelectionUI();
        this.log(`已删除 ${count} 个选中组件`);
    },

    removeComponentFromDOM: function(id) {
        const wrapper = document.getElementById(`${id}_wrapper`);
        if (wrapper) wrapper.remove();

        this.components = this.components.filter(component => component.id !== id);
        if (window.ChartManager) ChartManager.destroyChart(id);
    },

    resetCanvas: function() {
        this.components.forEach(component => {
            if (window.ChartManager) ChartManager.destroyChart(component.id);
        });
        this.components = [];
        this.selectedComponentIds = [];
        this.dom.dashboardCanvas.innerHTML = '';
    },

    getComponentLayout: function(id) {
        const wrapper = document.getElementById(`${id}_wrapper`);
        if (!wrapper) {
            return { left: 20, top: 20, width: 400, height: 300 };
        }

        return {
            left: parseInt(wrapper.style.left, 10) || 20,
            top: parseInt(wrapper.style.top, 10) || 20,
            width: parseInt(wrapper.style.width, 10) || wrapper.offsetWidth || 400,
            height: parseInt(wrapper.style.height, 10) || wrapper.offsetHeight || 300
        };
    },

    serializeDashboardState: function() {
        return {
            version: 1,
            projectIndex: this.currentProjectIndex,
            datasets: this.datasets,
            settings: {
                theme: this.dom.themeSelect.value,
                backgroundColor: this.dom.backgroundColorInput.value,
                settingsPanelVisible: this.settingsPanelVisible
            },
            components: this.components.map(component => ({
                id: component.id,
                type: component.type,
                data: component.data,
                config: component.config,
                layout: this.getComponentLayout(component.id)
            }))
        };
    },

    persistCurrentProjectSilently: function() {
        try {
            localStorage.setItem(this.getStorageKey(), JSON.stringify(this.serializeDashboardState()));
        } catch (error) {
            console.warn('保存本地草稿失败:', error);
        }
    },

    saveDashboard: function() {
        try {
            localStorage.setItem(this.getStorageKey(), JSON.stringify(this.serializeDashboardState()));
            this.log('看板已保存到浏览器本地草稿');
            this.showToast('保存成功');
        } catch (error) {
            this.log('保存失败：当前浏览器不支持本地存储');
            this.showToast('保存失败，请检查浏览器设置');
        }
    },

    exportDashboard: function() {
        const state = this.serializeDashboardState();
        const fileName = `${this.projects[this.currentProjectIndex].name.replace(/\s+/g, '_')}_dashboard.json`;
        this.downloadText(fileName, JSON.stringify(state, null, 2));
        this.log(`已导出 ${fileName}`);
        this.showToast('看板配置已导出');
    },

    shareDashboard: async function() {
        const encoded = this.encodeState(this.serializeDashboardState());
        const shareUrl = `${window.location.href.split('#')[0]}#dashboard=${encoded}`;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareUrl);
                this.showToast('分享链接已复制到剪贴板');
            } else {
                window.prompt('请复制下方分享链接', shareUrl);
            }
            this.log('分享链接已生成');
        } catch (error) {
            window.prompt('复制失败，请手动复制链接', shareUrl);
            this.log('已生成分享链接，请手动复制');
        }
    },

    restoreInitialState: function() {
        return this.restoreSharedDashboard() || this.restoreProjectDraft(this.currentProjectIndex);
    },

    restoreProjectDraft: function(index) {
        try {
            const raw = localStorage.getItem(this.getStorageKey(index));
            if (!raw) return false;

            const state = JSON.parse(raw);
            this.applySerializedState(state);
            this.log('已恢复本地草稿');
            return true;
        } catch (error) {
            console.warn('恢复本地草稿失败:', error);
            return false;
        }
    },

    restoreSharedDashboard: function() {
        const hash = window.location.hash || '';
        if (!hash.startsWith('#dashboard=')) return false;

        try {
            const encoded = hash.replace('#dashboard=', '');
            const state = this.decodeState(encoded);
            this.applySerializedState(state);
            this.log('已加载分享看板');
            return true;
        } catch (error) {
            console.warn('解析分享链接失败:', error);
            return false;
        }
    },

    applySerializedState: function(state) {
        if (!state || !Array.isArray(state.components)) return;

        if (typeof state.projectIndex === 'number' && this.projects[state.projectIndex]) {
            this.currentProjectIndex = state.projectIndex;
        }

        this.datasets = Array.isArray(state.datasets)
            ? state.datasets.map(item => ({ ...item }))
            : this.cloneProjectDatasets(this.currentProjectIndex);
        this.selectedDatasetIndex = null;

        this.syncProjectLabel();
        this.renderDatasetList();

        const settings = state.settings || {};
        if (settings.theme && this.themePresets[settings.theme]) {
            this.dom.themeSelect.value = settings.theme;
        }
        if (settings.backgroundColor) {
            this.dom.backgroundColorInput.value = settings.backgroundColor;
        }

        this.applyTheme(this.dom.themeSelect.value);
        this.applyCanvasBackground(this.dom.backgroundColorInput.value);
        this.toggleSettingsPanel(settings.settingsPanelVisible !== false);

        this.resetCanvas();
        state.components.forEach(component => {
            this.addComponentToCanvas(
                component.type,
                component.layout?.left ?? 20,
                component.layout?.top ?? 20,
                component.config?.title || this.getTypeLabel(component.type),
                {
                    id: component.id,
                    data: component.data,
                    color: component.config?.color,
                    width: component.layout?.width,
                    height: component.layout?.height,
                    silent: true
                }
            );
        });

        this.selectedComponentIds = [];
        this.updateSelectionUI();
    },

    toggleSettingsPanel: function(forceVisible) {
        if (typeof forceVisible === 'boolean') {
            this.settingsPanelVisible = forceVisible;
        } else {
            this.settingsPanelVisible = !this.settingsPanelVisible;
        }

        document.body.classList.toggle('hide-right-sidebar', !this.settingsPanelVisible);
        this.dom.settingsToggleBtn.innerText = this.settingsPanelVisible ? '⚙️ 设置' : '⚙️ 显示设置';
        this.log(this.settingsPanelVisible ? '已展开右侧设置面板' : '已收起右侧设置面板');
    },

    showProfileSummary: function() {
        const projectName = this.projects[this.currentProjectIndex].name;
        const summary = `当前账号：管理员\n当前项目：${projectName}\n画布组件数：${this.components.length}\n数据集数量：${this.datasets.length}`;
        window.alert(summary);
        this.log('已打开账户信息');
    },

    handleGlobalSearch: function() {
        const keyword = this.dom.globalSearch.value.trim().toLowerCase();
        document.querySelectorAll('.search-hit').forEach(element => element.classList.remove('search-hit'));

        if (!keyword) {
            this.log('已清空搜索关键字');
            return;
        }

        let resultCount = 0;

        document.querySelectorAll('.drag-item').forEach(element => {
            const text = (element.innerText || element.textContent || '').toLowerCase();
            if (text.includes(keyword)) {
                element.classList.add('search-hit');
                resultCount += 1;
            }
        });

        document.querySelectorAll('.data-item').forEach(element => {
            const text = (element.innerText || element.textContent || '').toLowerCase();
            if (text.includes(keyword)) {
                element.classList.add('search-hit');
                resultCount += 1;
            }
        });

        this.components.forEach(component => {
            const text = `${component.config.title} ${this.getTypeLabel(component.type)}`.toLowerCase();
            if (text.includes(keyword)) {
                const wrapper = document.getElementById(`${component.id}_wrapper`);
                if (wrapper) {
                    wrapper.classList.add('search-hit');
                    resultCount += 1;
                }
            }
        });

        this.log(resultCount > 0 ? `搜索完成，共匹配 ${resultCount} 项` : '未搜索到匹配内容');
    },

    applyTheme: function(themeName) {
        const theme = this.themePresets[themeName] || this.themePresets['科技蓝调 (默认)'];
        const root = document.documentElement;

        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--primary-hover', theme.primaryHover);
        root.style.setProperty('--bg-dark', theme.bgDark);
        root.style.setProperty('--bg-light', theme.bgLight);
        root.style.setProperty('--bg-panel', theme.panel);
    },

    applyCanvasBackground: function(color) {
        this.dom.dashboardCanvas.style.backgroundColor = color;
    },

    downloadText: function(fileName, content) {
        const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    },

    encodeState: function(state) {
        return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    },

    decodeState: function(encoded) {
        return JSON.parse(decodeURIComponent(escape(atob(encoded))));
    }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());

