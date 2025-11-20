import * as Handlebars from "handlebars";
import type { ValidateTemplate } from "./types";

/**
 * Result type for a compiled typed prompt
 */
interface TypedPromptResult<Input> {
  compile: (data: Input) => string;
}

/**
 * Creates a type-safe prompt template that validates variable access at compile time
 *
 * @example
 * ```typescript
 * const prompt = TypedPrompt<{name: string}>()('Hi, my name is {{name}}');
 * const result = prompt.compile({name: "Harry"}); // "Hi, my name is Harry"
 *
 * // This would cause a TypeScript error:
 * const badPrompt = TypedPrompt<{name: string}>()('Hi, my age is {{age}}'); // Error: Variable "age" does not exist
 * ```
 */
export function TypedPrompt<Input>() {
  return <const Template extends string>(
    template: ValidateTemplate<Input, Template> extends true
      ? Template
      : ValidateTemplate<Input, Template>
  ): TypedPromptResult<Input> => {
    const compiledTemplate = Handlebars.compile(template, { noEscape: true });

    const result: TypedPromptResult<Input> = {
      compile: (data: Input) => compiledTemplate(data),
    };

    return result;
  };
}

// Re-export types
export type { ValidateTemplate } from "./types";
