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

export interface BullModuleAsyncOption {
    name?: string;
    queueNames?: string[];
    useExisting?: Type<BullOptionsFactory>;
    useClass?: Type<BullOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<BullModuleOptions> | BullModuleOptions;
    inject?: any[];
}

export type BullModuleAsyncOptions = (BullModuleAsyncOption | BullModuleAsyncOption[]) & Pick<ModuleMetadata, 'imports'>;
