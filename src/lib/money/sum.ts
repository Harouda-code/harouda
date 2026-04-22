import { Money } from "./Money";

export function sumMoney(values: Money[]): Money {
  return values.reduce((acc, v) => acc.plus(v), Money.zero());
}
