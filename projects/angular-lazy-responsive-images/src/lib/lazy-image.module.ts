import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {LazyImageComponent} from './lazy-image.component';
import {WindowRef} from './utils/window.reference';

@NgModule({
    imports: [CommonModule],
    exports: [LazyImageComponent],
    providers: [WindowRef],
    declarations: [LazyImageComponent],
})
export class LazyImageModule {}
