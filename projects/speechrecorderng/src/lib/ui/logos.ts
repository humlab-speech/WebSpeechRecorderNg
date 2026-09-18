import {Component, Input} from "@angular/core";
import {SprLogo} from "../spr.config";

/**
 * Renders the configuration's `branding` logos.
 *
 * Purely presentational: sizing, the link wrapper and the dark-scheme plate live here so the
 * slots (prompt stage, progress rail footer, both ends of the transport bar) cannot drift apart. The
 * marks keep their own brand colours; the plate is transparent in the light scheme and white
 * in the dark one, so switching schemes does not shift the layout.
 *
 * The plate is a wrapper, never padding on the image: that keeps the image box exactly the
 * artwork, so the aspect ratio the audit measures is the one the owner specified.
 */
@Component({
    selector: 'spr-logos',
    template: `
    @for (logo of logos; track logo.src) {
      <a class="spr-logo-plate" [attr.href]="logo.href || null"
         [attr.target]="logo.href ? '_blank' : null"
         [attr.rel]="logo.href ? 'noopener noreferrer' : null">
        <img class="spr-logo" [src]="logoSrc(logo)" [alt]="logo.alt"
             [style.height.px]="logoHeight(logo)" loading="lazy" decoding="async">
      </a>
    }
  `,
    styles: [`:host {
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }`, `
    /* White plate in the dark scheme: the marks are dark and would disappear on the dark
       surfaces. Transparent in the light scheme, so the metrics are identical in both. */
    .spr-logo-plate {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: var(--spr-r-sm, 6px);
      background: var(--spr-logo-plate, transparent);
    }

    .spr-logo {
      display: block;
      width: auto;
    }

    .spr-logo-plate:focus-visible {
      outline: 3px solid var(--spr-focus, #2A4765);
      outline-offset: 2px;
    }`, `
    /* Separates permanent marks from the transient state indicators next to them. */
    :host(.spr-separator) {
      padding-right: 16px;
      margin-right: 16px;
      border-right: 1px solid var(--spr-border, #D8DFE8);
    }

    /* The same cluster at the left end of the bar, ahead of the status message. It has the room
       the trailing one lacks — the marks stay at laptop widths — and the phone layout drops it
       with the rest of the bar's furniture. */
    :host(.spr-leading) {
      padding-right: 16px;
      margin-right: 16px;
      border-right: 1px solid var(--spr-border, #D8DFE8);
    }

    /* The transport bar's right cluster is the elastic part of that row. Its budget at
       1100px is about 250px (transport needs 345px, the indicators 40px, the bar 40px of
       padding), so its marks give way one at a time: a third one costs about 100px and steps
       aside below 1250px, the second below 1100px. A mark that has to stay on a laptop screen
       belongs at the bar's left end (controlsLeft) instead. */
    @media (max-width: 1249.98px) {
      :host(.spr-separator) .spr-logo-plate:nth-child(n + 3) {
        display: none;
      }
    }
    @media (max-width: 1099.98px) {
      :host(.spr-separator) .spr-logo-plate:nth-child(n + 2) {
        display: none;
      }
    }

    /* 600-767px is the phone arrangement: the bar drops its marks with the rest of its
       furniture, and 768px up is where this bar is meant to be used. */
    @media (max-width: 767.98px) {
      :host(.spr-separator),
      :host(.spr-leading) {
        display: none;
      }
    }`],
    standalone: false
})
export class Logos {

  @Input() logos: SprLogo[] | undefined;

  /** Slot default height in px; a logo's own `height` wins. */
  @Input() height = 24;

  logoHeight(logo: SprLogo): number {
    return logo.height ?? this.height;
  }

  logoSrc(logo: SprLogo): string {
    if (logo.srcDark && typeof document !== 'undefined'
      && document.documentElement.getAttribute('data-spr-scheme') === 'dark') {
      return logo.srcDark;
    }
    return logo.src;
  }
}
