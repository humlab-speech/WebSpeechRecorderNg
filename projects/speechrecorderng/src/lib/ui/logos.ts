import {Component, Input} from "@angular/core";
import {SprLogo} from "../spr.config";

/**
 * Renders the configuration's `branding` logos.
 *
 * Purely presentational: sizing, the link wrapper and the dark-scheme plate live here so the
 * three slots (prompt stage, progress rail footer, transport bar) cannot drift apart. The
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
