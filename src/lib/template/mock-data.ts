import type { Template, SectionTypeDef } from "./types"

export const SECTION_TYPES: Record<string, SectionTypeDef> = {
  cover_overlay: {
    id: "cover_overlay",
    css: `
      .s-cover {
        position: relative;
        height: 812px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: var(--color-primary);
        overflow: hidden;
      }
      .s-cover__bg { position: absolute; inset: 0; }
      .s-cover__img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .s-cover__overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.58); }
      .s-cover__content {
        position: relative;
        z-index: 1;
        color: var(--color-background);
        padding: 2rem;
        width: 100%;
        max-width: 320px;
      }
      .s-cover__greeting {
        font-family: var(--font-body);
        font-size: 0.68rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        opacity: 0.55;
        margin-bottom: 0.3rem;
      }
      .s-cover__guest {
        font-family: var(--font-title);
        font-size: 1.4rem;
        font-weight: 300;
        opacity: 0.82;
        margin-bottom: 2rem;
      }
      .s-cover__sep {
        width: 36px;
        height: 1px;
        background: var(--color-accent);
        margin: 0 auto 2rem;
      }
      .s-cover__eyebrow {
        font-family: var(--font-body);
        font-size: 0.62rem;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        opacity: 0.55;
        margin-bottom: 0.75rem;
      }
      .s-cover__name {
        font-family: var(--font-title);
        font-size: clamp(1.8rem, 8vw, 3.2rem);
        font-weight: 300;
        line-height: 1.1;
        margin-bottom: 0.75rem;
      }
      .s-cover__date {
        font-family: var(--font-body);
        font-size: 0.7rem;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        opacity: 0.6;
        margin-bottom: 2.5rem;
      }
      .s-cover__btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: transparent;
        border: 1px solid var(--color-accent);
        color: var(--color-background);
        font-family: var(--font-body);
        font-size: 0.75rem;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        padding: 0.75rem 2rem;
        cursor: pointer;
        transition: background 0.25s, color 0.25s;
      }
      .s-cover__btn:hover {
        background: var(--color-accent);
        color: var(--color-primary);
      }
    `,
    html: `
      <section class="s-cover">
        <div class="s-cover__bg">
          <img data-field-img="couple_photo" src="{{couple_photo}}" alt="" class="s-cover__img" onerror="this.style.display='none'" />
          <div class="s-cover__overlay"></div>
        </div>
        <div class="s-cover__content">
          <p class="s-cover__greeting">Kepada Yth.</p>
          <p class="s-cover__guest">Tamu Undangan</p>
          <div class="s-cover__sep"></div>
          <p class="s-cover__eyebrow">The Wedding of</p>
          <h1 class="s-cover__name"><span data-field="headline">{{headline}}</span></h1>
          <p class="s-cover__date"><span data-field="event_date_display">{{event_date_display}}</span></p>
          <button class="s-cover__btn">
            Buka Undangan &nbsp;✉
          </button>
        </div>
      </section>
    `,
    js: `(function(){
  var btn = document.querySelector('.s-cover__btn');
  if(btn) btn.addEventListener('click', function(){
    window.__memoriaGoTo && window.__memoriaGoTo('main');
  });
})();`,
    schema: {
      slots: ["headline", "couple_photo", "event_date_display"],
      styles: [],
    },
  },

  hero_fullscreen: {
    id: "hero_fullscreen",
    css: `
      .s-hero {
        position: relative;
        min-height: {{styles.minHeight}};
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: {{styles.textAlign}};
        overflow: hidden;
        background: #1a1a1a;
      }
      .s-hero__bg { position: absolute; inset: 0; }
      .s-hero__img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .s-hero__overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.42); }
      .s-hero__content { position: relative; z-index: 1; color: #fff; padding: 2rem; width: 100%; }
      .s-hero__eyebrow {
        font-family: var(--font-body);
        font-size: 0.7rem;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        opacity: 0.75;
        margin-bottom: 1.5rem;
      }
      .s-hero__name {
        font-family: var(--font-title);
        font-size: clamp(2.5rem, 10vw, 5rem);
        font-weight: 300;
        line-height: 1.05;
        margin-bottom: 1.75rem;
      }
      .s-hero__divider {
        width: 48px;
        height: 1px;
        background: var(--color-accent);
        margin: 0 auto 1.75rem;
      }
      .s-hero__date {
        font-family: var(--font-body);
        font-size: 0.8rem;
        letter-spacing: 0.35em;
        text-transform: uppercase;
        opacity: 0.85;
      }
    `,
    html: `
      <section class="s-hero">
        <div class="s-hero__bg">
          <img data-field-img="couple_photo" src="{{couple_photo}}" alt="" class="s-hero__img" onerror="this.style.display='none'" />
          <div class="s-hero__overlay"></div>
        </div>
        <div class="s-hero__content">
          <p class="s-hero__eyebrow">The Wedding of</p>
          <h1 class="s-hero__name"><span data-field="headline">{{headline}}</span></h1>
          <div class="s-hero__divider"></div>
          <p class="s-hero__date"><span data-field="event_date_display">{{event_date_display}}</span></p>
        </div>
      </section>
    `,
    js: "",
    schema: {
      slots: ["headline", "couple_photo", "event_date_display"],
      styles: ["minHeight", "textAlign"],
    },
  },

  couple_profile: {
    id: "couple_profile",
    css: `
      .s-couple {
        padding: 5rem 2rem;
        background: var(--color-background);
        text-align: center;
      }
      .s-couple__title {
        font-family: var(--font-title);
        font-size: 1.5rem;
        font-weight: 400;
        color: var(--color-primary);
        margin-bottom: 3rem;
        letter-spacing: 0.05em;
      }
      .s-couple__grid {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2.5rem;
        flex-wrap: wrap;
      }
      .s-couple__person { flex: 1; min-width: 120px; max-width: 180px; }
      .s-couple__photo-wrap {
        width: 130px;
        height: 130px;
        border-radius: 50%;
        overflow: hidden;
        margin: 0 auto 1rem;
        border: 2px solid var(--color-accent);
        background: #ede8e0;
      }
      .s-couple__photo { width: 100%; height: 100%; object-fit: cover; display: block; }
      .s-couple__name {
        font-family: var(--font-title);
        font-size: 1.2rem;
        font-weight: 400;
        color: var(--color-primary);
      }
      .s-couple__role {
        font-family: var(--font-body);
        font-size: 0.7rem;
        color: var(--color-accent);
        letter-spacing: 0.15em;
        text-transform: uppercase;
        margin-top: 0.3rem;
      }
      .s-couple__ampersand {
        font-family: var(--font-title);
        font-size: 3rem;
        color: var(--color-accent);
        font-weight: 300;
        line-height: 1;
        flex-shrink: 0;
      }
    `,
    html: `
      <section class="s-couple">
        <p class="s-couple__title">Mempelai</p>
        <div class="s-couple__grid">
          <div class="s-couple__person">
            <div class="s-couple__photo-wrap">
              <img data-field-img="bride_photo" src="{{bride_photo}}" alt="" class="s-couple__photo" onerror="this.style.opacity='0'" />
            </div>
            <p class="s-couple__name"><span data-field="bride_name">{{bride_name}}</span></p>
            <p class="s-couple__role">Mempelai Wanita</p>
          </div>
          <div class="s-couple__ampersand">&amp;</div>
          <div class="s-couple__person">
            <div class="s-couple__photo-wrap">
              <img data-field-img="groom_photo" src="{{groom_photo}}" alt="" class="s-couple__photo" onerror="this.style.opacity='0'" />
            </div>
            <p class="s-couple__name"><span data-field="groom_name">{{groom_name}}</span></p>
            <p class="s-couple__role">Mempelai Pria</p>
          </div>
        </div>
      </section>
    `,
    js: "",
    schema: {
      slots: ["bride_name", "groom_name", "bride_photo", "groom_photo"],
      styles: [],
    },
  },

  event_info: {
    id: "event_info",
    css: `
      .s-event {
        padding: 5rem 2rem;
        background: var(--color-primary);
        text-align: center;
      }
      .s-event__title {
        font-family: var(--font-title);
        font-size: 1.5rem;
        font-weight: 400;
        color: var(--color-background);
        margin-bottom: 3rem;
        letter-spacing: 0.05em;
      }
      .s-event__card { max-width: 380px; margin: 0 auto; }
      .s-event__row {
        display: flex;
        align-items: flex-start;
        gap: 1.25rem;
        padding: 1.25rem 0;
        border-bottom: 1px solid rgba(255,255,255,0.12);
        text-align: left;
      }
      .s-event__row:last-child { border-bottom: none; }
      .s-event__icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 2px; }
      .s-event__label {
        font-family: var(--font-body);
        font-size: 0.65rem;
        color: var(--color-accent);
        letter-spacing: 0.2em;
        text-transform: uppercase;
        margin-bottom: 0.3rem;
      }
      .s-event__value {
        font-family: var(--font-title);
        font-size: 1.05rem;
        font-weight: 400;
        color: var(--color-background);
      }
      .s-event__sub {
        font-family: var(--font-body);
        font-size: 0.78rem;
        color: rgba(255,255,255,0.55);
        margin-top: 0.2rem;
        line-height: 1.4;
      }
    `,
    html: `
      <section class="s-event">
        <p class="s-event__title">Detail Acara</p>
        <div class="s-event__card">
          <div class="s-event__row">
            <span class="s-event__icon">📅</span>
            <div>
              <p class="s-event__label">Tanggal</p>
              <p class="s-event__value"><span data-field="event_date_display">{{event_date_display}}</span></p>
            </div>
          </div>
          <div class="s-event__row">
            <span class="s-event__icon">🕐</span>
            <div>
              <p class="s-event__label">Waktu</p>
              <p class="s-event__value"><span data-field="event_time">{{event_time}}</span> WIB</p>
            </div>
          </div>
          <div class="s-event__row">
            <span class="s-event__icon">📍</span>
            <div>
              <p class="s-event__label">Lokasi</p>
              <p class="s-event__value"><span data-field="venue_name">{{venue_name}}</span></p>
              <p class="s-event__sub"><span data-field="venue_address">{{venue_address}}</span></p>
            </div>
          </div>
        </div>
      </section>
    `,
    js: "",
    schema: {
      slots: ["event_date_display", "event_time", "venue_name", "venue_address"],
      styles: [],
    },
  },
}

