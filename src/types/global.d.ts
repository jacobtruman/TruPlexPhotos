// Type declarations for globals polyfilled by react-native-get-random-values

declare const crypto: {
  getRandomValues<T extends ArrayBufferView>(array: T): T;
};

