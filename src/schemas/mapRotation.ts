export interface ALSMapRotationAPIObject {
  battle_royale: {
    current: {
      start: number;
      end: number;
      readableDate_start: string;
      readableDate_end: string;
      map: string;
      code: string;
      DurationInSecs: number;
      DurationInMinutes: number;
      asset: string;
      remainingSecs: number;
      remainingMins: number;
      remainingTimer: string;
    };
    next: {
      start: number;
      end: number;
      readableDate_start: string;
      readableDate_end: string;
      map: string;
      code: string;
      DurationInSecs: number;
      DurationInMinutes: number;
      asset: string;
    };
  };
  arenas: {
    current: {
      start: number;
      end: number;
      readableDate_start: string;
      readableDate_end: string;
      map: string;
      code: string;
      DurationInSecs: number;
      DurationInMinutes: number;
      asset: string;
      remainingSecs: number;
      remainingMins: number;
      remainingTimer: string;
    };
    next: {
      start: number;
      end: number;
      readableDate_start: string;
      readableDate_end: string;
      map: string;
      code: string;
      DurationInSecs: number;
      DurationInMinutes: number;
      asset: string;
    };
  };
  ranked: {
    current: {
      start: number;
      end: number;
      readableDate_start: string;
      readableDate_end: string;
      map: string;
      code: string;
      DurationInSecs: number;
      DurationInMinutes: number;
      asset: string;
      remainingSecs: number;
      remainingMins: number;
      remainingTimer: string;
    };
    next: {
      start: number;
      end: number;
      readableDate_start: string;
      readableDate_end: string;
      map: string;
      code: string;
      DurationInSecs: number;
      DurationInMinutes: number;
      asset: string;
    };
  };
  arenasRanked: {
    current: {
      start: number;
      end: number;
      readableDate_start: string;
      readableDate_end: string;
      map: string;
      code: string;
      DurationInSecs: number;
      DurationInMinutes: number;
      asset: string;
      remainingSecs: number;
      remainingMins: number;
      remainingTimer: string;
    };
    next: {
      start: number;
      end: number;
      readableDate_start: string;
      readableDate_end: string;
      map: string;
      code: string;
      DurationInSecs: number;
      DurationInMinutes: number;
      asset: string;
    };
  };
  ltm: {
    current: {
      start: number;
      end: number;
      readableDate_start: string;
      readableDate_end: string;
      map: string;
      code: string;
      DurationInSecs: number;
      DurationInMinutes: number;
      isActive: boolean;
      eventName: string;
      asset: string;
      remainingSecs: number;
      remainingMins: number;
      remainingTimer: string;
    };
    next: {
      start: number;
      end: number;
      readableDate_start: string;
      readableDate_end: string;
      map: string;
      code: string;
      DurationInSecs: number;
      DurationInMinutes: number;
      isActive: boolean;
      eventName: string;
      asset: string;
    };
  };
}
