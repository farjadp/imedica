// The integration suite wipes this database between files, so it only ever
// runs against one whose name ends in _test.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://imedica:imedica_dev@127.0.0.1:54329/imedica_test";

export function assertTestDatabase(url: string) {
  const name = new URL(url).pathname.replace(/^\//, "");
  if (!name.endsWith("_test")) {
    throw new Error(`Refusing to run integration tests against "${name}": the database name must end in _test.`);
  }
}
