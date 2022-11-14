'use strict';

var TaskStatus;
(function (TaskStatus) {
    TaskStatus[TaskStatus["ready"] = 0] = "ready";
    TaskStatus[TaskStatus["running"] = 1] = "running";
    TaskStatus[TaskStatus["stoped"] = 2] = "stoped";
})(TaskStatus || (TaskStatus = {}));
class Task {
    constructor(func) {
        this.func = async (runner, input) => Promise.resolve(input);
        this.status = TaskStatus.ready;
        if (func)
            this.do(func);
    }
    do(func) {
        this.func = func.bind(this);
        return this;
    }
    async exec(runner, input) {
        if (this.status === TaskStatus.running) {
            throw new Error('任务正在运行，无法再次运行');
        }
        if (this.status === TaskStatus.stoped) {
            throw new Error('任务已经停止，无法再次运行');
        }
        this.status = TaskStatus.running;
        try {
            return (await this.func(runner, input));
        }
        finally {
            this.status = TaskStatus.stoped;
        }
    }
}

module.exports = Task;
