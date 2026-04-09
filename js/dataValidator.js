/**
 * 模块：数据校验与异常纠错引擎
 * 原理：利用 3-Sigma 原则检测正态分布数据中的极端离群值。
 */
const DataValidator = {
    checkData: function(dataArray) {
        if (!dataArray || dataArray.length === 0) return { valid: false, logs: ["数据集为空"] };
        let logs = [];
        let cleanData = [];

        // 提取所有数值用于计算统计量
        let values = dataArray.map(d => parseFloat(d.value)).filter(v => !isNaN(v));
        let mean = 0, stdDev = 0;

        if (values.length > 0) {
            mean = values.reduce((a, b) => a + b) / values.length;
            stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);
        }

        dataArray.forEach((item, i) => {
            let row = { ...item };
            // 1. 缺失值检测
            if (row.value === undefined || row.value === "") {
                logs.push(`[行${i+1}] ${row.name} 缺失数据`);
                row._isError = true;
                row.value = 0; // 默认补零
            }
            // 2. 格式错误
            else if (isNaN(parseFloat(row.value))) {
                logs.push(`[行${i+1}] ${row.name} 格式错误，无法转为数字`);
                row._isError = true;
                row.value = 0;
            }
            // 3. 3σ 异常值检测 (超过均值±3倍标准差)
            else {
                row.value = parseFloat(row.value);
                if (stdDev > 0 && Math.abs(row.value - mean) > 3 * stdDev) {
                    logs.push(`[行${i+1}] ${row.name} 触发 3σ 异常，值(${row.value})偏离群体`);
                    row._isWarning = true;
                }
            }
            cleanData.push(row);
        });

        return { valid: true, data: cleanData, logs };
    }
};