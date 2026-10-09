// Planted for bin/package_check.mjs. Two imports: `tslib` is in the fixture manifest's dependencies, so it must
// not be reported; `rxjs` is not declared anywhere, so it must be. The manifest also points `types` and the
// `./theme` subpath at files this package does not contain.
import {__decorate} from 'tslib';
import {Observable} from 'rxjs';

export const planted = [__decorate, Observable];
