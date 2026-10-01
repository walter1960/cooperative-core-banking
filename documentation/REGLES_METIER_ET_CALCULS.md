# Manuel de Référence des Règles Métier et Calculs Financiers
**Système Core Banking Coopératif (COOPECTAT - ASECNA TOGO)**
*Conformité Réglementaire BCEAO / UMOA (Loi Portant Réglementation des SFD) & Acte Uniforme OHADA*

---

## 1. Grille Officielle des Prêts (Taux, Durées et Méthodes)

Le système applique une politique de crédit segmentée selon la maturité de l'engagement :

| Segment | Plage de Durée | Taux Nominal Annuel | Méthode Actuarielle | Plafond Maximum | Périodicité |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Court Terme** | **0 à 12 mois** | **5,00 %** | **Linéaire Constant (Flat)** | 15 000 000 F CFA | Mensuelle (Prélèvement) |
| **Moyen Terme** | **13 à 36 mois** | **10,00 %** | **Linéaire Constant (Flat)** | 15 000 000 F CFA | Mensuelle (Prélèvement) |
| **Long Terme** | **37 à 60 mois** | **9,00 %** | **Dégressif (sur CRD)** | 15 000 000 F CFA | Mensuelle (Prélèvement) |

---

## 2. Démonstration des Méthodes de Calcul : Linéaire vs Dégressif

```
                                      ┌────────────────────────────────────────────────────────┐
                                      │           MODALITÉS DE CALCUL DES ÉCHÉANCES            │
                                      └──────────────────────────┬─────────────────────────────┘
                                                                 │
                                 ┌───────────────────────────────┴───────────────────────────────┐
                                 ▼                                                               ▼
            MODALITÉ LINÉAIRE (Flat Rate)                                       MODALITÉ DÉGRESSIVE (CRD)
           ───────────────────────────────                                     ───────────────────────────
            • Appliquée sur Court & Moyen Terme                                 • Appliquée sur Long Terme (37 à 60m)
            • Intérêt calculé sur le capital initial                            • Intérêt recalculé chaque mois sur le CRD
            • Mensualité constante et prévisible                                • Conforme au Taux d'Usure BCEAO (TEG <= 24%)
            • Couvre les coûts fixes d'instruction                              • Annuité actuarielle amortissante
```

### A. La Méthode Linéaire (Court Terme 5% et Moyen Terme 10%)

#### 1. Formule Mathématique
L'intérêt total $I_{\text{total}}$ est calculé une seule fois sur le capital initial $C_0$ sur toute la durée du crédit ($n$ mois) :

$$I_{\text{total}} = C_0 \times \frac{t}{100} \times \frac{n}{12}$$

Chaque mois, la mensualité $M$ prélevée sur le bulletin de paie est composée d'une part égale de capital et d'une part égale d'intérêts :

$$M = \frac{C_0}{n} + \frac{I_{\text{total}}}{n} = \frac{C_0}{n} + \frac{C_0 \times (t/100)}{12}$$

Le montant total à rembourser est :

$$R_{\text{total}} = C_0 + I_{\text{total}} = n \times M$$

#### 2. Exemple Chiffré Pratique
- **Capital emprunté ($C_0$)** : 1 200 000 F CFA
- **Durée ($n$)** : 12 mois (Court terme)
- **Taux annuel ($t$)** : 5 %

