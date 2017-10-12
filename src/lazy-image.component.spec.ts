import {
    ViewContainerRef,
    ChangeDetectorRef,
} from '@angular/core';
import {ComponentFixture, TestBed, async} from '@angular/core/testing';
import {WindowRef} from '../src/window.reference';
import {LazyImageComponent} from '../src/lazy-image.component';

describe('Component: Lazy Image', () => {
    let fixture: ComponentFixture<LazyImageComponent>;
    let component: LazyImageComponent;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                LazyImageComponent,
            ],
            imports: [],
            providers: [
                ViewContainerRef,
                ChangeDetectorRef,
                WindowRef,
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LazyImageComponent);
        component = fixture.componentInstance;
    });

    it('should run the test', () => {
        const image: LazyImageComponent = fixture.debugElement.componentInstance;

        expect(image).toBeDefined();
    });
});
