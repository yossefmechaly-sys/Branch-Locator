import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import { BranchViewTracker } from "@/components/branches/BranchViewTracker";
import * as trackModule from "@/lib/analytics/track";

describe("BranchViewTracker (Phase 8, §36)", () => {
  // `vi.spyOn` sur un module déjà espionné réutilise le même mock : sans ce
  // nettoyage, l'historique d'appels d'un test précédent fausserait le
  // décompte `toHaveBeenCalledTimes` du test suivant.
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("émet branch_view une fois au montage, avec seulement le branchId — aucune donnée personnelle", () => {
    const trackSpy = vi.spyOn(trackModule, "track");
    render(<BranchViewTracker branchId="jerusalem-ramot" />);

    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy).toHaveBeenCalledWith({ name: "branch_view", branchId: "jerusalem-ramot" });
  });

  it("ne re-déclenche pas l'événement si le composant se re-rend sans changer de branchId", () => {
    const trackSpy = vi.spyOn(trackModule, "track");
    const { rerender } = render(<BranchViewTracker branchId="jerusalem-ramot" />);
    rerender(<BranchViewTracker branchId="jerusalem-ramot" />);

    expect(trackSpy).toHaveBeenCalledTimes(1);
  });

  it("ne rend aucun élément visuel", () => {
    const { container } = render(<BranchViewTracker branchId="jerusalem-ramot" />);
    expect(container.innerHTML).toBe("");
  });
});
