import angular from "angular-eslint";
import nx from "@nx/eslint-plugin";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**", ".angular/**"]
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      "@nx": nx
    },
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          "allow": [],
          "depConstraints": [
            { "sourceTag": "scope:frontend", "onlyDependOnLibsWithTags": ["scope:frontend", "scope:contracts"] },
            { "sourceTag": "scope:backend", "onlyDependOnLibsWithTags": ["scope:backend", "scope:contracts"] },
            { "sourceTag": "scope:contracts", "onlyDependOnLibsWithTags": ["scope:contracts"] }
          ]
        }
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-extraneous-class": "off"
    }
  },
  {
    files: ["apps/web/**/*.ts", "libs/frontend/**/*.ts"],
    extends: [...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/component-class-suffix": ["error", { "suffixes": ["Component", "Page"] }],
      "@angular-eslint/directive-class-suffix": "error"
    }
  },
  {
    files: ["**/*.html"],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility]
  },
  prettier
);
