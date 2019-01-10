import {DoneCallback, Job} from 'bull';

export type BullQueueProcessor = BullQueueProcessorCallback | BullQueueAdvancedProcessor;
export type BullQueueProcessorCallback = ((job: Job, done?: DoneCallback) => void);

export interface BullQueueAdvancedProcessor {
    concurrency?: number;
    callback: BullQueueProcessorCallback;
    name?: string;
}

export function isAdvancedProcessor(processor: BullQueueProcessor): processor is BullQueueAdvancedProcessor {
    return 'object' === typeof processor && !!processor.callback;
}
