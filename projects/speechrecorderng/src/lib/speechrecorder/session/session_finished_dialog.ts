import {Component, Inject} from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
    selector: 'spr-session-finished-dialog',
    template: `<h1 mat-dialog-title class="spr-dialog-title"><span class="spr-dialog-icon ok"><mat-icon>done_all</mat-icon></span> Session finished</h1>
  <div mat-dialog-content>

    <p>Thank you! The recording session is complete.</p>

  </div>
  <div mat-dialog-actions>
    <button mat-flat-button color="primary" (click)="closeDialog()">OK</button>
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
    .spr-dialog-icon.ok {
      background: var(--spr-ok, #73A790);
      color: var(--spr-ok-ink, #000000);
    }

    .spr-dialog-icon mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `],
    standalone: false
})
export class SessionFinishedDialog{

  constructor(
    public dialogRef: MatDialogRef<SessionFinishedDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

}
