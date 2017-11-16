import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {LazyImageModule} from './modules/lazy-image/lazy-image.module';

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        LazyImageModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule { }
