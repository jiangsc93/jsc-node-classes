import Runner from './runner';

type TaskFunc = (this: Task, runner: Runner, input: any) => Promise<any> | any;
enum TaskStatus {
    ready,
    running,
    stoped
}

export default class Task {
    private func: TaskFunc;
    private status: TaskStatus;
    constructor(func?: TaskFunc) {
        this.func = async (runner, input: any) => Promise.resolve(input);
        this.status = TaskStatus.ready;

        if (func) this.do(func);
    }

    do(func: TaskFunc) {
        this.func = func.bind(this);
        return this;
    }

    async exec(runner: Runner, input?: any): Promise<any> {
        if (this.status === TaskStatus.running) {
            throw new Error('任务正在运行，无法再次运行');
        }

        if (this.status === TaskStatus.stoped) {
            throw new Error('任务已经停止，无法再次运行');
        }

        this.status = TaskStatus.running;

        try {
            return (await this.func(runner, input)) as Promise<any>;
        } finally {
            this.status = TaskStatus.stoped;
        }
    }
}
