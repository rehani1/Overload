import { loadStoredJson, removeStoredJson, saveStoredJson } from "@/lib/storage";

type LegacyMigration = {
  accountId: string;
  migratedAt: string;
};

export async function loadAccountScopedJson<TValue>(
  baseKey: string,
  accountId: string,
): Promise<TValue | null> {
  const scopedKey = getAccountScopedStorageKey(baseKey, accountId);
  const migrationKey = getLegacyMigrationKey(baseKey);
  const migration = await loadStoredJson<LegacyMigration>(migrationKey);

  if (migration?.accountId === accountId) {
    await removeStoredJson(scopedKey);
    await removeStoredJson(baseKey);
    await removeStoredJson(migrationKey);

    return null;
  }

  const scopedValue = await loadStoredJson<TValue>(scopedKey);

  if (scopedValue) {
    return scopedValue;
  }

  await removeStoredJson(baseKey);

  return null;
}

export async function removeAccountScopedJson(baseKey: string, accountId: string) {
  await removeStoredJson(getAccountScopedStorageKey(baseKey, accountId));
}

export async function saveAccountScopedJson<TValue>(
  baseKey: string,
  accountId: string,
  value: TValue,
) {
  await saveStoredJson<TValue>(getAccountScopedStorageKey(baseKey, accountId), value);
}

function getAccountScopedStorageKey(baseKey: string, accountId: string) {
  return `${baseKey}.user.${encodeURIComponent(accountId)}`;
}

function getLegacyMigrationKey(baseKey: string) {
  return `${baseKey}.legacyMigrated`;
}
