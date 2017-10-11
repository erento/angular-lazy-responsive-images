# Lazy loaded, responsive images for Angular

## Requirements & compatibility

The package was tested with Angular 4.3.6 and TypeScrtipt 2.4.2. It is using `window.matchMedia()`, check [here](http://caniuse.com/#feat=matchmedia) for compatibility table (TLDR; IE10 and higher).

## Usage

`npm install angular-lazy-responsive-images`

and then import the component into your module

```typescript
import {LazyImageModule} from 'angular-lazy-responsive-images';

//...
imports: [LazyImageModule],
//...
```

### Placement in template

```html
<lazy-image
    [sources]="your_sources"
    [loadingTpl]="imageLoadingTemplate"
    [errorTpl]="imageErrorTemplate"
    >
</lazy-image>

<ng-template #imageLoadingTemplate>
    <!-- Whatever should be shown during the loading -->
</ng-template>
<ng-template #imageErrorTemplate>
    <!-- Whatever should be shown during the loading -->
</ng-template>
```

### Options overview

`stretchStrategy` - can take either `crop`, `original` or `stretch`.

#### Stretch strategies

`original` - displays original image in it's original ratio, fitted to the witdh of container.

`crop` - will display the image in it's orignal ratio regardless if it fits the canvas or not.

`maxCropPercentage` - an integer between 0 and 100. Option 'maxCropPercentage' determines how much of the image surface can be cropped, beyond that, it's going to be contained in the canvas. The default is 20%.

`canvasRatio` - a float, so `4:3` ratio is actually `1.333...`. Stretches the width of canvas to 100% and presves the given ratio.

`stretch` - the picture will be preserved in its original ratio and contained in the canvas.

If `crop` or `stretch` strategy is set, but no `canvasRatio` given, the height is not set (so one can apply height by CSS class).

#### Image sources

`sources` - takes a list of URLs to your images, associated with the media queries that need to be matched to display them, e.g.

```javascript
let sources = [
	{
		media: '(min-width: 468px)',
		url: 'http://example.com/image.jpg'
	},
	{
		media: '(max-width: 468px)',
		url: 'http://example.com/some_other_image.jpg'
	}
];
```

#### Custimization

`loadingTpl` - shown during loading. Reference to `ng-template` as shown in the example above.
`errorTpl` -  shown if image fails to load. Reference to `ng-template` as shown in the example above.