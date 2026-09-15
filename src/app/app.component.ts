import {Component} from '@angular/core';
import { VERSION } from '../../projects/speechrecorderng/src/lib/spr.module.version'
import {ResponsiveComponent} from "../../projects/speechrecorderng/src/lib/ui/responsive_component";
import {BreakpointObserver} from "@angular/cdk/layout";
import {KEY_BINDINGS, KeyBinding} from '../../projects/speechrecorderng/src/lib/speechrecorder/session/keybindings';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent extends ResponsiveComponent{

  sprVersion=VERSION;
  title='SpeechRecorder Angular Demo'
  shortTitle='SpeechRecorder'
  keyBindings: KeyBinding[] = KEY_BINDINGS;

  constructor(protected bpo:BreakpointObserver) {
    super(bpo);
  }
}
