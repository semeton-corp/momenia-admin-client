# Template Maker Examples

Quick copy-paste ready examples for building invitation templates.

## How to Use

1. In the **Template Maker** (Step 2), add section types via the FileTree
2. For each section, click "Load Example" in the respective editor, or copy-paste the code below
3. Adjust colors/styles as needed using the `theme.json` editor

---

## Theme (theme.json)

Copy this into the **theme.json** editor:

```json
{
  "color_primary": "#1a1a1a",
  "color_accent": "#d4af37",
  "color_background": "#ffffff",
  "font_title": "Playfair Display",
  "font_body": "Inter"
}
```

---

## Schema (schema.json)

Copy this into the **schema.json** editor:

```json
{
  "fields": [
    {
      "key": "headline",
      "label": "Nama Pasangan",
      "type": "text",
      "section": "hero_section",
      "required": true,
      "placeholder": "Budi & Rina"
    },
    {
      "key": "couple_photo",
      "label": "Foto Pasangan",
      "type": "image",
      "section": "cover_section",
      "required": false,
      "placeholder": "https://example.com/couple.jpg"
    },
    {
      "key": "bride_name",
      "label": "Nama Pengantin Wanita",
      "type": "text",
      "section": "couple_section",
      "required": true,
      "placeholder": "Rina Astuti"
    },
    {
      "key": "groom_name",
      "label": "Nama Pengantin Pria",
      "type": "text",
      "section": "couple_section",
      "required": true,
      "placeholder": "Budi Santoso"
    },
    {
      "key": "event_date",
      "label": "Tanggal Acara",
      "type": "date",
      "section": "details_section",
      "required": true
    },
    {
      "key": "event_time",
      "label": "Waktu Acara",
      "type": "time",
      "section": "details_section",
      "required": true
    },
    {
      "key": "venue_name",
      "label": "Nama Venue",
      "type": "text",
      "section": "details_section",
      "required": true,
      "placeholder": "Gedung Balai Kartini"
    }
  ]
}
```

---

## Section Types

### minimalist_cover (HTML)

For the **minimalist_cover** section, copy this HTML:

```html
<section class="min-cover">
  <div class="min-cover__bg">
    <img data-field-img="couple_photo" src="{{couple_photo}}" alt="" class="min-cover__img" />
    <div class="min-cover__overlay"></div>
  </div>
  <div class="min-cover__content">
    <h1 class="min-cover__title">{{headline}}</h1>
    <p class="min-cover__subtitle">Undangan Pernikahan</p>
    <button class="min-cover__btn">Buka Undangan →</button>
  </div>
</section>
```

And this CSS:

```css
.min-cover {
  position: relative;
  height: 812px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--color-primary);
  overflow: hidden;
}
.min-cover__bg {
  position: absolute;
  inset: 0;
}
.min-cover__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: brightness(0.5);
}
.min-cover__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}
.min-cover__content {
  position: relative;
  z-index: 10;
  color: var(--color-background);
  padding: 2rem;
}
.min-cover__title {
  font-family: var(--font-title);
  font-size: 3.5rem;
  font-weight: 300;
  margin-bottom: 1rem;
  line-height: 1.1;
}
.min-cover__subtitle {
  font-family: var(--font-body);
  font-size: 0.95rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.8;
  margin-bottom: 2.5rem;
}
.min-cover__btn {
  background: transparent;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  padding: 0.8rem 2rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
}
.min-cover__btn:hover {
  background: var(--color-accent);
  color: var(--color-primary);
}
```

And this JavaScript:

```javascript
(function() {
  var btn = document.querySelector('.min-cover__btn');
  if(btn) {
    btn.addEventListener('click', function() {
      window.__memoriaGoTo && window.__memoriaGoTo('main');
    });
  }
})();
```

---

### minimalist_hero (HTML)

For the **minimalist_hero** section, copy this HTML:

```html
<section class="min-hero">
  <div class="min-hero__content">
    <p class="min-hero__label">The Wedding of</p>
    <h1 class="min-hero__title">{{headline}}</h1>
    <div class="min-hero__divider"></div>
  </div>
</section>
```

And this CSS:

```css
.min-hero {
  padding: 6rem 2rem;
  background: var(--color-background);
  text-align: center;
}
.min-hero__content {
  max-width: 600px;
  margin: 0 auto;
}
.min-hero__label {
  font-family: var(--font-body);
  font-size: 0.9rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: 1.5rem;
}
.min-hero__title {
  font-family: var(--font-title);
  font-size: clamp(2rem, 8vw, 4rem);
  font-weight: 300;
  color: var(--color-primary);
  margin-bottom: 2rem;
  line-height: 1.2;
}
.min-hero__divider {
  width: 60px;
  height: 2px;
  background: var(--color-accent);
  margin: 0 auto;
}
```

---

### minimalist_couple (HTML)

For the **minimalist_couple** section, copy this HTML:

