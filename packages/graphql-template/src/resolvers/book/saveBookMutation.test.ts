import { newAuthor } from "src/entities/index";
import { saveBook } from "src/resolvers/book/saveBookMutation";
import { makeRunInputMutation } from "src/resolvers/testUtils";

describe("saveBook", () => {
  it.withCtx("can create", async (ctx) => {
    const a = newAuthor(ctx.em);
    const result = await runSave(ctx, () => ({
      title: "Test Book",
      authorId: a.id,
    }));
    expect(result).toBeDefined();
  });
});

const runSave = makeRunInputMutation(saveBook);
