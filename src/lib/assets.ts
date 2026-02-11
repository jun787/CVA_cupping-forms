export type AssetCheckResult = {
  ok: boolean;
  missing: string[];
};

export const checkAssets = async (paths: string[]): Promise<AssetCheckResult> => {
  const checks = await Promise.all(
    paths.map(async (path) => {
      try {
        const res = await fetch(path, { method: 'HEAD', cache: 'no-store' });
        return { path, ok: res.ok };
      } catch {
        return { path, ok: false };
      }
    })
  );
  const missing = checks.filter((c) => !c.ok).map((c) => c.path);
  return { ok: missing.length === 0, missing };
};
