/**
 * Gets the type at a given path in T
 */
type GetTypeAtPath<
  T,
  Path extends string
> = Path extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? GetTypeAtPath<T[Key], Rest>
    : never
  : Path extends keyof T
  ? T[Path]
  : never;

/**
 * Extracts a single variable from a Handlebars expression
 * Handles cases like:
 * - {{name}} -> {type: "var", path: "name"}
 * - {{#if user.name}} -> {type: "if", path: "user.name"}
 * - {{#each items}} -> {type: "each", path: "items"}
 * - {{/if}} -> {type: "close"}
 */
type ExtractSingleVariable<T extends string> =
  T extends `{{#each ${infer Variable}}}`
    ? { type: "each"; path: Variable }
    : T extends `{{#if ${infer Variable}}}`
    ? { type: "if"; path: Variable }
    : T extends `{{/${string}}}`
    ? { type: "close" }
    : T extends `{{${infer Variable}}}`
    ? { type: "var"; path: Variable }
    : never;

/**
 * Extracts all variable expressions from a template string
 */
type ExtractAllExpressions<T extends string> =
  T extends `${string}{{${infer Expression}}}${infer After}`
    ? ExtractSingleVariable<`{{${Expression}}}`> | ExtractAllExpressions<After>
    : never;

/**
 * Processes the template to validate variables within their context
 * This recursively processes the template and tracks context changes (e.g., inside #each blocks)
 */
type ProcessTemplate<
  Input,
  Template extends string,
  Context = Input
> = Template extends `${string}{{#each ${infer ArrayPath}}}${infer Body}{{/each}}${infer After}`
  ? PathExists<Input, ArrayPath> extends false
    ? ArrayPath
    : GetTypeAtPath<Input, ArrayPath> extends (infer ElementType)[]
    ? ProcessTemplateBody<Input, Body, ElementType> extends infer BodyErrors
      ? BodyErrors extends never
        ? ProcessTemplate<Input, After, Context>
        : BodyErrors
      : never
    : ArrayPath
  : Template extends `${string}{{#if ${infer CondPath}}}${infer Body}{{/if}}${infer After}`
  ? PathExists<Input, CondPath> extends false
    ? CondPath
    : ProcessTemplate<Input, Body, Context> extends infer BodyErrors
    ? BodyErrors extends never
      ? ProcessTemplate<Input, After, Context>
      : BodyErrors
    : never
  : Template extends `${string}{{${infer Variable}}}${infer After}`
  ? PathExists<Context, Variable> extends false
    ? Variable
    : ProcessTemplate<Input, After, Context>
  : never;

/**
 * Process template body with a specific context
 */
type ProcessTemplateBody<
  Input,
  Template extends string,
  Context
> = Template extends `${string}{{${infer Variable}}}${infer After}`
  ? Variable extends `#${string}` | `/${string}`
    ? ProcessTemplateBody<Input, After, Context>
    : PathExists<Context, Variable> extends false
    ? Variable
    : ProcessTemplateBody<Input, After, Context>
  : never;

/**
 * Extracts all variables from a template (for backward compatibility)
 */
type ExtractVariables<T extends string> =
  ExtractAllExpressions<T> extends infer Expr
    ? Expr extends { path: infer P }
      ? P extends string
        ? P
        : never
      : never
    : never;

/**
 * Checks if a dot-notation path exists in type T
 * Examples:
 * - PathExists<{user: {name: string}}, "user.name"> = true
 * - PathExists<{user: {name: string}}, "user.email"> = false
 */
type PathExists<
  T,
  Path extends string
> = Path extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? T[Key] extends object
      ? PathExists<T[Key], Rest>
      : false
    : false
  : Path extends keyof T
  ? true
  : false;

/**
 * Validates all variables in a template against the input type
 * Returns true if valid, or an error message listing the first invalid variable
 */
type ValidateTemplate<Input, Template extends string> = ProcessTemplate<
  Input,
  Template
> extends never
  ? true
  : ProcessTemplate<Input, Template> extends infer Invalid
  ? Invalid extends string
    ? `Error: Variable "${Invalid}" does not exist in input type`
    : true
  : true;

export type { ExtractVariables, PathExists, ValidateTemplate };
