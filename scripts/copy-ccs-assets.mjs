import { cp, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packageDirectory = resolve(rootDirectory, 'node_modules/ccs-frontend/dist/ccs')
const javascriptSource = resolve(packageDirectory, 'ccs-frontend.min.js')
const javascriptDestination = resolve(rootDirectory, 'app/assets/javascripts/ccs-frontend.min.js')
const jquerySource = resolve(rootDirectory, 'node_modules/jquery/dist/jquery.min.js')
const jqueryDestination = resolve(rootDirectory, 'app/assets/javascripts/jquery.min.js')
const jquerySourceMap = resolve(rootDirectory, 'node_modules/jquery/dist/jquery.min.map')
const jqueryDestinationMap = resolve(rootDirectory, 'app/assets/javascripts/jquery.min.map')
const imagesSource = resolve(packageDirectory, 'assets/images')
const imagesDestination = resolve(rootDirectory, 'app/assets/images')
const componentsSource = resolve(packageDirectory, 'components')
const componentsDestination = resolve(rootDirectory, 'app/views/components/ccs')

await mkdir(dirname(javascriptDestination), { recursive: true })
await cp(javascriptSource, javascriptDestination)
await cp(`${javascriptSource}.map`, `${javascriptDestination}.map`)
await cp(jquerySource, jqueryDestination)
await cp(jquerySourceMap, jqueryDestinationMap)
await mkdir(imagesDestination, { recursive: true })
await cp(imagesSource, imagesDestination, { recursive: true })
await cp(componentsSource, componentsDestination, { recursive: true })