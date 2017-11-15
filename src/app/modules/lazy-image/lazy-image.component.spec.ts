import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {Component, Input} from '@angular/core';
import {ImageSource, LazyImageComponent, StretchStrategy} from './lazy-image.component';
import {By} from '@angular/platform-browser';

@Component({
    selector: 'app-stub-component',
    template: `
        <div #testLoadingTemplate>
            <span class="test-loading-element">Test loading string</span>
        </div>

        <div #testErrorTemplate>
            <span class="test-error-element">Test error string</span>
        </div>

        <div ngClass="{
            'image-container-43': testParentRatio === '43',
            'image-container-11': testParentRatio === '11',
        }" class="image-container">
            <lazy-image
                [stretchStrategy]="stretchStrategy"
                [maxCropPercentage]="maxCropPercentage"
                [sources]="sources"
                [canvasRatio]="canvasRatio"
            >
            </lazy-image>
        </div>
    `,
    // tslint:disable no-unused-css
    styles: [
        `
        .image-container-43 {
            width: 400px;
            height: 300px;
        }

        .image-container-11 {
            width: 100px;
            height: 100px;
        }
        `,
    ],
    // tslint:enable no-unused-css
})
class StubComponent {
    @Input() public stretchStrategy: StretchStrategy;
    @Input() public canvasRatio: number;
    @Input() public maxCropPercentage: number;
    @Input() public sources: ImageSource[];
    public testParentRatio: string;
}

describe('LazyImageComponent', () => {
    let component: StubComponent;
    let fixture: ComponentFixture<StubComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                StubComponent,
                LazyImageComponent,
            ],
            imports: [],
            providers: [],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(StubComponent);
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

    it('should create the stub component', () => {
        expect(component).toBeTruthy();
    });

    it('should load an image accordingly', () => {
        const backgroundString: string = getBackgroundElement().style.backgroundImage;
        expect(backgroundString).toBe(
            'url("https://www.google.de/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png")');
    });

    it('should handle loading errors with showing the template', () => {
        component.sources = [{
            media: 'all',
            url: 'this_should_generate_a_404',
        }];

        expect(getErrorElement()).toBeTruthy();
    });

    it('should choose valid stretch strategy with regard to the image ratio', () => {
        // since our image is 272x92, the ratio is 2.95652174.
        component.testParentRatio = '43'; // this sets the parent size
        component.maxCropPercentage = 30;
        component.canvasRatio = 1.5; // 2.95/1.5 > 30, should be `stretched`

        expect(hasStretchState('stretch'));
    });

    function getBackgroundElement (): HTMLElement {
        return fixture.debugElement.query(By.css('.image-container__image')).nativeElement;
    }

    function getErrorElement (): HTMLElement {
        return fixture.debugElement.query(By.css('.test-error-element')).nativeElement;
    }

    function hasStretchState (stretchState: StretchStrategy): boolean {
        return fixture
            .debugElement
            .query(By.css('.image-container__image'))
            .nativeElement
            .classList
            .contains(`.image-container__image--${stretchState}`);
    }
});
