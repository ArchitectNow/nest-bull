/* tslint:disable */
import {Module} from '@nestjs/common';
import {BullModule} from '../../../lib';
import {ConfigModule} from './config/config.module';
import {ConfigService} from './config/config.service';

@Module({
    imports: [
        ConfigModule,
        BullModule.forRootAsync({
            name: 'tesingStore',
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const config = configService.fetchConfig();
                console.log({config});
                return {
                    options: {
                        redis: {
                            host: config.redis.host,
                            port: config.redis.port,
                            password: config.redis.password,
                        },
                    },
                    processors: [
                        {
                            name: 'testing', concurrency: 1, callback: (job, done) => {
                                console.log(job);
                                return done(null, 'Done');
                            },
                        },
                    ],
                };
            },
            inject: [ConfigService],
        })],
})
export class AppModule {
}
