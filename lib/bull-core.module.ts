import {DynamicModule, Global, Logger, Module, Provider} from '@nestjs/common';
import * as Bull from 'bull';
import {Queue} from 'bull';
import {isArray} from 'util';

import {BULL_MODULE_ID, BULL_MODULE_OPTIONS} from './bull.constants';
import {BullModuleAsyncOption, BullModuleAsyncOptions, BullModuleOptions, BullOptionsFactory} from './bull.interfaces';
import {isAdvancedProcessor} from './bull.types';
import {createQueues, generateString, getOptionToken, getQueueToken} from './bull.utils';

@Global()
@Module({})
export class BullCoreModule {
    static forRoot(options: BullModuleOptions[]): DynamicModule {
        const bullModuleOptions = {
            provide: BULL_MODULE_OPTIONS,
            useValue: options,
        };

        const queueProviders = createQueues(options);

        return {
            module: BullCoreModule,
            providers: [bullModuleOptions, ...queueProviders],
            exports: [bullModuleOptions, ...queueProviders],
        };
    }

    static forRootAsync(options: BullModuleAsyncOptions): DynamicModule {
        const asyncProviders = this.createAsyncProviders(options);
        const queueProviders = this.createAsyncQueueProviders(options);

        return {
            module: BullCoreModule,
            imports: options.imports,
            providers: [
                ...asyncProviders,
                ...queueProviders,
                {
                    provide: BULL_MODULE_ID,
                    useValue: generateString(),
                },
            ],
            exports: [...queueProviders],
        };
    }

    private static createAsyncProviders(options: BullModuleAsyncOptions): Provider[] {
        return options.map((option) => {
            if (option.useExisting || option.useFactory) {
                return this.createAsyncOptionsProvider(option);
            }

            return this.createAsyncOptionsProvider(option);
        });
    }

    private static createAsyncOptionsProvider(options: BullModuleAsyncOption): Provider {
        if (options.useFactory) {
            return {
                provide: getOptionToken(options.name),
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
        }

        return {
            provide: getOptionToken(options.name),
            useFactory: async (optionsFactory: BullOptionsFactory) => {
                Logger.log(optionsFactory);
                await optionsFactory.createBullOptions();
            },
            inject: [options.useExisting || options.useClass],
        };
    }

    private static createAsyncQueueProviders(options: BullModuleAsyncOptions): Provider[] {
        return options.map((option) => ({
            provide: getQueueToken(option.name),
            useFactory: async (bullModuleOptions: BullModuleOptions) => {
                const queue: Queue = new Bull(option.name, bullModuleOptions.options);
                if (isArray(bullModuleOptions.processors)) {
                    for (const processor of bullModuleOptions.processors) {
                        if (isAdvancedProcessor(processor)) {
                            const hasConcurrency = !!processor.concurrency;
                            hasConcurrency
                                ? queue.process(processor.name, processor.concurrency, processor.callback)
                                : queue.process(processor.name, processor.callback);
                        } else {
                            queue.process(processor);
                        }
                    }
                }
                return queue;
            },
            inject: [getOptionToken(option.name)],
        }));
    }
}
