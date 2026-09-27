import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import prettier from 'prettier'

const path = new URL('./momenia-love-express-fixed-v8.json', import.meta.url)
const template = JSON.parse(readFileSync(path, 'utf8'))
const fields = template.schema.fields
const section = template.sectionTypes.game_section
const poster = template.sectionTypes.poster_section

assert.equal(template.name, 'Love Express V8 — Moonlit Journey')
assert.ok(fields.length > 0)
assert.ok(fields.every((field) => field.type !== 'image'), 'asset fields must not be editable')
assert.ok(fields.every((field) => field.key !== 'bgm_url'), 'music asset must not be editable')
assert.ok(fields.some((field) => field.key === 'event_end_time'))
assert.ok(fields.some((field) => field.key === 'venue_address'))
assert.ok(fields.some((field) => field.key === 'invitation_message'))
assert.doesNotMatch(
  Object.values(template.sectionTypes).map((value) => value.html).join('\n'),
  /\{\{(?:hero_|tile_|flag_|location_marker|lamp_post|coin_heart|door_finish|bg_hills|rawa|lantern_|bird_|bride_photo|groom_photo|couple_photo|desktop_background|bgm_url)/,
  'asset placeholders must be replaced with embedded URLs',
)
assert.match(section.html, /class="s-game_section__calendar js-calendar"/)
assert.match(section.html, /data-field="event_end_time"/)
assert.match(poster.js, /querySelector\('\.s-poster_section'\)/)
assert.doesNotMatch(poster.js, /querySelector\('\.s-game_section'\)/)
assert.ok(
  (section.js.match(/drawGroundedSprite\s*\(/g) ?? []).length >= 4,
  'lamp, flags, and finish door must share one grounded-sprite baseline helper',
)
assert.match(section.js, /PROP_GROUND_Y=GROUND\+14/)
assert.match(section.js, /HERO_DRAW=\{w:84,h:84,ox:-31,oy:-20\}/)
assert.match(section.js, /drawGroundedSprite\(IMG\.lamp_post,[^;]+,106,106,4\)/)
assert.match(section.js, /drawGroundedSprite\(im,[^;]+,88,88,5\)/)
assert.match(section.js, /drawGroundedSprite\(IMG\.door_finish,[^;]+,145,145,17\)/)
assert.match(section.js, /function drawLock\(x,y\)/)
assert.match(section.js, /drawLock\(door\.x-cam,door\.baseY-60\)/)
assert.doesNotMatch(section.js, /fillText\([^;]+door\.x-cam/)
assert.match(section.js, /markerY=f\.baseY-160[^;]+;draw\(IMG\.location_marker,[^;]+,markerY,28,30\)/)
assert.match(section.js, /draw\(im,xx-cam\*0\.55,yy,76\*l\.s,76\*l\.s\)/)
assert.match(section.js, /draw\(im,b\.x-cam\*0\.62,[^;]+,72\*b\.s,72\*b\.s\)/)

await Promise.all(
  Object.values(template.sectionTypes).flatMap((value) => [
    prettier.format(value.html, { parser: 'html' }),
    prettier.format(value.css, { parser: 'css' }),
    prettier.format(value.js, { parser: 'babel' }),
  ]),
)

const calendarCode = section.js.split('/* calendar:start */')[1]?.split('/* calendar:end */')[0]
assert.ok(calendarCode, 'calendar builder must be independently testable')
const values = {
  bride_name: 'Rina Astuti',
  groom_name: 'Budi Santoso',
  event_date: '2026-12-20',
  event_time: '15:00',
  event_end_time: '18:00',
  event_timezone: 'WIB',
  venue_name: 'Gedung Balai Kartini',
  venue_address: 'Jakarta Selatan',
  invitation_message: 'Kami menanti kehadiran Anda.',
}
const root = {
  querySelector(selector) {
    const key = selector.match(/data-field="([^"]+)"/)?.[1]
    return key ? { textContent: values[key] ?? '' } : null
  },
}
const makeCalendarUrl = new Function('root', calendarCode + '\nreturn buildCalendarUrl;')(root)
const calendar = new URL(makeCalendarUrl())
assert.equal(calendar.origin, 'https://calendar.google.com')
assert.equal(calendar.searchParams.get('action'), 'TEMPLATE')
assert.equal(calendar.searchParams.get('dates'), '20261220T080000Z/20261220T110000Z')
assert.equal(calendar.searchParams.get('stz'), 'Asia/Jakarta')
assert.match(calendar.searchParams.get('text'), /Budi Santoso & Rina Astuti/)
assert.match(calendar.searchParams.get('location'), /Jakarta Selatan/)
assert.match(calendar.searchParams.get('details'), /Kami menanti kehadiran Anda/)

console.log('Love Express v8 schema, markup, and calendar checks passed')
