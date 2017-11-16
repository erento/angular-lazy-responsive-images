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

import {WindowRef} from '../../shared/window.reference';

export interface ImageSource {
    media: string;
    url: string;
}

export type StretchStrategy = 'crop' | 'stretch' | 'original';

@Component({
    selector: 'lazy-image',
    templateUrl: './lazy-image.component.html',
    styleUrls: ['./lazy-image.component.scss'],
    providers: [WindowRef],
})
export class LazyImageComponent implements AfterViewInit, OnInit {
    @Input() public sources: ImageSource[];
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

    constructor (
        private viewContainer: ViewContainerRef,
        private cdRef: ChangeDetectorRef,
        private windowRef: WindowRef,
        private el: ElementRef) {}

    public ngOnInit (): void {
        this.renderTemplate();
        this.calculateCanvasSize();
        console.log('instantiated');
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

            console.log(this.canvasRatio);
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

            image.addEventListener('load', () => {
                this.loading = false;
                this.imageWidth = image.width;
                this.imageHeight = image.height;
                this.updateStretchState();
            });

            image.addEventListener('error', () => {
                this.loading = false;
                this.errorOccurred = true;
            });
        }
    }

    private updateStretchState (): void {
        console.log('updatestretchstate was called');
        if (this.stretchStrategy === 'original') {
            this.canvasHeight = this.imageHeight;
            this.canvasWidth = this.imageWidth;
            this.stretchState = 'original';
        }

        if (this.stretchStrategy === 'crop') {
            console.log('were joyfully here')
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
