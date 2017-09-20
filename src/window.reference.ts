import {Injectable} from '@angular/core';

@Injectable()
export class WindowRef {
    private _injectedWindow: any;

    get nativeWindow (): Window {
        return this._injectedWindow ? this._injectedWindow : window;
    }

    public setInjectedWindow (value: Window): void {
        this._injectedWindow = value;
    }
}
