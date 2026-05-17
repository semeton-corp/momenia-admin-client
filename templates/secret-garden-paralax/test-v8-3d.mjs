import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import prettier from 'prettier'

const file = process.argv[2] ?? new URL('./secret-garden-parallax-template-v8-3d.json', import.meta.url)
const template = JSON.parse(readFileSync(file, 'utf8'))
const base = JSON.parse(readFileSync(new URL('./secret-garden-parallax-template-v8.json', import.meta.url), 'utf8'))
const section = template.sectionTypes.garden_parallax_section

assert.deepEqual(template.schema, base.schema, '3D version must preserve uploaded asset fields')
const story = section.html.match(/<section class="sgp__scene sgp__scene--story[\s\S]*?<\/section>/)?.[0]
assert.ok(story?.includes('data-field-img="bg_scene_lake_sunrise"'), 'story must show a garden vista instead of the opaque green arch background')
assert.ok(['top', 'left', 'right', 'bottom'].every((part) => story.includes(`sgp__storyArch--${part}`)), 'story must keep the floral arch around its clear opening')
assert.ok(['top', 'left', 'right', 'bottom'].every((part) => section.css.includes(`.sgp__storyArch--${part}{clip-path:inset(`)), 'each arch piece must be cropped to leave the center open')
assert.ok(section.html.includes('js-journey-veil'), 'chapter seam veil is required')
assert.ok(section.html.includes('Masuk ke taman'), 'garden entry button is required')
await Promise.all([
  prettier.format(section.html, { parser: 'html' }),
  prettier.format(section.css, { parser: 'css' }),
  prettier.format(section.js, { parser: 'babel' }),
])

const cameraBody = section.js.split('function paintCamera(){')[1]?.split('  function scheduleCamera()')[0]
assert.ok(cameraBody, 'scroll-driven 3D camera is required')
const runCamera = new Function(
  'scenes', 'scroller', 'motionQuery', 'veil',
  `let cameraFrame=1;function paintCamera(){${cameraBody}paintCamera();`,
)
const scene = (top) => {
  const bg = { style: { transform: 'old' } }
  const near = { style: { transform: 'old' } }
  return {
    bg, near,
    querySelector: (selector) => selector === '.sgp__sceneBg' ? bg : near,
    getBoundingClientRect: () => ({ top, height: 100 }),
  }
}

const departing = scene(-50)
const arriving = scene(50)
const veil = { style: {} }
runCamera([departing, arriving], { clientHeight: 100 }, { matches: false }, veil)
assert.match(departing.bg.style.transform, /90px/)
assert.match(departing.near.style.transform, /160px/)
assert.match(arriving.bg.style.transform, /-90px/)
assert.match(arriving.near.style.transform, /-160px/)
assert.equal(veil.style.opacity, '0.860')

runCamera([departing, arriving], { clientHeight: 100 }, { matches: true }, veil)
assert.equal(departing.bg.style.transform, '')
assert.equal(arriving.near.style.transform, '')
assert.equal(veil.style.opacity, '0')

console.log('v8 3D import and camera checks passed')
