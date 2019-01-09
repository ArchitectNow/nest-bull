import { DynamicModule, Global, Inject, Logger, Module, Provider } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import * as Bull from 'bull'
import * as Redis from 'ioredis'

import { BULL_MODULE_ID, BULL_MODULE_OPTIONS } from './bull.constants'
import { BullModuleAsyncOptions, BullModuleOptions, BullOptionsFactory } from './bull.interfaces'
import { generateString, getConnectionToken } from './bull.utils'

@Global()
@Module({})
export class BullCoreModule {
  constructor(
    @Inject(BULL_MODULE_OPTIONS)
    private readonly options: BullModuleOptions,
    private readonly moduleRef: ModuleRef
  ) {}

  static forRoot(options: BullModuleOptions = {}): DynamicModule {
    const bullModuleOptions = {
      provide: BULL_MODULE_OPTIONS,
      useValue: options,
    }

    const connectionProvider = {
      provide: getConnectionToken(options.options),
      useFactory: async () => await this.createConnectionFactory(options),
    }

    return {
      module: BullCoreModule,
      providers: [connectionProvider, bullModuleOptions],
      exports: [connectionProvider],
    }
  }

  static forRootAsync(options: BullModuleAsyncOptions): DynamicModule {
    const connectionProvider = {
      provide: getConnectionToken(options as Bull.QueueOptions),
      useFactory: async (bullModuleOptions: BullModuleOptions) => {
        if (options.name) {
          return await this.createConnectionFactory({
            ...bullModuleOptions,
            name: options.name,
          })
        }
        return await this.createConnectionFactory(bullModuleOptions)
      },
      inject: [BULL_MODULE_OPTIONS],
    }

    const asyncProviders = this.createAsyncProviders(options)

    return {
      module: BullCoreModule,
      imports: options.imports,
      providers: [
        ...asyncProviders,
        connectionProvider,
        {
          provide: BULL_MODULE_ID,
          useValue: generateString(),
        },
      ],
      exports: [connectionProvider],
    }
  }

  /*async onModuleDestroy() {
    const connection = this.moduleRef.get<any>(
      getConnectionToken(this.options as Bull.QueueOptions)
    )
    connection && (await connection.close())
  }*/

  private static createAsyncProviders(options: BullModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)]
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useValue: options.useClass,
      },
    ]
  }

  private static createAsyncOptionsProvider(options: BullModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: BULL_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }

    return {
      provide: BULL_MODULE_OPTIONS,
      useFactory: async (optionsFactory: BullOptionsFactory) => {
        Logger.log(optionsFactory)
        optionsFactory.createBullOptions()
      },
      inject: [options.useExisting || options.useClass],
    }
  }

  private static async createConnectionFactory(options: BullModuleOptions): Promise<any> {
    return new Redis(options)
  }
}
