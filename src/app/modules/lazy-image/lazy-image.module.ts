import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LazyImageComponent} from './lazy-image.component';

@NgModule({
    imports: [
        CommonModule,
    ],
    exports: [
        LazyImageComponent,
    ],
    declarations: [LazyImageComponent],
})
export class LazyImageModule { }
