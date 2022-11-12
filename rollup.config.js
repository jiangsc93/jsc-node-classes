import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/index.ts',
    output: [
        { dir: '.', format: 'cjs', entryFileNames: '[name].js', preserveModules: true, preserveModulesRoot: 'src' },
        { dir: '.', format: 'esm', entryFileNames: '[name].mjs', preserveModules: true, preserveModulesRoot: 'src' }
    ],
    plugins: [
        commonjs(),
        json(),
        typescript({
            tsconfig: 'tsconfig.json',
            include: ['src/**/*.ts']
        })
    ]
};
