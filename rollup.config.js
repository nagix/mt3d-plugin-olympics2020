import fs from 'fs';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import image from '@rollup/plugin-image';
import json from '@rollup/plugin-json';
import {terser} from 'rollup-plugin-terser';
import strip from '@rollup/plugin-strip';

const pkg = JSON.parse(fs.readFileSync('package.json'));
const banner = `/*!
 * mt3d-plugin-olympics2020 v${pkg.version}
 * ${pkg.homepage}
 * (c) ${new Date().getFullYear()} ${pkg.author}
 * Released under the ${pkg.license} license
 */`;

export default [{
	input: 'src/index.js',
	output: {
		name: 'mt3dOlympics2020',
		file: `dist/${pkg.name}.js`,
		format: 'umd',
		indent: false,
		sourcemap: true,
		banner,
		globals: {
			'mini-tokyo-3d': 'mt3d'
		}
	},
	external: ['mini-tokyo-3d'],
	plugins: [
		resolve(),
		commonjs(),
		image(),
		json()
	]
}, {
	input: 'src/index.js',
	output: {
		name: 'mt3dOlympics2020',
		file: `dist/${pkg.name}.min.js`,
		format: 'umd',
		indent: false,
		sourcemap: true,
		banner,
		globals: {
			'mini-tokyo-3d': 'mt3d'
		}
	},
	external: ['mini-tokyo-3d'],
	plugins: [
		resolve(),
		commonjs(),
		image(),
		json(),
		terser({
			compress: {
				pure_getters: true,
				passes: 3
			}
		}),
		strip({
			sourceMap: true
		})
	]
}];
