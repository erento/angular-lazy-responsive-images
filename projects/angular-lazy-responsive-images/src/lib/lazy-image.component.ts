import {
    AfterViewInit,
    ChangeDetectionStrategy,
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

// maxBufferSize is the same for all the lazy-loaded images on the page. Separate service?
const MAX_BUFFER_SIZE: number = 460; // some arbitrary number to play around with

@Component({
    //tslint:disable-next-line
    selector: 'lazy-image',
    templateUrl: './lazy-image.component.html',
    styleUrls: ['./lazy-image.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LazyImageComponent implements AfterViewInit, OnChanges, OnDestroy, OnInit {
    @Input() public sources: ImageSource[];
    @Input() public metadata: ImageMetadata;
    @Input() public loadingTpl: TemplateRef<any>;
    @Input() public errorTpl: TemplateRef<any>;
    @Input() public canvasRatio: number;
    @Input() public maxCropPercentage: number;
    @Input() public stretchStrategy: StretchStrategy = 'original';
    @Input() public shouldFallbackToImgTag: boolean = false;
    @ViewChild('loadingTplRef', {static: false}) public loadingTplRef: TemplateRef<any>;
    @ViewChild('errorTplRef', {static: false}) public errorTplRef: TemplateRef<any>;

    public wasInViewport: boolean = false;
    public canvasWidth: number;
    public canvasHeight: number;
    public matchedImageUrl: string;
    public backgroundString: string;
    public stretchState: StretchStrategy; // certain strategies can end up in more than one state dynamically
    public loading: boolean = true;
    public errorOccurred: boolean = false;

    @ViewChild('imageElement', {static: true}) private imageElement: ElementRef;

    private scrollBufferSize: number;
    private verticalPosition: number;
    private imageWidth: number;
    private imageHeight: number;
    private errorEventListener: EventListener;
    private loadEventListener: EventListener;
    private image: HTMLImageElement;

    constructor (
        private readonly cdRef: ChangeDetectorRef,
        private readonly el: ElementRef,
        private readonly viewContainer: ViewContainerRef,
        private readonly windowRef: WindowRef,
    ) {}

    public ngOnInit (): void {
        this.calculateCanvasSize();
    }

    public ngOnDestroy (): void {
        if (this.image) {
            this.image.src = ''; // could eventually cancel request in some browsers
            this.image.removeEventListener('load', this.loadEventListener);
            this.image.removeEventListener('error', this.errorEventListener);
            this.image = undefined;
        }
    }

    public ngAfterViewInit (): void {
        this.renderTemplates();
        this.updatePositioning();
        this.updateVisibility();
    }

    public ngOnChanges (): void {
        this.calculateCanvasSize();
    }

    public updatePositioning (): void {
        this.scrollBufferSize = this.windowRef.nativeWindow.innerHeight < MAX_BUFFER_SIZE ?
            this.windowRef.nativeWindow.innerHeight :
            MAX_BUFFER_SIZE;

        this.verticalPosition = this.el.nativeElement.getBoundingClientRect().top;
    }

    @HostListener('window:resize', ['$event'])
    @HostListener('window:scroll', ['$event'])
    public updateVisibility (event?: Event): void {
        const loadingArea: number = this.windowRef.nativeWindow.pageYOffset +
            this.windowRef.nativeWindow.innerHeight +
            this.scrollBufferSize;
        const isImageInLoadingArea: boolean = loadingArea >= this.verticalPosition;

        if (!this.wasInViewport && isImageInLoadingArea) {
            this.wasInViewport = true;
            if (!event || event.type !== 'resize') {
                this.updateResponsiveImage();
            }
        }

        if (event && event.type === 'resize') {
            this.calculateCanvasSize();
            this.updatePositioning();
            this.updateResponsiveImage();
            this.updateStretchState();
        }

        this.cdRef.detectChanges();
    }

    private renderTemplates (): void {
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
        const matched: ImageSource[] = (this.sources || []).filter(
            (source: ImageSource): boolean => this.windowRef.nativeWindow.matchMedia(source.media || '').matches,
        );

        return matched.length > 0 ? matched[0].url : '';
    }

    private withinCropThreshold (width: number, height: number): boolean {
        const defaultMaxCropAllowed: number = 20;
        const maxCropAllowed: number = this.maxCropPercentage ? this.maxCropPercentage : defaultMaxCropAllowed;
        const imageRatio: number = width / height;
        const elementRect: ClientRect = this.el.nativeElement.getBoundingClientRect();
        const canvasRatio: number = elementRect.width / elementRect.height;

        return isNaN(canvasRatio) ? false : Math.abs(canvasRatio - imageRatio) / canvasRatio * 100 <= maxCropAllowed;
    }

    private updateBackground (): void {
        // This avoids awkward overlay with loading template over the image
        const image: HTMLImageElement = new Image();
        const src: string = this.determineBackground();
        const newBackgroundString: string = `url('${src}')`;

        if (newBackgroundString !== this.backgroundString) {
            this.matchedImageUrl = this.metadata && this.metadata.url && this.metadata.url.length > 0 ? this.metadata.url : src;
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
                this.cdRef.detectChanges();
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
            this.stretchState = this.withinCropThreshold(this.imageWidth, this.imageHeight) ? 'crop' : 'stretch';
        }

        if (this.stretchStrategy === 'stretch') {
            this.stretchState = 'stretch';
        }

        this.cdRef.detectChanges();
    }

    private updateResponsiveImage (): void {
        this.validateInputs();
        this.updateBackground();

        if (this.stretchStrategy === 'crop') {
            this.calculateCanvasSize();
        }
    }

    private validateInputs (): void {
        if (!this.stretchStrategy) {
            this.stretchStrategy = 'original';
        }

        if (!this.sources || !this.sources.length) {
            throw new Error('No sources provided for the image.');
        }
    }
}
