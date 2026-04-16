import type { ViewportPhysics } from '../../../viewport/ViewportPhysics';
import type { ViewportCanvasInputHost } from '../host/viewportInputPolicy';
import { ViewportCanvasBase } from './ViewportCanvasBase';

export class IndexedViewportCanvas extends ViewportCanvasBase {
  constructor(physics: ViewportPhysics, inputHost: ViewportCanvasInputHost) {
    super(physics, 'indexed', inputHost);
  }
}
