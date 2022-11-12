import Runner from '../src/runner';
import Task from '../src/task';

const wait = (timeout = 1) => new Promise((resolve) => setTimeout(resolve, timeout));

test('基本用法', async () => {
    const task1 = new Task(async (runner, input: string) => {
        await wait();
        runner.stashSuccess('成功了，注意下结果，呵呵');
        return input + '1';
    });
    const task2 = new Task((runner, input: string) => {
        runner.stashWarning('警告一下1/2');
        runner.stashWarning('警告一下2/2');
        return input + '2';
    });
    const task31 = new Task((runner1, input: string) => {
        return input + '1/3';
    });
    const task32 = new Task((runner1, input: string) => {
        return input + '2/3';
    });
    const task33 = new Task((runner1, input: string) => {
        return input + '3/3';
    });

    const runner = new Runner();
    runner.step('第1步', undefined, task1);
    runner.step('第2步', task2);
    runner.step('第3步', task31, task32, task33);
    const output = await runner.start<string>('');

    expect(output).toEqual('121/32/33/3');
});

test('错误情况', async () => {
    const task1 = new Task(() => {
        throw new Error('哈哈');
    });
    const task2 = new Task(() => {
        throw new Error('嘻嘻');
    });
    const runner = new Runner();

    runner.step('错误情况', task1, task2);

    await expect(runner.start()).rejects.toThrow('哈哈');
});

interface Context {
    a?: number;
    b?: number;
    c?: number;
}

test('上下文注入', async () => {
    const context: Context = { c: 4 };
    const task1 = new Task(() => {
        context.a = 1;
    });
    const task2 = new Task(() => {
        context.a = 2;
    });
    const task3 = new Task(() => {
        context.b = 3;
    });

    const runner = new Runner();
    runner.step('上下文注入a', task1, task2);
    runner.step('上下文注入b', task3);
    await runner.start();
    expect(context.a).toBe(2);
    expect(context.b).toBe(3);
    expect(context.c).toBe(4);
});

test('前后置钩子', async () => {
    const task1 = new Task((runner, input: string) => {
        return input + '1';
    });
    const task2 = new Task((runner, input: string) => {
        return input + '2';
    });
    const task3 = new Task((runner, input: string) => {
        return input + '3';
    });
    const hook1 = new Task((runner, input: string) => {
        return input + 'x';
    });
    const hook2 = new Task((runner, input: string) => {
        return input + 'y';
    });
    const hook3 = new Task((runner, input: string) => {
        return input + 'z';
    });

    const runner = new Runner();
    runner.step('第1步', undefined, task1);
    runner.step('第2步', task2);
    runner.step('第3步', task3);
    runner.before('第1步', hook1, hook2);
    runner.after('第2步', hook3);

    const output = await runner.start<string>('');

    expect(output).toEqual('xy12z3');
});

test('动态增加步骤和钩子', async () => {
    const task1 = new Task((runner, input: string) => {
        return input + '1';
    });

    const task2 = new Task((runner, input: string) => {
        runner.step('step3', task3_1, task3_2);
        runner.before('step3', hook3_1);
        runner.after('step3', hook3_2);
        return input + '2';
    });

    const task3_1 = new Task((runner, input: string) => {
        runner.after('step3', hook3_3);
        return input + 'x';
    });
    const task3_2 = new Task((runner, input: string) => {
        runner.step('step4', task4_1, task4_2);
        return input + 'y';
    });
    const hook3_1 = new Task((runner, input: string) => {
        return input + 'A';
    });
    const hook3_2 = new Task((runner, input: string) => {
        return input + 'B';
    });
    const hook3_3 = new Task((runner, input: string) => {
        return input + 'C';
    });

    const task4_1 = new Task((runner, input: string) => {
        return input + 'a';
    });
    const task4_2 = new Task((runner, input: string) => {
        return input + 'b';
    });

    const runner = new Runner();

    runner.step('step1', task1);
    runner.step('step2', task2);

    const output = await runner.start<string>('');

    expect(output).toEqual('12AxyBCab');
});

test('边界：任务正在运行', async () => {
    const task = new Task(async () => {
        await wait(10);
    });
    const runner = new Runner();
    const fn = jest.fn();

    void task.exec(runner).then().catch();
    task.exec(runner)
        .then()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        .catch((err: Error) => fn(err));

    await wait(1);
    expect(fn).toBeCalled();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fn.mock.calls[0][0].message).toEqual('任务正在运行，无法再次运行');
});

test('边界：任务已停止', async () => {
    const task = new Task(async () => {
        await wait(1);
    });
    const runner = new Runner();
    const fn = jest.fn();

    void task.exec(runner).then().catch();

    await wait(100);
    task.exec(runner)
        .then()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        .catch((err: Error) => fn(err));

    await wait(1);
    expect(fn).toBeCalled();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fn.mock.calls[0][0].message).toEqual('任务已经停止，无法再次运行');
});

test('边界：重复步骤', () => {
    const runner = new Runner();

    runner.step('abc');

    expect(() => runner.step('abc')).toThrow('步骤已存在');
});

test('边界：缺失步骤增加钩子', () => {
    const runner = new Runner();

    runner.step('abc');

    expect(() => runner.before('def')).toThrow('步骤不存在');
    expect(() => runner.after('xyz')).toThrow('步骤不存在');
});

test('边界：运行器停止后增加步骤/钩子', async () => {
    const task = new Task();
    const runner = new Runner();

    runner.step('a', task);
    await runner.start();

    expect(() => runner.step('b', task)).toThrow('运行器已运行结束，无法再增加步骤');
    expect(() => runner.before('a', task)).toThrow('运行器已运行结束，无法再增加前置钩子');
    expect(() => runner.after('a', task)).toThrow('运行器已运行结束，无法再增加后置钩子');
});

test('边界：步骤停止后增加钩子', async () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    const fn3 = jest.fn();
    const task1 = new Task();
    const task2 = new Task(() => {
        try {
            runner.before('a', task1);
        } catch (err) {
            fn1(err);
        }

        try {
            runner.after('a', task1);
        } catch (err) {
            fn2(err);
        }

        try {
            runner.before('b', task1);
        } catch (err) {
            fn3(err);
        }
    });
    const runner = new Runner();

    runner.step('a', task1);
    runner.step('b', task2);
    await runner.start();

    expect(fn1).toBeCalled();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fn1.mock.calls[0][0].message).toEqual('“a”步骤已运行结束，无法添加前置钩子');

    expect(fn2).toBeCalled();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fn2.mock.calls[0][0].message).toEqual('“a”步骤已运行结束，无法添加后置钩子');

    expect(fn3).toBeCalled();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fn3.mock.calls[0][0].message).toEqual('“b”步骤正在运行，无法添加前置钩子');
});

test('边界：运行中再启动', async () => {
    const task = new Task();
    const runner = new Runner();
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    runner.step('a', task);
    // eslint-disable-next-line jest/valid-expect-in-promise
    void runner.start().then(() => {
        runner.start().then().catch(fn1);
    });

    runner.start().then().catch(fn2);

    await wait(10);

    expect(fn1).toBeCalled();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fn1.mock.calls[0][0].message).toEqual('运行器已运行结束，无法再次启动');

    expect(fn2).toBeCalled();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fn2.mock.calls[0][0].message).toEqual('运行器正在运行，无法再次启动');
});
