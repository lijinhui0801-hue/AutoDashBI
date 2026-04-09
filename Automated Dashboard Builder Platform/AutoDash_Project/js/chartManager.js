/**
 * 模块：图表渲染管理器
 */
const ChartManager = {
    instances: {},
    observers: {},

    renderChart: function (domId, type, data = [], config = {}) {
        const dom = document.getElementById(domId);
        if (!dom) return;

        if (type === 'card') {
            this.destroyChart(domId);
            dom.innerHTML = this.createCardMarkup(data, config);
            return;
        }

        if (type === 'table') {
            this.destroyChart(domId);
            dom.innerHTML = this.createTableMarkup(data, config);
            return;
        }

        dom.innerHTML = '';
        let chart = echarts.getInstanceByDom(dom);
        if (!chart) chart = echarts.init(dom);
        this.instances[domId] = chart;

        if (!this.observers[domId]) {
            const observer = new ResizeObserver(() => chart.resize());
            observer.observe(dom);
            this.observers[domId] = observer;
        }

        const palette = [
            config.color || '#7c5cff',
            config.secondaryColor || '#20c5ff',
            config.accentColor || '#ff8a3d',
            '#35d49a'
        ];

        const labels = data.map(item => item.name);
        const values = data.map(item => Number(item.value) || 0);
        const opacity = Math.max(0.2, (Number(config.opacity) || 88) / 100);
        const borderRadius = Number(config.borderRadius) || 12;
        const symbolSize = Number(config.symbolSize) || 12;
        const showLegend = config.showLegend !== false;
        const showGrid = config.showGrid !== false;
        const showLabel = config.showLabel === true;
        const xRotate = Number(config.xLabelRotate) || 0;
        const interval = Number(config.granularity) > 0 ? Number(config.granularity) : null;
        const yMin = config.yMin === '' || config.yMin === null || config.yMin === undefined ? null : Number(config.yMin);
        const yMax = config.yMax === '' || config.yMax === null || config.yMax === undefined ? null : Number(config.yMax);
        const backgroundColor = config.background || '#0f1628';
        const titleText = config.title || '智能图表';
        const subtitleText = config.subtitle || '';
        const legendPosition = config.legendPosition || (['pie', 'doughnut', 'rose', 'treemap'].includes(type) ? 'right' : 'top');
        const labelPosition = config.labelPosition || 'auto';
        const titleRight = legendPosition === 'right' ? 132 : 26;
        const gridTop = showLegend && legendPosition === 'top' ? 96 : 78;
        const gridBottom = showLegend && legendPosition === 'bottom' ? 70 : 52;
        const gridRight = legendPosition === 'right' ? 138 : 30;
        const gridLeft = legendPosition === 'left' ? 118 : 58;
        const legendLayout = ({
            top: { top: 14, left: 'center' },
            right: { orient: 'vertical', top: 'middle', right: 16 },
            bottom: { bottom: 10, left: 'center' },
            left: { orient: 'vertical', top: 'middle', left: 16 }
        })[legendPosition] || { top: 14, left: 'center' };
        const commonLabelPosition = labelPosition === 'auto' ? 'top' : labelPosition;
        const pieLabelPosition = labelPosition === 'inside' ? 'inside' : (labelPosition === 'center' ? 'center' : 'outside');

        const baseOption = {
            backgroundColor: 'transparent',
            animationDuration: 500,
            color: palette,
            title: {
                text: titleText,
                subtext: subtitleText,
                left: 18,
                top: 12,
                right: titleRight,
                textStyle: { color: '#f7f9ff', fontWeight: 600, fontSize: 15, width: 220, overflow: 'truncate' },
                subtextStyle: { color: 'rgba(236,242,255,0.58)', fontSize: 11, width: 220, overflow: 'truncate' }
            },
            tooltip: {
                trigger: ['pie', 'doughnut', 'rose', 'radar', 'gauge', 'funnel', 'treemap'].includes(type) ? 'item' : 'axis',
                backgroundColor: 'rgba(10,18,34,0.94)',
                borderColor: 'rgba(255,255,255,0.08)',
                textStyle: { color: '#fff' }
            },
            legend: {
                show: showLegend,
                type: 'scroll',
                pageIconColor: 'rgba(236,242,255,0.72)',
                pageTextStyle: { color: 'rgba(236,242,255,0.68)' },
                itemWidth: 10,
                itemHeight: 10,
                ...legendLayout,
                textStyle: { color: 'rgba(236,242,255,0.72)', width: 84, overflow: 'truncate' },
                formatter: (name) => this.truncateText(name, legendPosition === 'right' || legendPosition === 'left' ? 10 : 14)
            },
            grid: {
                show: showGrid,
                left: gridLeft,
                right: gridRight,
                top: gridTop,
                bottom: gridBottom,
                containLabel: true,
                borderColor: 'rgba(255,255,255,0.06)',
                backgroundColor: 'transparent'
            },
            textStyle: { color: '#e8edff' }
        };

        const axisCommon = {
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.18)' } },
            axisTick: { show: false },
            axisLabel: { color: 'rgba(236,242,255,0.72)', hideOverlap: true, overflow: 'truncate', width: 86 },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } }
        };

        const lineSeries = {
            type: type === 'scatter' ? 'scatter' : 'line',
            data: values,
            smooth: config.smooth === true,
            symbolSize,
            showSymbol: type !== 'area',
            areaStyle: config.showArea === true || type === 'area'
                ? { color: this.createAreaGradient(palette[0], opacity) }
                : undefined,
            lineStyle: { width: 3, opacity },
            itemStyle: { color: palette[0] },
            label: { show: showLabel, color: '#f2f6ff', position: commonLabelPosition },
            labelLayout: { hideOverlap: true }
        };

        const barSeries = {
            type: 'bar',
            data: values,
            barWidth: '52%',
            stack: config.stack === true || type === 'stackedBar' ? 'total' : undefined,
            itemStyle: {
                color: this.createBarGradient(palette[0], palette[1]),
                borderRadius: [borderRadius, borderRadius, 0, 0]
            },
            label: { show: showLabel, position: commonLabelPosition, color: '#f2f6ff' },
            labelLayout: { hideOverlap: true }
        };

        let option = {};

        switch (type) {
            case 'area':
            case 'line':
                option = {
                    ...baseOption,
                    xAxis: {
                        type: 'category',
                        data: labels,
                        name: config.xAxisName || '',
                        nameTextStyle: { color: 'rgba(236,242,255,0.6)' },
                        axisLabel: { ...axisCommon.axisLabel, rotate: xRotate },
                        axisLine: axisCommon.axisLine,
                        axisTick: axisCommon.axisTick
                    },
                    yAxis: {
                        type: 'value',
                        name: config.yAxisName || '',
                        min: yMin,
                        max: yMax,
                        interval,
                        nameTextStyle: { color: 'rgba(236,242,255,0.6)' },
                        ...axisCommon
                    },
                    series: [lineSeries]
                };
                break;
            case 'bar':
            case 'stackedBar':
                option = {
                    ...baseOption,
                    xAxis: {
                        type: 'category',
                        data: labels,
                        name: config.xAxisName || '',
                        nameTextStyle: { color: 'rgba(236,242,255,0.6)' },
                        axisLabel: { ...axisCommon.axisLabel, rotate: xRotate },
                        axisLine: axisCommon.axisLine,
                        axisTick: axisCommon.axisTick
                    },
                    yAxis: {
                        type: 'value',
                        name: config.yAxisName || '',
                        min: yMin,
                        max: yMax,
                        interval,
                        nameTextStyle: { color: 'rgba(236,242,255,0.6)' },
                        ...axisCommon
                    },
                    series: [barSeries]
                };
                break;
            case 'horizontalBar':
                option = {
                    ...baseOption,
                    xAxis: {
                        type: 'value',
                        name: config.yAxisName || '',
                        min: yMin,
                        max: yMax,
                        interval,
                        ...axisCommon
                    },
                    yAxis: {
                        type: 'category',
                        data: labels,
                        name: config.xAxisName || '',
                        axisLabel: { ...axisCommon.axisLabel },
                        axisLine: axisCommon.axisLine,
                        axisTick: axisCommon.axisTick
                    },
                    series: [{
                        ...barSeries,
                        itemStyle: {
                            color: this.createBarGradient(palette[0], palette[1], true),
                            borderRadius: [0, borderRadius, borderRadius, 0]
                        }
                    }]
                };
                break;
            case 'pie':
            case 'doughnut':
            case 'rose':
                option = {
                    ...baseOption,
                    legend: {
                        ...baseOption.legend,
                        ...((legendPosition === 'top' || legendPosition === 'bottom') ? {} : { orient: 'vertical' })
                    },
                    series: [{
                        type: 'pie',
                        roseType: type === 'rose' ? 'radius' : undefined,
                        radius: type === 'doughnut'
                            ? [`${Number(config.innerRadius) || 42}%`, '72%']
                            : (type === 'rose' ? ['20%', '74%'] : '72%'),
                        center: legendPosition === 'right'
                            ? ['34%', '58%']
                            : (legendPosition === 'left' ? ['66%', '58%'] : ['50%', '60%']),
                        avoidLabelOverlap: true,
                        label: {
                            show: showLabel || type === 'doughnut' || type === 'rose',
                            color: '#f6f8ff',
                            position: pieLabelPosition,
                            formatter: (params) => `${this.truncateText(params.name, 8)}\n${params.percent}%`
                        },
                        labelLayout: { hideOverlap: true, moveOverlap: 'shiftY' },
                        labelLine: { lineStyle: { color: 'rgba(255,255,255,0.18)' } },
                        itemStyle: {
                            borderColor: backgroundColor,
                            borderWidth: 4,
                            borderRadius
                        },
                        data
                    }]
                };
                break;
            case 'funnel':
                option = {
                    ...baseOption,
                    legend: { ...baseOption.legend, show: false },
                    series: [{
                        type: 'funnel',
                        left: '10%',
                        top: 72,
                        bottom: 24,
                        width: '80%',
                        min: 0,
                        max: Math.max(...values, 100),
                        sort: config.sortOrder === 'asc' ? 'ascending' : 'descending',
                        gap: 6,
                        label: {
                            show: true,
                            position: labelPosition === 'inside' ? 'inside' : 'right',
                            color: '#f6f8ff',
                            formatter: (params) => `${this.truncateText(params.name, 10)}  ${params.value}`
                        },
                        itemStyle: {
                            borderColor: backgroundColor,
                            borderWidth: 2,
                            borderRadius
                        },
                        data
                    }]
                };
                break;
            case 'treemap':
                option = {
                    ...baseOption,
                    legend: { ...baseOption.legend, show: false },
                    series: [{
                        type: 'treemap',
                        roam: false,
                        nodeClick: false,
                        breadcrumb: { show: false },
                        top: 68,
                        left: 14,
                        right: 14,
                        bottom: 14,
                        label: {
                            show: true,
                            formatter: (params) => this.truncateText(params.name, 10),
                            color: '#f6f8ff',
                            fontSize: 12
                        },
                        itemStyle: {
                            borderColor: 'rgba(8,14,28,0.92)',
                            borderWidth: 3,
                            gapWidth: 3,
                            borderRadius
                        },
                        data: data.map((item, index) => ({
                            ...item,
                            itemStyle: {
                                color: palette[index % palette.length]
                            }
                        }))
                    }]
                };
                break;
            case 'scatter':
                option = {
                    ...baseOption,
                    xAxis: {
                        type: 'category',
                        data: labels,
                        name: config.xAxisName || '',
                        axisLabel: { ...axisCommon.axisLabel, rotate: xRotate },
                        axisLine: axisCommon.axisLine,
                        axisTick: axisCommon.axisTick
                    },
                    yAxis: {
                        type: 'value',
                        name: config.yAxisName || '',
                        min: yMin,
                        max: yMax,
                        interval,
                        ...axisCommon
                    },
                    series: [{
                        ...lineSeries,
                        type: 'scatter',
                        symbolSize,
                        itemStyle: {
                            color: palette[0],
                            shadowBlur: 20,
                            shadowColor: `${palette[0]}55`
                        }
                    }]
                };
                break;
            case 'radar':
                option = {
                    ...baseOption,
                    legend: { ...baseOption.legend, show: showLegend, top: 18 },
                    radar: {
                        center: ['50%', '58%'],
                        radius: '62%',
                        splitNumber: 5,
                        axisName: { color: 'rgba(236,242,255,0.76)' },
                        splitLine: { lineStyle: { color: ['rgba(255,255,255,0.06)'] } },
                        splitArea: { areaStyle: { color: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.03)'] } },
                        indicator: data.slice(0, 6).map(item => ({
                            name: item.name,
                            max: Math.max(...values, 100)
                        }))
                    },
                    series: [{
                        type: 'radar',
                        areaStyle: { color: this.createAreaGradient(palette[0], opacity) },
                        lineStyle: { color: palette[0], width: 2 },
                        itemStyle: { color: palette[0] },
                        data: [{
                            value: values.slice(0, 6),
                            name: titleText
                        }]
                    }]
                };
                break;
            case 'gauge':
                option = {
                    ...baseOption,
                    series: [{
                        type: 'gauge',
                        center: ['50%', '58%'],
                        radius: '76%',
                        min: 0,
                        max: yMax || 100,
                        progress: { show: true, width: 16, itemStyle: { color: palette[0] } },
                        axisLine: { lineStyle: { width: 16, color: [[1, 'rgba(255,255,255,0.08)']] } },
                        pointer: { show: true, itemStyle: { color: palette[1] } },
                        axisTick: { show: false },
                        splitLine: { show: false },
                        axisLabel: { color: 'rgba(236,242,255,0.48)' },
                        detail: {
                            valueAnimation: true,
                            color: '#f6f8ff',
                            fontSize: 28,
                            formatter: '{value}'
                        },
                        title: { color: 'rgba(236,242,255,0.68)' },
                        data: [{ value: values[0] || 0, name: config.yAxisName || '完成度' }]
                    }]
                };
                break;
            default:
                option = {
                    ...baseOption,
                    xAxis: {
                        type: 'category',
                        data: labels,
                        axisLabel: { ...axisCommon.axisLabel, rotate: xRotate },
                        axisLine: axisCommon.axisLine,
                        axisTick: axisCommon.axisTick
                    },
                    yAxis: { type: 'value', ...axisCommon },
                    series: [lineSeries]
                };
        }

        chart.setOption(option, true);
        chart.resize();
    },

    createCardMarkup: function (data, config = {}) {
        const value = Number(data?.[0]?.value) || 0;
        const title = config.title || '核心指标';
        const subtitle = config.subtitle || '自动汇总';
        const color = config.color || '#7c5cff';
        const secondaryColor = config.secondaryColor || '#20c5ff';

        return `
            <div class="metric-card" style="padding:24px;display:flex;flex-direction:column;justify-content:center;gap:14px;background:linear-gradient(135deg, ${color}22, ${secondaryColor}16);overflow:hidden;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
                    <div style="min-width:0;flex:1 1 auto;">
                        <div style="font-size:14px;color:rgba(236,242,255,0.72);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.escapeHtml(title)}</div>
                        <div style="margin-top:4px;font-size:12px;color:rgba(236,242,255,0.46);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.escapeHtml(subtitle)}</div>
                    </div>
                    <div style="width:42px;height:42px;border-radius:14px;background:${color}22;display:flex;align-items:center;justify-content:center;color:${color};font-size:20px;">✦</div>
                </div>
                <div style="font-size:40px;font-weight:700;color:#f8fbff;line-height:1;">${value}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:12px;color:rgba(236,242,255,0.58);">
                    <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">较上周期 +12.8%</span>
                    <span style="color:${secondaryColor};white-space:nowrap;">智能推荐</span>
                </div>
            </div>
        `;
    },

    createTableMarkup: function (data, config = {}) {
        const title = config.title || '明细数据表';
        const subtitle = config.subtitle || '最近 8 条记录';
        const color = config.color || '#7c5cff';
        const background = config.background || '#0f1628';
        const rows = (data || []).map(item => `
            <tr>
                <td style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.escapeHtml(item.name || '-')}</td>
                <td style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.escapeHtml(item.value ?? '-')}</td>
                <td><span style="display:inline-flex;padding:2px 10px;border-radius:999px;background:${color}22;color:${color};font-size:12px;">${this.escapeHtml(item.status || '正常')}</span></td>
            </tr>
        `).join('');

        return `
            <div class="chart-table" style="padding:18px 16px;background:${background};overflow:auto;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px;">
                    <div style="min-width:0;flex:1 1 auto;">
                        <div style="font-size:15px;font-weight:600;color:#f7f9ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.escapeHtml(title)}</div>
                        <div style="margin-top:4px;font-size:12px;color:rgba(236,242,255,0.54);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.escapeHtml(subtitle)}</div>
                    </div>
                    <div style="font-size:12px;color:${color};white-space:nowrap;">Live</div>
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:13px;color:#f6f8ff;table-layout:fixed;">
                    <thead>
                        <tr>
                            <th style="padding:10px 8px;text-align:left;color:rgba(236,242,255,0.56);border-bottom:1px solid rgba(255,255,255,0.08);">名称</th>
                            <th style="padding:10px 8px;text-align:left;color:rgba(236,242,255,0.56);border-bottom:1px solid rgba(255,255,255,0.08);">数值</th>
                            <th style="padding:10px 8px;text-align:left;color:rgba(236,242,255,0.56);border-bottom:1px solid rgba(255,255,255,0.08);">状态</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    },

    createAreaGradient: function (color, opacity) {
        return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `${color}${this.alphaHex(Math.max(0.15, opacity * 0.7))}` },
            { offset: 1, color: `${color}00` }
        ]);
    },

    createBarGradient: function (colorA, colorB, horizontal = false) {
        return new echarts.graphic.LinearGradient(horizontal ? 0 : 0, horizontal ? 0 : 0, horizontal ? 1 : 0, horizontal ? 0 : 1, [
            { offset: 0, color: colorA },
            { offset: 1, color: colorB }
        ]);
    },

    alphaHex: function (alpha) {
        const safe = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
        return safe.toString(16).padStart(2, '0');
    },
    truncateText: function (value, limit = 12) {
        const text = String(value ?? '');
        return text.length > limit ? `${text.slice(0, limit)}…` : text;
    },

    escapeHtml: function (value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    destroyChart: function (domId) {
        if (this.observers[domId]) {
            this.observers[domId].disconnect();
            delete this.observers[domId];
        }
        if (this.instances[domId]) {
            this.instances[domId].dispose();
            delete this.instances[domId];
        }
    },

    resizeAll: function () {
        Object.keys(this.instances).forEach((key) => {
            const chart = this.instances[key];
            if (chart && typeof chart.resize === 'function') chart.resize();
        });
    }
};

window.ChartManager = ChartManager;
