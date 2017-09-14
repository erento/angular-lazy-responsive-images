import {
    Component,
    Input,
    HostListener,
    ViewChild,
    ElementRef,
    AfterViewInit,
    ChangeDetectorRef,
    TemplateRef,
    ViewContainerRef,
    OnInit
    } from '@angular/core';

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
    selector: 'e-image',
    templateUrl: './image.component.html',
    styleUrls: ['./image.component.scss'],
})
export class ImageComponent implements AfterViewInit, OnInit {
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
        public viewContainer: ViewContainerRef,
        private cdRef: ChangeDetectorRef,
        private el: ElementRef) {}

    public ngOnInit (): void {
        this.renderTemplate();

        if (this.stretchStrategy === StretchStrategy.crop) {
            this.calculateCanvasSizeForCrop();
        }
    }

    public ngAfterViewInit (): void {
        this.updatePositioning();
        this.updateVisibility();
    }

    public updatePositioning (): void {
        // maxBufferSize is the same for all the lazy-loaded images on the page. Separate service?
        const maxBufferSize: number = 260; // some arbitrary number to play around with
        this.scrollBufferSize = window.innerHeight < maxBufferSize ? window.innerHeight : maxBufferSize;

        this.verticalPosition = this.el.nativeElement.offsetTop;
    }

    @HostListener('window:resize', ['$event'])
    @HostListener('window:scroll', ['$event'])
    public updateVisibility (event?: Event): void {
        const loadingArea: number = window.scrollY + window.innerHeight + this.scrollBufferSize;
        const isImageInLoadingArea: boolean = loadingArea >= this.verticalPosition;

        if (!this.wasInViewport && isImageInLoadingArea) {
            this.wasInViewport = true;
            this.updateResponsiveImage();
        }

        if (event && event.type === 'resize') {
            this.updatePositioning();
            this.updateResponsiveImage();
        }

        this.cdRef.detectChanges();
    }

    private renderTemplate (): void {
        this.viewContainer.createEmbeddedView(this.imageTplRef);
        this.cdRef.markForCheck();
    }

    private calculateCanvasSizeForCrop (): void {
        if (typeof this.canvasRatio === 'number') {
            const canvasWidth: number = this.imageElement.nativeElement.offsetWidth;
            const desiredHeight: number = 1 / this.canvasRatio * canvasWidth;
            this.canvasHeight = Math.floor(desiredHeight);
        }
    }

    private determineBackground (): string {
        const matched: ImageSource[] = this.sources.filter((source: ImageSource, _index: number, _array: ImageSource[]): boolean =>
            window.matchMedia(source.media).matches);

        return matched.length > 0 ? matched[0].url : undefined;
    }

    private validateInputs (): void {
        if (!this.stretchState) {
            this.stretchState = StretchStrategy.original;
        }
    }

    private withinCropThreshold (width: number, height: number): boolean {
        const defaultMaxCropAllowed: number = 30;
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
        }

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
        });
    }

    private updateResponsiveImage (): void {
        this.updateBackground();
        this.validateInputs();

        if (this.stretchStrategy === StretchStrategy.crop) {
            this.calculateCanvasSizeForCrop();
        }
    }
}
