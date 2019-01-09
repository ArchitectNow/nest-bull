import * as Bull from 'bull';
import {Queue} from 'bull';
import {isArray} from 'util';
import * as uuid from 'uuid/v4';

import {BullModuleOptions} from './bull.interfaces';
import {BullQueueProcessor, isAdvancedProcessor} from './bull.types';

export function getQueueToken(name?: string): string {
    return name ? `BullQueue_${name}` : 'BullQueue_default';
}

export function getOptionToken(name?: string): string {
    return name ? `BullQueueOption_${name}` : 'BullQueueOption_default';
}

export function createQueues(options: BullModuleOptions[]): any[] {
    return options.map((option: BullModuleOptions) => ({
        provide: getQueueToken(option.name),
        useFactory: (): Queue => {
            const queue: Queue = new Bull(option.name, option.options);
            if (isArray(option.processors)) {
                option.processors.forEach((processor: BullQueueProcessor) => {
                    if (isAdvancedProcessor(processor)) {
                        const hasName = !!processor.name;
                        const hasConcurrency = !!processor.concurrency;
                        hasName && hasConcurrency
                            ? queue.process(processor.name, processor.concurrency, processor.callback)
                            : hasName
                            ? queue.process(processor.name, processor.callback)
                            : queue.process(processor.concurrency, processor.callback);
                    } else {
                        queue.process(processor);
                    }
                });
            }
            return queue;
        },
    }));
}

export function createQueuesAsync(queueNames: string[], optionName: string) {
    return queueNames.reduce((acc: any, cur: string) => {
        acc = {
            provide: getQueueToken(cur),
            useFactory: async (bullModuleOptions: BullModuleOptions) => {
                const queue: Queue = new Bull(cur, bullModuleOptions.options);
                if (isArray(bullModuleOptions.processors)) {
                    for (const processor of bullModuleOptions.processors) {
                        if (isAdvancedProcessor(processor)) {
                            const hasConcurrency = !!processor.concurrency;
                            hasConcurrency
                                ? queue.process(cur, processor.concurrency, processor.callback)
                                : queue.process(cur, processor.callback);
                        } else {
                            queue.process(processor);
                        }
                    }
                }
                return queue;
            },
            inject: [getOptionToken(optionName)],
        };
        return acc;
    }, {});
}

export const generateString = () => uuid();