export const MOCK_TEMPLATE: Template = {
  id: "elegance-01",
  name: "Elegance",
  theme_defaults: {
    color_primary: "#3D2B1F",
    color_accent: "#C9A96E",
    color_background: "#FAF7F2",
    font_title: "Cormorant Garamond",
    font_body: "Lato",
  },
  pages: [
    {
      id: "cover",
      label: "Cover",
      sections: [
        {
          id: "cover_hero",
          section_type_id: "cover_overlay",
        },
      ],
    },
    {
      id: "main",
      label: "Main Invitation",
      sections: [
        { id: "hero", section_type_id: "hero_fullscreen" },
        { id: "couple", section_type_id: "couple_profile" },
        { id: "event_detail", section_type_id: "event_info" },
      ],
    },
  ],
  schema: {
    fields: [
      {
        key: "headline",
        label: "Nama Pasangan",
        type: "text",
        section: "hero",
        required: true,
        placeholder: "Contoh: Romeo & Juliet",
      },
      {
        key: "couple_photo",
        label: "Foto Berdua",
        type: "image",
        section: "hero",
        required: false,
        placeholder: "https://...",
      },
      {
        key: "bride_name",
        label: "Nama Mempelai Wanita",
        type: "text",
        section: "couple",
        required: true,
        placeholder: "Nama lengkap",
      },
      {
        key: "groom_name",
        label: "Nama Mempelai Pria",
        type: "text",
        section: "couple",
        required: true,
        placeholder: "Nama lengkap",
      },
      {
        key: "bride_photo",
        label: "Foto Mempelai Wanita",
        type: "image",
        section: "couple",
        required: false,
        placeholder: "https://...",
      },
      {
        key: "groom_photo",
        label: "Foto Mempelai Pria",
        type: "image",
        section: "couple",
        required: false,
        placeholder: "https://...",
      },
      {
        key: "event_date",
        label: "Tanggal Acara",
        type: "date",
        section: "event_detail",
        required: true,
      },
      {
        key: "event_time",
        label: "Waktu Acara",
        type: "time",
        section: "event_detail",
        required: true,
      },
      {
        key: "venue_name",
        label: "Nama Venue",
        type: "text",
        section: "event_detail",
        required: true,
        placeholder: "Nama gedung atau tempat",
      },
      {
        key: "venue_address",
        label: "Alamat Venue",
        type: "text",
        section: "event_detail",
        required: false,
        placeholder: "Alamat lengkap",
      },
      {
        key: "venue_maps_url",
        label: "Link Google Maps",
        type: "text",
        section: "event_detail",
        required: false,
        placeholder: "https://maps.google.com/...",
      },
    ],
  },
}

