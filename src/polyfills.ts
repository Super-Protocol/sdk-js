if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function (): string {
    return this.toString();
  };
}
