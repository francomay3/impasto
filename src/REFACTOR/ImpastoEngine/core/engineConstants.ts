/**
 * Re-exports engine constants from infra/ for layers that sit above the pipeline boundary.
 * Lower layers (pipeline/) import directly from infra/engineConstants to respect the architecture rule.
 */
export { INPUT_THROTTLE_MS } from '../infra/engineConstants';
