function isClient() {
  return typeof window !== "undefined";
}

module.exports = {
  isClient
};
