import {Component, Input, OnInit} from '@angular/core';
import {Action} from "../../../action/action";
import {SprTranslator} from "../../../i18n/translate";

@Component({
    selector: 'app-recording-file-navi',
    template: `
        <div #controlPanel style="display:flex;flex-direction: row;">
          <div #navi style="flex: 0;display:flex;flex-direction: row;flex-wrap: nowrap">
            <fieldset>
              <legend>{{ i18n.t('spr.recordings.versions') }}</legend>
              @if (naviInfoLoading) {
                <mat-progress-spinner mode="indeterminate" [diameter]="15"></mat-progress-spinner>
              }
              @if (!naviInfoLoading) {
                <select [disabled]="versions==null || versions.length==1" (change)="selectVersionChange($event)">
                  @for (v of versions; track v; let i = $index) {
                    <option [selected]="v===version" value="{{v}}">{{v}}@if (i==0) {
                      {{ i18n.t('spr.recordings.latest') }}
                    }</option>
                  }
                </select>
              }
            </fieldset>
            <fieldset>
              <legend>{{ i18n.t('spr.recordings.navigate') }}</legend>
              @if (naviInfoLoading) {
                <mat-progress-spinner mode="indeterminate" [diameter]="15"></mat-progress-spinner>
              }
              @if (!naviInfoLoading) {
                <div  style="flex: 0;display:flex;flex-direction: row;flex-wrap: nowrap">
                  <button (click)="firstAction?.perform()" [disabled]="!firstAction || firstAction.disabled" [matTooltip]="i18n.t('spr.recordings.tooltip.first')">
                    <mat-icon>first_page</mat-icon>
                  </button>
                  <button (click)="prevAction?.perform()" [disabled]="!prevAction || prevAction.disabled" [matTooltip]="i18n.t('spr.recordings.tooltip.previous')">
                    <mat-icon>chevron_left</mat-icon>
                  </button>
                  <button (click)="nextAction?.perform()" [disabled]="!nextAction || nextAction.disabled" [matTooltip]="i18n.t('spr.recordings.tooltip.next')">
                    <mat-icon>chevron_right</mat-icon>
                  </button>
                  <button (click)="lastAction?.perform()" [disabled]="!lastAction || lastAction.disabled" [matTooltip]="i18n.t('spr.recordings.tooltip.last')">
                    <mat-icon>last_page</mat-icon>
                  </button>
                </div>
              }
              @if (items && itemPos!==null && itemPos!==undefined) {
                <p>{{ i18n.t('spr.recordings.itemPosition', {pos: itemPos+1, count: items}) }}</p>
              }
              <p>{{ i18n.t('spr.recordings.orderedByDate') }}</p>
            </fieldset>
          </div>
        </div>
        `,
    styles: [
        `:host {
             flex: 0;
     
           }`
    ],
    standalone: false
})
export class RecordingFileNaviComponent implements OnInit {
  @Input() firstAction: Action<void>|undefined;
  @Input() prevAction: Action<void>|undefined;
  @Input() nextAction: Action<void>|undefined;
  @Input() lastAction: Action<void>|undefined;
  @Input() items:number | null|undefined;
  @Input() itemPos:number | null|undefined;
  @Input() selectVersion: Action<number>|undefined;
  @Input() versions: Array<number>|null=null;
  @Input() version: number|null=null;

  @Input() naviInfoLoading;

  constructor(public readonly i18n: SprTranslator) {
      this.naviInfoLoading=false;
  }

  ngOnInit(): void {

  }

  selectVersionChange(ev:Event){
    //console.debug("Change event: "+ev.target.value+ ", as Nr: "+versionNr);

      const selEl = ev.target as HTMLSelectElement;
      let versionNr = parseInt(selEl.value);
      if(this.selectVersion) {
        this.selectVersion.perform(versionNr);
      }
  }

}
