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

// Test 10: {{this}} should work in loops over primitive arrays
interface PrimitiveArrayInput {
  tags: string[];
}
const thisPrompt = TypedPrompt<PrimitiveArrayInput>()(
  "{{#each tags}}{{this}} {{/each}}"
);
expectType<{ compile: (data: PrimitiveArrayInput) => string }>(thisPrompt);

// Test 11: {{this}} should work in nested loops
interface NestedLoopInput {
  names: { first: string; last: string; middleNames: string[] }[];
}
const nestedThisPrompt = TypedPrompt<NestedLoopInput>()(
  "{{#each names}}Hello, {{first}} {{last}} {{#each middleNames}}{{this}} {{/each}}!{{/each}}"
);
expectType<{ compile: (data: NestedLoopInput) => string }>(nestedThisPrompt);

// Test 12: {{this}} with number arrays
interface NumberArrayInput {
  scores: number[];
}
const numberThisPrompt = TypedPrompt<NumberArrayInput>()(
  "{{#each scores}}{{this}}, {{/each}}"
);
expectType<{ compile: (data: NumberArrayInput) => string }>(numberThisPrompt);

// Test 13: Complex template with {{this}} and property access in same loop
interface ComplexLoopInput {
  items: Array<{ name: string; tags: string[] }>;
}
const complexLoopPrompt = TypedPrompt<ComplexLoopInput>()(
  "{{#each items}}{{name}}: {{#each tags}}{{this}} {{/each}}\n{{/each}}"
);
expectType<{ compile: (data: ComplexLoopInput) => string }>(complexLoopPrompt);

// Test 14: Nested arrays with object elements should validate inner context
interface ResumeInput {
  candidates: {
    name: string;
    experiences: {
      company: string;
      title: string;
      description: string;
    }[];
  }[];
}
const resumePrompt = TypedPrompt<ResumeInput>()(
  "{{#each candidates}}{{name}}{{#each experiences}}{{company}} - {{title}} - {{description}}\n{{/each}}{{/each}}"
);
expectType<{ compile: (data: ResumeInput) => string }>(resumePrompt);

// Test 15: Invalid inner property inside nested each should error
const badResumePrompt = TypedPrompt<ResumeInput>()(
  // @ts-expect-error Variable "companyName" does not exist
  "{{#each candidates}}{{#each experiences}}{{companyName}}{{/each}}{{/each}}"
);

void badResumePrompt;
