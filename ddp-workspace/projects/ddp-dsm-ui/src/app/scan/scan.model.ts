export class ScanPair {
  public error: string;

  constructor(public leftValue: string, public rightValue: string) {
    this.leftValue = leftValue;
    this.rightValue = rightValue;
  }
}

// eslint-disable-next-line max-classes-per-file
export class ScanValue {
  public error: string;

  constructor(public kit: string) {
    this.kit = kit;
  }
}
