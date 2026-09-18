export const Cron = () => {
  return () => undefined;
};

export const CronExpression = {
  EVERY_MINUTE: '* * * * *',
  EVERY_5_MINUTES: '*/5 * * * *',
};

export class ScheduleModule {
  static forRoot() {
    return {
      module: ScheduleModule,
      providers: [],
      exports: [],
    };
  }
}
