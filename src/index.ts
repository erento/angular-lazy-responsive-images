import {NgModule} from '@angular/core';
import {ImageComponent} from './image.component';
export * from './image.component';

@NgModule({
    declarations: [ImageComponent],
    exports: [ImageComponent]
})
export class ImageModule {}
