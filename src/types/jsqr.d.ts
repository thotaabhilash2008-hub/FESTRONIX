declare module 'jsqr' {
  export interface JsQrResult {
    data: string;
  }

  export interface JsQrOptions {
    inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth';
  }

  const jsQR: (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: JsQrOptions,
  ) => JsQrResult | null;

  export default jsQR;
}
