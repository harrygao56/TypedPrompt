import { describe, it, expect } from "vitest";
import { TypedPrompt } from "../src/index";

describe("TypedPrompt runtime behavior", () => {
  it("should compile simple variable templates", () => {
    interface Input {
      name: string;
    }

    const prompt = TypedPrompt<Input>()("Hello, {{name}}!");
    const result = prompt.compile({ name: "Harry" });

    expect(result).toBe("Hello, Harry!");
  });

  it("should handle nested property access", () => {
    interface Input {
      user: {
        name: string;
        age: number;
      };
    }

    const prompt = TypedPrompt<Input>()(
      "{{user.name}} is {{user.age}} years old"
    );
    const result = prompt.compile({
      user: { name: "Alice", age: 30 },
    });

    expect(result).toBe("Alice is 30 years old");
  });

  it("should work with conditional blocks", () => {
    interface Input {
      showGreeting: boolean;
      name: string;
    }

    const prompt = TypedPrompt<Input>()(
      "{{#if showGreeting}}Hello, {{name}}!{{/if}}"
    );

    const resultWithGreeting = prompt.compile({
      showGreeting: true,
      name: "Bob",
    });
    expect(resultWithGreeting).toBe("Hello, Bob!");

    const resultWithoutGreeting = prompt.compile({
      showGreeting: false,
      name: "Bob",
    });
    expect(resultWithoutGreeting).toBe("");
  });

  it("should work with each loops", () => {
    interface Input {
      items: Array<{ name: string; price: number }>;
    }

    const prompt = TypedPrompt<Input>()(
      "{{#each items}}{{name}}: ${{price}}\n{{/each}}"
    );

    const result = prompt.compile({
      items: [
        { name: "Apple", price: 1.5 },
        { name: "Banana", price: 0.75 },
      ],
    });

    expect(result).toBe("Apple: $1.5\nBanana: $0.75\n");
  });

  it("should handle complex nested templates", () => {
    interface Input {
      user: {
        name: string;
        isAdmin: boolean;
        permissions?: string[];
      };
      company: string;
    }

    const prompt = TypedPrompt<Input>()(
      "{{user.name}} from {{company}}{{#if user.isAdmin}} (Admin){{/if}}"
    );

    const result = prompt.compile({
      user: { name: "Charlie", isAdmin: true },
      company: "Acme Corp",
    });

    expect(result).toBe("Charlie from Acme Corp (Admin)");
  });
});
