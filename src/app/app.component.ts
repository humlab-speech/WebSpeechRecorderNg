import {Component} from '@angular/core';
import { VERSION } from '../../projects/speechrecorderng/src/lib/spr.module.version'
import {ResponsiveComponent} from "../../projects/speechrecorderng/src/lib/ui/responsive_component";
import {BreakpointObserver} from "@angular/cdk/layout";
import {KEY_BINDINGS, KeyBinding} from '../../projects/speechrecorderng/src/lib/speechrecorder/session/keybindings';
import {TranslocoService} from "@jsverse/transloco";
import {Language, LANGUAGE_STORAGE_KEY, LANGUAGES} from "./i18n/i18n.providers";
import {ActivatedRoute, Data, NavigationEnd, Router} from "@angular/router";
import {filter} from "rxjs";


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent extends ResponsiveComponent{

  sprVersion=VERSION;
  /** Hidden for a route that asks for it — the respondent display wants the stage, not a toolbar. */
  showChrome = true;
  readonly languages = LANGUAGES;
  keyBindings: KeyBinding[] = KEY_BINDINGS;

  constructor(protected bpo:BreakpointObserver, private transloco: TranslocoService,
              private router: Router, private route: ActivatedRoute) {
    super(bpo);
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => this.updateChrome());
    this.updateChrome();
    // The respondent display runs in its own window: it picks up a language switch from here.
    window.addEventListener('storage', (event) => {
      if (event.key === LANGUAGE_STORAGE_KEY && event.newValue && event.newValue !== this.transloco.getActiveLang()
        && (LANGUAGES as readonly string[]).includes(event.newValue)) {
        this.setLanguage(event.newValue as Language);
      }
    });
  }

  /** Reads the deepest active route: its data says whether the window keeps its chrome. */
  private updateChrome(): void {
    let active = this.route.firstChild;
    let data: Data = {};
    while (active) {
      data = active.snapshot.data ?? data;
      active = active.firstChild;
    }
    this.showChrome = data['sprRespondentDisplay'] !== true;
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
