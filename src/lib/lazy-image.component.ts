import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import {WindowRef} from './utils/window.reference';

export interface ImageSource {
    media: string;
    url: string;
}

export interface ImageMetadata {
    keywords: string;
    name: string;
    url: string;
}

export type StretchStrategy = 'crop' | 'stretch' | 'original';

@Component({
    //tslint:disable-next-line
    selector: 'lazy-image',
    templateUrl: './lazy-image.component.html',
    styleUrls: ['./lazy-image.component.scss'],
})
export class LazyImageComponent implements AfterViewInit, OnChanges, OnDestroy, OnInit {
    @Input() public sources: ImageSource[];
    @Input() public metadata: ImageMetadata;
    @Input() public visibilityOverride: boolean;
    @Input() public loadingTpl: TemplateRef<any>;
    @Input() public errorTpl: TemplateRef<any>;
    @Input() public canvasRatio: number;
    @Input() public maxCropPercentage: number;
    @Input() public stretchStrategy: StretchStrategy = 'original';
    @ViewChild('loadingTplRef') public loadingTplRef: TemplateRef<any>;
    @ViewChild('errorTplRef') public errorTplRef: TemplateRef<any>;

    public wasInViewport: boolean = false;
    public canvasWidth: number;
    public canvasHeight: number;
    public backgroundString: string;
    public stretchState: StretchStrategy; // certain strategies can end up in more than one state dynamically
    public loading: boolean = true;
    public errorOccurred: boolean = false;

    @ViewChild('imageElement') private imageElement: ElementRef;

    private scrollBufferSize: number;
    private verticalPosition: number;
    private imageWidth: number;
    private imageHeight: number;
    private errorEventListener: EventListener;
    private loadEventListener: EventListener;
    private image: HTMLImageElement;

    constructor (
        private cdRef: ChangeDetectorRef,
        private el: ElementRef,
        private viewContainer: ViewContainerRef,
        private windowRef: WindowRef,
    ) {}

    public ngOnInit (): void {
        this.renderTemplate();
        this.calculateCanvasSize();
    }

    public ngOnDestroy (): void {
        if (this.image) {
            this.image.removeEventListener('load', this.loadEventListener);
            this.image.removeEventListener('error', this.errorEventListener);
            this.image = undefined;
        }
    }

    public ngAfterViewInit (): void {
        this.updatePositioning();
        this.updateVisibility();
    }

    public ngOnChanges (): void {
        this.calculateCanvasSize();
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
        const loadingArea: number = this.windowRef.nativeWindow.pageYOffset
            + this.windowRef.nativeWindow.innerHeight + this.scrollBufferSize;
        const isImageInLoadingArea: boolean = loadingArea >= this.verticalPosition;

        if (!this.wasInViewport && isImageInLoadingArea) {
            this.wasInViewport = true;
            this.updateResponsiveImage();
        }

        if (event && event.type === 'resize') {
            this.calculateCanvasSize();
            this.updatePositioning();
            this.updateResponsiveImage();
            this.updateStretchState();
        }

        this.cdRef.detectChanges();
    }

    private renderTemplate (): void {
        this.viewContainer.createEmbeddedView(this.loadingTplRef);
        this.viewContainer.createEmbeddedView(this.errorTplRef);
        this.cdRef.detectChanges();
    }

    private calculateCanvasSize (): void {
        if ((this.stretchStrategy === 'crop' || this.stretchStrategy === 'stretch') && this.canvasRatio) {
            const canvasWidth: number = this.imageElement.nativeElement.offsetWidth;
            const desiredHeight: number = 1 / this.canvasRatio * canvasWidth;
            this.canvasHeight = Math.floor(desiredHeight);
        }
    }

    private determineBackground (): string {
        const matched: ImageSource[] = this.sources.filter((source: ImageSource, _index: number, _array: ImageSource[]): boolean =>
            this.windowRef.nativeWindow.matchMedia(source.media || '').matches);

        return matched.length > 0 ? matched[0].url : '';
    }

    private validateInputs (): void {
        if (!this.stretchStrategy) {
            this.stretchStrategy = 'original';
        }

        if (!this.sources.length) {
            throw new Error('No sources provided for the image.');
        }
    }

    private withinCropThreshold (width: number, height: number): boolean {
        const defaultMaxCropAllowed: number = 20;
        const maxCropAllowed: number = this.maxCropPercentage ? this.maxCropPercentage : defaultMaxCropAllowed;
        const imageRatio: number = width / height;
        const canvasRatio: number = this.el.nativeElement.getBoundingClientRect().width /
            this.el.nativeElement.getBoundingClientRect().height;

        return isNaN(canvasRatio) ? false : Math.abs(canvasRatio - imageRatio) / canvasRatio * 100 <= maxCropAllowed;
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

            this.loadEventListener = (): void => {
                this.loading = false;
                this.imageWidth = image.width;
                this.imageHeight = image.height;
                this.updateStretchState();
            };
            image.addEventListener('load', this.loadEventListener);

            this.errorEventListener = (): void => {
                this.loading = false;
                this.errorOccurred = true;
            };
            image.addEventListener('error', this.errorEventListener);

            this.image = image;
        }
    }

    private updateStretchState (): void {
        if (this.stretchStrategy === 'original') {
            this.canvasHeight = this.imageHeight;
            this.canvasWidth = this.imageWidth;
            this.stretchState = 'original';
        }

        if (this.stretchStrategy === 'crop') {
            this.stretchState = this.withinCropThreshold(this.imageWidth, this.imageHeight)
                ? 'crop' : 'stretch';
        }

        if (this.stretchStrategy === 'stretch') {
            this.stretchState = 'stretch';
        }

        this.cdRef.detectChanges();
    }

    private updateResponsiveImage (): void {
        this.updateBackground();
        this.validateInputs();

        if (this.stretchStrategy === 'crop') {
            this.calculateCanvasSize();
        }
    }
}