export const createDefaultInvitation = (): import("./types").Invitation => ({
  id: "",
  templateId: MOCK_TEMPLATE.id,
  theme: { ...MOCK_TEMPLATE.theme_defaults },
  sectionOrder: ["hero", "couple", "event_detail"],
  userData: {
    headline: "Budi & Rina",
    couple_photo: "",
    bride_name: "Rina Astuti",
    groom_name: "Budi Santoso",
    bride_photo: "",
    groom_photo: "",
    event_date_display: "Minggu, 20 April 2025",
    event_date: "2025-04-20",
    event_time: "15:00",
    venue_name: "Gedung Balai Kartini",
    venue_address: "Jl. Gatot Subroto No. 37, Jakarta Selatan",
    venue_maps_url: "",
  },
})

export const SIMPLICITY_TEMPLATE: Template = {
  id: "simple-id-1",
  name: "Simplicity",
  theme_defaults: {
    color_primary: "#000000",
    color_accent: "#ffffff",
    color_background: "#ffffff",
    font_title: "Playfair Display",
    font_body: "Inter",
  },
  pages: [
    {
      id: "cover",
      label: "Cover",
      sections: [
        { id: "lg-cover", section_type_id: "lg_cover_section" },
      ],
    },
    {
      id: "main",
      label: "Main Invitation",
      sections: [
        { id: "lg-hero", section_type_id: "lg_hero_section" },
        { id: "lg-couple", section_type_id: "lg_couple_section" },
        { id: "lg-event", section_type_id: "lg_event_section" },
        { id: "lg-rsvp", section_type_id: "lg_rsvp_section" },
      ],
    },
  ],
  schema: {
    fields: [
      { key: "guest_name", label: "Nama Tamu", type: "text", section: "lg-cover", required: false, placeholder: "Tamu Undangan" },
      { key: "headline", label: "Headline", type: "text", section: "lg-hero", required: true, placeholder: "Budi & Rina" },
      { key: "bride_name", label: "Nama Mempelai Wanita", type: "text", section: "lg-couple", required: true },
      { key: "groom_name", label: "Nama Mempelai Pria", type: "text", section: "lg-couple", required: true },
      { key: "event_date", label: "Tanggal Acara", type: "date", section: "lg-event", required: true },
      { key: "event_time", label: "Waktu Acara", type: "time", section: "lg-event", required: true },
      { key: "venue_name", label: "Nama Gedung", type: "text", section: "lg-event", required: true, placeholder: "Gedung Serbaguna" },
      { key: "venue_address", label: "Alamat Lengkap", type: "textarea", section: "lg-event", required: false },
      { key: "couple_photo", label: "Foto Pasangan", type: "image", section: "lg-cover", required: false },
    ],
  },
}

