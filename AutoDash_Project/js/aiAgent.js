const AIAgent = {
    DEFAULT_BASE_URL: 'https://api.openai.com/v1',
    DEFAULT_MODEL: 'gpt-5.2',
    CHART_TYPES: ['line', 'area', 'bar', 'stackedBar', 'horizontalBar', 'pie', 'doughnut', 'rose', 'scatter', 'radar', 'funnel', 'treemap', 'gauge', 'card', 'table'],
    THEMES: ['星云流光', '深海极光', '晨雾玻璃'],

    normalizeBaseUrl: function (value) {
        const base = String(value || '').trim() || this.DEFAULT_BASE_URL;
        if (/\/responses\/?$/i.test(base)) return base.replace(/\/$/, '');
        return `${base.replace(/\/$/, '')}/responses`;
    },

    buildSystemPrompt: function () {
        return [
            '你是 AutoDash BI Pro 的真实 AI 副驾驶。',
            '你的任务是把用户的自然语言需求转换成可执行的 JSON 操作计划。',
            '只能返回纯 JSON 对象，绝对不要输出 markdown、解释、代码块或额外文本。',
            'JSON 顶层格式必须是：',
            '{"summary":"一句话总结","operations":[...]}',
            'operations 数组里的每一项必须包含以下字段：',
            '{"action":"","match":{"scope":"auto","id":"","titleIncludes":"","type":"","allMatches":false},"component":{"type":"","title":"","subtitle":"","datasetName":"","xField":"","yField":"","xAxisName":"","yAxisName":"","color":"","secondaryColor":"","accentColor":"","background":"","width":0,"height":0,"left":0,"top":0},"changes":{"chartType":"","title":"","subtitle":"","datasetName":"","xField":"","yField":"","xAxisName":"","yAxisName":"","color":"","secondaryColor":"","accentColor":"","background":"","width":0,"height":0,"left":0,"top":0,"xLabelRotate":0,"granularity":0,"yMin":"","yMax":"","legendPosition":"","labelPosition":"","sortOrder":"","dataLimit":0,"showLegend":true,"showGrid":true,"showLabel":false,"smooth":false,"showArea":false,"stack":false,"innerRadius":0,"opacity":0,"symbolSize":0,"borderRadius":0,"shadow":0},"mode":"","themeName":"","message":""}',
            'action 只允许使用：add_component、update_component、delete_component、select_component、auto_arrange、set_theme、reply_only。',
            `图表类型只允许使用：${this.CHART_TYPES.join('、')}。`,
            '布局模式只允许使用 compact 或 presentation。',
            `主题只允许使用：${this.THEMES.join('、')}。`,
            '如果用户说“当前图表/这个图表/选中的图表”，优先把 match.scope 设为 selected。',
            '如果用户要求删除或修改多个图表，把 match.allMatches 设为 true。',
            '如果用户要求“调整图表”或“修改图表样式”，应优先输出 update_component。',
            '如果用户没有明确指定数据集，尽量复用当前激活数据集。',
            '如果无需执行真实操作，就输出 reply_only，并把简短说明写到 message。',
            '所有未使用的字段请保留空字符串、0、false 或空对象默认值。'
        ].join('\n');
    },

    requestPlan: async function ({ prompt, snapshot, apiKey, model, baseUrl }) {
        if (!apiKey) throw new Error('请先输入 OpenAI API Key');

        const endpoint = this.normalizeBaseUrl(baseUrl);
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: String(model || this.DEFAULT_MODEL).trim() || this.DEFAULT_MODEL,
                input: [
                    {
                        role: 'system',
                        content: [{ type: 'input_text', text: this.buildSystemPrompt() }]
                    },
                    {
                        role: 'user',
                        content: [{
                            type: 'input_text',
                            text: [
                                '当前看板上下文如下，请基于它生成操作计划：',
                                JSON.stringify(snapshot),
                                '',
                                `用户指令：${prompt}`
                            ].join('\n')
                        }]
                    }
                ],
                text: {
                    format: { type: 'json_object' }
                }
            })
        });

        if (!response.ok) {
            const detail = await response.text();
            throw new Error(`AI 调用失败：${response.status} ${detail}`);
        }

        const payload = await response.json();
        const parsed = this.extractPlan(payload);
        return this.normalizePlan(parsed);
    },

    extractPlan: function (payload) {
        const candidates = [];
        if (typeof payload?.output_text === 'string' && payload.output_text.trim()) candidates.push(payload.output_text.trim());

        (payload?.output || []).forEach((item) => {
            (item?.content || []).forEach((content) => {
                if (typeof content?.text === 'string' && content.text.trim()) candidates.push(content.text.trim());
                if (typeof content?.value === 'string' && content.value.trim()) candidates.push(content.value.trim());
            });
        });

        for (const candidate of candidates) {
            try {
                return JSON.parse(candidate);
            } catch (error) {
                continue;
            }
        }

        throw new Error('AI 返回内容无法解析为 JSON');
    },

    normalizePlan: function (plan) {
        if (!plan || typeof plan !== 'object') throw new Error('AI 计划为空');
        const operations = Array.isArray(plan.operations) ? plan.operations.map(operation => this.normalizeOperation(operation)).filter(Boolean) : [];
        return {
            summary: typeof plan.summary === 'string' && plan.summary.trim() ? plan.summary.trim() : '已生成看板操作计划',
            operations
        };
    },

    normalizeOperation: function (operation) {
        if (!operation || typeof operation !== 'object') return null;
        const action = String(operation.action || '').trim();
        if (!action) return null;
        return {
            action,
            match: this.normalizeMatch(operation.match),
            component: this.normalizeComponent(operation.component),
            changes: this.normalizeChanges(operation.changes),
            mode: String(operation.mode || '').trim(),
            themeName: String(operation.themeName || '').trim(),
            message: String(operation.message || '').trim()
        };
    },

    normalizeMatch: function (match = {}) {
        return {
            scope: String(match.scope || 'auto').trim() || 'auto',
            id: String(match.id || '').trim(),
            titleIncludes: String(match.titleIncludes || '').trim(),
            type: String(match.type || '').trim(),
            allMatches: match.allMatches === true
        };
    },

    normalizeComponent: function (component = {}) {
        return {
            type: this.normalizeChartType(component.type),
            title: String(component.title || '').trim(),
            subtitle: String(component.subtitle || '').trim(),
            datasetName: String(component.datasetName || '').trim(),
            xField: String(component.xField || '').trim(),
            yField: String(component.yField || '').trim(),
            xAxisName: String(component.xAxisName || '').trim(),
            yAxisName: String(component.yAxisName || '').trim(),
            color: String(component.color || '').trim(),
            secondaryColor: String(component.secondaryColor || '').trim(),
            accentColor: String(component.accentColor || '').trim(),
            background: String(component.background || '').trim(),
            width: this.toNumber(component.width),
            height: this.toNumber(component.height),
            left: this.toNumber(component.left),
            top: this.toNumber(component.top)
        };
    },

    normalizeChanges: function (changes = {}) {
        return {
            chartType: this.normalizeChartType(changes.chartType || changes.type),
            title: String(changes.title || '').trim(),
            subtitle: String(changes.subtitle || '').trim(),
            datasetName: String(changes.datasetName || '').trim(),
            xField: String(changes.xField || '').trim(),
            yField: String(changes.yField || '').trim(),
            xAxisName: String(changes.xAxisName || '').trim(),
            yAxisName: String(changes.yAxisName || '').trim(),
            color: String(changes.color || '').trim(),
            secondaryColor: String(changes.secondaryColor || '').trim(),
            accentColor: String(changes.accentColor || '').trim(),
            background: String(changes.background || '').trim(),
            width: this.toNumber(changes.width),
            height: this.toNumber(changes.height),
            left: this.toNumber(changes.left),
            top: this.toNumber(changes.top),
            xLabelRotate: this.toNumber(changes.xLabelRotate),
            granularity: this.toNumber(changes.granularity),
            yMin: changes.yMin === undefined || changes.yMin === null ? '' : String(changes.yMin).trim(),
            yMax: changes.yMax === undefined || changes.yMax === null ? '' : String(changes.yMax).trim(),
            legendPosition: String(changes.legendPosition || '').trim(),
            labelPosition: String(changes.labelPosition || '').trim(),
            sortOrder: String(changes.sortOrder || '').trim(),
            dataLimit: this.toNumber(changes.dataLimit),
            showLegend: changes.showLegend,
            showGrid: changes.showGrid,
            showLabel: changes.showLabel,
            smooth: changes.smooth,
            showArea: changes.showArea,
            stack: changes.stack,
            innerRadius: this.toNumber(changes.innerRadius),
            opacity: this.toNumber(changes.opacity),
            symbolSize: this.toNumber(changes.symbolSize),
            borderRadius: this.toNumber(changes.borderRadius),
            shadow: this.toNumber(changes.shadow)
        };
    },

    normalizeChartType: function (value) {
        const type = String(value || '').trim();
        return this.CHART_TYPES.includes(type) ? type : '';
    },

    toNumber: function (value) {
        if (value === '' || value === null || value === undefined) return 0;
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : 0;
    },

    buildLocalPlan: function (prompt) {
        const text = String(prompt || '').trim();
        const chartTypes = new Set();
        const wantsCreate = /(生成|新增|添加|插入|创建|搭建|做一个|做一张|来一个|帮我做)/.test(text);
        if (wantsCreate) {
            if (text.includes('趋势') || text.includes('折线')) chartTypes.add('line');
            if (text.includes('面积')) chartTypes.add('area');
            if (text.includes('堆叠')) chartTypes.add('stackedBar');
            else if (text.includes('柱')) chartTypes.add('bar');
            if (text.includes('条形')) chartTypes.add('horizontalBar');
            if (text.includes('饼') || text.includes('占比')) chartTypes.add('doughnut');
            if (text.includes('玫瑰')) chartTypes.add('rose');
            if (text.includes('雷达')) chartTypes.add('radar');
            if (text.includes('散点')) chartTypes.add('scatter');
            if (text.includes('树图')) chartTypes.add('treemap');
            if (text.includes('漏斗')) chartTypes.add('funnel');
            if (text.includes('仪表')) chartTypes.add('gauge');
            if (text.includes('指标')) chartTypes.add('card');
            if (text.includes('数据表') || text.includes('明细表') || text.includes('表格')) chartTypes.add('table');
        }

        const operations = [];
        if (text.includes('删除') && (text.includes('当前') || text.includes('选中'))) {
            operations.push({
                action: 'delete_component',
                match: { scope: 'selected', id: '', titleIncludes: '', type: '', allMatches: true },
                component: this.normalizeComponent(),
                changes: this.normalizeChanges(),
                mode: '',
                themeName: '',
                message: '已删除当前选中的图表'
            });
        }

        if (text.includes('紧凑排布')) {
            operations.push({
                action: 'auto_arrange',
                match: this.normalizeMatch(),
                component: this.normalizeComponent(),
                changes: this.normalizeChanges(),
                mode: 'compact',
                themeName: '',
                message: '已切换为紧凑排布'
            });
        } else if (text.includes('演示排布')) {
            operations.push({
                action: 'auto_arrange',
                match: this.normalizeMatch(),
                component: this.normalizeComponent(),
                changes: this.normalizeChanges(),
                mode: 'presentation',
                themeName: '',
                message: '已切换为演示排布'
            });
        } else if (text.includes('布局')) {
            operations.push({
                action: 'auto_arrange',
                match: this.normalizeMatch(),
                component: this.normalizeComponent(),
                changes: this.normalizeChanges(),
                mode: 'compact',
                themeName: '',
                message: '已整理当前布局'
            });
        }

        if (text.includes('深海') || text.includes('极光')) {
            operations.push({
                action: 'set_theme',
                match: this.normalizeMatch(),
                component: this.normalizeComponent(),
                changes: this.normalizeChanges(),
                mode: '',
                themeName: '深海极光',
                message: '已切换为深海极光'
            });
        }

        chartTypes.forEach((type) => {
            operations.push({
                action: 'add_component',
                match: this.normalizeMatch(),
                component: this.normalizeComponent({ type, title: this.defaultTitle(type, text) }),
                changes: this.normalizeChanges(),
                mode: '',
                themeName: '',
                message: `已添加${this.defaultTitle(type, text)}`
            });
        });

        if (!operations.length) {
            operations.push({
                action: 'reply_only',
                match: this.normalizeMatch(),
                component: this.normalizeComponent(),
                changes: this.normalizeChanges(),
                mode: '',
                themeName: '',
                message: '请更具体地描述你想新增、删除或调整的图表。'
            });
        }

        return {
            summary: '已生成本地快速操作计划',
            operations
        };
    },

    defaultTitle: function (type, prompt) {
        const base = prompt.includes('利润') ? '利润' : (prompt.includes('销售') ? '销售' : (prompt.includes('增长') ? '增长' : '业务'));
        return `${base}${({
            line: '趋势图',
            area: '面积图',
            bar: '对比图',
            stackedBar: '堆叠图',
            horizontalBar: '排名图',
            pie: '占比图',
            doughnut: '结构图',
            rose: '玫瑰图',
            scatter: '分布图',
            radar: '雷达图',
            funnel: '漏斗图',
            treemap: '矩形树图',
            gauge: '仪表盘',
            card: '指标卡',
            table: '数据表'
        })[type] || '图表'}`;
    }
};

window.AIAgent = AIAgent;
