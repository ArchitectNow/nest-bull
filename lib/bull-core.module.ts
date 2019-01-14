import {DynamicModule, Global, Logger, Module, Provider, Type} from '@nestjs/common';
import * as Bull from 'bull';
import {Queue} from 'bull';
import {isArray} from 'util';

import {BULL_MODULE_ID, BULL_MODULE_OPTIONS} from './bull.constants';
import {BullModuleAsyncOption, BullModuleOptions, BullOptionsFactory} from './bull.interfaces';
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

    static forRootAsync(options: BullModuleAsyncOption[]): DynamicModule {
        const asyncProviders = this.createAsyncProviders(options);
        const queueProviders = this.createAsyncQueueProviders(options);

        /**
         * This is a concatenation of all imports flatten.
         * E.g: [ConfigModule, ConfigModule] if both options have ConfigModule imported.
         * However, we're going to need this Array to be unique as well. In ES6, there's Set
         * that we can use to construct an unique Array.
         *
         * Set takes an array as an argument. To convert Set back to Array, use Spread syntax or Array.from()
         * Type is persisted throughout.
         */
        const moduleImports = this.createModuleImports(options);
        const uniqModuleImports = [...new Set(moduleImports)];

        return {
            module: BullCoreModule,
            imports: uniqModuleImports,
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

    private static createModuleImports(options: BullModuleAsyncOption[]): Type<any>[] {
        return [].concat.apply([], options.map((opt) => opt.imports));
    }

    private static createAsyncProviders(options: BullModuleAsyncOption[]): Provider[] {
        return options.map((option) => {
            if (option.useExisting || option.useFactory) {
                return this.createAsyncOptionsProvider(option);
            }

            return this.createAsyncOptionsProvider(option);
        });
    }

    private static createAsyncOptionsProvider(option: BullModuleAsyncOption): Provider {
        if (option.useFactory) {
            return {
                provide: getOptionToken(option.name),
                useFactory: option.useFactory,
                inject: option.inject || [],
            };
        }

        return {
            provide: getOptionToken(option.name),
            useFactory: async (optionsFactory: BullOptionsFactory) => {
                Logger.log(optionsFactory);
                await optionsFactory.createBullOptions();
            },
            inject: [option.useExisting || option.useClass],
        };
    }

    private static createAsyncQueueProviders(options: BullModuleAsyncOption[]): Provider[] {
        return options.map((option) => ({
            provide: getQueueToken(option.name),
            useFactory: async (bullModuleOptions: BullModuleOptions) => {
                const queue: Queue = new Bull(option.name, bullModuleOptions.options);
                if (isArray(bullModuleOptions.processors)) {
                    for (const processor of bullModuleOptions.processors) {
                        if (isAdvancedProcessor(processor)) {
                            const {name, concurrency, callback} = processor;
                            !!name && !!concurrency
                                ? queue.process(name, concurrency, callback)
                                : !!name
                                    ? queue.process(name, callback)
                                    : queue.process(concurrency, callback);

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
