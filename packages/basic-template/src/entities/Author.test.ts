import { getEm } from "../setupTests";
import { newAuthor, newBook } from "./factories";

describe("Author", () => {
  it("can create an author", async () => {
    const em = getEm();
    newAuthor(em, { firstName: "John", lastName: "Doe" });
    await em.flush();
  });

  it("can have books", async () => {
    const em = getEm();
    const author = newAuthor(em, { firstName: "Test", lastName: "Author" });
    newBook(em, { title: "Test Book", author });
    await em.flush();
  });
});
