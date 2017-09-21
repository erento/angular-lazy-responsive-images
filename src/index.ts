import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LazyImageComponent} from './lazy-image.component';
import {WindowRef} from './window.reference';
export * from './lazy-image.component';

@NgModule({
    declarations: [LazyImageComponent],
    exports: [LazyImageComponent],
    imports: [CommonModule],
    providers: [WindowRef]
})
export class LazyImageModule {}
