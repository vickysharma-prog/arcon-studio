import { createGetDb } from "@agent-native/core/db";
import * as schema from "./schema.js";

import { registerIdentityColumns } from "@agent-native/core/org";
import { provideDb } from "../../engine/db/index.ts";

export const getDb = createGetDb(schema);
provideDb(getDb);

registerIdentityColumns([
  {
    table: "studio_clients",
    column: "contact_email",
    emailChange: "retain",
    offboard: "retain",
    reason: "The architect's client's own address, not a member of the workspace.",
  },
]);
export { schema };
