import Events from 'jsc-classes/events';
import Logger from './logger.mjs';
import chalk from 'chalk';

var RunnerStatus;
(function (RunnerStatus) {
    RunnerStatus[RunnerStatus["ready"] = 0] = "ready";
    RunnerStatus[RunnerStatus["running"] = 1] = "running";
    RunnerStatus[RunnerStatus["stoped"] = 2] = "stoped";
})(RunnerStatus || (RunnerStatus = {}));
class Runner extends Events {
    constructor() {
        super();
        this._stepMap = new Map();
        this._stepList = [];
        this._logger = new Logger();
        this._stashSuccessMessageList = [];
        this._stashWarningMessageList = [];
        this._status = RunnerStatus.ready;
    }
    /**
     * 增加步骤，一个步骤可以是多个任务
     * @param {string} label
     * @param {Task | undefined} taskList
     * @returns {this}
     */
    step(label, ...taskList) {
        if (this._status === RunnerStatus.stoped) {
            throw new Error('运行器已运行结束，无法再增加步骤');
        }
        if (this._stepMap.get(label)) {
            throw new Error(`“${label}”步骤已存在，不能重复添加`);
        }
        const step = {
            index: this._stepList.length,
            label,
            taskList,
            beforeHookList: [],
            afterHookList: [],
            status: RunnerStatus.ready
        };
        this._stepMap.set(label, step);
        this._stepList.push(step);
        return this;
    }
    /**
     * 添加单个步骤的前置钩子
     * @param {string} label
     * @param {Task | undefined} hookList
     * @returns {this}
     */
    before(label, ...hookList) {
        if (this._status === RunnerStatus.stoped) {
            throw new Error('运行器已运行结束，无法再增加前置钩子');
        }
        const step = this._stepMap.get(label);
        if (!step) {
            throw new Error(`“${label}”步骤不存在，无法添加前置钩子`);
        }
        if (step.status === RunnerStatus.running) {
            throw new Error(`“${label}”步骤正在运行，无法添加前置钩子`);
        }
        if (step.status === RunnerStatus.stoped) {
            throw new Error(`“${label}”步骤已运行结束，无法添加前置钩子`);
        }
        step.beforeHookList.push(...hookList);
        return this;
    }
    /**
     * 添加单个步骤的后置钩子
     * @param {string} label
     * @param {Task | undefined} hookList
     * @returns {this}
     */
    after(label, ...hookList) {
        if (this._status === RunnerStatus.stoped) {
            throw new Error('运行器已运行结束，无法再增加后置钩子');
        }
        const step = this._stepMap.get(label);
        if (!step) {
            throw new Error(`“${label}”步骤不存在，无法添加后置钩子`);
        }
        if (step.status === RunnerStatus.stoped) {
            throw new Error(`“${label}”步骤已运行结束，无法添加后置钩子`);
        }
        step.afterHookList.push(...hookList);
        return this;
    }
    async _callHook(hookList, input) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        let prev = input;
        for (let k = 0; k < hookList.length; k++) {
            const hook = hookList[k];
            if (!hook)
                continue;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            prev = await hook.exec(this, prev);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return prev;
    }
    /**
     * 暂存成功消息，再任务完成之后打印
     * @param {string} message
     * @returns {this}
     */
    stashSuccess(message) {
        this._stashSuccessMessageList.push(message);
        return this;
    }
    /**
     * 暂存警告消息，再任务完成之后打印
     * @param {string} message
     * @returns {this}
     */
    stashWarning(message) {
        this._stashWarningMessageList.push(message);
        return this;
    }
    /**
     * 启动
     * @param [input]
     * @returns {Promise<any>}
     */
    async start(input) {
        if (this._status === RunnerStatus.running) {
            throw new Error('运行器正在运行，无法再次启动');
        }
        if (this._status === RunnerStatus.stoped) {
            throw new Error('运行器已运行结束，无法再次启动');
        }
        this._status = RunnerStatus.running;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        let prev = input;
        this.emit('runner:start');
        for (let i = 0; i < this._stepList.length; i++) {
            const maxLength = String(this._stepList.length).length;
            const step = this._stepList[i];
            const { label, taskList, beforeHookList, afterHookList } = step;
            const { length: taskLength } = taskList;
            const stepNo = i + 1;
            const stepLabel = String(stepNo).padStart(maxLength, '0');
            step.status = RunnerStatus.running;
            this.emit('step:start', step);
            console.log(chalk.magenta.bold('[%s/%s]'), stepLabel, this._stepList.length, chalk.greenBright(label));
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            prev = await this._callHook(beforeHookList, prev);
            for (let j = 0; j < taskLength; j++) {
                const task = taskList[j];
                if (!task)
                    continue;
                try {
                    this.emit('task:start', task);
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    prev = await task.exec(this, prev);
                }
                catch (err) {
                    step.status = RunnerStatus.stoped;
                    this.emit('task:end', task);
                    this.emit('task:error', task, err);
                    this.emit('step:end', step);
                    this.emit('step:error', step, err);
                    this.emit('runner:end');
                    this.emit('runner:error', err);
                    throw err;
                }
                this.emit('task:end', task);
                this.emit('task:success', task);
            }
            step.status = RunnerStatus.stoped;
            this.emit('step:end', step);
            this.emit('step:success', step);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            prev = await this._callHook(afterHookList, prev);
        }
        this._status = RunnerStatus.stoped;
        this.emit('runner:end');
        this.emit('runner:success');
        this._stashSuccessMessageList.forEach((message) => {
            this._logger.info(message);
        });
        this._stashWarningMessageList.forEach((message) => {
            this._logger.warn(message);
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return prev;
    }
}

export { Runner as default };
