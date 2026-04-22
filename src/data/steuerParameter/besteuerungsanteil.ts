// Besteuerungsanteil der gesetzlichen Rente nach § 22 Nr. 1 S. 3 Buchst. a
// Doppelbuchst. aa EStG. Der Anteil hängt vom Jahr des Rentenbeginns ab
// und ist für die gesamte Rentenlaufzeit fix (Kohortenprinzip).
//
// Durch das Wachstumschancengesetz 2024 wurde der jährliche Anstieg ab 2023
// von 1,0 auf 0,5 Prozentpunkte halbiert. 100 % werden somit erst 2058
// erreicht (statt 2040).

export function besteuerungsanteil(rentenbeginnJahr: number): number {
  // Tabelle (Wert in Prozent):
  // bis 2005 = 50 %
  // 2006..2020: +2 pp/Jahr (52 → 80)  (tatsächlich 2005: 50, 2020: 80)
  // 2021..2022: +1 pp/Jahr (81, 82)
  // ab 2023: +0,5 pp/Jahr (82,5 %; 83 %; 83,5 %; …)
  if (rentenbeginnJahr <= 2005) return 50;
  if (rentenbeginnJahr >= 2058) return 100;

  if (rentenbeginnJahr <= 2020) {
    return 50 + (rentenbeginnJahr - 2005) * 2;
  }
  if (rentenbeginnJahr === 2021) return 81;
  if (rentenbeginnJahr === 2022) return 82;
  // 2023 → 82,5; 2024 → 83; 2025 → 83,5; …
  return 82 + (rentenbeginnJahr - 2022) * 0.5;
}
