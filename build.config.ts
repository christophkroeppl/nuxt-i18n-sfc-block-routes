import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  declaration: true,
  entries: ['src/module'],
  rollup: {
    emitCJS: false,
  },
})
