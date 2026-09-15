// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'core-js/es/reflect';
import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: false }
}
);

// Chrome throws a benign 'ResizeObserver loop completed with undelivered notifications'
// error when Angular CDK's BreakpointObserver is exercised in headless tests.
// It is not an application error; swallow it to keep karma connected.
window.onerror = function (message: string | Event) {
  if (/ResizeObserver/.test(String(message))) {
    return true;
  }
  return undefined;
};
