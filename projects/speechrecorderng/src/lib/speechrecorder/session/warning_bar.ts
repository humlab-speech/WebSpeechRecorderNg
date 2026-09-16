import {Component, Input} from "@angular/core";
import {SessionService} from "./session.service";

@Component({
    selector: 'app-warningbar',
    providers: [SessionService],
    template: `
    <div [class]="displayClass + ' ' + severity">{{warningText}}</div>

  `,
    styles: [`:host {
    flex: 0 0 content;
  }`, `
    .off {
      display: none;
    }
  `, `
    .on {
      display: block;
      box-sizing: border-box;
      width: 100%;
      padding: 8px 16px;
      font-weight: 700;
      font-size: var(--spr-type-caption, 13.6px);
      line-height: 1.4;
      text-align: center;
      border-bottom: 1px solid var(--spr-border, #D8DFE8);
    }

    /* Ink on the complement colours is black (Umeå brand rule). */
    .on.info {
      background: var(--spr-stage, #F1EFE4);
      color: var(--spr-stage-ink, #000000);
    }

    .on.caution {
      background: var(--spr-caution, #D7B17C);
      color: var(--spr-caution-ink, #000000);
    }
  `],
    standalone: false
})
export class WarningBar {
  @Input() warningText!:string;
  /** `info` for notices, `caution` for anything about the audio device or the data. */
  @Input() severity:'info'|'caution'='info';
  @Input() set show(show:boolean){
    if(show){
      this.displayClass='on'
    }else{
      this.displayClass='off'
    }
  }
  displayClass:string='off';
}