```html
<section class="min-couple">
  <div class="min-couple__container">
    <h2 class="min-couple__title">The Couple</h2>
    <div class="min-couple__grid">
      <div class="min-couple__person">
        <div class="min-couple__photo-frame">
          <img data-field-img="bride_photo" src="{{bride_photo}}" alt="" class="min-couple__photo" />
        </div>
        <h3 class="min-couple__name">{{bride_name}}</h3>
        <p class="min-couple__role">Mempelai Wanita</p>
      </div>
      <div class="min-couple__divider-v"></div>
      <div class="min-couple__person">
        <div class="min-couple__photo-frame">
          <img data-field-img="groom_photo" src="{{groom_photo}}" alt="" class="min-couple__photo" />
        </div>
        <h3 class="min-couple__name">{{groom_name}}</h3>
        <p class="min-couple__role">Mempelai Pria</p>
      </div>
    </div>
  </div>
</section>
```

And this CSS:

```css
.min-couple {
  padding: 5rem 2rem;
  background: var(--color-primary);
  color: var(--color-background);
}
.min-couple__container {
  max-width: 600px;
  margin: 0 auto;
}
.min-couple__title {
  font-family: var(--font-title);
  font-size: 2rem;
  font-weight: 300;
  text-align: center;
  margin-bottom: 3rem;
}
.min-couple__grid {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  flex-wrap: wrap;
}
.min-couple__person {
  flex: 1;
  min-width: 140px;
  text-align: center;
}
.min-couple__photo-frame {
  width: 160px;
  height: 160px;
  margin: 0 auto 1.5rem;
  border: 1px solid var(--color-accent);
  border-radius: 8px;
  overflow: hidden;
  background: #2a2a2a;
}
.min-couple__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.min-couple__name {
  font-family: var(--font-title);
  font-size: 1.3rem;
  font-weight: 400;
  margin-bottom: 0.5rem;
}
.min-couple__role {
  font-family: var(--font-body);
  font-size: 0.8rem;
  color: var(--color-accent);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
.min-couple__divider-v {
  width: 1px;
  height: 120px;
  background: rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
}
```

---

### minimalist_details (HTML)

For the **minimalist_details** section, copy this HTML:

```html
<section class="min-details">
  <div class="min-details__container">
    <h2 class="min-details__title">Wedding Details</h2>
    <div class="min-details__grid">
      <div class="min-details__item">
        <p class="min-details__label">📅 Date</p>
        <p class="min-details__value" data-field="event_date">{{event_date}}</p>
      </div>
      <div class="min-details__item">
        <p class="min-details__label">🕐 Time</p>
        <p class="min-details__value" data-field="event_time">{{event_time}}</p>
      </div>
      <div class="min-details__item">
        <p class="min-details__label">📍 Venue</p>
        <p class="min-details__value" data-field="venue_name">{{venue_name}}</p>
      </div>
    </div>
  </div>
</section>
```

And this CSS:

```css
.min-details {
  padding: 5rem 2rem;
  background: var(--color-background);
}
.min-details__container {
  max-width: 700px;
  margin: 0 auto;
}
.min-details__title {
  font-family: var(--font-title);
  font-size: 2rem;
  font-weight: 300;
  text-align: center;
  color: var(--color-primary);
  margin-bottom: 3rem;
}
.min-details__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}
.min-details__item {
  text-align: center;
  padding: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
.min-details__label {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--color-accent);
  margin-bottom: 0.8rem;
}
.min-details__value {
  font-family: var(--font-title);
  font-size: 1.2rem;
  font-weight: 400;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}
.min-details__address {
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: #666;
  line-height: 1.5;
}
```

---

## Quick Start Steps

1. **Fill Step 1** — Name, thumbnails, category, tags, prices
2. **Click Next** → Go to Template Maker (Step 2)
3. **In FileTree:**
   - Add pages if needed (Cover, Main, etc.)
   - Add sections: `minimalist_cover`, `minimalist_hero`, `minimalist_couple`, `minimalist_details`
4. **For each section:**
   - Click it in FileTree
   - Click "HTML" tab and paste the section's HTML
   - Click "CSS" tab and paste the section's CSS
   - For sections with JS, click "JS" tab and paste the code
5. **Update schema.json** — Click it in FileTree, then paste the full schema
6. **Update theme.json** — Click it in FileTree, then paste the theme colors
7. **Preview** — Click "Preview" button to see live result
8. **Save** — Click "Save Template" to save to database

---

## Tips

- Use `{{fieldName}}` in HTML to reference schema fields
- Use `data-field-img="fieldName"` on images for image field binding
- Use `var(--color-primary)`, `var(--color-accent)`, `var(--color-background)` for dynamic colors
- Use `var(--font-title)`, `var(--font-body)` for dynamic fonts
- Keep responsive design in mind using `clamp()`, percentages, and flexbox
