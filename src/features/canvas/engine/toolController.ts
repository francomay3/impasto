import { createActor } from 'xstate'
import { interactionMachine, deriveToolState, type ToolState } from './interactionMachine'

export class ToolController {
  private actor = createActor(interactionMachine)

  constructor(onTransition: (tool: ToolState) => void) {
    this.actor.subscribe(snapshot => {
      onTransition(deriveToolState(snapshot.context, snapshot.value as string))
    })
    this.actor.start()
  }

  getCurrentTool(): ToolState {
    const snap = this.actor.getSnapshot()
    return deriveToolState(snap.context, snap.value as string)
  }

  selectTool(id: 'select' | 'marquee'): void { this.actor.send({ type: 'SELECT_TOOL', tool: id }) }
  activateEyedropper(): void { this.actor.send({ type: 'ACTIVATE_EYEDROPPER' }) }
  toggleMarquee(): void {
    const v = this.actor.getSnapshot().value as string
    this.actor.send({ type: 'SELECT_TOOL', tool: v === 'marquee' ? 'select' : 'marquee' })
  }
  startSamplingColor(colorId: string): void { this.actor.send({ type: 'START_SAMPLING_COLOR', colorId }) }
  startSamplingLevels(filterId: string, point: 'black' | 'white'): void {
    this.actor.send({ type: 'START_SAMPLING_LEVELS', filterId, point })
  }
  completeSample(): void { this.actor.send({ type: 'SAMPLE_COMPLETE' }) }
  cancel(): void { this.actor.send({ type: 'CANCEL' }) }
  setSamplingRadius(radius: number): void { this.actor.send({ type: 'SET_SAMPLING_RADIUS', radius }) }
}
