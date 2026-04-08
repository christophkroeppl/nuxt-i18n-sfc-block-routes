import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  declaration: true,
  entries: ['src/module'],
  externals: ['vue/compiler-sfc'],
  failOnWarn: false,
  rollup: {
    emitCJS: false,
  },
})