export const SIMPLICITY_SECTIONS: Record<string, SectionTypeDef> = {
  lg_cover_section: {
    id: "lg_cover_section",
    html: `
      <section class="lg-cover">
        <div class="lg-cover__bg">
          <img data-field-img="couple_photo" src="{{couple_photo}}" alt="" class="lg-cover__img" />
        </div>
        <div class="lg-cover__glass"></div>
        <div class="lg-cover__content">
          <h1 class="lg-cover__title">{{headline}}</h1>
          <p class="lg-cover__subtitle" data-field="guest_name">Tamu Undangan</p>
          <button class="lg-cover__btn">Buka Undangan</button>
        </div>
      </section>
    `,
    css: `
      .lg-cover {
        position: relative;
        height: 812px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
        overflow: hidden;
      }
      .lg-cover__bg {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 50% 50%, rgba(0,0,0,0.3), rgba(0,0,0,0.6));
      }
      .lg-cover__img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: blur(3px) brightness(0.7);
      }
      .lg-cover__glass {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .lg-cover__content {
        position: relative;
        z-index: 10;
        color: var(--color-primary);
        padding: 3rem 2rem;
        max-width: 280px;
      }
      .lg-cover__title {
        font-family: var(--font-title);
        font-size: clamp(2rem, 10vw, 3.5rem);
        font-weight: 400;
        margin: 0 0 1rem 0;
        line-height: 1.1;
      }
      .lg-cover__subtitle {
        font-family: var(--font-body);
        font-size: 0.95rem;
        font-weight: 300;
        letter-spacing: 0.15em;
        margin: 0 0 2rem 0;
        opacity: 0.7;
      }
      .lg-cover__btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--color-primary);
        color: var(--color-background);
        border: none;
        border-radius: 50px;
        padding: 0.75rem 2rem;
        font-family: var(--font-body);
        font-size: 0.85rem;
        font-weight: 500;
        letter-spacing: 0.1em;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .lg-cover__btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      }
    `,
    js: `
      (function(){
        var btn = document.querySelector('.lg-cover__btn');
        if(btn) btn.addEventListener('click', function(){
          window.__memoriaGoTo && window.__memoriaGoTo('main');
        });
      })();
    `,
    schema: {
      slots: ["headline", "guest_name", "couple_photo"],
      styles: [],
    },
  },
  lg_hero_section: {
    id: "lg_hero_section",
    html: `
      <section class="lg-hero">
        <div class="lg-hero__glass">
          <div class="lg-hero__container">
            <p class="lg-hero__label">Sebuah Perayaan Cinta</p>
            <h2 class="lg-hero__headline" data-field="headline">Budi & Rina</h2>
            <div class="lg-hero__divider"></div>
            <p class="lg-hero__text">Mengundang Anda untuk hadir dalam momen istimewa pernikahan kami</p>
          </div>
        </div>
      </section>
    `,
    css: `
      .lg-hero {
        position: relative;
        min-height: 280px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 3rem 1.5rem;
        background: linear-gradient(to bottom, #fafafa, #f0f0f0);
      }
      .lg-hero__glass {
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        background: rgba(255, 255, 255, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.6);
        border-radius: 20px;
        padding: 2.5rem;
        width: 100%;
        max-width: 340px;
        text-align: center;
      }
      .lg-hero__container {
        margin: 0;
      }
      .lg-hero__label {
        font-family: var(--font-body);
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        color: #666;
        margin: 0 0 1rem 0;
      }
      .lg-hero__headline {
        font-family: var(--font-title);
        font-size: 2.8rem;
        font-weight: 400;
        color: var(--color-primary);
        margin: 0 0 1.5rem 0;
        line-height: 1.2;
      }
      .lg-hero__divider {
        width: 40px;
        height: 2px;
        background: var(--color-primary);
        margin: 1.5rem auto;
      }
      .lg-hero__text {
        font-family: var(--font-body);
        font-size: 0.95rem;
        font-weight: 300;
        color: #555;
        margin: 1.5rem 0 0 0;
        line-height: 1.6;
      }
    `,
    js: ``,
    schema: {
      slots: ["headline"],
      styles: [],
    },
  },
  lg_couple_section: {
    id: "lg_couple_section",
    html: `
      <section class="lg-couple">
        <div class="lg-couple__container">
          <div class="lg-couple__item">
            <div class="lg-couple__name-group">
              <p class="lg-couple__role">Mempelai Wanita</p>
              <h3 class="lg-couple__name" data-field="bride_name">Rina Astuti</h3>
            </div>
          </div>
          <div class="lg-couple__divider">
            <span>&</span>
          </div>
          <div class="lg-couple__item">
            <div class="lg-couple__name-group">
              <p class="lg-couple__role">Mempelai Pria</p>
              <h3 class="lg-couple__name" data-field="groom_name">Budi Santoso</h3>
            </div>
          </div>
        </div>
      </section>
    `,
    css: `
      .lg-couple {
        padding: 3rem 1.5rem;
        background: #ffffff;
      }
      .lg-couple__container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2rem;
        max-width: 340px;
        margin: 0 auto;
      }
      .lg-couple__item {
        flex: 1;
        text-align: center;
      }
      .lg-couple__divider {
        font-family: var(--font-title);
        font-size: 1.8rem;
        color: #999;
        margin: 0 0.5rem;
      }
      .lg-couple__role {
        font-family: var(--font-body);
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #999;
        margin: 0 0 0.5rem 0;
      }
      .lg-couple__name {
        font-family: var(--font-title);
        font-size: 1.6rem;
        font-weight: 400;
        color: var(--color-primary);
        margin: 0;
        line-height: 1.2;
      }
    `,
    js: ``,
    schema: {
      slots: ["bride_name", "groom_name"],
      styles: [],
    },
  },
  lg_event_section: {
    id: "lg_event_section",
    html: `
      <section class="lg-event">
        <div class="lg-event__glass">
          <div class="lg-event__item">
            <p class="lg-event__label">Hari & Tanggal</p>
            <p class="lg-event__value" data-field="event_date_display">Minggu, 20 April 2025</p>
          </div>
          <div class="lg-event__divider"></div>
          <div class="lg-event__item">
            <p class="lg-event__label">Waktu</p>
            <p class="lg-event__value" data-field="event_time">15:00</p>
          </div>
          <div class="lg-event__divider"></div>
          <div class="lg-event__item">
            <p class="lg-event__label">Tempat</p>
            <p class="lg-event__value" data-field="venue_name">Gedung Serbaguna</p>
            <p class="lg-event__address" data-field="venue_address"></p>
          </div>
        </div>
      </section>
    `,
    css: `
      .lg-event {
        padding: 3rem 1.5rem;
        background: linear-gradient(to bottom, #f9f9f9, #f0f0f0);
      }
      .lg-event__glass {
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        background: rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 16px;
        padding: 2rem;
        max-width: 340px;
        margin: 0 auto;
      }
      .lg-event__item {
        text-align: center;
        padding: 0.75rem 0;
      }
      .lg-event__divider {
        height: 1px;
        background: rgba(0, 0, 0, 0.1);
        margin: 1rem 0;
      }
      .lg-event__label {
        font-family: var(--font-body);
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #999;
        margin: 0 0 0.5rem 0;
      }
      .lg-event__value {
        font-family: var(--font-title);
        font-size: 1.4rem;
        font-weight: 400;
        color: var(--color-primary);
        margin: 0;
      }
      .lg-event__address {
        font-family: var(--font-body);
        font-size: 0.8rem;
        font-weight: 300;
        color: #777;
        margin: 0.5rem 0 0 0;
        line-height: 1.4;
      }
    `,
    js: ``,
    schema: {
      slots: ["event_date_display", "event_time", "venue_name", "venue_address"],
      styles: [],
    },
  },
  lg_rsvp_section: {
    id: "lg_rsvp_section",
    html: `
      <section class="lg-rsvp">
        <div class="lg-rsvp__container">
          <h3 class="lg-rsvp__title">Konfirmasi Kehadiran</h3>
          <p class="lg-rsvp__text">Kami menanti kabar bahagia dari Anda</p>
          <div class="lg-rsvp__buttons">
            <button class="lg-rsvp__btn lg-rsvp__btn--hadir">Hadir</button>
            <button class="lg-rsvp__btn lg-rsvp__btn--tidak">Tidak Hadir</button>
          </div>
          <p class="lg-rsvp__note">atau hubungi kami melalui WhatsApp</p>
        </div>
      </section>
    `,
    css: `
      .lg-rsvp {
        padding: 3rem 1.5rem;
        background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
        text-align: center;
      }
      .lg-rsvp__container {
        max-width: 340px;
        margin: 0 auto;
      }
      .lg-rsvp__title {
        font-family: var(--font-title);
        font-size: 2rem;
        font-weight: 400;
        color: var(--color-primary);
        margin: 0 0 0.5rem 0;
      }
      .lg-rsvp__text {
        font-family: var(--font-body);
        font-size: 0.95rem;
        color: #666;
        margin: 0 0 2rem 0;
      }
      .lg-rsvp__buttons {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .lg-rsvp__btn {
        flex: 1;
        padding: 0.8rem;
        border: 1.5px solid var(--color-primary);
        background: transparent;
        color: var(--color-primary);
        border-radius: 50px;
        font-family: var(--font-body);
        font-size: 0.85rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .lg-rsvp__btn--hadir {
        background: var(--color-primary);
        color: var(--color-background);
      }
      .lg-rsvp__btn--hadir:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      }
      .lg-rsvp__btn--tidak:hover {
        background: rgba(0,0,0,0.05);
        transform: translateY(-2px);
      }
      .lg-rsvp__note {
        font-family: var(--font-body);
        font-size: 0.75rem;
        color: #999;
        margin: 1rem 0 0 0;
      }
    `,
    js: ``,
    schema: {
      slots: [],
      styles: [],
    },
  },
}
