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
 * Stack helpers for context tracking
 */
type StackTop<S extends any[]> = S extends [infer H, ...any[]] ? H : never;

/**
 * Pops the stack by one level but never below the base (length 1)
 */
type StackPop<S extends any[]> = S extends [any, ...infer R]
  ? R extends []
    ? S
    : R
  : S;

/**
 * Processes the template to validate variables within their context by scanning tokens
 * Tracks nested contexts (e.g., inside #each blocks) using a stack to support infinite nesting
 */
type ProcessTemplate<
  Input,
  Template extends string,
  CtxStack extends any[] = [Input]
> = Template extends `${string}{{${infer Tag}}}${infer Rest}`
  ? Tag extends `#each ${infer ArrayPath}`
    ? PathExists<StackTop<CtxStack>, ArrayPath> extends true
      ? GetTypeAtPath<
          StackTop<CtxStack>,
          ArrayPath
        > extends (infer ElementType)[]
        ? ProcessTemplate<Input, Rest, [ElementType, ...CtxStack]>
        : ArrayPath
      : ArrayPath
    : Tag extends "/each"
    ? ProcessTemplate<Input, Rest, StackPop<CtxStack>>
    : Tag extends `#if ${infer CondPath}`
    ? PathExists<StackTop<CtxStack>, CondPath> extends true
      ? ProcessTemplate<Input, Rest, CtxStack>
      : CondPath
    : Tag extends "/if"
    ? ProcessTemplate<Input, Rest, CtxStack>
    : Tag extends "this"
    ? ProcessTemplate<Input, Rest, CtxStack>
    : PathExists<StackTop<CtxStack>, Tag> extends true
    ? ProcessTemplate<Input, Rest, CtxStack>
    : Tag
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
