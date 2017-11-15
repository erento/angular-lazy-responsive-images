import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {LazyImageComponent} from './lazy-image.component';

describe('LazyImageComponent', () => {
    let component: LazyImageComponent;
    let fixture: ComponentFixture<LazyImageComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [LazyImageComponent],
            imports: [],
            providers: [],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LazyImageComponent);
        component = fixture.componentInstance;

        component.sources = [{
            media: 'all',
            // assuming there's internet access, this should be there and have size of 272x92 pixels.
            url: 'https://www.google.de/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
        }];

        component.stretchStrategy = 'crop';
        component.maxCropPercentage = 30;
        component.canvasRatio = 1.333;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load an image accordingly', () => {
        const backgroundString: string = component.backgroundString;
        expect(backgroundString).toBe(
            'url(\'https://www.google.de/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png\')');
    });
});