$$\text{Part mensuelle de capital} = \frac{1\,200\,000}{12} = 100\,000\text{ F CFA}$$
$$\text{Part mensuelle d'intérêts} = \frac{1\,200\,000 \times 0{,}05}{12} = \frac{60\,000}{12} = 5\,000\text{ F CFA}$$
$$\text{Mensualité constante } M = 100\,000 + 5\,000 = 105\,000\text{ F CFA}$$
$$\text{Total remboursé} = 12 \times 105\,000 = 1\,260\,000\text{ F CFA (dont 60 000 F d'intérêts)}$$

#### 3. Rationale Économique et Mutualiste
1. **Couverture des coûts fixes** : L'analyse d'une demande, la prise de garantie et l'instruction comptable génèrent des coûts fixes quel que soit le montant. Le taux linéaire permet à la coopérative d'assurer l'équilibre d'exploitation sans prélever de commissions de dossier exorbitantes.
2. **Prévisibilité du Prélèvement** : La retenue mensuelle sur salaire reste strictement identique du premier au dernier mois, facilitant le travail de la paie et la gestion budgétaire du ménage.

---

### B. La Méthode Dégressive sur Capital Restant Dû (Long Terme 9%)

#### 1. Formule Mathématique Actuarielle
Dans le calcul dégressif à annuités constantes, le taux périodique mensuel est :

$$i = \frac{t}{100 \times 12} = \frac{0{,}09}{12} = 0{,}0075 \quad (0{,}75\%\text{ par mois})$$

La mensualité constante $M$ est donnée par la formule actuarielle :

$$M = C_0 \times \frac{i}{1 - (1 + i)^{-n}}$$

À chaque période mensuelle $k$ (de 1 à $n$) :
1. **Intérêt du mois $k$** :
   $$I_k = \text{CRD}_{k-1} \times i$$
2. **Amortissement du capital (Principal)** :
   $$P_k = M - I_k$$
3. **Nouveau Capital Restant Dû** :
   $$\text{CRD}_k = \text{CRD}_{k-1} - P_k$$

#### 2. Exemple Chiffré Pratique
- **Capital emprunté ($C_0$)** : 6 000 000 F CFA
- **Durée ($n$)** : 48 mois (Long terme)
- **Taux annuel ($t$)** : 9 % ($i = 0{,}0075$)

$$M = 6\,000\,000 \times \frac{0{,}0075}{1 - (1{,}0075)^{-48}} \approx 149\,300\text{ F CFA / mois}$$

**Décomposition des premières et dernières échéances :**

| Mois ($k$) | Capital Début ($\text{CRD}_{k-1}$) | Intérêt ($I_k = \text{CRD} \times 0{,}75\%$) | Principal ($P_k = M - I_k$) | Mensualité ($M$) | Capital Fin ($\text{CRD}_k$) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **Mois 1** | 6 000 000 F | 45 000 F | 104 300 F | 149 300 F | 5 895 700 F |
| **Mois 2** | 5 895 700 F | 44 218 F | 105 082 F | 149 300 F | 5 790 618 F |
| **Mois 12** | 4 701 445 F | 35 261 F | 114 039 F | 149 300 F | 4 587 406 F |
| **Mois 24** | 3 325 820 F | 24 944 F | 124 356 F | 149 300 F | 3 201 464 F |
| **Mois 36** | 1 766 540 F | 13 249 F | 136 051 F | 149 300 F | 1 630 489 F |
| **Mois 48** | 148 189 F | 1 111 F | 148 189 F | 149 300 F | **0 F** |

#### 3. Rationale Économique et Réglementaire
1. **Respect strict du Taux d'Usure BCEAO** : Un prêt de 6 millions sur 5 ans calculé en linéaire générerait un TEG supérieur à 18-22%, risquant de frôler le seuil d'usure bancaire de l'UMOA. Le dégressif garantit un TEG légalement incontestable à 9%.
2. **Justice financière pour l'emprunteur** : L'adhérent ne paie des intérêts que sur l'argent qu'il détient encore. Au mois 36, il ne paie des intérêts que sur 1,7 million restant, et non plus sur les 6 millions de départ.
3. **Remboursement par anticipation équitable** : Si le coopérateur liquide son crédit avant l'échéance (par exemple avec une prime de fin d'année ou un rappel de salaire), la dette est soldée par le simple versement du CRD au jour J. La totalité des intérêts futurs est purement et simplement annulée.

---

## 3. Règles et Calcul du Retrait Maximum

Le montant maximum qu'un sociétaire est autorisé à retirer de son compte obéit à deux règles strictes en fonction de ses engagements :

```
                               ┌────────────────────────────────────────────────────────┐
                               │           RÈGLES DE RETRAIT MAXIMUM EN ÉPARGNE         │
                               └──────────────────────────┬─────────────────────────────┘
                                                          │
                         ┌────────────────────────────────┴────────────────────────────────┐
                         ▼                                                                 ▼
           ENGAGEMENT COURT & MOYEN TERME                                      ENGAGEMENT LONG TERME ACTIF
          ────────────────────────────────                                    ─────────────────────────────
           • Aucun crédit long terme en cours                                  • Crédit 37 à 60 mois en cours
           • Retrait basé DIRECTEMENT sur :                                    • Formule prudentielle de garantie :
             Solde Disponible = Solde - 50 000 F                                 Retrait Max = Épargne - Garantie - CRD
```

### Formule Long Terme Officielle :

$$\text{Retrait Maximum} = \max\Big(0,\; \text{Épargne Actuelle} - \text{Épargne de Garantie} - \text{Crédit Long Terme en cours}\Big)$$

- **Épargne Actuelle** : Solde total comptabilisé sur le livret d'épargne sociétaire.
- **Épargne de Garantie** : Seuil prudentiel minimal obligatoire conservé en compte (minimum statutaire de 50 000 F CFA pour maintien de la qualité de sociétaire actif).
- **Crédit Long Terme en cours** : Montant du Capital Restant Dû (CRD) sur les crédits de 37 à 60 mois dont le sociétaire est débiteur principal.

---

## 4. Règle de Quotité Cessible & Capacité d'Endettement (DSTI)

Le système vérifie en temps réel le respect de la règle d'ordre public relative à la quotité cessible sur salaire :

$$\text{Quotité Cessible Légale} = \frac{\text{Salaire Net Mensuel}}{3} \quad (33{,}33\%)$$

$$\text{Taux d'Endettement (DSTI)} = \frac{\text{Mensualité du Prêt}}{\text{Revenu Net Mensuel}} \times 100$$

- Si $\text{DSTI} \le 33{,}33\%$ : **Dossier Conforme** (Validation directe en commission).
- Si $33{,}33\% < \text{DSTI} \le 40{,}00\%$ : **Alerte Risque** (Caution solidaire d'un second collègue ASECNA ou nantissement supplémentaire requis).
- Si $\text{DSTI} > 40{,}00\%$ : **Dépassement de Capacité** (Blocage prudentiel de la souscription).

---

## 5. Rémunération de l'Épargne et Parts Sociales

### A. Intérêts Créditeurs sur Livret Épargne
- Taux servi aux sociétaires : **3,50 % net par an**.
- Méthode de calcul : Règle de la quinzaine bancaire standard (valeur au 1er ou au 16 du mois).
- Franchise d'impôt : Conforme aux dispositions de l'UMOA pour l'épargne populaire mutualiste.

### B. Parts Sociales Souscrites
- Valeur nominale d'une part : **10 000 F CFA**.
- Souscription minimale à l'adhésion : **5 parts (50 000 F CFA)**.
- Rémunération : Dividende coopératif voté lors de l'Assemblée Générale annuelle en fonction des excédents nets d'exploitation (limité statutairement au taux d'escompte de la BCEAO).

### C. Tontine Cyclique à 31 Jours
- Cotisation journalière fixe selon le palier souscrit (1 000 F, 2 000 F, 5 000 F ou 10 000 F/jour).
- Durée du cycle : 31 jours calendaires.
- Rémunération de gestion de la coopérative : 1 journée de mise prélevée sur le cycle (rémunération du caissier collecteur et frais de garde sécurisée).
