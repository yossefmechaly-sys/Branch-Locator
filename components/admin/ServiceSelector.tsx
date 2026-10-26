"use client";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

/** Sélecteur de services d'un magasin (Phase 9, §7) — réutilise la liste des
 * `Service` existants (`services/admin/service-admin.service.ts#listServiceOptions()`),
 * jamais un second référentiel. Les services inactifs restent affichés
 * (grisés) s'ils sont déjà cochés pour CE magasin — un service désactivé
 * après coup ne doit pas disparaître silencieusement de la fiche existante. */
export function ServiceSelector({
  options,
  selectedIds,
  onChange,
}: {
  options: { id: string; label: string; icon: string; isActive: boolean }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const { dictionary } = useAdminI18n();
  const tAdmin = dictionary.branches;

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((entry) => entry !== id) : [...selectedIds, id]);
  }

  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => {
        const isSelected = selectedIds.includes(option.id);
        if (!option.isActive && !isSelected) return null;
        return (
          <label key={option.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isSelected} onChange={() => toggle(option.id)} />
            {option.label}
            {!option.isActive && (
              <span className="text-xs text-muted-foreground">
                ({tAdmin.inactiveService})
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
