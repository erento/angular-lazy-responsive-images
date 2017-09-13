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

export enum stretchStrategy {
    crop = 'crop',
    stretch = 'stretch',
    original = 'original',
}

@Component({
    selector: 'image',
    templateUrl: './image.component.html',
    styleUrls: ['./image.component.css'],
})
export class ImageComponent implements AfterViewInit, OnInit {
    @Input() public sources: ImageSource[];
    @Input() public visibilityOverride: boolean;
    @Input() public loadingTpl: TemplateRef<any>;
    @Input() public canvasRatio: number;
    @Input() public maxCropPercentage: number;
    @Input() public stretchStrategy: stretchStrategy = stretchStrategy.original;
    @ViewChild('imageTplRef') public imageTplRef: TemplateRef<any>;

    public wasInViewport: boolean = false;
    public canvasWidth: number;
    public canvasHeight: number;
    public backgroundString: string;
    public stretchState: stretchStrategy; // certain strategies can end up in more than one state dynamically
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

        if (this.stretchStrategy === stretchStrategy.crop) {
            this.calculateCanvasSizeForCrop();
        }
    }

    public ngAfterViewInit (): void {
        this.updatePositioning();
        this.updateVisibility();
    }

    /* TODO file an issue in ng2;
       HostListener overwrites handlers as if one event could only have one handler.
    */
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

        // i can't reflect on how annoying and stupid this is
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
        const canvasWidth: number = this.imageElement.nativeElement.offsetWidth;
        const desiredHeight: number = 1 / this.canvasRatio * canvasWidth;
        this.canvasHeight = Math.floor(desiredHeight);
    }

    private determineBackground (): string {
        const matched: ImageSource[] = this.sources.filter((source: ImageSource, _index: number, _array: ImageSource[]): boolean =>
            window.matchMedia(source.media).matches);

        return matched.length > 0 ? matched[0].url : undefined;
    }

    private validateInputs (): void {
        const defaultRatio: number = 487 / 366; // Typical gallery preview size
        // fallback to defaults of 4:3 image ratio
        if (this.stretchStrategy === stretchStrategy.crop
            && !(this.canvasRatio)) {
            this.canvasRatio = defaultRatio;
        }

        if (!this.stretchState) {
            this.stretchState = stretchStrategy.original;
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

            if (this.stretchStrategy === stretchStrategy.original) {
                this.canvasHeight = image.height;
                this.canvasWidth = image.width;
            }

            if (this.stretchStrategy === stretchStrategy.crop) {
                this.stretchState = this.withinCropThreshold(image.width, image.height)
                    ? stretchStrategy.crop : stretchStrategy.stretch;
            }
        });
    }

    private updateResponsiveImage (): void {
        this.updateBackground();
        this.validateInputs();

        if (this.stretchStrategy === stretchStrategy.crop) {
            this.calculateCanvasSizeForCrop();
        }
    }
}
