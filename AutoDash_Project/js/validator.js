/**
 * 模块：数据校验与清洗器
 * 原理：遍历数据集，执行一系列校验规则。
 */
const Validator = {
    // 核心校验方法
    analyze: function(dataArray) {
        let errors = [];
        let cleanData = [];

        // 如果数据不是数组，直接抛出严重格式错误
        if (!Array.isArray(dataArray)) {
            return { valid: false, data: [], errors: ["数据格式错误：必须是 JSON 数组"] };
        }

        // 简单的统计学异常检测：计算平均值
        let sum = 0, count = 0;
        dataArray.forEach(item => {
            if (typeof item.value === 'number') { sum += item.value; count++; }
        });
        let avg = count > 0 ? sum / count : 0;

        // 逐条扫描规则
        dataArray.forEach((item, index) => {
            let clonedItem = { ...item }; // 保护原数据，深拷贝

            // 规则1：缺失值检测
            if (item.value === undefined || item.value === null || item.value === '') {
                errors.push(`第 ${index + 1} 行 (${item.name}) 缺失数值。`);
                clonedItem._isError = true;
            }
            // 规则2：类型/格式错误检测 (例如不小心输入了字符串 "100元" 而不是数字 100)
            else if (typeof item.value !== 'number') {
                errors.push(`第 ${index + 1} 行 (${item.name}) 数据格式错误，期望数字。`);
                clonedItem._isError = true;
            }
            // 规则3：业务逻辑越界/异常检测 (假设超过均值3倍属于录入错误)
            else if (avg > 0 && item.value > avg * 3) {
                errors.push(`第 ${index + 1} 行 (${item.name}) 数值(${item.value})异常，偏离均值过大。`);
                clonedItem._isWarning = true; // 标记为警告
            }

            cleanData.push(clonedItem);
        });

        return {
            valid: true,
            data: cleanData, // 返回打上标记的数据
            errors: errors
        };
    }
};