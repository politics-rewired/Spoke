module.exports = {
  sign: true,
  types: [
    { type: "feat", section: "Features" },
    { type: "fix", section: "Bug Fixes" },
    { type: "chore", hidden: false, section: "Backend Changes" },
    { type: "docs", hidden: true },
    { type: "style", hidden: true },
    { type: "refactor", hidden: false, section: "Backend Changes" },
    { type: "perf", hidden: false, section: "Backend Changes" },
    { type: "test", hidden: true }
  ]
};
