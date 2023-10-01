export interface SeasonAPISchema {
  info: {
    ID: number;
    Name: string;
    Split: number;
  };
  dates: {
    Start: number;
    Split: number;
    End: number;
  };
}
