import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    Input,
    OnInit,
    TemplateRef,
    ViewChild,
    ViewContainerRef
    } from '@angular/core';

import {WindowRef} from './window.reference';

export interface ImageSource {
    media: string;
    url: string;
}

export enum StretchStrategy {
    crop = 'crop',
    stretch = 'stretch',
    original = 'original',
}

@Component({
    selector: 'lazy-image',
    templateUrl: './image.component.html',
    styleUrls: ['./image.component.scss'],
})
export class LazyImageComponent implements AfterViewInit, OnInit {
    @Input() public sources: ImageSource[];
    @Input() public visibilityOverride: boolean;
    @Input() public loadingTpl: TemplateRef<any>;
    @Input() public canvasRatio: number;
    @Input() public maxCropPercentage: number;
    @Input() public stretchStrategy: StretchStrategy = StretchStrategy.original;
    @ViewChild('imageTplRef') public imageTplRef: TemplateRef<any>;

    public wasInViewport: boolean = false;
    public canvasWidth: number;
    public canvasHeight: number;
    public backgroundString: string;
    public stretchState: StretchStrategy; // certain strategies can end up in more than one state dynamically
    public loading: boolean = true;

    @ViewChild('imageElement') private imageElement: ElementRef;

    private scrollBufferSize: number;
    private verticalPosition: number;

    constructor (
        private viewContainer: ViewContainerRef,
        private cdRef: ChangeDetectorRef,
        private windowRef: WindowRef,
        private el: ElementRef) {}

    public ngOnInit (): void {
        this.renderTemplate();
        this.calculateCanvasSize();
    }

    public ngAfterViewInit (): void {
        this.updatePositioning();
        this.updateVisibility();
    }

    public updatePositioning (): void {
        // maxBufferSize is the same for all the lazy-loaded images on the page. Separate service?
        const maxBufferSize: number = 460; // some arbitrary number to play around with
        this.scrollBufferSize = this.windowRef.nativeWindow.innerHeight < maxBufferSize ?
            this.windowRef.nativeWindow.innerHeight : maxBufferSize;

        this.verticalPosition = this.el.nativeElement.getBoundingClientRect().top;
    }

    @HostListener('window:resize', ['$event'])
    @HostListener('window:scroll', ['$event'])
    public updateVisibility (event?: Event): void {
        const loadingArea: number = this.windowRef.nativeWindow.scrollY + this.windowRef.nativeWindow.innerHeight + this.scrollBufferSize;
        const isImageInLoadingArea: boolean = loadingArea >= this.verticalPosition;

        if (!this.wasInViewport && isImageInLoadingArea) {
            this.wasInViewport = true;
            this.updateResponsiveImage();
        }

        if (event && event.type === 'resize') {
            this.calculateCanvasSize();
            this.updatePositioning();
            this.updateResponsiveImage();
        }

        this.cdRef.detectChanges();
    }

    private renderTemplate (): void {
        this.viewContainer.createEmbeddedView(this.imageTplRef);
        this.cdRef.markForCheck();
    }

    private calculateCanvasSize (): void {
        if (this.stretchStrategy === StretchStrategy.crop || this.stretchStrategy === StretchStrategy.stretch && this.canvasRatio) {
            const canvasWidth: number = this.imageElement.nativeElement.offsetWidth;
            const desiredHeight: number = 1 / this.canvasRatio * canvasWidth;
            this.canvasHeight = Math.floor(desiredHeight);
        }
    }

    private determineBackground (): string {
        const matched: ImageSource[] = this.sources.filter((source: ImageSource, _index: number, _array: ImageSource[]): boolean =>
            this.windowRef.nativeWindow.matchMedia(source.media).matches);

        return matched.length > 0 ? matched[0].url : '';
    }

    private validateInputs (): void {
        if (!this.stretchStrategy) {
            this.stretchStrategy = StretchStrategy.original;
        }

        if (!this.sources.length) {
            throw new Error('No sources provided for the image.');
        }
    }

    private withinCropThreshold (width: number, height: number): boolean {
        const defaultMaxCropAllowed: number = 20;
        const maxCropAllowed: number = this.maxCropPercentage ? this.maxCropPercentage : defaultMaxCropAllowed;
        const ratio: number = width / height;

        return (this.canvasRatio - ratio) / this.canvasRatio * 100 <= maxCropAllowed;
    }

    private updateBackground (): void {
        // This avoids awkward overlay with loading template over the image
        const image: HTMLImageElement = new Image();
        const src: string = this.determineBackground();

        const newBackgroundString: string = `url('${src}')`;

        if (newBackgroundString !== this.backgroundString) {
            this.backgroundString = newBackgroundString;
            image.src = src;
            this.loading = true;

            image.addEventListener('load', () => {
                this.loading = false;

                if (this.stretchStrategy === StretchStrategy.original) {
                    this.canvasHeight = image.height;
                    this.canvasWidth = image.width;
                }

                if (this.stretchStrategy === StretchStrategy.crop) {
                    this.stretchState = this.withinCropThreshold(image.width, image.height)
                        ? StretchStrategy.crop : StretchStrategy.stretch;
                }

                if (this.stretchStrategy === StretchStrategy.stretch) {
                    this.stretchState = StretchStrategy.stretch;
                }
            });
        }
    }

    private updateResponsiveImage (): void {
        this.updateBackground();
        this.validateInputs();

        if (this.stretchStrategy === StretchStrategy.crop) {
            this.calculateCanvasSize();
        }
    }
}
