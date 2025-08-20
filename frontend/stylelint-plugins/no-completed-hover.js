// Stylelint plugin: disallow hover selectors on completed rows beyond the allowed minimal pattern
const ruleName = 'plugin/no-completed-hover';
const messages = {
  rejected: (sel) => `Avoid hover styling on completed rows: '${sel}'. Use focus-visible ring only.`
};

module.exports = function() {
  return {
    postcssPlugin: ruleName,
    Rule(rule, { result }) {
      if (/\.gt-row\.is-completed:hover/.test(rule.selector)) {
        // Allow the single baseline rule we define (opacity + base ring) by whitelisting exact property set
        // Simpler: always warn (strict)
        result.warn(messages.rejected(rule.selector), { node: rule, word: rule.selector, rule: ruleName });
      }
    }
  };
};
module.exports.ruleName = ruleName;
module.exports.messages = messages;
