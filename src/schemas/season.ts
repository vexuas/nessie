export interface SeasonAPISchema {
  info: {
    season: number;
    title: string;
    description?: string;
    split: number;
    data: {
      tagline: string;
      url: string;
      image: string;
    };
  };
  dates: {
    start: {
      timestamp: number;
      readable: string;
      since: number;
      untilNext: number;
    };
    split: {
      timestamp: number;
      readable: string;
      since: number;
      untilNext: number;
    };
    end: {
      timestamp: number;
      readable: string;
      rankedEnd: number;
      rankedEndReadable: string;
    };
  };
}
