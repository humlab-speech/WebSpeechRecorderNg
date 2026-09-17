import {Component} from '@angular/core';
import { VERSION } from '../../projects/speechrecorderng/src/lib/spr.module.version'
import {ResponsiveComponent} from "../../projects/speechrecorderng/src/lib/ui/responsive_component";
import {BreakpointObserver} from "@angular/cdk/layout";
import {KEY_BINDINGS, KeyBinding} from '../../projects/speechrecorderng/src/lib/speechrecorder/session/keybindings';
import {TranslocoService} from "@jsverse/transloco";
import {Language, LANGUAGE_STORAGE_KEY, LANGUAGES} from "./i18n/i18n.providers";


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent extends ResponsiveComponent{

  sprVersion=VERSION;
  readonly languages = LANGUAGES;
  keyBindings: KeyBinding[] = KEY_BINDINGS;

  constructor(protected bpo:BreakpointObserver, private transloco: TranslocoService) {
    super(bpo);
  }

  get language(): string {
    return this.transloco.getActiveLang();
  }

  /** Switches the language, remembers it, and keeps `<html lang>` (screen readers, hyphenation). */
  setLanguage(language: Language): void {
    this.transloco.setActiveLang(language);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // private mode: the choice simply does not survive the reload
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', language);
    }
  }
}
