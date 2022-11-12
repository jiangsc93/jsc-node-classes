import Logger from '../src/logger';

test('默认', () => {
    const logger = new Logger();

    const log1 = logger.debug('abc');
    expect(log1).toBe('DEBUG abc');

    const log2 = logger.log('def');
    expect(log2).toBe('LOG def');

    const log3 = logger.info('ghi');
    expect(log3).toBe('INFO ghi');

    const log4 = logger.warn('jkl');
    expect(log4).toBe('WARN jkl');

    const log5 = logger.error('mno: %s %d', 'pq', 123);
    expect(log5).toBe('ERROR mno: pq 123');
});

test('指定 namespace', () => {
    const logger = new Logger({
        namespace: 'node-classes'
    });

    const log = logger.debug('abc');

    expect(log).toBe('[node-classes] DEBUG abc');
});

test('指定 level = debug', () => {
    const logger = new Logger({
        namespace: 'node-classes',
        level: 'debug'
    });

    const log1 = logger.debug('abc');
    expect(log1).toBe('[node-classes] DEBUG abc');

    const log2 = logger.log('abc');
    expect(log2).toBe('[node-classes] LOG abc');

    const log3 = logger.info('abc');
    expect(log3).toBe('[node-classes] INFO abc');

    const log4 = logger.warn('abc');
    expect(log4).toBe('[node-classes] WARN abc');

    const log5 = logger.error('abc');
    expect(log5).toBe('[node-classes] ERROR abc');
});

test('指定 level = log', () => {
    const logger = new Logger({
        namespace: 'node-classes',
        level: 'log'
    });

    const log1 = logger.debug('abc');
    expect(log1).toBe(null);

    const log2 = logger.log('abc');
    expect(log2).toBe('[node-classes] LOG abc');

    const log3 = logger.info('abc');
    expect(log3).toBe('[node-classes] INFO abc');

    const log4 = logger.warn('abc');
    expect(log4).toBe('[node-classes] WARN abc');

    const log5 = logger.error('abc');
    expect(log5).toBe('[node-classes] ERROR abc');
});

test('指定 level = info', () => {
    const logger = new Logger({
        namespace: 'node-classes',
        level: 'info'
    });

    const log1 = logger.debug('abc');
    expect(log1).toBe(null);

    const log2 = logger.log('abc');
    expect(log2).toBe(null);

    const log3 = logger.info('abc');
    expect(log3).toBe('[node-classes] INFO abc');

    const log4 = logger.warn('abc');
    expect(log4).toBe('[node-classes] WARN abc');

    const log5 = logger.error('abc');
    expect(log5).toBe('[node-classes] ERROR abc');
});

test('指定 level = warn', () => {
    const logger = new Logger({
        namespace: 'node-classes',
        level: 'warn'
    });

    const log1 = logger.debug('abc');
    expect(log1).toBe(null);

    const log2 = logger.log('abc');
    expect(log2).toBe(null);

    const log3 = logger.info('abc');
    expect(log3).toBe(null);

    const log4 = logger.warn('abc');
    expect(log4).toBe('[node-classes] WARN abc');

    const log5 = logger.error('abc');
    expect(log5).toBe('[node-classes] ERROR abc');
});

test('指定 level = error', () => {
    const logger = new Logger({
        namespace: 'node-classes',
        level: 'error'
    });

    const log1 = logger.debug('abc');
    expect(log1).toBe(null);

    const log2 = logger.log('abc');
    expect(log2).toBe(null);

    const log3 = logger.info('abc');
    expect(log3).toBe(null);

    const log4 = logger.warn('abc');
    expect(log4).toBe(null);

    const log5 = logger.error('abc');
    expect(log5).toBe('[node-classes] ERROR abc');
});

test('long long message', () => {
    const logger = new Logger({
        namespace: 'my-blog'
    });

    const message = '这是一段很长很长的换，\n还带有换行的\n还带有换行的\n还带有换行的';
    const log1 = logger.error(message);
    // console.log(log1);
    expect(log1).toEqual(`[my-blog] ERROR ${message}`);
});
