import type { ViewportPhysics } from '../../../viewport/ViewportPhysics';
import type { ViewportCanvasInputHost } from '../host/viewportInputPolicy';
import { ViewportCanvasBase } from './ViewportCanvasBase';

export class FilteredViewportCanvas extends ViewportCanvasBase {
  constructor(physics: ViewportPhysics, inputHost: ViewportCanvasInputHost) {
    super(physics, 'filtered', inputHost);
  }
}
