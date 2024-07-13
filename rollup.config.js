import url from '@rollup/plugin-url'
import svgr from '@svgr/rollup'

export default {
    plugins: [url(), svgr({ icon: true })],
    input: 'src/main.js',
    output: {
        file: 'bundle.js',
        format: 'cjs',
    },
}