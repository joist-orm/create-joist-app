import { newEm } from "../setupTests";
import { newAuthor, newBook } from "./factories";

describe("Author", () => {
  it("can create an author", async () => {
    const em = newEm();
    newAuthor(em, { firstName: "John", lastName: "Doe" });
    await em.flush();
  });

  it("can have books", async () => {
    const em = newEm();
    const author = newAuthor(em, { firstName: "Test", lastName: "Author" });
    newBook(em, { title: "Test Book", author });
    await em.flush();
  });
});
