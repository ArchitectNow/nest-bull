import {DynamicModule, Global, Logger, Module, Provider} from '@nestjs/common';

import {BULL_MODULE_ID, BULL_MODULE_OPTIONS} from './bull.constants';
import {BullModuleAsyncOption, BullModuleAsyncOptions, BullModuleOptions, BullOptionsFactory} from './bull.interfaces';
import {createQueues, createQueuesAsync, generateString, getOptionToken} from './bull.utils';

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
        const queueProviders = options.map((option) => createQueuesAsync(option.queueNames, option.name));

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
}
