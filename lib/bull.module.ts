import {DynamicModule, Module} from '@nestjs/common';

import {BullCoreModule} from './bull-core.module';
import {BullModuleAsyncOption, BullModuleAsyncOptions, BullModuleOptions} from './bull.interfaces';
import {createQueues} from './bull.utils';

@Module({})
export class BullModule {
    static forRoot(options: BullModuleOptions | BullModuleOptions[]): DynamicModule {
        return {
            module: BullModule,
            imports: [BullCoreModule.forRoot([].concat(options))],
        };
    }

    static forFeature(options: BullModuleOptions[]) {
        const providers = createQueues(options);
        return {
            module: BullModule,
            providers,
            exports: providers,
        };
    }

    static forRootAsync(options: BullModuleAsyncOption | BullModuleAsyncOptions): DynamicModule {
        return {
            module: BullModule,
            imports: [BullCoreModule.forRootAsync([].concat(options))],
        };
    }
}
