import {Module} from '@nestjs/common';
import {Config} from './config';
import {ConfigService} from './config.service';

const configProvider = {
    provide: 'Config',
    useFactory: () => new Config(),
};

@Module({
    providers: [configProvider, ConfigService],
    exports: [configProvider, ConfigService],
})
export class ConfigModule {
}
