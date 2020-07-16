import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  imageSources: {url: string; media: string}[][] = [
    'https://images.unsplash.com/photo-1575993365610-a185fa4bfc73?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1575970470636-32e3c3f4280a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1575961895658-53c39b1d3307?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1575909813087-8529d4a3c434?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1575898200535-44a375c4b3b0?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1575918924377-3625e8a9174f?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1575852755644-98a0b2944861?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1575889449637-02336c8d3652?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1575931391103-c5597f96abab?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1575931642133-b0e7ebd0cb68?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop',
  ].map(imageUrl => {
    return [
      {
        url: imageUrl + '&q=30&w=400',
        media: '(max-width: 480px)',
      },
      {
        url: imageUrl + '&q=80&w=934',
        media: '(min-width: 481px)',
      },
    ];
  });
}
