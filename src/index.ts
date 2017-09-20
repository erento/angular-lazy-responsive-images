import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ImageComponent} from './image.component';
import {WindowRef} from './window.reference';
export * from './image.component';

@NgModule({
    declarations: [ImageComponent],
    exports: [ImageComponent],
    imports: [CommonModule],
    providers: [WindowRef]
})
export class ImageModule {}
