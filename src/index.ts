import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LazyImageComponent} from './image.component';
import {WindowRef} from './window.reference';
export * from './image.component';

@NgModule({
    declarations: [LazyImageComponent],
    exports: [LazyImageComponent],
    imports: [CommonModule],
    providers: [WindowRef]
})
export class LazyImageModule {}
