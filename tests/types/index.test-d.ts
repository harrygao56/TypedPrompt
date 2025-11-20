import { expectType } from "tsd";
import { TypedPrompt } from "../../src/index";

// Test 1: Basic variable access should work
interface BasicInput {
  name: string;
}
const basicPrompt = TypedPrompt<BasicInput>()("Hello, {{name}}!");
expectType<{ compile: (data: BasicInput) => string }>(basicPrompt);

// Test 2: Using undefined variable should error
interface LimitedInput {
  name: string;
}
// @ts-expect-error Variable "age" does not exist
const errorPrompt = TypedPrompt<LimitedInput>()("My age is {{age}}");

// Test 3: Nested property access should work
interface NestedInput {
  user: {
    name: string;
    profile: {
      age: number;
    };
  };
}
const nestedPrompt = TypedPrompt<NestedInput>()(
  `{{user.name}} is {{user.profile.age}} years old`
);
expectType<{ compile: (data: NestedInput) => string }>(nestedPrompt);

// Test 4: Invalid nested property should error
interface NestedInput2 {
  user: {
    name: string;
  };
}
// @ts-expect-error Variable "user.email" does not exist
const nestedError = TypedPrompt<NestedInput2>()("Email: {{user.email}}");

// Test 5: Conditionals with existing properties should work
interface ConditionalInput {
  showGreeting: boolean;
  userName: string;
}
const conditionalPrompt = TypedPrompt<ConditionalInput>()(
  "{{#if showGreeting}}Hello, {{userName}}!{{/if}}"
);
expectType<{ compile: (data: ConditionalInput) => string }>(conditionalPrompt);

// Test 6: Each loops - for v1, we only validate the array property exists
interface LoopInput {
  items: Array<{ name: string; value: number }>;
}
const loopPrompt = TypedPrompt<LoopInput>()(
  "{{#each items}}Item here{{/each}}"
);
expectType<{ compile: (data: LoopInput) => string }>(loopPrompt);

// Test 7: Complex template with multiple features (without context-switching in each)
interface ComplexInput {
  user: {
    firstName: string;
    lastName: string;
    isAdmin: boolean;
  };
  items: Array<{ id: number; title: string }>;
  showDetails: boolean;
}
const complexTemplate =
  "{{user.firstName}} {{user.lastName}}{{#if user.isAdmin}} (Admin){{/if}}\n{{#if showDetails}}Items count: {{items.length}}{{/if}}";
const complexPrompt = TypedPrompt<ComplexInput>()(complexTemplate);
expectType<{ compile: (data: ComplexInput) => string }>(complexPrompt);

// Test 8: Empty template should work
const emptyPrompt = TypedPrompt<{}>()("Hello world!");
expectType<{ compile: (data: {}) => string }>(emptyPrompt);

// Test 9: Template with no variables should work with any input
interface AnyInput {
  foo: string;
  bar: number;
}
const noVarsPrompt = TypedPrompt<AnyInput>()("Static text only");
expectType<{ compile: (data: AnyInput) => string }>(noVarsPrompt);
