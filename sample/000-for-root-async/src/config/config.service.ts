import {Inject, Injectable} from '@nestjs/common';
import {Config} from './config';

@Injectable()
export class ConfigService {
    constructor(@Inject('Config') private readonly config: Config) {
    }

    fetchConfig(): Config {
        return this.config;
    }
}
