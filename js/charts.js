/**
 * 模块：图表渲染器
 * 原理：封装 ECharts 的复杂配置，对外暴露简单的API (门面模式)
 */
const ChartFactory = {
    // 渲染折线图
    renderLine: function(containerDom, validatedData) {
        // 基于准备好的 DOM 初始化 echarts 实例
        let myChart = echarts.init(containerDom);

        // 拆分出 X 轴和 Y 轴数据
        let xData = validatedData.map(d => d.name);

        // 重点：基于 Validator 打的标签，对异常数据进行 ECharts 的视觉高亮配置 (VisualMap/ItemStyle)
        let seriesData = validatedData.map(d => {
            if (d._isError) return { value: 0, itemStyle: { color: 'red' }}; // 错误置零标红
            if (d._isWarning) return { value: d.value, itemStyle: { color: '#faad14', borderColor: 'red', borderWidth: 2 }, symbolSize: 12 }; // 异常放大标黄
            return d.value; // 正常数据
        });

        // ECharts 选项配置
        let option = {
            title: { text: '趋势折线图', textStyle: { fontSize: 14 } },
            tooltip: { trigger: 'axis' }, // 鼠标悬浮提示
            xAxis: { type: 'category', data: xData },
            yAxis: { type: 'value' },
            series: [{
                data: seriesData,
                type: 'line',
                smooth: true,
                markPoint: { data: [{ type: 'max', name: '最大值' }, { type: 'min', name: '最小值' }] }
            }]
        };
        myChart.setOption(option);
        return myChart;
    },

    // 渲染积木指标卡
    renderCard: function(containerDom, validatedData) {
        // 计算总和作为核心指标
        let total = validatedData.reduce((sum, item) => sum + (typeof item.value==='number'?item.value:0), 0);

        // 直接使用 DOM 操作渲染积木卡片 (无需 ECharts)
        containerDom.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <div style="font-size: 14px; color: #666;">核心数据总览</div>
                <div style="font-size: 36px; font-weight: bold; color: var(--primary-color); margin: 10px 0;">
                    ${total.toLocaleString()}
                </div>
            </div>
        `;
    }
};