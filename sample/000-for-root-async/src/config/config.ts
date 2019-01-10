export class Config {
    redis = {
        enableQueuing: false,
        enableCaching: false,
        enableQueueUI: true,
        queueUIPath: '/bull',
        host: 'localhost',
        port: 6379,
        password: '',
    };
}
