import {Component, ElementRef, EventEmitter, Inject, Input, Optional, Output} from '@angular/core'
import {Item} from './item';
import {IntersectionObserverDirective} from "../../ui/intersection-observer.directive";
import {SPEECHRECORDER_CONFIG, SpeechRecorderConfig, SprLogo} from "../../spr.config";


@Component({
    selector: 'app-sprprogress',
    template: `

<table class="mat-typography">
  <thead>
    <tr>
      <th>#</th><!--<th>Code</th>-->
      <th>Prompt</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    @if (items) {
      @for (item of items; track item; let itIdx = $index) {
        <tr
          (click)="rowSelect=itIdx" [class.selRow]="itIdx===selectedItemIdx"
          [updateObservation]="{observer:isObs,observe:(itIdx===selectedItemIdx)}">
          <td>{{itIdx}}</td>
          <td class="promptDescriptor">{{item.promptAsString}}</td>
          <td>
            @if (item.itemDone()) {
              <mat-icon >done</mat-icon>
            }
            <!--<mat-icon *ngIf="latestRecordingAvail(item)===false" style="font-size:0.6em;width:0.6em;height:0.6em">cloud_download</mat-icon>-->
          </td>
        </tr>
      }
    }

  </tbody>
</table>

@if (footerLogos) {
  <div class="spr-rail-footer">
    <spr-logos [logos]="footerLogos" [height]="24"></spr-logos>
  </div>
}
`,
    styles: [`:host {
    overflow-x: hidden;
    overflow-y: scroll;
    padding: 12px 8px 12px 12px;
    /*flex: 0.1 0 300px;
      min-width: 300px; */
    flex: 0 0 296px; /* fixed operator rail: fits the three columns without clipping */
    background: var(--spr-surface, #FFFFFF);
    border-left: 1px solid var(--spr-border, #D8DFE8);
    color: var(--spr-ink, #1F3044);
    scrollbar-width: thin;
    scrollbar-color: var(--spr-border-strong, #C7D1DF) transparent;
    /* Workaround for Firefox
    If the progress table gets long (script with many items) FF increases the height of the overflow progressContainer and
    the whole app does not fit into the page anymore. The app overflows and shows a vertical scrollbar for the whole app.
    See https://stackoverflow.com/questions/28636832/firefox-overflow-y-not-working-with-nested-flexbox
    */
    /* min-height:0px; */
    min-height: 1px;
  }`,
        `table {
             width: 100%;
             min-height: 1px;
             border-collapse: collapse;
             font-size: var(--spr-type-caption, 13.6px);
                 /* Tables do not have a natural min size */
                 /*min-width: 300px; */

           }

           th {
             position: sticky;
             top: 0;
             z-index: 1;
             text-align: left;
             font-weight: 700;
             letter-spacing: 0.04em;
             text-transform: uppercase;
             color: var(--spr-ink-muted, #4A6288);
             background: var(--spr-surface-2, #F8FAFD);
             border-bottom: 1px solid var(--spr-border, #D8DFE8);
           }

           th, td {
             padding: 6px 8px;
             border-bottom: 1px solid var(--spr-divider, #E9EDF3);
           }

           tbody tr {
             height: 40px;
             cursor: pointer;
           }

           tbody tr:hover {
             background: var(--spr-stage, #F1EFE4);
           }

           td:first-child {
             color: var(--spr-ink-muted, #4A6288);
             font-variant-numeric: tabular-nums;
             width: 3ch;
           }

           mat-icon {
             color: var(--spr-ok, #73A790);
             font-size: 18px;
             width: 18px;
             height: 18px;
           }

           `, `
      .selRow {
        background: var(--spr-chrome, #2A4765);
        color: var(--spr-chrome-ink, #FFFFFF);
      }

      .selRow td {
        color: var(--spr-chrome-ink, #FFFFFF);
        border-bottom-color: var(--spr-chrome-hover, #24497E);
      }

      .selRow td:first-child {
        color: var(--spr-chrome-ink, #FFFFFF);
        box-shadow: inset 4px 0 0 0 var(--spr-caution, #D7B17C);
      }

      .selRow:hover {
        background: var(--spr-chrome-hover, #24497E);
      }

      .selRow mat-icon {
        color: var(--spr-caution, #D7B17C);
      }
    `, `.promptDescriptor{

      max-width: 18ch;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }`, `
    /* Sits below the list and stays visible while the list scrolls. */
    .spr-rail-footer {
      position: sticky;
      bottom: 0;
      z-index: 2; /* above the sticky table header (z-index: 1) */
      display: flex;
      justify-content: center;
      padding: 12px 8px 4px;
      margin: 0 -8px -12px -12px; /* bleed to the host's padding box */
      background: var(--spr-surface, #FFFFFF);
      border-top: 1px solid var(--spr-border, #D8DFE8);
    }

    /* Below this the operator rail does not fit the viewport (the recorder's desktop layout
       needs ~900px), so the footer would be clipped rather than seen. */
    @media (max-width: 767.98px) {
      .spr-rail-footer {
        display: none;
      }
    }`],
    standalone: false
})
export class Progress {
  isObs:IntersectionObserver;
  constructor(private elRef:ElementRef,
              @Optional() @Inject(SPEECHRECORDER_CONFIG) private config?: SpeechRecorderConfig) {
    this.isObs=new IntersectionObserver(ise=>{
      //console.debug("Intersection changed: ");
      ise.forEach((isee)=>{
        //console.debug("Intersection: "+isee.isIntersecting+' '+isee.intersectionRatio);
        if(isee.intersectionRatio<1){
          isee.target.scrollIntoView(false);
          this.isObs.unobserve(isee.target);
        }
      });
    },{root:this.elRef.nativeElement})
  }

  get footerLogos(): SprLogo[] | undefined {
    const logos = this.config?.branding?.progressFooter;
    return logos && logos.length ? logos : undefined;
  }
  @Input() items: Array<Item>|undefined=undefined;
  @Input() selectedItemIdx = 0;
  @Input() enableDownload: boolean=false;
  @Output() onRowSelect = new EventEmitter<number>();
  @Output()
  set rowSelect(rowIdx:number){
    this.onRowSelect.emit(rowIdx);
  }

  @Output() onShowDoneAction = new EventEmitter<number>();
  @Output()
  set clickDone(rowIdx:number){
    if(this.items &&this.items[rowIdx] && this.items[rowIdx].recs) {
      this.onRowSelect.emit(rowIdx);
      this.onShowDoneAction.emit(rowIdx);
    }
  }

  @Output() onDownloadDoneAction = new EventEmitter<number>();
  @Output()
  set clickDownloadDone(rowIdx:number){
    if(this.items && this.items[rowIdx] && this.items[rowIdx].recs) {
      this.onRowSelect.emit(rowIdx);
      this.onDownloadDoneAction.emit(rowIdx);
    }
  }

  latestRecordingAvail(item:Item):boolean|null{
    let cached=null;
    if(item && item.recs){
      let recsLen=item.recs.length;
      if(recsLen>0){
        let rf=item.recs[recsLen-1];
        if(rf && rf.serverPersisted) {
          cached = (rf.audioDataHolder != null);
        }
      }
    }
    return cached;
  }

}
