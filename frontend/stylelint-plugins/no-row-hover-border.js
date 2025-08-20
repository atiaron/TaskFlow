// Stylelint plugin: forbid border changes on .gt-row:hover to prevent layout shift
const ruleName = 'plugin/no-row-hover-border';
const messages = {
  rejected: (prop) => `.gt-row:hover must not set ${prop}; use box-shadow ring tokens instead.`
};

module.exports = function() {
  return {
    postcssPlugin: ruleName,
    Rule(rule, { result }) {
      if (!/\.gt-row:hover/.test(rule.selector)) return;
      rule.walkDecls(decl => {
        if (/^border/.test(decl.prop) && decl.value && decl.value !== 'none' && decl.value !== '0') {
          result.warn(messages.rejected(decl.prop), { node: decl, word: decl.prop, rule: ruleName });
        }
      });
    }
  };
};
module.exports.ruleName = ruleName;
module.exports.messages = messages;
