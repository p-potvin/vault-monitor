import { describe, expect, it } from "vitest";
import { I18N } from "../i18n";

describe("Personal Stats translations & calculations", () => {
  it("defines consistent pause category and hotspot zone labels across English and French", () => {
    const en = I18N.en.input;
    const qc = I18N.qc.input;

    expect(en.totalPauses).toBe("Total Pauses");
    expect(qc.totalPauses).toBe("Total des pauses");

    expect(en.shortBreak).toBe("Short Break");
    expect(qc.shortBreak).toBe("Pause courte");

    expect(en.longBreak).toBe("Long Break");
    expect(qc.longBreak).toBe("Pause longue");

    expect(en.hotspotViewMap).toBe("Screen Map");
    expect(qc.hotspotViewMap).toBe("Plan d ecran");

    expect(en.hotspotViewList).toBe("Top Zones");
    expect(qc.hotspotViewList).toBe("Zones cles");

    expect(en.hotspotStartTaskbar).toBe("Start & Pinned Apps");
    expect(qc.hotspotStartTaskbar).toBe("Demarrer & Apps epinglees");
  });

  it("calculates total inactivity gaps including micro-pauses and rest blocks", () => {
    const totals = {
      micro_pauses: 1184,
      rest_blocks: 108,
      pause_blocks: 89,
      healthy_pause_blocks: 11,
      time_off_blocks: 8,
    };

    const totalPauses = (totals.micro_pauses || 0) + (totals.rest_blocks || 0);
    expect(totalPauses).toBe(1292);

    const splitTotal = totals.pause_blocks + totals.healthy_pause_blocks + totals.time_off_blocks;
    expect(splitTotal).toBe(totals.rest_blocks);
  });
});
