// Custom Stylelint rule: disallow raw px values outside theme/token files
// Allows px when defining a CSS variable name (e.g., --space-1: 4px) inside theme.css (tokens layer)
// and inside calc() expressions referencing a var that already holds px (cannot easily enforce). Otherwise flags.

const path = require('path');

const ruleName = 'plugin/no-px-outside-tokens';
const messages = {
  rejected: (value) => `Raw px value "${value}" found. Use a design token (var(--...)) instead.`
};

module.exports = function(primaryOption, secondaryOptions, context) {
  return {
    postcssPlugin: ruleName,
    Once(root, { result }) {
      const file = root?.source?.input?.file || '';
      const isTokenFile = /theme\.css$/.test(file);

      root.walkDecls(decl => {
        const { prop, value } = decl;
        // Allow CSS variable declarations in token file
        if (isTokenFile && prop.startsWith('--')) return;
        // Skip if value already uses a var exclusively
        if (/^var\(.*\)$/.test(value.trim())) return;
        // Allow zero values (0px -> should prefer 0 but ignore quietly)
        if (value.trim() === '0px') return;
        const pxMatches = value.match(/([0-9]*\.?[0-9]+)px\b/g);
        if (!pxMatches) return;
        // Allow inside calc(var(--token) * X) pattern (heuristic)
        if (/calc\([^)]*var\(/.test(value)) {
          // strip var(...) portions and re-check remaining for bare px
          const stripped = value.replace(/var\([^)]*\)/g,'');
          if (!/([0-9]*\.?[0-9]+)px\b/.test(stripped)) return;
        }
        // If we reach here and not token file variable, flag each px found
        pxMatches.forEach(px => {
          result.warn(messages.rejected(px), { node: decl, word: px, rule: ruleName });
        });
      });
    }
  };
};

module.exports.ruleName = ruleName;
module.exports.messages = messages;
