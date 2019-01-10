import {ModuleMetadata, Type} from '@nestjs/common/interfaces';
import * as Bull from 'bull';
import {BullQueueProcessor} from './bull.types';

export interface BullModuleOptions {
    name?: string;
    options?: Bull.QueueOptions;
    processors?: BullQueueProcessor[];
    retryAttempts?: number;
    retryDelay?: number;
}

export interface BullOptionsFactory {
    createBullOptions(): Promise<BullModuleOptions> | BullModuleOptions;
}

/**
 * @property name Name for this Option. When use forRootAsync, you can omit "name" property on BullModuleOptions
 * @example
 * ```javascript
 * BullModule.forRootAsync({
 *     name: 'queueStore',
 *     imports: [ConfigModule],
 *     useFactory: async (configService: ConfigService) => ({
 *          // name: '', omit this, the outer "name" will be used,
 *          options: {...},
 *          processors: [...],
 *     }),
 *     inject: [ConfigService],
 * })
 * ```
 */
export interface BullModuleAsyncOption extends Pick<ModuleMetadata, 'imports'> {
    name?: string;
    useExisting?: Type<BullOptionsFactory>;
    useClass?: Type<BullOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<BullModuleOptions> | BullModuleOptions;
    inject?: any[];
}
