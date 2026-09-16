import {Component} from "@angular/core";

@Component({
    selector: 'scroll-pane-horizontal',
    template: '',
    styles: [
        `:host {
           width: 100%;
           background: var(--spr-canvas, #0E1A26);
           box-sizing: border-box;
           height: 100%;
           position: relative;
           overflow-x: scroll;
           overflow-y: auto;
         }`
    ],
    standalone: false
})
export class ScrollPaneHorizontal{

}
