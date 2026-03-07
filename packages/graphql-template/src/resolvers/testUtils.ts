import {
  makeMakeRunInputMutation,
  makeMakeRunObjectField,
  makeMakeRunObjectFields,
} from "joist-graphql-resolver-utils/tests";
import { run } from "joist-orm/tests";

export const makeRunObjectField = makeMakeRunObjectField(run);
export const makeRunObjectFields = makeMakeRunObjectFields(run);
export const makeRunInputMutation = makeMakeRunInputMutation(run);
