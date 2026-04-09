/**
 * 模块：AI Agent 自然语言解析器
 * 真实场景下这里会 fetch 请求大模型的 API。
 * 当前在本地使用正则表达式提取用户的意图(Intent)和实体(Entity)。
 */
const Agent = {
    parseCommand: function(text) {
        let command = {
            action: 'render',
            chartTypes: [],
            needsValidation: false
        };

        // 意图识别：如果包含特定关键词，则推断需要渲染对应的图表
        if (text.includes("折线") || text.includes("趋势")) {
            command.chartTypes.push("line");
        }
        if (text.includes("积木") || text.includes("卡片") || text.includes("指标")) {
            command.chartTypes.push("card");
        }
        // 如果啥都没匹配到，默认画个折线图
        if (command.chartTypes.length === 0) {
            command.chartTypes.push("line");
        }

        // 实体识别：是否需要纠错
        if (text.includes("异常") || text.includes("高亮") || text.includes("纠错")) {
            command.needsValidation = true;
        }

        return command;
    }
};

window.Agent = Agent;

