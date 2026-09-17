import {Component, Inject} from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {SprTranslator} from "../i18n/translate";

@Component({
    selector: 'msg-dialog',
    template: `<h1 mat-dialog-title class="spr-dialog-title">@if (data.type==='error') {
  <span class="spr-dialog-icon error"><mat-icon>report_problem</mat-icon></span>
}
@if (data.type==='warning') {
  <span class="spr-dialog-icon caution"><mat-icon>warning_amber</mat-icon></span>
}{{data.title}}</h1>
<div mat-dialog-content>

  <p>{{data.msg}}</p>
  <p>{{data.advice}}</p>

</div>
<div mat-dialog-actions>
  <button mat-flat-button color="primary" (click)="closeDialog()">{{i18n.t('spr.dialog.ok')}}</button>
</div>
`,
    styles: [`:host {
    display: block;
    color: var(--spr-ink, #1F3044);
  }`, `
    .spr-dialog-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: var(--spr-type-section, 17.28px);
      font-weight: 700;
      color: var(--spr-ink-strong, #1C3660);
    }

    .spr-dialog-icon {
      display: inline-grid;
      place-items: center;
      flex: 0 0 auto;
      width: 32px;
      height: 32px;
      border-radius: var(--spr-r-md, 12px);
    }

    /* Ink on the complement colours is black (Umeå brand rule). */
    .spr-dialog-icon.error {
      background: var(--spr-alert, #EABAB9);
      color: var(--spr-alert-ink, #000000);
    }

    .spr-dialog-icon.caution {
      background: var(--spr-caution, #D7B17C);
      color: var(--spr-caution-ink, #000000);
    }

    .spr-dialog-icon mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    p {
      margin: 0 0 8px;
    }
  `],
    standalone: false
})
export class MessageDialog{

  constructor(
    public dialogRef: MatDialogRef<MessageDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public readonly i18n: SprTranslator) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

}
