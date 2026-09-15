import { IntersectionObserverDirective } from './intersection-observer.directive';
import {ElementRef} from "@angular/core";

describe('IntersectionObserverDirective', () => {
  it('should create an instance', () => {
    const directive = new IntersectionObserverDirective(new ElementRef(document.createElement('div')));
    expect(directive).toBeTruthy();
  });
});
